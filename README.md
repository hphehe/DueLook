# DueLook 🔍
*Let us look for what's due.*

**National University of Singapore - Orbital 2026**
- Hoang Phuong - A0325491A
- Nguyen Hoang Thai - A0325560J

## About

DueLook is a web-based productivity tool for NUS students. It transforms a messy university inbox into an actionable workflow by parsing exported emails, extracting deadlines using AI, and organizing them into a five-tab UI.

## Tech Stack

- **Backend:** Python / FastAPI
- **AI:** Groq API (Llama 3.3)
- **Database:** PostgreSQL
- **Frontend:** React.js

## Getting Started

### Prerequisites

- Python 3.11+
- A [Groq API key](https://console.groq.com) (free)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn python-multipart groq python-dotenv psycopg2-binary
```

Create a `backend/.env` file:
```
GROQ_API_KEY=your_groq_key_here
DATABASE_URL=postgresql://user:pass@host/dbname
```

Start the server:
```bash
uvicorn main:app --reload
```

API available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Usage

1. Export an email from Outlook as `.eml`
2. Go to `http://localhost:8000/docs`
3. Use `POST /emails/import` to upload the `.eml` file
4. The response returns the parsed email with AI-assigned category, tab, and extracted deadline
