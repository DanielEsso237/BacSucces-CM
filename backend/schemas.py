from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class StudentRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    contact: Optional[str] = None

class TeacherRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    teacher_justification: str
    contact: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime
    teacher_justification: Optional[str] = None
    contact: Optional[str] = None

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserOut

class AdminUserUpdate(BaseModel):
    status: Optional[str] = None
    role: Optional[str] = None

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject: str
    level: str
    doc_type: str
    author_id: int
    created_at: datetime
    author: UserOut

    model_config = {"from_attributes": True}