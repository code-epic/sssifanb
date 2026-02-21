---
name: Mejores Prácticas de Angular
description: Directrices optimizadas para el desarrollo de Angular.
---

# Estándares de Angular

- **Componentes**: Usa `Standalone Components` (sin NgModules explícitos).
- **Rendimiento**: Emplea `ChangeDetectionStrategy.OnPush`.
- **Inyección**: Prioriza la función `inject()` sobre constructores. Usa `providedIn: 'root'` para singletons.
- **Tipado**: Prohibido usar `any`. Usa Interfaces (`PascalCase`). Emplea Señales (`input()`, `output()`) para I/O.
- **RxJS**: No dejes observables abiertos. Usa `AsyncPipe` en HTML o limpia con `takeUntilDestroyed()`.
- **Estructura**: `feature/pages` para vistas y `shared/` para componentes/botones genéricos altamente reusables.
