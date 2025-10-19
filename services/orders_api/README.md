FAM Orders API (FastAPI)

Quickstart

- Build and start the stack from repo root:

  docker compose up --build

- The Orders API will be available on http://localhost:8000
- Directus (admin) on http://localhost:8055

Seeding the DB

- To run the seed script locally (requires python deps):

  python -m pip install -r requirements.txt
  python seed.py

Notes

- Database URL taken from ../.env (DATABASE_URL). Adjust as needed.
