import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-prest-anticipos',
    templateUrl: './anticipos.component.html',
    styleUrls: ['./anticipos.component.scss']
})
export class AnticiposComponent extends BaseWorkflowClass {

    @ViewChild('modalAprobar') modalAprobar!: TemplateRef<any>;
    @ViewChild('modalRechazar') modalRechazar!: TemplateRef<any>;
    @ViewChild('modalCSV') modalCSV!: TemplateRef<any>;
    @ViewChild('modalSolicitar') modalSolicitar!: TemplateRef<any>;

    public isNewAnticipoView: boolean = false;
    public searchCedula: string = '';
    public militarData: any = null;
    public selectedMilitar: any = null;
    private masterPendingData: any[] = [];

    // --- CONFIG: Tabla Principal (Pendientes) ---
    public pendingTableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'cedulaFormat', header: 'Cédula', type: 'html', align: 'left', cssClass: 'px-4 py-3 align-middle text-nowrap' },
            { key: 'nombre', header: 'Nombres y Apellidos', type: 'text', align: 'left', cssClass: 'font-weight-600 align-middle text-dark' },
            { key: 'gradoFormat', header: 'Grado', type: 'html', align: 'center', cssClass: 'align-middle' },
            { key: 'componenteFormat', header: 'Comp.', type: 'html', align: 'center', cssClass: 'align-middle' },
            { key: 'montoFormat', header: 'Monto Neto (Bs)', type: 'html', align: 'right', cssClass: 'align-middle pr-4' },
            { key: 'fecha', header: 'Fecha Solicitud', type: 'text', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ],
        actions: [
            { name: 'aprobar', icon: 'fa-check', tooltip: 'Aprobar Anticipo', buttonClass: 'btn-circular btn-success-soft shadow-sm ml-2' },
            { name: 'rechazar', icon: 'fa-times', tooltip: 'Rechazar Anticipo', buttonClass: 'btn-circular btn-danger-soft shadow-sm ml-2' },
            { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Expediente', buttonClass: 'btn-circular btn-amber-soft shadow-sm ml-2' }
        ]
    };

    public pendingTableData: any[] = [];

    // --- CONFIG: Tabla Histórico (Vista Secundaria) ---
    public historyTableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: false,
        showPagination: true,
        pageSize: 5,
        hoverActions: false,
        tableClass: 'mailbox-table w-100',
        containerClass: 'p-0 border-0 shadow-none rounded-20',
        columns: [
            { key: 'idSolicitud', header: '# Solicitud', type: 'text', align: 'left', cssClass: 'font-weight-600 px-4 align-middle text-dark' },
            { key: 'concepto', header: 'Concepto', type: 'text', align: 'left', cssClass: 'align-middle' },
            { key: 'montoFormat', header: 'Monto Pagado (Bs)', type: 'html', align: 'right', cssClass: 'align-middle pr-4' },
            { key: 'fecha', header: 'Fecha Aprobación', type: 'text', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ]
    };

    public historyTableData: any[] = [];

    // Ahora inyectamos nuestras dependencias y las pasamos a la clase Base
    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal
    ) {
        super(apiService, layoutService, 'Principal / Prestaciones: Bandeja de Anticipos');
    }

    // Gancho de inicio desde BaseWorkflowClass
    protected override onInitExtension(): void {
        this.loadMockTabs(); // Aquí podrías hacer: this.loadWorkflowTabs('API_FUNCTION', '1');
        this.loadPendingData();
    }

    // Método para simular la carga de tabuladores mientras conectamos DB
    private loadMockTabs(): void {
        this.isLoadingData = true;
        setTimeout(() => {
            this.workflowTabs = [
                { id: 'RECIBIDO', nombre: 'Recibidos' },
                { id: 'PROCESO', nombre: 'En Proceso' },
                { id: 'APROBADO', nombre: 'Aprobados' },
                { id: 'RECHAZADO', nombre: 'Rechazados' }
            ];
            this.currentTabId = 'RECIBIDO';
            this.isLoadingData = false;
        }, 500);
    }

    public toggleView(): void {
        this.isNewAnticipoView = !this.isNewAnticipoView;
        if (!this.isNewAnticipoView) {
            this.searchCedula = '';
            this.militarData = null;
            this.historyTableData = [];
        }
    }

    // Eventos interceptados desde el Mailbox Layout
    public onMailboxSearch(term: string): void {
        console.log(`Buscando en bandeja general: ${term}`);
        if (!term) {
            this.pendingTableData = [...this.masterPendingData];
            return;
        }
        const st = term.toLowerCase();
        this.pendingTableData = this.masterPendingData.filter(item =>
            item.cedula.toLowerCase().includes(st) ||
            item.nombre.toLowerCase().includes(st)
        );
    }

    public onMailboxTabSwitch(tabId: string): void {
        this.onTabSwitch(tabId, () => {
            console.log(`Cargando datos para tab: ${tabId}`);
            this.loadPendingData(); // Reemplazar con llamada real a API
        });
    }

    public onMailboxRefresh(): void {
        console.log('Refrescando bandeja...');
        this.loadPendingData();
    }

    public onMailboxSelectAll(checked: boolean): void {
        this.allSelected = checked;
        // La tabla asume selection changes automáticamente dentro
    }

    // ------------------------------------
    // LÓGICA DE DATOS MOCKEADOS
    // ------------------------------------

    public loadPendingData(): void {
        const rawData = [
            { cedula: '12345678', nombre: 'CARLOS EDUARDO PEREZ', grado: 'MAY', componente: 'EJB', montoBs: 15400.50, fecha: '13 Nov 2023', estatus: 'Pendiente' },
            { cedula: '87654321', nombre: 'MARIA GONZALES', grado: 'CAP', componente: 'GNB', montoBs: 8400.00, fecha: '12 Nov 2023', estatus: 'Pendiente' },
            { cedula: '11223344', nombre: 'JUAN ALFONSO MARTINEZ', grado: 'TCNEL', componente: 'AMB', montoBs: 25000.75, fecha: '10 Nov 2023', estatus: 'En Revisión' }
        ];

        const mappedData = rawData.map(item => ({
            ...item,
            cedulaFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${item.cedula}</span>`,
            gradoFormat: `<span style="color: #64748b; font-weight: 500;">${item.grado}</span>`,
            componenteFormat: this.getComponentBadge(item.componente),
            montoFormat: `<span class="font-weight-bold" style="color: #0f172a; font-size: 1.05rem;">${item.montoBs.toLocaleString('es-VE')}</span>`,
            estatusFormat: this.getStatusBadge(item.estatus)
        }));

        this.masterPendingData = [...mappedData];
        this.pendingTableData = [...mappedData];
    }

    public cerrarFiltros(): void {
        document.body.click(); // Hack para cerrar dropdown
    }

    public buscarMilitar(): void {
        if (!this.searchCedula) return;
        this.militarData = {
            cedula: this.searchCedula,
            nombres: 'VICTOR ENRIQUE MACHADO SALAZAR',
            componente: 'ARMADA BOLIVARIANA',
            grado: 'CAPITAN DE NAVIO',
            fechaIngreso: '15/07/1998',
            fechaAscenso: '05/07/2021',
            fechaNacimiento: '10/05/1975',
            sexo: 'MASCULINO'
        };
        this.loadHistoryData();
    }

    private loadHistoryData(): void {
        const rawData = [
            { idSolicitud: 'ANT-2021-0453', concepto: 'Adquisición de Vivienda', montoBs: 45000.00, fecha: '15 Ago 2021', estatus: 'Aprobado' },
            { idSolicitud: 'ANT-2018-0112', concepto: 'Gastos Médicos Mayores', montoBs: 12000.00, fecha: '04 Mar 2018', estatus: 'Depositado' }
        ];

        this.historyTableData = rawData.map(item => ({
            ...item,
            montoFormat: `<span class="font-weight-bold text-success" style="font-size: 1.05rem;">Bs ${item.montoBs.toLocaleString('es-VE')}</span>`,
            estatusFormat: this.getStatusBadge(item.estatus)
        }));
    }

    public mostrarConfirmacionCSV(): void {
        this.modalService.open(this.modalCSV, { centered: true, size: 'md', windowClass: 'pastel-modal' });
    }

    public confirmarCSV(): void {
        console.log('Generando archivo CSV...');
        this.downloadCSV(this.pendingTableData, 'anticipos_pendientes.csv');
        this.modalService.dismissAll();
    }

    public onPendingTableAction(event: any): void {
        this.selectedMilitar = event.row;
        if (event.actionName === 'aprobar') {
            this.modalService.open(this.modalAprobar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'rechazar') {
            this.modalService.open(this.modalRechazar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'ver') {
            alert(`Ver expediente de ${event.row.nombre}`);
        }
    }

    public confirmarAprobacion(): void {
        alert(`Anticipo de ${this.selectedMilitar?.nombre} aprobado satisfactoriamente.`);
        this.modalService.dismissAll();
    }

    public confirmarRechazo(): void {
        alert(`Anticipo de ${this.selectedMilitar?.nombre} rechazado.`);
        this.modalService.dismissAll();
    }

    public solicitarAnticipo(): void {
        this.modalService.open(this.modalSolicitar, { centered: true, size: 'lg', windowClass: 'pastel-modal' });
    }

    public procesarSolicitud(): void {
        alert('La nueva solicitud de anticipo fue registrada con éxito.');
        this.modalService.dismissAll();
        this.toggleView();
    }

    private downloadCSV(data: any[], filename: string) {
        if (!data || !data.length) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(data[0]).join(",") + "\n"
            + data.map(e => Object.values(e).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- UTILS (Badges de UI Pastel) ---
    private getComponentBadge(comp: string): string {
        const colors: any = {
            'EJB': 'bg-pastel-danger text-danger',
            'ARB': 'bg-pastel-info text-info',
            'AMB': 'bg-pastel-primary text-primary',
            'GNB': 'bg-pastel-success text-success'
        };
        const colorClass = colors[comp] || 'bg-light text-muted';
        return `<span class="badge ${colorClass} px-2 py-1 shadow-sm font-weight-bold" style="border-radius: 8px;">${comp}</span>`;
    }

    private getStatusBadge(estatus: string): string {
        if (estatus === 'Aprobado' || estatus === 'Depositado') {
            return `<span class="badge bg-pastel-success text-success px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-check-circle mr-1"></i> ${estatus}</span>`;
        } else if (estatus === 'Pendiente') {
            return `<span class="badge bg-pastel-warning text-warning px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-clock mr-1"></i> ${estatus}</span>`;
        } else if (estatus === 'En Revisión') {
            return `<span class="badge px-2 py-1 shadow-sm font-weight-600" style="background-color: #e8f4f4; color: #4a8b89;"><i class="fas fa-search mr-1"></i> ${estatus}</span>`;
        } else {
            return `<span class="badge bg-light text-muted border px-2 py-1 shadow-sm font-weight-600">${estatus}</span>`;
        }
    }
}
