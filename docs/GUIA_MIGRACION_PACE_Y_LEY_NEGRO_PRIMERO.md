# Guía de Migración PACE y Ley Negro Primero (SSSIFANB)

**Proyecto:** `angular/products/ipsfa/sssifanb` (Sandra / IPSFA)  
**Alcance:** Referencia funcional y técnica para entender la base de datos/estructuras de datos conocidas, la migración desde PACE (Kernel legado) y la aplicación de normas/reglas de la Ley Negro Primero en el dominio SSSIFANB.  
**Estado:** Documento vivo. Contiene información consolidada a partir de evidencia existente en el repositorio y marca explícitamente pendientes de completar con extracción profunda (p.ej. Loki/Sentinel, dumps SQL, esquema Mongo productivo).

> **Nota de rigor:** No se inventan detalles de negocio no respaldados. Donde falte evidencia directa (scripts SQL, DDL, tablas productivas, artículos exactos), se indica `TODO (evidencia requerida)`.

---

## 1. Propósito

1. **Unificar conocimiento** para el equipo y agentes que trabajan en SSSIFANB sobre:
   - Qué es PACE y cómo se está migrando su lógica (PHP/Kernel legado → Angular/Rust/Sentinel).
   - Qué datos/entidades intervienen en beneficiarios, nómina, prestaciones, anticipos, medidas judiciales y finiquitos.
   - Qué reglas de cálculo y distribución asociadas a prestaciones sociales y pensiones deben respetarse (Ley Negro Primero y fórmulas derivadas documentadas en el ecosistema).
2. **Servir de insumo** para tareas de: análisis de migración, consultas/transformaciones de datos, validación de cálculos, y diseño de integraciones con Sandra Bunker/SDC y Sentinel (Rust).
3. **Reducir ambigüedad** entre frontend (Angular 17), kernel legado y motor de cálculo objetivo.

---

## 2. Contexto del dominio y arquitectura (resumen)

### 2.1 Componentes involucrados (evidencia repo)

| Componente | Rol | Evidencia |
|---|---|---|
| **PACE** | Plataforma/Kernel legado (PHP MVC) para prestaciones: beneficiarios, anticipos, medidas judiciales, lotes, cálculos/finiquitos. | `angular/products/ipsfa/sssifanb/.agents/skills/pace_kernel_migration/*`, `man/manuales/avances/INFORME_AVANCES.md` (módulo PACE en desarrollo) |
| **SSSIFANB (SPA)** | Frontend Angular 17; incluye vistas/módulos de prestaciones y afiliación que invocan lógica "núcleo PACE" en migración. | `angular/products/ipsfa/sssifanb/AGENTS.md`, referencias en `go/sandra/build/.../sssifanb/src/app/feature/pages/prestaciones/lotes/lotes.component.ts` y afiliación |
| **Sandra Sentinel (Loki)** | Motor de cálculo Rust (gRPC) para nómina, pensiones, prestaciones, Ley Negro Primero. | `.opencode/skills/loki-sentinel/SKILL.md`, `man/manuales/avances/INFORME_AVANCES.md` |
| **Sandra Server / Bunker / SDC** | Integraciones, persistencia, archivos masivos, cifrado/compresión. | `AGENTS.md` del proyecto, skills `data-governance-sandra` (referenciada) |

### 2.2 Principios de migración PACE (evidencia)

- **Origen:** MVC heredado en `pace-kernel` (modelos/kernel, vistas JS con reglas de negocio críticas).  
  - Evidencia: `.agents/skills/pace_kernel_migration/SKILL.md`, `frontend_logic.md`, `formulas_calculo.md`, `guia_desarrollo.md` dentro del proyecto.
- **Concepto "KPerceptron" (legado):** no es IA; es **caché/memoización** de resultados de cálculo. *(Evidencia: skill pace_kernel_migration)*
- **Objeto core:** `MBeneficiario` centraliza datos como `fingreso`, `fultimo_ascenso`, `grado_codigo`, sueldos/primas. *(Evidencia: skill pace_kernel_migration)*
- **Dirección objetivo:** mapear `MBeneficiario` a structs Rust e interfaces TS; transcribir fórmulas de `KCalculo.php` a backend Rust; evitar pérdida de precisión monetaria (tipos `Decimal`, no float nativo). *(Evidencia: skill pace_kernel_migration)*
- **Frontend legado:** lógica crítica en `views/js/` (jQuery) para Finiquito, Anticipos, Medidas Judiciales; dependencia externa **SAMAN** (`consultarSAMAN`, `insertarSAMAN`) a considerar en migración/integración. *(Evidencia: pace_kernel_migration/frontend_logic.md)*
- **Precisión/formatos:** legado maneja montos como float/double y formatea visualmente `number_format(..., 2, ',', '.')`; no persistir formato visual. Fechas ISO `YYYY-MM-DD`. *(Evidencia: pace_kernel_migration/guia_desarrollo.md)*

