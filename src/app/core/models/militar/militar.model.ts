export interface IComponenteMilitar {
    abreviatura: string;
    nombre: string;
}

export interface IGradoMilitar {
    abreviatura: string;
    nombre: string;
}

export const COMPONENTES_MILITARES: IComponenteMilitar[] = [
    { abreviatura: 'EJ', nombre: 'EJÉRCITO BOLIVARIANO' },
    { abreviatura: 'AR', nombre: 'ARMADA BOLIVARIANA' },
    { abreviatura: 'AV', nombre: 'AVIACIÓN MILITAR BOLIVARIANA' },
    { abreviatura: 'GN', nombre: 'GUARDIA NACIONAL BOLIVARIANA' },
    { abreviatura: 'MI', nombre: 'MILICIA BOLIVARIANA' }
];

export const GRADOS_MILITARES: IGradoMilitar[] = [
    { abreviatura: 'G/J', nombre: 'GENERAL EN JEFE' },
    { abreviatura: 'A/J', nombre: 'ALMIRANTE EN JEFE' },
    { abreviatura: 'M/G', nombre: 'MAYOR GENERAL' },
    { abreviatura: 'ALM', nombre: 'ALMIRANTE' },
    { abreviatura: 'G/D', nombre: 'GENERAL DE DIVISIÓN' },
    { abreviatura: 'V/A', nombre: 'VICEALMIRANTE' },
    { abreviatura: 'G/B', nombre: 'GENERAL DE BRIGADA' },
    { abreviatura: 'C/A', nombre: 'CONTRALMIRANTE' },
    { abreviatura: 'CNEL', nombre: 'CORONEL' },
    { abreviatura: 'C/N', nombre: 'CAPITÁN DE NAVÍO' },
    { abreviatura: 'T/C', nombre: 'TENIENTE CORONEL' },
    { abreviatura: 'C/F', nombre: 'CAPITÁN DE FRAGATA' },
    { abreviatura: 'MAY', nombre: 'MAYOR' },
    { abreviatura: 'C/C', nombre: 'CAPITÁN DE CORBETA' },
    { abreviatura: 'CAP', nombre: 'CAPITÁN' },
    { abreviatura: 'T/N', nombre: 'TENIENTE DE NAVÍO' },
    { abreviatura: '1TTE', nombre: 'PRIMER TENIENTE' },
    { abreviatura: 'T/F', nombre: 'TENIENTE DE FRAGATA' },
    { abreviatura: 'TTE', nombre: 'TENIENTE' },
    { abreviatura: 'A/N', nombre: 'ALFÉREZ DE NAVÍO' },
    { abreviatura: 'SS', nombre: 'SARGENTO SUPERVISOR' },
    { abreviatura: 'SA', nombre: 'SARGENTO AYUDANTE' },
    { abreviatura: 'SM1', nombre: 'SARGENTO MAYOR DE PRIMERA' },
    { abreviatura: 'SM2', nombre: 'SARGENTO MAYOR DE SEGUNDA' },
    { abreviatura: 'SM3', nombre: 'SARGENTO MAYOR DE TERCERA' },
    { abreviatura: 'S1', nombre: 'SARGENTO PRIMERO' },
    { abreviatura: 'S2', nombre: 'SARGENTO SEGUNDO' }
];
