import logging
from datetime import datetime
from typing import Optional, List, Dict
from bson import ObjectId

logger = logging.getLogger("email_template_service")

# ─── Default templates (seeded on event creation) ──────────────────────

DEFAULT_TEMPLATES = {
    "stage_advancement": {
        "name": "Stage Advancement",
        "type": "stage_advancement",
        "subject": "Congratulations {team_name}! You've advanced to {stage_name}",
        "placeholders": ["team_name", "event_name", "stage_name", "participant_name"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);">
        <div style="text-align: center; margin-bottom: 20px;">🎉</div>
        <h1 style="color: #7C3AED; font-size: 28px; font-weight: 900; text-align: center; margin: 0;">CONGRATULATIONS!</h1>
        <p style="text-align: center; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; margin-top: 5px;">You've been advanced</p>
        <div style="margin: 40px 0; padding: 30px; background: white; border: 1px solid #ddd6fe; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <p style="margin: 0; font-size: 16px; color: #111827; text-align: center;">
                Team <strong>"{team_name}"</strong> has qualified for <strong>{stage_name}</strong> in <strong>{event_name}</strong>.
            </p>
        </div>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">This is a significant milestone. Please check your Event Hub for updated deadlines and submission requirements for this new stage.</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="{{frontend_url}}/dashboard/learner" style="background-color: #111827; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">GO TO EVENT HUB</a>
        </div>
    </div>
</body>
</html>"""
    },
    "announcement": {
        "name": "Custom Announcement",
        "type": "announcement",
        "subject": "Important Update: {event_name}",
        "placeholders": ["team_name", "event_name", "participant_name", "custom_message", "stage_name"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px;">
        <div style="text-align: center; background: #1E293B; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">{event_name}</h2>
        </div>
        <p style="font-size: 18px; color: #1E293B; margin: 0;">Hello <strong>{participant_name}</strong>,</p>
        <div style="font-size: 16px; color: #475569; line-height: 1.8; margin: 25px 0; border-left: 4px solid #6C3BFF; padding-left: 20px;">
            {custom_message}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 14px; color: #94A3B8;">
            This message was composed by the organizing team of {event_name}.
        </div>
    </div>
</body>
</html>"""
    },
    "deadline_reminder": {
        "name": "Deadline Reminder",
        "type": "deadline_reminder",
        "subject": "Reminder: {stage_name} deadline approaching for {event_name}",
        "placeholders": ["team_name", "event_name", "stage_name", "participant_name", "deadline"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px;">
        <div style="text-align: center; margin-bottom: 20px;">⏰</div>
        <h1 style="color: #DC2626; font-size: 24px; font-weight: 900; text-align: center; margin: 0;">DEADLINE APPROACHING</h1>
        <p style="text-align: center; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; margin-top: 5px;">{stage_name}</p>
        <div style="margin: 30px 0; padding: 24px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 16px; text-align: center;">
            <p style="margin: 0; font-size: 15px; color: #991B1B;">
                Team <strong>"{team_name}"</strong>, the deadline for <strong>{stage_name}</strong> in <strong>{event_name}</strong> is <strong>{deadline}</strong>.
            </p>
        </div>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">Please ensure your submission is complete before the deadline.</p>
        <div style="text-align: center; margin-top: 24px;">
            <a href="{{frontend_url}}/dashboard/learner" style="background-color: #DC2626; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">SUBMIT NOW</a>
        </div>
    </div>
</body>
</html>"""
    },
    "deadline_extension": {
        "name": "Deadline Extension",
        "type": "deadline_extension",
        "subject": "Deadline Extended: {event_name} - {stage_name}",
        "placeholders": ["team_name", "event_name", "stage_name", "participant_name", "new_deadline"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px;">
        <div style="text-align: center; margin-bottom: 20px;">📅</div>
        <h1 style="color: #059669; font-size: 24px; font-weight: 900; text-align: center; margin: 0;">DEADLINE EXTENDED</h1>
        <div style="margin: 30px 0; padding: 24px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; text-align: center;">
            <p style="margin: 0; font-size: 15px; color: #065F46;">
                Good news! The deadline for <strong>{stage_name}</strong> in <strong>{event_name}</strong> has been extended to <strong>{new_deadline}</strong>.
            </p>
        </div>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">Use this extra time wisely to refine your submission.</p>
    </div>
</body>
</html>"""
    },
    "registration_confirmation": {
        "name": "Registration Confirmation",
        "type": "registration_confirmation",
        "subject": "You're registered for {event_name}!",
        "placeholders": ["team_name", "event_name", "participant_name"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background: linear-gradient(180deg, #ffffff 0%, #EEF2FF 100%);">
        <div style="text-align: center; margin-bottom: 20px;">✅</div>
        <h1 style="color: #4F46E5; font-size: 24px; font-weight: 900; text-align: center; margin: 0;">REGISTRATION CONFIRMED</h1>
        <div style="margin: 30px 0; padding: 24px; background: white; border: 1px solid #C7D2FE; border-radius: 16px; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #111827;">
                <strong>{participant_name}</strong>, you are now registered for <strong>{event_name}</strong>!
            </p>
        </div>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">Stay tuned for updates and check the Event Hub for details.</p>
    </div>
</body>
</html>"""
    }
}


def render_template(template: dict, context: dict) -> (str, str):
    """
    Renders subject and body_html by replacing placeholders with context values.
    context keys: team_name, event_name, stage_name, participant_name, custom_message, deadline, new_declare, score, frontend_url
    """
    import os
    full_context = {
        "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:3000"),
    }
    full_context.update(context)

    subject = template.get("subject", "")
    body = template.get("body_html", "")

    for key, value in full_context.items():
        placeholder = "{" + key + "}"
        str_value = str(value) if value is not None else ""
        subject = subject.replace(placeholder, str_value)
        body = body.replace(placeholder, str_value)

    return subject, body


async def get_templates_for_event(
    event_id: str,
    institution_id: str,
    template_type: Optional[str] = None
) -> List[Dict]:
    """
    Get templates for event (fallback to institution-level then defaults).
    """
    from db import email_templates_col

    query = {
        "$or": [
            {"event_id": event_id},
            {"institution_id": institution_id, "event_id": None},
            {"is_default": True, "event_id": None, "institution_id": None}
        ]
    }
    if template_type:
        query["type"] = template_type

    cursor = email_templates_col.find(query).sort([("event_id", -1), ("institution_id", -1)])
    templates = await cursor.to_list(length=100)

    for t in templates:
        t["_id"] = str(t["_id"])

    return templates


async def get_active_template(event_id: str, institution_id: str, template_type: str) -> Optional[Dict]:
    """
    Get the active template for a specific type, with priority:
    1. Event-level active template
    2. Institution-level active template
    3. Default template
    """
    from db import email_templates_col

    template = await email_templates_col.find_one({
        "event_id": event_id, "type": template_type, "is_active": True
    })
    if template:
        template["_id"] = str(template["_id"])
        return template

    template = await email_templates_col.find_one({
        "institution_id": institution_id, "event_id": None, "type": template_type, "is_active": True
    })
    if template:
        template["_id"] = str(template["_id"])
        return template

    if template_type in DEFAULT_TEMPLATES:
        return {**DEFAULT_TEMPLATES[template_type], "_id": f"default_{template_type}"}

    return None


async def upsert_template(template_data: dict) -> dict:
    """
    Create or update an email template.
    """
    from db import email_templates_col

    template_id = template_data.pop("_id", None)

    template_data["updated_at"] = datetime.utcnow()

    if template_id and template_id != "new":
        try:
            await email_templates_col.update_one(
                {"_id": ObjectId(template_id)},
                {"$set": template_data}
            )
            template_data["_id"] = template_id
        except Exception:
            template_data.pop("_id", None)
            result = await email_templates_col.insert_one(template_data)
            template_data["_id"] = str(result.inserted_id)
    else:
        template_data["created_at"] = datetime.utcnow()
        template_data.pop("_id", None)
        result = await email_templates_col.insert_one(template_data)
        template_data["_id"] = str(result.inserted_id)

    return template_data


async def delete_template(template_id: str) -> bool:
    """Delete a template by ID."""
    from db import email_templates_col
    result = await email_templates_col.delete_one({"_id": ObjectId(template_id)})
    return result.deleted_count > 0


async def seed_default_templates(event_id: str, institution_id: str):
    """
    Seed default templates for a newly created event.
    Skips if already seeded.
    """
    from db import email_templates_col

    existing = await email_templates_col.find_one({"event_id": event_id, "type": "stage_advancement"})
    if existing:
        return

    for ttype, tdata in DEFAULT_TEMPLATES.items():
        doc = {
            **tdata,
            "event_id": event_id,
            "institution_id": institution_id,
            "is_active": True,
            "is_default": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        doc.pop("type", None)
        doc["type"] = ttype
        await email_templates_col.insert_one(doc)

    logger.info(f"Seeded {len(DEFAULT_TEMPLATES)} email templates for event {event_id}")
