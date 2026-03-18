# 🇻🇪 SSSIFANB: PLATAFORMA INTEGRAL DE GESTIÓN Y SEGURIDAD SOCIAL
**(Ecosistema Sandra Server - Órgano Gestor Digital)**

Este documento constituye el **Manual Institucional, Arquitectónico y Guía de Trabajo** definitivo para el desarrollo continuo del **Sistema de Seguridad Social Integral de la Fuerza Armada Nacional Bolivariana (SSSIFANB)**. Su lectura y comprensión es obligatoria para ingenieros, analistas y operadores involucrados en el ciclo de vida de la aplicación.

---

## 🏛️ I. EXPOSICIÓN DE MOTIVOS Y JUSTIFICACIÓN LEGAL

La República Bolivariana de Venezuela, en concordancia con el diseño de un Estado Democrático y Social de Derecho y Justicia, determina bajo la **Constitución Nacional (Art. 328)** y el ideal bolivariano que la Seguridad Social es la base de la suprema felicidad pública. 

Bajo este lineamiento, el **Decreto con Rango, Valor y Fuerza de Ley Orgánica de Seguridad Social de la Fuerza Armada Nacional Bolivariana (Ley Negro Primero)** fue promulgado (Gaceta Oficial N° 6.209) con el fin de dignificar al profesional militar. 

Nuestra plataforma tecnológica, estructurada sobre el código Angular (Front-End) y procesada por *Sandra Server*, tiene como única motivación ser la materialización binaria de dicha ley. Actúa como el motor matemático e incorruptible que garantiza:  
1. **La inembargabilidad de las pensiones** y la correcta distribución financiera.  
2. El cumplimiento del derecho prestacional y la distribución justa del patrimonio de la FANB operada a través del IPSFA, Seguros Horizonte, BANFANB y Círculo Militar.

### **Ámbito de Aplicación de la Plataforma (Art. 2 de la Ley)**:
El núcleo del sistema y su base de datos protegen y administran a:
- Militar profesional en situación de actividad y de reserva activa.
- Cadetes, alumnos e integrantes de tropas alistadas y profesionales.
- Reserva y Milicia movilizada.
- Familiares inmediatos y sobrevivientes calificados en el Art. 8.

---

## ⚖️ II. ESTRUCTURA FUNCIONAL Y FUNDAMENTACIÓN LEGAL (MENÚ Y SUBMENÚS)

El Árbol de Navegación del Sistema (JSON Frontend para el rol `Admin.SSSIFANB`) es el reflejo exacto del ordenamiento jurídico del Sistema de Seguridad Social Integral. A continuación, se detalla ampliamente cada módulo sin omitir sus argumentos técnicos y jurídicos involucrados.

### 1. 🖥️ MÓDULO PRINCIPAL (`/principal`)
Es la sala situacional operativa de validación inicial.

* **Beneficiarios (`/beneficiarios`)**:  
  - **Fundamento Legal (Art. 8):** Controla rigurosamente el núcleo amparado por el sistema. El código debe catalogar vínculos inquebrantables: el cónyuge, padres, y los hijos (solteros hasta los 18, o hasta los 26 años si se comprueba su inscripción académica, eliminando el límite de edad para hijos con discapacidades comprobadas o enfermedades catastróficas).
  - **Uso Operativo:** Brinda privilegios escalados de CRUD (Crear, Actualizar, Eliminar -en caso de exclusión judicial-). Posee las herramientas para la emisión final de la Tarjeta y `Consultar Netos` (comprobar capacidad de pago).
* **Fideicomiso (`/fideicomiso`)**:  
  - Plataforma de consulta asincrónica de la liquidación de capitales (`DatosSueldo`, `Asignaciones`). Es el tablero transparente donde un operador valida cuánto devenga legalmente el militar en ese trimestre bajo el modelo de fideicomiso.

### 2. 👥 GESTIÓN DE AFILIACIÓN (`/afiliacion`)

