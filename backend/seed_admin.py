import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import User
from utils.security import hash_password

Base.metadata.create_all(bind=engine)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@bacSucces.cm")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administrateur")

db = SessionLocal()

existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
if existing:
    print(f"Admin déjà existant : {ADMIN_EMAIL}")
else:
    admin = User(
        email=ADMIN_EMAIL,
        full_name=ADMIN_NAME,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="ADMIN",
        status="ACTIVE",
    )
    db.add(admin)
    db.commit()
    print(f"Admin créé : {ADMIN_EMAIL}")

db.close()