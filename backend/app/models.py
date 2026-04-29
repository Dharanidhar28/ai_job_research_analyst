from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from typing import Dict, Any


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    hashed_password: str


class Resume(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    filename: str
    filepath: str
    version: int = 1
    parsed_text: Optional[str] = None
    parsed_length: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
