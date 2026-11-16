# Sistema de Agentes y Habilidades SSSIFANB

Este documento define la arquitectura multi-agente, roles especializados, protocolos de comunicación y la matriz de habilidades del sistema **SSSIFANB** (Sistema de Seguridad Social de la Fuerza Armada Nacional Bolivariana).

---

## 🏛️ 1. Arquitectura de Roles Especializados

```mermaid
flowchart TD
    Coord["🎯 Agente Coordinador / Orquestador"] --> Front["🎨 Arquitecto Frontend (Angular 17 / UX-UI)"]
    Coord --> Mil["🎖️ Especialista en Dominio Militar y Seguridad Social"]
    Coord --> Kernel["⚙️ Especialista Bunker & Kernel PACE (SDC / Zstd)"]
    Coord --> DevOps["🛡️ Agente DevOps, Integridad y Git"]
```

### 1.1. Agente Orquestador (Coordinador General)
- **Misión**: Descomponer requerimientos complejos, asignar subtareas y verificar que ningún contrato de integración sea vulnerado.
- **Responsabilidad clave**: Mantener la coherencia arquitectónica y no romper contratos entre el backend Bunker/Sandra y el frontend SPA.

### 1.2. Arquitecto Frontend (`Angular 17` / `UX-UI`)
- **Misión**: Desarrollo de interfaces robustas, responsivas y accesibles en Angular 17.
- **Estándares**:
  - Paleta de diseño SSSIFANB: Degradados teal (`linear-gradient(135deg, #5eaaa8 0%, #4a8b89 100%)`), fondos limpios pastel, esquinas redondeadas (`rounded-16`, `rounded-20`).
  - Prohibición estricta de `!important` en hojas de estilo CSS/SCSS.
  - Maquetación semántica mediante CSS Grid y Flexbox.
  - Validación tipada en TypeScript (compilación limpia bajo `tsc --noEmit`).

### 1.3. Especialista en Dominio Militar y Seguridad Social (FANB)
- **Misión**: Custodiar la integridad normativa y operativa de la Fuerza Armada Nacional Bolivariana.
- **Estándares**:
  - Mapeo normativo de componentes: `EJ` (Ejército), `AR` (Armada), `AV` (Aviación), `GN` (Guardia Nacional).
  - Aplicación del Decreto con Rango, Valor y Fuerza de Ley Orgánica de Seguridad Social de la FANB (**Ley Negro Primero**).
  - Reglas de negocio para tiempo reconocido (años, meses, días), fecha de último ascenso, historial de grados, carga familiar y estatus de pensión/sobreviviente.
  - Auditoría de discrepancias de nómina y fideicomitentes (`motivo.categorias`, `motivo.campos`).

### 1.4. Especialista Bunker & Kernel PACE (`SDC` / `Zstd` / `Rust`)
- **Misión**: Integración con Sandra Desktop Container (SDC), manejo de archivos masivos y migración de algoritmos de cálculo.
- **Estándares**:
  - Integración asíncrona no invasiva con SDC sin alterar contratos existentes.
  - Descompresión en navegador de archivos comprimidos con Zstandard (`.zst`) mediante WASM/`fzstd` usando `Uint8Array`.
  - Migración y refactorización de lógica heredada del Kernel PACE (`MBeneficiario`, `KCalculo.php`).
  - Seguridad criptográfica (AES-256, HMAC, SHA-256) y saneamiento de datos.

### 1.5. Agente DevOps, Integridad y Git
- **Misión**: Asegurar la compilación libre de errores, sincronización de repositorios y estabilidad para producción.
- **Estándares**:
  - Verificación de tipos obligatoria (`npx tsc --noEmit`).
  - Control de versiones estricto con commits semánticos y preservación de copias de seguridad.

---

## 📋 2. Matriz de Habilidades (Skills)

| Skill ID | Nombre / Identificador | Dominio y Alcance |
| :--- | :--- | :--- |
| `fideicomitentes-auditoria` | `fideicomitentes-auditoria` | Auditoría de discrepancias de nómina/fideicomitentes, visor seguro Zstd y cruce de categorías. |
| `ley-negro-primero` | `ley-negro-primero` | Marco jurídico, pensiones, asignaciones y beneficios de la Ley Negro Primero. |
| `afiliacion-data` | `afiliacion-data` | Modelos de datos de afiliados, titulares, causantes, familiares y carnetización TIM. |
| `angular-best-practices` | `angular-best-practices` | Directrices de arquitectura Angular 17, tipado estricto, RxJS y standalone components. |
| `clean-code-architecture` | `clean-code-architecture` | Principios SOLID, refactorización, nomenclatura clara y reducción de deuda técnica. |
| `data-governance-sandra` | `data-governance-sandra` | Integración con Bunker, Sandra Server y Sandra Desktop Container (SDC). |
| `data-processing` | `data-processing` | Procesamiento de archivos masivos, CSV de nómina y buffers binarios. |
| `cryptography` | `cryptography` | Cifrado de datos, firmas digitales, tokens de autenticación y sanitización. |
| `debugging` | `debugging` | Diagnóstico de errores, análisis de consola, breakpoints y resolución de regresiones. |
| `error-handling` | `error-handling` | Interceptores HTTP globales, captura de errores y retroalimentación al usuario. |
| `git-sync` | `git-sync` | Procedimientos estandarizados de Git: diff, commit, checkout y preservación de ramas. |
| `npm-build` | `npm-build` | Compilación de producción, optimización de bundles y verificación `tsc --noEmit`. |
| `pace-kernel-migration` | `pace-kernel-migration` | Migración de lógica PACE PHP a Rust/Angular y memoización con KPerceptron. |
| `project-architecture` | `project-architecture` | Estructura modular (`core/`, `feature/pages/`, `shared/`, `environments/`). |
| `ux-ui-design` | `ux-ui-design` | Estética visual, diseño responsive, paleta pastel/teal y controles de interfaz. |
| `communication-protocol` | `communication-protocol` | Protocolo de comunicación: respuestas ejecutivas en español, sin relleno. |

---

## 🔒 3. Reglas Operativas Inquebrantables

1. **Idioma de Comunicación**: Todas las interacciones, comentarios de código y documentación técnica se realizan exclusivamente en **español**.
2. **Estilo Ejecutivo**: Respuestas directas, concisas y orientadas a la acción técnica, eliminando saludos o introducciones innecesarias.
3. **No Romper Contratos Externos**: Las integraciones existentes con SDC, Sandra Bunker y sockets de lotes no deben ser alteradas salvo solicitud explícita.
4. **Verificación Previa a Cierre**: Antes de finalizar cualquier cambio que involucre TypeScript, se debe certificar la compilación sin errores (`npx tsc --noEmit`).

