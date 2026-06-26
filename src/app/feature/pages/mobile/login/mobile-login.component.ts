import { Component, OnInit, OnDestroy, Inject, ElementRef, ViewChildren, QueryList } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule, DatePipe, DOCUMENT } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LoginService } from "src/app/core/services/login/login.service";
import { UtilService } from "src/app/core/services/util/util.service";
import { ApiService } from "src/app/core/services/api.service";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";

@Component({
  selector: "app-mobile-login",
  templateUrl: "./mobile-login.component.html",
  styleUrls: ["./mobile-login.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class MobileLoginComponent implements OnInit, OnDestroy {
  public time: Date = new Date();
  public fecha: string = "";
  public version: string = "";
  public fechafinal: string = "";

  public usuario: string = "";
  public clave: string = "";
  public rememberMe: boolean = false;

  public loading: boolean = false;
  public isHidden: boolean = true;
  public verifying: boolean = false;
  public verified: boolean = false;

  public showTotpSection: boolean = false;
  public otp: string[] = new Array(6).fill("");
  public isOtpInvalid: boolean = false;

  private tempAuthToken: string = "";
  private timerInterval: any;

  @ViewChildren("otpInput") otpInputs!: QueryList<ElementRef>;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private utilService: UtilService,
    private apiService: ApiService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    const sessionToken = sessionStorage.getItem("token");
    const hasMenu = sessionStorage.getItem("menu");
    if (
      sessionToken &&
      sessionToken !== "undefined" &&
      sessionToken !== "null"
    ) {
      if (!hasMenu) {
        this.loginService.Iniciar(sessionToken);
      } else {
        this.router.navigate(["/principal"]);
      }
    }
  }

  ngOnInit(): void {
    this.version = environment.version;
    this.fechafinal = environment.buildDateTime;

    this.updateTime();
    this.timerInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateTime(): void {
    this.time = new Date();
    this.fecha = this.time.getFullYear().toString();
  }

  login(): void {
    if (!this.usuario || !this.clave) return;

    this.loading = true;
    this.verifying = true;
    this.verified = false;

    this.loginService.getLogin(this.usuario, this.clave).subscribe({
      next: (data: any) => {
        this.verified = true;

        setTimeout(() => {
          const token = data.token;
          const tk: any = this.loginService.getUserDecrypt(token);

          if (tk.Usuario?.token !== undefined && tk.Usuario?.token !== null) {
            this.showTotpSection = true;
            this.tempAuthToken = token;
            this.verifying = false;
            this.loading = false;
            setTimeout(() => {
              this.focusOtpInput(0);
            }, 100);
          } else {
            this.loginService.IniciarSesion(token);
          }
        }, 1500);
      },
      error: (err: any) => {
        console.error("Error al iniciar sesión móvil", err);
        this.usuario = "";
        this.clave = "";
        this.loading = false;
        this.verifying = false;
        this.verified = false;

        Swal.fire({
          title: "Error de Acceso",
          text:
            err.error?.msj || "Credenciales inválidas o error de conexión.",
          icon: "error",
          confirmButtonText: "Reintentar",
          customClass: {
            confirmButton: "btn btn-pastel btn-block py-2 rounded-12",
          },
          buttonsStyling: false,
        });
      },
    });
  }

  onInput(event: any, index: number): void {
    const val = event.target.value;
    if (!/^[0-9]$/.test(val)) {
      event.target.value = "";
      this.otp[index] = "";
      return;
    }

    this.otp[index] = val;

    if (index < 5) {
      this.focusOtpInput(index + 1);
    } else {
      this.checkAndVerify();
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === "Backspace") {
      if (!this.otp[index] && index > 0) {
        this.otp[index - 1] = "";
        this.focusOtpInput(index - 1);
      } else {
        this.otp[index] = "";
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData("text").trim();
    if (pastedData && /^[0-9]{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      for (let i = 0; i < 6; i++) {
        this.otp[i] = digits[i];
      }
      this.focusOtpInput(5);
      this.checkAndVerify();
    }
  }

  focusOtpInput(index: number): void {
    const inputElements = this.otpInputs.toArray();
    if (inputElements[index]) {
      inputElements[index].nativeElement.focus();
    }
  }

  checkAndVerify(): void {
    const code = this.otp.join("");
    if (code.length === 6) {
      this.loading = true;
      this.isOtpInvalid = false;

      this.apiService.Validar_TOTP(code, this.tempAuthToken).subscribe({
        next: (data: any) => {
          this.loading = false;
          if (data && data.token) {
            this.loginService.IniciarSesion(data.token);
          } else {
            this.loginService.IniciarSesion(this.tempAuthToken);
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.isOtpInvalid = true;
          this.otp = new Array(6).fill("");
          this.focusOtpInput(0);

          Swal.fire({
            title: "Código Inválido",
            text: "El código de seguridad ingresado no es correcto.",
            icon: "warning",
            confirmButtonText: "Aceptar",
            customClass: {
              confirmButton: "btn btn-pastel btn-block py-2 rounded-12",
            },
            buttonsStyling: false,
          });
        },
      });
    }
  }

  goBackToLogin(): void {
    this.showTotpSection = false;
    this.tempAuthToken = "";
    this.isOtpInvalid = false;
    this.otp = new Array(6).fill("");
    this.usuario = "";
    this.clave = "";
  }
}
