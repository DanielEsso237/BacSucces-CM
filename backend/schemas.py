from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class StudentRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class TeacherRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    teacher_justification: str

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

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserOut

class AdminUserUpdate(BaseModel):
    status: Optional[str] = None
    role: Optional[str] = None