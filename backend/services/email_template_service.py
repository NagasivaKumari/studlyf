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
    },
    "new_opportunity": {
        "name": "New Opportunity Announcement",
        "type": "new_opportunity",
        "subject": "New Opportunity: {event_title} by {organization_name}",
        "placeholders": ["participant_name", "event_title", "organization_name", "event_type", "event_mode", "registration_deadline", "prize_pool", "eligibility", "short_description", "event_link", "organization_name"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6c3bff,#4f46e5);padding:28px 24px;text-align:center">
            <p style="margin:0 0 4px 0;color:#c7d2fe;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Studlyf</p>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">New Opportunity Announcement</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.6">A new opportunity matching your interests has been posted on Studlyf.</p>
            <div style="background:#f0edff;border-radius:10px;padding:16px 20px;margin-bottom:20px;border:1px solid #ddd6fe">
                <p style="margin:0 0 2px 0;color:#6c3bff;font-size:18px;font-weight:800">{event_title}</p>
                <p style="margin:0;color:#6b7280;font-size:13px;font-weight:600">Hosted by: {organization_name}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
                <tr>
                    <td style="padding:8px 10px;width:50%;vertical-align:top">
                        <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Type</p>
                        <p style="margin:4px 0 0 0;color:#111827;font-size:14px;font-weight:600">{event_type}</p>
                    </td>
                    <td style="padding:8px 10px;width:50%;vertical-align:top">
                        <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Mode</p>
                        <p style="margin:4px 0 0 0;color:#111827;font-size:14px;font-weight:600">{event_mode}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 10px;width:50%;vertical-align:top">
                        <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Registration Deadline</p>
                        <p style="margin:4px 0 0 0;color:#111827;font-size:14px;font-weight:600">{registration_deadline}</p>
                    </td>
                    <td style="padding:8px 10px;width:50%;vertical-align:top">
                        <p style="margin:0;color:#6b7280;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Prize Pool</p>
                        <p style="margin:4px 0 0 0;color:#111827;font-size:14px;font-weight:600">{prize_pool}</p>
                    </td>
                </tr>
            </table>
            <div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin-bottom:18px;border:1px solid #bbf7d0">
                <p style="margin:0 0 2px 0;color:#166534;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Eligibility</p>
                <p style="margin:0;color:#166534;font-size:13px">{eligibility}</p>
            </div>
            <p style="margin:0 0 18px 0;color:#4b5563;font-size:14px;line-height:1.6">{short_description}</p>
            <div style="background:#fafafa;border-radius:8px;padding:14px 18px;margin-bottom:20px;border:1px solid #e5e7eb">
                <p style="margin:0 0 8px 0;color:#111827;font-size:13px;font-weight:700">Why You Should Participate:</p>
                <ul style="margin:0;padding-left:18px;color:#4b5563;font-size:13px;line-height:2">
                    <li>Gain practical experience</li>
                    <li>Compete with participants across institutions</li>
                    <li>Improve your skills and profile</li>
                    <li>Unlock internship and career opportunities</li>
                </ul>
            </div>
            <div style="text-align:center;margin-bottom:14px">
                <a href="{event_link}" style="display:inline-block;padding:14px 36px;background:#6c3bff;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Register Now</a>
            </div>
            <p style="margin:0 0 20px 0;color:#9ca3af;font-size:12px;text-align:center">Seats may be limited. Early registration is recommended.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 14px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">You are receiving this because you are registered on Studlyf.<br/><strong>Team Studlyf</strong> &middot; On behalf of {organization_name}</p>
        </div>
    </div>
</body>
</html>"""
    },
    "plan_activation": {
        "name": "Plan Activation",
        "type": "plan_activation",
        "subject": "Your {plan_name} Subscription is Now Active",
        "placeholders": ["user_name", "plan_name", "start_date", "expiry_date", "billing_cycle", "manage_subscription_url", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f8fafc;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6c3bff,#4f46e5);padding:32px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px">Studlyf</h1>
            <p style="margin:8px 0 0 0;color:#c7d2fe;font-size:14px;font-weight:600">Subscription Activated</p>
        </div>
        <div style="padding:24px">
            <h2 style="margin:0 0 4px 0;color:#0f172a;font-size:20px">Hi {user_name},</h2>
            <p style="margin:0 0 18px 0;color:#475569;font-size:15px">Your <strong style="color:#6c3bff">{plan_name}</strong> subscription has been activated successfully.</p>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
                <div style="background:#6c3bff;color:#fff;padding:8px 16px;border-radius:6px;font-weight:700;font-size:14px">{plan_name}</div>
                <div style="background:#f1f5f9;color:#64748b;padding:6px 12px;border-radius:4px;font-size:12px">{billing_cycle}</div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:18px">
                <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
                    <tr><td style="padding:4px 0;color:#6b7280;width:100px">Plan:</td><td style="padding:4px 0;font-weight:600">{plan_name}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Start Date:</td><td style="padding:4px 0;font-weight:600">{start_date}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Expiry Date:</td><td style="padding:4px 0;font-weight:600">{expiry_date}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Billing Cycle:</td><td style="padding:4px 0;font-weight:600">{billing_cycle}</td></tr>
                </table>
            </div>
            <div style="margin-bottom:20px">
                <a href="{manage_subscription_url}" style="display:inline-block;padding:14px 24px;background:#6c3bff;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Manage Subscription</a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0" />
            <p style="color:#94a3b8;font-size:12px;margin:0">Need help? Contact <a href="mailto:support@studlyf.com" style="color:#6c3bff">support@studlyf.com</a></p>
            <p style="color:#94a3b8;font-size:11px;margin:8px 0 0 0">Studlyf Team — Empowering hackathons and learning</p>
        </div>
    </div>
</body>
</html>"""
    },
    "plan_expiry": {
        "name": "Plan Expiry Notice",
        "type": "plan_expiry",
        "subject": "Action Required: Your {plan_name} Has {expiry_label}",
        "placeholders": ["user_name", "plan_name", "expiry_date", "expiry_label", "renew_url", "message", "frontend_url", "renew_section"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827;">
    <div style="max-width:600px;margin:0 auto;padding:24px;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;">
        <div style="text-align:center;margin-bottom:20px">
            <div style="display:inline-block;background:#fef2f2;border-radius:50%;width:48px;height:48px;line-height:48px;font-size:24px">⚠️</div>
        </div>
        <h2 style="margin:0 0 4px 0;color:#0f172a;font-size:20px;text-align:center">Plan Expiry Notice</h2>
        <p style="margin:0 0 18px 0;color:#374151;text-align:center">{message}</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:18px">
            <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
                <tr><td style="padding:4px 0;color:#6b7280;width:100px">Plan:</td><td style="padding:4px 0;font-weight:600">{plan_name}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280">Expires On:</td><td style="padding:4px 0;font-weight:600">{expiry_date}</td></tr>
            </table>
        </div>
        {renew_section}
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:18px 0" />
        <p style="color:#9ca3af;font-size:12px;margin:0">Studlyf Team</p>
    </div>
</body>
</html>"""
    },
    "certificate_issued": {
        "name": "Certificate Issued",
        "type": "certificate_issued",
        "subject": "Your Certificate for {event_title} is Ready!",
        "placeholders": ["participant_name", "event_title", "organization_name", "event_date", "certificate_id", "issued_date", "certificate_download_link", "verification_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 24px;text-align:center">
            <p style="margin:0 0 4px 0;color:#a7f3d0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Studlyf</p>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Certificate Issued</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.6">Thank you for participating in <strong>{event_title}</strong> hosted by <strong>{organization_name}</strong> on Studlyf.</p>
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.6">Your participation certificate has now been generated successfully.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{certificate_download_link}" style="display:inline-block;padding:14px 36px;background:#059669;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Download Certificate</a>
            </div>
            <div style="background:#f0fdf4;border-radius:8px;padding:14px 18px;margin-bottom:20px;border:1px solid #bbf7d0">
                <p style="margin:0 0 8px 0;color:#166534;font-size:13px;font-weight:700">Certificate Details:</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
                    <tr><td style="padding:4px 0;color:#6b7280;width:100px">Event:</td><td style="padding:4px 0;font-weight:600">{event_title}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Certificate ID:</td><td style="padding:4px 0;font-weight:600">{certificate_id}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Issued On:</td><td style="padding:4px 0;font-weight:600">{issued_date}</td></tr>
                </table>
            </div>
            <div style="background:#fafafa;border-radius:8px;padding:12px 16px;margin-bottom:18px;border:1px solid #e5e7eb;text-align:center">
                <p style="margin:0;color:#6b7280;font-size:12px">Verify Certificate:</p>
                <p style="margin:4px 0 0 0;font-size:13px;font-weight:600;word-break:break-all"><a href="{verification_url}" style="color:#059669">{verification_url}</a></p>
            </div>
            <p style="margin:0 0 20px 0;color:#374151;font-size:14px;line-height:1.6">We appreciate your participation and hope to see you in more opportunities on Studlyf.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 14px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong><br/>On behalf of {organization_name}</p>
        </div>
    </div>
</body>
</html>"""
    },
    "team_invitation": {
        "name": "Team Invitation",
        "type": "team_invitation",
        "subject": "Team Invitation: {event_title}",
        "placeholders": ["participant_name", "team_leader_name", "team_name", "event_title", "organization_name", "invite_link", "current_team_size", "max_team_size", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#6c3bff;padding:28px 24px;text-align:center">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Team Invitation</p>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6"><strong>{team_leader_name}</strong> has invited you to join the team <strong>"{team_name}"</strong> for <strong>{event_title}</strong> hosted by <strong>{organization_name}</strong>.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{invite_link}" style="display:inline-block;padding:14px 36px;background:#6c3bff;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Accept Invitation</a>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:18px">
                <p style="margin:0;color:#64748b;font-size:13px">Team Size: {current_team_size} / {max_team_size}</p>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "team_join_approved": {
        "name": "Team Join Request Approved",
        "type": "team_join_approved",
        "subject": "Join Request Approved: {event_title}",
        "placeholders": ["participant_name", "team_name", "event_title", "organization_name", "team_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#10b981;padding:28px 24px;text-align:center">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Request Approved</p>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">Your request to join the team <strong>"{team_name}"</strong> for <strong>{event_title}</strong> has been approved.</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">You can now participate as part of the team.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{team_link}" style="display:inline-block;padding:14px 36px;background:#10b981;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Team</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "opportunity_reminder": {
        "name": "Opportunity Deadline Reminder",
        "type": "opportunity_reminder",
        "subject": "Reminder: {event_title} registration closes soon",
        "placeholders": ["participant_name", "event_title", "organization_name", "registration_deadline", "event_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#f59e0b;padding:28px 24px;text-align:center">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Deadline Reminder</p>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">Registration for <strong>{event_title}</strong> hosted by <strong>{organization_name}</strong> closes soon.</p>
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:18px">
                <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">Deadline: {registration_deadline}</p>
            </div>
            <p style="margin:0 0 18px 0;color:#374151;font-size:14px;line-height:1.6">Complete your registration before the deadline.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{event_link}" style="display:inline-block;padding:14px 36px;background:#f59e0b;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Register Here</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "email_verification": {
        "name": "Email Verification",
        "type": "email_verification",
        "subject": "Verify Your Email - Studlyf",
        "placeholders": ["participant_name", "verification_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6c3bff,#4f46e5);padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Verify Your Email</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">Welcome to Studlyf. Please verify your email address to activate your account.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{verification_link}" style="display:inline-block;padding:14px 36px;background:#6c3bff;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Verify Email</a>
            </div>
            <p style="margin:0 0 18px 0;color:#9ca3af;font-size:13px;text-align:center">If you did not create this account, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "password_reset": {
        "name": "Password Reset",
        "type": "password_reset",
        "subject": "Reset Your Studlyf Password",
        "placeholders": ["participant_name", "reset_link", "expiry_duration", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#ef4444;padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Password Reset</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">We received a request to reset your Studlyf account password.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{reset_link}" style="display:inline-block;padding:14px 36px;background:#ef4444;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Reset Password</a>
            </div>
            <p style="margin:0 0 18px 0;color:#64748b;font-size:13px;text-align:center">This link will expire in <strong>{expiry_duration}</strong>.</p>
            <p style="margin:0 0 18px 0;color:#9ca3af;font-size:13px;text-align:center">If you did not request this, please ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "event_published": {
        "name": "Event Published",
        "type": "event_published",
        "subject": "Event Published: {event_title}",
        "placeholders": ["organizer_name", "event_title", "event_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#6c3bff;padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Event Published</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {organizer_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">Your event <strong>{event_title}</strong> has been successfully published on Studlyf.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{event_link}" style="display:inline-block;padding:14px 36px;background:#6c3bff;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Event</a>
            </div>
            <p style="margin:0 0 18px 0;color:#64748b;font-size:14px;text-align:center">Participants will now be able to discover and register for your opportunity.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "new_registration": {
        "name": "New Registration Notification",
        "type": "new_registration",
        "subject": "New Registration: {event_title}",
        "placeholders": ["organizer_name", "event_title", "participant_name", "registration_count", "dashboard_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#111827;padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">New Registration</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {organizer_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">A new participant has registered for <strong>{event_title}</strong>.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:18px">
                <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
                    <tr><td style="padding:4px 0;color:#6b7280;width:100px">Participant:</td><td style="padding:4px 0;font-weight:600">{participant_name}</td></tr>
                    <tr><td style="padding:4px 0;color:#6b7280">Total Registrations:</td><td style="padding:4px 0;font-weight:600">{registration_count}</td></tr>
                </table>
            </div>
            <div style="text-align:center;margin:24px 0">
                <a href="{dashboard_link}" style="display:inline-block;padding:14px 36px;background:#111827;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Participants</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "payment_failed": {
        "name": "Payment Failed",
        "type": "payment_failed",
        "subject": "Payment Failed: {plan_name}",
        "placeholders": ["user_name", "plan_name", "payment_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#ef4444;padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Payment Failed</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {user_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">We were unable to process your recent payment for <strong>"{plan_name}"</strong>.</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:14px;line-height:1.6">Please update your payment method or retry payment to avoid interruption of services.</p>
            <div style="text-align:center;margin:24px 0">
                <a href="{payment_link}" style="display:inline-block;padding:14px 36px;background:#ef4444;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Retry Payment</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
    </div>
</body>
</html>"""
    },
    "recommended_opportunities": {
        "name": "Recommended Opportunities",
        "type": "recommended_opportunities",
        "subject": "Recommended Opportunities for You",
        "placeholders": ["participant_name", "recommended_opportunities", "recommendation_link", "frontend_url"],
        "is_default": True,
        "body_html": """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0;padding:0;background:#f4f6f9;">
    <div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 24px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">Recommended Opportunities</h1>
        </div>
        <div style="padding:24px 28px">
            <p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">Hi {participant_name},</p>
            <p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.6">Based on your interests and activity, we found new opportunities you may like.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:18px;white-space:pre-line">
                {recommended_opportunities}
            </div>
            <div style="text-align:center;margin:24px 0">
                <a href="{recommendation_link}" style="display:inline-block;padding:14px 36px;background:#667eea;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Explore More</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Regards,<br/><strong>Team Studlyf</strong></p>
        </div>
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


async def send_template_email(
    template_type: str,
    recipient: str,
    context: dict,
    subject_override: str = None,
    event_id: str = "",
    institution_id: str = "",
):
    """
    Send an email using the DB-based template system.
    Resolves event-level → institution-level → default template.
    Falls back gracefully if template not found.
    """
    from services.email_service import send_notification_email

    template = await get_active_template(event_id, institution_id, template_type)
    if not template:
        logger.warning(f"No template found for type '{template_type}' — skipping email to {recipient}")
        return

    subj, body = render_template(template, context)
    await send_notification_email(recipient, subject_override or subj, body)
