# Registration Form Issues - Diagnostic & Fixes

## THE PROBLEM YOU'RE EXPERIENCING

### What Admin Configured:
```
Registration Stage
├─ Name (REQUIRED)
├─ Phone (REQUIRED) 
└─ Email (REQUIRED)
```

### What Students Actually See:
```
Registration (actually showing hardcoded profile fields)
├─ Location (Prefilled: HYDERABAD)
├─ Date of Birth (Prefilled: 26-05-2005)
├─ Gender (Prefilled: FEMALE)
└─ Skills (Prefilled: Core Python, Web Frameworks, ...)
```

**Result**: Admin's required fields NOT visible, student's pre-filled profile data shown instead.

---

## ROOT CAUSE ANALYSIS

There are **THREE SEPARATE ISSUES**:

### Issue 1: Registration Form Fields Not Being Retrieved from Admin Config ❌

**Where It Should Come From**:
- Admin creates event → configures Registration Stage
- Admin defines fields in stage config (Name, Phone, Email, etc.)
- Frontend should fetch `/api/v1/events/{event_id}/stages` 
- Form should render those fields to students

**What's Actually Happening**:
- Frontend is NOT calling the stages API
- Instead, using hardcoded profile fields (Location, DOB, Gender, Skills)
- Admin's registration form config is being IGNORED

### Issue 2: Registration Stage Showing Team Formation ❌

**Current Flow**:
```
Stage 1: "Registration" (but also asks about team formation)
   ├─ Shows registration fields
   └─ Also shows "Team" section (Location, formation info)

Stage 2: "Team" (separate team formation stage)
   └─ Duplicate team formation fields
```

**Problem**: Both stages showing team formation instead of being separate.

### Issue 3: Admin Can't See What Students Submitted ❌

**Missing**:
- No admin endpoint to view registration submissions
- No admin endpoint to see what students filled in each stage
- Admin dashboard has no "View Submissions" button

---

## TECHNICAL ROOT CAUSE

### In Frontend (EventHub.tsx):

```typescript
// PROBLEM: No API call to fetch stage configuration!
// The submission form only shows for SUBMISSION type stages
// REGISTRATION stage fields are not being fetched or rendered

const submissionStage = (event?.stages || []).find(
    (s: any) => s.type?.toUpperCase() === 'SUBMISSION'
);

// Only SUBMISSION stages have dynamic fields
const dynamicFields = submissionStage?.config?.fields || [];
// ❌ REGISTRATION stage fields are NEVER retrieved!
```

**What Should Happen**:
```typescript
// For EACH stage type, fetch its configured fields
const registrationStage = event?.stages?.find(
    (s: any) => s.type?.toUpperCase() === 'REGISTRATION'
);
const registrationFields = registrationStage?.config?.fields || [];

const teamStage = event?.stages?.find(
    (s: any) => s.type?.toUpperCase() === 'TEAM_FORMATION'
);
const teamFields = teamStage?.config?.fields || [];
```

---

## SOLUTION IMPLEMENTATION

### Fix 1: Fetch & Display Admin-Configured Registration Fields

**Backend** - Add endpoint to get stage configuration:

```python
@router.get("/{event_id}/stages/{stage_id}/config")
async def get_stage_config(event_id: str, stage_id: str):
    """Get stage configuration including fields"""
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    stages = event.get("stages", [])
    stage = next((s for s in stages if s.get("id") == stage_id), None)
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    return {
        "stage_id": stage_id,
        "stage_name": stage.get("name"),
        "stage_type": stage.get("type"),
        "description": stage.get("description"),
        "config": stage.get("config", {}),
        "fields": stage.get("config", {}).get("fields", [])
    }
```

**Frontend** - Fetch and render registration fields:

```typescript
// In EventHub.tsx, add a new tab or section for each stage

const registrationStage = event?.stages?.find(
    (s: any) => s.type?.toUpperCase() === 'REGISTRATION'
);

if (registrationStage) {
    const registrationFields = registrationStage?.config?.fields || [];
    
    // Render form for each field
    return (
        <div className="space-y-8">
            <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Validate & submit registration data
                const fieldData = {};
                for (const field of registrationFields) {
                    const value = submissionData[`${registrationStage.id}-${field.id}`];
                    if (field.required && !value) {
                        setSubmissionError(`${field.label} is required`);
                        return;
                    }
                    fieldData[field.id] = value;
                }
                
                // Submit to registration endpoint
                const res = await fetch(
                    `${API_BASE_URL}/api/opportunities/events/${eventId}/stages/${registrationStage.id}/submit`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders() },
                        body: JSON.stringify({ data: fieldData })
                    }
                );
            }}>
                {registrationFields.map((field: any) => (
                    // Render input based on field.type (text, email, phone, etc)
                ))}
                <button type="submit">Submit Registration</button>
            </form>
        </div>
    );
}
```

