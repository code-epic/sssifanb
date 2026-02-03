---
name: Project Architecture
description: Overview of the project structure and key architectural patterns
---

# Project Architecture

## Directory Structure `src/app`

- **`core/`**: Singleton services, guards, interceptors, and models.
  - `services/`: Global services (e.g. `ApiService`, `AuthService`).
  - `guards/`: Route guards.
  - `interceptors/`: HTTP interceptors.
- **`feature/`**: Business features aimed at specific domains.
  - `pages/`: Page-level components (each subdirectory is a page/feature).
  - `layouts/`: Layout components (e.g., Sidebar, Navbar).
- **`shared/`**: Reusable components, directives, and pipes used across multiple features.

## Key Services

- **`ApiService`** (`core/services/api.service.ts`):
  - Generic wrapper for `HttpClient`.
  - Handles base URL and authentication tokens (if applicable).
  - **Note**: Ensure `environment.ts` is correctly configured (`Url`, `BasePath`, `Hash`).

## Environment Configuration

- Environments are located in `src/environments/`.
- `environment.ts`: Development.
- `environment.prod.ts`: Production.
- Key keys: `Url`, `API`, `Hash` (used for constructing API endpoints).
