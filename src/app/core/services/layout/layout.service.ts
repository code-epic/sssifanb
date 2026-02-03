import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IHeaderConfig {
    title: string;
    showBackButton: boolean;
    showCardsToggle: boolean; // Icono para mostrar/ocultar tarjetas desde el header
    showAlertsIcon: boolean;
    alertSeverity: number; // 1: Normal, 2: Warning (Blue Shadow), 3: Critical (Red)
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {

    // BehaviorSubject para mantener el estado de las tarjetas
    private showCardsSubject = new BehaviorSubject<boolean>(true);
    showCards$ = this.showCardsSubject.asObservable();

    // BehaviorSubject para la configuración del Header
    private headerConfigSubject = new BehaviorSubject<IHeaderConfig>({
        title: 'Principal',
        showBackButton: false,
        showCardsToggle: true,
        showAlertsIcon: false,
        alertSeverity: 1
    });
    headerConfig$ = this.headerConfigSubject.asObservable();

    constructor() { }

    /**
     * Permite activar o desactivar la visibilidad de las tarjetas del admin layout
     * @param visible true para mostrar, false para ocultar
     */
    toggleCards(visible: boolean) {
        this.showCardsSubject.next(visible);
    }

    /**
     * Actualiza la configuración del header de la tarjeta principal
     * @param config Objeto parcial con las propiedades a modificar
     */
    updateHeader(config: Partial<IHeaderConfig>) {
        const current = this.headerConfigSubject.value;
        this.headerConfigSubject.next({ ...current, ...config });
    }
}
