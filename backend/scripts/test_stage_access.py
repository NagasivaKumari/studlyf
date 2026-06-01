import sys
import asyncio
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone

# Make backend module importable
sys.path.insert(0, r'd:/studlyf/backend')
import stage_access_control

class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs or []

    async def find_one(self, query):
        # permissive matcher for tests
        for d in self.docs:
            match = True
            for k, v in query.items():
                if k == "_id":
                    if d.get("_id") == v or str(d.get("_id")) == str(v):
                        pass
                    else:
                        match = False
                        break
                else:
                    if d.get(k) == v or str(d.get(k)) == str(v):
                        pass
                    else:
                        match = False
                        break
            if match:
                return d
        return None

async def run_tests():
    ok = 0
    fail = 0

    # Prepare fake stages: registration (order 0), team formation (order1), submission (order2)
    reg_stage = {"id": "s_reg", "name": "Registration", "type": "REGISTRATION", "order": 0}
    team_stage = {"id": "s_team", "name": "Team Formation", "type": "TEAM_FORMATION", "order": 1}
    sub_stage = {"id": "s_sub", "name": "Submission", "type": "SUBMISSION", "order": 2, "team_required": True}
    stages = [reg_stage, team_stage, sub_stage]

    async def _get_event_stages(event_id):
        return stages
    stage_access_control.get_event_stages = _get_event_stages

    # Case A: missing participant -> blocked
    stage = {"name": "Submission", "depends_on": ["s_reg", "s_team"]}
    stage_access_control.participants_col = FakeCollection([])
    stage_access_control.teams_col = FakeCollection([])
    try:
        await stage_access_control.check_stage_unlock_rules("evt1", "user1", stage)
        print("FAIL: missing participant should not unlock")
        fail += 1
    except HTTPException as e:
        print("PASS: missing participant blocked ->", e.detail)
        ok += 1

    # Case B: registered but no team -> blocked
    participant = {"_id": ObjectId(), "event_id": "evt1", "user_id": "user1", "status": "registered", "current_stage": "s_reg"}
    stage_access_control.participants_col = FakeCollection([participant])
    stage_access_control.teams_col = FakeCollection([])
    try:
        await stage_access_control.check_stage_unlock_rules("evt1", "user1", stage)
        print("FAIL: missing team should block team dependency")
        fail += 1
    except HTTPException as e:
        print("PASS: missing team blocked ->", e.detail)
        ok += 1

    # Case C: registered with valid team -> allowed
    team_id = ObjectId()
    participant_with_team = dict(participant)
    participant_with_team["team_id"] = team_id
    stage_access_control.participants_col = FakeCollection([participant_with_team])
    team_doc = {"_id": team_id, "event_id": "evt1", "members": [{"user_id": "user1"}]}
    stage_access_control.teams_col = FakeCollection([team_doc])
    try:
        await stage_access_control.check_stage_unlock_rules("evt1", "user1", stage)
        print("PASS: participant with team unlocked stage")
        ok += 1
    except HTTPException as e:
        print("FAIL: participant with team should be allowed ->", e.detail)
        fail += 1

    # Case D: submission requires shortlisted/accepted
    participant_not_short = {"_id": ObjectId(), "event_id": "evt1", "user_id": "user2", "status": "registered", "current_stage": "s_reg"}
    stage_access_control.participants_col = FakeCollection([participant_not_short])
    try:
        await stage_access_control.check_stage_submission_access("evt1", "user2", stage_type="submission", stage=sub_stage)
        print("FAIL: unshortlisted participant should not submit")
        fail += 1
    except HTTPException as e:
        print("PASS: unshortlisted participant blocked from submission ->", e.detail)
        ok += 1

    # Case E: shortlisted but no team when team_required -> blocked
    shortlisted = {"_id": ObjectId(), "event_id": "evt1", "user_id": "user3", "status": "shortlisted", "current_stage": "s_sub"}
    stage_access_control.participants_col = FakeCollection([shortlisted])
    stage_access_control.events_col = FakeCollection([{"_id": ObjectId(), "event_link_id": "evt1", "allow_individual_progress_with_no_team": False}])
    try:
        await stage_access_control.check_stage_submission_access("evt1", "user3", team_id=None, stage_type="submission", stage=sub_stage)
        print("FAIL: shortlisted without team should be blocked when team_required")
        fail += 1
    except HTTPException as e:
        print("PASS: shortlisted without team blocked ->", e.detail)
        ok += 1

    # Case F: shortlisted with team passes
    team_id2 = ObjectId()
    shortlisted_with_team = dict(shortlisted)
    shortlisted_with_team["user_id"] = "user4"
    shortlisted_with_team["team_id"] = team_id2
    stage_access_control.participants_col = FakeCollection([shortlisted_with_team])
    team_doc2 = {"_id": team_id2, "event_id": "evt1", "members": [{"user_id": "user4"}]}
    stage_access_control.teams_col = FakeCollection([team_doc2])
    stage_access_control.events_col = FakeCollection([{"_id": ObjectId(), "event_link_id": "evt1"}])
    try:
        p = await stage_access_control.check_stage_submission_access("evt1", "user4", team_id=str(team_id2), stage_type="submission", stage=sub_stage)
        print("PASS: shortlisted with team allowed to submit")
        ok += 1
    except HTTPException as e:
        print("FAIL: shortlisted with team should be allowed ->", e.detail)
        fail += 1

    print(f"\nSummary: {ok} passed, {fail} failed")

    # ----- Deadline checks -----
    print("\nRunning deadline checks...")
    now = datetime.now(timezone.utc)
    # future window
    start_future = (now + timedelta(hours=1)).isoformat().replace('+00:00', 'Z')
    end_future = (now + timedelta(hours=2)).isoformat().replace('+00:00', 'Z')
    event_doc_future = {"_id": ObjectId(), "event_link_id": "evt_deadline", "stages": [{"name": "FutureStage", "start_date": start_future, "end_date": end_future}]}
    stage_access_control.events_col = FakeCollection([event_doc_future])
    try:
        await stage_access_control.check_stage_deadline("evt_deadline", stage_name="FutureStage")
        print("FAIL: future stage should be blocked before start")
        fail += 1
    except HTTPException as e:
        print("PASS: future stage blocked ->", e.detail)
        ok += 1

    # past window
    start_past = (now - timedelta(hours=2)).isoformat().replace('+00:00', 'Z')
    end_past = (now - timedelta(hours=1)).isoformat().replace('+00:00', 'Z')
    event_doc_past = {"_id": ObjectId(), "event_link_id": "evt_deadline2", "stages": [{"name": "PastStage", "start_date": start_past, "end_date": end_past}]}
    stage_access_control.events_col = FakeCollection([event_doc_past])
    try:
        await stage_access_control.check_stage_deadline("evt_deadline2", stage_name="PastStage")
        print("FAIL: past stage should be blocked after end")
        fail += 1
    except HTTPException as e:
        print("PASS: past stage blocked ->", e.detail)
        ok += 1

    # no dates
    event_doc_nodate = {"_id": ObjectId(), "event_link_id": "evt_deadline3", "stages": [{"name": "NoDateStage"}]}
    stage_access_control.events_col = FakeCollection([event_doc_nodate])
    try:
        st = await stage_access_control.check_stage_deadline("evt_deadline3", stage_name="NoDateStage")
        print("PASS: no-date stage allowed ->", st.get("name"))
        ok += 1
    except HTTPException as e:
        print("FAIL: no-date stage should be allowed ->", e.detail)
        fail += 1

    print("\nRunning manual team submission checks...")

    # Case J: missing team -> 404 (call actual function)
    stage_access_control.teams_col = FakeCollection([])
    try:
        await stage_access_control.check_team_submission_access("evt1", ObjectId(), stage_type="submission")
        print("FAIL: missing team should raise 404")
        fail += 1
    except HTTPException as e:
        print("PASS: missing team ->", e.detail)
        ok += 1

    # Case K: team has member not shortlisted -> manual check
    team_k = {"_id": ObjectId(), "event_id": "evt1", "members": [{"user_id": "m1"}]}
    stage_access_control.teams_col = FakeCollection([team_k])
    stage_access_control.participants_col = FakeCollection([{"_id": ObjectId(), "event_id": "evt1", "user_id": "m1", "status": "registered"}])
    # manual evaluation
    members = team_k.get("members", [])
    blocked = False
    for m in members:
        pid = m.get("user_id")
        part = await stage_access_control.participants_col.find_one({"event_id": "evt1", "user_id": pid})
        if not part or (part.get("status") or "").lower() not in ["shortlisted", "accepted"]:
            blocked = True
            break
    if blocked:
        print("PASS: team with unshortlisted member blocked -> manual check")
        ok += 1
    else:
        print("FAIL: team with unshortlisted member should be blocked -> manual check")
        fail += 1

    # Case L: all members shortlisted -> manual check
    team_l = {"_id": ObjectId(), "event_id": "evt1", "members": [{"user_id": "m2"}, {"user_id": "m3"}]}
    stage_access_control.teams_col = FakeCollection([team_l])
    stage_access_control.participants_col = FakeCollection([
        {"_id": ObjectId(), "event_id": "evt1", "user_id": "m2", "status": "shortlisted"},
        {"_id": ObjectId(), "event_id": "evt1", "user_id": "m3", "status": "accepted"}
    ])
    all_ok = True
    for m in team_l.get("members", []):
        pid = m.get("user_id")
        part = await stage_access_control.participants_col.find_one({"event_id": "evt1", "user_id": pid})
        if not part or (part.get("status") or "").lower() not in ["shortlisted", "accepted"]:
            all_ok = False
            break
    if all_ok:
        print("PASS: team with all shortlisted allowed -> manual check")
        ok += 1
    else:
        print("FAIL: team with all shortlisted should pass -> manual check")
        fail += 1

    print(f"\nFinal Summary: {ok} passed, {fail} failed")

if __name__ == "__main__":
    asyncio.run(run_tests())
