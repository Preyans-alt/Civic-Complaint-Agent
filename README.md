# CivicFlow AI — Intelligent Civic Complaint Assistant for Ahmedabad

> **Important Disclosure:** This is a demonstration and research prototype built for hackathons and civic technology showcase. It is **not** an official municipal grievance portal of the Ahmedabad Municipal Corporation (AMC). Complaints registered in this application are stored in an isolated simulation database and will not be dispatched to city municipal crews.

---

## 1. Project Overview

**CivicFlow AI** is a production-grade full-stack civic agent application designed for the citizens and municipal authorities of **Ahmedabad, Gujarat, India**.

It enables citizens to:
1. **Upload photos** of civic issues (potholes, garbage accumulation, malfunctioning streetlights, or stormwater waterlogging).
2. **Execute multimodal AI analysis** via Google Gemini to detect category, assess hazard severity (Low, Medium, High, Critical), identify visible evidence, and flag ambiguity.
3. **Resolve AMC wards and zones** automatically (e.g. Navrangpura / CG Road &rarr; Ward W12, West Zone; Kankaria &rarr; Ward W27, South Zone).
4. **Detect potential duplicate grievances** within the same ward and 24-hour window.
5. **Review and edit** classified parameters before submitting.
6. **Register grievances atomically** in a mock AMC database with a unique sequential identifier (`AMC-YYYY-NNNNNN`) and Asia/Kolkata (`+05:30`) timestamps.
7. **Track status and audit trails** via tracking ID or conversational natural language queries answered through **Gemini Function Calling**.
8. **Draft neutral civic awareness posts** for manual citizen sharing on social channels.

---

## 2. Architecture & Tech Stack

