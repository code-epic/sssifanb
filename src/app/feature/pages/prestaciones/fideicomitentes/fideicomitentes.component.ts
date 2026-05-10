import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
    selector: 'app-prest-fideicomitentes',
    templateUrl: './fideicomitentes.component.html',
    styleUrls: ['./fideicomitentes.component.scss']
})
export class FideicomitentesComponent extends BaseWorkflowClass {

    @ViewChild('modalAprobar') modalAprobar!: TemplateRef<any>;
    @ViewChild('modalRechazar') modalRechazar!: TemplateRef<any>;
    @ViewChild('modalCSV') modalCSV!: TemplateRef<any>;
    @ViewChild('modalNuevo') modalNuevo!: TemplateRef<any>;

    public isNewView: boolean = false;
    public pasoActual: number = 1;
    public cargandoArchivos: boolean = false;
    public progresoCarga: number = 0;
    public fileToUpload: File | null = null;
    public totalRegistros: number = 0;

    public searchCedula: string = '';
    public militarData: any = null;
    public selectedItem: any = null;
    private masterPendingData: any[] = [];

    // --- CONFIG: Tabla Principal (Fideicomitentes) ---
    public pendingTableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'idFormat', header: 'ID', type: 'html', align: 'left', cssClass: 'px-4 py-3 align-middle text-nowrap' },
            { key: 'tipoNomina', header: 'Tipo Nómina', type: 'text', align: 'left', cssClass: 'font-weight-600 align-middle text-dark' },
            { key: 'componenteFormat', header: 'Comp.', type: 'html', align: 'center', cssClass: 'align-middle' },
            { key: 'cantidadFormat', header: 'Cantidad', type: 'html', align: 'center', cssClass: 'align-middle font-weight-700' },
            { key: 'fecha', header: 'Fecha', type: 'text', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ],
        actions: [
            { name: 'aprobar', icon: 'fa-check', tooltip: 'Aprobar', buttonClass: 'btn-circular btn-success-soft shadow-sm ml-2' },
            { name: 'rechazar', icon: 'fa-times', tooltip: 'Rechazar', buttonClass: 'btn-circular btn-danger-soft shadow-sm ml-2' },
            { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Detalles', buttonClass: 'btn-circular btn-amber-soft shadow-sm ml-2' }
        ]
    };

    public pendingTableData: any[] = [];

    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal,
        private utilService: UtilService
    ) {
        super(apiService, layoutService, 'Principal / Prestaciones: Control de Fideicomitentes');
    }

    protected override onInitExtension(): void {
        this.loadMockTabs();
        this.loadPendingData();
    }

    private loadMockTabs(): void {
        this.isLoadingData = true;
        setTimeout(() => {
            this.workflowTabs = [
                { id: 'PROCESO', nombre: 'En Proceso' },
                { id: 'APROBADO', nombre: 'Aprobados' },
                { id: 'RECHAZADO', nombre: 'Rechazados' }
            ];
            this.currentTabId = 'PROCESO';
            this.isLoadingData = false;
        }, 500);
    }

    public toggleView(): void {
        this.isNewView = !this.isNewView;
        if (!this.isNewView) {
            this.searchCedula = '';
            this.militarData = null;
        }
    }

    public onMailboxSearch(term: string): void {
        if (!term) {
            this.pendingTableData = [...this.masterPendingData];
            return;
        }
        const st = term.toLowerCase();
        this.pendingTableData = this.masterPendingData.filter(item =>
            item.id.toLowerCase().includes(st) ||
            item.tipoNomina.toLowerCase().includes(st)
        );
    }

    public onMailboxTabSwitch(tabId: string): void {
        this.onTabSwitch(tabId, () => {
            this.loadPendingData();
        });
    }

    public onMailboxRefresh(): void {
        this.loadPendingData();
    }

    public onMailboxSelectAll(checked: boolean): void {
        this.allSelected = checked;
    }

    public loadPendingData(): void {
        const rawData = [
            { id: 'FIDE-2023-001', tipoNomina: 'PERSONAL MILITAR ACTIVO', componente: 'EJB', cantidad: 150, fecha: '14 Nov 2023', estatus: 'EN PROCESO' },
            { id: 'FIDE-2023-002', tipoNomina: 'PERSONAL CIVIL EGRESADO', componente: 'GNB', cantidad: 45, fecha: '12 Nov 2023', estatus: 'APROBADO' },
            { id: 'FIDE-2023-003', tipoNomina: 'SOBREVIVIENTES PENSIONADOS', componente: 'AMB', cantidad: 82, fecha: '10 Nov 2023', estatus: 'RECHAZADA' }
        ];

        const mappedData = rawData.map(item => ({
            ...item,
            idFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${item.id}</span>`,
            componenteFormat: this.getComponentBadge(item.componente),
            cantidadFormat: `<span class="text-dark font-weight-800">${item.cantidad}</span>`,
            estatusFormat: this.getStatusBadge(item.estatus)
        }));

        this.masterPendingData = [...mappedData];
        this.pendingTableData = [...mappedData];
    }

    public triggerFileSelect(input: HTMLInputElement): void {
        if (this.cargandoArchivos) return;
        input.click();
    }

    public onFileChange(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.utilService.AlertMini('top-end', 'error', 'El archivo supera los 10MB permitidos', 3000);
            return;
        }

        // Validar extensión
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'csv') {
            this.utilService.AlertMini('top-end', 'error', 'Solo se permiten archivos CSV', 3000);
            return;
        }

        this.fileToUpload = file;
        this.validarYProcesarCSV(file);
    }

    private validarYProcesarCSV(file: File): void {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/);
            if (lines.length <= 1) {
                this.utilService.AlertMini('top-end', 'error', 'Archivo sin datos', 2000);
                return;
            }

            const header = lines[0].toLowerCase();
            const delimiter = header.includes(';') ? ';' : ',';
            const columns = header.split(delimiter).map((c: string) => c.trim());

            const required = ['cedula', 'n_hijos', 'grado', 'fecha_ingreso', 'f_ult_ascenso', 'st_profesion'];
            const missing = required.filter(col => !columns.includes(col));

            if (missing.length > 0) {
                this.utilService.AlertMini('top-end', 'error', `Columnas faltantes: ${missing.join(', ')}`, 4000);
                return;
            }

            this.totalRegistros = lines.filter(l => l.trim() !== '').length - 1;
            this.simularCarga();
        };
        reader.readAsText(file);
    }

    private simularCarga(): void {
        this.cargandoArchivos = true;
        this.progresoCarga = 0;

        const interval = setInterval(() => {
            this.progresoCarga += Math.floor(Math.random() * 15) + 5;
            if (this.progresoCarga >= 100) {
                this.progresoCarga = 100;
                clearInterval(interval);
                setTimeout(() => {
                    this.cargandoArchivos = false;
                    this.pasoActual = 3; // Paso de éxito
                }, 800);
            }
        }, 200);
    }

    public procesarFinal(): void {
        this.utilService.AlertMini('top-end', 'success', 'Carga procesada con éxito', 2000);
        this.modalService.dismissAll();
        this.loadPendingData(); // Refrescar mailbox
    }

    public buscarExpediente(): void {
        if (!this.searchCedula) return;
        this.militarData = {
            cedula: this.searchCedula,
            nombres: 'GUSTAVO ADOLFO RIVAS TOVAR',
            componente: 'GUARDIA NACIONAL BOLIVARIANA',
            grado: 'CORONEL',
            situacion: 'ACTIVO'
        };
    }

    public mostrarConfirmacionCSV(): void {
        this.modalService.open(this.modalCSV, { centered: true, size: 'md', windowClass: 'pastel-modal' });
    }

    public confirmarCSV(): void {
        this.downloadCSV(this.pendingTableData, 'fideicomitentes.csv');
        this.modalService.dismissAll();
    }

    public onPendingTableAction(event: any): void {
        this.selectedItem = event.row;
        if (event.actionName === 'aprobar') {
            this.modalService.open(this.modalAprobar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'rechazar') {
            this.modalService.open(this.modalRechazar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'ver') {
            alert(`Detalles de ${event.row.id}`);
        }
    }

    public confirmarAprobacion(): void {
        alert(`Fideicomitente ${this.selectedItem?.id} aprobado.`);
        this.modalService.dismissAll();
    }

    public confirmarRechazo(): void {
        alert(`Fideicomitente ${this.selectedItem?.id} rechazado.`);
        this.modalService.dismissAll();
    }

    public nuevoFideicomitente(): void {
        this.modalService.open(this.modalNuevo, { centered: true, size: 'lg', windowClass: 'pastel-modal' });
    }

    public procesarNuevo(): void {
        alert('Nuevo fideicomitente registrado con éxito.');
        this.modalService.dismissAll();
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
        switch (estatus) {
            case 'APROBADO':
                return `<span class="badge bg-pastel-success text-success px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-check-circle mr-1"></i> ${estatus}</span>`;
            case 'EN PROCESO':
                return `<span class="badge bg-pastel-warning text-warning px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-clock mr-1"></i> ${estatus}</span>`;
            case 'RECHAZADA':
                return `<span class="badge bg-pastel-danger text-danger px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-times-circle mr-1"></i> ${estatus}</span>`;
            default:
                return `<span class="badge bg-light text-muted border px-2 py-1 shadow-sm font-weight-600">${estatus}</span>`;
        }
    }
}
