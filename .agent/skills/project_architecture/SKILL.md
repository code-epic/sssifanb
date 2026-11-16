---
name: project-architecture
description: Arquitectura estructural y árbol de directorios de SSSIFANB (core/, feature/pages/, shared/, environments/). Convenciones de ubicación para servicios singleton, componentes de vistas y utilidades compartidas. Activar al planificar la creación o reorganización de módulos y carpetas.
---

# Arquitectura Front-end (`src/app`)

- **`core/`**: Motor del SPA. Servicios Singleton puros (`ApiService`, `AuthService`), Guards interceptivos de Rutas, Interceptores HTTP Globales y Modelos de Interfaz (Types). Reutilizable en todo el app pero instanciado 1 vez.
- **`feature/`**: Agrupación por lógica de negocio.
  - `pages/`: Vistas de ruteo principales.
  - `layouts/`: Contenedores de cascarón visual (Navbars, Sidebars).
- **`shared/`**: UI agnóstica de negocio y compartida y atada visualmente (Directivas, Pipes, Botones, Tarjetas).
- **Entornos (Environments)**: Las llaves API o variables en `src/environments/environment.ts` (`Url`, `API`, `Hash`) mandan sobre las directivas de conexión en red.
