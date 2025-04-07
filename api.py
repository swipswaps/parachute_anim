from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings
from core import pipeline, PipelineError

app = FastAPI(
    title="Parachute 3D Pipeline API",
    description="API for processing video segments into 3D models",
    version="1.0.0"
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class JobRequest(BaseModel):
    video_url: HttpUrl
    start_time: str
    duration: int

    class Config:
        schema_extra = {
            "example": {
                "video_url": "https://www.youtube.com/watch?v=example",
                "start_time": "00:00:19",
                "duration": 5
            }
        }

class JobResponse(BaseModel):
    status: str
    exports: List[str]
    error: Optional[str] = None

# Security functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data.username

# Routes
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # In production, validate against a database
    # WARNING: Change the hardcoded username and password in production!
    if form_data.username != "admin" or form_data.password != "admin":  # Change in production
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/launch", response_model=JobResponse)
async def launch_pipeline(
    job: JobRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        exports = pipeline(
            url=str(job.video_url),
            start=job.start_time,
            duration=job.duration
        )
        return JobResponse(
            status="success",
            exports=[str(p) for p in exports]
        )
    except PipelineError as e:
        return JobResponse(
            status="error",
            exports=[],
            error=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/exports", response_model=List[str])
async def list_exports(current_user: str = Depends(get_current_user)):
    try:
        return [str(p) for p in settings.EXPORT_DIR.glob("*")]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
