---
name: Clean Code & Architecture
description: implementation of design patterns and clean code principles.
---

# Clean Code & Design Patterns

## Design Patterns

1.  **Singleton**: Used for core services (`ApiService`, `AuthService`).
2.  **Observer**: Heavy use of RxJS Observables for state management and event handling.
3.  **Facade**: Create facade services to abstract complex logic from components.
4.  **Adapter**: Use adapters to transform API responses into UI-friendly models.

## Clean Code Principles

1.  **SOLID**: strictly adhere to SOLID principles.
    - **S**: Single Responsibility Principle (Components should just present, Services should handle logic).
    - **D**: Dependency Injection (Angular's core).
2.  **DRY (Don't Repeat Yourself)**: Extract common logic into utils or shared services.
3.  **Naming Conventions**:
    - Variables: `camelCase`.
    - Classes/Interfaces: `PascalCase`.
    - Constants: `UPPER_SNAKE_CASE`.
    - Observables: Suffix with `$` (e.g., `users$`).
4.  **Functions**: Small, focused functions. If a function does more than one thing, refactor it.
5.  **Comments**: Code should be self-documenting. Use comments _only_ for "Why", not "What".

## Directory Organization

- Keep related files together (Component, Template, Styles, Tests).
- Use "Barrel" files (`index.ts`) sparingly and only for cohesive modules like `models` or `shared/components`.