* **TIM (`/afiliacion/tim`)**:  
  - La Tarjeta de Identidad Militar (TIM) es el credencial material generado por el sistema que permite al efectivo y a sus familiares el acceso directo a la **Red Sanitaria Militar (Art. 84 y 90)**. No portarla (o no emitirla sistemáticamente) imposibilitaría la atención en hospitales militares.
* **Indicadores (`/afiliacion/indicadores`)**:  
  - Visualización del termómetro demográfico que cruza las bases de datos determinando si el personal activo cumple con sus contribuciones obligatorias.  
  - **Fundamento Legal (Art. 13):** Monitorea la recaudación del 11.5% de la remuneración total (5% exclusivo para pensiones, 6.5% cuidado a la salud).  
* **Liberaciones (`/afiliacion/liberaciones`)**:  
  - Función de seguridad. El sistema es reactivo; puede bloquear cuentas, pagos de medicamentos o anticipos en casos de inconsistencias documentales. En esta ruta, los operadores de alto rango desbloquean administrativamente al civil o militar tras justificar sus trámites en IPSFA.

### 3. 💰 PRESTACIONES SOCIALES (`/prestaciones`)
Este módulo es el "corazón fiduciario" responsable del Capítulo IV de la Ley. Sus algoritmos matemáticos en código resguardan miles de millones de bolívares al año y dictaminan el patrimonio de una vida de servicio.

* **Fundamento Matemático - Asignación de Antigüedad (Art. 57)**: El código debe calcular e inyectar al fondo del militar el equivalente a 15 días de salario integral cada trimestre bajo concepto de Garantía; sumando a ello 2 días extras por cada año vencido. Al momento de generar Finiquitos, el motor debe recalcular los años en base a 30 días continuos mensuales.
* **Fundamento Indemnizatorio (Art. 60 y 61)**: Ante la muerte de un militar.
  - Ocurre en **Acto de Servicio (Art. 60)**: El software calculará de forma expedita una orden equivalente a 36 remuneraciones mensuales al último sueldo (o salarios mínimos, el que sea mayor).  
  - Ocurre **Fuera de Servicio (Art. 61)**: El bloque se reduce a 24 mensualidades.

**Rutas del Módulo:**
- **Anticipos (`/prestaciones/anticipos`)**: Recepción de requerimientos lícitos dictaminados por el reglamento general donde el militar necesita liquidez temprana de su fideicomiso.
- **Finiquitos (`/prestaciones/finiquitos`)**: Es el recibo de culminación existencial dentro de los componentes bajo situación de Activo. Liquidación final matemática.
- **Medidas Judiciales (`/prestaciones/judiciales`)**: Ejecución implacable de los dictámenes de tribunales competentes (separación de bienes, secuestros de capital o manutenciones de menores de edad garantizando sus derechos frente cualquier situación).
- **Movimientos (`/prestaciones/movimientos`)**: Libro Mayor del militar.
- **Órdenes de Pago (`/prestaciones/ordenes-pago`)**: Submódulo donde conviven el flujo de autorización de pagos "Pendientes" pasando al estatus de liquidez ("Ejecutados").
- **Procesos en Lote (`/prestaciones/lotes`)**: Componente masivo de extrema delicadeza. Aquí el servidor iterará sobre miles de Fideicomitentes para calcular (Módulo Calculo) y abonar (Módulo Aportes). Requiere la máxima optimización asíncrona de NodeJS.
- **Reportes (`/prestaciones/reportes`)**.

### 4. 🏅 NÓMINA DE PENSIONADOS (`/nomina`)
Este enorme módulo suple el Capítulo III (Art. 34 al 47) protegiendo el dictamen de que **todas las pensiones militares son inembargables (Art. 7)**.

