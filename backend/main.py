from fastapi import FastAPI
from database import Base, engine
from routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BacSuccès-CM API", version="0.1.0")

app.include_router(auth_router)

@app.get("/")
def root():
    return {"status": "ok", "app": "BacSuccès-CM"}