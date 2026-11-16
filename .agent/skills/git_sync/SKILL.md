---
name: git-sync
description: Estándar y procedimiento estricto para commit y push en el repositorio SSSIFANB. Mensajes semánticos (feat, fix, refactor, docs), validación previa de compilación limpia y preservación del historial. Activar cuando el usuario solicite subir, guardar o hacer commit/push de cambios.
---

# 🛡️ Git Synchronization Skill

Esta habilidad define cómo cualquier agente o desarrollador debe sincronizar el código con el repositorio remoto. Dado que estamos en un entorno crítico y militar, el historial debe ser inmaculado.

## 📝 Reglas de Commit (Conventional Commits)

Debes usar SIEMPRE los siguientes prefijos para cualquier commit:

- `feat:` (Nuevas características, ej: Nómina, Afiliación)
- `fix:` (Corrección de errores o bugs)
- `refactor:` (Cambios en el código que no corrigen bugs ni añaden características)
- `style:` (Cambios de formato, comillas, linting, UI, CSS)
- `docs:` (Actualización de documentación)
- `chore:` (Tareas de mantenimiento, actualización de dependencias, scripts)
- `build:` (Cambios que afectan el sistema de compilación, npm)

## 🛠️ Pasos de Ejecución (Workflow Integrado)

Cuando se te pida "Sincronizar el repositorio", debes ejecutar exactamente estos comandos:

1. **Verificar estado:**

   ```bash
   git status
   ```

2. **Agregar cambios:**

   ```bash
   git add .
   ```

3. **Crear el commit:**
   Pide al Orquestador (Usuario) que proporcione el mensaje del commit o generálo tú mismo basado en un resumen de los cambios, asegurando el formato estricto:

   ```bash
   git commit -m "tipo(alcance): descripción del cambio"
   # Ejemplo: git commit -m "feat(nomina): agregar cálculo de utilidades anuales"
   ```

4. **Subir al remoto:**

   ```bash
   git push origin main
   ```

5. **Notificar:**
   Informa al usuario que los cambios están respaldados de forma segura con el hash generado.
