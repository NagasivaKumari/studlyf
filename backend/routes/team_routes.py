from datetime import datetime, timedelta
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from bson import ObjectId

from auth_institution import get_auth_user
from db import teams_col, participants_col, events_col


router = APIRouter(prefix="/api/teams", tags=["Teams"])

@router.get("/test")
async def test_teams_endpoint():
    """Test endpoint to verify team routes are working"""
    return {"status": "ok", "message": "Team routes are working"}

def _team_size_limits(ev: dict) -> tuple[int, int]:
    # Support both naming conventions
    min_s = ev.get("min_team_size", ev.get("minTeamSize", 1))
    max_s = ev.get("max_team_size", ev.get("maxTeamSize", 5))
    try:
        return int(min_s), int(max_s)
    except Exception:
        return 1, 5


@router.get("/me")
async def my_team_for_event(event_id: str, user: dict = Depends(get_auth_user)):
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    team = None
    if p and p.get("team_id"):
        try:
            team = await teams_col.find_one({"_id": ObjectId(str(p.get("team_id")))})
        except Exception:
            team = None
        if team:
            team["_id"] = str(team["_id"])
            if "leader_id" in team:
                team["leader_id"] = str(team["leader_id"])
            if "team_leader_id" in team:
                team["team_leader_id"] = str(team["team_leader_id"])
                if "leader_id" not in team:
                    team["leader_id"] = team["team_leader_id"]
    if p and "_id" in p:
        p["_id"] = str(p["_id"])
        # Don't leak fields we don't need
        p = {k: p.get(k) for k in ("_id", "event_id", "user_id", "team_id", "status", "current_stage")}
    return {"participant": p, "team": team}


@router.post("/send-invite")
async def send_team_invite(
    payload: dict = Body(...),
    user: dict = Depends(get_auth_user),
):
    """Send team invite email"""
    try:
        team_id = str(payload.get("team_id") or "")
        invite_email = str(payload.get("invite_email") or "")
        event_id = str(payload.get("event_id") or "")
        
        if not team_id or not invite_email:
            raise HTTPException(status_code=400, detail="team_id and invite_email are required")
        
        # Get team details
        team = await teams_col.find_one({"_id": ObjectId(team_id)})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Get event details
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Create invite code
        invite_code = secrets.token_urlsafe(8)
        
        # Store invite
        await teams_col.update_one(
            {"_id": ObjectId(team_id)},
            {"$push": {"invites": {
                "code": invite_code,
                "email": invite_email,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=72)
            }}}
        )
        
        # Send email (placeholder for now)
        print(f"Team invite sent to {invite_email} with code {invite_code}")
        
        return {
            "success": True,
            "message": f"Invite sent to {invite_email}",
            "invite_code": invite_code
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-secure")
async def create_team_secure(
    payload: dict = Body(...),
    user: dict = Depends(get_auth_user),
):
    print(f"DEBUG: Team creation request - User: {user}, Payload: {payload}")
    
    uid = str(user.get("user_id") or "")
    if not uid:
        print("DEBUG: No user_id found")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    event_id = str(payload.get("event_id") or "").strip()
    team_name = str(payload.get("team_name") or "").strip()
    
    print(f"DEBUG: Extracted - event_id: {event_id}, team_name: {team_name}")
    
    if not event_id or not team_name:
        print("DEBUG: Missing event_id or team_name")
        raise HTTPException(status_code=400, detail="event_id and team_name are required")

    try:
        ev = await events_col.find_one({"_id": ObjectId(event_id)})
    except Exception as e:
        print(f"DEBUG: Invalid ObjectId format for event_id: {event_id}")
        raise HTTPException(status_code=400, detail="Invalid event_id format")
    
    if not ev:
        print(f"DEBUG: Event not found for event_id: {event_id}")
        raise HTTPException(status_code=404, detail="Event not found")

    print(f"DEBUG: Event found: {ev.get('name', 'Unknown')}")

    # Check if user is already registered or has applied
    p = await participants_col.find_one({"event_id": event_id, "user_id": uid})
    print(f"DEBUG: Participant record: {p}")
    
    if p and p.get("team_id"):
        print(f"DEBUG: User already in team: {p.get('team_id')}")
        raise HTTPException(status_code=400, detail="You are already in a team")
    
    # If not registered, create a basic participant record
    if not p:
        print("DEBUG: Creating new participant record")
        p = {
            "event_id": event_id,
            "user_id": uid,
            "status": "registered",
            "current_stage": "registration",
            "team_id": None
        }
        result = await participants_col.insert_one(p)
        p["_id"] = str(result.inserted_id)
        print(f"DEBUG: Created participant record: {p['_id']}")
    else:
        print("DEBUG: Using existing participant record")

    min_s, max_s = _team_size_limits(ev)
    if min_s > 1:
        # Allow creating team with leader only, but force invites before final submission elsewhere.
        pass
    if 1 > max_s:
        raise HTTPException(status_code=400, detail="Invalid team size config")

    team_doc = {
        "event_id": event_id,
        "team_name": team_name,
        "team_leader_id": uid,
        "members": [{"user_id": uid, "role": "LEADER"}],
        "status": "Pending",
        "invites": [],
        "formed_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await teams_col.insert_one(team_doc)
    team_id = str(res.inserted_id)
    await participants_col.update_one(
        {"_id": p["_id"]},
        {"$set": {"team_id": team_id, "updated_at": datetime.utcnow()}},
    )
    return {"status": "success", "team_id": team_id}


@router.post("/{team_id}/invites")
async def create_team_invite(
    team_id: str,
    ttl_hours: int = Body(72, embed=True),
    user: dict = Depends(get_auth_user),
):
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        team = await teams_col.find_one({"_id": ObjectId(team_id)})
    except Exception:
        team = None
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(team.get("team_leader_id") or "") != uid:
        raise HTTPException(status_code=403, detail="Only the team leader can create invite codes")

    now = datetime.utcnow()

    # ── Return existing active code if one still exists ──────────────────────
    existing_invites = team.get("invites") or []
    for inv in reversed(existing_invites):           # most-recent first
        if inv.get("revoked"):
            continue
        try:
            exp = datetime.fromisoformat(str(inv.get("expires_at", "")).replace("Z", "+00:00"))
            if now > exp.replace(tzinfo=None):
                continue                              # expired — skip
        except Exception:
            pass                                     # no expiry stored — treat as valid
        # Found a live code — return it without generating a new one
        return {"status": "success", "code": inv["code"], "team_id": team_id, "reused": True}

    # ── No active code — generate a fresh one ────────────────────────────────
    ttl = max(1, min(int(ttl_hours), 168))
    code = secrets.token_urlsafe(10)
    invite = {
        "code": code,
        "created_by": uid,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=ttl)).isoformat(),
        "uses": 0,
        "revoked": False,
    }
    await teams_col.update_one(
        {"_id": ObjectId(team_id)},
        {"$push": {"invites": invite}, "$set": {"updated_at": now}},
    )
    return {"status": "success", "code": code, "team_id": team_id, "reused": False}



