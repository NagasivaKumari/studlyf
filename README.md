# StudLyf v2 - AI-Powered Career Development Platform

StudLyf is a futuristic, AI-driven platform designed to bridge the gap between learning and employment. It now also includes an institutional opportunity portal, eligibility-aware submissions, and a production-style subscription management flow alongside the mock interview system, technical assessment generation, and portfolio/resume builder.

## 🚀 Key Features

### 1. 🎙️ 3-Round Mock Interview System
A comprehensive interview simulation powered by **Groq LLM (Llama 3.3 70B)** and the **Browser Web Speech API**.
- **Round 1: Technical Interview (Text)** - 3 deep-dive technical questions tailored to your role.
- **Round 2: Behavioural Interview (Text)** - 3 situational questions focusing on leadership and STAR methods.
- **Round 3: HR Voice Interview (Voice)** - A hands-free voice round where the AI speaks and listens, simulating a real HR call.
- **Automated Feedback**: Generates a detailed "Clinical Report" with Technical Readiness, Communication scores, and a learning roadmap.

### 2. 📝 AI Assessment Generation
Generates clinical-grade technical MCQ and task-based assessments based on specific company cultures (e.g., Google's DSA focus vs. Amazon's Leadership focus).

### 3. 📄 Smart Resume & Portfolio Builder
- **AI Summary**: Automatically generates impactful summaries.
- **LaTeX PDFs**: Compiles professional-grade PDFs using local or cloud-based LaTeX engines.
- **Glassmorphism Portfolios**: Generates futuristic, interactive web portfolios.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI (Python), MongoDB (Motor).
- **AI**: Groq Cloud (Llama 3.3 70B).
- **Voice**: Web Speech API (Recognition + Synthesis).

### 4. 🏫 Institution Dashboard System
A comprehensive competition management platform for colleges and organizations.
- **Self-Managed Auth (Gmail-Only)**: Fully migrated from Firebase/GitHub to a self-managed, MongoDB-backed authentication system using JWT.
- **Secure Onboarding (OTP)**: Two-step institutional registration flow featuring a cryptographically secure OTP verification system (`secrets` generator) with professional email templates.
- **Strong Password Protocol**: Enforced backend validation (minimum 8 characters) with frontend strength visualization.
- **Backbone Infrastructure**: High-security backend with JWT, RBAC (Role-Based Access Control), and Audit Logging.
- **Smart Management**: Automation for team formation, deadline enforcement, and blind judging.
- **Real-time Analytics**: Live statistics, registration heatmaps, and demographic tracking.

### 5. 🎯 Opportunity Portal, Eligibility & Applications
The learner-facing opportunity portal is now tied to the institutional event lifecycle.
- **Admin eligibility targeting**: Institutions can configure candidate type, eligible organizations/college restrictions, eligible genders, participation type, and min/max team size while creating or editing an opportunity.
- **Server-side enforcement**: Eligibility is validated on the backend before applicants can register or submit portal applications.
- **Submission controls**: Team-only, individual-only, and mixed participation rules are enforced during stage submission, including team-size checks.
- **Submission mirroring**: Stage submissions are mirrored into the portal application pipeline so accepted entries appear in learner-facing "My applications" views.
- **Deadline-aware editing**: Opportunity pages show whether submissions are editable until the deadline or locked after the deadline passes.
- **Legacy backfill**: A migration helper seeds safe defaults for older opportunity records that predate the eligibility fields.

### 6. 💳 Plans & Subscription Management
The institutional plan flow now behaves like a production SaaS subscription workflow rather than a direct plan switch.
- **Plan confirmation modal**: Clicking "Select Plan" opens a review step instead of immediately activating the plan.
- **Pending plan state**: The backend stores a pending plan change until it is confirmed.
- **Demo-mode billing**: Pricing is currently ₹0 for development/testing, but the UI still follows a checkout-style confirmation flow.
- **Active plan status**: The dashboard shows the current plan, subscription status, expiry date, and days remaining.
- **Expiry reminders**: The backend sends email and in-app notifications at 7, 3, and 1 day before expiry, plus when the plan expires.
- **Plan refresh**: The settings page refetches plan and package status after selection so the UI stays in sync.

