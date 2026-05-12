# JobResearchAI

JobResearchAI is a comprehensive tool designed to accelerate your job search using AI. It allows you to upload resumes, parse them with high precision, search for matching jobs, and tailor your application content for specific roles.

## New Features (Modern & Minimalist UI)

- **AI-Powered Parsing:** High-precision extraction of skills and experience from PDF/DOCX resumes.
- **Smart Job Search:** Instantly find matching jobs based on your parsed resume.
- **AI Tailoring:** Optimize your resume content for specific job descriptions using GPT-4o-mini.
- **Export Functionality:** Download your tailored resumes as **ATS-friendly PDF or Word (.docx)** documents.
- **Social Authentication:** Seamless login/registration with **LinkedIn** and **Google**.
- **Modern Responsive UI:** A clean, intuitive dashboard with a minimalist aesthetic.

## Quick Start

### Prerequisites
- Node.js (for frontend)
- Python 3.11+ (for backend)
- (Optional) Docker & Docker Compose

### Running with Docker
```bash
docker-compose up --build
```

### Manual Setup

#### Backend
1. Navigate to `backend/`
2. Install dependencies: `pip install -r requirements.txt` (or use Poetry)
3. Run the server: `python -m uvicorn app.main:app --reload`

#### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`

Backend: http://localhost:8000
Frontend: http://localhost:3000

## Configuration

Environment variables (see `.env.example`):

- `DEV_OAUTH=1` — Enables development bypass for LinkedIn/Google login.
- `ADZUNA_APP_ID` & `ADZUNA_APP_KEY` — For real job search results (optional).
- `OPENAI_API_KEY` — For AI-powered resume tailoring (optional).

## Tech Stack
- **Frontend:** Next.js (React), CSS Modules, Axios.
- **Backend:** FastAPI, SQLModel (SQLite), PyMuPDF, Python-docx, ReportLab.
- **Auth:** Authlib, OAuth2, JWT.
