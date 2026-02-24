import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

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
        this.procesarTablaDocumentos();
        this.layoutService.triggerScrollToTop();

        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Indicadores TIM',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

    // -- CONFIGURACIÓN PARA TABLA DINÁMICA --
    public tableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: true,
        showPagination: true,
        pageSize: 5,
        hoverActions: true,
        tableClass: 'mailbox-table w-100',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'cedulaFormat', header: 'Cédula', type: 'html', width: '140px' },
            { key: 'afiliadoFormat', header: 'Afiliado', type: 'html' },
            { key: 'gradoFormat', header: 'Componente / Grado', type: 'html' },
            { key: 'fechaFormat', header: 'Fecha', type: 'html', width: '120px' },
            { key: 'codigoFormat', header: 'Código TIM', type: 'html', width: '150px' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', width: '130px' }
        ],
        actions: [
            { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Detalles', buttonClass: 'btn-pastel-icon-circle ml-2' },
            { name: 'historial', icon: 'fa-history', tooltip: 'Historial', buttonClass: 'btn-pastel-icon-circle pastel-danger ml-2' }
        ]
    };

    public tableData: any[] = [];

    private procesarTablaDocumentos(): void {
        this.tableData = this.documentos.map(doc => {
            return {
                ...doc,
                cedulaFormat: `<span class="font-weight-bold" style="color: #1e293b; font-family: 'Roboto', sans-serif;">${doc.cedula}</span>`,
                afiliadoFormat: `
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-xs rounded-circle bg-light text-muted mr-3 d-flex align-items-center justify-content-center font-weight-bold"
                            style="width: 32px; height: 32px; font-size: 0.75rem; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            ${doc.nombre.charAt(0)}
                        </div>
                        <div>
                            <div class="font-weight-bold" style="color: #334155; line-height: 1;">${doc.nombre}</div>
                            <small class="text-muted font-weight-500" style="font-size: 0.7rem;">Titular TIM</small>
                        </div>
                    </div>
                `,
                gradoFormat: `
                    <div style="line-height: 1.3;">
                        <div class="font-weight-bold" style="font-size: 0.75rem; color: #64748b;">${doc.componente}</div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #475569;">${doc.grado}</div>
                    </div>
                `,
                fechaFormat: `<span class="text-muted font-weight-600" style="font-size: 0.8rem;">${doc.fecha}</span>`,
                codigoFormat: `
                    <div class="d-flex align-items-center">
                        <i class="fas fa-barcode mr-2 text-muted opacity-50"></i>
                        <span class="font-weight-bold" style="color: #598c89; font-size: 0.8rem; letter-spacing: 0.5px;">${doc.codigo}</span>
                    </div>
                `,
                estatusFormat: `
                    <span class="badge-pastel font-weight-bold ${this.getStatusClass(doc.estatus)}">
                        ${this.getStatusLabel(doc.estatus)}
                    </span>
                `
            };
        });
    }

    onTableAction(event: any) {
        // Handle actions inside the table if necessary.
        console.log('Action triggered:', event.actionName, event.row);
    }

    onRowClicked(row: any) {
        console.log('Row clicked:', row);
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
