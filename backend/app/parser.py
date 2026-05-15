from pathlib import Path


def extract_text_from_pdf(path: Path) -> str:
    # Import PyMuPDF only when needed to avoid hard dependency during tests
    import fitz  # PyMuPDF

    doc = fitz.open(path)
    text = []
    for page in doc:
        text.append(page.get_text())
    return "\n".join(text)


def extract_text_from_docx(path: Path) -> str:
    from docx import Document
    doc = Document(path)
    return "\n".join([para.text for para in doc.paragraphs])


def parse_resume(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"{path} not found")
    
    suffix = p.suffix.lower()
    if suffix == ".pdf":
        text = extract_text_from_pdf(p)
    elif suffix == ".docx":
        text = extract_text_from_docx(p)
    else:
        # Try as plain text
        try:
            text = p.read_text(encoding="utf-8")
        except:
            text = ""

    return {"text": text[:10000], "length": len(text)}

