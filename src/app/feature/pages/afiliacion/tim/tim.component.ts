import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IAPICore } from 'src/app/core/models/api/api-model';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableComponent, DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@Component({
    selector: 'app-afi-tim',
    templateUrl: './tim.component.html',
    styleUrls: ['./tim.component.scss']
})
export class TimComponent implements OnInit {

    public estadoInicial = 0 //donde esta
    public estadoOrigen = 1 //de donde viene
    public estatusInicial = 1 // que posicion ocupa
    public estatusActual = 1
    public estatusDestino = 1 // que posicion ocupa
    public estadoDestino = 0 //para donde va en un flujo normal

    public redDocs: any[] = [];

    // UI Mailbox properties
    public currentTab: string = '';
    public selectedDocId: string = '';

    public xAPI: IAPICore = {
        funcion: 'TIM',
        parametros: 'ConsultarRedDocs',
        valores: ''
    }

    constructor(
        private apiService: ApiService,
        private modalService: NgbModal,
        private layoutService: LayoutService
    ) { }


    ngOnInit(): void {
        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Tarjeta de Identificación Militar',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.LoadRedDocs();
    }

    LoadRedDocs() {
        this.xAPI = {} as IAPICore;
        this.xAPI.funcion = 'WKF_CEstatus';
        this.xAPI.parametros = `${this.estadoOrigen.toString()}`;
        this.xAPI.valores = '';

        this.apiService.post('crud', this.xAPI).subscribe(
            async (data: any) => {

                console.log(data.Cuerpo)
                this.redDocs = data.Cuerpo || [];
                // Set the default folder based on first item logic
                if (this.redDocs.length > 0) {
                    this.switchTab(this.redDocs[0].id);
                }
                this.procesarTablaDocumentos();
            },
            (err) => {
                console.error(err)
            }
        )
    }

    // --- MAILBOX UI INTERACTION METHODS ---

    public documentos: any[] = [
        { id: '1', nombre: 'CARLOS EDUARDO PEREZ', rif: 'V-12345678', tramite: 'INGRESO', detalle: 'GUARDIA NACIONAL BOLIVARIANA', fecha: '13 Nov, 08:49', star: false, bgAvatar: 'bg-pastel-primary text-primary', avatarChar: 'T' },
        { id: '2', nombre: 'MARIA GONZALES', rif: 'V-87654321', tramite: 'CAMBIO', detalle: 'EJERCITO BOLIVARIANO', fecha: '25 Sep, 17:47', star: true, bgAvatar: 'bg-pastel-success text-success', avatarChar: 'A' },
        { id: '3', nombre: 'JUAN PEREZ', rif: 'V-12345678', tramite: 'EXTRAVIO', detalle: 'AVIACION MILITAR BOLIVARIANA', fecha: '25 Sep, 17:39', star: false, bgAvatar: 'bg-pastel-warning text-warning', avatarChar: 'C' }
    ];

    public selectedDocs: { [key: string]: boolean } = {};
    public allSelected: boolean = false;

