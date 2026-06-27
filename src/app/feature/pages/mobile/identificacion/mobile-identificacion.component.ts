import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { ConstanciaAfiliacionComponent } from "../../afiliacion/identificacion/pdf/constancia-afiliacion.component";
import { AfiliadoService } from "src/app/core/services/afiliacion/afiliado.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { UtilService } from "src/app/core/services/util/util.service";
import { ApiService } from "src/app/core/services/api.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

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
  private utilService = inject(UtilService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private procesarDatosMilitar(): void {
    if (!this.militar) return;

    // Normalise Persona / DatoBasico (casing resilience)
    const pers = this.militar.persona || this.militar.Persona || {};
    const db = pers.datobasico || pers.DatoBasico || {};
    
    this.militarCedula = db.cedula || this.militar.cedula || this.militar.id || "N/A";
    
    const primerNombre = db.nombreprimero || db.nombrefirst || "";
    const primerApellido = db.apellidoprimero || db.apellidofirst || "";
    this.militarNombre = db.nombrecompleto || `${primerNombre} ${primerApellido}`.trim() || "Militar Titular";
    
    // Normalise Componente
    const comp = this.militar.componente || this.militar.Componente || {};
    this.militarComponente = comp.descripcion || comp.nombre || "N/A";
    
    // Normalise Grado
    const grad = this.militar.grado || this.militar.Grado || {};
    this.militarGrado = grad.descripcion || grad.nombre || "N/A";
    
    // Categoria & Clase
    this.militarCategoria = this.militar.categoria || "N/A";
    this.militarClase = this.militar.clase || "N/A";
    
    // Situacion & Dates
    this.militarSituacion = this.militar.situacion || "N/A";
    this.militarFingreso = this.militar.fingreso || "";
    this.militarFascenso = this.militar.fascenso || "";

    // Calculate times of service
    const fingreso = this.militar.fingreso || "";
    const fretiro = this.militar.fretiro || "";
    const situacion = this.militar.situacion || "";
    
    this.tiempoServicio = this.utilService.calcularTServicio(fingreso, fretiro, situacion);
    
    const tieneReconocido =
      this.militar.areconocido > 0 ||
      this.militar.mreconocido > 0 ||
      this.militar.dreconocido > 0;
      
    this.tiempoServicioTotal = tieneReconocido
      ? this.utilService.calcularTServicioTotal(
          fingreso,
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
      const fNombre1 = fdb.nombreprimero || fdb.nombrecompleto || fdb.nombrefirst || "";
      const fApellido1 = fdb.apellidoprimero || fdb.apellidofirst || "";
      const fnombres = `${fNombre1} ${fApellido1}`.trim() || f.nombre || "Familiar";
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
        estadoCivil: fdb.estadocivil === "S" ? "Soltero(a)" : fdb.estadocivil === "C" ? "Casado(a)" : fdb.estadocivil || "N/A",
        fotoUrl: ""
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

  loadFamiliarPhoto(militarCedula: string, familiarCedula: string, index: number): void {
    if (militarCedula && familiarCedula && familiarCedula !== "N/A" && familiarCedula !== "") {
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
        }
      });
    }
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
    const abrev = this.militar?.grado?.abreviatura || this.militar?.Grado?.abreviatura;
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

  @ViewChild("constanciaAfiliacion") constanciaPdf!: ConstanciaAfiliacionComponent;

  generarConstanciaPDF(): void {
    if (this.constanciaPdf) {
      this.constanciaPdf.generarPDFConstancia();
    } else {
      console.warn("Componente de constancia de afiliación no disponible.");
    }
  }
}