---

### Fix 2: Separate Registration from Team Formation

**Database Cleanup**:
```python
# In event_routes.py, ensure stages are properly typed:

# ✅ CORRECT structure:
{
    "stages": [
        {
            "id": "stage_1",
            "name": "Registration",
            "type": "REGISTRATION",  # ← NOT mixed with TEAM_FORMATION
            "description": "Fill in your personal info",
            "config": {
                "fields": [
                    {"id": "f1", "label": "Full Name", "type": "text", "required": True},
                    {"id": "f2", "label": "Email", "type": "email", "required": True},
                    {"id": "f3", "label": "Phone", "type": "tel", "required": True}
                ]
            }
        },
        {
            "id": "stage_2",
            "name": "Team Formation",
            "type": "TEAM_FORMATION",  # ← Separate stage
            "description": "Create or join a team",
            "config": {
                "fields": [
                    {"id": "f1", "label": "Team Name", "type": "text", "required": True},
                    {"id": "f2", "label": "Team Size", "type": "number", "required": False}
                ]
            }
        },
        {
            "id": "stage_3",
            "name": "Project Submission",
            "type": "SUBMISSION",
            "config": {
                "fields": [...]
            }
        }
    ]
}
```

---

### Fix 3: Add Admin Endpoint to View Registration Submissions

**Backend** - Add to submission_routes.py or event_routes.py:

```python
@router.get("/{event_id}/stage/{stage_id}/registrations")
async def admin_view_stage_registrations(
    event_id: str,
    stage_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Admin endpoint: View all registration submissions for a stage.
    Returns: List of participants with their submitted registration data
    """
    from db import submissions_col, events_col, users_col, participants_col
    from bson import ObjectId
    
    # Verify event ownership
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event or str(event.get("institution_id")) != str(user.get("institution_id")):
        raise HTTPException(status_code=403, detail="Only event hosts can view registrations")
    
    # Find registrations for this stage
    query = {"event_id": str(event_id), "stage_id": stage_id, "stage_name": "Registration"}
    registrations = []
    
    cursor = submissions_col.find(query).sort("submitted_at", -1)
    async for reg in cursor:
        user_id = reg.get("user_id")
        usr = await users_col.find_one({"user_id": user_id}) if user_id else None
        
        registrations.append({
            "_id": str(reg.get("_id")),
            "user_id": user_id,
            "user_name": usr.get("full_name") if usr else "Unknown",
            "user_email": usr.get("email") if usr else "",
            "submitted_at": reg.get("submitted_at"),
            "data": reg.get("data") or {},  # Contains Name, Phone, Email, etc
            "status": reg.get("status", "submitted")
        })
    
    return {
        "status": "success",
        "event_id": event_id,
        "stage_id": stage_id,
        "total_registrations": len(registrations),
        "registrations": registrations
    }
```

**Frontend** - Add admin dashboard to view:

```typescript
// In institution-dashboard/EventDetails.tsx

const [registrations, setRegistrations] = useState([]);

const loadRegistrations = async () => {
    const res = await fetch(
        `${API_BASE_URL}/api/v1/events/${eventId}/stage/stage_registration/registrations`,
        { headers: authHeaders() }
    );
    if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations);
    }
};

// Render table:
// Name | Email | Phone | Submitted Date | Status
```

---

## DETAILED IMPLEMENTATION STEPS

### Step 1: Verify Event Has Correct Stage Configuration

Check in MongoDB that your event stages are properly separated:

```javascript
db.events.findOne({ "title": "CodeForge 2026" }).stages
```

Should show:
```javascript
[
  {
    "id": "stage_1",
    "name": "Registration",
    "type": "REGISTRATION",
    "config": {
      "fields": [
        { "id": "name", "label": "Full Name", "type": "text", "required": true },
        { "id": "email", "label": "Email", "type": "email", "required": true },
        { "id": "phone", "label": "Phone", "type": "tel", "required": true }
      ]
    }
  },
  {
    "id": "stage_2",
    "name": "Team Formation",
    "type": "TEAM_FORMATION",
    "config": { ... }
  }
]
```

### Step 2: Update Frontend to Fetch Stage Fields

In `EventHub.tsx`, modify the stages rendering to fetch and display configuration for EACH stage type:

```typescript
// Add new state
const [stageConfigs, setStageConfigs] = useState<Record<string, any>>({});

// Fetch all stage configs
useEffect(() => {
    event?.stages?.forEach(async (stage: any) => {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/events/${eventId}/stages/${stage.id}/config`,
            { headers: authHeaders() }
        );
        if (res.ok) {
            const config = await res.json();
            setStageConfigs(prev => ({ ...prev, [stage.id]: config }));
        }
    });
}, [event?.stages]);

