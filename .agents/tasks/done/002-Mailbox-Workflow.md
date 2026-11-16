---
title: Estandarización de Workflow Mailbox (Bandeja de Tareas)
domain: arquitectura
status: completed
priority: high
---

# 🎯 Tarea 002: Refactorización al Patrón "Mailbox Workflow"

## 📋 Descripción del Requerimiento

El sistema actualmente repite la misma lógica de "Bandeja de Entrada" (Tabs por estados, Tablas dinámicas y llamadas de API con parámetros cambiantes) en múltiples componentes como TIM y, prontamente, Anticipos. Se requiere abstraer este comportamiento en un flujo de trabajo genérico y heredable por cualquier nuevo subsistema.

## 🏗️ Estrategia de Arquitectura Propuesta

### Fase 1: Abstracción de UI (El Componente Shared)

Crear un componente reutilizable `<app-mailbox-layout>` en `src/app/shared/components/`.

- **Qué Hará:** Dibujará el menú de carpetas estilo correo (Inbox, Proceso, Aprobado), controlará el "Active State" de las pestañas basándose en los estados numéricos, y dibujará el layout de grid principal.
- **Parametrización:** Recibirá un `@Input()` con los Tabs a renderizar.
- **Inserción:** Utilizará `<ng-content select="[mailbox-body]"></ng-content>` para que componentes hijos inyecten su tabla dinámica principal o su formulario de "Nuevo".

### Fase 2: Herencia Lógica (TypeScript)

Crear un archivo `base-workflow.class.ts`.

- **Variables Abstraidas:** `xAPI`, `estadoOrigen`, `estatusDestino`, configuraciones del paginador, entre otros.
- **Funcionalidades Genéricas:** Función `loadInboxTasks()` que acepte dinámicamente el Payload.
- **Implementación:** `TimComponent` y `AnticiposComponent` pasarán de usar implementaciones directas a hacer `extends BaseWorkflowClass`.

### Fase 3: Pruebas de Terreno (Anticipos)

Antes de tocar el frágil módulo `TIM`, se utilizará la recién creada pantalla de `Anticipos de Prestaciones` como "Piloto" para heredar esta clase compartida y consumir el `<app-mailbox-layout>`.