---

## 3. Modelo / datos relevantes de BD y entidades conocidas

> Esta sección consolida **entidades y campos conocidos** por documentación interna y artefactos de migración. No sustituye un diccionario de datos productivo.

### 3.1 Beneficiario (núcleo PACE) — `MBeneficiario` / equivalente

Campos/propiedades mencionados en guías de migración (mapeo legado → moderno):

| Propiedad (legado) | Tipo sugerido (moderno) | Descripción | Evidencia |
|---|---|---|---|
| `cedula` | `string` | Identificador único | `guia_desarrollo.md` |
| `sueldo_global` | `number` / `Decimal` objetivo | Sueldo base + primas | `guia_desarrollo.md`, fórmulas |
| `sueldo_integral` | `number` / `Decimal` objetivo | Base para prestaciones (SG + AA + AV) | `guia_desarrollo.md`, fórmulas |
| `fecha_ingreso` / `fingreso` | `Date`/`string` | Ingreso FANB | `guia_desarrollo.md`, `pace_kernel_migration/SKILL.md` |
| `fultimo_ascenso` | `Date`/`string` | Último ascenso (cálculo tiempos/antigüedad) | `pace_kernel_migration/SKILL.md` |
| `grado_codigo` | `string`/código | Grado militar | `pace_kernel_migration/SKILL.md` |
| `Componente` | objeto/enum | Componente FANB (EJ/AR/AV/GN según dominio SSSIFANB) | `guia_desarrollo.md`, `AGENTS.md` SSSIFANB |
| `Prima` | `Record<string, number>` / estructura | Primas calculadas | `guia_desarrollo.md` |
| `fecha_retiro` | `Date`/`string` | Condiciona reglas (días aguinaldo/vacaciones) | `formulas_calculo.md` |
| `tiempo_servicio` (TS) | numérico/derivado | Años de servicio | `formulas_calculo.md` |

**TODO (evidencia requerida):** esquema completo de `MBeneficiario`, tablas/colecciones reales (Mongo/Postgres), relaciones con familiares, cuentas bancarias PACE (hay referencia a "Sincronizar cuenta bancaria PACE" en código legacy/build), historial de grados, estatus pensión/sobreviviente, y contratos actuales de API Bunker/Sandra.

### 3.2 Estructuras de nómina/pensión (ecosistema Sentinel/Loki — referencia)

Documento/estructura de ejemplo mencionada en skill de Loki (MongoDB, referencia de motor de cálculo):

```json
{
  "cedula": "V12345678",
  "grado": "SARGENTO",
  "componente": "EJERCITO",
  "ano_servicio": 15,
  "sueldo_base": 500000,
  "conceptos": [{"codigo":"001","descripcion":"SUELDO BASE","monto":500000}],
  "prestaciones": {"pension":{"monto":500000,"tipo":"RESERVA_ACTIVA","porcentaje":50}}
}
```

**Conceptos de nómina (referencia Loki):** 001 Sueldo Base; 002 Asignación Antigüedad; 005 Bono Vacacional; 010 Pensión Reserva Activa; 011 Pensión Sobreviviente; 020 Indemnización Fallecimiento; 030 ISLR. *(Evidencia: `.opencode/skills/loki-sentinel/SKILL.md` — validar vigencia contra normativa y datos reales)*

**TODO:** confirmar mapeo exacto a colecciones/campos de `sssifanb` (Mongo MCP disponible: `sssifanb`, `code-epic`) y a tablas Postgres (`pace`, `pensiones` MCP) cuando se requiera consulta operativa.

### 3.3 Datos capturados desde PACE (scraping / extracción)

- **Origen HTTP legado:** `http://pace.ipsfa.gob.ve:8080/pace/index.php/panel/Panel/consultarBeneficiario/{cedula}` (requiere cookie `ci_session`). *(Evidencia: `scraping/pace/README.md`)*
- **Salida documental:** `out_bnf.json` (arreglo) y `out_bnf.ndjson` (checkpoint) con payload completo devuelto por PACE (~70 campos según README: sueldos, etc.).  
  - Estructura por documento: `{ cedula, status, tipo, respuesta{...}, location, consultado_el, origen }`.
