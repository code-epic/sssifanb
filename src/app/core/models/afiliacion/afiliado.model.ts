export interface IMongoDate {
    $date: string | { $numberLong: string };
}

export interface IMongoOid {
    $oid: string;
}

export interface IComponente {
    nombre: string;
    descripcion: string;
    abreviatura: string;
}

export interface IGrado {
    nombre: string;
    descripcion: string;
    abreviatura: string;
}

export interface IDatoBasico {
    cedula: string;
    nropersona: number;
    nacionalidad: string;
    nombreprimero: string;
    nombresegundo: string;
    apellidoprimero: string;
    apellidosegundo: string;
    fechanacimiento: IMongoDate;
    sexo: string;
    estadocivil: string;
    fechadefuncion?: IMongoDate;
    nombrecompleto?: string;
    situacion?: string;
    parentesco?: string;
}

export interface ICorreo {
    principal: string;
    alternativo: string;
    institucional: string;
}

export interface IDatoFisico {
    peso: string;
    talla: string;
}

export interface IDatoFisionomico {
    gruposanguineo: string;
    colorpiel: string;
    colorojos: string;
    colorcabello: string;
    estatura: number;
    senaparticular: string;
}

export interface IRedSocial {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
}

export interface ITelefono {
    movil: string;
    domiciliario: string;
    emergencia: string;
}

export interface IDireccion {
    tipo: number;
    ciudad: string;
    estado: string;
    municipio: string;
    parroquia: string;
    calleavenida: string;
    casa: string;
    apartamento: string;
    numero: number;
}

export interface IDatoFinanciero {
    tipo: string;
    institucion: string;
    cuenta: string;
    prioridad: string;
    autorizado: string;
    titular: string;
}

export interface IPartidaNacimiento {
    registro: string;
    ano: string;
    acta: string;
    folio: string;
    libro: string;
    img: string;
}

export interface IPersona {
    datobasico: IDatoBasico;
    correo: ICorreo;
    datofisico: IDatoFisico;
    datofisionomico: IDatoFisionomico;
    redsocial: IRedSocial;
    telefono: ITelefono;
    direccion: IDireccion[];
    historiamedica: any[];
    datofinanciero: IDatoFinanciero[];
    partidanacimiento: IPartidaNacimiento;
    foto: string;
    huella: string;
    firma: string;
    urlcedula: string;
}

export interface ITim {
    id: string;
    idf: string;
    tipo: number;
    nombre: string;
    apellido: string;
    condicion: boolean;
    serial: string;
    fechacreacion: IMongoDate;
    fechavencimiento: IMongoDate;
    responsable: string;
    componente: IComponente;
    grado: IGrado;
    simbolo: string;
    fministro: string;
    fpresidente: string;
    estatus: number;
    ip: string;
    motivo: string;
    usuario: string;
}

export interface IFedeVida {
    numero: string;
    fechacreacion: IMongoDate;
    datobasico: IDatoBasico;
    tipo: number;
    estatus: boolean;
    idf: string;
    direccionex: string;
    fechaex: IMongoDate;
    paisex: string;
}

export interface IFamiliar {
    id: string;
    persona: IPersona;
    fechaafiliacion: IMongoDate;
    parentesco: string;
    esmilitar: boolean;
    condicion: number;
    estudia: number;
    beneficio: boolean;
    documento: number;
    adoptado: boolean;
    documentopadre: string;
    historiamedica: string;
    donante: string;
    situacionpago: string;
    razonpago: string;
    estatuscarnet: number;
    gruposanguineo: string;
    pprestaciones: number;
    tif: ITim;
    fedevida: IFedeVida;
    estatuspension: boolean;
    condicionpago: string;
}

export interface IHistorialMilitar {
    componente: string;
    grado: string;
    categoria: string;
    situacion: string;
    clase: string;
    fresuelto: IMongoDate;
    gradoresuelto: string;
    numeroresuelto: string;
    dreconocido: string;
    nresuelto: string;
    posicion: string;
    dhistorica: string;
    razon: string;
}

export interface IPension {
    grado: string;
    componente: string;
    clase: string;
    categoria: string;
    situacion: string;
    tipo: string;
    estatus: string;
    razon: string;
    fpromocion: string;
    fultimoascenso: string;
    aservicio: number;
    mservicio: number;
    dservicio: number;
    numerohijos: number;
    datofinanciero: IDatoFinanciero;
    pensionasignada: number;
    historialsueldo: any[];
    pprestaciones: number;
    pprofesional: number;
    pnoascenso: number;
    pespecial: number;
    causal: string;
    medidajudicial: any[];
    descuentos: any[];
}
export interface IDatosSueldo {
    sueldo_base: number;
    sueldo_global: number;
    sueldo_integral: number;
    bono_fin_ano: number;
    bono_vacacional: number;
}

export interface IPrimas {
    transporte: number;
    descendencia: number;
    especial: number;
    tiempo_servicio: number;
    no_ascenso: number;
    profesionalizacion: number;
    compensacion_especial: number;
}

export interface IAsignacionAntiguedad {
    asignacion_antiguedad: number;
    capital_banco: number;
    garantias: number;
    dias_adicionales: number;
    total_aportados: number;
    asignacion_depositada: number;
    saldo_disponible: number;
    diferencia_AA: number;
    fecha_ultimo_deposito: string;
    porcentaje_cancelado: number;
    embargos: number;
    anticipos: number;
    fecha_ultimo_anticipo: string;
    comision_servicio: number;
    monto_recuperado: number;
}

export interface IInteresesCaidos {
    total_calculados: number;
    total_cancelados: number;
    total_adeudado: number;
    fecha_ultimo_deposito: string;
    embargo: number;
}

export interface IFideicomiso {
    datos_sueldo?: IDatosSueldo;
    primas?: IPrimas;
    asignacion_antiguedad?: IAsignacionAntiguedad;
    intereses_caidos?: IInteresesCaidos;
}

export interface IAfiliado {
    _id: IMongoOid;
    id: string; // Cédula o ID único
    tipodato: number;
    persona: IPersona;
    categoria: string;
    situacion: string;
    clase: string;
    fingreso: IMongoDate;
    fascenso: IMongoDate;
    fretiro: IMongoDate;
    areconocido: number;
    mreconocido: number;
    dreconocido: number;
    pxnoascenso: number;
    situacionpago: string;
    pprof: number;
    pespecial: number;
    nresuelto: string;
    fresuelto: IMongoDate;
    posicion: number;
    condicion: number;
    pprestaciones: number;
    dhistorica: string;
    componente: IComponente;
    grado: IGrado;
    tim: ITim;
    familiar: IFamiliar[];
    historialmilitar: IHistorialMilitar[];
    appsaman: boolean;
    apppace: boolean;
    appnomina: boolean;
    pension: IPension;
    fideicomiso: IFideicomiso;
    anomalia: any;
    codigocomponente: string;
    numerohistoria: string;
    estatuscarnet: number;
    pasearetiro: boolean;
    cis: any;
    credito: any;
}
