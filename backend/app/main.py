from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path
from . import auth
from .models import Resume
from sqlmodel import Session, select
from .parser import parse_resume
from . import jobs as jobs_module
import os

app = FastAPI(title="Resume Agent Backend")

# Simple CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
async def root():
    return {"message": "Resume Agent Backend is running"}


@app.post("/upload_resume")
async def upload_resume(
    file: UploadFile = File(...), user=Depends(auth.get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    # determine version
    with Session(auth.engine) as session:
        statement = select(Resume).where(
            Resume.user_id == user.id, Resume.filename == file.filename
        )
        existing = session.exec(statement).all()
        version = (max([r.version for r in existing]) + 1) if existing else 1
    dest = UPLOAD_DIR / f"{user.id}_{version}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    # save metadata
    resume = Resume(
        user_id=user.id, filename=file.filename, filepath=str(dest), version=version
    )
    with Session(auth.engine) as session:
        session.add(resume)
        session.commit()
        session.refresh(resume)
    return JSONResponse(
        {
            "id": resume.id,
            "filename": file.filename,
            "path": str(dest),
            "version": version,
        }
    )


@app.get("/resumes")
def list_resumes(user=Depends(auth.get_current_user)):
    with Session(auth.engine) as session:
        statement = select(Resume).where(Resume.user_id == user.id)
        results = session.exec(statement).all()
        out = [
            {
                "id": r.id,
                "filename": r.filename,
                "version": r.version,
                "parsed": bool(r.parsed_text),
            }
            for r in results
        ]
        return out


@app.post("/parse_resume/{resume_id}")
def parse_resume_endpoint(resume_id: int, user=Depends(auth.get_current_user)):
    with Session(auth.engine) as session:
        resume = session.get(Resume, resume_id)
        if not resume or resume.user_id != user.id:
            raise HTTPException(status_code=404, detail="Resume not found")
    parsed = parse_resume(resume.filepath)
    with Session(auth.engine) as session:
        db_res = session.get(Resume, resume_id)
        db_res.parsed_text = parsed.get("text")
        db_res.parsed_length = parsed.get("length")
        session.add(db_res)
        session.commit()
        session.refresh(db_res)
    return {"id": resume_id, "parsed_length": db_res.parsed_length}


@app.get("/jobs/search")
async def search_jobs(
    resume_id: int = None, q: str = None, user=Depends(auth.get_current_user)
):
    # derive query from resume or q
    query = q
    if resume_id:
        with Session(auth.engine) as session:
            resume = session.get(Resume, resume_id)
            if not resume or resume.user_id != user.id:
                raise HTTPException(status_code=404, detail="Resume not found")
            if resume.parsed_text:
                # simple keyword extraction: take top words
                words = [
                    w
                    for w in resume.parsed_text.replace("\n", " ").split(" ")
                    if len(w) > 4
                ]
                query = " ".join(words[:6])
            else:
                query = resume.filename
    if not query:
        raise HTTPException(status_code=400, detail="Provide resume_id or q")
    jobs = await jobs_module.search_jobs(query)
    return jobs


@app.post("/tailor/{resume_id}")
async def tailor_resume(
    resume_id: int, payload: dict, user=Depends(auth.get_current_user)
):
    # payload should include job_description or job_url
    job_description = payload.get("job_description") if payload else None
    with Session(auth.engine) as session:
        resume = session.get(Resume, resume_id)
        if not resume or resume.user_id != user.id:
            raise HTTPException(status_code=404, detail="Resume not found")
    # simple fallback tailoring: prepend a header; if OPENAI_API_KEY set, call OpenAI to rewrite
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and job_description:
        import aiohttp

        prompt = f"Rewrite the following resume to be ATS-friendly and tailored to this job description:\n\nJOB DESCRIPTION:\n{job_description}\n\nRESUME:\n{resume.parsed_text or ''}\n\nReturn the rewritten resume text only."
        async with aiohttp.ClientSession() as session_http:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json",
            }
            body = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1500,
            }
            async with session_http.post(
                "https://api.openai.com/v1/chat/completions", json=body, headers=headers
            ) as resp:
                data = await resp.json()
                tailored = (
                    data["choices"][0]["message"]["content"]
                    if data.get("choices")
                    else None
                )
                return {"tailored": tailored}
    # fallback simple tailoring
    tailored = (
        f"Tailored for job:\n{job_description or 'N/A'}\n\n{resume.parsed_text or ''}"
    )
    return {"tailored": tailored}


# include auth router
app.include_router(auth.router, prefix="/auth", tags=["auth"])