* **Conceptos (`/nomina/conceptos`)**: Estructura el tabulador.
* **Cálculos (`/nomina/calculos`)**:
  - **Reserva Activa (Art. 34 y 38):** Adquiere pensión tras 15 años de servicio comprobados por el software en Afiliación (percibiendo el 50% del salario de escala), incrementándose dinámicamente hasta los 30 años (100% de la cuota).
  - **Sobrevivientes (Art. 43):** El algoritmo divide legalmente el patrimonio póstumo para evitar desamparo familiar:
    - `60%` asignado a la pareja (Viuda/o - Concubina/o).
    - `20%` distribuido en partes iguales a la cantidad de hijos resultantes de la afiliación inicial.
    - `20%` dirigido a los padres (10% cada uno). Si los padres fallecen, ese 20% es absorbido algorítmicamente por los hijos de forma proporcional.
  - **Invalidez (Art. 46 y 47):** Genera nómina a militares en Acto de Servicio (absoluta permanente gana 100% del nivel que tendría en la escala de retiro, parcial permanente asume el 75%).
* **Patria (`/nomina/patria`)**: Sincronización JSON cifrada hacia las transferencias electrónicas de subsidio estatal.
* **Retroactivos (`/nomina/retroactivos`)**:
  - **Protección Jurídica: Homologación (Art. 39)**. En el momento en que se ingrese a `/configuracion/parametros` el decreto presidencial de aumento de sueldo activo, esta ruta automatiza el retroactivo equiparando instantáneamente la escala del pensionado retirado.
* **Calculadora (`/nomina/calculadora`)**: Motor de simulaciones previas al retiro.

### 5. ⚙️ CONFIGURACIONES GLOBLALES (`/configuracion`)
La consola administrativa de control del Ecosistema Sandra.
* **Parámetros (`/configuracion/parametros`)**: Manejo de Sueldos base, grados militares, antigüedad inter-componentes.
* **Tasa BCV (`/configuracion/tasa-bcv`)**: Motor dinámico que protege la devaluación monetaria mediante inyecciones diarias del Banco Central.
* **Directivas (`/configuracion/directivas`)**: Todo pago extraordinario (Bonos Negro Primero, Aguinaldos de 120 días, etc.) deben tener una directiva PDF del Ministerio de Defensa cargada y leída en este endpoint con número y resolución explícita para legalizar la emisión.
* **Auth Data (`/configuracion/auth-data`)**: Seguridad del Ecosistema. Quien emite pagos no formula cálculos. Todo sistema bancario se rige en esta división piramidal.

### 6. 📊 INDICADORES GLOBLALES (`/indicadores`)
La consola de Estado Mayor. Generación de informes matemáticos directivos sobre los miles de beneficiarios, permitiendo auditorías fiduciarias directas al IPSFA desde los entes rectores del Ejecutivo Nacional.

---

## 💻 III. ARQUITECTURA TÉCNICA E INGENIERÍA DE SOFTWARE

Para soportar la extrema rigidez, capacidad sin margen de error para cálculos salariales, y tiempos de respuestas para bases de datos poblacionales formidables del FANB, la capa Frontend está estructurada en los paradigmas más modernos.

### 1. El Marco Tecnológico "Clean Architecture + Standalone"
Hemos completado el desmantelamiento de sistemas arcaicos de `Modulos` a nivel DOM de Angular (las ramas *NgModules* obsoletas) apuntando hacia micro-arquitecturas de renderizado nativo:

- **Plataforma Angular CLI v17+ / Standalone True:** Implica que el archivo `app.module.ts` ha muerto. Todo componente debe poseer auto-suficiencia para cargar los paquetes que necesite en su `imports:[]`. Esto minimiza radicalmente la memoria en navegador de los equipos administrativos desplegados.
- **Node.js 18.x Runtime Environment** como pilar global de ejecución concurrente.