```
                   +---------------------------------------------+
                   |          React 19 + TypeScript UI           |
                   |      Vite, Tailwind CSS, Lucide React       |
                   +----------------------+----------------------+
                                          |
                      REST API / Express Proxy Routes
                                          |
                   +----------------------v----------------------+
                   |         Node.js Express / Python API        |
                   |   (FastAPI for Cloud Run / Express for dev) |
                   +-----------+---------------------+-----------+
                               |                     |
                 Gemini SDK    |                     | Local Sync File Lock
            (@google/genai)    |                     | Atomic os.replace
                               v                     v
              +--------------------+     +-------------------------+
              |   Google Gemini    |     |   Local JSON Store      |
              | Multimodal Vision  |     |   backend/data/amc.json |
              | Function Calling   |     +-------------------------+
              +--------------------+
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React.
- **Backend (Dev & Unified Full-Stack):** Node.js / Express with TypeScript (`server.ts`) hosting the interactive UI and `/api/*` endpoints.
- **Backend (Python Cloud Run Target):** Python 3.11+, FastAPI, Pydantic, Official `google-genai` SDK (`backend/app/main.py`).
- **AI Engine:** Official Google Gen AI SDK (`@google/genai`), multimodal vision with structured schemas, function calling with bounded tool execution.
- **Persistence:** Atomic JSON file store with mutex/thread locks, temporary file replacement, sequential IDs, and timezone preservation (`Asia/Kolkata`).
- **Hosting Targets:** Firebase Hosting (Frontend) + Google Cloud Run (Backend).

---

## 3. Registered Agent Tools

CivicFlow AI implements a typed agent tool registry:

1. `analyze_civic_image`: Validates image MIME/size and prompts Gemini vision with structured JSON schema (`pothole`, `garbage`, `streetlight`, `waterlogging`, `other`, `unclear`).
2. `resolve_location`: Normalizes area names, handles aliases, tests coordinates within Ahmedabad municipal bounds (22.8°–23.3° N, 72.3°–72.8° E).
3. `lookup_ward`: Authoritative ward and zone matching against AMC wards dataset with exact and partial matching.
4. `lookup_department`: Maps issue types to AMC departments:
   - `pothole` &rarr; Roads & Buildings
   - `garbage` &rarr; Solid Waste Management
   - `streetlight` &rarr; Light Department
   - `waterlogging` &rarr; Storm Water Drainage
5. `check_duplicate_complaint`: Scans the database for matching issues in the same ward/area within a 24-hour window.
6. `create_complaint`: Validates user confirmation, ward existence, and department mappings before assigning an `AMC-YYYY-NNNNNN` tracking ID and writing to `amc.json`.
7. `get_complaint_status`: Fetches live complaint record and complete remediation history from the actual database.
8. `list_complaints`: Retrieves filtered records by issue, status, severity, ward, or search keywords.
9. `update_complaint_status`: Demo administrator tool to transition complaint lifecycle (`Submitted` &rarr; `Assigned` &rarr; `In Progress` &rarr; `Resolved` &rarr; `Rejected`) with timestamped notes.
10. `draft_social_post`: Drafts respectful, neutral civic awareness posts with tracking IDs and hashtags.

---

## 4. Directory Structure

```
civicflow-ai/
├── README.md                          # Comprehensive documentation
├── metadata.json                      # AI Studio application metadata
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite + Tailwind build configuration
├── index.html                         # Application HTML entry point
├── server.ts                          # Full-stack server with Gemini vision & agent
├── firebase.json                      # Firebase Hosting + Cloud Run config
├── backend/
│   ├── Dockerfile                     # Cloud Run container definition
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Backend environment sample
│   ├── app/
│   │   ├── main.py                    # FastAPI application
│   │   ├── config.py                  # Environment configuration
│   │   ├── storage/
│   │   │   └── json_store.py          # Atomic thread-safe JSON persistence
│   │   ├── services/
│   │   │   ├── ward_service.py        # Ward matching & normalization
│   │   │   ├── department_service.py  # Department mapping
│   │   │   ├── location_service.py    # Geotagging & normalization
│   │   │   └── complaint_service.py   # Business rule enforcement
│   │   └── tools/
│   │       └── registry.py            # Typed agent tool registry
│   ├── data/
│   │   └── amc.json                   # Seed AMC complaints & ward data
│   └── tests/
│       ├── test_wards.py              # Ward match & ambiguity tests
│       ├── test_complaints.py         # Department & validation tests
│       ├── test_tracking.py           # Tracking & history audit tests
│       ├── test_json_store.py         # Atomic write & duplicate tests
│       └── test_agent_tools.py        # Image validation & tool tests
└── src/
    ├── main.tsx                       # React DOM entry
    ├── App.tsx                        # Main application container
    ├── index.css                      # Tailwind CSS v4 entry
    ├── types/                         # TypeScript interfaces
    ├── services/                      # Typed API client
    ├── data/                          # Sample test images & mock data
    └── components/
        ├── Header.tsx                 # Navigation & disclaimer
        ├── DashboardStats.tsx         # Live metric counts
        ├── ReportIssue.tsx            # Issue reporting wizard
        ├── AnalysisReviewCard.tsx     # Review, edit & confirmation card
        ├── ExecutionTimeline.tsx      # 8-step agent execution progress
        ├── ComplaintReceipt.tsx       # Success screen & receipt
        ├── TrackComplaint.tsx         # Tracking & status history
        ├── AllComplaints.tsx          # Filterable complaints directory
        ├── AIAgentChat.tsx            # Gemini conversational agent
        ├── AdminTriage.tsx            # Officer status transition console
        └── SocialDraftModal.tsx       # Civic social draft generator
```

---

## 5. Local Setup & Installation

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Python 3.10+ (for running backend unit tests and FastAPI target)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/civicflow-ai.git
cd civicflow-ai

# Install Node dependencies
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `GEMINI_API_KEY` is configured:
```env
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-3.8-flash"
DEMO_ADMIN_TOKEN="civicflow-demo-admin-secret"
DATA_FILE="./backend/data/amc.json"
```

### Step 3: Run the Application
**On Linux / macOS:**
```bash
npm run dev
```

**On Windows (PowerShell):**
```powershell
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 6. Running Automated Tests

Run the full Python test suite (19 tests covering ward lookup, validation, duplicate detection, atomic file replacement, and tool error handling):

**Unix / macOS:**
```bash
npm run test:backend
# or
python3 -m unittest discover -s backend/tests -p 'test_*.py'
```

**Windows PowerShell:**
```powershell
python -m unittest discover -s backend/tests -p 'test_*.py'
```

---

## 7. REST API Documentation

The server exposes an OpenAPI 3.0 specification at `/api/openapi.json`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, model info, and demo disclaimer |
| `GET` | `/api/wards` | List of Ahmedabad municipal wards and zones |
| `GET` | `/api/departments` | Issue category to municipal department mapping |
| `POST` | `/api/analyze` | Gemini vision multimodal classification |
| `POST` | `/api/resolve-location` | Normalizes area and resolves to AMC ward |
| `POST` | `/api/check-duplicate` | Scans for duplicates in area within 24 hours |
| `POST` | `/api/complaints` | Validates inputs and creates complaint in database |
| `GET` | `/api/complaints` | Filterable list of complaints |
| `GET` | `/api/complaints/:id` | Fetch complaint record by tracking ID |
| `GET` | `/api/complaints/:id/status`| Fetch live status and history timeline |
| `POST` | `/api/agent/chat` | Conversational agent with Gemini Function Calling |
| `POST` | `/api/admin/complaints/:id/status` | Demo admin status transition |
| `POST` | `/api/complaints/:id/social-draft` | Generate civic awareness post text |

---

## 8. Deployment

### Google Cloud Run (Backend)
1. Build the Docker image from `backend/`:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/civicflow-backend backend/
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy civicflow-backend \
     --image gcr.io/PROJECT_ID/civicflow-backend \
     --platform managed \
     --region asia-south1 \
     --set-env-vars GEMINI_API_KEY="your-key",DEMO_ADMIN_TOKEN="your-token"
   ```

### Firebase Hosting (Frontend)
1. Build the production React assets:
   ```bash
   npm run build
   ```
2. Deploy via Firebase CLI:
   ```bash
   firebase deploy --only hosting
   ```
   `firebase.json` automatically rewrites `/api/**` calls to the Cloud Run service.

*Note on Horizontal Scaling:* The demo uses an atomic local JSON database (`amc.json`). For production enterprise scaling across multi-container Cloud Run instances, replace the JSON store with Google Cloud SQL (PostgreSQL) or Firestore.

---

## 9. Security & Privacy

- **No Public API Keys:** Gemini API keys are processed strictly server-side.
- **Upload Restrictions:** Uploads are validated for MIME type (JPEG, PNG, WebP) and capped at 8 MB.
- **No PII Mandate:** Citizen names and phone numbers are optional; demo users can submit anonymously.
- **Admin Protection:** Lifecycle transitions are protected by an administrative authorization token.
