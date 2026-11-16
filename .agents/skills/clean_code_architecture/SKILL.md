---
name: clean-code-architecture
description: Principios Clean Code, SOLID y patrones de diseño en TypeScript/Angular. Separación de responsabilidades (UI en componentes, lógica en servicios), nomenclatura estándar (camelCase, PascalCase, UPPER_SNAKE_CASE) y funciones puras reutilizables. Activar al refactorizar, estructurar código nuevo o diseñar clases y utilidades.
---

# Código Limpio

- **SOLID & DRY**: Funciones puras orientadas a una sola tarea. Evita código duplicado encapsulando lógicas en utiles (`Utils`). Separación estricta: Componentes pintan UI, Servicios ejecutan lógica/HTTP.
- **Patrones**:
  - `Observer / RxJS`: Gestión de eventos asíncronos en todo el flujo.
  - `Singleton`: Servicios en raíz.
- **Nomenclatura**:
  - Variables y funciones: `camelCase`.
  - Interfaces y Modelos: `PascalCase`.
  - Constantes: `UPPER_SNAKE_CASE`.
  - Flujos RxJS / Observables: Siempre añade el sufijo `$` (ej., `dataStream$`).
- **Comentarios**: Comenta únicamente para explicar _por qué_ se tomó una decisión anómala. No describas lo que ya hace la función.
