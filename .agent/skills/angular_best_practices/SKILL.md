---
name: angular-best-practices
description: Estándares y mejores prácticas de Angular 17. Componentes standalone, ChangeDetectionStrategy.OnPush, inyección con inject(), señales (signals), gestión de RxJS con takeUntilDestroyed() o AsyncPipe, y tipado estricto sin any. Activar al crear o modificar componentes, directivas, pipes, templates o servicios de Angular.
---

# Estándares de Angular

- **Componentes**: Usa `Standalone Components` (sin NgModules explícitos).
- **Rendimiento**: Emplea `ChangeDetectionStrategy.OnPush`.
- **Inyección**: Prioriza la función `inject()` sobre constructores. Usa `providedIn: 'root'` para singletons.
- **Tipado**: Prohibido usar `any`. Usa Interfaces (`PascalCase`). Emplea Señales (`input()`, `output()`) para I/O.
- **RxJS**: No dejes observables abiertos. Usa `AsyncPipe` en HTML o limpia con `takeUntilDestroyed()`.
- **Estructura**: `feature/pages` para vistas y `shared/` para componentes/botones genéricos altamente reusables.