### 7. ✉️ Communication & Event Email System
Studlyf now includes a production-style notification layer for event and platform workflows.
- **Direct email delivery**: `backend/services/email_service.py` supports SMTP and Resend-style delivery with retry handling and verified sender configuration.
- **Event templates**: The backend includes reusable templates for registration confirmation, team invite, team join, shortlist, certificate, announcement, and participant-facing messages.
- **Deadline reminders**: `backend/services/reminder_service.py` and `backend/services/communication_service.py` schedule reminder emails for judges and participants, including 24h and 1h event reminders.
- **Background dispatch**: Event and notification flows queue email sends asynchronously instead of blocking request handlers.
- **Organizer identity**: Messages are branded as Studlyf notifications sent on behalf of the institution or organizer.

  - **Interactive Command Center & Onboarding**:
    - **High-Fidelity Opportunities Management**: A sophisticated, data-driven table UI for managing competitions, hackathons, and scholarships with advanced filtering by visibility, registration status, and categories.
    - **Premium Onboarding (Dashboard Tour)**: A guided tour featuring smooth animations, clear indicator arrows, and a premium dark-themed interface to onboard new institutional administrators.
    - **Total Brand Synchronisation**: Deep integration of the Studlyf brand purple palette across all interactive elements, including custom card gradients and 3D icons.
    - **Smart Deletion Workflow**: Robust CRUD capabilities with professional confirmation modals and automatic success toast notifications.

### 8. 🏆 Leaderboard & Certification System (Fully Dynamic)
- **Automated Aggregation Engine**: The leaderboard dynamically averages real-time judges' scores the moment an evaluation is finalized.
- **Master Export Engine**: Bulk export capabilities for PDF and CSV, supporting specific event IDs or a "Master Institutional Standings" across all events.
- **Live Rankings & Ticker**: A real-time finalist ticker and high-fidelity podium display that automatically updates without manual entry.
- **QR-Verified Smart Certificates**: Automated PDF generation with unique, cryptographically verifiable IDs triggered instantly upon event finalization.
- **Advanced Reporting Analytics**: Live registration timelines and departmental participation breakdowns with CSV/PDF export capabilities.
- **Multi-Member Team Support**: Certificates are individually generated for every member of a winning team, intelligently adapting between "Ranked" and "Participation" modes based on the event type (Hackathon vs. Workshop).

### 9. 🧑‍🤝‍🧑 Learner Team Hub (Production-ready)
- **Team creation**: Registered learners can create a team for an event (leader auto-assigned).
- **Invite codes**: Team leaders generate time-limited invite codes to share privately.
- **Join by code**: Registered learners can join a team using an invite code (no public member lists).
- **Enforced rules**: Min/max team size and “already in team / not registered” constraints are enforced server-side.

### 10. 🧰 Maintenance Utilities
- **Opportunity eligibility backfill**: `backend/scratch/backfill_opportunity_eligibility_defaults.py` fills missing eligibility fields on older opportunity documents.
- **Expiry checks**: `POST /api/v1/institution/hackathon/check-expiring-plans` triggers the plan reminder sweep for institutions with active subscriptions.

---
## ⚠️ Known Issues & Limitations (For GitHub)

### 1. Browser Speech API Dependencies
- **Browser Compatibility**: The "HR Voice Round" relies on the native `webkitSpeechRecognition`. It is best supported in **Google Chrome** and **Microsoft Edge**. Users on Firefox or Safari may experience limited voice recognition capabilities.
- **Microphone Permissions**: The browser must be granted persistent microphone access. In some environments, the "Auto-Listen" feature may be blocked by strict browser security policies unless the site is served over HTTPS.

### 2. Database Configuration
- **Local Connectivity**: The current backend is configured to look for MongoDB on `localhost:27017`. For production deployment, the `MONGO_URL` in `backend/db.py` needs to be updated to a cloud URI (like MongoDB Atlas).

### 3. PDF Generation (LaTeX)
- **Environment Dependency**: The Resume Builder requires `pdflatex` or `WeasyPrint` dependencies to be installed on the host system. While cloud fallbacks exist, they are subject to external uptime.

### 4. API Rate Limiting
- **Groq Usage**: The platform uses high-token-count models (`llama-3.3-70b-versatile`). Users without a high-tier Groq API key may hit "Rate Limit" errors during peak usage or rapid-fire chat interactions.

### 5. Deployment Constraints
- **CORS Headers**: The backend `main.py` contains some hardcoded origin URIs. These must be updated in `os.getenv("FRONTEND_URL")` before deploying to platforms like Vercel or Render.

---

## ⚙️ Setup Instructions

1. **Environment**: Create a `.env` file in the root with:
   ```env
   GROQ_API_KEY=your_key_here
   MONGO_URL=mongodb://localhost:27017/
   JWT_SECRET_KEY=your_hex_key
   JWT_ALGORITHM=HS256
   ```
2. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
## 🧑‍🤝‍🧑 Teams & Invitations (Learner)

### Learner Team Hub UI
- Open **My applications** → click **Team hub** for a hackathon.
- Route: `/events/:eventId`

