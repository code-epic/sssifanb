---
name: fideicomitentes-auditoria
description: Flujo de conciliación, auditoría de discrepancias y carga de nómina de Fideicomitentes. Validación del objeto motivo (categorías GRADOS, FECHAS, TIEMPO_RECONOCIDO, FAMILIA, PROFESION), normalización de códigos de componente (GN, AR, AV, EJ), compresión/descompresión zstd-codec en memoria y enlace aislado con Sandra Desktop Container (SDC). Activar al trabajar en fideicomitentes, carga de nóminas o auditorías de discrepancias.
---

# Conciliación y Auditoría de Fideicomitentes

Guía especializada para la gestión de nóminas de fideicomitentes, auditoría de discrepancias y comunicación con el contenedor Sandra Desktop (SDC).

## 1. Normalización de Componentes Militares
Todo componente debe ser resuelto mediante la función centralizada `obtenerCodigoComponente`:
- **Guardia Nacional / GNB** -> `GN`
- **Armada Bolivariana** -> `AR`
- **Aviación Militar** -> `AV`
- **Ejército Bolivariano** -> `EJ`

Al consultar `LISTAR_TMP_COMPONENTE` (`IPSFA_CTmpComponente`), el parámetro de componente se envía en minúsculas:
`"aviacion"`, `"ejercito"`, `"guardia"`, `"armada"`.

## 2. Auditoría de Discrepancias y Objeto Motivo
La respuesta del endpoint `crudstream` para `LISTAR_REVISION_FIDEICOMITENTES` provee un objeto estructurado `motivo`:
```json
{
  "casos": "rechazos",
  "cedula": "11439805",
  "detalles": { ... },
  "linea": "11439805;1040;4;1996-07-05;2023-07-05;35;0;0;0",
  "motivo": {
    "categorias": ["GRADOS"],
    "campos": [
      {
        "campo": "grado",
        "valor_csv": "1040",
        "valor_sssifanb": "30"
      }
    ]
  }
}
```

### Reglas de Mapeo:
- **`motivo.categorias`**: Mapea directamente a las carpetas del explorador (`GRADOS`, `FECHAS`, `TIEMPO_RECONOCIDO`, `FAMILIA`, `PROFESION`, `NUEVO`, `REINCORPORADOS`, `PARALIZADOS`, `CAMBIO_COMPONENTE`, `RETIRADOS`).
- **`motivo.campos`**: Alimenta el listado detallado de diferencias con `valor_csv` (origen CSV) y `valor_sssifanb` (sistema gRPC).
- **Delimitador de Línea CSV**: `linea` puede estar separada por punto y coma (`;`) o coma (`,`). Detectar siempre el delimitador antes de procesar para evitar falsos positivos en todas las carpetas.

## 3. Compresión y Descompresión ZSTD en Memoria
El proyecto utiliza `zstd-codec` para archivos `.zst`.

> [!CAUTION]
> El buffer devuelto por `zstd-codec` es una vista de memoria WASM directa. Pasarlo directamente a un `Blob` o enviarlo vía `postMessage` provoca un error fatal `DataCloneError`.
> **Siempre** se debe realizar una copia defensiva hacia un `Uint8Array` estándar de JavaScript:
> ```typescript
> const safeArray = new Uint8Array(decompressedWasm);
> ```

## 4. Aislamiento con Sandra Desktop Container (SDC)
- El mensaje `START_DOWNLOAD` está reservado exclusivamente para procesos en lote de PACE en `lotes.component.ts`.
- Las descargas individuales de expedientes deben manejarse a través de canales aislados o mediante `ApiService.getFile()` / `postBlob()` sin interferir con los listeners de `EXEC_FNX_FINALIZADO`.