@router.post("/join-by-invite")
async def join_by_invite(
    code: str = Body(embed=True),
    user: dict = Depends(get_auth_user),
):
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    raw = str(code or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Invite code is required")

    team = await teams_col.find_one({"invites.code": raw})
    if not team:
        raise HTTPException(status_code=404, detail="Invite code not found")

    event_id = str(team.get("event_id") or "")
    ev = await events_col.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    min_s, max_s = _team_size_limits(ev)
    if len(team.get("members") or []) >= max_s:
        raise HTTPException(status_code=400, detail="Team is already full")

    # Check if registered for event, if not, auto-register them
    p = await participants_col.find_one({"event_id": event_id, "user_id": uid})
    if p and p.get("team_id"):
        raise HTTPException(status_code=400, detail="You are already in a team")

    if not p:
        # Auto-register since they are joining via invite
        from db import users_col
        u = await users_col.find_one({"user_id": uid}) or {}
        first_stage = None
        try:
            st = ev.get("stages")
            if isinstance(st, list) and st:
                first_stage = st[0].get("name") or st[0].get("id")
        except Exception:
            pass
        
        p = {
            "event_id": event_id,
            "institution_id": ev.get("institution_id"),
            "user_id": uid,
            "full_name": u.get("full_name") or u.get("name") or user.get("email") or uid,
            "email": u.get("email") or user.get("email") or "",
            "event_title": ev.get("title"),
            "registered_at": datetime.utcnow(),
            "status": "pending",
            "current_stage": first_stage or "Registration",
            "source": "team_invite",
            "team_id": None
        }
        res = await participants_col.insert_one(p)
        p["_id"] = res.inserted_id
    
    # Check if user is already a member of this team
    existing_members = team.get("members", [])
    is_already_member = any(member.get("user_id") == uid for member in existing_members)
    if is_already_member:
        raise HTTPException(status_code=400, detail="You are already a member of this team")

    # validate invite not expired/revoked
    invites = team.get("invites") or []
    inv = next((x for x in invites if str(x.get("code")) == raw), None)
    if not inv or inv.get("revoked"):
        raise HTTPException(status_code=400, detail="Invite is not active")
    try:
        exp = datetime.fromisoformat(str(inv.get("expires_at")).replace("Z", "+00:00"))
        if datetime.utcnow() > exp.replace(tzinfo=None):
            raise HTTPException(status_code=400, detail="Invite has expired")
    except HTTPException:
        raise
    except Exception:
        pass

    # join team
    await teams_col.update_one(
        {"_id": team["_id"]},
        {
            "$push": {"members": {"user_id": uid, "role": "MEMBER"}},
            "$set": {"updated_at": datetime.utcnow()},
            "$inc": {"invites.$[i].uses": 1},
        },
        array_filters=[{"i.code": raw}],
    )
    await participants_col.update_one(
        {"_id": p["_id"]},
        {"$set": {"team_id": str(team["_id"]), "updated_at": datetime.utcnow()}},
    )
    return {"status": "success", "team_id": str(team["_id"]), "event_id": event_id}

