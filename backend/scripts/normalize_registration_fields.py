"""Safe normalization utility

This script finds opportunities that have legacy `registrationFields` and
proposes (or applies) a normalization into the corresponding event's
`registration_settings.profile_fields_config` map.

By default the script runs in dry-run mode and prints what would be changed.
Pass `--apply` to perform updates. Use `--event <event_id>` to target one
event or `--limit N` to cap the number of processed documents.
"""
import argparse
import asyncio
import json
import os
import sys
from datetime import datetime

from bson import ObjectId

# Ensure backend package root is importable when running the script directly
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from db import db, events_col, opportunities_col


def build_legacy_map(registration_fields):
    alias = {
        '1': 'full_name',
        '2': 'email',
        '3': 'phone',
        '4': 'college',
        '5': 'degree',
        '6': 'branch',
        '7': 'graduation_year',
        '8': 'cgpa',
        '9': 'resume_url',
        '10': 'linkedin_url',
        '11': 'github_url',
        '12': 'portfolio_url',
        '13': 'skills',
    }

    m = {}
    for f in registration_fields or []:
        if not isinstance(f, dict):
            continue
        key = f.get('id') or f.get('key') or f.get('name')
        if not key:
            continue
        key = alias.get(str(key).strip().lower(), str(key).strip().lower().replace(' ', '_'))
        required = f.get('required') in (True, 'true', 'True', 1) or f.get('isFixed') is True
        m[key] = 'REQUIRED' if required else 'OPTIONAL'
    return m


async def find_and_normalize(event_id=None, limit=None, apply=False):
    query = {"$and": [{"registrationFields": {"$exists": True}}, {"registrationFields": {"$ne": []}}]} 
    cursor = opportunities_col.find(query)
    count = 0
    changes = []

    async for opp in cursor:
        if limit and count >= limit:
            break
        count += 1

        event_link = opp.get('event_link_id') or opp.get('event_id')
        if not event_link:
            continue

        # If specific event filter provided, skip others
        if event_id and str(event_id) != str(event_link) and str(event_id) != str(opp.get('_id')):
            continue

        legacy_map = build_legacy_map(opp.get('registrationFields') or opp.get('registration_fields') or [])
        if not legacy_map:
            continue

        # Resolve event doc
        ev = None
        try:
            ev_obj = ObjectId(event_link)
            ev = await events_col.find_one({"_id": ev_obj})
        except Exception:
            ev = await events_col.find_one({"event_id": str(event_link)})

        if not ev:
            continue

        settings = ev.get('registration_settings') or {}
        profile_map = settings.get('profile_fields_config') or {}

        # Only update if missing or empty
        if profile_map and any(v for v in profile_map.values()):
            # Event already has a profile config; skip
            continue

        # Start with legacy_map and ensure keys are strings
        new_map = {k: v for k, v in legacy_map.items()}

        # Persist/print
        change = {
            'event_id': str(ev.get('_id') or ev.get('event_id')),
            'opportunity_id': str(opp.get('_id')),
            'before': profile_map,
            'after': new_map
        }
        changes.append(change)

        if apply:
            backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
            backup_file = os.path.join(backup_dir, f'event_backup_{change["event_id"]}_{ts}.json')
            with open(backup_file, 'w', encoding='utf-8') as bf:
                json.dump(ev, bf, default=str, indent=2)

            await events_col.update_one(
                {"_id": ev.get('_id')},
                {"$set": {"registration_settings.profile_fields_config": new_map}}
            )

    return changes


def main():
    parser = argparse.ArgumentParser(description='Normalize legacy registrationFields into events.registration_settings.profile_fields_config')
    parser.add_argument('--apply', action='store_true', help='Apply changes to DB (default: dry-run)')
    parser.add_argument('--event', type=str, help='Specific event_id or event_link_id to target')
    parser.add_argument('--limit', type=int, help='Limit processed opportunities')

    args = parser.parse_args()

    changes = asyncio.run(find_and_normalize(event_id=args.event, limit=args.limit, apply=args.apply))

    print(f"Found {len(changes)} events that would be normalized.")
    for c in changes:
        print('---')
        print(f"Event: {c['event_id']}  Opportunity: {c['opportunity_id']}")
        print('Before:')
        print(json.dumps(c['before'], indent=2, default=str))
        print('After:')
        print(json.dumps(c['after'], indent=2, default=str))

    if args.apply:
        print('Applied changes to database.')
    else:
        print('Dry-run complete. Re-run with --apply to persist changes.')


if __name__ == '__main__':
    main()
