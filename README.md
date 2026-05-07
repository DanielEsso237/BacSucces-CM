# BacSuccès-CM

A web application for exchanging exams and textbooks between teachers and students.

## Main Features

- Posting and downloading exams
- Sharing textbooks
- Authentication system (students/teachers)
- Search and filtering by subject/level
- Modern interface with React

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: SQLite (development) / PostgreSQL (production)

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