- **Importación Mongo sugerida en tooling:** `mongoimport --db sssifanb --collection pace_beneficiarios ...` (o db/colección personalizadas). *(Evidencia: `scraping/pace/README.md`, `importar_mongo.sh`)*
- **Estados observados:** 200/json con payload; 404 sin registros; 307 a `/Login` (sin sesión) → `sin_sesion.txt`; 500 tras reintentos → `errores.json`.

**TODO (evidencia requerida):** 
- Inventario de campos reales de `respuesta` (diccionario de datos PACE) — requiere muestra/inspección de `out_bnf.*` o colección en BD.
- Lista de **scripts SQL de migración PACE** (archivos `.sql`) versionados en repo: **no se localizaron `.sql` explícitos de migración PACE** en la búsqueda realizada; confirmar existencia en otros repos/rutas de despliegue o anexarlos.
- Mapeo campo-a-campo PACE → modelo SSSIFANB/Sentinel.

### 3.4 Conexiones de datos disponibles en el entorno (MCP configurado)

Según `opencode.json` / AGENTS del workspace: PostgreSQL `pace` (localhost:5432), PostgreSQL `pensiones` (localhost:5432), MongoDB `sssifanb` y `code-epic` (localhost:27017).  
**Uso esperado:** inspección de esquema, consultas de validación y conteos durante migración. **TODO:** documentar tablas/colecciones efectivas y permisos de solo lectura/escritura por conexión.

---

## 4. Lista de SQL / artefactos de migración PACE (estado actual)

| Artefacto | Ubicación / referencia | Descripción | Estado |
|---|---|---|---|
| Scraper de extracción de beneficiarios PACE | `scraping/pace/README.md`, `scraping/pace/pace_scraper.py`, `scraping/pace/importar_mongo.sh` | Extracción HTTP por cédula, generación NDJSON/JSON, importación a Mongo (`pace_beneficiarios` sugerido). | Disponible en repo (verificar vigencia/cookie/red) |
| Lógica de cálculo legado (fuente de "verdad" de fórmulas) | `src/migracion/pace-kernel/models/kernel/KCalculo.php`, `KCalculoLote.php` (referenciados) | Fórmulas de SG, AA, AV, SI, asignación, finiquito/saldos, garantías, días adicionales. | **Referencia documental** en proyecto; archivos PHP no necesariamente presentes en árbol Angular actual — **TODO: ubicar fuente canónica** |
| Lógica frontend legado | `src/migracion/pace-kernel/views/js/` (referenciado) | Reglas cliente (Finiquito, Anticipos, Medidas Judiciales), integración SAMAN. | **Referencia documental** — **TODO: ubicar/copiar para análisis** |
| Scripts `.sql` de migración/ETL PACE | *(búsqueda en repo sin resultados concluyentes)* | DDL/DML de transformación carga→destino. | **TODO (evidencia requerida):** recopilar y listar aquí con ruta, objetivo, orden de ejecución y rollback |

**Plantilla para registrar SQL cuando estén disponibles:**

```text
- Ruta:
- Propósito:
- Precondiciones:
- Tablas/colecciones origen → destino:
- Orden de ejecución:
- Validaciones post-ejecución (conteos, checksums, muestras):
- Riesgos / rollback:
```

---

## 5. Reglas y fórmulas relevantes — Prestaciones (Kernel PACE)

> Fuente: `angular/products/ipsfa/sssifanb/.agents/skills/pace_kernel_migration/formulas_calculo.md` (extraído de `KCalculo.php`/`KCalculoLote.php` según documentación). Validar contra implementación vigente y normativa antes de uso productivo.

### 5.1 Variables
`SG` Sueldo Global, `SI` Sueldo Integral, `AA` Alicuota Aguinaldos, `AV` Alicuota Vacaciones, `TS` Tiempo de Servicio (años), `UT` Unidad Tributaria.

### 5.2 Sueldo Global (SG)
`SG = SueldoBase + Σ(Primas)` (redondeo al final según legado). Primas: Transporte, Año de Servicio, Descendencia, No Ascenso, Especial, Profesionalización.

