from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, Document
from database import get_db
from utils.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_stats(admin=Depends(require_admin), db: Session = Depends(get_db)):
    total_documents = db.query(func.count(Document.id)).scalar()
    total_students = db.query(func.count(User.id)).filter(User.role == "STUDENT", User.status == "ACTIVE").scalar()
    total_teachers = db.query(func.count(User.id)).filter(User.role == "TEACHER", User.status == "ACTIVE").scalar()
    pending_teachers = db.query(func.count(User.id)).filter(User.role == "TEACHER", User.status == "PENDING").scalar()

    exam_count = db.query(func.count(Document.id)).filter(Document.doc_type == "EXAM").scalar()
    annales_count = db.query(func.count(Document.id)).filter(Document.doc_type == "ANNALES").scalar()

    subjects_raw = (
        db.query(Document.subject, func.count(Document.id).label("count"))
        .group_by(Document.subject)
        .order_by(func.count(Document.id).desc())
        .all()
    )
    subjects = [{"label": row.subject, "count": row.count} for row in subjects_raw]

    return {
        "total_documents": total_documents,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "pending_teachers": pending_teachers,
        "exam_count": exam_count,
        "annales_count": annales_count,
        "subjects": subjects,
    }