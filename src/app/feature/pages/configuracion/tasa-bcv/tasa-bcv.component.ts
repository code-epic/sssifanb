import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-conf-tasa-bcv',
    templateUrl: './tasa-bcv.component.html',
    styleUrls: ['./tasa-bcv.component.scss']
})
export class TasaBcvComponent implements OnInit {

    public formTasa: FormGroup;
    public historial: any[] = [
        { fecha: '2026-02-23', monto: 36.50, usuario: 'Admin', estado: 'Activo' },
        { fecha: '2026-02-22', monto: 36.45, usuario: 'Admin', estado: 'Inactivo' },
        { fecha: '2026-02-21', monto: 36.40, usuario: 'Admin', estado: 'Inactivo' }
    ];

    private indexEliminar: number = -1;

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private modalService: NgbModal
    ) {
        this.formTasa = this.fb.group({
            monto: ['', [Validators.required, Validators.min(0.01)]],
            fecha: [new Date().toISOString().substring(0, 10), Validators.required]
        });
    }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Configuracion / Tasa BCV',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

    confirmarGuardar(content: any) {
        if (this.formTasa.invalid) {
            Swal.fire({
                title: 'Error',
                text: 'Debe completar los campos correctamente',
                icon: 'error',
                customClass: {
                    confirmButton: 'btn btn-ok'
                },
                buttonsStyling: false
            });
            return;
        }
        this.modalService.open(content, { centered: true, size: 'md' });
    }

    registrarTasa(modal: any) {
        const nuevaTasa = {
            ...this.formTasa.value,
            usuario: 'Admin',
            estado: 'Activo'
        };

        // Simulación de guardado
        this.historial.unshift(nuevaTasa);
        this.historial.forEach((item, index) => {
            if (index > 0) item.estado = 'Inactivo';
        });

        modal.close();

        Swal.fire({
            title: 'Éxito',
            text: 'Tasa BCV registrada correctamente',
            icon: 'success',
            customClass: {
                confirmButton: 'btn btn-ok'
            },
            buttonsStyling: false
        });

        this.formTasa.reset({
            monto: '',
            fecha: new Date().toISOString().substring(0, 10)
        });
    }

    confirmarEliminar(content: any, index: number) {
        this.indexEliminar = index;
        this.modalService.open(content, { centered: true, size: 'md' });
    }

    eliminarTasa(modal: any) {
        if (this.indexEliminar > -1) {
            this.historial.splice(this.indexEliminar, 1);
            this.indexEliminar = -1;
            modal.close();
            Swal.fire({
                title: 'Eliminado',
                text: 'El registro ha sido borrado.',
                icon: 'success',
                customClass: {
                    confirmButton: 'btn btn-ok'
                },
                buttonsStyling: false
            });
        }
    }

}