    // --- DYNAMIC TABLE UI ---
    public tableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hideHeader: true,
        hoverActions: true,
        tableClass: 'mailbox-table w-100',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            {
                key: 'remitenteFormat',
                header: '',
                type: 'html',
                width: '350px',
                cssClass: 'px-1 py-2 border-bottom border-light font-weight-600 align-middle pr-1'
            },
            {
                key: 'asuntoFormat',
                header: '',
                type: 'html',
                cssClass: 'px-1 py-2 border-bottom border-light align-middle'
            },
            {
                key: 'fechaFormat',
                header: '',
                type: 'html',
                width: '180px',
                align: 'right',
                cssClass: 'px-3 py-2 border-bottom border-light align-middle font-weight-500 position-relative'
            }
        ],
        actions: [
            { name: 'aprobar', icon: 'fa-check', tooltip: 'Aprobar', buttonClass: 'btn btn-sm btn-pastel-icon-circle pastel-success shadow-sm ml-1 tooltip-action' },
            { name: 'rechazar', icon: 'fa-times', tooltip: 'Rechazar', buttonClass: 'btn btn-sm btn-pastel-icon-circle pastel-danger shadow-sm ml-1 tooltip-action' },
            { name: 'liberar', icon: 'fa-unlock-alt', tooltip: 'Liberar', buttonClass: 'btn btn-sm btn-pastel-icon-circle pastel-warning shadow-sm ml-1 tooltip-action' }
        ]
    };

    public tableData: any[] = [];

    private procesarTablaDocumentos(): void {
        this.tableData = this.documentos.map(doc => {
            return {
                ...doc,
                remitenteFormat: `
                    <div class="d-flex align-items-center" style="width: 100%; color: #334155;">
                        <div class="avatar avatar-sm rounded-circle shadow-sm font-weight-bold d-flex align-items-center justify-content-center flex-shrink-0" 
                            style="font-size: 0.85rem; width: 34px; height: 34px; letter-spacing: 0.5px; background-color: rgba(89, 140, 137, 0.1); color: #598c89; border: 1px solid rgba(89, 140, 137, 0.2); margin-right: 12px;">
                            ${doc.avatarChar}
                        </div>
                        <span class="text-truncate" style="line-height: 1.5; letter-spacing: -0.2px; padding-top: 1px; flex: 1; min-width: 0;">${doc.nombre}</span>
                    </div>
                `,
                asuntoFormat: `
                    <div class="d-flex align-items-center" style="line-height: 1.5; width: 100%; color: #475569;">
                        <span class="badge badge-pill bg-light text-muted border mr-2 font-weight-bold shadow-sm flex-shrink-0" style="font-size: 0.65rem; letter-spacing: 0.5px; padding: 0.35em 0.65em; transform: translateY(-1px);">${doc.rif}</span>
                        <span class="font-weight-600 text-dark flex-shrink-0 text-truncate pr-1" style="font-size: 0.9rem; letter-spacing: -0.2px; max-width: 250px;">${doc.tramite}</span> 
                        <span class="text-muted mx-2 flex-shrink-0" style="font-size: 0.6rem; opacity: 0.5;"><i class="fas fa-circle"></i></span> 
                        <span class="text-muted text-truncate" style="font-size: 0.85rem; flex: 1; min-width: 0;">${doc.detalle}</span>
                    </div>
                `,
                fechaFormat: `
                    <div class="d-flex justify-content-end w-100">
                        <span class="date-text hide-on-row-hover" style="line-height: 1.5; padding-top: 1px; color: #94a3b8; font-size: 0.85rem; letter-spacing: 0.2px; text-align: right;">${doc.fecha}</span>
                    </div>
                `
            };
        });
    }

    onTableAction(event: any) {
        if (event.actionName === 'aprobar') {
            this.openAprobarModal(event.row.id);
        } else if (event.actionName === 'rechazar') {
            this.openRechazarModal(event.row.id);
        } else if (event.actionName === 'liberar') {
            console.log('Liberar ID:', event.row.id);
        }
    }

    onRowSelection(rows: any[]) {
        this.selectedDocs = {};
        rows.forEach(r => this.selectedDocs[r.id] = true);
        this.allSelected = rows.length === this.documentos.length;
    }

    switchTab(tabId: string) {
        this.currentTab = tabId;
        // Reiniciar selecciones al cambiar pestaña
        this.selectedDocs = {};
        this.allSelected = false;
        // AQUI: Disparar recarga real de la base de datos usando tabId
    }

    getTabIcon(name: string): string {
        if (!name) return 'fa-folder';
        const str = name.toUpperCase();
        if (str.includes('RECIBIDO')) return 'fa-inbox';
        if (str.includes('PROCESO')) return 'fa-tasks';
        if (str.includes('IMPRESO')) return 'fa-print';
        if (str.includes('LIBERADO')) return 'fa-check-circle';
        if (str.includes('RECHAZADO')) return 'fa-times-circle';
        return 'fa-folder';
    }

    toggleAllMock() {
        this.allSelected = !this.allSelected;
        this.documentos.forEach(doc => {
            this.selectedDocs[doc.id] = this.allSelected;
        });
    }

    toggleAll(event: any) {
        this.allSelected = event.target.checked;
        if (this.dynamicTableComponent) {
            this.dynamicTableComponent.selectAll = this.allSelected;
            this.dynamicTableComponent.toggleAll();
        }
    }

    toggleSelection(docId: string) {
        // Obsoleto, ya lo hace el Dynamic Table
    }

    toggleStar(doc: any) {
        doc.star = !doc.star;
    }

    // --- MODALS ALERTA DE BOTONES ---

    @ViewChild('modalAprobar') modalAprobar: any;
    @ViewChild('modalRechazar') modalRechazar: any;
    @ViewChild(DynamicTableComponent) dynamicTableComponent!: DynamicTableComponent;

    openAprobarModal(docId: string) {
        this.selectedDocId = docId;
        this.modalService.open(this.modalAprobar, { centered: true });
        console.log('Open approval modal for:', docId);
    }

    openRechazarModal(docId: string) {
        this.selectedDocId = docId;
        this.modalService.open(this.modalRechazar, { centered: true });
        console.log('Open reject modal for:', docId);
    }

    confirmarAprobacion() {
        console.log('Confirmada Aprobacion ID:', this.selectedDocId);
        this.modalService.dismissAll();
    }

    confirmarRechazo() {
        console.log('Confirmado Rechazo ID:', this.selectedDocId);
        this.modalService.dismissAll();
    }
}


