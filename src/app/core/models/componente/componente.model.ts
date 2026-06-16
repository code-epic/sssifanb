export interface IGrado {
  codigo: string;
  cpace: number | string;
  descripcion: string;
  homologacion?: number;
  nombre: string;
  rango: string;
}

export interface IComponenteFANB {
  _id: string;
  codigo: string;
  Grado: IGrado[];
  nombre: string;
  siglas: string;
}
