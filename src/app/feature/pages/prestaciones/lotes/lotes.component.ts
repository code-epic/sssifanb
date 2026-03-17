import { Component, OnInit, TemplateRef, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { SecurityQueueService } from 'src/app/core/services/util/security-queue.service';
import { Subscription } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableComponent, DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/core/services/api.service';
import { IAPICore } from 'src/app/core/models/api/api-model';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
    selector: 'app-prest-lotes',
    templateUrl: './lotes.component.html',
    styleUrls: ['./lotes.component.scss']
})
export class LotesComponent extends BaseWorkflowClass implements OnDestroy {

    // --- ESTADOS DE WORKFLOW (TIM MODEL) ---
    public override estadoInicial = 0;
    public override estadoOrigen = 3; // Solicitado por el usuario
    public override estatusActual = 1;
    public override estatusDestino = 1;
    public override estadoDestino = 0;
    public allSelected: boolean = false;


    private securitySub!: Subscription;
    private port: MessagePort | null = null;

    @ViewChild('modalGenerar') modalGenerar!: TemplateRef<any>;
    @ViewChild('modalConfirmarCalculo') modalConfirmarCalculo!: TemplateRef<any>;
    @ViewChild('modalConfirmarAccion') modalConfirmarAccion!: TemplateRef<any>;
    @ViewChild('modalAprobar') modalAprobar!: TemplateRef<any>;
    @ViewChild('modalRechazar') modalRechazar!: TemplateRef<any>;

    public isDisplayingLogs = false;
    public isNewCalculationView = false;
    public selectedRow: any = null;
    public modalActionData = {
        title: '',
        message: '',
        icon: '',
        colorBg: '',
        colorText: '',
        colorBorder: '',
        action: ''
    };

    // --- FORM STATES (Ajustes a conservar) ---
    public selectDirectiva: string = '0';
    public selectSituacion: string = '201';
    public selectComponente: string = '99';
    public selectGrado: string = '99';
    public selectMotivo: string = '-';

    // --- LOGS (Terminal logic) ---
    public logContent: string = "// Inicializando núcleo de cálculos PACE...\n// Esperando directiva de origen para indexar datos.";

