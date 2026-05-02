# Backend

Flask API for the Secure DBaaS project.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
psql -U secureuser -d securedb -f schema.sql
python seed.py
python app.py
```

## Main Modules

- `app.py` wires Flask, CORS, JWT, and blueprints.
- `auth.py` handles registration, login, JWT claims, and admin role updates.
- `patients.py` handles role-filtered patient queries, H-only inserts, row integrity checks, and Merkle root lookup.
- `utils.py` contains AES-GCM encryption, HMAC, canonical row encoding, and Merkle helpers.
- `db.py` centralizes PostgreSQL connection settings.
