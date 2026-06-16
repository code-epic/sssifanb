export interface IEstatusBeneficiario {
  id: number;
  nombre: string;
  descripcion: string;
  entidad: string;
}

export interface IEstatusResponse {
  Cabecera: any[];
  Cuerpo: IEstatusBeneficiario[];
  Pie: any;
}
