import { Component, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { SecurityQueueService } from 'src/app/core/services/util/security-queue.service';
import { Subscription } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-prest-lotes',
    templateUrl: './lotes.component.html',
    styleUrls: ['./lotes.component.scss']
})
export class LotesComponent implements OnInit, OnDestroy {
    private securitySub!: Subscription;

    @ViewChild('modalGenerar') modalGenerar!: TemplateRef<any>;

    public tabs = [
        { id: 'aporte', nombre: 'Aporte Capital', icon: 'fa-coins' },
        { id: 'componente', nombre: 'Carga Componente', icon: 'fa-shield-alt' },
        { id: 'fideicomiso', nombre: 'Fideicomitentes', icon: 'fa-university' }
    ];
    public currentTabId = 'aporte';
    public isLoadingData = false;

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

    constructor(
        private layoutService: LayoutService,
        private modalService: NgbModal,
        private securityQueue: SecurityQueueService
    ) { }

    ngOnInit(): void {
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

        this.securitySub = this.securityQueue.minimized$.subscribe(() => {
            this.isLoadingData = false;
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
        this.logContent += "\n// Preparando índices de capital para el período seleccionado...";
        setTimeout(() => {
            this.isLoadingData = false;
            this.logContent += "\n// 12,504 registros pre-procesados exitosamente.";
        }, 1500);
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
