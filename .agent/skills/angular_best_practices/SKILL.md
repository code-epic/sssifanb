---
name: Angular Best Practices
description: Guidelines and standards for Angular development in this project
---

# Angular Development Standards

## Component Architecture

- **Standalone Components**: This project uses Angular Standalone Components. avoid `NgModules` unless absolutely necessary for legacy integrations.
- **Change Detection**: Prefer `ChangeDetectionStrategy.OnPush` for performance optimization where possible.
- **Inputs/Outputs**: Use `input()` and `output()` signals where possible (Angular 17+), or standard `@Input()`/`@Output()` with strict typing.

## Coding Style

- **Strict Typing**: Avoid `any`. Define interfaces in `core/models` or `feature/models`.
- **Services**: Inject services using `inject()` function or constructor injection. Use `providedIn: 'root'` for singleton services.
- **RxJS**: Manage subscriptions carefully. Use `AsyncPipe` in templates or `takeUntilDestroyed` operator.

## Directory Structure

- Place new features in `src/app/feature/pages/`.
- Reusable UI specific to a feature stays in that feature folder.
- Truly global shared components go in `src/app/shared/`.
