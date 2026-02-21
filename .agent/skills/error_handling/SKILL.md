---
name: Manejo de Errores y Registro (Logging)
description: Protocolo IA de interceptores y manejo de bugs.
---

# Manejo de Errores

- **Errores Globales**: Atrapados mediante `ErrorHandler` en UI.
- **Peticiones de Red**: Usa `HttpInterceptors`:
  - `401 Unauthorized`: Forzar refresh asíncrono o limpiar sesión hacia Login.
  - `403 Forbidden`: Alerta reactiva de privilegios faltantes.
  - `500 Internal Error`: Notificación amigable global para el usuario (nunca exponer raw).
- **Prohibición de Filtrado Tecnico**: Está terminantemente prohibido mostrar variables nativas crudas, queries de base de datos o Stack Traces originarios impresos en la interfaz frontal del usuario. Sanitiza el mensaje.
- **Sistema de Logs**: Muestra console solo en Dev (separando niveles `debug, info, warn, error`). Mitigar 'Log flooding' en errores repetitivos controlando el flujo temporal.
