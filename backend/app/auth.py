from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuth
import os
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from .models import User
from sqlmodel import Session, create_engine, select
from pathlib import Path

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(DATABASE_URL, echo=False)
User.metadata.create_all(engine)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

oauth = OAuth()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
if LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET:
    oauth.register(
        name="linkedin",
        client_id=LINKEDIN_CLIENT_ID,
        client_secret=LINKEDIN_CLIENT_SECRET,
        access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
        authorize_url="https://www.linkedin.com/oauth/v2/authorization",
        api_base_url="https://api.linkedin.com/v2",
        client_kwargs={"scope": "r_liteprofile r_emailaddress"},
    )


class RegisterIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=Token)
def register(input: RegisterIn):
    with Session(engine) as session:
        statement = select(User).where(User.email == input.email)
        existing = session.exec(statement).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        user = User(
            email=input.email, hashed_password=get_password_hash(input.password)
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        token = create_access_token({"sub": user.email})
        return {"access_token": token}


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=Token)
def login(input: LoginIn):
    with Session(engine) as session:
        statement = select(User).where(User.email == input.email)
        user = session.exec(statement).first()
        if not user or not verify_password(input.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"sub": user.email})
        return {"access_token": token}


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if user is None:
            raise credentials_exception
        return user


@router.get("/login/google")
async def login_google(request: Request):
    # Development bypass: quickly create a dev user and return token
    if os.getenv("DEV_OAUTH") == "1":
        email = os.getenv("DEV_OAUTH_EMAIL", "dev@example.com")
        with Session(engine) as session:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            if not user:
                user = User(email=email, hashed_password="")
                session.add(user)
                session.commit()
                session.refresh(user)
        access_token = create_access_token({"sub": email})
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(f"{frontend}/?token={access_token}")
    if "google" not in oauth._clients:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    redirect_uri = request.url_for("auth_google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def auth_google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    userinfo = await oauth.google.parse_id_token(request, token)
    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email from provider")
    
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            user = User(email=email, hashed_password="")
            session.add(user)
            session.commit()
            session.refresh(user)
            
    access_token = create_access_token({"sub": email})
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend}/?token={access_token}")


@router.get("/login/linkedin")
async def login_linkedin(request: Request):
    # Development bypass
    if os.getenv("DEV_OAUTH") == "1":
        email = os.getenv("DEV_OAUTH_EMAIL", "dev@example.com")
        with Session(engine) as session:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            if not user:
                user = User(email=email, hashed_password=get_password_hash(""))
                session.add(user)
                session.commit()
                session.refresh(user)
        access_token = create_access_token({"sub": email})
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(f"{frontend}/?token={access_token}")
    if "linkedin" not in oauth._clients:
        raise HTTPException(status_code=400, detail="LinkedIn OAuth not configured")
    redirect_uri = request.url_for("auth_linkedin_callback")
    return await oauth.linkedin.authorize_redirect(request, redirect_uri)


@router.get("/linkedin/callback")
async def auth_linkedin_callback(request: Request):
    token = await oauth.linkedin.authorize_access_token(request)
    # LinkedIn requires separate calls to get email and profile
    resp = await oauth.linkedin.get(
        "emailAddress?q=members&projection=(elements*(handle~))", token=token
    )
    data = resp.json()
    # attempt to extract email
    elements = data.get("elements", [])
    email = None
    if elements:
        email = elements[0].get("handle~", {}).get("emailAddress")
    if not email:
        raise HTTPException(status_code=400, detail="No email from LinkedIn")
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            user = User(email=email, hashed_password=get_password_hash(""))
            session.add(user)
            session.commit()
            session.refresh(user)
    access_token = create_access_token({"sub": email})
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend}/?token={access_token}")
