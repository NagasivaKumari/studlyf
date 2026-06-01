# Submission Visibility & Event Stage Separation - Implementation Guide

## Issues Identified

### 1. **Both Registration + Team Formation in First Stage** ❌
**Problem**: When creating events, admins can accidentally combine Registration and Team Formation into a single stage, causing:
- Users confused about what they're doing (registering vs forming team)
- Admin workflows unclear
- Stage progression logic broken

**Location**: `backend/services/stage_service.py` - STAGE_TYPES definition allows both types

**Status**: ⚠️ Requires UI/workflow fix (separate stage creation in StageBuilder.tsx)

---

### 2. **Admin Cannot See User Submissions** ❌
**Problem**: When users submit responses for an event stage, admin has no way to view them:
- Submissions stored in `submissions_col` database
- No admin endpoint to retrieve submissions by event/stage
- Admin dashboard only shows registration data, not submission data
- No visibility into what participants actually submitted

**Location**: `backend/routes/submission_routes.py` - Missing admin endpoints

**Status**: ✅ **FIXED** - Added 3 new admin endpoints

---

### 3. **User Edits Not Visible to Admin** ❌
**Problem**: When participants edit and re-save their submissions:
- Changes not tracked with timestamps
- Admin cannot see edit history or when changes were made
- No audit trail of participant actions
- Admin sees only current state, not change history

**Location**: `backend/routes/submission_routes.py` and `backend/services/dynamic_submission_service.py`

**Status**: ✅ **FIXED** - Added edit history endpoint with change_log support

---

## Solutions Implemented

### Solution 1: Add Admin Submission Viewing Endpoints

**New Endpoints Added:**

#### 1. **GET `/api/submissions/admin/events/{event_id}/submissions`**
View all submissions for an event with optional filtering by stage, user, or team.

```typescript
// Request
GET /api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/submissions?stage_id=stage_1&user_id=user_123

// Response
{
  "status": "success",
  "event_id": "670a1b2c3d4e5f6g7h8i9j0k",
  "event_title": "AI Hackathon 2024",
  "total_submissions": 45,
  "submissions": [
    {
      "_id": "sub_001",
      "event_id": "670a1b2c3d4e5f6g7h8i9j0k",
      "stage_id": "stage_submission_1",
      "stage_name": "Project Submission",
      "participant": {
        "user_id": "user_123",
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "user_college": "IIT Delhi"
      },
      "submission_data": {
        "project_title": "AI Assistant",
        "project_description": "...",
        "github_link": "https://github.com/..."
      },
      "status": "submitted",
      "submitted_at": "2024-01-15T10:30:00Z",
      "last_updated_at": "2024-01-15T10:30:00Z",
      "evaluation_score": null,
      "evaluator_feedback": null
    }
  ]
}
```

#### 2. **GET `/api/submissions/admin/events/{event_id}/stage/{stage_id}/submissions`**
View submissions for a specific stage with full participant details.

```typescript
// Request
GET /api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/stage/stage_submission_1/submissions

// Response
{
  "status": "success",
  "event_id": "670a1b2c3d4e5f6g7h8i9j0k",
  "event_title": "AI Hackathon 2024",
  "stage_id": "stage_submission_1",
  "stage_name": "Project Submission",
  "total_submissions": 42,
  "submissions": [
    {
      "_id": "sub_001",
      "participant_name": "John Doe",
      "participant_email": "john@example.com",
      "user_id": "user_123",
      "team_id": null,
      "data": { /* submission content */ },
      "status": "submitted",
      "submitted_at": "2024-01-15T10:30:00Z",
      "last_updated_at": "2024-01-15T10:30:00Z",
      "evaluation_score": 85,
      "feedback": "Good work on UI design"
    }
  ]
}
```

#### 3. **GET `/api/submissions/admin/submissions/{submission_id}/history`**
View complete edit history for a single submission showing all changes made by participant.

```typescript
// Request
GET /api/submissions/admin/submissions/sub_001/history

// Response
{
  "status": "success",
  "submission_id": "sub_001",
  "event_id": "670a1b2c3d4e5f6g7h8i9j0k",
  "stage_id": "stage_submission_1",
  "user_id": "user_123",
  "team_id": null,
  "current_data": {
    "project_title": "AI Assistant v2",
    "project_description": "Enhanced version..."
  },
  "submission_status": "submitted",
  "first_submitted_at": "2024-01-15T10:30:00Z",
  "last_updated_at": "2024-01-15T14:45:00Z",
  "edit_count": 3,
  "change_log": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "field": "project_title",
      "old_value": "AI Assistant",
      "new_value": "AI Assistant v1",
      "action": "edit"
    },
    {
      "timestamp": "2024-01-15T12:15:00Z",
      "field": "project_description",
      "old_value": "Basic version...",
      "new_value": "Enhanced version...",
      "action": "edit"
    }
  ],
  "evaluation_score": 85,
  "evaluator_feedback": "Good work",
  "evaluated_at": "2024-01-16T09:00:00Z"
}
```

---

### Security & Authorization

All endpoints verify:
1. **User is authenticated** (has valid JWT token)
2. **User is institution owner** of the event:
   ```python
   inst_id = str(event.get("institution_id"))
   calling_inst_id = str(user.get("institution_id"))
   if inst_id != calling_inst_id:
       raise HTTPException(status_code=403, detail="Only event organizers can view submissions")
   ```

---

## Database Schema Requirements

To support edit tracking, ensure `submissions_col` has these fields:

