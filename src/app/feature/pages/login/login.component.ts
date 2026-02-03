import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';
import { IToken } from '../../../core/models/login/token-model';
import { LoginService } from 'src/app/core/services/login/login.service';
import { FormsModule } from '@angular/forms';
import { IUsuario } from '../../../core/models/login/usuario-model';
import { Subject } from 'rxjs';
import { CommonModule, DatePipe, DOCUMENT, NgIf, NgTemplateOutlet } from '@angular/common'; // Importar DatePipe, CommonModule, etc.
import { UtilService } from 'src/app/core/services/util/util.service';
import { ApiService } from 'src/app/core/services/api.service';
import { environment } from 'src/environments/environment';



@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [
        NgxUiLoaderModule,
        FormsModule,
        CommonModule // CommonModule incluye DatePipe, NgIf, NgFor, etc.
    ],
    providers: [DatePipe] // Proveedor para DatePipe si se inyecta, pero para template basta con importa CommonModule
})

export class LoginComponent implements OnInit {
    public fechafinal
    public fechaX
    public build

    redirectDelay: number;
    showMessages: any;
    strategy: string;
    errors: string[];
    messages: string[];
    usuario: string;
    clave: string;

    submitted: boolean;
    rememberMe: boolean;

    loading = false;
    isHidden: boolean = true;
    public iToken: IToken = {
        token: '',
    };

    public itk: IToken;
    private index: number = 0;

    private _unsubscribeAll: Subject<any>;
    public showTotpSection = false;
    public otp: string[] = new Array(6).fill('');
    public isOtpInvalid = false;
    private tempAuthToken = ''; // To store the token from the first login step


    public version = "1.0.0";
    public fecha = "";

    // Estado para la animación de entrada
    public introFinished = false;


    constructor(private router: Router,
        private loginService: LoginService,
        private utilservice: UtilService,
        private apiService: ApiService,
        private ngxService: NgxUiLoaderService,
        @Inject(DOCUMENT) private document: Document) {

        if (sessionStorage.getItem("token") != undefined) {
            this.router.navigate(['/principal']);
        }

    }

    ngOnInit() {
        this.getCurrentDate()
        this.fechafinal = environment.buildDateTime
        this.version = environment.version;

        // Iniciar secuencia de animación "Bienvenida -> Login"
        setTimeout(() => {
            this.introFinished = true;
        }, 4500);

        // Clock logic
        setInterval(() => {
            this.updateTime();
        }, 1000);
        this.updateTime();
    }


    formattedDate: string = '';

    updateTime() {
        const currentDate = new Date();
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const day = this.pad(currentDate.getDate());
        const month = months[currentDate.getMonth()];
        const year = currentDate.getFullYear().toString().substr(-2);
        const time = currentDate.toTimeString().split(' ')[0];
        this.formattedDate = `${day}${month}${year} ${time}`;
        this.fecha = currentDate.getFullYear().toString();
    }

    pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }

    getCurrentDate() {
        return new Date();
    }


    goBack() {
        window.history.back();
    }

    enviar() {
        // Acción para el botón enviar
    }

    verifying = false;
    verified = false;

    login() {
        this.verifying = true;
        this.verified = false;
        // this.ngxService.startLoader("loader-login");

        this.loginService.getLogin(this.usuario, this.clave).subscribe(
            (data) => { // Success
                this.verified = true; // Show Verified State

                setTimeout(() => {
                    this.itk = data;
                    let tk: any = this.loginService.getUserDecrypt(this.itk.token);
                    if (tk.Usuario.token !== undefined && tk.Usuario.token !== null) {
                        this.showTotpSection = true;
                        this.tempAuthToken = this.itk.token;
                    } else {
                        this.loginService.IniciarSesion(this.itk.token);
                    }
                    // this.ngxService.stopLoader("loader-login");
                    // this.verifying = false; // Close loader
                }, 3000); // 2 seconds for animation
            },
            (e) => {
                console.log("Error al iniciar sesion desde GDoc")
                this.usuario = ''
                this.clave = ''
                // this.ngxService.stopLoader("loader-login");

                this.loading = false;
                this.isHidden = false;
                this.verifying = false;
                this.verified = false;

                this.utilservice.AlertMini(
                    "top-end",
                    "error",
                    e.error.msj || "Error al acceder al sistema",
                    3000
                );
            }
        );
    }


    /**
     * Handles the paste event on the OTP inputs.
     * @param event The clipboard event.
     */
    onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text').trim();

        // Check if pasted data is a 6-digit number
        if (pastedData && /^[0-9]{6}$/.test(pastedData)) {
            const inputs = Array.from(document.querySelectorAll('.otp-box')) as HTMLInputElement[];
            const digits = pastedData.split('');

            inputs.forEach((input, index) => {
                if (digits[index]) {
                    input.value = digits[index];
                }
            });

            // Focus the last input and trigger verification
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
                this.checkAndVerify();
            }
        }
    }

    /**
     * Navigates back to the username/password login view.
     */
    goBackToLogin() {
        this.showTotpSection = false;
        this.tempAuthToken = '';
        this.isOtpInvalid = false;
        this.otp = new Array(6).fill('');
        // Also clear the actual input fields in the DOM
        const inputs = document.querySelectorAll('.otp-box') as NodeListOf<HTMLInputElement>;
        inputs.forEach(i => i.value = '');
        // Optionally, focus the username/email field again
        const emailInput = this.document.querySelector('#login-email') as HTMLInputElement;
        if (emailInput) { emailInput.focus(); }
    }


    onInput(event: any, nextInput: HTMLInputElement | null) {
        const input = event.target;
        const value = input.value;

        // Limpiar si no es número
        if (!/^[0-9]$/.test(value)) {
            input.value = '';
            return;
        }

        // Mover al siguiente si hay valor
        if (value && nextInput) {
            nextInput.focus();
        }

        this.checkAndVerify();
    }

    onKeydown(event: KeyboardEvent, prevInput: HTMLInputElement | null) {
        const input = event.target as HTMLInputElement;

        if (event.key === 'Backspace') {
            if (!input.value && prevInput) {
                prevInput.focus();
                // Opcional: borrar el valor del anterior al retroceder
                // prevInput.value = ''; 
            }
        }
    }

    private checkAndVerify() {
        // Obtenemos todos los valores directamente del DOM para máxima precisión
        const inputs = Array.from(document.querySelectorAll('.otp-box')) as HTMLInputElement[];
        const code = inputs.map(i => i.value).join('');

        if (code.length === 6) {
            this.otp = code.split(''); // Sincronizamos con tu lógica existente
            this.Continuar();
        }
    }

    // Modifica tu handleOtpError para limpiar los inputs físicos
    private handleOtpError(alertMessage = 'Código incorrecto') {
        this.isOtpInvalid = true;
        const inputs = document.querySelectorAll('.otp-box') as NodeListOf<HTMLInputElement>;
        inputs.forEach(i => i.value = '');
        inputs[0].focus();
        inputs.forEach(i => (i.value = ''));

        // Usamos setTimeout para asegurar que el foco se aplique después de que Angular
        // haya actualizado la vista y aplicado la clase 'shake'.
        setTimeout(() => inputs[0]?.focus(), 0);

        // Quitar la clase de animación después de 500ms para poder repetirla
        setTimeout(() => this.isOtpInvalid = false, 500);
        setTimeout(() => (this.isOtpInvalid = false), 500);

        this.utilservice.AlertMini('top-end', 'error', alertMessage, 4000);
    }


    /**
     * Validates the completed OTP code with the backend.
     */
    Continuar() {
        const otpCode = this.otp.join('');
        if (otpCode.length !== 6 || this.loading) { // Evita re-entrada si ya está cargando
            return;
        }

        this.loading = true; // Mostrar spinner mientras valida
        this.apiService.Validar_TOTP(otpCode, this.tempAuthToken).subscribe(
            (data) => {
                this.loading = false;
                if (data.msj === 'Ok') {
                    this.apiService.MultipleSesion(this.tempAuthToken).subscribe(
                        (xdata) => {
                            if (xdata.msj === 'Ok') {
                                this.loginService.IniciarSesion(this.tempAuthToken)
                            } else if (xdata.tipo == 99) {
                                this.handleOtpError(xdata.msj);
                                this.goBackToLogin()
                            } else {
                                this.handleOtpError('Error al validar el código. Consulta al administrador');
                            }
                        },
                        (error) => { }
                    );



                } else {
                    this.handleOtpError('Error de validacion');
                }
            },
            (e) => {
                this.loading = false;
                // console.info(e.error.msj)
                let xdata = e.error

                if (xdata.tipo == 99) {
                    this.handleOtpError(xdata.msj);
                    this.goBackToLogin()
                } else {
                    this.handleOtpError('Error al validar el código. Inténtelo de nuevo.');
                }


            }
        );
    }


}