### 5.3 Alicuota de Aguinaldos (AA)
`AA = ((Días_Aguinaldo * SG) / 30) / 12`  
Días: estándar 120; retiro < 29/10/2016 → 90; retiro entre 29/10/2016 y 31/12/2016 → 105. *(Condiciones según doc legado)*

### 5.4 Alicuota de Vacaciones (AV)
`AV = ((Días_Vacaciones * SG) / 30) / 12`  
Días por TS: `TS <= 14` → 40 (o 50 según fecha retiro > 2016); `14 < TS <= 24` → 45 (o 50); `TS > 24` → 50. Regla especial: si `Fecha_Retiro > 31/12/2016` o activo → 50 días fijos. *(Según doc legado)*

### 5.5 Sueldo Integral (SI) y Asignación de Antigüedad
`SI = SG + AA + AV`  
`Asignacion = SI * TS`

### 5.6 Finiquito y saldos (resumen)
- `Total_Aportados = DepositoBanco + Garantias + Dias_Adicionales`
- `Anticipos_Netos = Movimiento[5] - Movimiento[25]`
- `Saldo = ((DepositoBanco - Anticipos) + Garantias + ComisionServicio) - (Embargos + Monto_Recuperar)`
- `Monto_Recuperar`: si `AsignacionFiniquito - (Asignacion_Depositada + Dias_Adicionales) < 0` entonces deuda por diferencia absoluta.

### 5.7 Garantías y Días Adicionales
`Garantias = (SI / 30) * 15`  
`Dias_Adic = (SM / 30 * 2) * Factor` *(detalle de SM/Factor no especificado en la guía — **TODO**)*

**Advertencias:** verificar siempre validez de `fecha_retiro` antes de cálculos de tiempo; unificar cálculo individual/lote en servicio objetivo; usar `Result<T,E>`/manejo estricto de nulos en migración.

---

## 6. Normas / reglas — Ley Negro Primero (aplicables al dominio)

> La Ley Orgánica de Seguridad Social de la FANB ("Ley Negro Primero") es el marco normativo citado por el proyecto. En este repo se dispone de **reglas de cálculo y referencias de artículos** usadas en skills del ecosistema; **no se incluye el texto legal completo** aquí. Debe contrastarse con la Gaceta/texto oficial vigente.

### 6.1 Referencias de artículos citadas en el ecosistema

| Ámbito | Referencia citada | Evidencia |
|---|---|---|
| Nómina/cálculo general | Art. 34-38 | `.opencode/skills/loki-sentinel/SKILL.md` |
| Bono vacacional (concepto) | Art. 36 | `loki-sentinel` (conceptos) |
| Pensión Reserva Activa | Art. 34-38, 38 | `loki-sentinel` |
| Pensión Sobreviviente | Art. 40-45, 43 | `loki-sentinel` |
| Derecho a acrecer | Art. 45 | `loki-sentinel` |
| Asignación de antigüedad / liquidación | Art. 56-59, 57 | `loki-sentinel` |
| Indemnización fallecimiento | Art. 60-64, 60 | `loki-sentinel` |
| Embargos | Art. 7 | `loki-sentinel` |

**TODO:** enlazar a material normativo interno (`ley-negro-primero` skill referenciada en `AGENTS.md` del proyecto pero **no localizada** como archivo en `.opencode/skills/` durante esta tarea; revisar si existe en otra ubicación o crearla con base legal verificada).

### 6.2 Pensión Reserva Activa — porcentajes por años de servicio (tablas encontradas)

Existen **dos tablas** en skills del repo; pueden corresponder a regímenes/fechas distintas. **No asumir equivalencia sin validación normativa/temporal.**

**Tabla A (skill `afiliacion`, "Pre-2010"):**  
15a=60%, 16a=63%, 17a=66%, 18a=69%, 19a=72%, 20a=75%, 21a=80%, 22a=84%, 23a=88%, 24a=92%, 25a+=99-100% *(según texto de skill)*

**Tabla B (skill `afiliacion` "Post-2010" y `loki-sentinel`):**  
15a=50%, 16a=52%, 17a=54%, 18a=56%, 19a=59%, 20a=62%, 21a=65%, 22a=68%, 23a=72%, 24a=76%, 25a=80%, 26a=84%, 27a=89%, 28a=94%, 29a=99%, 30a+=100%

`pension = ultimoSueldo (o sueldo base aplicable) * porcentaje[anosServicio]` *(fórmula general citada; confirmar base salarial exacta por caso)*

**TODO:** definir regla de selección de tabla (fecha de retiro/causación/régimen) con evidencia legal/casos de prueba.