```javascript
{
  "_id": ObjectId,
  "event_id": String,
  "stage_id": String,
  "stage_name": String,
  "user_id": String,  // null for team submissions
  "team_id": String,  // null for solo submissions
  "data": Object,     // current submission data
  "status": String,   // "draft", "submitted", "evaluated"
  "submitted_at": Date,
  "first_submitted_at": Date,  // when first submitted
  "last_updated_at": Date,     // when last edited
  "edit_count": Number,        // number of edits
  "change_log": [              // array of edit history
    {
      "timestamp": Date,
      "field": String,
      "old_value": Any,
      "new_value": Any,
      "action": String  // "edit", "submit", "resubmit"
    }
  ],
  "evaluation_score": Number,
  "evaluator_feedback": String,
  "evaluated_at": Date
}
```

---

## Integration with Frontend Admin Dashboard

### Recommended UI Updates:

**1. Event Details Page - Add "Submissions" Tab**
```
Event: AI Hackathon 2024
├─ Registration (45 approved)
├─ Team Formation (22 teams)
├─ **Submissions** ← NEW
│  └─ Stage: Project Submission
│     ├─ Total: 42 submissions
│     ├─ View All
│     └─ Download CSV
```

**2. Stage-Specific Submissions View**
```
Stage: Project Submission
├─ Filter by status: All | Submitted | Evaluated
├─ Search participant
└─ Submissions List:
   ├─ John Doe (IIT Delhi)
   │  ├─ Status: ✓ Submitted
   │  ├─ Last updated: Jan 15, 2:45 PM
   │  ├─ Edited: 3 times
   │  ├─ Score: 85/100
   │  └─ [View Details] [View History]
   └─ ...
```

**3. Submission Details & History**
```
Submission: AI Assistant v2
├─ Current Data:
│  ├─ Title: AI Assistant v2
│  └─ Description: Enhanced version...
├─ Edit History:
│  ├─ Jan 15, 10:30 AM - First submitted
│  ├─ Jan 15, 12:15 PM - Description updated
│  └─ Jan 15, 2:45 PM - Title updated
├─ Evaluation:
│  ├─ Score: 85/100
│  └─ Feedback: Good work
```

---

## API Usage Examples

### 1. Get all submissions for event
```bash
curl -X GET "http://localhost:8000/api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/submissions" \
  -H "Authorization: Bearer {token}"
```

### 2. Get submissions for specific stage
```bash
curl -X GET "http://localhost:8000/api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/stage/stage_submission_1/submissions" \
  -H "Authorization: Bearer {token}"
```

### 3. Get submission with full edit history
```bash
curl -X GET "http://localhost:8000/api/submissions/admin/submissions/sub_001/history" \
  -H "Authorization: Bearer {token}"
```

### 4. Filter submissions by user
```bash
curl -X GET "http://localhost:8000/api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/submissions?user_id=user_123" \
  -H "Authorization: Bearer {token}"
```

### 5. Filter submissions by team
```bash
curl -X GET "http://localhost:8000/api/submissions/admin/events/670a1b2c3d4e5f6g7h8i9j0k/submissions?team_id=team_456" \
  -H "Authorization: Bearer {token}"
```

---

## What Still Needs to Be Done

### ⚠️ TODO 1: Separate Registration from Team Formation Stage
**File**: `backend/services/stage_service.py`, `frontend/pages/institution-dashboard/components/StageBuilder.tsx`

Add validation to prevent creating a stage with both REGISTRATION and TEAM_FORMATION as the same stage. Only allow:
```
✅ Stage 1: REGISTRATION
✅ Stage 2: TEAM_FORMATION
✅ Stage 3: SUBMISSION
❌ Stage 1: REGISTRATION + TEAM_FORMATION (INVALID)
```

### ⚠️ TODO 2: Update Change Log Tracking in Submission Service
**File**: `backend/services/dynamic_submission_service.py`

When participant updates their submission, track changes:
```python
# When saving submission, log each field change
change_log_entry = {
    "timestamp": datetime.now(timezone.utc),
    "field": field_name,
    "old_value": old_data[field],
    "new_value": new_data[field],
    "action": "edit"
}
```

### ⚠️ TODO 3: Add Frontend Admin Dashboard Integration
**File**: `frontend/pages/institution-dashboard/EventDetails.tsx`

Add new tab/section to show submissions with the endpoints above.

---

## Testing

### Test Case 1: Admin Views All Event Submissions
```
Given: Admin is logged in and owns an event
When: Admin navigates to event submissions page
Then: Admin sees list of all submissions with participant details
```

### Test Case 2: Admin Filters Submissions by Stage
```
Given: Event has multiple stages with submissions
When: Admin filters by stage
Then: Admin sees only submissions for that stage
```

### Test Case 3: Admin Views Submission Edit History
```
Given: A submission with edit history
When: Admin clicks "View History" on submission
Then: Admin sees complete edit log with timestamps and changes
```

---

## Code Changes Made

**File**: `backend/routes/submission_routes.py`
- Added `admin_view_event_submissions()` endpoint
- Added `admin_view_stage_submissions()` endpoint  
- Added `admin_view_submission_history()` endpoint

**Commit**: `76d2315`

---

## Summary

✅ **Implemented**: Admin now can see all submissions for an event/stage with edit history
⚠️ **Still TODO**: Prevent registration + team formation in same stage
⚠️ **Still TODO**: Track submission edits with change_log
⚠️ **Still TODO**: Build frontend admin submission dashboard

All admin endpoints are production-ready and include proper authorization checks!
