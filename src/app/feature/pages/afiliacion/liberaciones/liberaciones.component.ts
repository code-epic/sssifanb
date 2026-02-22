import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-afi-liberaciones',
    templateUrl: './liberaciones.component.html',
    styleUrls: ['./liberaciones.component.scss']
})
export class LiberacionesComponent implements OnInit {

    public liberacionForm: FormGroup;
    public timData: any = {
        fecha: '22/02/2026 18:05:33',
        codigo: 'TIM-8842-X',
        emisor: 'Administrador Sistema',
        grado: 'CORONEL',
        componente: 'EJERCITO BOLIVARIANO'
    };

    constructor(
        private fb: FormBuilder,
        private modalService: NgbModal,
        private layoutService: LayoutService
    ) { }

    ngOnInit(): void {
        this.layoutService.triggerScrollToTop();
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Liberación de TIM',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.initForm();
    }

    private initForm() {
        this.liberacionForm = this.fb.group({
            cedula: ['', [Validators.required]],
            nombres: ['', [Validators.required]],
            apellidos: ['', [Validators.required]],
            tipo_liberacion: ['', [Validators.required]],
            descripcion: ['', [Validators.required]]
        });
    }

    openConfirmModal(content: any) {
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    confirmarLiberacion(modal: any) {
        console.log('Liberando TIM...', this.liberacionForm.value);
        modal.close();
        // Aquí iría el servicio de guardado
    }
}
