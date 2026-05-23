"""Sync event logo/banner URLs into opportunities collection.

Run this script from the project root inside the virtualenv where the app runs.
It looks for events that have `logo_url` or `banner_url` and updates any
opportunities with matching `event_link_id` to set `logo_url`/`banner_url`.

Example:
    (& d:\studlyf\.venv\Scripts\Activate.ps1)
    python backend\scripts\sync_event_logos.py
"""
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db, events_col, opportunities_col
from bson import ObjectId


async def sync_logos():
    print("Connecting to DB...")
    await db.connect()
    try:
        cursor = events_col.find({})
        updated = 0
        async for ev in cursor:
            ev_id = str(ev.get("_id"))
            logo = ev.get("logo_url") or ev.get("logoUrl") or ev.get("image_url")
            banner = ev.get("banner_url") or ev.get("bannerUrl")
            if not logo and not banner:
                continue

            query = {"event_link_id": ev_id}
            opp = await opportunities_col.find_one(query)
            if not opp:
                # no-op: some events may not have mirrored opportunities
                continue

            update = {}
            if logo and (not opp.get("logo_url") or opp.get("logo_url") != logo):
                update["logo_url"] = logo
                update["logoUrl"] = logo
                update["image_url"] = opp.get("image_url") or logo
            if banner and (not opp.get("banner_url") or opp.get("banner_url") != banner):
                update["banner_url"] = banner
                update["bannerUrl"] = banner

            if update:
                await opportunities_col.update_many({"event_link_id": ev_id}, {"$set": update})
                updated += 1
                print(f"Updated opportunity for event {ev_id}: set {list(update.keys())}")

        print(f"Done. Updated {updated} opportunity documents.")
    finally:
        await db.disconnect()


if __name__ == '__main__':
    asyncio.run(sync_logos())
