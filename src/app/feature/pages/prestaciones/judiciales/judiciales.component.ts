import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-prest-judiciales',
    templateUrl: './judiciales.component.html',
    styleUrls: ['./judiciales.component.scss']
})
export class JudicialesComponent extends BaseWorkflowClass implements OnInit {

    @ViewChild('modalSolicitar') modalSolicitar!: TemplateRef<any>;
    @ViewChild('modalAprobar') modalAprobar!: TemplateRef<any>;
    @ViewChild('modalCSV') modalCSV!: TemplateRef<any>;

    public isNewRecordView: boolean = false;
    public searchCedula: string = '';
    public militarData: any = null;
    public selectedRecord: any = null;
    public currentModalStep: number = 1;
    public isLoadingData: boolean = false;
    public allSelected: boolean = false;
    private masterData: any[] = [];

    // --- CONFIG: Tabla Principal ---
    public mainTableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'cedulaFormat', header: 'Cédula', type: 'html', align: 'left', cssClass: 'px-4 py-3 align-middle text-nowrap' },
            { key: 'nombre', header: 'Beneficiario', type: 'text', align: 'left', cssClass: 'font-weight-600 align-middle text-dark' },
            { key: 'tipo', header: 'Tipo', type: 'text', align: 'center', cssClass: 'align-middle' },
            { key: 'oficio', header: 'Oficio', type: 'text', align: 'center', cssClass: 'align-middle' },
            { key: 'expediente', header: 'Expediente', type: 'text', align: 'center', cssClass: 'align-middle font-weight-bold' },
            { key: 'montoFormat', header: 'Monto Total (Bs)', type: 'html', align: 'right', cssClass: 'align-middle pr-4' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ],
        actions: [
            { name: 'aprobar', icon: 'fa-check', tooltip: 'Ejecutar Medida', buttonClass: 'btn-circular btn-success-soft shadow-sm ml-2' },
            { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Expediente', buttonClass: 'btn-circular btn-amber-soft shadow-sm ml-2' }
        ]
    };

    public mainTableData: any[] = [];

    // --- CONFIG: Tabla Historial (Vista Registro) ---
    public historyTableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: false,
        showPagination: true,
        pageSize: 5,
        hoverActions: false,
        tableClass: 'mailbox-table w-100',
        containerClass: 'p-0 border-0 shadow-none rounded-20',
        columns: [
            { key: 'oficio', header: 'N° Oficio', type: 'text', align: 'left', cssClass: 'font-weight-600 px-4 align-middle text-dark' },
            { key: 'tipo', header: 'Tipo Medida', type: 'text', align: 'center', cssClass: 'align-middle' },
            { key: 'montoFormat', header: 'Monto (Bs)', type: 'html', align: 'right', cssClass: 'align-middle pr-4' },
            { key: 'fecha', header: 'Fecha Registro', type: 'text', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ]
    };

    public historyTableData: any[] = [];

    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal
    ) {
        super(apiService, layoutService, 'Principal / Prestaciones: Medidas Judiciales');
    }

    protected override onInitExtension(): void {
        this.loadTabs();
        this.loadData();
    }

    private loadTabs(): void {
        this.isLoadingData = true;
        setTimeout(() => {
            this.workflowTabs = [
                { id: 'RECIBIDO', nombre: 'Recibidos' },
                { id: 'PROCESO', nombre: 'En Proceso' },
                { id: 'EJECUTADO', nombre: 'Ejecutados' },
                { id: 'SUSPENDIDO', nombre: 'Suspendidos' }
            ];
            this.currentTabId = 'RECIBIDO';
            this.isLoadingData = false;
        }, 300);
    }

    public toggleView(): void {
        this.isNewRecordView = !this.isNewRecordView;
        if (!this.isNewRecordView) {
            this.searchCedula = '';
            this.militarData = null;
            this.historyTableData = [];
        }
    }

    public onMailboxSearch(term: string): void {
        if (!term) {
            this.mainTableData = [...this.masterData];
            return;
        }
        const st = term.toLowerCase();
        this.mainTableData = this.masterData.filter(item =>
            item.cedula.toLowerCase().includes(st) ||
            item.nombre.toLowerCase().includes(st) ||
            item.expediente.toLowerCase().includes(st)
        );
    }

    public onMailboxTabSwitch(tabId: string): void {
        this.onTabSwitch(tabId, () => {
            this.loadData();
        });
    }

    public loadData(): void {
        this.isLoadingData = true;
        setTimeout(() => {
            const rawData = [
                { cedula: '15442331', nombre: 'ADRIANZA PAREDES LUIS', tipo: 'ANTIGÜEDAD', oficio: 'OF-2023-99', expediente: 'EXP-9922', monto: 12500.00, estatus: 'Pendiente' },
                { cedula: '10223112', nombre: 'MENDEZ RIVAS JOSE', tipo: 'INTERESES', oficio: 'OF-2023-45', expediente: 'EXP-4501', monto: 3400.50, estatus: 'Ejecutado' }
            ];

            this.masterData = rawData.map(item => ({
                ...item,
                cedulaFormat: `<span class="badge badge-pill bg-light text-muted border shadow-sm font-weight-bold px-2 py-1">${item.cedula}</span>`,
                montoFormat: `<span class="font-weight-bold" style="color: #0f172a;">${item.monto.toLocaleString('es-VE')}</span>`,
                estatusFormat: this.getStatusBadge(item.estatus)
            }));
            this.mainTableData = [...this.masterData];
            this.isLoadingData = false;
        }, 500);
    }

    public buscarMilitar(): void {
        if (!this.searchCedula) return;
        this.isLoadingData = true;
        setTimeout(() => {
            this.militarData = {
                cedula: this.searchCedula,
                nombres: 'VICTOR ENRIQUE MACHADO SALAZAR',
                componente: 'ARMADA BOLIVARIANA',
                grado: 'CAPITAN DE NAVIO',
                fechaIngreso: '15/07/1998',
                sexo: 'MASCULINO',
                tiempoServicio: '25 años, 7 meses, 9 días',
                hijos: 3,
                ultimaAscenso: '05/07/2021',
                estatusMilitar: 'ACTIVO'
            };

            // Simular historial de medidas para este militar
            this.historyTableData = [
                { oficio: 'OF-2021-12', tipo: 'ANTIGÜEDAD', monto: 5400.00, fecha: '12/05/2021', estatus: 'Ejecutado' },
                { oficio: 'OF-2022-08', tipo: 'ALIMENTARIA', monto: 1200.00, fecha: '20/11/2022', estatus: 'Ejecutado' }
            ].map(item => ({
                ...item,
                montoFormat: `<span class="font-weight-bold">${item.monto.toLocaleString('es-VE')}</span>`,
                estatusFormat: this.getStatusBadge(item.estatus)
            }));
            this.isLoadingData = false;
        }, 400);
    }

    public solicitarMedida(): void {
        this.currentModalStep = 1;
        this.modalService.open(this.modalSolicitar, { centered: true, size: 'lg' });
    }

    public nextStep(): void {
        if (this.currentModalStep < 4) this.currentModalStep++;
    }

    public prevStep(): void {
        if (this.currentModalStep > 1) this.currentModalStep--;
    }

    public onActionClick(event: any): void {
        const { action, row } = event;
        this.selectedRecord = row;
        if (action === 'aprobar') {
            this.modalService.open(this.modalAprobar, { centered: true });
        } else if (action === 'ver') {
            console.log('Ver expediente:', row);
        }
    }

    public exportarCSV(): void {
        this.modalService.open(this.modalCSV, { centered: true });
    }

    public confirmarCSV(): void {
        alert('Generando archivo CSV de Medidas Judiciales...');
        this.modalService.dismissAll();
    }

    public confirmarEjecucion(): void {
        alert('Medida Judicial ejecutada correctamente.');
        this.modalService.dismissAll();
        this.loadData();
    }

    public procesarSolicitud(): void {
        alert('La medida judicial ha sido registrada exitosamente.');
        this.modalService.dismissAll();
        this.toggleView();
        this.loadData();
    }

    private getStatusBadge(estatus: string): string {
        if (estatus === 'Ejecutado') return `<span class="badge bg-pastel-success text-success px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-check-circle mr-1"></i> ${estatus}</span>`;
        if (estatus === 'Pendiente') return `<span class="badge bg-pastel-warning text-warning px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-clock mr-1"></i> ${estatus}</span>`;
        return `<span class="badge bg-light text-muted border px-2 py-1 shadow-sm font-weight-600">${estatus}</span>`;
    }
}
