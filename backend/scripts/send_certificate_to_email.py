import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

from db import db, event_certificates_col, email_queue_col, email_delivery_logs_col, participants_col, events_col
from services.email_service import get_certificate_issued_template, send_notification_email
from services.email_template_service import get_active_template, render_template


if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def normalize_organization_name(value: object) -> str:
    text = str(value or '').strip()
    if not text or text.lower() in ('unknown', 'none', 'null'):
        return 'Studlyf'
    return text


def build_certificate_email(cert, recipient_email: str):
    recipient_name = cert.get('participant_name') or cert.get('student_name') or cert.get('recipient_name') or recipient_email
    event_title = cert.get('event_title') or cert.get('event_name') or 'Your Event'
    organization_name = normalize_organization_name(cert.get('organization_name') or cert.get('organization'))
    backend_base_url = os.getenv('RENDER_EXTERNAL_URL') or os.getenv('BACKEND_URL') or os.getenv('FRONTEND_URL', 'http://localhost:5173')
    verification_url = cert.get('verification_url') or f"{backend_base_url}/verify-certificate/{cert.get('certificate_id')}"

    issued_value = cert.get('issued_at') or cert.get('issued_date') or datetime.now(timezone.utc)
    if hasattr(issued_value, 'strftime'):
        issued_date = issued_value.strftime('%d %b %Y')
    else:
        issued_date = str(issued_value)

    subject = f"Your Certificate for {event_title} is Ready!"
    body = get_certificate_issued_template(
        participant_name=recipient_name,
        event_title=event_title,
        organization_name=organization_name,
        certificate_id=cert.get('certificate_id', ''),
        issued_date=issued_date,
        certificate_download_link=f"{backend_base_url}/download-certificate/{cert.get('certificate_id')}",
        verification_url=verification_url,
    )
    return subject, body


async def main(certificate_id, recipient_email=None, now=False, preview=False):
    await db.connect()
    backend_base_url = os.getenv('RENDER_EXTERNAL_URL') or os.getenv('BACKEND_URL') or os.getenv('FRONTEND_URL', 'http://localhost:5173')

    cert = await event_certificates_col.find_one({'certificate_id': certificate_id})
    if not cert:
        print('Certificate not found:', certificate_id)
        return

    event_id = cert.get('event_id')
    user_id = cert.get('user_id')

    event_doc = None
    if event_id:
        event_doc = await events_col.find_one({'_id': event_id})
        if not event_doc:
            try:
                from bson import ObjectId
                event_doc = await events_col.find_one({'_id': ObjectId(event_id)})
            except Exception:
                event_doc = None
    if event_doc:
        cert['event_title'] = cert.get('event_title') or event_doc.get('title') or event_doc.get('name')
        cert['organization_name'] = normalize_organization_name(
            cert.get('organization_name')
            or event_doc.get('organization_name')
            or event_doc.get('institution_name')
            or event_doc.get('organization')
        )

    template = None
    if event_doc:
        institution_id = str(event_doc.get('institution_id') or '')
        try:
            template = await get_active_template(str(event_id), institution_id, 'certificate_issued')
        except Exception:
            template = None

    # resolve recipient
    recipient = recipient_email
    if not recipient:
        # try participants lookup
        p = await participants_col.find_one({'user_id': user_id, 'event_id': event_id})
        if p:
            recipient = p.get('email')
    if not recipient:
        recipient = cert.get('email')

    if not recipient:
        print('No recipient email provided or found for certificate.')
        return

    subject, body = build_certificate_email(cert, recipient)
    if template:
        template_context = {
            'participant_name': cert.get('participant_name') or cert.get('student_name') or cert.get('recipient_name') or recipient,
            'event_title': cert.get('event_title') or cert.get('event_name') or 'Your Event',
            'organization_name': normalize_organization_name(cert.get('organization_name') or cert.get('organization')),
            'certificate_id': cert.get('certificate_id', ''),
            'issued_date': (cert.get('issued_at') or cert.get('issued_date') or datetime.now(timezone.utc)).strftime('%d %b %Y') if hasattr((cert.get('issued_at') or cert.get('issued_date') or datetime.now(timezone.utc)), 'strftime') else str(cert.get('issued_at') or cert.get('issued_date') or datetime.now(timezone.utc)),
            'certificate_download_link': f"{backend_base_url}/download-certificate/{cert.get('certificate_id')}",
            'verification_url': cert.get('verification_url') or f"{backend_base_url}/verify-certificate/{cert.get('certificate_id')}",
            'frontend_url': os.getenv('FRONTEND_URL', 'http://localhost:5173'),
            'support_email': os.getenv('VITE_SUPPORT_EMAIL', os.getenv('SUPPORT_EMAIL', 'support@studlyf.com')),
        }
        subject, body = render_template(template, template_context)

    if preview:
        print('SUBJECT:', subject)
        print('BODY_START')
        print(body)
        print('BODY_END')
        return

    # update certificate record with email if provided
    await event_certificates_col.update_one({'_id': cert['_id']}, {'$set': {'email': recipient}})

    # If now, send immediately using SMTP config from env, else enqueue
    if now:
        try:
            success = await send_notification_email(recipient, subject, body)
            await email_delivery_logs_col.insert_one({'recipient': recipient, 'status': 'sent' if success else 'failed', 'certificate_id': certificate_id, 'metadata': {'event_id': event_id}, 'created_at': datetime.now(timezone.utc)})
            print('Email sent to', recipient if success else f'Send failed for {recipient}')
        except Exception as e:
            await email_delivery_logs_col.insert_one({'recipient': recipient, 'status': 'failed', 'error': str(e), 'certificate_id': certificate_id, 'metadata': {'event_id': event_id}, 'created_at': datetime.now(timezone.utc)})
            print('Send failed:', str(e))
    else:
        # enqueue
        qdoc = {'recipient': recipient, 'subject': subject, 'body': body, 'metadata': {'event_id': event_id, 'certificate_id': certificate_id, 'type': 'certificate_issue'}, 'status': 'queued', 'created_at': datetime.now(timezone.utc), 'attempts': 0}
        res = await email_queue_col.insert_one(qdoc)
        print('Enqueued email id:', res.inserted_id, 'recipient:', recipient)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--certificate-id', required=True)
    parser.add_argument('--email', required=False)
    parser.add_argument('--now', action='store_true', help='Send immediately using SMTP')
    parser.add_argument('--preview', action='store_true', help='Print the rendered certificate email HTML')
    args = parser.parse_args()

    asyncio.run(main(args.certificate_id, recipient_email=args.email, now=args.now, preview=args.preview))
