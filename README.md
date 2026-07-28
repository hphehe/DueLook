<div align=center>

# DueLook

AI-powered email productivity for NUS students.

DueLook turns your email inboxes into **clear deadlines, focused workflows, and an actionable plan**.

[Live demo](https://due-look.vercel.app/) · [How it works](#how-it-works) · [Features](#features) · [Setup](#setup) · [How to use](#how-to-use) · [Architecture](#architecture) · [Data privacy](#data-privacy)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)

**National University of Singapore · Orbital 2026**

</div>

---

## Why DueLook

University inboxes mix assignment deadlines, event announcements, administrative notices, internship opportunities, and everyday messages in one stream. Important dates are easy to overlook, while manually copying every task into a separate calendar or to-do app takes time.

DueLook closes that gap. It reads each imported email, identifies what it is about, extracts actionable deadlines, and places it into a backend-controlled workflow. Students can review uncertain results, plan from the Calendar and Panic Board, and manage the full lifecycle without losing the original email context.

---

## How it works

```text
Gmail API / .eml upload
          ↓
Parse and normalize email content
          ↓
OpenAI structured analysis
          ↓
Pydantic validation + confidence routing
          ↓
Backend-enforced workflow state
          ↓
PostgreSQL persistence
          ↓
React inbox, Calendar, and Panic Board
```

| Stage | What happens |
|---|---|
| **Collect** | Sync recent Gmail Primary messages or upload an exported `.eml` file. |
| **Analyze** | OpenAI `gpt-5.4-nano` assigns a category, proposes a workflow tab, and extracts a deadline. |
| **Validate** | Pydantic rejects missing, extra, malformed, or contradictory model fields and retries once. |
| **Route** | The backend applies confidence and deadline rules; raw model output never controls application state directly. |
| **Persist** | The email and its workflow state are stored in user-scoped PostgreSQL records. |
| **Act** | The frontend exposes review, deadline, completion, search, planning, deletion, and recovery tools. |

Every processed email occupies exactly one workflow tab. `Done`, `Missed`, and `Bin` are created only by backend rules or explicit user actions, never by the model.

---

## Features

| Area | Capability |
|---|---|
| **Email collection** | Google OAuth with read-only Gmail sync, plus manual `.eml` import. |
| **AI analysis** | Six student-focused categories, structured deadline extraction, strict response validation, and safe fallback behavior. |
| **Confidence review** | Low-confidence or ambiguous results move to **Needs Review** while preserving the AI suggestion for confirmation or editing. |
| **Workflow management** | Mark done, confirm, dismiss, change status, set or clear deadlines, move to Bin, and recover. |
| **Planning** | A tab-independent Calendar and a configurable Panic Board for overdue or approaching work. |
| **Search and pagination** | Search sender, subject, and body; browse normal inbox views in ten-email pages. |
| **Rich email reader** | Sanitized HTML, safe links and remote images, plain-text fallback, and fullscreen reading. |
| **Accounts and settings** | Email/password sessions, Google sign-in, Gmail connection status, manual sync, Panic Board window, and persistent dark mode. |
| **Duplicate protection** | Server-generated email identity and database conflict handling prevent duplicate records. |
| **Background updates** | Concurrent Gmail analysis, scheduled sync every 15 minutes, and periodic frontend refresh. |

### Workflow tabs

| View | Purpose |
|---|---|
| **All** | Every non-Bin email. |
| **Filtered** | A clear actionable deadline was found. |
| **Needs Review** | The deadline evidence or analysis needs user confirmation. |
| **No Deadline** | No clear actionable deadline was found. |
| **Done** | Work completed by the user. |
| **Missed** | The deadline has passed. |
| **Bin** | Soft-deleted email that can still be recovered. |

---

## Deployment

DueLook is deployed as a complete cloud application.

| Service | Platform |
|---|---|
| **Frontend** | [Vercel](https://due-look.vercel.app/) |
| **Backend** | AWS Elastic Beanstalk behind Amazon CloudFront |
| **Database** | Neon PostgreSQL |
| **CI** | GitHub Actions |

Deployment secrets and connection strings are supplied through environment variables and are not stored in the repository.

---

## Setup

### 1. Install the prerequisites

| Requirement | Purpose |
|---|---|
| **Python 3.11** | FastAPI backend and test suite. |
| **Node.js 20+** | React/Vite frontend. |
| **PostgreSQL** | Application data and sessions. Neon is used by the deployed project. |
| **OpenAI API key** | Email categorization and deadline extraction. |
| **Google Cloud OAuth client** *(optional)* | Google sign-in and read-only Gmail sync. |

### 2. Run the backend

Open PowerShell in the repository root:

```powershell
cd backend
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

On macOS or Linux, activate the environment with:

```bash
source venv/bin/activate
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/database
OPENAI_API_KEY=your_openai_api_key
ALLOWED_ORIGINS=http://localhost:5173
```

To enable Google sign-in and Gmail sync, also add:

```env
GOOGLE_CLIENT_ID=your_google_web_client_id
GOOGLE_CLIENT_SECRET=your_google_web_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_URL=http://localhost:5173
OAUTHLIB_INSECURE_TRANSPORT=1
```

In Google Cloud, enable the Gmail API and add this authorized redirect URI:

```text
http://localhost:8000/auth/google/callback
```

Apply the tracked SQL files in `backend/migrations/` in filename order. For Neon, paste each file into the web SQL Editor and run it there; a local `psql` installation is not required.

Start FastAPI from `backend/`:

```powershell
python -m uvicorn main:app --reload
```

The API runs at <http://localhost:8000>. Interactive documentation is available at <http://localhost:8000/docs>.

### 3. Run the frontend

Open a second terminal in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

The application runs at <http://localhost:5173>. Vite proxies `/auth` and `/emails` to the local backend.

For a separately hosted backend, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

### Optional: run the backend with Docker

Create `backend/.env`, then run:

```powershell
cd backend
docker compose up --build
```

---

## How to use

### Gmail account

1. Open the [live application](https://due-look.vercel.app/) or your local frontend.
2. Select **Sign in with Google**.
3. Grant profile and read-only Gmail permissions.
4. DueLook imports recent Primary inbox messages and analyzes new emails.
5. Select **Sync Gmail** whenever an immediate refresh is needed.

### Manual `.eml` account

1. Register or log in with email and password.
2. Export a message from your email client as an `.eml` file.
3. Select **Import .eml** and choose the file.
4. DueLook parses, analyzes, and routes the message into its workflow tab.

### Manage your inbox

- Select an email to open the full reader.
- Use inline actions to confirm a review or mark work done.
- Right-click an email or its detail view to change status, edit its deadline, or move it to Bin.
- Search across sender, subject, and body content.
- Select a Calendar day to inspect every deadline on that date.
- Use the Panic Board to focus on overdue and approaching work.
- Open Settings to sync Gmail, change the panic window, or switch themes.

---

## Architecture

The backend follows a strict layered boundary:

```text
FastAPI controllers → framework-independent services → repositories → PostgreSQL
```

- **Controllers** handle HTTP input, authentication dependencies, and response codes.
- **Services** contain framework-independent workflow and integration logic.
- **Repositories** contain every SQL query.
- **The backend** owns workflow routing and user isolation.

```text
DueLook/
├── backend/
│   ├── controllers/          # FastAPI routes
│   ├── services/             # Business and integration logic
│   ├── repositories/         # PostgreSQL queries
│   ├── migrations/           # Baseline schema and versioned migrations
│   ├── tests/                # Unit, integration, and end-to-end tests
│   ├── file_parser.py        # .eml parsing
│   ├── email_content.py      # Plain-text and HTML extraction
│   ├── llm_service.py        # OpenAI request, validation, and routing
│   ├── scheduler.py          # Scheduled Gmail sync
│   ├── schemas.py            # Pydantic models
│   └── main.py               # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/       # Inbox, Calendar, Panic Board, reader, and settings
│   │   ├── api.js            # Authenticated API client
│   │   ├── constants.js      # Workflow states and transitions
│   │   ├── theme.js          # Persistent theme preference
│   │   ├── utils.js          # Date and display helpers
│   │   └── App.jsx           # State and application orchestration
│   └── vite.config.js
└── .github/workflows/ci.yml
```

---

## API

All `/emails` routes require a bearer session token.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Health check. |
| `POST` | `/auth/register` | Register with email and password. |
| `POST` | `/auth/login` | Log in with email and password. |
| `GET` | `/auth/me` | Return the authenticated user. |
| `GET` | `/auth/google` | Start Google OAuth. |
| `GET` | `/auth/google/callback` | Complete Google OAuth. |
| `GET` | `/emails` | List emails with optional `tab`, `page`, and `limit`. |
| `GET` | `/emails/search` | Search sender, subject, and body with `q`. |
| `POST` | `/emails/import` | Import and analyze an `.eml` file. |
| `POST` | `/emails/sync-gmail` | Sync the connected Gmail account. |
| `POST` | `/emails/{email_id}/done` | Mark an email done. |
| `POST` | `/emails/{email_id}/confirm` | Confirm a Needs Review result. |
| `POST` | `/emails/{email_id}/dismiss` | Move a review result to No Deadline. |
| `POST` | `/emails/{email_id}/set-tab` | Change to a valid workflow tab. |
| `POST` | `/emails/{email_id}/set-deadline` | Set or clear a deadline. |
| `POST` | `/emails/{email_id}/delete` | Move an email to Bin. |
| `POST` | `/emails/{email_id}/recover` | Recover an email from Bin. |

---

## Testing

With the backend virtual environment active:

```powershell
cd backend
python -m pytest -v
```

Run the frontend tests and production build:

```powershell
cd frontend
npm test
npm run build
```

GitHub Actions runs the backend suite with Python 3.11 and the frontend build with Node.js 24 on pull requests and pushes to `main`.

---

## Data privacy

DueLook requests **read-only Gmail access**. It does not send, modify, or delete messages in Gmail.

When AI analysis is enabled, normalized email content is sent to the configured OpenAI model so DueLook can categorize the message and extract its deadline. Imported email content and workflow state are stored in PostgreSQL for the authenticated account.

Do not connect or upload confidential email without the appropriate authorization. API keys, database URLs, and OAuth credentials must remain in local or deployment environment variables and must never be committed to Git.

---

## Team

- **Hoang Phuong** — A0325491A
- **Nguyen Hoang Thai** — A0325560J

Built for the National University of Singapore's Orbital 2026 programme.
