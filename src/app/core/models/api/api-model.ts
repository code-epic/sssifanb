



export interface IAPICore{
    id            ?:  string
    concurrencia  ?:  boolean
    ruta          ?:  string
    funcion       ?:  string
    parametros    ?:  string
    protocolo     ?:  string
    retorna       ?:  boolean
    migrar        ?:  false
    modulo        ?:  string
    relacional    ?:  boolean
    valores       ?:  any
    coleccion     ?:  string
    version       ?:  string
    http          ?:  number
    https         ?:  number
    consumidores  ?:  string
    puertohttp    ?:  number
    puertohttps   ?:  number
    driver        ?:  string
    query         ?:  string
    metodo        ?:  string
    tipo          ?:  string
    prioridad     ?:  string
    logs          ?:  boolean
    descripcion   ?:  string
    entorno       ?:  string
    cache         ?:  number
    estatus       ?:  boolean
  }