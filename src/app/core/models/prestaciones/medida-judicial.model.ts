/**
 * Interfaz para la entidad Medida Judicial según esquema DML $values de IPSFA_IMedidasJudiciales
 */
export interface IMedidaJudicial {
  cargo_autoridad: string;
  unidad_tributaria: number; // int
  n_beneficiario: string;
  desc_institucion: string;
  ci_beneficiario: string;
  nro_oficio: string;
  cantidad_salario: number; // int
  n_autorizado: string;
  porcentaje: number; // int
  motivo_id: number; // int
  parentesco_id: number; // int
  municipio_id: number; // int
  nombre_autoridad: string;
  ci_autorizado: string;
  mensualidades: number; // int
  desc_embargo: string;
  observ_ult_modificacion: string;
  cedula: string;
  f_documento: string; // date: YYYY-MM-DD
  tipo_medida_id: number; // int
  total_monto: number; // dbl
  institucion: string;
  forma_pago_id: number; // int
  nro_expediente: string;
  status_id: number; // int
  usr_creacion: string;
  usr_modificacion: string;
  f_creacion: string; // date
  f_ult_modificacion: string; // date
}

/**
 * Interfaz reactiva para el formulario del modal Determinación de Medida Judicial
 */
export interface IMedidaJudicialForm {
  tipo_medida_id?: string | number;
  motivo_id?: string | number;
  f_documento?: string;
  f_recepcion?: string;
  nro_oficio?: string;
  nro_expediente?: string;
  desc_embargo?: string;
  forma_pago_id?: string | number;
  porcentaje?: string | number;
  unidad_tributaria?: string | number;
  mensualidades?: string | number;
  salario?: string | number;
  cantidad_salario?: string | number;
  total_monto?: string | number;
  institucion?: string;
  desc_institucion?: string;
  nombre_autoridad?: string;
  cargo_autoridad?: string;
  estado_id?: string | number;
  ciudad_id?: string | number;
  municipio_id?: string | number;
  ci_beneficiario?: string;
  n_beneficiario?: string;
  parentesco_id?: string | number;
  ci_autorizado?: string;
  n_autorizado?: string;
  observ_ult_modificacion?: string;
  status_id?: string | number;
  cedula?: string;
  usr_creacion?: string;
  usr_modificacion?: string;
  [key: string]: any;
}
