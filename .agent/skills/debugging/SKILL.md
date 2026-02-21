---
name: Ejecución y Debugging
description: Uso de CLI, flags y testing.
---

# Comandos de Arranque y Control Local

- **Levantar Entorno**: `npm start` levanta `ng serve` en `0.0.0.0` puerto `4202`. Inyecta indirectamente desarrollo modo Dev. (Opcional experimental: `npm run start2`).
- **Proxy de Enrutación (CORS)**: El fichero central vital `src/proxy.conf.json` burla y re-encamina las llamadas de la API local evadiendo CORS de navegador. Modifícalo si ves bloqueos de red 404/CORS.
- **Validaciones**:
  - Testing Unitario con Karma: `npm test`
  - Chequeo de Prácticas/Código (Lint): `npm run lint`
