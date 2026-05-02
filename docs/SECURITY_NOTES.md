# Security Notes

## Threat Model

The project assumes a semi-trusted database provider. The database follows expected query behavior, but it may attempt to inspect stored data, infer sensitive information, modify records, or omit records from query results.

## Authentication

Passwords are not stored in plaintext. The backend hashes passwords with Flask-Bcrypt and validates password attempts during login.

## Authorization

Users are assigned role `H` or `R`.

- `H`: can view first name and last name and add patient records.
- `R`: can query patient records, but first and last names are removed from responses.

Admin users can list users and update roles.

## Confidentiality

Age and gender are encrypted with AES-GCM before storage. AES-GCM provides confidentiality and authenticated encryption for those field values.

## Integrity

Each stored row has an HMAC over a canonical representation of the row. The backend recomputes this HMAC before returning query results. If stored row content is modified, verification fails.

## Completeness

The project computes a Merkle root over patient row leaves. A complete production version would return Merkle proofs for individual query results so the client can verify that no returned rows were modified or removed.

## Current Limitations

- Cryptographic keys are environment-configured demo keys, not production key-management-system keys.
- Merkle proof generation is represented through root generation but not fully exposed as per-row proof paths.
- The backend currently performs encryption before database insertion. A stricter outsourced-database design would encrypt on a separate trusted client before the database layer receives data.
- HTTPS, audit logging, rate limiting, migrations, and production secrets management are not included.
