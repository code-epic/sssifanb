export interface IOrdenPago {
  /** Número de orden (PK sequence) */
  id?: number;
  
  /** Cédula del receptor */
  cedula_beneficiario?: string;
  
  /** Nombre del receptor */
  nombres_beneficiario?: string;
  
  /** Apellido del receptor */
  apellidos_beneficiario?: string;
  
  /** Cédula del titular (FK→beneficiario) */
  cedula_afiliado?: string;
  
  /** Monto de la orden */
  monto?: number;
  
  /** % aplicado al anticipo */
  porcentaje?: number;
  
  /** Fecha de emisión */
  fecha?: Date | string;
  
  /** 1=Pago único, 2=Cuota (FK→tipo_orden_pago) */
  tipo_id?: number;
  
  /** Subtipo (0=normal, 5=excluido) */
  tipoan?: number;
  
  /** 100=Ejecutada, 101=Pendiente, 102=Rechazada, 103=Reversada */
  status_id?: number;
  
  /** Quien emite */
  emisor?: string;
  
  /** Quien revisa */
  revision?: string;
  
  /** Quien autoriza */
  autoriza?: string;
  
  /** Movimiento financiero asociado (FK→movimiento) */
  movimiento_id?: number;
  
  /** Motivo del pago */
  motivo?: string;
  
  /** Observaciones */
  observacion?: string;
  
  /** Trazabilidad de creación */
  f_creacion?: Date | string;
  
  /** Usuario creador */
  usr_creacion?: string;
  
  /** Última modificación */
  f_ult_modificacion?: Date | string;
  
  /** Usuario modificador */
  usr_modificacion?: string;
  
  /** Última observación (auditoría) */
  observ_ult_modificacion?: string;
}
