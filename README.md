## Dashboard Code Epic

Plantila de estilo Argon 

### Requerimientos

Nodejs +14
Angular +13


### Nueva Estructura de Carpetas

src
 |
 |  app
 |   |   core -------------------(negocio)
 |   |     |   api 
 |   |     |   guards 
 |   |     |   inteceptors 
 |   |     |   models 
 |   |     |   service 
 |   |  feature ------------------(vista)
 |   |     |    layouts
 |   |     |    pages
 |   |  shared  ------------------(comunes)
 |   |     |    components
 |   |     |    modals 
 |   |
 |  assets
 |  enviroments


### Cambios Realizados

- Upgrade de angular/core v13 to v17.
- Upgrade de angular/material v13 to v17.
- Upgrade de @ng-bootstrap/ng-bootstrap": "16.0.0".
- Upgrade de ngx-bootstrap": "12.0.0".
- Upgrade de typescript": "5.4.5".
- Restructuracion de carpetas del proyecto, para seguir los estandares de Angular.
- Mejora en los componentes del formulario existente, para mitigar errores en consola y mal comportamiento en su carga inicial.
- Migracion de modulos a el nuevo patron de standalone, es uso de importaciones a nivel de componentes.
- Eliminacion de los modulos existentes.
- Se incorporaron en los componentes la bandera standalone en true.
- Migracion del module app.module.ts a la nueva estructura dentro del main.ts como se establece en angular v17 y v18.


### Pendientes 

- se debe ajustar el ```api.service.ts``` para que el mismo archivo contruya el host+path del enviroment, headers y crear metodos tipo post, getOne, getAll, put, patch, delete...

- se debe ajustar el ```login.service.ts``` para que su clase implemente del api.service con los metodos ya establecidos y adicional se debe eliminar las importaciones al httpClient, el unico httpClient que debe existir es el del ```api.service.ts```.

- se debe crear un servicio el cual tenga la responsabilidad de los mensajes en la aplicacion es decir... alertas, errores, exito y confirmaciones.

- se debe eliminar del ```auth-interceptor.service.ts ``` la invocacion de la libreria sweetalert y cambiarlo por el servicio nuevo que se habla en el paso anterior.

- se debe eliminar del ```auth-interceptor.service.ts ``` la invocacion de la libreria sweetalert y cambiarlo por el servicio nuevo que se habla en el paso anterior.

- se debe eliminar del ```navbar.component.ts ``` la invocacion de la libreria sweetalert y cambiarlo por el servicio nuevo que se habla en el paso anterior.

- se debe revisar el comportamiento de porque el hot-reload tarda para compilar.

- crear componente dinamico para el uso de las tablas, la cual cumpla con paginador.

- cambiar la implementacion de los formulario tipo angularjs a formularios reactivos.

- agregar global-error-interceptor para poder manejar en un solo sitio cualquier tipo de error 401, 500, 400, etc.

- incorporar una lista de errores controlados de tipo json dado un codigo/value que se proporcione en el back.

- crear formulario de tipo crud para que sirva de guia para el uso de los componentes dinamicos de tabla y modales (utilizando formularios reactivos)

- crear formulario simple con select, input, checkbox, datepicker y al final imprimir una ventana de confirmacion y (resultado exitoso, resultado fallido y algun warns).

- incorporar en la capa core el uso de directivas para las validaciones en formularios centralizadas.



