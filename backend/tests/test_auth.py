import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from database import Base, get_db

TEST_DB_URL = "sqlite:///./test_auth.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(setup_db):
    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_register_student(client):
    r = client.post("/auth/register/student", json={
        "email": "eleve@test.cm",
        "full_name": "Eleve Test",
        "password": "secret123"
    })
    assert r.status_code == 200
    assert "Compte élève" in r.json()["message"]


def test_register_student_duplicate(client):
    payload = {"email": "eleve@test.cm", "full_name": "X", "password": "secret123"}
    client.post("/auth/register/student", json=payload)
    r = client.post("/auth/register/student", json=payload)
    assert r.status_code == 400


def test_register_teacher_pending(client):
    r = client.post("/auth/register/teacher", json={
        "email": "prof@test.cm",
        "full_name": "Prof Test",
        "password": "secret123",
        "teacher_justification": "Matricule MEN-2024-001, Lycée de Buea"
    })
    assert r.status_code == 200
    assert "attente" in r.json()["message"]


def test_teacher_cannot_login_while_pending(client):
    client.post("/auth/register/teacher", json={
        "email": "prof@test.cm",
        "full_name": "Prof",
        "password": "secret123",
        "teacher_justification": "Matricule MEN-2024-001"
    })
    r = client.post("/auth/login", json={"email": "prof@test.cm", "password": "secret123"})
    assert r.status_code == 403


def test_student_login(client):
    client.post("/auth/register/student", json={
        "email": "eleve@test.cm",
        "full_name": "Eleve",
        "password": "secret123"
    })
    r = client.post("/auth/login", json={"email": "eleve@test.cm", "password": "secret123"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_wrong_password(client):
    client.post("/auth/register/student", json={
        "email": "eleve@test.cm",
        "full_name": "Eleve",
        "password": "secret123"
    })
    r = client.post("/auth/login", json={"email": "eleve@test.cm", "password": "mauvais"})
    assert r.status_code == 401


def test_me_endpoint(client):
    client.post("/auth/register/student", json={
        "email": "eleve@test.cm",
        "full_name": "Eleve",
        "password": "secret123"
    })
    login_r = client.post("/auth/login", json={"email": "eleve@test.cm", "password": "secret123"})
    token = login_r.json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "eleve@test.cm"