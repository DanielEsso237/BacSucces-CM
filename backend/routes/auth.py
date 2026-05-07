from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models import User
from database import SessionLocal, engine
from schemas import UserCreate, UserLogin
from utils.security import hash_password, verify_password, create_access_token

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    status = "ACTIVE"
    if user.role == "TEACHER":
        status = "PENDING"  

    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        role=user.role,
        status=status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Compte créé", "status": status}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    if db_user.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Compte non actif")

    token = create_access_token({"sub": db_user.email, "role": db_user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role
    }