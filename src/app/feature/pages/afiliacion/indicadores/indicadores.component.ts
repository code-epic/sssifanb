import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-afi-indicadores',
    templateUrl: './indicadores.component.html',
    styleUrls: ['./indicadores.component.scss']
})
export class IndicadoresComponent implements OnInit {

    stats = [
        { id: 'issued', label: 'Emitidos', value: 1250, icon: 'fa-id-card', trend: '+12%', type: 'issued', progress: 75 },
        { id: 'rejected', label: 'Rechazados', value: 45, icon: 'fa-times-circle', trend: '-5%', type: 'rejected', progress: 15 },
        { id: 'released', label: 'Liberados', value: 890, icon: 'fa-unlock-alt', trend: '+8%', type: 'released', progress: 60 },
        { id: 'printed', label: 'Impresos', value: 1100, icon: 'fa-print', trend: '+15%', type: 'printed', progress: 85 }
    ];

    documentos = [
        { cedula: 'V-12345678', nombre: 'JUAN PÉREZ', componente: 'EJÉRCITO', grado: 'GENERAL DE DIVISIÓN', fecha: '2026-02-20', codigo: 'TIM-001234', estatus: 'ISSUED' },
        { cedula: 'V-87654321', nombre: 'MARÍA RODRÍGUEZ', componente: 'ARMADA', grado: 'ALMIRANTE', fecha: '2026-02-21', codigo: 'TIM-009876', estatus: 'PRINTED' },
        { cedula: 'V-11223344', nombre: 'CARLOS GÓMEZ', componente: 'AVIACIÓN', grado: 'CORONEL', fecha: '2026-02-22', codigo: 'TIM-005544', estatus: 'RELEASED' },
        { cedula: 'V-44332211', nombre: 'ANA MARTÍNEZ', componente: 'GUARDIA NACIONAL', grado: 'MAYOR', fecha: '2026-02-18', codigo: 'TIM-002233', estatus: 'REJECTED' },
        { cedula: 'V-55667788', nombre: 'JOSE LUIS TORRES', componente: 'EJÉRCITO', grado: 'SARGENTO PRIMERO', fecha: '2026-02-19', codigo: 'TIM-007788', estatus: 'ISSUED' },
    ];

    componentes = [
        { id: 'EJB', nombre: 'EJÉRCITO BOLIVARIANO' },
        { id: 'ARB', nombre: 'ARMADA BOLIVARIANA' },
        { id: 'AMB', nombre: 'AVIACIÓN MILITAR' },
        { id: 'GNB', nombre: 'GUARDIA NACIONAL' }
    ];

    grados = [
        'GENERAL / ALMIRANTE',
        'OFICIAL SUPERIOR',
        'OFICIAL SUBALTERNO',
        'TROPA PROFESIONAL'
    ];

    filterForm: FormGroup;

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.layoutService.triggerScrollToTop();

        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Indicadores TIM',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

    private initForm() {
        this.filterForm = this.fb.group({
            desde: [''],
            hasta: [''],
            componente: [''],
            grado: [''],
            origen: ['']
        });
    }

    getStatusLabel(status: string): string {
        switch (status.toLowerCase()) {
            case 'issued': return 'EMITIDO';
            case 'rejected': return 'RECHAZADO';
            case 'released': return 'LIBERADO';
            case 'printed': return 'IMPRESO';
            default: return status;
        }
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'issued': case 'emitido': return 'bg-issued';
            case 'rejected': case 'rechazado': return 'bg-rejected';
            case 'released': case 'liberado': return 'bg-released';
            case 'printed': case 'impreso': return 'bg-printed';
            default: return 'bg-light';
        }
    }
}
