import { Component, OnInit, TemplateRef, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { SecurityQueueService } from 'src/app/core/services/util/security-queue.service';
import { Subscription } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/core/services/api.service';
import { IAPICore } from 'src/app/core/models/api/api-model';

@Component({
    selector: 'app-prest-lotes',
    templateUrl: './lotes.component.html',
    styleUrls: ['./lotes.component.scss']
})
export class LotesComponent implements OnInit, OnDestroy {
    private securitySub!: Subscription;
    private port: MessagePort | null = null;

    @ViewChild('modalGenerar') modalGenerar!: TemplateRef<any>;

    public tabs = [
        { id: 'aporte', nombre: 'Aporte Capital', icon: 'fa-coins' },
        { id: 'componente', nombre: 'Carga Componente', icon: 'fa-shield-alt' },
        { id: 'fideicomiso', nombre: 'Fideicomitentes', icon: 'fa-university' }
    ];
    public currentTabId = 'aporte';
    public isLoadingData = false;
    public isDisplayingLogs = false;

    // --- FORM STATES ---
    public selectDirectiva: string = '0';
    public selectSituacion: string = '201';
    public selectComponente: string = '99';
    public selectGrado: string = '99';
    public selectMotivo: string = '-';

    // --- LOGS ---
    public logContent: string = "// Inicializando núcleo de cálculos PACE...\n// Esperando directiva de origen para indexar datos.";

    // --- CONFIG: Tabla de Pendientes ---
    public pendingTableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: true,
        showPagination: true,
        pageSize: 5,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none rounded-20',
        columns: [
            { key: 'periodo', header: 'Período', type: 'text', align: 'left', cssClass: 'font-weight-600 px-4 align-middle text-dark' },
            { key: 'directiva', header: 'Directiva / Origen', type: 'text', align: 'left', cssClass: 'align-middle' },
            { key: 'cantidad', header: 'Registros', type: 'text', align: 'center', cssClass: 'align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'left', cssClass: 'align-middle pl-0' }
        ],
        actions: [
            { name: 'descargar', icon: 'fa-download', tooltip: 'Descargar reporte', buttonClass: 'btn-circular btn-info-soft shadow-sm ml-2' },
            { name: 'eliminar', icon: 'fa-trash', tooltip: 'Eliminar lote', buttonClass: 'btn-circular btn-danger-soft shadow-sm ml-2' }
        ]
    };

    public pendingTableData: any[] = [
        { periodo: 'ENE-2024', directiva: 'Incremento Presidencial 2023', cantidad: '15,420', estatus: 'Procesado' },
        { periodo: 'DIC-2023', directiva: 'Ajuste Salarial Ordinario', cantidad: '14,800', estatus: 'Validado' }
    ];

    public xAPI: IAPICore = {
        funcion: '',
        parametros: '',
    };

    constructor(
        private apiService: ApiService,
        private layoutService: LayoutService,
        private modalService: NgbModal,
        private securityQueue: SecurityQueueService,
        private zone: NgZone
    ) { }

    ngOnInit(): void {
        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Procesos en Lote',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.pendingTableData = this.pendingTableData.map(item => ({
            ...item,
            estatusFormat: `<span class="badge badge-pill bg-pastel-success-soft text-success border-0 px-3 py-2 shadow-none font-weight-700" style="font-size: 0.7rem; letter-spacing: 0.5px;">${item.estatus.toUpperCase()}</span>`
        }));

        // Escuchar por el puerto de comunicación del padre
        window.addEventListener('message', (event) => {
            const msg = event.data;

            // 1. Manejar establecimiento del puerto si viene en el evento
            if (event.ports && event.ports.length > 0) {
                this.port = event.ports[0];
                this.port.onmessage = (msgEvent) => {
                    this.handlePortMessage(msgEvent);
                };
                console.log('[LotesComponent] Canal de comunicación (MessagePort) establecido.');
            }

            // 2. Manejar el mensaje directamente si viene por window.postMessage (Fallback del padre)
            if (msg && msg.type === 'EXEC_FNX_FINALIZADO') {
                this.notifyCompletion(msg);
            }
        });
    }

    private handlePortMessage(event: MessageEvent) {
        if (event.data && event.data.type === 'EXEC_FNX_FINALIZADO') {
            this.notifyCompletion(event.data);
        }
    }

    /**
     * Procesa la notificación de finalización y actualiza la UI con efecto animado
     */
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
            // Quitamos el cierre automático:
            // this.layoutService.setBlur(false); 
        });
    }

    public dismissTerminal() {
        this.isDisplayingLogs = false;
        this.isLoadingData = false;
        this.layoutService.setBlur(false);
    }

    /**
     * Efecto de tipeado progresivo lineal (Optimizado)
     */
    private async typeText(text: string) {
        const lines = text.split('\n');
        for (const line of lines) {
            // Solo agregamos salto si la línea no lo trae ya (evitar saltos dobles)
            const cleanLine = line.endsWith('\n') ? line : line + '\n';
            this.logContent += cleanLine;

            // Pausa mucho más corta para evaluación rápida
            await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
            this.scrollToBottom();
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            const textarea = document.querySelector('.editor-body') as HTMLTextAreaElement;
            if (textarea) {
                textarea.scrollTop = textarea.scrollHeight;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.securitySub) this.securitySub.unsubscribe();
    }


    public onTabSwitch(tabId: string): void {
        this.currentTabId = tabId;
        this.logContent += `\n// Cambiando entorno a: ${tabId.toUpperCase()}`;
    }

    public prepararIndices(): void {
        this.isLoadingData = true;
        this.isDisplayingLogs = true;
        this.layoutService.setBlur(true); // Activar blur global
        this.logContent += "\n// Solicitando al Núcleo PACE el pre-procesamiento de índices...";

        const netInfo = JSON.parse(sessionStorage.getItem('net_info') || '{}');
        const config = netInfo.config || {};

        const fnx = {
            funcion: 'Fnx_ProcesarCalculos',
            id_cliente: config.clientId,
            aplicacion: 'sandra.app.ipsfa'
        };

        // El API inicia el proceso, pero la finalización real (especialmente si es asíncrona)
        // llega a través del MessagePort canalizado por el padre (Tauri/Bunker).
        this.apiService.post('fnx', fnx).subscribe({
            next: (data: any) => {
                console.log('[LotesComponent] Solicitud de cálculo enviada:', data);
                this.logContent += "\n// Petitorio aceptado. Procesando en segundo plano...";
            },
            error: (error) => {
                console.error('[LotesComponent] Error al iniciar FNX:', error);
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
}
