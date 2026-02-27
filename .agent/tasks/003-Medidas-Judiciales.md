---
title: Estandarización de Workflow de Medidas Judiciales
domain: prestaciones
status: pending
priority: high
---

# 🎯 Tarea 003: Implementación del Módulo de Medidas Judiciales

## 📋 Descripción del Requerimiento

Siguiendo el éxito del patrón "Mailbox Workflow" aplicado en Anticipos, se requiere implementar el módulo de **Medidas Judiciales**. Este módulo debe permitir la visualización de la bandeja de entrada (pestañas por estado), la consulta de militares y el registro de nuevas medidas judiciales a través de un modal elegante y segmentado.

## 🏗️ Estrategia de Implementación

### Fase 1: Estructura Base (Mirroring Anticipos)

Adaptar `judiciales.component.ts` para heredar de `BaseWorkflowClass` y configurar la tabla dinámica principal.

- **Tabs:** RECIBIDO, PROCESO, EJECUTADO, SUSPENDIDO.
- **Configuración de Tabla:** Cédula, Nombres, Tipo, Oficio, Expediente, Monto, Estatus.
- **Acciones:** Aprobar, Rechazar, Ver Detalle.

### Fase 2: Interfaz de Usuario (HTML/SCSS)

Implementar el layout en `judiciales.component.html` usando `<app-mailbox-layout>`.

- **Consulta de Militar:** Integrar el formulario moderno de identificación (el patrón refinado en Anticipos).
- **Estilo:** Mantener el tema **Verde Pastel** y los botones iconográficos circulares.

### Fase 3: Modal de Registro Paso a Paso (Wizard Elegante)

Diseñar un modal `modalSolicitar` segmentado para el registro de la medida, basado en los campos del Kernel PHP (`medidajudicial.php`):

- **Paso 1: Datos del Oficio:** Número de Oficio, Expediente, Tipo (Antigüedad/Intereses), Fecha.
- **Paso 2: Cálculos y Montos:** Porcentaje, Salarios, Mensualidades, U.T., Monto Total (con botón de cálculo).
- **Paso 3: Autoridad e Institución:** Institución, Autoridad, Cargo, Estado, Ciudad, Municipio.
- **Paso 4: Beneficiario:** Nombre del Beneficiario, Cédula, Parentesco, Datos del Autorizado.

## 📝 Campos Técnicos a Migrar (Kernel PHP)

- `numero_oficio`, `numero_expediente`, `tipo`, `fecha_oficio`.
- `porcentaje`, `salario`, `mensualidades`, `ut`, `monto_total`.
- `institucion`, `autoridad`, `cargo`, `estado`, `ciudad`, `municipio`.
- `beneficiario`, `cedula_beneficiario`, `parentesco`, `cedula_autorizado`, `autorizado`.
