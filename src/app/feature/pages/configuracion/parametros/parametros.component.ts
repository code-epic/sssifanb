import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-conf-parametros',
    templateUrl: './parametros.component.html',
    styleUrls: ['./parametros.component.scss']
})
export class ParametrosComponent implements OnInit {

    public formParametro: FormGroup;
    public parametros: any[] = [];
    public currentFilter: string = 'TODOS';
    public searchTerm: string = '';
    public parametroSeleccionado: any = null;

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private modalService: NgbModal
    ) {
        this.formParametro = this.fb.group({
            tipoVariable: ['CARGO', Validators.required],
            identificador: ['', Validators.required],
            valorPrincipal: ['', Validators.required],
            descripcion: [''],
            cedula: [''],
            nombreCompleto: [''],
            cargoExtra: ['']
        });
    }

    ngOnInit(): void {
        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Configuración / Parámetros del Sistema',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.cargarMockData();
    }

    cargarMockData() {
        this.parametros = [
            {
                id: 1,
                identificador: 'PRESIDENTE_INSTITUTO',
                tipo: 'CARGO',
                valor: 'Gral. de División Juan Pérez',
                descripcion: 'Firma principal para resolución y emisión de constancias.',
                detalles: { cedula: 'V-10.123.456', cargo: 'Presidente de la Junta Administradora' },
                fechaAcutalizacion: '2026-01-15',
                estado: 'ACTIVO',
                tieneImagen: true
            },
            {
                id: 2,
                identificador: 'RUTA_REPOSITORIO_FOTOS',
                tipo: 'SISTEMA',
                valor: '/mnt/storage/fotos_afiliados',
                descripcion: 'Ruta absoluta NFS para guardar y leer fotos de perfil policial y cívico.',
                fechaAcutalizacion: '2026-02-10',
                estado: 'ACTIVO',
                tieneImagen: false
            },
            {
                id: 3,
                identificador: 'TEXTO_CLAUSULA_FINIQUITO',
                tipo: 'TEXTO',
                valor: 'El presente finiquito anula todo compromiso previo...',
                descripcion: 'Cláusula legal para generación de PDF de prestaciones dinerarias.',
                fechaAcutalizacion: '2025-11-20',
                estado: 'ACTIVO',
                tieneImagen: false
            },
            {
                id: 4,
                identificador: 'ESCUDO_MARINA',
                tipo: 'IMAGEN',
                valor: 'escudo_armada_2026.png',
                descripcion: 'Membrete para correspondencia naval.',
                fechaAcutalizacion: '2026-02-05',
                estado: 'ACTIVO',
                tieneImagen: true
            }
        ];
    }

    get parametrosFiltrados() {
        let filtered = this.parametros;

        if (this.currentFilter !== 'TODOS') {
            filtered = filtered.filter(p => p.tipo === this.currentFilter);
        }

        if (this.searchTerm.trim() !== '') {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.identificador.toLowerCase().includes(term) ||
                p.valor.toLowerCase().includes(term) ||
                p.descripcion.toLowerCase().includes(term)
            );
        }

        return filtered;
    }

    abrirModalParametro(content: any, param?: any) {
        if (param) {
            this.formParametro.patchValue({
                tipoVariable: param.tipo,
                identificador: param.identificador,
                valorPrincipal: param.valor,
                descripcion: param.descripcion,
                cedula: param.detalles ? param.detalles.cedula : '',
                cargoExtra: param.detalles ? param.detalles.cargo : ''
            });
        } else {
            this.formParametro.reset({ tipoVariable: 'CARGO' });
        }

        this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    }

    guardarParametro(modal: any) {
        if (this.formParametro.invalid) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan Datos',
                text: 'Debe completar los campos obligatorios.',
                confirmButtonColor: '#598c89'
            });
            return;
        }

        modal.close('Guardar');
        Swal.fire({
            icon: 'success',
            title: 'Parámetro Guardado',
            text: 'La variable del sistema ha sido configurada exitosamente.',
            confirmButtonColor: '#598c89',
            timer: 2500,
            showConfirmButton: false
        });
    }

    abrirModalEliminar(content: any, param: any) {
        this.parametroSeleccionado = param;
        this.modalService.open(content, { centered: true, backdrop: 'static', windowClass: 'modal-danger' });
    }

    confirmarEliminacion(modal: any) {
        this.parametros = this.parametros.filter(p => p.id !== this.parametroSeleccionado.id);
        modal.close('Eliminar');
        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El parámetro ha sido eliminado.',
            confirmButtonColor: '#598c89',
            timer: 2000,
            showConfirmButton: false
        });
    }
}
