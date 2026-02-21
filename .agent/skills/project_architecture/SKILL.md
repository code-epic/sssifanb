---
name: Project Architecture Angular
description: Árbol de directorios general y patrones espaciales.
---

# Arquitectura Front-end (`src/app`)

- **`core/`**: Motor del SPA. Servicios Singleton puros (`ApiService`, `AuthService`), Guards interceptivos de Rutas, Interceptores HTTP Globales y Modelos de Interfaz (Types). Reutilizable en todo el app pero instanciado 1 vez.
- **`feature/`**: Agrupación por lógica de negocio.
  - `pages/`: Vistas de ruteo principales.
  - `layouts/`: Contenedores de cascarón visual (Navbars, Sidebars).
- **`shared/`**: UI agnóstica de negocio y compartida y atada visualmente (Directivas, Pipes, Botones, Tarjetas).
- **Entornos (Environments)**: Las llaves API o variables en `src/environments/environment.ts` (`Url`, `API`, `Hash`) mandan sobre las directivas de conexión en red.
