from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json

from models import Document
from database import get_db
from schemas import DocumentOut
from utils.security import require_active, require_teacher

UPLOAD_DIR = "uploads"
COVERS_DIR = "uploads/covers"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(COVERS_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}

SUBJECTS = ["Mathématiques", "Physique", "SVT", "Français", "Anglais", "Histoire-Géo", "Philosophie", "Informatique"]
LEVELS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
DOC_TYPES = ["EXAM", "ANNALES", "CORRECTION"]

router = APIRouter(prefix="/documents", tags=["documents"])


def doc_to_out(doc: Document) -> dict:
    contacts = None
    if doc.annales_contacts:
        try:
            contacts = json.loads(doc.annales_contacts)
        except Exception:
            contacts = []
    return {
        "id": doc.id,
        "title": doc.title,
        "description": doc.description,
        "subject": doc.subject,
        "level": doc.level,
        "doc_type": doc.doc_type,
        "author_id": doc.author_id,
        "created_at": doc.created_at,
        "author": doc.author,
        "has_cover": bool(doc.cover_image_path and os.path.exists(doc.cover_image_path)),
        "annales_contacts": contacts,
    }


@router.get("/", response_model=list[DocumentOut])
def list_documents(
    subject: Optional[str] = None,
    level: Optional[str] = None,
    doc_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_active)
):
    query = db.query(Document)
    if subject:
        query = query.filter(Document.subject == subject)
    if level:
        query = query.filter(Document.level == level)
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    docs = query.order_by(Document.created_at.desc()).all()
    return [doc_to_out(d) for d in docs]


@router.get("/filters")
def get_filters():
    return {"subjects": SUBJECTS, "levels": LEVELS, "doc_types": DOC_TYPES}


@router.post("/", response_model=DocumentOut)
def upload_document(
    title: str = Form(...),
    description: str = Form(""),
    subject: str = Form(...),
    level: str = Form(...),
    doc_type: str = Form(...),
    annales_contacts: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    cover_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_teacher)
):
    if subject not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Matière invalide")
    if level not in LEVELS:
        raise HTTPException(status_code=400, detail="Niveau invalide")
    if doc_type not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide")

    if doc_type == "ANNALES":
        if not cover_image or not cover_image.filename:
            raise HTTPException(status_code=400, detail="Une image de couverture est obligatoire pour une annale")
    else:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="Un fichier PDF est obligatoire")
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    file_path = None
    if file and file.filename:
        filename = f"{uuid.uuid4()}.pdf"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

    cover_path = None
    if cover_image and cover_image.filename:
        ext = os.path.splitext(cover_image.filename)[1].lower()
        if ext not in ALLOWED_IMAGE_EXT:
            raise HTTPException(status_code=400, detail="Image de couverture : format JPG, PNG ou WEBP uniquement")
        cover_filename = f"{uuid.uuid4()}{ext}"
        cover_path = os.path.join(COVERS_DIR, cover_filename)
        with open(cover_path, "wb") as cf:
            cf.write(cover_image.file.read())

    contacts_json = None
    if annales_contacts:
        try:
            parsed = json.loads(annales_contacts)
            if isinstance(parsed, list):
                contacts_json = json.dumps([str(c).strip() for c in parsed if str(c).strip()])
        except Exception:
            pass

    doc = Document(
        title=title,
        description=description,
        subject=subject,
        level=level,
        doc_type=doc_type,
        file_path=file_path,
        cover_image_path=cover_path,
        annales_contacts=contacts_json,
        author_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc_to_out(doc)

@router.get("/{doc_id}/cover")
def get_cover(
    doc_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    from utils.security import get_current_user
    from fastapi.security import OAuth2PasswordBearer
    from jose import jwt, JWTError
    from config import settings
    from models import User

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = db.query(User).filter(User.email == email).first()
        if not user or user.status != "ACTIVE":
            raise HTTPException(status_code=401, detail="Non autorisé")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.cover_image_path or not os.path.exists(doc.cover_image_path):
        raise HTTPException(status_code=404, detail="Image introuvable")

    ext = os.path.splitext(doc.cover_image_path)[1].lower()
    media_type_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    return FileResponse(doc.cover_image_path, media_type=media_type_map.get(ext, "image/jpeg"))


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_active)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if not doc.file_path:
        raise HTTPException(status_code=404, detail="Aucun fichier disponible pour ce document")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur")
    return FileResponse(doc.file_path, media_type="application/pdf", filename=f"{doc.title}.pdf")