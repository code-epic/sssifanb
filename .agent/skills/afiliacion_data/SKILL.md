---
name: Manejo de Datos de Afiliación
description: Estructura compleja y tipado base de datos Afiliados.
---

# Afiliación de Datos (IAfiliado)

**Path:** `src/app/core/models/afiliacion/afiliado.model.ts`

- **Titular**: `id` es la Cédula. Incluye propiedades de Estatus Militar (`situacion`, `categoria`) e historia.
- **Persona / Familiares**: Estructura general de datos. `familiar` es un array donde cada miembro tiene su nodo `persona`, `parentesco` ("PD", "HJ") y el booleano `esmilitar`.
- **Fechas BSON/Mongo**: El back-end envía fechados atados a objeto Mongo (ej. `{ "$date": "..." }`). Realiza parseo transicional de pipes/utils _inmediatamente_ llega al front-end Angular hacia `Date` TS originario.
- **Validación**: Basa lógicas condicionales verificando `parentesco` iterado en array de familiares para carnets y cálculos médicos.
