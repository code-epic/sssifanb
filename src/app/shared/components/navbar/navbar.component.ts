import { Component, OnInit, ElementRef, OnDestroy, Inject, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Location, DatePipe, UpperCasePipe, registerLocaleData } from '@angular/common'; // Import DatePipe, UpperCasePipe, registerLocaleData
import localeEs from '@angular/common/locales/es'; // Import Spanish locale


import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { ROUTES } from 'src/app/core/models/menu/menu-models';
import { LoginService } from 'src/app/core/services/login/login.service';
import { IAPICore } from 'src/app/core/models/api/api-model';
import { ApiService } from 'src/app/core/services/api.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { environment } from 'src/environments/environment';

import { DOCUMENT, CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sha256Service } from 'src/app/core/services/util/sha256';

registerLocaleData(localeEs, 'es'); // Register locale data


interface Change {
  usuario: string;
  clave: string;
  nueva: string;
  repite: string;
}


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLinkActive, RouterLink, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, DatePipe, UpperCasePipe]
})
export class NavbarComponent implements OnInit, OnDestroy {
  public focus;
  public listTitles: any[];
  public location: Location;
  public time = new Date();
  private timer: any;

  @Output() onChange = new EventEmitter<any>();
  public nombre: string = 'Analista'
  public alerta: boolean = false
  public usuario: string = ''
  public cedula: string = '';
  public correo: string = '';
  public fecha: Date = new Date();





  public showClave = false;
  public showNueva = false;
  public showRepite = false;

  public changePasswordForm: FormGroup;

  public Change: Change = {
    usuario: "",
    clave: "",
    nueva: "",
    repite: "",
  }



  // Password Strength properties
  public passwordStrength: number = 0;
  public passwordStrengthLabel: string = 'Sin seguridad';
  public passwordStrengthColor: string = '';
  public passwordStrengthWidth: number = 0;


  // Agrega estas propiedades a tu clase NavbarComponent
  public showTotpSection: boolean = false;
  public totpQrCodeUrl: string = '';
  public totpSecret: string = '';
  public isTotpSecretCopied: boolean = false;
  public isTotpActive: boolean = false;
  public booleanIsSidenav = false;

  public xAPI: IAPICore = {
    funcion: '',
    parametros: ''
  };



  constructor(
    location: Location,
    private fb: FormBuilder,
    private loginService: LoginService,
    private apiService: ApiService,
    private utilservice: UtilService,
    private sha256: Sha256Service,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.location = location;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);

    // Iniciar reloj
    this.timer = setInterval(() => {
      this.time = new Date();
    }, 1000);

    this.initForm();

    this.listTitles = ROUTES.filter(listTitle => listTitle);

