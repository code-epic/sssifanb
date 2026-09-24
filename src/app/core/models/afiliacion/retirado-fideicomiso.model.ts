export interface IRetiradoFideicomisoCalculo {
  anticipos?: string;
  anticipos_aux?: number;
  asignacion_antiguedad?: string;
  asignacion_antiguedad_aux?: number;
  asignacion_antiguedad_fin?: string;
  asignacion_antiguedad_fin_aux?: number;
  asignacion_antiguedad_rec?: string;
  asignacion_antiguedad_rec2?: string;
  asignacion_antiguedad_rec2_aux?: number;
  asignacion_antiguedad_rec_aux?: number;
  asignacion_depositada?: string;
  asignacion_depositada_aux?: number;
  asignacion_diferencia?: string;
  asignacion_diferencia_aux?: number;
  asignacion_diferencia_rec?: string;
  asignacion_diferencia_rec2?: string;
  asignacion_diferencia_rec2_aux?: number;
  asignacion_diferencia_rec_aux?: number;
  capital_banco?: string;
  capital_banco_aux?: string | number;
  comision_servicios?: string;
  comision_servicios_aux?: number;
  dias_adicionales?: string;
  dias_adicionales_aux?: number;
  diferencia_AA?: string;
  diferencia_patria?: string;
  diferencia_patria_aux?: number;
  embargos?: string;
  embargos_aux?: number;
  fallecimiento_actoservicio?: string;
  fallecimiento_actoservicio_aux?: number;
  fallecimiento_fueraservicio?: string;
  fallecimiento_fueraservicio_aux?: number;
  fecha_dife_patria?: string;
  fecha_ultimo_anticipo?: string;
  fecha_ultimo_deposito?: string;
  finiquito_embargo?: string;
  finiquito_embargo_aux?: string;
  garantias?: string;
  garantias_aux?: number;
  interes_capitalizado_banco?: string;
  medida_judicial_activas?: string;
  medida_judicial_activas_aux?: number;
  monto_recuperado?: string;
  monto_recuperado_aux?: number;
  monto_recuperar?: string;
  monto_recuperar_aux?: number;
  observacion_patria?: string | null;
  porcentaje?: number;
  porcentaje_cancelado?: string;
  saldo_disponible?: string;
  saldo_disponible_aux?: number;
  saldo_disponible_fini?: string;
  saldo_disponible_fini_aux?: number;
  total_aportados?: string;
  total_embargos?: string;
  total_embargos_aux?: number;
}

export interface IRetiradoFideicomisoDirectivaDetalle {
  Prima?: any[];
  ano_servicio?: string;
  grado_id?: string;
  sueldo_base?: string;
}

export interface IRetiradoFideicomisoDirectiva {
  Detalle?: { [key: string]: IRetiradoFideicomisoDirectivaDetalle };
  fecha_inicio?: string;
  fecha_vigencia?: string;
  id?: string;
  nombre?: string;
  numero?: string;
  salario?: any;
  unidad_tributaria?: string;
}

export interface IRetiradoFideicomisoPrimaDetalle {
  id?: string;
  monto_nominal?: string;
  monto_unidad_tributaria?: string;
}

export interface IRetiradoFideicomisoPrimaItem {
  Beneficiario?: any;
  Detalle?: IRetiradoFideicomisoPrimaDetalle[];
  descripcion?: string;
  estatus?: any;
  id?: string;
  nombre?: string;
  salario?: number;
  unidad_tributaria?: number;
}

export interface IRetiradoFideicomisoGrado {
  Directiva?: IRetiradoFideicomisoDirectiva;
  Prima?: { [key: string]: IRetiradoFideicomisoPrimaItem };
  codigo?: string;
  descripcion?: string;
  id?: string;
  nombre?: string;
}

export interface IRetiradoFideicomisoComponente {
  Grado?: IRetiradoFideicomisoGrado;
  ListadoGrado?: any[];
  descripcion?: string;
  id?: string;
  nombre?: string;
}

export interface IRetiradoFideicomisoMovimientoDetalle {
  codigo?: string | null;
  detalle?: string;
  fecha?: string;
  fecha_creacion?: string;
  fecha_patria?: any;
  id?: string;
  monto?: string;
  monto_aux?: string;
  motivo?: string | null;
  observacion?: string;
  partida?: string | null;
  partida_des?: string | null;
  tipo?: string;
  tipo_texto?: string;
  transaccion?: string | null;
  transaccion_id?: number;
}