### 2. Estructura Taxonómica de Directorios
Todo residirá jerárquicamente en:
```text
src/
 ├── app/
 │    ├── core/                # EL MOTOR INMUTABLE A LAS VISTAS
 │    │    ├── api/            # Singularidad de contactos HTTP a SSSIFANB Network (api.service.ts)
 │    │    ├── interceptors/   # Guardianes de las Redes: Captura fallos Globales y anexan Tokens O-Auth2.
 │    │    └── interfaces/     # Data Objects Model (Ej: IAfilado, IUsuario). Evitando inyecciones "Any".
 │    │
 │    ├── feature/             # MÓDULOS DE INTERACCIÓN (EL MENÚ)
 │    │    ├── pages/          # Encapsulaciones de los 6 Módulos descritos en la Fase II. (Afiliación, Nómina...)
 │    │    └── layouts/        # Matrices Maestras de las plantillas (Sidebar, Header "Argon System").
 │    │
 │    └── shared/              # CONSTRUCCIÓN REUTILIZABLE (PATRÓN D.R.Y)
 │         ├── components/     # Dynamic Tables (Paginación), Dropdowns.
 │         └── modals/         # Avisos Confirmatorios destructivos o informativos con outputs dinámicos.
```

### 3. Procedimientos de Empaquetamientos y Red Local
```bash
# Debugger Nativo. Despliegue con mapas de trazabilidad a la SSSIFANB Network (Revisando bloqueos IPSFA)
npm run dev
# Ejecución Equivalente en terminal pura: ng serve --host 0.0.0.0 --port 4200 --source-map=true

# Compilación de Producción Ofuscada y Encriptada para Subidas y Cargas al Servidor Master Sandra Server
npm run build 
```

---

## ⚠️ IV. HOJA DE RUTA GIGANTE, PLAN DE ESTABILIZACIÓN Y DEUDA TÉCNICA (PENDIENTES OBLIGATORIOS)

Ningún despliegue se considerará finalizado hasta superar en un 100% los items de esta hoja de desarrollo crítico:

### **A. Refactorización Extrema de Comunicaciones Capa de Red (The Core API)**
* **Ajuste Creador de `api.service.ts`**: Es inadmisible la dispersión de peticiones de red. Este servicio central debe inyectar por sí mismo el Host+Path derivado del `environments.ts`. Deberá incrustar todos los Headers en las tuberías interceptoras HTTP. Además, será el único gestor de los verbos `HTTP (getOne, getAll, post, put, patch, delete)` a base de Promesas y Observables RxJS robustos.
* **Extinción técnica en `login.service.ts`**: Se ordenará a todos los analistas eliminar bajo severidad el uso arbitrario de módulos `HttpClient` en este o cualquier otro archivo fuera de `api.service.ts`. Toda transacción pasará por el Gateway diseñado arriba. Ocurre lo mismo en cualquier componente que lance de manera suelta un "get".

### **B. Patrones y Políticas Estrictas del UX/UI**
* **Construcción del Servicio de Emisión de Mensajeria (AlertService)**: Crear a nivel Global un inyectable Singleton cuya metodología de desarrollo procese alertas controladas tipificadas bajo `Aviso, Danger, Warn, y Success`.
* **Erradicación del Acoplamiento Tercerizado en Interceptores**: Debemos expurgar paquetes gráficos incrustados directamente dentro de *Network Catchers*. Eliminar el `sweetalert2` del archivo global `auth-interceptor.service.ts` y del `navbar.component.ts`. Delegar este suceso al *AlertService* previamente creado en la cláusula anterior.
* **El Interceptor Global de Errores V2**: Elaborar un intersector (HttpErrorResponse) contundente dedicado a impedir pantallas blancas en la interfaz del cliente. Al producirse un error (400, 403, 500, o colapsos Timeout), redirigirá lógicamente a las páginas controladas. Además, deberá contrastar la data de error devuelta del servidor `Sandra` mediante el mapeo de un diccionario local JSON que explique y determine el código de falta en español preciso.