    this.nombre = this.loginService.Usuario.nombre
    this.cedula = this.loginService.Usuario.cedula
    this.correo = this.loginService.Usuario.correo


  }

  initForm() {
    this.changePasswordForm = this.fb.group({
      clave: ['', Validators.required],
      nueva: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/)
      ]],
      repite: ['', Validators.required]
    }, {
      validators: this.checkPasswords // Nota: es 'validators' en plural para FormBuilder
    });

    // Suscribirse a cambios para que la validación de "Repetir" sea instantánea al cambiar "Nueva"
    this.changePasswordForm.get('nueva').valueChanges.subscribe(() => {
      this.changePasswordForm.get('repite').updateValueAndValidity();
    });
  }


  checkPasswords(group: AbstractControl) {
    const nueva = group.get('nueva').value;
    const repite = group.get('repite').value;
    return nueva === repite ? null : { notSame: true };
  }


  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  getTitle() {
    let titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === '#') {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }
    return 'Principal';
  }

  cerrar() {
    this.loginService.logout();
  }



  // 3. Asegura que el Modal inicialice todo correctamente
  ModalChangePassword(modal) {
    this.changePasswordForm.reset();
    // Reiniciamos valores de fuerza de contraseña
    this.passwordStrengthWidth = 0;
    this.passwordStrengthLabel = 'Sin seguridad';
    this.passwordStrengthColor = '';

    this.showTotpSection = false;
    this.isTotpActive = false;

    this.Change.usuario = this.loginService.Usuario.usuario;

    this.modalService.open(modal, {
      centered: true,
      size: "md",
      backdrop: 'static', // Cambiado a static para evitar cierres accidentales
      keyboard: false,
      windowClass: 'fondo-modal'
    });
  }




  // ... (dentro de la clase NavbarComponent)

  /**
   * Activa o desactiva la sección de configuración de TOTP.
   * Si se activa, genera el código si no ha sido generado antes.
   * @param isChecked El estado del interruptor (true/false).
   */
  toggleTotpModel(isChecked: boolean) {
    this.showTotpSection = isChecked;
    this.isTotpActive = isChecked;
    this.cdr.detectChanges();

    if (isChecked) {
      this.generateTotp();
    } else {
      this.limpiarTotp();
    }
  }

  async generateTotp() {
    this.totpQrCodeUrl = '';
    this.totpSecret = '';
    this.cdr.detectChanges();

    this.apiService.GenerarQR_TOTP('base64').subscribe(
      (data) => {
        this.totpQrCodeUrl = data.contenido;
        this.totpSecret = data.msj;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al generar el código TOTP', error);
        this.cdr.detectChanges();
      }
    );
  }

  async limpiarTotp() {

    this.showTotpSection = false;
    this.xAPI = {} as IAPICore
    this.xAPI.funcion = environment.funcion.ACTUALIZAR_TOTP
    this.xAPI.parametros = this.totpSecret

    this.apiService.post('crud', this.xAPI).subscribe(
      (data) => {
        console.log(data)
        this.totpQrCodeUrl = ''
        this.totpSecret = ''
      },
      (error) => {
        console.log(error)
      }
    )

  }

  /**
   * Copia la clave secreta de TOTP al portapapeles del usuario.
   */
  copyTotpSecret() {
    if (!this.totpSecret) return;

    navigator.clipboard.writeText(this.totpSecret).then(() => {
      this.isTotpSecretCopied = true;
      setTimeout(() => {
        this.isTotpSecretCopied = false;
      }, 2500);
    }).catch(err => {
      console.error('Error al copiar la clave TOTP:', err);
      this.utilservice.AlertMini('top-end', 'error', 'No se pudo copiar la clave.', 3000);
    });
  }


  /**
* Check Password Strength
* @param password 
*/
  checkPasswordStrength(password: string): void {
    const checks = [
      /.{8,}/,       // Mínimo 8 caracteres
      /[A-Z]/,       // Al menos una mayúscula
      /[a-z]/,       // Al menos una minúscula
      /[0-9]/,       // Al menos un número
      /[@$!%*?&]/    // Al menos un símbolo
    ];

    const result = checks.reduce((score, regex) => {
      return score + (regex.test(password) ? 20 : 0);
    }, 0);

    this.passwordStrengthWidth = result;

    if (result < 40) {
      this.passwordStrengthLabel = 'Débil';
      this.passwordStrengthColor = 'bg-danger';
    } else if (result < 80) {
      this.passwordStrengthLabel = 'Media';
      this.passwordStrengthColor = 'bg-warning';
    } else if (result < 100) {
      this.passwordStrengthLabel = 'Buena';
      this.passwordStrengthColor = 'bg-info';
    } else {
      this.passwordStrengthLabel = 'Fuerte';
      this.passwordStrengthColor = 'bg-success';
    }
  }


  activarSinEvento() {
    this.isTotpActive = true;
    this.apiService.GetImageQR(this.totpSecret).subscribe(
      (data) => {
        console.log(data)
        this.totpQrCodeUrl = data.contenido;
      },
      (error) => {
        console.error('Error al generar el código TOTP', error);
      }
    )
  }


  async ChangesPassword() {
    if (this.changePasswordForm.invalid) {
      this.utilservice.AlertMini("top-end", "error", "Verifique los campos del formulario", 3000);
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    if (!this.Change.usuario) {
      this.utilservice.AlertMini("top-end", "error", "No existe un usuario", 3000);
      return;
    }

    const formValues = this.changePasswordForm.value;
    let claveHash = '';
    let nuevaHash = '';

    await this.sha256.hash(formValues.clave).then(hash => {
      claveHash = hash
    })

    await this.sha256.hash(formValues.nueva).then(hash => {
      nuevaHash = hash
    })


    let xApi = {
      funcion: environment.funcion.ACTUALIZAR_CLAVE_USUARIO,
      parametros: `${this.Change.usuario},${claveHash},${nuevaHash}`,
    }

    this.apiService.post('crud', xApi).subscribe(
      (data: any) => {
        this.clearModal();
        if (data.ModifiedCount > 0) {
          this.utilservice.AlertMini("top-end", "success", "Contraseña actualizada exitosamente", 3000);
          this.cerrar()
        }

      },
      (error) => {
        // console.log(error)
        this.clearModal();
      }
    )


  }

  clearModal() {
    this.changePasswordForm.reset();
    this.modalService.dismissAll();
  }





}