export interface IRetiradoFideicomisoHistorialDetalleMovimiento {
  Comparacion?: { [key: string]: IRetiradoFideicomisoMovimientoDetalle[] };
  Detalle?: { [key: string]: IRetiradoFideicomisoMovimientoDetalle[] };
}

export interface IRetiradoFideicomisoMovimientoItem {
  codigo?: string;
  detalle?: string;
  fecha?: string;
  fecha_creacion?: any;
  fecha_patria?: any;
  id?: string;
  monto?: string;
  monto_aux?: string;
  motivo?: any;
  observacion?: string | null;
  partida?: string;
  partida_des?: string;
  tipo?: number;
  transaccion_id?: number;
}

export interface IRetiradoFideicomisoHistorialSueldo {
  fecha: string;
  sueldo_base: string;
  sueldo_global: string;
}

export interface IRetiradoFideicomisoRespuesta {
  Calculo?: IRetiradoFideicomisoCalculo;
  Componente?: IRetiradoFideicomisoComponente;
  HistorialAnticipo?: any[];
  HistorialDetalleMovimiento?: IRetiradoFideicomisoHistorialDetalleMovimiento;
  HistorialMovimiento?: { [key: string]: IRetiradoFideicomisoMovimientoItem };
  HistorialOrdenPagos?: any[];
  HistorialSueldo?: IRetiradoFideicomisoHistorialSueldo[];
  MedidaJudicial?: any[];
  MedidaJudicialActiva?: any[];
  Prima?: { [key: string]: { [primaName: string]: number } };
  aguinaldos?: number;
  aguinaldos_aux?: string;
  ano_antiguedad?: number;
  ano_reconocido?: string;
  antiguedad_grado?: number;
  apellidos?: string;
  asignacion_antiguedad?: number;
  asignacion_antiguedad_aux?: string;
  asignacion_antiguedad_fin?: number;
  asignacion_antiguedad_fin_aux?: string;
  asignacion_antiguedad_rec?: number;
  asignacion_antiguedad_rec2?: number;
  asignacion_antiguedad_rec2_aux?: string;
  asignacion_antiguedad_rec_aux?: string;
  cedula?: string;
  dia_reconocido?: string;
  estado_civil?: string | null;
  estatus_activo?: string;
  estatus_descripcion?: string;
  fecha_creacion?: string | null;
  fecha_ingreso?: string;
  fecha_ingreso_reconocida?: string;
  fecha_ingreso_sistema?: string | null;
  fecha_reincorporacion?: string | null;
  fecha_retiro?: string;
  fecha_retiro_efectiva?: string;
  fecha_ultima_modificacion?: string;
  fecha_ultimo_ascenso?: string;
  grado_codigo?: string;
  mes_reconocido?: string;
  motivo_paralizacion?: string;
  no_ascenso?: string;
  no_depositado_banco?: number;
  nombres?: string;
  numero_cuenta?: string;
  numero_hijos?: string;
  observacion?: string | null;
  prima_compensacion_especial?: number;
  prima_compensacion_especial_aux?: string;
  prima_descendencia?: number;
  prima_descendencia_aux?: string;
  prima_especial?: number;
  prima_especial_aux?: string;
  prima_noascenso?: number;
  prima_noascenso_aux?: string;
  prima_profesionalizacion?: number;
  prima_profesionalizacion_aux?: string;
  prima_tiemposervicio?: number;
  prima_tiemposervicio_aux?: string;
  prima_transporte?: number;
  prima_transporte_aux?: string;
  profesionalizacion?: string;
  sexo?: string;
  sueldo_base?: string;
  sueldo_base_aux?: string;
  sueldo_global?: number;
  sueldo_global_aux?: string;
  sueldo_integral?: number;
  sueldo_integral_aux?: string;
  tiempo_servicio?: number;
  tiempo_servicio_aux?: number;
  tiempo_servicio_db?: string;
  usuario_creador?: string | null;
  usuario_modificacion?: string;
  vacaciones?: number;
  vacaciones_aux?: string;
}

export interface IRetiradoFideicomiso {
  _id?: string;
  cedula?: string;
  consultado_el?: string;
  location?: any;
  origen?: string;
  respuesta: IRetiradoFideicomisoRespuesta;
  status?: number;
  tipo?: string;
}
