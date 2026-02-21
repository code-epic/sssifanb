---
name: Migración y Kernel PACE
description: Estructura del Kernel PHP heredado y lógica a migrar.
---

# Migración de Kernel PACE (PHP a Rust/Angular)

- **Arquitectura Origen**: Arquitectura MVC heredada en `src/migracion/pace-kernel/` (ej. `models/kernel/`).
- **Concepto "Perceptrón"**: En este sistema NO es IA. Es simplemente un mecanismo de Caché Memoria Intrasinóptica/Memoización (`KPerceptron.php`) que almacena resultados de cálculo para evitar recalcular.
- **Objeto Core (MBeneficiario)**: Centraliza `fingreso`, `fultimo_ascenso`, `grado_codigo` vitales para pagos.
- **Guía de Refactorización**:
  1. Mapea la clase `MBeneficiario` en PHP hacia _Structs en Rust_ e Interfaces TypeScript.
  2. Transcribe fórmulas matemáticas de `KCalculo.php` hacia el backend en Rust.
  3. Evita pérdida de precisión con la moneda usando contenedores estructurados (ej. Tipos `Decimal`) no flotantes simples nativos.
