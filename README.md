# Secure Database-as-a-Service System

A full-stack secure DBaaS demonstration for protecting healthcare records in a semi-trusted database environment. The project includes a Flask/PostgreSQL backend and a React/MUI frontend with authentication, role-based access control, encrypted sensitive fields, and integrity verification.

## What This Project Demonstrates

- Custom username/password authentication with hashed password storage
- JWT-based session handling between the frontend and backend
- Role-based access control with two user groups:
  - **H users** can view all displayed patient attributes and add records
  - **R users** can query records but cannot view first or last names
- AES-GCM encryption for sensitive attributes such as age and gender
- HMAC-based row integrity checks to detect modified records
- Merkle-root generation to support query-result completeness verification
- React dashboard for viewing patient records, role information, and integrity metadata

## Project Structure

```text
secure-dbaas/
├── backend/              # Flask API, PostgreSQL access, crypto/integrity logic
│   ├── app.py
│   ├── auth.py
│   ├── db.py
│   ├── patients.py
│   ├── schema.sql
│   ├── seed.py
│   ├── utils.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # React + Vite + Material UI client
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   └── SECURITY_NOTES.md
├── .gitignore
└── README.md
```

## Backend Setup

1. Create a PostgreSQL database and user.

```sql
CREATE DATABASE securedb;
CREATE USER secureuser WITH PASSWORD 'securepass';
GRANT ALL PRIVILEGES ON DATABASE securedb TO secureuser;
```

2. Install Python dependencies.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Create your environment file.

```bash
cp .env.example .env
```

4. Apply the schema.

```bash
psql -U secureuser -d securedb -f schema.sql
```

5. Seed test data.

```bash
python seed.py
```

6. Start the Flask API.

```bash
python app.py
```

The API runs at `http://127.0.0.1:5000` by default.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` by default.

## Default Seeded Accounts

The seed script creates demo accounts:

| Username | Password | Role | Admin |
|---|---|---|---|
| admin | password123 | H | Yes |
| researcher | password123 | R | No |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user as role R |
| POST | `/auth/login` | Authenticate and receive a JWT |
| GET | `/auth/users` | Admin-only user listing |
| PATCH | `/auth/users/<id>/role` | Admin-only role update |
| GET | `/patients/` | Query patient records according to the user's role |
| POST | `/patients/` | Add patient record; H role only |
| GET | `/patients/merkle_root` | Return Merkle root for stored patient rows |

## Security Design Summary

The system assumes the database is semi-trusted: it follows the protocol but may attempt to infer sensitive information or tamper with stored records. Sensitive values are encrypted before storage, passwords are hashed, data access is filtered by role, and query results are checked with integrity metadata.

More detail is available in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/SECURITY_NOTES.md`](docs/SECURITY_NOTES.md).

## Notes

This is an educational security project, not a production-ready medical data system. Production deployment would require stronger key management, audited cryptographic design, complete Merkle proofs, HTTPS, logging, migrations, and stricter operational controls.