// For REGISTRATION stage:
{activeTab === 'registration' && (
    <RegistrationFormComponent
        stage={registrationStage}
        config={stageConfigs[registrationStage.id]}
        onSubmit={handleRegistrationSubmit}
    />
)}
```

### Step 3: Create Separate RegistrationForm Component

```typescript
// RegistrationForm.tsx
interface Props {
    stage: any;
    config: any;
    onSubmit: (data: Record<string, any>) => Promise<void>;
}

export const RegistrationFormComponent: React.FC<Props> = ({
    stage,
    config,
    onSubmit
}) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fields = config?.fields || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        for (const field of fields) {
            if (field.required && !formData[field.id]) {
                setError(`${field.label} is required`);
                return;
            }
        }

        setSubmitting(true);
        try {
            await onSubmit(formData);
            // Success feedback
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-black">{stage.name}</h2>
                <p className="text-slate-600">{stage.description}</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold">
                    {error}
                </div>
            )}

            {fields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                    <label className="font-black uppercase text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                        <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [field.id]: e.target.value
                            }))}
                            placeholder={field.placeholder}
                            className="w-full p-4 border border-slate-200 rounded-2xl"
                        />
                    ) : (
                        <input
                            type={field.type || 'text'}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [field.id]: e.target.value
                            }))}
                            placeholder={field.placeholder}
                            className="w-full p-4 border border-slate-200 rounded-2xl"
                        />
                    )}
                </div>
            ))}

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl disabled:opacity-50"
            >
                {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
        </form>
    );
};
```

### Step 4: Add Admin Dashboard to View Registrations

In `institution-dashboard/EventDetails.tsx`, add a "Registrations" tab:

```typescript
const [registrations, setRegistrations] = useState([]);
const [loading, setLoading] = useState(false);

const loadRegistrations = async (stageId: string) => {
    setLoading(true);
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/events/${eventId}/stage/${stageId}/registrations`,
            { headers: authHeaders() }
        );
        if (res.ok) {
            const data = await res.json();
            setRegistrations(data.registrations);
        }
    } finally {
        setLoading(false);
    }
};

// Render registrations table:
<div className="overflow-x-auto">
    <table className="w-full">
        <thead>
            <tr className="border-b">
                <th className="p-4 text-left font-black">Name</th>
                <th className="p-4 text-left font-black">Email</th>
                <th className="p-4 text-left font-black">Phone</th>
                <th className="p-4 text-left font-black">Submitted</th>
                <th className="p-4 text-left font-black">Status</th>
            </tr>
        </thead>
        <tbody>
            {registrations.map((reg: any) => (
                <tr key={reg._id} className="border-b">
                    <td className="p-4">{reg.user_name}</td>
                    <td className="p-4">{reg.data.email || reg.user_email}</td>
                    <td className="p-4">{reg.data.phone || '—'}</td>
                    <td className="p-4">{new Date(reg.submitted_at).toLocaleDateString()}</td>
                    <td className="p-4">{reg.status}</td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
```

---

## SUMMARY OF CHANGES NEEDED

| Component | Change | Priority | Time |
|-----------|--------|----------|------|
| Frontend EventHub.tsx | Fetch & display stage config fields | CRITICAL | 2 hrs |
| Frontend RegistrationForm.tsx | Create new registration form component | CRITICAL | 1.5 hrs |
| Backend event_routes.py | Add `/stages/{stage_id}/config` endpoint | HIGH | 30 min |
| Backend submission_routes.py | Add `/stage/{stage_id}/registrations` endpoint | HIGH | 45 min |
| Frontend admin dashboard | Add registrations tab/view | HIGH | 1 hr |
| Database | Verify stage separation (Registration vs Team Formation) | CRITICAL | 15 min |

**Total Estimated Work**: 5.5 hours

---

## TESTING CHECKLIST

- [ ] Admin configures Registration stage with Name, Email, Phone fields
- [ ] Admin marks fields as REQUIRED
- [ ] Student opens event → Registration stage shows admin's fields (NOT profile fields)
- [ ] Student fills Name, Email, Phone
- [ ] Student clicks Submit
- [ ] Data saved to submissions collection
- [ ] Admin opens event dashboard → Registrations tab shows all submitted data
- [ ] Admin can see Name, Email, Phone for each registered student
- [ ] Separate "Team Formation" stage shows team fields (not registration fields)
- [ ] Page loads in < 1 second (with caching)

---

## IMMEDIATE ACTION

1. **Check current stage config** - Open MongoDB and verify if stages are separated
2. **If separated correctly**: Implement frontend changes (fetch & display fields)
3. **If mixed**: Update event to have separate stages
4. **Add admin endpoint** to view registrations
5. **Test end-to-end** with a test event

Would you like me to implement these fixes? I can create the updated files now!
