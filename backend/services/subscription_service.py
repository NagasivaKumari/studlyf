from datetime import datetime, timezone
from typing import Any, Dict, Optional

from db import hackathon_event_config_col, opportunities_col

PLAN_RULES: Dict[str, Dict[str, Any]] = {
    "basic": {
        "name": "Basic Plan",
        "max_active_listings": 2,
        "max_registration_days": 7,
    },
    "pack3": {
        "name": "Pack of 3",
        "max_active_listings": 3,
        "max_registration_days": 30,
    },
    "pack7": {
        "name": "Pack of 7",
        "max_active_listings": 7,
        "max_registration_days": 30,
    },
    "enterprise": {
        "name": "Enterprise",
        "max_active_listings": None,
        "max_registration_days": None,
    },
}


def _coerce_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        txt = value.strip()
        if not txt:
            return None
        dt = datetime.fromisoformat(txt.replace("Z", "+00:00"))
    else:
        return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_current_plan_id(institution_id: str) -> str:
    row = await hackathon_event_config_col.find_one(
        {"institution_id": str(institution_id), "key": "subscription_plan_id"}
    )
    plan_id = str((row or {}).get("value") or "basic").strip().lower()
    if plan_id not in PLAN_RULES:
        return "basic"
    return plan_id


async def get_current_plan_rules(institution_id: str) -> Dict[str, Any]:
    plan_id = await get_current_plan_id(institution_id)
    rules = dict(PLAN_RULES.get(plan_id) or PLAN_RULES["basic"])
    rules["id"] = plan_id
    return rules


async def validate_new_listing_against_plan(
    institution_id: str,
    deadline_value: Any = None,
    deadline_label: str = "deadline",
) -> Dict[str, Any]:
    rules = await get_current_plan_rules(institution_id)

    max_active = rules.get("max_active_listings")
    if max_active is not None:
        active_count = await opportunities_col.count_documents(
            {
                "institution_id": str(institution_id),
                "status": {"$in": ["active", "ACTIVE", "live", "LIVE"]},
            }
        )
        if active_count >= int(max_active):
            raise ValueError(
                f"{rules['name']} allows up to {max_active} active listings. "
                f"Deactivate an existing listing or upgrade your subscription."
            )

    max_days = rules.get("max_registration_days")
    if max_days is not None and deadline_value:
        deadline_dt = _coerce_dt(deadline_value)
        if deadline_dt:
            now = datetime.now(timezone.utc)
            delta_days = (deadline_dt - now).total_seconds() / 86400.0
            if delta_days > float(max_days):
                raise ValueError(
                    f"Your {rules['name']} supports a maximum {max_days}-day {deadline_label}."
                )

    return rules
