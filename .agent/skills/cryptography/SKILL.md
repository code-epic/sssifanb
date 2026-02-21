---
name: Criptografía y Seguridad
description: Estándares estrictos de seguridad de datos.
---

# Protocolos Criptográficos

- **Secretos**: Prohibido codificar (hardcodear) contraseñas, tokens o API keys en archivos locales. Todo debe residir en contenedores inyectados mediante `environment.ts`.
- **Hashing**: Usa invariablemente `SHA-256` para resguardo e integridad (`src/app/core/services/util/sha256.ts`). Todo cotejo al back-end exige comprobación contra el formato de string hexadecimal final.
- **Transmisión Red (HTTP)**: Toda carga PII/Sensible debe empaquetarse en cuerpo JSON cifrado bajo `POST` o `PUT`. Jamás usar variables de petición plana por URL (GET).
- **Almacenamiento (Storage)**: Evita inyectar tokens limpios en `localStorage`. Si es imperativo su uso asíncrono, aplica barreras ofuscadoras e interceptoras contra ataques XSS.
