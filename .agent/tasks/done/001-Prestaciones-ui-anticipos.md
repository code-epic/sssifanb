---
title: UI Anticipos de Prestaciones
domain: prestaciones
status: pending
priority: high
---

# 🎯 Tarea 001: Módulo UI de Anticipos (Prestaciones)

## 📋 Descripción del Requerimiento

Construir y estilizar el componente `anticipos` dentro del nuevo módulo de Prestaciones Sociales del sistema SSS IFANB. Esta interfaz reemplazará a la versión anterior, modernizando el flujo de trabajo para revisar pendientes y crear nuevas solicitudes, adhiriéndose estrictamente al estándar UI Pastel/Glassmorphism.

## 🧱 Estructura y Vistas de la Interfaz

### 1. Vista Principal: Bandeja de Pendientes

Al inicializar el módulo (de manera análoga al `TimComponent`), la pantalla primaria debe cargar una **Lista de Anticipos Pendientes**.

- **Componente a usar:** `app-dynamic-table`
- **Columnas obligatorias:**
  - Cédula
  - Nombre
  - Montos
  - Fecha (de solicitud)
  - Estatus (Ej. Pendiente)
  - Grado
  - Componente
- **Acciones de Fila:** Botones de acción incrustados usando la reciente optimización de _hover actions_ estandarizada en el orquestador.
- **Acciones Generales de Tabla:** Debe incluir un botón de acción superior para **"Exportar a CSV"**.

### 2. Flujo: Nuevo Anticipo (Botón `+`)

En la parte superior / header de la vista principal debe existir un Floating Action Button o un botón primario de **"Nuevo Anticipo"**. Al pulsarlo, debe abrirse un formulario, card o modal (según el framework UI definido) que permita ingresar la cédula del militar y cargar la siguiente información básica:

- Cédula
- Nombres y Apellidos
- Componente Militar
- Grado
- Fecha de Nacimiento
- Sexo
- Fecha de Ingreso a la Fuerza
- Fecha de Último Ascenso

### 3. Vista Secundaria / Histórico

Debajo del formulario de "Nuevo Anticipo" (o en un tab adjunto a la creación), se debe visualizar una segunda tabla `dynamic-table` que despliegue el **Trazado Histórico**: las solicitudes de anticipo _anteriores_ que haya realizado ese militar en particular.

## 🎨 Requisitos Estrictos de UX / UI Design (Compliance)

- **Glassmorphism:** Las tarjetas principales y modales deben mantener transparencia, blur de fondo y bordes redondeados orgánicos.
- **Paleta Pastel:** Los badges de "Componente", "Estatus" y "Grado" deben usar colores semánticos pastel tenues pero de buena lectura.
- **Interactividad:** La transición entre la tabla principal y la vista de "Nuevo Anticipo" debe sentirse como una experiencia SPA (Single Page Application) suave (usando enrutamiento interno o condicionales asíncronos limpios).
- Usar rigurosamente los componentes compartidos para no re-escribir lógica de exportación, paginación, o renderizado tabular.
