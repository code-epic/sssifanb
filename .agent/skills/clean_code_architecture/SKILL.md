---
name: Código Limpio y Arquitectura
description: Principios Clean Code y Patrones (óptimo para IA).
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
