import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss']
})
export class ErrorModalComponent implements OnInit {
  @Input() errorText: string;

  public copyButtonText = 'Copiar Detalle';
  public copyButtonIcon = 'copy';

  constructor(public activeModal: NgbActiveModal, private utilService: UtilService) { }

  ngOnInit(): void { }

  copyError() {
    navigator.clipboard.writeText(this.errorText).then(() => {
      this.copyButtonText = '¡Copiado!';
      this.copyButtonIcon = 'check';
      setTimeout(() => {
        this.copyButtonText = 'Copiar Detalle';
        this.copyButtonIcon = 'copy';
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      this.utilService.AlertMini('top-end', 'error', 'No se pudo copiar el error.', 3000);
    });
  }

  reportError() {
    // Aquí iría la lógica para enviar el error a un sistema de logging o backend.
    // Por ahora, mostramos una alerta y cerramos el modal.
    console.log('Error reportado:', this.errorText);
    this.utilService.AlertMini('top-end', 'info', 'El error ha sido reportado. Gracias.', 4000);
    this.activeModal.close('Reported');
  }
}