    // --- CONFIG: Tabla de Lotes (Equivalente a documentos en TIM) ---
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
            { key: 'remitenteFormat', header: '', type: 'html', cssClass: 'px-1 py-3 border-bottom border-light align-middle pr-1 text-nowrap', width: '150px' },
            { key: 'asuntoFormat', header: '', type: 'html', width: '100%', cssClass: 'px-1 py-3 border-bottom border-light align-middle' },
            { key: 'fechaFormat', header: '', type: 'html', align: 'right', cssClass: 'px-3 py-3 border-bottom border-light align-middle font-weight-500 text-nowrap' }
        ],
        actions: [
            { name: 'rechazar', icon: 'fa-times', tooltip: 'Rechazar', buttonClass: 'btn btn-sm btn-pastel-icon-circle pastel-danger shadow-sm ml-1 tooltip-action' },
            { name: 'procesar', icon: 'fa-cogs', tooltip: 'Procesar', buttonClass: 'btn btn-sm btn-pastel-icon-circle pastel-warning shadow-sm ml-1 tooltip-action' }
        ]
    };

    public tableData: any[] = [];
    public rawLotes: any[] = [
        { id: '1', periodo: 'ENE-2024', directiva: 'Incremento Presidencial 2023', cantidad: '15,420', estatus: 'Procesado', fecha: 'Hoy, 09:12' },
        { id: '2', periodo: 'DIC-2023', directiva: 'Ajuste Salarial Ordinario', cantidad: '14,800', estatus: 'Validado', fecha: 'Ayer, 16:45' }
    ];

    public trackId: string = '';
    public id: string = '';


    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal,
        private securityQueue: SecurityQueueService,
        private utilService: UtilService,
        private zone: NgZone
    ) {
        super(apiService, layoutService, 'Principal / Prestaciones: Procesos en Lote')
        this.trackId = this.utilService.GenerarId()
    }

    protected override onInitExtension(): void {
        // Cargar pestañas usando el servicio de workflow (como TIM pero vía BaseClass)
        this.loadWorkflowTabs('WKF_CEstatus', this.estadoOrigen.toString(), () => {
            if (this.workflowTabs.length > 0) {
                this.currentTabId = this.workflowTabs[0].id;
            }
        });

        this.procesarTablaLotes();
        this.initMessagePort();
    }

    private procesarTablaLotes(): void {
        this.tableData = this.rawLotes.map(lote => ({
            ...lote,
            remitenteFormat: `
                <div class="d-flex align-items-center" style="color: #334155; padding-left: 5px;">
                    <span class="text-uppercase font-weight-bold" style="font-size: 0.9rem; letter-spacing: 0.2px;">${lote.periodo}</span>
                </div>
            `,
            asuntoFormat: `
                <div class="d-flex align-items-center" style="line-height: 1.5; color: #475569;">
                    <span class="badge badge-pill mr-2 px-2 py-1 font-weight-bold" style="font-size: 0.7rem; color: #94a3b8; background-color: #f1f5f9; border-radius: 6px;">LOTE-${lote.id}</span>
                    <span class="text-uppercase font-weight-bold mr-2" style="font-size: 0.85rem; color: #475569;">${lote.directiva}</span>
                    <span class="text-muted mx-2" style="font-size: 0.6rem; opacity: 0.5;"><i class="fas fa-circle"></i></span>
                    <span class="text-uppercase text-muted" style="font-size: 0.75rem; font-weight: 500;">${lote.cantidad} REGISTROS</span>
                </div>
            `,
            fechaFormat: `
                <div class="d-flex justify-content-end align-items-center">
                    <span class="text-muted" style="font-size: 0.85rem; font-weight: 500; color: #64748b !important;">${lote.fecha}</span>
                </div>
            `
        }));
    }

    private initMessagePort(): void {
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (event.ports && event.ports.length > 0) {
                this.port = event.ports[0];
                this.port.onmessage = (msgEvent) => this.handlePortMessage(msgEvent);
                console.log('[LotesComponent] Canal MessagePort establecido.');
            }
            if (msg && msg.type === 'EXEC_FNX_FINALIZADO') {
                this.notifyCompletion(msg);
            }
        });
    }

    public onTabSwitchManual(tabId: string): void {
        this.onTabSwitch(tabId, () => {
            this.isNewCalculationView = false; // Al cambiar pestaña, volvemos a la lista
            console.log(`Cambiando entorno a: ${tabId.toUpperCase()}`);
            this.logContent += `\n// Cambiando entorno a: ${tabId.toUpperCase()}`;
        });
    }

    public toggleView(): void {
        this.isNewCalculationView = !this.isNewCalculationView;
        if (!this.isNewCalculationView) {
            this.layoutService.setBlur(false);
            this.isDisplayingLogs = false;
        }
    }

    public toggleAll(event: any): void {
        const isChecked = event.target.checked;
        this.allSelected = isChecked;
        this.tableData = this.tableData.map(item => ({
            ...item,
            isSelected: isChecked
        }));
    }

    public onActionClick(event: any): void {
        const { actionName, row } = event;
        this.selectedRow = row;

        switch (actionName) {
            case 'aprobar':
                this.modalService.open(this.modalAprobar, { centered: true, size: 'md', windowClass: 'pastel-modal' }).result.then(
                    (result) => { if (result === 'confirm') this.ejecutarAccion('aprobar', row); },
                    () => { }
                );
                break;
            case 'rechazar':
                this.modalService.open(this.modalRechazar, { centered: true, size: 'md', windowClass: 'pastel-modal' }).result.then(
                    (result) => { if (result === 'confirm') this.ejecutarAccion('rechazar', row); },
                    () => { }
                );
                break;
            case 'procesar':
                this.abrirModalConfirmarAccion('procesar', row);
                break;
            case 'eliminar':
                this.abrirModalConfirmarAccion('eliminar', row);
                break;
            case 'ver':
                console.log('Ver detalles de:', row);
                break;
        }
    }

    public abrirModalConfirmarCalculo(): void {
        this.modalService.open(this.modalConfirmarCalculo, { centered: true, size: 'md', windowClass: 'pastel-modal' }).result.then(
            (result) => {
                if (result === 'confirm') {
                    this.prepararIndices();
                }
            },
            () => { }
        );
    }

    public abrirModalConfirmarAccion(tipo: string, row?: any): void {
        if (row) this.selectedRow = row;

        if (tipo === 'procesar') {
            this.modalActionData = {
                title: '¿Procesar Lote?',
                message: row
                    ? `Se iniciará el procesamiento del lote ${row.id} para el periodo ${row.periodo}.`
                    : 'Se iniciará el procesamiento de todos los lotes seleccionados.',
                icon: 'fa-play-circle',
                colorBg: '#f0fdf4',
                colorText: '#16a34a',
                colorBorder: '#dcfce7',
                action: 'procesar'
            };
        } else if (tipo === 'eliminar') {
            this.modalActionData = {
                title: '¿Eliminar Selección?',
                message: row
                    ? `¿Está seguro de eliminar el lote ${row.id}? Esta acción no se puede deshacer.`
                    : '¿Está seguro de eliminar los lotes seleccionados? Esta acción no se puede deshacer.',
                icon: 'fa-trash-alt',
                colorBg: '#fef2f2',
                colorText: '#ef4444',
                colorBorder: '#fee2e2',
                action: 'eliminar'
            };
        }

        this.modalService.open(this.modalConfirmarAccion, { centered: true, size: 'md', windowClass: 'pastel-modal' }).result.then(
            (result) => {
                if (result === 'confirm') {
                    this.ejecutarAccion(this.modalActionData.action, row);
                }
            },
            () => { }
        );
    }

    private ejecutarAccion(accion: string, row?: any): void {
        console.log(`Ejecutando ${accion} para:`, row || 'Selección múltiple');
        this.isLoadingData = true;

        // Simulación de proceso
        setTimeout(() => {
            this.isLoadingData = false;
            if (accion === 'eliminar') {
                if (row) {
                    this.rawLotes = this.rawLotes.filter(l => l.id !== row.id);
                } else {
                    // Filtrar seleccionados si existieran en una lógica real
                }
                this.procesarTablaLotes();
            }
            alert(`Acción ${accion.toUpperCase()} completada con éxito.`);
        }, 1500);
    }

    public getTabIcon(name: string): string {
        if (!name) return 'fa-folder';
        const str = name.toUpperCase();
        if (str.includes('APORTE') || str.includes('RECIBIDO')) return 'fa-coins';
        if (str.includes('COMPONENTE') || str.includes('PROCESO')) return 'fa-shield-alt';
        if (str.includes('FIDEICOMISO') || str.includes('APROBADO')) return 'fa-university';
        return 'fa-folder';
    }

    // --- KERNEL PACE LOGIC ---

    private handlePortMessage(event: MessageEvent) {
        if (event.data && event.data.type === 'EXEC_FNX_FINALIZADO') {
            this.notifyCompletion(event.data);
        }
    }

    private notifyCompletion(msg: any) {
        this.logContent = '';
        this.zone.run(async () => {
            const newContent = msg.payload?.data || msg.data;
            if (typeof newContent === 'string') {
                if (this.logContent) this.logContent += '\n';
                await this.typeText(newContent);
            } else {
                this.logContent = JSON.stringify(newContent, null, 2);
            }
            this.isLoadingData = false;
            window.parent.postMessage({ type: 'START_DOWNLOAD', id: this.id, trackingId: this.trackId }, '*');
        });
    }

    public dismissTerminal() {
        this.isDisplayingLogs = false;
        this.layoutService.setBlur(false);
    }

    private async typeText(text: string) {
        const lines = text.split('\n');
        for (const line of lines) {
            this.logContent += (line.endsWith('\n') ? line : line + '\n');
            await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
            this.scrollToBottom();
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            const textarea = document.querySelector('.editor-body') as HTMLTextAreaElement;
            if (textarea) textarea.scrollTop = textarea.scrollHeight;
        });
    }

    public prepararIndices(): void {
        this.isLoadingData = true;
        this.isDisplayingLogs = true;
        this.layoutService.setBlur(true);
        this.logContent += "\n// Solicitando al Núcleo PACE el pre-procesamiento de índices...";

        const netInfo = JSON.parse(sessionStorage.getItem('net_info') || '{}');
        const config = netInfo.config || {};


        const fnx = {
            funcion: 'Fnx_ProcesarCalculos',
            id_cliente: config.clientId,
            aplicacion: 'sandra.app.ipsfa',
            trackid: this.trackId, //seguimiento para descargar y la carpeta que se va a crear 
            nombre: "NOMINA DE PRESTACIONES SOCIALES 2026",
            autor: "Sandra",
            ciclo: "03MAR2026"
        };

        this.apiService.post('fnx', fnx).subscribe({
            next: (data: any) => {
                console.log(data)
                this.id = data.contenido.id //id de la funcion fnx
                this.logContent += "\n// Petitorio aceptado. Procesando en segundo plano...";
            },
            error: (error) => {
                this.isLoadingData = false;
                this.logContent += "\n// ERROR: No se pudo contactar con el núcleo de cálculos.";
            }
        });
    }

    public abrirModalGenerar(): void {
        this.modalService.open(this.modalGenerar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
    }

    public procesarAporte(): void {
        this.modalService.dismissAll();
        this.isLoadingData = true;
        this.logContent += "\n// Ejecutando algoritmo de Aporte de Capital...";
        setTimeout(() => {
            this.isLoadingData = false;
            this.logContent += "\n// El lote fue generado con código PAC-2024-001.";
        }, 2000);
    }

    ngOnDestroy(): void {
        if (this.securitySub) this.securitySub.unsubscribe();
    }
}