### **C. Políticas Estrictas de Programación Analítica**
* **La Obligación de Reactividad (Fin al Modelo Angular JS)**: La Plataforma Financiera Gubernamental no admite fallos de validación del cliente. Despojar masiva, absoluta e inflexiblemente cualquier sintaxis bidireccional Template-Driven `([ngModel])`. El sistema ha de ser refactorizado para el uso exclusivo del patrón `ReactiveFormsModule`, garantizando la pureza matemática, validadores simultáneos, *DebounceTime* para grandes tipeos, y *ValueChanges* lógicos para deshabilitar campos sensibles en prestaciones.
* **Directivas Modulares para la Protección de Control**: Inyectar directivas base (directives) que validen o formateen campos centralmente desde el Core. (Ejemplo: Si un cajero financiero tipea cédulas, la directiva no debe dejar escribir letras, debe proveer separadores de miles).

### **D. Herramientas Integrales para Escalabilidad (Estandarización)**
* **Componentización Dinámica de Tabulación (`DynamicTable.component`)**: Dado que las Prestaciones en Lote devolverán objetos JS de alta densidad pesada (miles de registros fiduciarios a la vez con nombres, montos y estatus), el equipo de Front-End debe diseñar un Componente Paginador reutilizable incrustable bajo `<app-dynamic-table>` que aliviane la memoria de retención y la memoria Heap de Angular en navegador.
* **Maquetado de Página CRUD Tipo "Axioma"**: Con el fin de generar el *Manual in Code* definitivo, el último objetivo antes de dar por saneado al Core del sistema, es crear un Formulario/Tabla (CRUD Base) estandarizado en la estructura `feature/pages`. Esta estructura funcionará como el compendio visual integral, incorporando Selectores reactivos combinados, Modales integrados, Calendarios Material y una final emisión de alerta satisfactoria/error, garantizando la escalabilidad inquebrantable que requieran las futuras gestoras y analistas.

---

## 🧮 V. PARAMETRIZACIÓN LEGAL Y FÓRMULAS ALGORÍTMICAS (BUSINESS LOGIC)

Este capítulo es estrictamente codificable. Los ingenieros deben traducir los siguientes postulados dictados por la Ley Orgánica en variables de servidor y condicionales exactos en el Front-End para prevenir fugas de base de datos fiduciarias. Todo campo debe respetar estos modelos matemáticos:

### 1. Variables Globales: Aportes y Contribuciones (Mandato Art. 13, 67 y 105)
Las funciones encargadas de generar liquidación de pago mensual deben inyectar *descuentos mandatorios* exactos:
- **Personal Activo (Sueldo Integral Base):**
  - Fondo de Pensiones: `(Sueldo Integral * 0.05)`
  - Fondo de Cuidado en Salud: `(Sueldo Integral * 0.065)`
  - Fondo de Vivienda: `(Sueldo Integral * 0.01)` *(Nota algorítmica: El estado aporta algorítmicamente el factor * 2 como cuota patronal)*.
  - Fondo de Recreación: `(Sueldo Integral * 0.015)`
  - **Deducción Mínima Legal Parametrizada:** Nivel del `14%` del Sueldo a retener al militar activo mensual.
- **Personal en Reserva Activa (Pensionados):**
  - Fondo de Salud: `(Monto Pensión * 0.065)` exclusivo.

### 2. Motor Lógico del Fideicomiso y Prestaciones (Mandato Art. 57)
El ciclo asincrónico que procesa pagos por antigüedad trimestral invoca las siguientes reglas de bloque comercial:
- **Corridas Trimestrales de Garantía:**
  `Monto Abonar = ( (Sueldo Integral de la Fecha / 30) * 15 )`
- **Corridas Anuales:** (Triggers ejecutables después de que la base de datos `Años_Servicio` > 1).
  `Monto Bono Adicional = ( (Sueldo Integral de la Fecha / 30) * 2 )`
- **Triggers de Despido / Reserva Activa (Pase a Retiro):** Toda fracción superior a `6 Meses` equivale a `1 Año` entero frente a los dictos legales para la liquidación. Al generar el Finiquito total: `Monto_Prestacion_Social = (Último Sueldo Integral Retirado * Años Totales de Servicio Base a 30 días/mes)`. 

