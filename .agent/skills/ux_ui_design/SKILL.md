---
name: UX/UI Design & Aesthetics
description: Guidelines for minimalist design, specific color themes, and form components keying on HTML/CSS best practices.
---

# UX/UI Design & Aesthetics

## Aesthetic Principles

- **Minimalist Design**: Prioritize clean lines, ample whitespace, and lack of clutter. Interfaces should be intuitive and "breathable".
- **Color Palette**:
  - **Primary Gradient**: Use `linear-gradient(135deg, #5eaaa8 0%, #4a8b89 100%)` for primary buttons, active states, and headers.
  - **Neutral Tones**: Use soft grays and whites for backgrounds to support the minimalist standard.
- **HTML/CSS Rules**:
  - Semantic HTML5 is mandatory.
  - CSS should be modular (SCSS preferred).
  - Avoid `!important` unless strictly necessary for overriding 3rd party libraries.
  - Use Flexbox and Grid for layouts.

## Form Components

All form inputs (Input, Select, Textarea) must follow these strict rules:

1.  **Style**: Simple, flat design with no heavy borders or shadows by default.
2.  **Internal Icons**:
    - Each input field should have an associated internal icon to indicate its purpose visually.
    - Icons should be placed consistently (e.g., inside the left or right padding of the input).
    - Use a consistent icon set (e.g., FontAwesome or Feather Icons as seen in the project).
3.  **Separation**: Evaluate and style each element type (`input`, `select`, `textarea`) separately to ensure specific UX needs are met (e.g., textareas need resize controls, selects need custom arrows).
4.  **Feedback**: Clear visual states for Focus (highlight color), Valid (green tick), and Invalid (red border/text).

## Implementation Example (SCSS)

```scss
.custom-input-group {
  position: relative;

  i {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 10px; // Internal icon positioning
    color: #4a8b89;
  }

  input,
  select,
  textarea {
    padding-left: 35px; // Space for icon
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    &:focus {
      border-color: #5eaaa8;
      box-shadow: 0 0 0 2px rgba(94, 170, 168, 0.2);
    }
  }
}
```
