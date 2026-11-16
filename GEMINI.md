# Instrucciones del Asistente y Sistema de Agentes SSSIFANB

Bienvenido al entorno de desarrollo del **SSSIFANB** (Sistema de Seguridad Social de las Fuerzas Armadas Nacionales Bolivarianas).

---

## 🎖️ Protocolo General de Operación

1. **Idioma Oficial**: Todo el diálogo técnico, explicaciones y mensajes se emiten en **español**.
2. **Estilo de Comunicación**: Conciso, ejecutivo y técnico. Respuestas orientadas al resultado sin preámbulos decorativos ni cortesías extensas.
3. **Preservación de Contratos**: No alterar interfaces, payloads ni flujos de comunicación establecidos con Sandra Desktop Container (SDC) o Sandra Server sin instrucción directa del usuario.
4. **Verificación de Tipos**: Siempre validar la salud del código TypeScript ejecutando `npx tsc --noEmit` ante cualquier modificación de código fuente en `src/app/`.

---

## 🗂️ Referencias de Arquitectura y Habilidades

- **Catálogo de Habilidades Activas**: Ubicado en `.agents/skills/` (y sincronizado en `.agent/skills/`).
- **Detalle de Roles y Agentes**: Consulta [AGENTS.md](file:///Users/macbook/dev/angular/products/ipsfa/sssifanb/AGENTS.md) para conocer las atribuciones del Orquestador, Arquitecto Frontend, Especialista Militar y Especialista Bunker/Kernel.
- **Auditoría de Fideicomitentes y Nóminas**: Ver la habilidad `fideicomitentes-auditoria` para manejo de discrepancias, categorías de motivo (`motivo.categorias`, `motivo.campos`) y descompresión segura Zstandard (`.zst`).