### 3. Matriz Ponderada de Pensiones de Reserva Activa (Mandato Art. 38)
Los controladores que envían la orden al pagador en `nomina/calculo` aplican barreras validadores:
- `IF (Años_Servicio < 15) { REJECT() }` -> No califica para carga a Cuenta Pensión.
- `IF (Años_Servicio == 15) { Pension = Ultimo_Sueldo_Integral * 0.50 }`
- `IF (Años_Servicio >= 30) { Pension = Ultimo_Sueldo_Integral * 1.00 }`
- **Algoritmo Intermedio:** Existe un factor de ponderación fraccionaria por cada año entre el límite 15..29 que genera las equivalencias precisas entre el 51% y el 99%.
- **Mecanismo de Piso Económico (Art. 35 y 36):**
  `IF (Pension_Calculada < Salario_Minimo_Nacional) { Pension_Calculada = Salario_Minimo_Nacional }` (Siempre se engloban los componentes y bonos recreacionales).

### 4. Vector de Sobrevivientes e Invalidez (Mandato Art. 43 y 46)
El núcleo que previene el desamparo o desviación del erario militar tras el fallecimiento del servidor. El `Monto` Total del capital fiduciario restante (100%) aplica una matriz de dispersión matemática en la base JSON de familiares:
- **Red de Distribución:**
  - `Asignacion_Viudo/a_o_Pareja_Firmada = Monto * 0.60`
  - `Asignacion_Total_Hijos = Monto * 0.20` *(Nota técnica: A repartirse `Asignacion_Total_Hijos / numeroHijos_Validados`)*.
  - `Asignacion_Total_Padres = Monto * 0.20` *(Nota técnica: `10%` Padre Consanguíneo Validado, `10%` Madre Consanguínea Validada)*.
- **Ruteo de Fallas Familiares (Exclusión de Supervivencia):** El algoritmo Frontend exigirá control: Si faltare estructuralmente en la base de datos de Afiliación uno de los escaños (Ej: Los padres previamente fallecidos), ese `20%` se reubica matemática y legalmente sobre el remanente (ej. sumándose al de Hijos o Pareja) impidiendo que queden fondos flotantes sin liquidar.
- **Generadores Por Invalidez (Art 46):** En vida.
  `Invalidez_Absoluta_Permanente = Base * 1.00` (El 100% de la tabla de la posición del retiro de su escalafón).
  `Invalidez_Parcial_Permanente = Base * 0.75` (Limitación que impida al servidor realizar labores regulares).

### 5. Algoritmo Condicional de Indemnización de Muerte Súbita (Mandato Art. 60 y 61)
Diferencia radical algorítmica antes del pago:
- `SWITCH (Condicion_Fallecimiento_Status)`
  - `CASE (Acto_de_Servicio)`:
    `Liquidacion_Total = Math.max( (Ultimo_Sueldo_Militar * 36) , (Salario_Minimo * 36) )`
  - `CASE (Eventualidad_Fuera_Servicio)`:
    `Liquidacion_Total = Math.max( (Ultimo_Sueldo_Militar * 24) , (Salario_Minimo * 24) )`

### 6. Cron Operativo Transversal (Homologación - Art. 39)
Es vital codificar que las actualizaciones ejecutadas por un analista en `/configuracion/parametros` (Cambiar el tabulador Base Militar Activa por un Decreto Ejecutivo) detone (`Trigger`) **transaccionalmente** un proceso de actualización sobre los expedientes del módulo `Pensionados / Retroactivos`. Esto obedece ciegamente a que **toda pensión es equivalente** al alza real activa sin esperar validaciones burocráticas manuales de aprobación individual.

---
**Generado y documentado para la Gerencia Tecnológica - Plataforma SSSIFANB (Motor Sandra Server)**.
