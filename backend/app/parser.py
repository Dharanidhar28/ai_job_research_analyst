from pathlib import Path


def extract_text_from_pdf(path: Path) -> str:
    # Import PyMuPDF only when needed to avoid hard dependency during tests
    import fitz  # PyMuPDF

    doc = fitz.open(path)
    text = []
    for page in doc:
        text.append(page.get_text())
    return "\n".join(text)


def parse_resume(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"{path} not found")
    # Simple extraction for POC
    text = extract_text_from_pdf(p)
    return {"text": text[:10000], "length": len(text)}
