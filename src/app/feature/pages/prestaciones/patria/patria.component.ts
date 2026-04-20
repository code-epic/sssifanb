import { Component, TemplateRef, ViewChild, OnInit, NgZone } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-prest-patria',
    templateUrl: './patria.component.html',
    styleUrls: ['./patria.component.scss']
})
export class PatriaComponent extends BaseWorkflowClass implements OnInit {

    @ViewChild('modalVer') modalVer!: TemplateRef<any>;
    @ViewChild('modalConfirmar') modalConfirmar!: TemplateRef<any>;

    // Filtros de búsqueda
    public fechaDesde: string = '';
    public fechaHasta: string = '';
    public componenteSeleccionado: string = '';
    public tipoArchivo: string = 'zst';

    // Datos
    public registrosData: any[] = [];
    public selectedRegistro: any = null;

    // Estados
    public isLoading: boolean = false;
    public isNewCalculationView: boolean = false;

    // Vista previa
    public previewContent: string = `// =============================================================================
// NÓMINA PATRIA - Vista Previa
// =============================================================================
// Esperando parámetros de generación...

// Seleccione el rango de fechas y componente para previsualizar el archivo.
`;

    // --- CONFIG: Tabla Principal ---
    public tableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'cedula', header: 'Cédula', type: 'text', align: 'left', cssClass: 'px-4 py-3 align-middle text-nowrap' },
            { key: 'apellidos', header: 'Apellidos y Nombres', type: 'text', align: 'left', cssClass: 'font-weight-600 align-middle text-dark' },
            { key: 'numero_cuenta', header: 'Nro. Cuenta', type: 'text', align: 'left', cssClass: 'align-middle' },
            { key: 'monto', header: 'Monto (Bs)', type: 'currency', align: 'right', cssClass: 'align-middle pr-4' },
            { key: 'f_contable', header: 'F. Contable', type: 'date', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'status_id', header: 'Estatus', type: 'badge', align: 'center', cssClass: 'align-middle' }
        ],
        actions: [
            { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Detalle', buttonClass: 'btn-circular btn-amber-soft shadow-sm ml-2' },
            { name: 'descargar', icon: 'fa-download', tooltip: 'Descargar', buttonClass: 'btn-circular btn-success-soft shadow-sm ml-2' }
        ]
    };

    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal,
        private ngZone: NgZone
    ) {
        super(apiService, layoutService, 'Principal / Prestaciones: Nómina Patria');
    }

    protected override onInitExtension(): void {
        this.initComponent();
    }

    /**
     * Inicializa el componente
     */
    private initComponent(): void {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        this.fechaDesde = firstDay.toISOString().split('T')[0];
        this.fechaHasta = now.toISOString().split('T')[0];
    }

    /**
     * Alterna entre vista bandeja y formulario
     */
    public toggleView(): void {
        this.isNewCalculationView = !this.isNewCalculationView;
        if (!this.isNewCalculationView) {
            this.layoutService.setBlur(false);
        }
    }

    /**
     * Busca los registros según los filtros
     */
    async buscar(): Promise<void> {
        if (!this.fechaDesde || !this.fechaHasta) {
            alert('Debe seleccionar rango de fechas');
            return;
        }

        this.isLoading = true;
        this.registrosData = [];

        const desde = this.fechaDesde.split('-').reverse().join('/');
        const hasta = this.fechaHasta.split('-').reverse().join('/');

        const payload = {
            funcion: environment.funcion.FINIQUITOS_NOMINA,
            parametros: `${desde},${hasta},${this.componenteSeleccionado}`
        };

        try {
            await this.apiService.postStream<any>(
                'crudstream',
                payload,
                (registro) => {
                    this.ngZone.run(() => {
                        this.registrosData = [...this.registrosData, registro];
                    });
                }
            );
            this.isLoading = false;
        } catch (error) {
            console.error('[Patria] Error en stream:', error);
            this.isLoading = false;
        }
    }

    /**
     * Abre modal de confirmación
     */
    openConfirmarModal(): void {
        this.modalService.open(this.modalConfirmar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
    }

    /**
     * Genera la nómina Patria
     */
    generarNomina(): void {
        this.isLoading = true;

        // Actualizar vista previa
        this.previewContent = `// =============================================================================
// NÓMINA PATRIA - Generando...
// =============================================================================
// Fecha Desde: ${this.fechaDesde}
// Fecha Hasta: ${this.fechaHasta}
// Componente: ${this.componenteSeleccionado || 'TODOS'}
// Tipo Archivo: ${this.tipoArchivo.toUpperCase()}
// 
// >> Conectando con Sentinel...
// >> Consultando finiquitos pendientes...
// >> Validando cuentas bancarias (0102)...
// >> Generando archivo...`;

        setTimeout(() => {
            this.isLoading = false;
            this.toggleView();
            this.buscar();
            alert('Nómina Patria generada exitosamente');
        }, 1500);
    }

    /**
     * Ver detalle del registro
     */
    verDetalle(registro: any): void {
        this.selectedRegistro = registro;
        this.modalService.open(this.modalVer, { centered: true, size: 'lg' });
    }

    /**
     * Descarga archivo generado
     */
    descargar(registro: any): void {
        const link = document.createElement('a');
        link.href = registro.url_descarga;
        link.download = registro.nombre_archivo;
        link.click();
    }

    /**
     * Limpia filtros
     */
    limpiar(): void {
        this.componenteSeleccionado = '';
        this.registrosData = [];
        this.initComponent();
    }

    /**
     * Selection change handler
     */
    onRowSelect(registro: any): void {
        this.selectedRegistro = registro;
    }

    /**
     * Manejo de acciones en la tabla
     */
    onAction(event: any): void {
        const { actionName, row } = event;
        switch (actionName) {
            case 'ver':
                this.verDetalle(row);
                break;
            case 'descargar':
                this.descargar(row);
                break;
        }
    }
}