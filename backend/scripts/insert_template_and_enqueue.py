import asyncio
from datetime import datetime

async def main():
    from db import cert_templates_col, certificate_jobs_col
    # Insert a simple template
    template = {
        "template_id": "tpl-test-001",
        "name": "Test Template 001",
        "html_content": "<html><body><h1>Certificate for {{ participant_name }}</h1><p>Event: {{ event_title }}</p><p>ID: {{ certificate_id }}</p></body></html>",
        "description": "Automated test template",
        "preview_thumbnail": "",
        "created_at": datetime.utcnow().isoformat(),
        "is_builtin": False
    }
    await cert_templates_col.insert_one(template)
    print('Inserted template', template['template_id'])

    # Enqueue a certificate job for the sample event using this template
    job = {
        "event_id": "6a103270211d257a21311d65",
        "achievement_type": "participation",
        "event_code": "HACK",
        "template_id": template['template_id'],
        "status": "pending",
        "processed": 0,
        "total": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await certificate_jobs_col.insert_one(job)
    print('Enqueued job id', res.inserted_id)

if __name__ == '__main__':
    asyncio.run(main())
