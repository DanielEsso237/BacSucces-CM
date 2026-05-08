from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models import User
from database import get_db
from schemas import StudentRegister, TeacherRegister, UserLogin, TokenResponse, UserOut, AdminUserUpdate
from utils.security import (
    hash_password, verify_password, create_access_token,
    require_active, require_admin
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/student", response_model=dict)
def register_student(data: StudentRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role="STUDENT",
        status="ACTIVE",
    )
    db.add(user)
    db.commit()
    return {"message": "Compte élève créé avec succès"}


@router.post("/register/teacher", response_model=dict)
def register_teacher(data: TeacherRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    if not data.teacher_justification.strip():
        raise HTTPException(status_code=400, detail="La justification est obligatoire")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role="TEACHER",
        status="PENDING",
        teacher_justification=data.teacher_justification,
    )
    db.add(user)
    db.commit()
    return {"message": "Demande envoyée, en attente de validation par l'admin"}


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if user.status == "PENDING":
        raise HTTPException(status_code=403, detail="Compte en attente de validation admin")

    if user.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Compte suspendu")

    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "role": user.role, "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(require_active)):
    return current_user


@router.get("/admin/pending-teachers", response_model=list[UserOut])
def list_pending_teachers(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "TEACHER", User.status == "PENDING").all()


@router.patch("/admin/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: AdminUserUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if data.status:
        allowed_statuses = ("ACTIVE", "PENDING", "SUSPENDED")
        if data.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs acceptées : {allowed_statuses}")
        user.status = data.status

    if data.role:
        allowed_roles = ("STUDENT", "TEACHER", "ADMIN")
        if data.role not in allowed_roles:
            raise HTTPException(status_code=400, detail=f"Rôle invalide. Valeurs acceptées : {allowed_roles}")
        user.role = data.role

    db.commit()
    db.refresh(user)
    return user