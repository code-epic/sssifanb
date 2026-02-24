import { Directive, OnInit } from '@angular/core';
import { IAPICore } from 'src/app/core/models/api/api-model';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Directive()
export abstract class BaseWorkflowClass implements OnInit {

    // Variables de Estado (Estándar SSS-IFANB Workflow)
    public estadoInicial = 0;
    public estadoOrigen = 1;
    public estatusInicial = 1;
    public estatusActual = 1;
    public estatusDestino = 1;
    public estadoDestino = 0;

    // Mailbox UI
    public workflowTabs: any[] = [];
    public currentTabId: string = '';
    public allSelected: boolean = false;
    public isLoadingData: boolean = true;

    // API
    public xAPI: IAPICore = {
        funcion: '',
        parametros: '',
        valores: ''
    };

    constructor(
        protected apiService: ApiService,
        protected layoutService: LayoutService,
        protected defaultPageTitle: string = 'Principal / Módulo'
    ) { }

    ngOnInit(): void {
        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: this.defaultPageTitle,
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.onInitExtension(); // Gancho para que el hijo ejecute acciones extras
    }

    /**
     * Se debe implementar en el Componente Hijo
     * Generalmente usado para llamar a loadWorkflowTabs()
     */
    protected abstract onInitExtension(): void;

    /**
     * Función genérica para cargar los Tabuladores o Estados
     * @param funcionAPI nombre de la función CEstatus (Ej: 'WKF_CEstatus')
     * @param targetOrigen usualmente this.estadoOrigen.toString()
     * @param loadAction Callback despues de cargar tabs (Ej: cargar tabla principal)
     */
    protected loadWorkflowTabs(funcionAPI: string, targetOrigen: string, loadAction?: () => void): void {
        this.isLoadingData = true;
        let payload: IAPICore = {
            funcion: funcionAPI,
            parametros: targetOrigen,
            valores: ''
        };

        this.apiService.post('crud', payload).subscribe(
            (data: any) => {
                this.workflowTabs = data.Cuerpo || [];
                if (this.workflowTabs.length > 0 && !this.currentTabId) {
                    this.currentTabId = this.workflowTabs[0].id;
                }
                if (loadAction) loadAction();
                this.isLoadingData = false;
            },
            (err) => {
                console.error('Error cargando Workflow Tabs:', err);
                this.isLoadingData = false;
            }
        );
    }

    /**
     * Evento genérico al cambiar de pestaña en el Mailbox
     */
    public onTabSwitch(tabId: string, reloadFunction?: () => void): void {
        this.currentTabId = tabId;
        this.allSelected = false; // Reset selection
        if (reloadFunction) reloadFunction();
    }
}
