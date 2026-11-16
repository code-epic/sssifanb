---
description: Flujo de Trabajo Estándar para Desarrollar un Nuevo Componente
---

# 🤖 Workflow de Sub-Agente: "Desarrollo de Componente"

Este workflow dicta los pasos para que tú (el usuario orquestador) y yo (el sub-agente ejecutor) construyamos un nuevo componente en SSS IFANB, validemos que funciona y luego subamos los cambios de forma segura.

1. **Revisión de Estándares Visuales:**
   Antes de crear código nuevo en la interfaz, debo revisar tu Skill de `ux_ui_design` (Colores pastel, Glassmorphism, etc.).

2. **Generación del Componente (Angular 17):**
   Uso el CLI de Angular para generar el componente.
   `ng generate component feature/pages/[dominio]/[nombre]`

3. **Verificación de Estabilidad Mínima:**
   Debo asegurar que mi código no rompió la app ejecutando el Test/Build:
   (Invocando la Skill "NPM Build")

4. **Sincronización:**
   Una vez aprobado el componente, uso el control de versiones:
   (Invocando la Skill "Git Sync") con el mensaje estricto: `feat([dominio]): agregado nuevo componente estructural`.

5. **Actualizar Documentación:**
   Generar las notas del cambio en la carpeta `.agent/tasks` o actualizar el README del proyecto principal.
