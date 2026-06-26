from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid

from models import Document
from database import get_db
from schemas import DocumentOut
from utils.security import require_active, require_teacher

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SUBJECTS = ["Mathématiques", "Physique", "SVT", "Français", "Anglais", "Histoire-Géo", "Philosophie", "Informatique"]
LEVELS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
DOC_TYPES = ["EXAM", "ANNALES", "CORRECTION"]

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
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    doc = Document(
        title=title,
        description=description,
        subject=subject,
        level=level,
        doc_type=doc_type,
        file_path=file_path,
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
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur")
    return FileResponse(doc.file_path, media_type="application/pdf", filename=f"{doc.title}.pdf")