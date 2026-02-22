import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IAPICore } from 'src/app/core/models/api/api-model';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

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
        this.documentos.forEach(doc => {
            this.selectedDocs[doc.id] = this.allSelected;
        });
    }

    toggleSelection(docId: string) {
        this.selectedDocs[docId] = !this.selectedDocs[docId];
        this.allSelected = this.documentos.length > 0 && this.documentos.every(doc => this.selectedDocs[doc.id]);
    }

    toggleStar(doc: any) {
        doc.star = !doc.star;
    }

    // --- MODALS ALERTA DE BOTONES ---

    @ViewChild('modalAprobar') modalAprobar: any;
    @ViewChild('modalRechazar') modalRechazar: any;

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


