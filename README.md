# DueLook 🔍
*Let us look for what's due.*

**National University of Singapore — Orbital 2026**
- Hoang Phuong — A0325491A
- Nguyen Hoang Thai — A0325560J

## About

DueLook is a web-based productivity tool for NUS students. It turns a messy
university inbox into an actionable workflow: users export emails from Outlook
as `.eml` files, the backend parses them and uses AI to categorize each email
and extract its deadline, and the React dashboard organizes everything into a
tabbed view so nothing important slips through.

## Features

- **Email import** — upload exported `.eml` files; the backend parses sender,
  subject, date, and body.
- **AI analysis** — Groq (Llama 3.3) assigns a category, sorts each email into a
  tab, and extracts a deadline where one exists.
- **Tabbed dashboard** — emails are grouped into *Filtered*, *Needs Review*,
  *No Deadline*, *Done*, and *Missed*, with an *All* overview.
- **Duplicate-safe** — each email gets a server-computed ID, so re-importing the
  same email won't create duplicates.
- **User accounts** — register / log in; each user only sees their own emails.

## Tech Stack

- **Backend:** Python / FastAPI
- **AI:** Groq API (Llama 3.3 70B)
- **Database:** PostgreSQL
- **Frontend:** React + Vite

## Project Structure

```
backend/
  controllers/      # FastAPI routers (auth, emails) — HTTP layer only
  services/         # business logic (framework-agnostic)
  repositories/     # all database access
  migrations/       # SQL schema (001_init.sql)
  file_parser.py    # .eml parsing
  llm_service.py    # Groq / Llama analysis
  schemas.py        # Pydantic models
  db.py             # PostgreSQL connection pool
  main.py           # app entrypoint
frontend/
  src/
    components/     # AuthForm, Dashboard
    lib/api.js      # API client
    App.jsx         # app shell / routing
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- A [Groq API key](https://console.groq.com) (free)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows (PowerShell)
# source venv/bin/activate   # macOS / Linux
pip install fastapi uvicorn python-multipart groq python-dotenv psycopg2-binary
```

Create a `backend/.env` file:

```
GROQ_API_KEY=your_groq_key_here
DATABASE_URL=postgresql://user:pass@host/dbname
```

Apply the database schema by running `backend/migrations/001_init.sql` against
your PostgreSQL database.

Start the server:

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/auth` and
`/emails` requests to the backend on port 8000.

## Usage

1. Open the frontend, then **register** or **log in**.
2. Export an email from Outlook as a `.eml` file.
3. Click **Upload** in the dashboard and select the `.eml` file.
4. The email is parsed, analyzed by the AI, and placed in the matching tab with
   its category and extracted deadline.

## API Endpoints

| Method | Path              | Description                              |
|--------|-------------------|------------------------------------------|
| POST   | `/auth/register`  | Create an account, returns a token       |
| POST   | `/auth/login`     | Log in, returns a token                  |
| GET    | `/auth/me`        | Current user profile                     |
| POST   | `/emails/import`  | Upload and analyze a `.eml` file         |
| GET    | `/emails`         | List the user's emails (optional `?tab=`)|

Email and auth endpoints require a `Bearer` token in the `Authorization` header.
