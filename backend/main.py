from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.admin import router as admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BacSuccès-CM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"status": "ok", "app": "BacSuccès-CM"}