from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import Optional
import os
import uuid

from models import Document
from config import settings
from database import get_db
from schemas import DocumentOut
from utils.security import require_active, require_teacher




UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SUBJECTS = ["Mathématiques", "Physique", "SVT", "Français", "Anglais", "Histoire-Géo", "Philosophie", "Informatique"]
LEVELS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
DOC_TYPES = ["EXAM", "ANNALES"]
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

router = APIRouter(prefix="/documents", tags=["documents"])


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
    return query.order_by(Document.created_at.desc()).all()


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
    contact_info: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_teacher)
):
    if subject not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Matière invalide")
    if level not in LEVELS:
        raise HTTPException(status_code=400, detail="Niveau invalide")
    if doc_type not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide")

    file_path = None
    cover_image_path = None

    if doc_type == "EXAM":
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés pour les épreuves")
        filename = f"{uuid.uuid4()}.pdf"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

    elif doc_type == "ANNALES":
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="La page de couverture doit être une image (JPEG, PNG ou WebP)")
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        cover_image_path = os.path.join(UPLOAD_DIR, filename)
        with open(cover_image_path, "wb") as f:
            f.write(file.file.read())

    doc = Document(
        title=title,
        description=description,
        subject=subject,
        level=level,
        doc_type=doc_type,
        file_path=file_path,
        cover_image_path=cover_image_path,
        contact_info=contact_info,
        author_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_active)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Fichier PDF introuvable sur le serveur")
    return FileResponse(doc.file_path, media_type="application/pdf", filename=f"{doc.title}.pdf")


@router.get("/{doc_id}/cover")
def get_cover_image(
    doc_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if not doc.cover_image_path or not os.path.exists(doc.cover_image_path):
        raise HTTPException(status_code=404, detail="Image de couverture introuvable")
    ext = doc.cover_image_path.rsplit(".", 1)[-1].lower()
    media_types = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    media_type = media_types.get(ext, "image/jpeg")
    return FileResponse(doc.cover_image_path, media_type=media_type)