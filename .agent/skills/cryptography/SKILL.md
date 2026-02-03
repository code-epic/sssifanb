---
name: Cryptography
description: Standards and practices for handling cryptographic operations and sensitive data.
---

# Cryptography Standards

## Core Principles

1.  **Security First**: Never hardcode secrets. Use environment variables.
2.  **Hashing**:
    - Use **SHA-256** for hashing sensitive identifiers or verifying data integrity.
    - Reference implementation available in `src/app/core/services/util/sha256.ts`.
3.  **Data Transmission**:
    - Ensure all sensitive data (passwords, tokens, PII) is encrypted in transit (HTTPS).
    - Avoid sending sensitive data in URL parameters; use the Request Body (POST/PUT).
4.  **Storage**:
    - Do not store plain-text passwords in local storage or cookies.
    - If storing tokens, ensure XSS protection measures are considered.

## Usage in App

- When processing login or signing data strings, ensure the appropriate hashing algorithm matches the backend expectation.
- Verify message integrity if the API implements HMAC.
