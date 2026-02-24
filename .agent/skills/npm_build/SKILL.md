---
name: Compilación NPM Build (Angular Production)
description: Habilidad estandarizada para compilar la aplicación Angular SSS IFANB para ambientes de despliegue.
---

# 🏗️ NPM Build Skill (Angular 17)

Esta habilidad asegura que la aplicación web, de diseño paramilitar crítico, sea compilada correctamente, optimizada y sin errores de typescript/linting antes de intentar un despliegue.

## 📌 Contexto Estratégico

El SSS IFANB contiene módulos tan grandes e importantes como:

- Nómina y Cálculos Integrales.
- Prestaciones Sociales.
- Afiliación y Carnetización TIM.

Cualquier fallo en el Build de producción es inaceptable. Se deben solucionar los errores de linting / build antes de forzar cualquier empaquetado final.

## 🛠️ Procedimiento de Operación del Sub-Agente

1. **Test y Verificación (Recomendado):**
   Asegúrate de ejecutar un lint básico o revisar la salud estructural si lo requiere el Orquestador:

   ```bash
   npm run lint
   # o bien, npx ng lint (si tienes el builder configurado)
   ```

2. **Ejecutar el Build (Producción):**
   Dado que estamos usando Angular 17, el comando base generará la carpeta `dist/`.

   ```bash
   npm run build -- --configuration production
   # o directamente: ng build --configuration production
   ```

3. **Verificación post-compilación:**
   Comprueba que se haya generado correctamente la carpeta de distribución e informa del peso del paquete resultante:
   ```bash
   du -sh dist/
   ```

## 🚨 Manejo de Errores (Troubleshooting)

Si el Build falla, **DEBES PARAR** y notificar al Orquestador:

- Identifica si el error es de sintaxis (TypeScript).
- Identifica si el fallo proviene del diseño (componentes no importados) o librerías desactualizadas de npm.
- Consulta inmediatamente la Skill de "Manejo de Errores" si la falla persiste.