### API (JWT required)
- **Get my team for an event**
  - `GET /api/teams/me?event_id=<eventId>`
- **Create team (secure)**
  - `POST /api/teams/create-secure`
  - Body: `{ "event_id": "<eventId>", "team_name": "My Team" }`
- **Generate invite code (leader only)**
  - `POST /api/teams/{team_id}/invites`
  - Body: `{ "ttl_hours": 72 }`
- **Join team by invite**
  - `POST /api/teams/join-by-invite`
  - Body: `{ "code": "<inviteCode>" }`

### Notes
- The legacy endpoints in `backend/main.py` (`/api/teams/create`, `/api/teams/{team_id}/join`) exist, but the UI uses the secure routes above.
- Team features are intended for **team participation** listings; individual participation should not use teams.

---

## 🏫 Institution Dashboard Setup

### 1. 🔐 Security & Env Setup
Add the following to your `.env` file for the self-managed auth system:
```env
SECRET_KEY=your_generated_hex_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DB_NAME=your_db_name
```

### 2. 🏗️ Database Initialization
Run the mandatory index setup script to enforce system constraints (unique emails, user IDs):
```bash
python backend/setup_indexes.py
```

### 3. Production institution & judging (no placeholder IDs)
- **Institution scope**: Every institution admin JWT must include a real `institution_id` (stored on the user document). The dashboard and APIs use that value only—never `user_id` or a fake default—so listings, stats, and notifications stay tenant-scoped.
- **Dashboard stats**: `GET /api/institution/dashboard/stats` requires a Bearer token and the token’s `institution_id` must match the `institution_id` query parameter.
- **Legacy super-admin header**: Routes protected by `X-Admin-Email` allow only emails listed in **`SUPER_ADMIN_EMAILS`** (comma-separated). If unset, no header value is accepted—set this explicitly in production.
- **Judge assignments**: Submissions may include `assigned_judge_emails`. When that list is non-empty, only judges whose **login email** matches an entry can list or score that submission via `GET /api/v1/institution/judge/my-assignments` and `POST /api/v1/institution/judge/score`. When the list is empty, behavior stays backward-compatible (any judge with a token may see submitted rows).
- **Judge invitations**: `POST /api/v1/institution/judge/respond-invitation` with `{ "event_id", "accept" }` updates the event’s judge panel and creates an **in-app institution notification** (navbar bell) when a judge accepts or declines.
- **Admin alerts**: Operations such as judge scoring and invitation responses call `notify_institution`, which stores rows served by `GET /api/v1/institution/notifications/{institution_id}` for the institution navbar.

### 4. Learner Quiz + Visibility + Manual Coding Review
- **Learner quiz page**: `frontend/pages/events/EventQuizPage.tsx` mounted at `GET /events/:eventId/quiz/:quizId`.
- **Visibility lock**: `GET /api/opportunities/events/{event_id}/quizzes/{quiz_id}` enforces stage visibility (`Public`, `Private`, `Shortlisted Only`) before returning quiz payload.
- **Learner submit**: `POST /api/opportunities/events/{event_id}/quizzes/{quiz_id}/submit` auto-scores `SINGLE_CHOICE` and marks `CODING` attempts as `coding_pending_review`.
- **Institution manual coding workflow**:
  - `GET /api/v1/institution/events/{event_id}/quizzes/{quiz_id}/coding-attempts`
  - `POST /api/v1/institution/events/{event_id}/quizzes/{quiz_id}/coding-attempts/{participant_user_id}/evaluate`
- **Institution UI**: The `Assessments` tab in `EventDetails.tsx` now includes a pending coding review list with evaluate actions.

### 5. Subscription Workflow Notes
- The current plan flow is intentionally demo-friendly: all plans are priced at ₹0 during development, but the UI still uses a confirmation-first pattern.
- Plan selection creates a pending plan change, and activation happens only after explicit confirmation.
- The plan dashboard shows current subscription state, expiry, days remaining, and pending plan changes when present.
- The backend sends expiry reminders at 7, 3, and 1 day before expiration, plus an expired notice, and logs in-app notifications for the same events.

### 6. Authentication Hardening
- Login now supports safe migration for legacy plaintext password rows: if legacy match succeeds, the password is immediately re-hashed and stored using the secure hash flow.
- For institution users missing `institution_id`, login attempts automatic institution resolution and persists the resolved `institution_id` to prevent dashboard/notification scope issues.
- Login now tolerates legacy email formatting in DB (case/whitespace) and normalizes successful accounts back to canonical lowercase email.
- One-time user cleanup tool: `python backend/normalize_auth_users.py --dry-run` (preview) then `python backend/normalize_auth_users.py --apply` to normalize emails/passwords and report duplicate canonical emails.
