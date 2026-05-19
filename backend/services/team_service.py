"""
Team Formation Service - Dynamic Team Creation/Joining with Invite Codes
"""

from db import teams_col, participants_col, users_col, events_col
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import secrets
import string
from typing import Optional

async def create_team(
    event_id: str,
    user_id: str,
    team_name: str,
    team_size_min: int = 1,
    team_size_max: int = 5
) -> dict:
    """Create a new team for an event."""
    try:
        # Verify participant exists
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if not participant:
            return {"error": "You must register for the event first", "status": "not_registered"}
        
        # Check if already in a team
        if participant.get("team_id"):
            existing_team = await teams_col.find_one({"_id": ObjectId(participant["team_id"])})
            if existing_team:
                return {
                    "error": "You are already in a team",
                    "status": "already_in_team",
                    "team": {
                        "_id": str(existing_team["_id"]),
                        "team_name": existing_team.get("team_name"),
                    }
                }
        
        # Get user details
        user = await users_col.find_one({"user_id": str(user_id)})
        
        # Create team
        team_doc = {
            "event_id": str(event_id),
            "team_name": team_name,
            "team_leader_id": str(user_id),
            "leader_name": user.get("full_name", "Leader") if user else "Leader",
            "members": [
                {
                    "user_id": str(user_id),
                    "name": user.get("full_name", "") if user else "",
                    "email": user.get("email", "") if user else "",
                    "role": "LEADER",
                    "joined_at": datetime.now(timezone.utc),
                }
            ],
            "status": "active",
            "size_min": team_size_min,
            "size_max": team_size_max,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        
        result = await teams_col.insert_one(team_doc)
        team_id = str(result.inserted_id)
        
        # Update participant with team_id
        await participants_col.update_one(
            {"_id": participant["_id"]},
            {"$set": {"team_id": team_id, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "status": "success",
            "message": f"Team '{team_name}' created successfully",
            "team": {
                "_id": team_id,
                "team_name": team_name,
                "team_leader_id": str(user_id),
                "members": team_doc["members"],
                "size_info": f"1/{team_size_max}",
            }
        }
    except Exception as e:
        print(f"[ERROR] create_team: {e}")
        return {"error": str(e), "status": "error"}

async def generate_invite_code(team_id: str, ttl_hours: int = 72) -> dict:
    """Generate a time-limited invite code for team."""
    try:
        team = await teams_col.find_one({"_id": ObjectId(team_id)})
        if not team:
            return {"error": "Team not found"}
        
        # Check if team is full
        current_members = len(team.get("members", []))
        max_size = team.get("size_max", 5)
        if current_members >= max_size:
            return {"error": "Team is full"}
        
        # Generate code (6 characters, alphanumeric)
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        
        # Store invite in team doc
        invite_doc = {
            "code": code,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=ttl_hours),
            "used_count": 0,
            "max_uses": None,  # Unlimited
        }
        
        await teams_col.update_one(
            {"_id": ObjectId(team_id)},
            {
                "$push": {"invites": invite_doc},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        return {
            "status": "success",
            "invite_code": code,
            "expires_in_hours": ttl_hours,
            "expires_at": invite_doc["expires_at"].isoformat(),
            "share_message": f"Join my team! Use code: {code}"
        }
    except Exception as e:
        print(f"[ERROR] generate_invite_code: {e}")
        return {"error": str(e)}

async def join_team_with_code(
    event_id: str,
    user_id: str,
    invite_code: str
) -> dict:
    """Join team using invite code."""
    try:
        # Verify participant exists
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if not participant:
            return {"error": "You must register for the event first"}
        
        # Check if already in a team
        if participant.get("team_id"):
            return {"error": "You are already in a team. Leave your current team first."}
        
        # Find team with this code
        team = await teams_col.find_one({
            "event_id": str(event_id),
            "invites.code": invite_code.upper()
        })
        
        if not team:
            return {"error": "Invalid invite code or code expired"}
        
        # Check if code is expired
        valid_invite = None
        for invite in team.get("invites", []):
            if invite.get("code") == invite_code.upper():
                if datetime.now(timezone.utc) > invite.get("expires_at", datetime.utcnow()):
                    return {"error": "Invite code has expired"}
                valid_invite = invite
                break
        
        if not valid_invite:
            return {"error": "Invalid invite code"}
        
        # Check if team is full
        current_members = len(team.get("members", []))
        max_size = team.get("size_max", 5)
        if current_members >= max_size:
            return {"error": "Team is full"}
        
        # Check if user already in team (duplicate prevention)
        user_ids = [m.get("user_id") for m in team.get("members", [])]
        if str(user_id) in user_ids:
            return {"error": "You are already a member of this team"}
        
        # Get user details
        user = await users_col.find_one({"user_id": str(user_id)})
        
        # Add member to team
        new_member = {
            "user_id": str(user_id),
            "name": user.get("full_name", "") if user else "",
            "email": user.get("email", "") if user else "",
            "role": "MEMBER",
            "joined_at": datetime.now(timezone.utc),
        }
        
        await teams_col.update_one(
            {"_id": team["_id"]},
            {
                "$push": {"members": new_member},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        # Update participant with team_id
        await participants_col.update_one(
            {"_id": participant["_id"]},
            {"$set": {"team_id": str(team["_id"]), "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "status": "success",
            "message": f"Successfully joined team '{team.get('team_name')}'",
            "team": {
                "_id": str(team["_id"]),
                "team_name": team.get("team_name"),
                "team_leader_id": team.get("team_leader_id"),
                "members": [
                    {
                        "user_id": m.get("user_id"),
                        "name": m.get("name"),
                        "role": m.get("role"),
                        "is_leader": str(m.get("user_id")) == str(team.get("team_leader_id")),
                    }
                    for m in team.get("members", [])
                ],
                "size_info": f"{len(team.get('members', [])) + 1}/{max_size}",
            }
        }
    except Exception as e:
        print(f"[ERROR] join_team_with_code: {e}")
        return {"error": str(e)}

async def leave_team(event_id: str, user_id: str) -> dict:
    """Leave current team."""
    try:
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if not participant or not participant.get("team_id"):
            return {"error": "You are not in a team"}
        
        team_id = participant["team_id"]
        team = await teams_col.find_one({"_id": ObjectId(team_id)})
        
        if not team:
            return {"error": "Team not found"}
        
        # If leader, delete team entirely
        if str(team.get("team_leader_id")) == str(user_id):
            # Remove all members from participants
            for member in team.get("members", []):
                await participants_col.update_one(
                    {"event_id": str(event_id), "user_id": member.get("user_id")},
                    {"$unset": {"team_id": ""}}
                )
            
            # Delete team
            await teams_col.delete_one({"_id": ObjectId(team_id)})
            
            return {
                "status": "success",
                "message": "Team deleted. All members have been removed.",
                "team_deleted": True
            }
        else:
            # Remove member from team
            await teams_col.update_one(
                {"_id": ObjectId(team_id)},
                {"$pull": {"members": {"user_id": str(user_id)}}},
                {"$set": {"updated_at": datetime.now(timezone.utc)}}
            )
            
            # Remove team_id from participant
            await participants_col.update_one(
                {"_id": participant["_id"]},
                {"$unset": {"team_id": ""}}
            )
            
            return {
                "status": "success",
                "message": f"You have left the team '{team.get('team_name')}'",
            }
    except Exception as e:
        print(f"[ERROR] leave_team: {e}")
        return {"error": str(e)}

async def get_team_details(team_id: str) -> dict:
    """Get full team details including member info."""
    try:
        team = await teams_col.find_one({"_id": ObjectId(team_id)})
        if not team:
            return {"error": "Team not found"}
        
        # Enrich member info
        enriched_members = []
        for member in team.get("members", []):
            enriched_members.append({
                "user_id": member.get("user_id"),
                "name": member.get("name"),
                "email": member.get("email"),
                "role": member.get("role"),
                "is_leader": str(member.get("user_id")) == str(team.get("team_leader_id")),
                "joined_at": member.get("joined_at"),
            })
        
        return {
            "status": "success",
            "team": {
                "_id": str(team["_id"]),
                "event_id": team.get("event_id"),
                "team_name": team.get("team_name"),
                "team_leader_id": team.get("team_leader_id"),
                "members": enriched_members,
                "member_count": len(enriched_members),
                "max_size": team.get("size_max", 5),
                "can_add_more": len(enriched_members) < team.get("size_max", 5),
                "status": team.get("status"),
                "created_at": team.get("created_at"),
            }
        }
    except Exception as e:
        print(f"[ERROR] get_team_details: {e}")
        return {"error": str(e)}
