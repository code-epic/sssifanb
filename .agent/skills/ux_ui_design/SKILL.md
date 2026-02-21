---
name: UX/UI Design & Aesthetics
description: Guía de renderización de colores, marcados y componentes UI.
---

# Requerimientos UX/UI

- **Estética**: Minimalista. Mucho espacio negativo, asíncronía simétrica. Erradicar ruidos y saturación visual.
- **Paleta de Color Base**: Sombrea CTAs primarios, Headers destacables o Focos activos de impacto obligatorio con el degradado: `linear-gradient(135deg, #5eaaa8 0%, #4a8b89 100%)`.
- **Estructura HTML/CSS**:
  - `HTML5` totalmente semántico.
  - Prohibición frontal del uso del aditamento destructivo `!important` en CSS salvando reescrituras de la librearía ajena asíncrona inmodificable.
  - Emplea exclusivamente agrupadores resolutivos modulares `Flexbox` genéricos o matrices `CSS Grid`.
- **Controles UI (Inputs, Selects, Textareas)**:
  - Planos, limpios, border final de borde tenue, focus ring color primario `#5eaaa8`.
  - Obligatorio: Inserta un Icono Vectorial UI descriptivo (FontAwesome u Feather) contiguo internamente en cada input resolutivo referencial o caja de control.
  - Asigna estados visuales verde (Valid) o rojo (Invalid) como retroalimentación real.