### 6.3 Distribución pensión de sobreviviente y derecho a acrecer

**Distribución (citada, Loki/Afiliación):**
- EA + HJ + PD → 60% + 20% + 20%
- EA sin HJ (con PD) → 50% + 50% (Loki) / variantes en Afiliación: "Sin PD → EA 60% HJ 40%"; "Sin HJ → EA 50% PD 50%"; "Sin EA → HJ 75% PD 25%"
- Solo EA / Solo PD / Solo HJ → 100%

**Parentescos:** EA (Esposa/o), HJ (Hijo/a), PD (Padre/Madre). *(Evidencia: skill `afiliacion`)*

**TODO:** consolidar matriz canónica de combinaciones (incl. múltiples hijos/padres según norma) y algoritmo de "derecho a acrecer" con fuente normativa y casos.

### 6.4 Otras reglas de negocio citadas (dominio SSSIFANB)

- Componentes FANB: `EJ`, `AR`, `AV`, `GN`. *(AGENTS SSSIFANB)*
- Situación militar (referencia afiliación): ACT, FCP, RCP, I.
- Tiempo reconocido, antigüedad en grado vs tiempo de servicio, historial de grados, carga familiar, estatus pensión/sobreviviente — **relevantes para cálculos**; detalles operativos **TODO**.
- Auditoría de discrepancias nómina/fideicomitentes (`motivo.categorias`, `motivo.campos`) — skill `fideicomitentes-auditoria` referenciada en proyecto.

### 6.5 Fórmulas financieras auxiliares (afiliación, referencia)

- Cuota préstamo (amortización francesa): `cuota = (monto * interes) / (1 - (1 + interes)^-periodo)`
- Interés giro especial: `interes = (monto * tasa_anual / 360) * dias`  
*(Evidencia: skill `afiliacion`; aplicar solo cuando el módulo lo requiera)*

---

## 7. Consideraciones de implementación y calidad

- **Precisión monetaria:** migrar de float/double a tipos decimales controlados (Rust/TS) y evitar formateo en persistencia/cálculo.
- **Fechas:** normalizar a ISO 8601; validar reglas dependientes de fecha de retiro/ingreso/ascenso.
- **Integraciones:** SAMAN (consultar/insertar) y contratos SDC/Bunker no deben romperse sin alineación explícita.
- **Trazabilidad:** toda regla implementada debe poder mapearse a fórmula/artículo/fuente (PHP, Sentinel, norma) y probarse con casos.
- **Seguridad de datos:** credenciales/cookies PACE son sensibles y temporales; no versionar secretos.

---

## 8. Pendientes (backlog de evidencia para completar esta guía)

1. **SQL de migración PACE:** localizar/versionar scripts `.sql`, ETLs y orden de ejecución.
2. **Diccionario de datos PACE:** campos reales de `respuesta` de `consultarBeneficiario` y su semántica.
3. **Fuente canónica kernel legado:** acceso a `pace-kernel` (PHP) referenciado (`KCalculo`, `KPerceptron`, views JS).
4. **Esquema BD real:** colecciones/tablas en `sssifanb`, `pace`, `pensiones` (nombres, índices, claves).
5. **Normativa legal verificada:** texto/articulado aplicable, tabla de porcentajes vigente por régimen/fecha, matriz de sobrevivencia/acrecer.
6. **Casos de prueba:** vectores entrada/salida para SG/AA/AV/SI/finiquito y pensiones.
7. **Skill `ley-negro-primero`:** crear o localizar contenido normativo estructurado en el repo y enlazarlo.

---

## 9. Referencias internas (rutas)

- `angular/products/ipsfa/sssifanb/AGENTS.md` — roles, skills del proyecto, reglas operativas.
- `angular/products/ipsfa/sssifanb/.agents/skills/pace_kernel_migration/` — SKILL, fórmulas, guía desarrollo, lógica frontend (proyecto).
- `.opencode/skills/loki-sentinel/SKILL.md` — fórmulas/segmentos Sentinel y referencias Art. Ley Negro Primero.
- `.opencode/skills/afiliacion/SKILL.md` — fórmulas pensión/prestamos/derecho acrecer, API y tipos.
- `.opencode/skills/valhala-products/SKILL.md` — contexto de productos Angular.
- `scraping/pace/README.md` — extracción PACE y estructura de salida.
- `man/manuales/avances/INFORME_AVANCES.md` — estado PACE/Sentinel/Server.
