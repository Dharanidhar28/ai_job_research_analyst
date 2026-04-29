import pytest
from app.parser import parse_resume
from pathlib import Path


def test_parse_nonexistent():
    p = Path("does_not_exist.pdf")
    with pytest.raises(FileNotFoundError):
        parse_resume(str(p))
