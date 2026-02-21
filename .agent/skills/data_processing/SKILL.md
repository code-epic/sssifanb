---
name: Processamiento y Optimización de Datos
description: Técnicas para grandes archivos y flujos streaming.
---

# Procesamiento de Datos

- **Cargas Masivas (Archivos)**: Implementa "Chunking" (cargas por trozos) para evitar cuelgues del navegador. Valida formato/tamaño localmente antes de subir. Utiliza `Web Workers` si se parsean JSON/CSV inmensos.
- **Flujos (Streaming)**:
  - Respeta el `Backpressure` (contrapresión): no ahogues la UI con más datos de los que puede dibujar.
  - Usa `Virtual Scrolling` (ej. Angular CDK) para renderizar únicamente lo visible.
  - Regula con operadores RxJS (`throttleTime`, `debounceTime`).
- **Gestión de Cierre**: Purga observables y limpiezas al destruir componentes (`ngOnDestroy` / `takeUntilDestroyed`). No mantengas macro-objetos en memoria persistente.
