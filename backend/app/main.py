from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path
from . import auth
from .models import Resume
from sqlmodel import Session, select
from .parser import parse_resume
from . import jobs as jobs_module
import os
import io
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

app = FastAPI(title="Resume Agent Backend")

# Simple CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
                # Better keyword extraction using spaCy
                import spacy
                try:
                    # Use small model, load only once if possible but for simplicity load here
                    nlp = spacy.load("en_core_web_sm")
                    doc = nlp(resume.parsed_text[:2000]) # process first 2k chars
                    # Extract nouns and proper nouns, ignore common stop words
                    keywords = [token.text for token in doc if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop and len(token.text) > 2]
                    # Take top 8 unique keywords
                    unique_keywords = []
                    for k in keywords:
                        if k.lower() not in [uk.lower() for uk in unique_keywords]:
                            unique_keywords.append(k)
                        if len(unique_keywords) >= 8:
                            break
                    query = " ".join(unique_keywords)
                except Exception as e:
                    print(f"Spacy error: {e}")
                    # fallback to previous logic
                    words = [w for w in resume.parsed_text.replace("\n", " ").split(" ") if len(w) > 4]
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
    # simple fallback tailoring: prepend a header; if GEMINI_API_KEY set, call Gemini to rewrite
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and job_description:
        import aiohttp

        # Updated prompt to explicitly ban Markdown for cleaner PDF/DOCX exports
        prompt = (
            "Rewrite the following resume to be ATS-friendly and tailored to this job description. "
            "IMPORTANT: Do NOT use any Markdown formatting, bolding (**), italics, or hashtags. "
            "Return ONLY plain text with standard line breaks.\n\n"
            f"JOB DESCRIPTION:\n{job_description}\n\n"
            f"RESUME:\n{resume.parsed_text or ''}"
        )
        
        # Gemini API Endpoint
        # New Gemini API Endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        
        async with aiohttp.ClientSession() as session_http:
            headers = {
                "Content-Type": "application/json",
            }
            body = {
                "contents": [{"parts":[{"text": prompt}]}]
            }
            
            async with session_http.post(url, json=body, headers=headers) as resp:
                data = await resp.json()
                try:
                    # Extract text from Gemini's specific JSON response structure
                    tailored = data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    tailored = f"Error generating tailoring from Gemini. Response: {data}"
                
                return {"tailored": tailored}

    # fallback simple tailoring
    if not gemini_key:
        tailored = (
            "--- AI TAILORING NOTE: GEMINI_API_KEY is not set. Showing a simulated preview. ---\n\n"
            f"RELEVANT JOB KEYWORDS IDENTIFIED:\n"
            f"{', '.join(job_description.split()[:10])}...\n\n"
            f"ORIGINAL RESUME CONTENT:\n"
            f"{resume.parsed_text or 'No parsed text available. Please parse the resume first.'}"
        )
    else:
        tailored = f"Tailored for job:\n{job_description or 'N/A'}\n\n{resume.parsed_text or ''}"
    return {"tailored": tailored}
    # fallback simple tailoring
    

@app.post("/export/pdf")
async def export_pdf(payload: dict = Body(...), user=Depends(auth.get_current_user)):
    content = payload.get("content", "")
    filename = payload.get("filename", "tailored_resume.pdf")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create ATS-friendly flowables
    flowables = []
    for line in content.split("\n"):
        if line.strip():
            flowables.append(Paragraph(line, styles["Normal"]))
        flowables.append(Spacer(1, 12))
    
    doc.build(flowables)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.post("/export/docx")
async def export_docx(payload: dict = Body(...), user=Depends(auth.get_current_user)):
    content = payload.get("content", "")
    filename = payload.get("filename", "tailored_resume.docx")

    doc = Document()
    for line in content.split("\n"):
        doc.add_paragraph(line)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/jobs/recommended")
async def get_recommended_jobs(user=Depends(auth.get_current_user)):
    with Session(auth.engine) as session:
        # Find latest parsed resume
        statement = select(Resume).where(Resume.user_id == user.id, Resume.parsed_text != None).order_by(Resume.id.desc())
        resume = session.exec(statement).first()
        if not resume:
            # Try latest unparsed resume
            statement = select(Resume).where(Resume.user_id == user.id).order_by(Resume.id.desc())
            resume = session.exec(statement).first()
            if not resume:
                return []
    
    # Use existing search logic
    return await search_jobs(resume_id=resume.id, user=user)


# include auth router
app.include_router(auth.router, prefix="/auth", tags=["auth"])
