from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "STUDENT"

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    status: str

    class Config:
        from_attributes = True