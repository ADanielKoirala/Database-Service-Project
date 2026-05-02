# Architecture

## Overview

The application is structured as a two-tier full-stack demo:

```text
React Client → Flask API / Security Layer → PostgreSQL Database
```

The PostgreSQL database is treated as semi-trusted. It stores encrypted sensitive fields and integrity metadata, while the backend applies authentication, access control, encryption, and verification logic.

## Backend Responsibilities

- Authenticate users with hashed passwords
- Issue JWTs containing role and admin claims
- Enforce role-based access control before returning patient data
- Encrypt sensitive patient attributes before storage
- Verify row-level HMACs before returning query results
- Compute a Merkle root from patient row leaves

## Frontend Responsibilities

- Provide login, registration, and dashboard UI
- Attach JWTs to API requests
- Display patient data according to the user's assigned role
- Expose admin role-management controls when the logged-in user is an admin
- Display integrity metadata such as row MACs, leaf hashes, and Merkle root preview

## Data Flow

1. User logs in through the React frontend.
2. Flask validates the password hash and returns a JWT.
3. The frontend sends the JWT with protected API requests.
4. Flask checks role claims before returning patient data.
5. Patient rows are integrity-checked with HMAC before being returned.
6. The API excludes first and last names for role R users.
