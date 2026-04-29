# Resume Agent (POC)

This repository contains a proof-of-concept for a Resume Agent app: users upload resumes, an AI agent analyzes them, and the system searches job portals for matches.

Quick start (requires Docker):

```bash
docker-compose up --build
```

Backend: http://localhost:8000
Frontend: http://localhost:3000

Environment variables:

- `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` (optional) — for Adzuna API; if not provided, mock results are returned.
- `OPENAI_API_KEY` (optional) — for resume tailoring using an LLM; if not provided, a simple fallback is used.

Endpoints of interest:

- `POST /auth/register` — register user with JSON `{email,password}`
- `POST /auth/login` — login and get bearer token
- `POST /upload_resume` — upload file (multipart) with `Authorization: Bearer <token>`
- `GET /resumes` — list user's resumes
- `POST /parse_resume/{id}` — parse uploaded resume
- `GET /jobs/search?resume_id={id}` — search jobs for resume
- `POST /tailor/{id}` — tailor resume to job description
