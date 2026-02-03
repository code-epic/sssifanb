import { Component, OnInit, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LoginService } from 'src/app/core/services/login/login.service';





interface LogoutStep {
  key: string;
  label: string;
  status: 'pending' | 'in-progress' | 'done' | 'error';
}

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit, OnDestroy {
  public steps: LogoutStep[] = [
    { key: 'SERVER_LOGOUT', label: 'Finalizando sesión en el servidor', status: 'pending' },
    { key: 'CLEAR_SESSION', label: 'Limpiando datos de la sesión local', status: 'pending' },
    { key: 'REDIRECT', label: 'Redirigiendo', status: 'pending' }
  ];
  public finalMessage: string = '';
  // Mapea los mensajes del servicio a las claves de los pasos
  private messageToStepKey: { [message: string]: string } = {
    'Finalizando sesión en el servidor...': 'SERVER_LOGOUT',
    'No se pudo contactar al servidor, limpiando localmente...': 'SERVER_LOGOUT',
    'Limpiando datos de la sesión...': 'CLEAR_SESSION',
    '¡Hasta pronto!': 'REDIRECT'
  };

  public countdown: number = 10; // Initial countdown value
  private _timerSubscription: any; // To hold the timer subscription
  public texto: string = ''




  constructor(
    private loginService: LoginService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {


  }

  ngOnInit(): void {
    this.executeLogout();
  }

  async executeLogout(): Promise<void> {
    await this.loginService.performLogoutProcess((message: string) => {
      this.ngZone.run(() => {
        this.texto = message.trim()
        this.updateStepStatus(message)
      });
    });
  }

  private updateStepStatus(message: string): void {

    const stepKey = this.messageToStepKey[message.trim()];
    if (!stepKey) return;

    // Force change detection by creating a new reference and cloning objects
    const newSteps = this.steps.map(step => ({ ...step }));
    const currentStepIndex = newSteps.findIndex(s => s.key === stepKey);
    if (currentStepIndex === -1) return;

    // Marcar todos los pasos anteriores como 'completados'
    for (let i = 0; i < currentStepIndex; i++) {
      if (newSteps[i].status !== 'error') {
        newSteps[i].status = 'done';
      }
    }

    // Marcar el paso actual
    if (message.includes('No se pudo')) {
      newSteps[currentStepIndex].status = 'error';
    } else if (message === '¡Hasta pronto!') {
      newSteps[currentStepIndex].status = 'done';
      this.texto = ''
      this.finalMessage = '¡Sesión cerrada con éxito!';
    } else {
      newSteps[currentStepIndex].status = 'in-progress';
    }
    this.steps = newSteps;
    this.cdr.detectChanges();
  }

  getHeaderIconClass(): string {
    if (this.finalMessage) {
      return 'fa fa-check-circle  bounce-icon fa-4x';
    }
    return 'fa fa-key pulse-icon fa-4x';
  }

  getStepClass(status: string): string {
    switch (status) {
      case 'pending': return 'text-muted';
      case 'in-progress': return 'text-primary font-weight-bold active-step';
      case 'done': return 'text-success';
      case 'error': return 'text-danger';
      default: return '';
    }
  }

  getIconClass(status: string): string {
    switch (status) {
      case 'pending': return 'fa fa-circle-thin';
      case 'in-progress': return 'fa fa-circle-o-notch fa-spin';
      case 'done': return 'fa fa-check';
      case 'error': return 'fa fa-times-circle';
      default: return '';
    }
  }

  getTextClass(status: string): string {
    switch (status) {
      case 'pending': return 'text-muted';
      case 'in-progress': return 'text-dark font-weight-bold';
      case 'done': return 'text-muted strikethrough';
      case 'error': return 'text-danger';
      default: return '';
    }
  }
  /**
 * On destroy
 */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions (including the timer)
    // this._unsubscribeAll.next();
    // this._unsubscribeAll.complete();

    // Explicitly unsubscribe from the timer if it's still active
    if (this._timerSubscription) {
      this._timerSubscription.unsubscribe();
    }
  }
}