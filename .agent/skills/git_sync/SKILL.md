---
name: Git Synchronization
description: Estándar para agregar, commitear y hacer push de cambios en el proyecto SSS IFANB.
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

4. **Sincronizar (Push):**
   ```bash
   git push origin main
   # (Asume 'main' a menos que se indique otra rama)
   ```

## 🚨 Condiciones Críticas de Parada

- Si los tests de Angular fallan, detén el commit inmediatamente.
- Si hay credenciales expuestas en la pantalla de `git status` o un `.env`, no hacer commit y alertar al orquestador.
