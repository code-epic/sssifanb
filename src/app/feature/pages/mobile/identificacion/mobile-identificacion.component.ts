import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { ConstanciaAfiliacionComponent } from "../../afiliacion/identificacion/pdf/constancia-afiliacion.component";
import { AfiliadoService } from "src/app/core/services/afiliacion/afiliado.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { UtilService } from "src/app/core/services/util/util.service";
import { ApiService } from "src/app/core/services/api.service";
import { Sha256Service } from "src/app/core/services/util/sha256";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { LoginService } from "src/app/core/services/login/login.service";

@Component({
  selector: "app-mobile-identificacion",
  templateUrl: "./mobile-identificacion.component.html",
  styleUrls: ["./mobile-identificacion.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterLink, ConstanciaAfiliacionComponent],
})
export class MobileIdentificacionComponent implements OnInit, OnDestroy {
  private afiliadoService = inject(AfiliadoService);
  private layoutService = inject(LayoutService);
  private loginService = inject(LoginService);
  private utilService = inject(UtilService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private sha256 = inject(Sha256Service);
  private destroy$ = new Subject<void>();

  public militar: any = null;
  public familiares: any[] = [];

  public tiempoServicio: string = "";
  public tiempoServicioTotal: string = "";
  public fechaVencimientoTIM: string = "";

  // Normalised fields for casing resilience
  public militarNombre: string = "Militar Titular";
  public militarCedula: string = "N/A";
  public militarComponente: string = "N/A";
  public militarGrado: string = "N/A";
  public militarCategoria: string = "N/A";
  public militarClase: string = "N/A";
  public militarFingreso: string = "";
  public militarFascenso: string = "";
  public militarSituacion: string = "N/A";

  // Photo variables
  public fotoAfiliadoBlobUrl: string = "";
  public isLoadingFoto: boolean = false;
  public isZoomActive: boolean = false;
  public zoomPhotoUrl: string = "";

  // Accordion control for family members list
  public expandedFamiliarIdx: number | null = null;
  public isGeneratingPdf: boolean = false;
  public permisos: { [key: string]: boolean } = {};

  ngOnInit(): void {
    this.layoutService.toggleCards(false);
    this.layoutService.updateHeader({
      title: "Ficha de Afiliación",
      showBackButton: true,
      showCardsToggle: false,
      showAlertsIcon: true,
      alertSeverity: 1,
    });

    this.afiliadoService.afiliado$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data) {
          let rawData = data;
          if (Array.isArray(data) && data.length > 0) {
            rawData = data[0];
          } else if (Array.isArray(data) && data.length === 0) {
            this.militar = null;
            return;
          }

          this.militar = rawData;
          this.procesarDatosMilitar();
          this.cdr.markForCheck();
        } else {
          this.militar = null;
          this.cdr.markForCheck();
        }
      });
    this.cargarPermisologia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPermisologia() {
    let privilegios = this.loginService.obtenerPrivilegiosMenu("/principal");
    // console.log(privilegios);
    if (privilegios) {
      Object.keys(privilegios).forEach((key) => {
        privilegios[key].forEach((p: any) => {
          if (p.codigo) {
            this.permisos[p.codigo] = true;
          }
        });
      });
    }
  }

  private procesarDatosMilitar(): void {
    if (!this.militar) return;

    // Normalise Persona / DatoBasico (casing resilience)
    const pers = this.militar.persona || this.militar.Persona || {};
    const db = pers.datobasico || pers.DatoBasico || {};

    this.militarCedula =
      db.cedula || this.militar.cedula || this.militar.id || "N/A";

    const primerNombre = db.nombreprimero || db.nombrefirst || "";
    const primerApellido = db.apellidoprimero || db.apellidofirst || "";
    this.militarNombre =
      db.nombrecompleto ||
      `${primerNombre} ${primerApellido}`.trim() ||
      "Militar Titular";

    // Normalise Componente
    const comp = this.militar.componente || this.militar.Componente || {};
    this.militarComponente = comp.descripcion || comp.nombre || "N/A";

    // Normalise Grado
    const grad = this.militar.grado || this.militar.Grado || {};
    this.militarGrado = grad.descripcion || grad.nombre || "N/A";

    // Categoria & Clase
    const catCode = String(this.militar.categoria || "")
      .toUpperCase()
      .trim();
    if (catCode === "EFE") {
      this.militarCategoria = "EFECTIVO";
    } else if (catCode === "ASI") {
      this.militarCategoria = "ASIMILADO";
    } else {
      this.militarCategoria = this.militar.categoria || "N/A";
    }
    this.militarClase = this.militar.clase || "N/A";

    // Situacion & Dates
    const sitCode = String(this.militar.situacion || "")
      .toUpperCase()
      .trim();
    if (sitCode === "ACT") {
      this.militarSituacion = "ACTIVO";
    } else if (sitCode === "RCP") {
      this.militarSituacion = "RETIRADO CON PENSIÓN";
    } else if (sitCode === "RSP") {
      this.militarSituacion = "RETIRADO SIN PENSIÓN";
    } else if (sitCode === "PG") {
      this.militarSituacion = "PENSIONADO DE GRACIA";
    } else if (sitCode === "I") {
      this.militarSituacion = "INVALIDEZ";
    } else {
      this.militarSituacion = this.militar.situacion || "N/A";
    }

    // Normalise Ingreso & Ascenso for UI binding
    this.militarFingreso = this.militar.fingreso?.$date || this.militar.fingreso || "";
    this.militarFascenso = this.militar.fascenso?.$date || this.militar.fascenso || "";

    // Calculate times of service aligning with desktop logic
    const fingresoIso = this.formatToISODate(this.militar.fingreso);
    const fretiroIso = this.formatToISODate(this.militar.fretiro);
    const situacion = this.militar.situacion || "";
    
    this.tiempoServicio = this.utilService.calcularTServicio(fingresoIso, fretiroIso, situacion);
    
    const tieneReconocido =
      this.militar.areconocido > 0 ||
      this.militar.mreconocido > 0 ||
      this.militar.dreconocido > 0;
      
    this.tiempoServicioTotal = tieneReconocido
      ? this.utilService.calcularTServicioTotal(
          fingresoIso,
          this.militar.areconocido || 0,
          this.militar.mreconocido || 0,
          this.militar.dreconocido || 0
        )
      : "";

    // TIM Expiration
    this.fechaVencimientoTIM = this.militar.tim?.fechavencimiento || "N/A";

    // Process Family members
    const fams = this.militar.familiar || this.militar.Familiar || [];
    this.familiares = fams.map((f: any, index: number) => {
      const fpers = f.persona || f.Persona || {};
      const fdb = fpers.datobasico || fpers.DatoBasico || {};
      const fcedula = fdb.cedula || f.cedula || "N/A";
      const fNombre1 =
        fdb.nombreprimero || fdb.nombrecompleto || fdb.nombrefirst || "";
      const fApellido1 = fdb.apellidoprimero || fdb.apellidofirst || "";
      const fnombres =
        `${fNombre1} ${fApellido1}`.trim() || f.nombre || "Familiar";
      const fsexo = fdb.sexo || "M";
      const fparentesco = f.parentesco || "";

      // Load familiar photo asynchronously
      this.loadFamiliarPhoto(this.militarCedula, fcedula, index);

      return {
        cedula: fcedula,
        nombres: fnombres,
        parentesco: this.utilService.resolvParentesco(fparentesco, fsexo),
        parentescoAbrev: fparentesco,
        sexo: fsexo === "F" ? "Femenino" : "Masculino",
        fingreso: f.fechaafiliacion || f.fingreso || "N/A",
        beneficiario: f.beneficio ? "SÍ" : "NO",
        esmilitar: f.esmilitar ? "SÍ" : "NO",
        estadoCivil:
          fdb.estadocivil === "S"
            ? "Soltero(a)"
            : fdb.estadocivil === "C"
              ? "Casado(a)"
              : fdb.estadocivil || "N/A",
        fotoUrl: "",
        fechanacimiento: fdb.fechanacimiento || "",
        inactivo:
          f.beneficio === false ||
          String(f.beneficio).toLowerCase() === "false" ||
          f.beneficio === 0,
      };
    });

    // Load photo from API
    this.loadMilitarPhoto(this.militarCedula);
  }

  loadMilitarPhoto(cedula: string): void {
    if (cedula && cedula.trim() !== "N/A" && cedula.trim() !== "") {
      this.isLoadingFoto = true;
      const payload = {
        ruta: "img/temp/" + cedula + "/",
        archivo: "foto.jpg",
      };
      this.apiService.postBlob("dwscdn", payload).subscribe({
        next: (data: Blob) => {
          this.isLoadingFoto = false;
          if (data && data.size > 0) {
            this.fotoAfiliadoBlobUrl = URL.createObjectURL(data);
            this.cdr.markForCheck();
          } else {
            this.fotoAfiliadoBlobUrl = "";
          }
        },
        error: (error) => {
          this.isLoadingFoto = false;
          console.error("Error loading military photo", error);
          this.fotoAfiliadoBlobUrl = "";
          this.cdr.markForCheck();
        },
      });
    } else {
      this.fotoAfiliadoBlobUrl = "";
    }
  }

  loadFamiliarPhoto(
    militarCedula: string,
    familiarCedula: string,
    index: number,
  ): void {
    if (
      militarCedula &&
      familiarCedula &&
      familiarCedula !== "N/A" &&
      familiarCedula !== ""
    ) {
      const payload = {
        ruta: "img/temp/" + militarCedula + "/",
        archivo: "foto" + familiarCedula + ".jpg",
      };
      this.apiService.postBlob("dwscdn", payload).subscribe({
        next: (data: Blob) => {
          if (data && data.size > 0) {
            if (this.familiares[index]) {
              this.familiares[index].fotoUrl = URL.createObjectURL(data);
              this.cdr.markForCheck();
            }
          }
        },
        error: (error) => {
          // Silently ignore if familiar has no photo
        },
      });
    }
  }

  getUsuarioLogin(): string {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload?.Usuario?.usuario || payload?.Usuario?.correo || "SISTEMA";
      } catch (e) {}
    }
    return "SISTEMA";
  }

  encodeSteganography(userLogin: string): string {
    let binary = "";
    for (let i = 0; i < userLogin.length; i++) {
      const charCode = userLogin.charCodeAt(i);
      const charBinary = charCode.toString(2).padStart(8, "0");
      binary += charBinary;
    }
    
    // Generar caracteres de ancho cero en tiempo de ejecución para evitar corrupción por charset/transpilador
    const ZW_SPACE = String.fromCharCode(0x200B);
    const ZW_NON_JOINER = String.fromCharCode(0x200C);
    const ZW_JOINER = String.fromCharCode(0x200D);

    let encoded = ZW_JOINER; // Start marker
    for (let i = 0; i < binary.length; i++) {
      encoded += binary[i] === "0" ? ZW_SPACE : ZW_NON_JOINER;
    }
    encoded += ZW_JOINER; // End marker
    return encoded;
  }

  watermarkLabel(label: string): string {
    // Reemplaza de forma constante algunas letras con homóglifos cirílicos idénticos visualmente
    return label
      .replace(/a/g, "\u0430") // Latin 'a' -> Cyrillic 'a'
      .replace(/e/g, "\u0435") // Latin 'e' -> Cyrillic 'e'
      .replace(/o/g, "\u043e") // Latin 'o' -> Cyrillic 'o'
      .replace(/c/g, "\u0441"); // Latin 'c' -> Cyrillic 'c'
  }

  async copiarDatosMilitar(event: Event): Promise<void> {
    if (event) {
      event.stopPropagation(); // Evitar otros clicks
    }
    if (!this.militar) return;

    const fIng = this.formatToISODate(this.militar.fingreso);
    const fIngFormatted = fIng ? fIng.split("-").reverse().join("/") : "N/D";

    // Obtener la firma esteganográfica del login (caracteres invisibles)
    const login = this.getUsuarioLogin();
    const stegoSignature = this.encodeSteganography(login);

    // Aplicar marcas de homóglifos al inicio (cabecera)
    const headerWatermarked = this.watermarkLabel("Datos del Militar (SSSIFANB):");

    let texto = `${headerWatermarked}${stegoSignature}
- Nombre: ${this.militarNombre}${stegoSignature}
- C.I.: V-${this.militarCedula}${stegoSignature}
- Componente: ${this.militarComponente}${stegoSignature}
- Grado: ${this.militarGrado}${stegoSignature}
- Categoría: ${this.militarCategoria}${stegoSignature}
- Situación: ${this.militarSituacion}${stegoSignature}
- Fecha de Ingreso: ${fIngFormatted}${stegoSignature}
- Antigüedad: ${this.tiempoServicio || "N/D"}${stegoSignature}`;

    if (this.tiempoServicioTotal) {
      texto += `\n- Antigüedad Total (c/ Reconocido): ${this.tiempoServicioTotal}${stegoSignature}`;
    }

    if (this.familiares && this.familiares.length > 0) {
      const familyHeaderWatermarked = this.watermarkLabel("Grupo Familiar:");
      texto += `\n\n${familyHeaderWatermarked}${stegoSignature}`;
      this.familiares.forEach((f: any, idx: number) => {
        texto += `\n${idx + 1}. ${f.nombres} - C.I: ${f.cedula} - Parentesco: ${f.parentesco} - Beneficiario: ${f.beneficiario}${stegoSignature}`;
      });
    }

    // 1. Calcular firma digital del contenido para verificación de integridad (Evita alteración de C.I. o datos)
    const contentToHash = `${this.militarNombre}|${this.militarCedula}|${this.militarSituacion}|${fIngFormatted}|${this.tiempoServicio}`;
    const contentHash = await this.sha256.hash(contentToHash);
    const shortContentHash = contentHash.substring(0, 4).toUpperCase();

    // 2. Calcular firma del login del operador para auditoría robusta (sobrevive al filtrado de WhatsApp)
    const userHash = await this.sha256.hash(login);
    const shortUserHash = userHash.substring(0, 4).toUpperCase();

    // Código de seguridad visible e inmune (ej: SSS-F3A1-C8D2)
    const securityCode = `SSS-${shortContentHash}-${shortUserHash}`;
    const footerLabelWatermarked = this.watermarkLabel("- Código de Seguridad:");

    texto += `\n\n${footerLabelWatermarked} ${securityCode}${stegoSignature}`;

    navigator.clipboard.writeText(texto).then(() => {
      this.utilService.AlertMini("top-end", "success", "Datos copiados al portapapeles", 2000);
    }).catch(err => {
      console.error("Error al copiar al portapapeles:", err);
    });
  }

  openZoom(url: string): void {
    if (url) {
      this.zoomPhotoUrl = url;
      this.isZoomActive = true;
      this.cdr.markForCheck();
    }
  }

  closeZoom(): void {
    this.isZoomActive = false;
    this.zoomPhotoUrl = "";
    this.cdr.markForCheck();
  }

  zoomFamiliar(url: string, event: Event): void {
    if (url) {
      event.stopPropagation();
      this.openZoom(url);
    }
  }

  getGradoBadgePath(): string {
    const abrev =
      this.militar?.grado?.abreviatura || this.militar?.Grado?.abreviatura;
    if (!abrev) return "";
    let badge = String(abrev).toLowerCase().trim();
    if (badge === "1er tte") badge = "ptte";
    badge = badge.replace(/\//g, "").replace(/\./g, "").replace(/\s+/g, "");
    return `assets/img/ipsfa/grados/${badge}.webp`;
  }

  toggleFamiliar(index: number): void {
    if (this.expandedFamiliarIdx === index) {
      this.expandedFamiliarIdx = null;
    } else {
      this.expandedFamiliarIdx = index;
    }
  }

  @ViewChild("constanciaAfiliacion")
  constanciaPdf!: ConstanciaAfiliacionComponent;

  async generarConstanciaPDF(): Promise<void> {
    if (this.constanciaPdf) {
      this.isGeneratingPdf = true;
      try {
        await this.constanciaPdf.generarPDFConstancia();
      } catch (e) {
        console.error("Error al generar PDF:", e);
      } finally {
        this.isGeneratingPdf = false;
      }
    } else {
      console.warn("Componente de constancia de afiliación no disponible.");
    }
  }

  /**
   * Normaliza cualquier formato de fecha de MongoDB (Date, string, objeto $date) a formato ISO YYYY-MM-DD
   */
  private formatToISODate(mongoDate: any): string {
    if (!mongoDate) return "";
    try {
      let date: Date;
      if (typeof mongoDate === "string") {
        date = new Date(mongoDate);
      } else if (mongoDate.$date && typeof mongoDate.$date === "string") {
        date = new Date(mongoDate.$date);
      } else {
        date = new Date(mongoDate);
      }

      if (isNaN(date.getTime())) return "";

      // Añadir la zona horaria de Venezuela para evitar desfases de un día
      const offset = date.getTimezoneOffset();
      date.setMinutes(date.getMinutes() + offset);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  }
}
