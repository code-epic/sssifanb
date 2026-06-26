import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { AfiliadoService } from "src/app/core/services/afiliacion/afiliado.service";
import { LoginService } from "src/app/core/services/login/login.service";
import { environment } from "src/environments/environment";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

@Component({
  selector: "app-mobile-buscador",
  templateUrl: "./mobile-buscador.component.html",
  styleUrls: ["./mobile-buscador.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MobileBuscadorComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private afiliadoService = inject(AfiliadoService);
  private loginService = inject(LoginService);
  private cdr = inject(ChangeDetectorRef);

  public buscar: string = "";
  
  private _isLoading: boolean = false;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  public set isLoading(val: boolean) {
    this._isLoading = val;
    this.layoutService.updateHeader({ hideHeader: val });
  }

  public errorMessage: string = "";
  public militares: any[] = [];
  public fotosMilitares: { [cedula: string]: string } = {};

  // Pagination properties
  public pageSize: number = 8;
  public currentPage: number = 1;

  public get totalPages(): number {
    return Math.ceil(this.militares.length / this.pageSize);
  }

  public nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadListPhotos();
    }
  }

  public prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadListPhotos();
    }
  }

  ngOnInit(): void {
    this.layoutService.toggleCards(false);
    this.layoutService.updateHeader({
      title: "Buscador de Afiliados",
      showBackButton: true,
      showCardsToggle: false,
      showAlertsIcon: false,
    });

    // Restore Search Session if any
    const session = sessionStorage.getItem("buscador_session_mobile");
    if (session) {
      try {
        const data = JSON.parse(session);
        this.buscar = data.q;
        this.militares = data.res;
        this.ordenarYLimitarResultados();
      } catch (e) {
        sessionStorage.removeItem("buscador_session_mobile");
      }
    }
  }

  ngOnDestroy(): void {}

  private validarEntrada(texto: string): string | null {
    if (!texto) return null;
    const sanitized = texto.replace(/[';\\]/g, "");
    if (/0x[0-9A-Fa-f]+/.test(sanitized)) {
      return null;
    }
    return sanitized.trim();
  }

  consultar(event?: any): void {
    if (event) event.preventDefault();
    this.errorMessage = "";

    const inputVal = this.validarEntrada(this.buscar);
    if (!inputVal || inputVal.length < 3) {
      this.errorMessage = "Ingrese al menos 3 caracteres.";
      return;
    }

    this.isLoading = true;
    this.militares = [];
    this.currentPage = 1;

    const isNumeric = /^\d+$/.test(inputVal);
    if (isNumeric) {
      this.buscarCedula(inputVal);
    } else {
      this.buscarCadena(inputVal);
    }
  }

  buscarCedula(cedula: string): void {
    let payload = {};
    const cargo = this.getCargo();

    if (cargo !== "") {
      payload = {
        funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR_COMPONENTE,
        parametros: `${cedula},${cargo}`,
      };
    } else {
      payload = {
        funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR,
        parametros: cedula,
      };
    }

    sessionStorage.removeItem("buscador_session_mobile");
    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data && (!Array.isArray(data) || data.length > 0)) {
          this.isLoading = false;
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else {
            list = [data];
          }
          this.militares = list;
          
          if (this.militares.length === 1) {
            this.seleccionarMilitar(this.militares[0]);
          } else {
            this.ordenarYLimitarResultados();
            this.cdr.markForCheck();
          }
        } else if (cargo !== "") {
          // Fallback to global search if component search returned empty results
          this.buscarCedulaGlobal(cedula);
        } else {
          this.isLoading = false;
          this.errorMessage = "No se encontraron resultados.";
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error("Error al buscar cedula", err);
        if (cargo !== "") {
          // Fallback to global search on error
          this.buscarCedulaGlobal(cedula);
        } else {
          this.isLoading = false;
          this.errorMessage = "Cédula no registrada o error de red.";
          this.cdr.markForCheck();
        }
      },
    });
  }

  buscarCedulaGlobal(cedula: string): void {
    const payload = {
      funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR,
      parametros: cedula,
    };
    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        if (data && (!Array.isArray(data) || data.length > 0)) {
          let list = Array.isArray(data) ? data : [data];
          this.militares = list;
          if (this.militares.length === 1) {
            this.seleccionarMilitar(this.militares[0]);
          } else {
            this.ordenarYLimitarResultados();
            this.cdr.markForCheck();
          }
        } else {
          this.errorMessage = "No se encontraron resultados.";
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error("Error in global fallback search", err);
        this.isLoading = false;
        this.errorMessage = "Cédula no registrada o error de red.";
        this.cdr.markForCheck();
      }
    });
  }

  async buscarCadena(cadena: string): Promise<void> {
    const payload = {
      funcion: environment.funcion.CONSULTAR_MILITARES,
      parametros: cadena.replace(/"/g, '\\"'),
    };

    try {
      await this.apiService.postStream<any>(
        "crudstream",
        payload,
        (militar) => {
          this.militares.push(militar);
          this.cdr.detectChanges();
        }
      );
      this.isLoading = false;
      
      if (this.militares.length === 0) {
        this.errorMessage = "No se encontraron coincidencias.";
      } else {
        this.ordenarYLimitarResultados();
        try {
          sessionStorage.setItem(
            "buscador_session_mobile",
            JSON.stringify({ q: cadena, res: this.militares })
          );
        } catch (e) {
          console.warn("Storage quota exceeded", e);
        }
      }
      this.cdr.markForCheck();
    } catch (error) {
      console.error("Error in string stream search", error);
      this.isLoading = false;
      this.errorMessage = "Error al conectar con la base de datos.";
      this.cdr.markForCheck();
    }
  }

  ordenarYLimitarResultados(): void {
    // Ordenar alfabéticamente por primer apellido y primer nombre
    this.militares.sort((a, b) => {
      const persA = a.persona || a.Persona || {};
      const dbA = persA.datobasico || persA.DatoBasico || {};
      const nameA = `${dbA.apellidoprimero || a.apellidos || ''} ${dbA.nombreprimero || a.nombre || ''}`.trim().toUpperCase();

      const persB = b.persona || b.Persona || {};
      const dbB = persB.datobasico || persB.DatoBasico || {};
      const nameB = `${dbB.apellidoprimero || b.apellidos || ''} ${dbB.nombreprimero || b.nombre || ''}`.trim().toUpperCase();

      return nameA.localeCompare(nameB);
    });

    // Cargar fotos para la porción visible (máximo 15)
    this.loadListPhotos();
  }

  loadListPhotos(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const limitList = this.militares.slice(start, start + this.pageSize);
    limitList.forEach((militar) => {
      const pers = militar.persona || militar.Persona || {};
      const db = pers.datobasico || pers.DatoBasico || {};
      const cedula = db.cedula || militar.cedula || militar.id;
      
      if (cedula && !this.fotosMilitares[cedula]) {
        const payload = {
          ruta: "img/temp/" + cedula + "/",
          archivo: "foto.jpg"
        };
        this.apiService.postBlob("dwscdn", payload).subscribe({
          next: (data: Blob) => {
            if (data && data.size > 0) {
              this.fotosMilitares[cedula] = URL.createObjectURL(data);
              this.cdr.markForCheck();
            }
          },
          error: () => {
            this.fotosMilitares[cedula] = "";
          }
        });
      }
    });
  }

  seleccionarMilitar(militar: any): void {
    this.afiliadoService.setAfiliado(militar);
    this.router.navigate(["/afiliacion/identificacion"]);
  }

  getCargo(): string {
    let cargo = "";
    if (this.loginService && this.loginService.Usuario) {
      const u = this.loginService.Usuario;
      cargo = u.cargo || u.denominacion || u.descripcion || (u.Perfil && u.Perfil.descripcion) || "";
    }
    if (!cargo) {
      const tokenStr = sessionStorage.getItem("token");
      if (tokenStr) {
        try {
          const decoded: any = jwtDecode(tokenStr);
          const usr = decoded?.Usuario || decoded || {};
          cargo = usr.cargo || usr.denominacion || usr.descripcion || (usr.Perfil && usr.Perfil.descripcion) || "";
        } catch (e) {
          console.error("Error decoding token", e);
        }
      }
    }
    
    if (cargo) {
      const cargoUpper = cargo.toUpperCase();
      if (cargoUpper.includes("EJÉRCITO") || cargoUpper.includes("EJERCITO")) {
        return "EJ";
      } else if (cargoUpper.includes("ARMADA")) {
        return "AR";
      } else if (cargoUpper.includes("AVIACIÓN") || cargoUpper.includes("AVIACION")) {
        return "AV";
      } else if (cargoUpper.includes("GUARDIA") || cargoUpper.includes("GNB") || cargoUpper.includes("G.N.")) {
        return "GN";
      }
    }
    return "";
  }
}
