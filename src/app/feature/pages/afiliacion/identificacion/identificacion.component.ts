import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  NgZone,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { AfiliadoService } from "src/app/core/services/afiliacion/afiliado.service";
import { IAfiliado } from "src/app/core/models/afiliacion/afiliado.model";
import { MdlFamiliarComponent } from "./mdl-familiar/mdl-familiar.component";
import { LoginService } from "src/app/core/services/login/login.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ComponenteService } from "src/app/core/services/componente/componente.service";
import { EstatusBeneficiarioService } from "src/app/core/services/estatus/estatus-beneficiario.service";
import { environment } from "src/environments/environment";
import { ApiService } from "src/app/core/services/api.service";
import { UtilService } from "src/app/core/services/util/util.service";

import * as pdfMake from "pdfmake/build/pdfmake";
const pdfFonts = require("pdfmake/build/vfs_fonts");
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

@Component({
  selector: "app-afi-identificacion",
  templateUrl: "./identificacion.component.html",
  styleUrls: ["./identificacion.component.scss"],
})
export class IdentificacionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public componentes: any[] = [];
  public grados: any[] = [];
  public estatusBeneficiarios: any[] = [];

  public identificacionForm: FormGroup;
  public familiares: any[] = []; // Lista para la tabla
  public familiarForm: FormGroup;
  public asignacionForm: FormGroup;
  public currentTab: string = "militar";
  public moneda: string = "Bs.";
  public fechaVencimientoTIM: string = "";
  public fotoAfiliadoBlobUrl: string = "";
  public isLoadingFoto: boolean = false;

  // Variables UX de Fotos
  public activeSlide: number = 0;
  public webcamActive: boolean = false;
  private stream: MediaStream | null = null;
  @ViewChild("modalWebcam") modalWebcam: any;

  // Var to control the pastel printing dropdown menu visibility
  public showPrintDropdown: boolean = false;

  public selectedMotivoEmision: string = "";
  public selectedNomina: string = "";

  // Add Family Member Modal Data
  public selectedNacionalidadFamiliar: string = "";
  public cedulaFamiliar: string = "";
  public selectedParentescoFamiliar: string = "";

  // Historial Movimientos Data
  public tipoMovimientoFiltro: string = "";
  public movimientosOriginales: any[] = [];
  public movimientosFiltrados: any[] = [];
  public movimientosPaginados: any[] = [];
  public paginaActual: number = 1;
  public itemsPorPagina: number = 5;
  public totalMovimientos: number = 0;
  public totalPaginas: number = 0;

  // Historial Sueldos Data
  public sueldosOriginales: any[] = [];
  public sueldosPaginados: any[] = [];
  public paginaSueldoActual: number = 1;
  public sueldosPorPagina: number = 5;
  public totalSueldos: number = 0;
  public totalPaginasSueldo: number = 0;

  // Bancos Data
  public get bancos(): any[] {
    return this.utilService.bancos;
  }
  public bancoSeleccionado: any = null;
  public cuentasBancarias: any[] = [];
  private port: MessagePort | null = null;
  public trackId: string = "";
  public id: string = "";
  public tiempoServicio: string = "";
  public tiempoServicioTotal: string = "";

  public isBunkerSync: boolean = false;
  public observaciones: FormControl<any> = new FormControl("");
  public calculosBunker: any = null;

  constructor(
    private layoutService: LayoutService,
    private fb: FormBuilder,
    private afiliadoService: AfiliadoService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private loginService: LoginService,
    private utilService: UtilService,
    private apiService: ApiService,
    private zone: NgZone,
    private componenteService: ComponenteService,
    private estatusBeneficiarioService: EstatusBeneficiarioService,
  ) {
    // console.log(sessionStorage.getItem("menu"));
    this.trackId = this.utilService.GenerarId();
  }

  ngOnInit(): void {
    this.initForms();

    this.layoutService.triggerScrollToTop();

    this.layoutService.toggleCards(false);
    this.layoutService.updateHeader({
      title: "Principal / Afiliación: Identificación Militar",
      showBackButton: true,
      alertSeverity: 2,
      showAlertsIcon: false,
    });

    this.componentes = this.componenteService.dataComponente.map((c) => ({
      abreviatura: c.codigo,
      nombre: c.nombre,
    }));

    this.identificacionForm
      .get("componente")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.onComponenteChange(val);
      });

    this.estatusBeneficiarios =
      this.estatusBeneficiarioService.estatusBeneficiarios;

    this.afiliadoService.afiliado$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data) {
          let afiliadoData = data;
          if (Array.isArray(data) && data.length > 0) {
            afiliadoData = data[0];
          } else if (Array.isArray(data) && data.length === 0) {
            return;
          }

          // console.log('Datos Crudos Normalizados:', afiliadoData);
          const parsedData = this.parseData(afiliadoData);
          // console.log('Datos Procesados (ready to patch):', parsedData);

          // Calcular Tiempo de Servicio
          this.tiempoServicio = this.utilService.calcularTServicio(
            parsedData.fingreso,
            parsedData.fretiro,
            parsedData.situacion,
          );
          // Calcular Tiempo Total solo si hay tiempo reconocido
          const tieneReconocido =
            parsedData.areconocido > 0 ||
            parsedData.mreconocido > 0 ||
            parsedData.dreconocido > 0;
          this.tiempoServicioTotal = tieneReconocido
            ? this.utilService.calcularTServicioTotal(
                parsedData.fingreso,
                parsedData.areconocido,
                parsedData.mreconocido,
                parsedData.dreconocido,
              )
            : "";

          // Mapear Vencimiento TIM
          this.fechaVencimientoTIM = this.formatDate(
            afiliadoData.tim?.fechavencimiento,
          );

          // Procesar Familiares
          this.familiares = this.processFamiliares(afiliadoData.familiar);

          // Calcular hijos para el input si no venía explicitamente en la data
          if (parsedData.numerohijos === 0 || !parsedData.numerohijos) {
            const cantHijos = this.familiares.filter(
              (f) => f.parentesco === "HIJO" || f.parentesco === "HIJA",
            ).length;
            parsedData.numerohijos = cantHijos;
          }

          if (this.identificacionForm) {
            try {
              // 1. Patch Root Fields
              [
                "categoria",
                "situacion",
                "clase",
                "fingreso",
                "fascenso",
                "fretiro",
                "nresuelto",
                "posicion",
                "componente",
                "grado",
                "numerohijos",
                "areconocido",
                "mreconocido",
                "dreconocido",
                "pprof",
              ].forEach((key) => {
                if (parsedData[key] !== undefined) {
                  this.identificacionForm.get(key)?.setValue(parsedData[key]);
                }
              });

              // 2. Patch Nested Persona Fields
              if (parsedData.persona) {
                const personaGroup = this.identificacionForm.get(
                  "persona",
                ) as FormGroup;
                Object.keys(parsedData.persona).forEach((pKey) => {
                  // Patch nested groups one by one
                  const nestedControl = personaGroup.get(pKey);
                  if (nestedControl && parsedData.persona[pKey]) {
                    nestedControl.patchValue(parsedData.persona[pKey]);
                  }
                });
              }

              this.cdr.detectChanges();
            } catch (e) {
              console.error("Error parcheando formulario:", e);
            }
          }

          let f_retiro = this.formatDate(afiliadoData.fretiro);
          console.log("Fecha de retiro:", f_retiro);

          this.getPhotoId();
          this.getDirectivaID();
          //   console.log("Iniciando metodo de carga");
          this.initMessagePort();
        }
      });
  }

  public onComponenteChange(compAbreviatura: string) {
    if (!compAbreviatura) {
      this.grados = [];
      return;
    }
    const originalComp = this.componenteService.dataComponente.find(
      (c) => c.codigo === compAbreviatura,
    );
    if (originalComp && originalComp.Grado) {
      this.grados = originalComp.Grado.map((g) => ({
        abreviatura: g.codigo,
        nombre: g.descripcion || g.nombre,
      }));
    } else {
      this.grados = [];
    }
  }

  @HostListener("document:click", ["$event"])
  closePrintDropdown(event: MouseEvent) {
    // Find if target is the print dropdown button
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest("#printDocsDropdown")) {
      this.showPrintDropdown = false;
    }
  }

  private processFamiliares(list: any[]): any[] {
    if (!list || !Array.isArray(list)) return [];
    return list.map((f) => {
      const db = f.persona?.datobasico;

      // Robust check accounting for "true"/"false" strings, booleans, and 1/0 numbers
      const isMilitar =
        f.esmilitar === true ||
        String(f.esmilitar).toLowerCase() === "true" ||
        f.esmilitar === 1;
      const isBeneficioFalse =
        f.beneficio === false ||
        String(f.beneficio).toLowerCase() === "false" ||
        f.beneficio === 0;

      return {
        parentesco: this.utilService.resolvParentesco(f.parentesco, db?.sexo),
        cedula: db?.cedula ? `${db.nacionalidad || "V"}-${db.cedula}` : "S/C",
        nombres: (this.unirNombres(db) + " " + this.unirApellidos(db)).trim(),
        fechanacimiento: this.formatDate(db?.fechanacimiento),
        // "esmilitar" y "beneficio" son directos del objeto familiar (f), no de persona/datobasico
        esMilitar: isMilitar,
        inactivo: isBeneficioFalse,
        original: f,
      };
    });
  }

  openFamiliarModal(familiar?: any) {
    const modalRef = this.modalService.open(MdlFamiliarComponent, {
      size: "xl",
      centered: true,
    });
    if (familiar && familiar.original) {
      modalRef.componentInstance.familiar = familiar.original;
    } else if (familiar) {
      modalRef.componentInstance.familiar = familiar;
    }

    modalRef.result
      .then((result) => {
        if (result) {
          console.log("Familiar guardado (Mock):", result);
        }
      })
      .catch(() => {});
  }

  private parseData(data: any): any {
    return {
      categoria: data.categoria || "EFE",
      situacion: data.situacion || "ACT",
      clase: data.clase || "OFI",
      fingreso: this.formatDate(data.fingreso),
      fascenso: this.formatDate(data.fascenso),
      fretiro: this.formatDate(data.fretiro),
      nresuelto: data.nresuelto || "",
      posicion: data.posicion || "",
      componente: data.componente?.abreviatura || "",
      grado: data.grado?.abreviatura || "",
      numerohijos: data.numerohijos || data.nhijo || 0,
      areconocido: data.areconocido || 0,
      mreconocido: data.mreconocido || 0,
      dreconocido: data.dreconocido || 0,
      pprof: data.pprof || 0,

      persona: {
        datobasico: {
          cedula: data.persona?.datobasico?.cedula || "",
          nombres: this.unirNombres(data.persona?.datobasico),
          apellidos: this.unirApellidos(data.persona?.datobasico),
          fechanacimiento: this.formatDate(
            data.persona?.datobasico?.fechanacimiento,
          ),
          sexo: data.persona?.datobasico?.sexo || "",
          estadocivil: data.persona?.datobasico?.estadocivil || "",
          condicionmilitar: data.persona?.datobasico?.condicionmilitar || "",
          estatus: data.persona?.datobasico?.estatus || "",
        },
        correo: {
          principal: data.persona?.correo?.principal || "",
        },
        telefono: {
          movil: data.persona?.telefono?.movil || "",
        },
        redsocial: {
          twitter: data.persona?.redsocial?.twitter || "",
          facebook: data.persona?.redsocial?.facebook || "",
          instagram: data.persona?.redsocial?.instagram || "",
        },
        datofisico: {
          peso: data.persona?.datofisico?.peso || "",
          talla: data.persona?.datofisico?.talla || "",
        },
        datofisionomico: {
          gruposanguineo: data.persona?.datofisionomico?.gruposanguineo || "",
          colorpiel: data.persona?.datofisionomico?.colorpiel || "",
          colorojos: data.persona?.datofisionomico?.colorojos || "",
          colorcabello: data.persona?.datofisionomico?.colorcabello || "",
        },
        direccion: this.extractFirst(data.persona?.direccion, {
          calleavenida: "",
          casa: "",
          apartamento: "",
          estado: "",
          ciudad: "",
          municipio: "",
        }),
        datofinanciero: this.extractFirst(data.persona?.datofinanciero, {
          institucion: "",
          tipo: "CA",
          cuenta: "",
        }),
      },
    };
  }

  private extractFirst(arr: any, defaultObj: any): any {
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
    return defaultObj;
  }

  private unirNombres(db: any): string {
    if (!db) return "";
    return [db.nombreprimero, db.nombresegundo].filter(Boolean).join(" ");
  }

  private unirApellidos(db: any): string {
    if (!db) return "";
    return [db.apellidoprimero, db.apellidosegundo].filter(Boolean).join(" ");
  }

  private formatDate(mongoDate: any): string {
    if (!mongoDate) return "";

    // Si es la fecha nula/por defecto de retiro "0000-12-31", devolver en blanco
    if (typeof mongoDate === "string") {
      if (mongoDate.includes("0000-12-31") || mongoDate.startsWith("0000")) {
        return "";
      }
    } else if (mongoDate.$date && typeof mongoDate.$date === "string") {
      if (
        mongoDate.$date.includes("0000-12-31") ||
        mongoDate.$date.startsWith("0000")
      ) {
        return "";
      }
    }

    let d: Date | null = null;

    if (mongoDate instanceof Date) {
      d = mongoDate;
    } else if (typeof mongoDate === "string") {
      d = new Date(mongoDate);
    } else if (mongoDate && typeof mongoDate === "object") {
      if (mongoDate.$date) {
        if (typeof mongoDate.$date === "string") {
          d = new Date(mongoDate.$date);
        } else if (typeof mongoDate.$date === "number") {
          d = new Date(mongoDate.$date);
        } else if (mongoDate.$date.$numberLong) {
          d = new Date(parseInt(mongoDate.$date.$numberLong, 10));
        }
      }
    }

    if (!d || isNaN(d.getTime())) return "";

    const formatted = d.toISOString().split("T")[0];
    if (formatted.startsWith("0000") || formatted === "0000-12-31") {
      return "";
    }
    return formatted;
  }

  private initForms() {
    this.identificacionForm = this.fb.group({
      // --- RAÍZ (Afiliado) ---
      categoria: ["EFE", Validators.required],
      situacion: ["ACT", Validators.required],
      clase: ["OFI", Validators.required],
      fingreso: ["", Validators.required],
      fascenso: ["", Validators.required],
      fretiro: [""],
      nresuelto: [""],
      posicion: [""],
      componente: ["", Validators.required],
      grado: ["", Validators.required],
      numerohijos: [""],
      areconocido: [""],
      mreconocido: [""],
      dreconocido: [""],
      pprof: [""],

      // --- PERSONA ---
      persona: this.fb.group({
        // Dato Básico
        datobasico: this.fb.group({
          cedula: ["", Validators.required],
          nombres: ["", Validators.required],
          apellidos: ["", Validators.required],
          fechanacimiento: ["", Validators.required],
          sexo: ["", Validators.required],
          estadocivil: ["", Validators.required],
          condicionmilitar: [""],
          estatus: [""],
        }),

        // Contacto
        correo: this.fb.group({
          principal: ["", [Validators.email]],
        }),
        telefono: this.fb.group({
          movil: [""],
        }),
        redsocial: this.fb.group({
          twitter: [""],
          facebook: [""],
          instagram: [""],
        }),

        // Físico / Fisionómico
        datofisico: this.fb.group({
          peso: [""],
          talla: [""],
        }),
        datofisionomico: this.fb.group({
          gruposanguineo: [""],
          colorpiel: [""],
          colorojos: [""],
          colorcabello: [""],
        }),

        // Direccion
        direccion: this.fb.group({
          estado: [""],
          ciudad: [""],
          municipio: [""],
          calleavenida: ["", Validators.required],
          casa: [""],
          apartamento: [""],
        }),

        // Financiero
        datofinanciero: this.fb.group({
          institucion: [""],
          tipo: ["CA"],
          cuenta: [""],
        }),
      }),
    });

    this.familiarForm = this.fb.group({
      cedula: ["", Validators.required],
      nombres: ["", Validators.required],
      parentesco: ["", Validators.required],
      fecha_nacimiento: ["", Validators.required],
    });

    this.asignacionForm = this.fb.group({
      comisionServicio: ["", [Validators.required, Validators.min(0)]],
      montoRecuperado: ["", [Validators.required, Validators.min(0)]],
      fecha: ["", Validators.required],
      descripcion: ["", Validators.required],
    });

    // Listener para formateo de cuenta bancaria y detección de banco
    const cuentaControl = this.identificacionForm.get(
      "persona.datofinanciero.cuenta",
    );
    cuentaControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val) {
          const clean = val.replace(/\D/g, "").substring(0, 20);
          const formatted = this.applyMask(clean);
          if (val !== formatted) {
            cuentaControl.setValue(formatted, { emitEvent: false });
          }

          // Detectar banco
          if (clean.length >= 4) {
            const bCode = clean.substring(0, 4);
            this.detectarBanco(bCode);
          } else {
            this.bancoSeleccionado = null;
          }
        } else {
          this.bancoSeleccionado = null;
        }
      });
  }

  public agregarCuenta() {
    const form = this.identificacionForm.get("persona.datofinanciero");
    if (form && form.get("cuenta")?.value && form.get("institucion")?.value) {
      const nuevaCuenta = {
        institucion: form.get("institucion")?.value,
        nombreInstitucion: this.bancoSeleccionado?.name || "OTRA",
        tipo: form.get("tipo")?.value,
        cuenta: form.get("cuenta")?.value,
        color: this.bancoSeleccionado?.color || "#64748b",
        archivo: null,
      };
      this.cuentasBancarias.push(nuevaCuenta);

      // Limpiar campos para nueva entrada
      form.get("cuenta")?.setValue("");
      form.get("institucion")?.setValue("");
      this.bancoSeleccionado = null;
    }
  }

  public eliminarCuenta(index: number) {
    this.cuentasBancarias.splice(index, 1);
  }

  public adjuntarCertificado(index: number) {
    // Simulación de adjuntar archivo
    console.log(
      "Adjuntando certificado para la cuenta:",
      this.cuentasBancarias[index].cuenta,
    );
    this.cuentasBancarias[index].archivo = "Certificado_Bancario.pdf";
  }

  private applyMask(val: string): string {
    if (!val) return "";
    let res = "";
    for (let i = 0; i < val.length; i++) {
      if (i === 4 || i === 8 || i === 10) res += "-";
      res += val[i];
    }
    return res;
  }

  private detectarBanco(code: string) {
    const banco = this.bancos.find((b) => b.code === code);
    if (banco) {
      this.bancoSeleccionado = banco;
      this.identificacionForm
        .get("persona.datofinanciero.institucion")
        ?.setValue(code, { emitEvent: false });
    } else {
      this.bancoSeleccionado = {
        code,
        name: "OTRA INSTITUCIÓN",
        color: "#64748b",
      };
      this.identificacionForm
        .get("persona.datofinanciero.institucion")
        ?.setValue("", { emitEvent: false });
    }
  }

  switchTab(tab: string) {
    this.currentTab = tab;
  }

  guardarAfiliado() {
    if (this.identificacionForm.valid) {
      console.log(
        "Datos del Afiliado (Modelo IAfiliado):",
        this.identificacionForm.value,
      );
      // Lógica para guardar
    } else {
      console.error("Formulario inválido");
      this.identificacionForm.markAllAsTouched();
    }
  }

  imprimirDocumento(tipo: string, event: Event) {
    event.preventDefault();
    console.log("Generar documento:", tipo);

    const cedula = this.identificacionForm?.get(
      "persona.datobasico.cedula",
    )?.value;

    if (tipo === "historial_movimientos") {
      // Abrir historial de movimientos en nueva pestaña
      if (cedula) {
        const url = `https://app.ipsfa.gob.ve/sssifanb/reportes/movimientos/${cedula}`;
        window.open(url, "_blank");
      }
      return;
    }

    if (tipo === "hoja_vida") {
      this.generarPDFHojaDeVida();
      return;
    }
  }

  async generarPDFHojaDeVida() {
    let responsableStr = "NO IDENTIFICADO";
    const tokenStr = sessionStorage.getItem("token");
    if (tokenStr) {
      try {
        const payload = JSON.parse(atob(tokenStr.split(".")[1]));
        responsableStr =
          payload?.Usuario?.correo || payload?.Usuario?.usuario || "SISTEMA";
      } catch (e) {}
    }

    const cedula =
      this.identificacionForm?.get("persona.datobasico.cedula")?.value || "";

    // Obtenemos los valores desde identificacionForm y calculosBunker
    const componenteStr =
      this.identificacionForm?.get("componente")?.value || "";
    const gradoStr = this.identificacionForm?.get("grado")?.value || "";

    // Convertir abreviaturas a nombres completos
    const compObj = this.componentes.find(
      (c) => c.abreviatura === componenteStr,
    );
    const gradoObj = this.grados.find((g) => g.abreviatura === gradoStr);
    const componenteFull = compObj ? compObj.nombre : componenteStr;
    const gradoFull = gradoObj ? gradoObj.nombre : gradoStr;

    // Bunker data
    const bunker = this.calculosBunker || {};
    const base = bunker.base || {};
    const calculos = base.calculos || {};
    const movimientos = bunker.movimientos || {};

    // Obtener nombres directamente de Bunker para evitar errores asíncronos del formulario
    const nombres = bunker.nombres || "";
    const apellidos = bunker.apellidos || "";
    const nombreCompleto =
      `${nombres} ${apellidos}`.trim().toUpperCase() || "NO DISPONIBLE";

    const numeroCuenta = bunker.numero_cuenta || "NO ASIGNADA";
    const estatus = bunker.estatus || "ACTIVO";
    const sexo =
      bunker.sexo === "M"
        ? "MASCULINO"
        : bunker.sexo === "F"
          ? "FEMENINO"
          : bunker.sexo || "N/D";
    const hijos =
      this.identificacionForm?.get("numerohijos")?.value || base.hijos || 0;
    const pprof = this.identificacionForm?.get("pprof")?.value || 0;
    const arec = this.identificacionForm?.get("areconocido")?.value || 0;
    const mrec = this.identificacionForm?.get("mreconocido")?.value || 0;
    const drec = this.identificacionForm?.get("dreconocido")?.value || 0;

    const fechaIngreso = bunker.f_ingreso_sistema
      ? new Date(bunker.f_ingreso_sistema).toLocaleDateString("es-VE")
      : "N/D";
    const fechaRetiro = bunker.f_retiro
      ? new Date(bunker.f_retiro).toLocaleDateString("es-VE")
      : "N/D";
    const ultAscenso = bunker.f_ult_ascenso
      ? new Date(bunker.f_ult_ascenso).toLocaleDateString("es-VE")
      : "N/D";

    const formatter = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmt = (val: any) => formatter.format(Number(val) || 0);

    // Convertir el logo WebP a PNG base64 y dibujarlo sobre un CÍRCULO BLANCO
    const logoBase64 = await new Promise<string>((resolve) => {
      const img = new Image();
      img.src = "./assets/img/ipsfa/logo.webp";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const padding = 15;
        // Hacer el canvas cuadrado asegurando que el círculo quede simétrico
        const size = Math.max(img.width, img.height) + padding * 2;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Dibujar el fondo circular blanco con borde verde pastel
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2, true);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#A7F3D0";
          ctx.stroke();

          // Centrar la imagen dentro del círculo
          const x = (size - img.width) / 2;
          const y = (size - img.height) / 2;
          ctx.drawImage(img, x, y);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    });

    // Cargar también el escudo para usarlo como marca de agua
    const escudoBase64 = await new Promise<string>((resolve) => {
      const img = new Image();
      img.src = "./assets/img/ipsfa/ipsfa-imagen.webp";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    });

    const docDefinition: any = {
      pageSize: "LEGAL",
      pageMargins: [40, 120, 40, 40],
      header: function (currentPage: number, pageCount: number) {
        return {
          margin: [40, 20, 40, 0],
          columns: [
            ...(logoBase64
              ? [
                  {
                    width: 70,
                    image: "logo",
                    fit: [60, 60],
                    alignment: "left",
                    margin: [0, 0, 10, 0],
                  },
                ]
              : []),
            {
              width: "*",
              text: "MINISTERIO DEL PODER POPULAR PARA LA DEFENSA\nVICEMINISTERIO DE SERVICIOS, PERSONAL Y LOGÍSTICA\nDIRECCIÓN GENERAL DE EMPRESAS\nINSTITUTO DE PREVISIÓN SOCIAL DE LA FUERZA ARMADA NACIONAL BOLIVARIANA\nSISTEMA DE SEGURIDAD SOCIAL INTEGRAL DE LA FANB",
              fontSize: 7,
              bold: true,
              color: "#475569",
              alignment: "left",
              lineHeight: 1.2,
              margin: [0, 5, 0, 0],
            },
            {
              width: 80,
              stack: [
                {
                  canvas: [
                    {
                      type: "rect",
                      x: 0,
                      y: 0,
                      w: 80,
                      h: 80,
                      r: 4,
                      lineColor: "#CBD5E1",
                      lineWidth: 1,
                    },
                  ],
                },
                {
                  text: "ESPACIO QR",
                  alignment: "center",
                  fontSize: 7,
                  color: "#94A3B8",
                  margin: [0, -45, 0, 0],
                },
              ],
            },
          ],
        };
      },
      footer: function (currentPage: number, pageCount: number) {
        return {
          margin: [40, 10, 40, 0],
          columns: [
            {
              text: `Generado por: ${responsableStr}`,
              fontSize: 8,
              color: "#94A3B8",
            },
            {
              text: `Fecha y Hora: ${new Date().toLocaleString("es-VE")}`,
              fontSize: 8,
              color: "#94A3B8",
              alignment: "right",
            },
          ],
        };
      },
      watermark: {
        text: "IPSFANB - PACE",
        color: "#94A3B8",
        opacity: 0.1,
        bold: true,
      },
      images: {
        ...(logoBase64 ? { logo: logoBase64 } : {}),
        ...(escudoBase64 ? { escudo: escudoBase64 } : {}),
      },
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.2,
        color: "#334155",
      },
      styles: {
        cardTitle: {
          fontSize: 13,
          bold: true,
          color: "#0F766E",
          margin: [0, 15, 0, 8],
          characterSpacing: 0.5,
        },
        label: {
          bold: true,
          color: "#64748B",
          fontSize: 8,
          characterSpacing: 0.2,
        },
        value: {
          bold: true,
          color: "#0F172A",
          fontSize: 11,
          margin: [0, 0, 0, 6],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: "#0F766E",
          fillColor: "#F8FAFC",
          margin: [5, 7, 5, 7],
        },
        tableCell: { margin: [5, 7, 5, 7] },
        amount: { alignment: "right", bold: true },
        bigAmountLabel: {
          fontSize: 11,
          bold: true,
          color: "#64748B",
          alignment: "right",
          characterSpacing: 0.3,
        },
        bigAmountValue: {
          fontSize: 16,
          bold: true,
          color: "#0F766E",
          alignment: "right",
        },
      },
      content: [
        // TARJETA 1: PERFIL DEL AFILIADO
        { text: "DATOS BÁSICOS DEL AFILIADO", style: "cardTitle" },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#E2E8F0",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              width: "40%",
              stack: [
                { text: "NOMBRE COMPLETO", style: "label" },
                { text: nombreCompleto, style: "value", fontSize: 10 },
                { text: "CÉDULA DE IDENTIDAD", style: "label" },
                { text: `V-${cedula}`, style: "value" },
                { text: "NÚMERO DE CUENTA (DEPÓSITO)", style: "label" },
                { text: numeroCuenta, style: "value" },
              ],
            },
            {
              width: "30%",
              stack: [
                { text: "COMPONENTE", style: "label" },
                { text: componenteFull || "N/D", style: "value" },
                { text: "GRADO", style: "label" },
                { text: gradoFull || "N/D", style: "value" },
                { text: "TIEMPO DE SERVICIO", style: "label" },
                { text: `${base.antiguedad || 0} Años`, style: "value" },
              ],
            },
            {
              width: "30%",
              stack: [
                { text: "ESTATUS", style: "label" },
                {
                  text: estatus,
                  style: "value",
                  color: estatus === "ACTIVO" ? "#059669" : "#DC2626",
                },
                { text: "FECHA INGRESO", style: "label" },
                { text: fechaIngreso, style: "value" },
                { text: "FECHA RETIRO", style: "label" },
                { text: fechaRetiro, style: "value" },
              ],
            },
          ],
        },

        // TARJETA 1.5: INFORMACION COMPLEMENTARIA
        {
          text: "INFORMACIÓN ADICIONAL Y TIEMPOS RECONOCIDOS",
          style: "cardTitle",
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 532,
              y2: 0,
              lineWidth: 1,
              lineColor: "#E2E8F0",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              width: "33%",
              stack: [
                { text: "SEXO", style: "label" },
                { text: sexo, style: "value" },
                { text: "NÚMERO DE HIJOS", style: "label" },
                { text: `${hijos}`, style: "value" },
              ],
            },
            {
              width: "33%",
              stack: [
                { text: "FECHA ÚLTIMO ASCENSO", style: "label" },
                { text: ultAscenso, style: "value" },
                { text: "ST. PROFESIÓN / PRODUCTIVIDAD", style: "label" },
                { text: `${pprof}%`, style: "value" },
              ],
            },
            {
              width: "34%",
              stack: [
                { text: "AÑOS RECONOCIDOS", style: "label" },
                { text: `${arec} Años`, style: "value" },
                { text: "MESES Y DÍAS RECONOCIDOS", style: "label" },
                { text: `${mrec} Meses / ${drec} Días`, style: "value" },
              ],
            },
          ],
        },

        // TARJETA 2: DESGLOSE SALARIAL
        { text: "DESGLOSE SALARIAL Y PRIMAS", style: "cardTitle" },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#E2E8F0",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            // Izquierda: Sueldos
            {
              width: "45%",
              table: {
                widths: ["*", "auto"],
                body: [
                  [
                    { text: "Sueldo Básico", style: "tableCell" },
                    {
                      text: `Bs. ${fmt(base.sueldo_base)}`,
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Sueldo Mensual", style: "tableCell" },
                    {
                      text: `Bs. ${fmt(base.sueldo_mensual)}`,
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    {
                      text: "Sueldo Integral",
                      style: "tableHeader",
                      color: "#FFFFFF",
                      fillColor: "#0F766E",
                    },
                    {
                      text: `Bs. ${fmt(base.sueldo_integral)}`,
                      style: ["tableHeader", "amount"],
                      color: "#FFFFFF",
                      fillColor: "#0F766E",
                    },
                  ],
                ],
              },
              layout: "lightHorizontalLines",
            },
            { width: "5%", text: "" }, // Spacer
            // Derecha: Primas
            {
              width: "50%",
              table: {
                widths: ["*", "auto"],
                body: [
                  // [{ text: 'Compensación Especial', style: 'tableCell' }, { text: fmt(calculos.prima_compensacion_especial), style: ['tableCell', 'amount'] }],
                  [
                    { text: "Tiempo de Servicio", style: "tableCell" },
                    {
                      text: fmt(calculos.prima_tiemposervicio),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Profesionalización", style: "tableCell" },
                    {
                      text: fmt(calculos.prima_profesionalizacion),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Descendencia", style: "tableCell" },
                    {
                      text: fmt(calculos.prima_descendencia),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  // [{ text: 'Estabilidad', style: 'tableCell' }, { text: fmt(calculos.prima_especial), style: ['tableCell', 'amount'] }],
                  [
                    { text: "Alicuota Bono Vacacional", style: "tableCell" },
                    {
                      text: fmt(base.vacaciones),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Alicuota Bono Fin de Año", style: "tableCell" },
                    {
                      text: fmt(base.aguinaldos || calculos.aguinaldos),
                      style: ["tableCell", "amount"],
                    },
                  ],
                ],
              },
              layout: "lightHorizontalLines",
            },
          ],
        },

        // TARJETA 3: HABERES Y FIDEICOMISO
        {
          text: "ESTADO DE HABERES Y ASIGNACIÓN DE ANTIGÜEDAD",
          style: "cardTitle",
          margin: [0, 20, 0, 8],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#E2E8F0",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              width: "60%",
              table: {
                widths: ["60%", "40%"],
                body: [
                  [
                    { text: "Asignación de Antigüedad", style: "tableCell" },
                    {
                      text: fmt(movimientos.calculo_aa),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Días Adicionales", style: "tableCell" },
                    {
                      text: fmt(movimientos.dias_adicionales),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Diferencia de A.A.", style: "tableCell" },
                    {
                      text: fmt(movimientos.finiquito_diferencia_aa),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    { text: "Garantías", style: "tableCell" },
                    {
                      text: fmt(movimientos.deposito_de_garantias),
                      style: ["tableCell", "amount"],
                    },
                  ],
                  [
                    {
                      text: "Anticipos Solicitados",
                      style: "tableCell",
                      color: "#DC2626",
                    },
                    {
                      text: `- ${fmt(movimientos.anticipo)}`,
                      style: ["tableCell", "amount"],
                      color: "#DC2626",
                    },
                  ],
                  [
                    {
                      text: "Embargos Ejecutados",
                      style: "tableCell",
                      color: "#DC2626",
                    },
                    {
                      text: `- ${fmt(movimientos.embargo)}`,
                      style: ["tableCell", "amount"],
                      color: "#DC2626",
                    },
                  ],
                ],
              },
              layout: "lightHorizontalLines",
            },
            { width: "5%", text: "" },
            {
              width: "35%",
              stack: [
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          fillColor: "#F0FDF4", // Light Green
                          margin: [10, 15, 10, 15],
                          border: [true, true, true, true],
                          borderColor: [
                            "#22C55E",
                            "#22C55E",
                            "#22C55E",
                            "#22C55E",
                          ],
                          stack: [
                            {
                              text: "SALDO DISPONIBLE",
                              style: "bigAmountLabel",
                            },
                            {
                              text: `Bs. ${fmt(bunker.neto)}`,
                              style: "bigAmountValue",
                            },
                            {
                              text: `Aportado al Fideicomiso: ${fmt(bunker.porcentaje)}%`,
                              alignment: "right",
                              fontSize: 8,
                              color: "#64748B",
                              margin: [0, 5, 0, 0],
                            },
                          ],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#22C55E",
                    vLineColor: () => "#22C55E",
                  },
                },
                {
                  text: "Capital en Banco",
                  style: "label",
                  margin: [0, 15, 0, 2],
                },
                {
                  text: `Bs. ${fmt(movimientos.finiquito_capital_banco)}`,
                  style: "value",
                },
                {
                  text: "Total Depositado",
                  style: "label",
                  margin: [0, 5, 0, 2],
                },
                { text: `Bs. ${fmt(movimientos.deposito_aa)}`, style: "value" },
              ],
            },
          ],
        },

        // HISTORICO DE ANTICIPOS (EN SEGUNDA PÁGINA)
        {
          text: "HISTÓRICO DE MOVIMIENTOS",
          style: "cardTitle",
          margin: [0, 20, 0, 8],
          pageBreak: "before",
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 532,
              y2: 0,
              lineWidth: 1,
              lineColor: "#E2E8F0",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["50%", "50%"],
            body: [
              [
                { text: "FECHA DEL MOVIMIENTO", style: "tableHeader" },
                {
                  text: "MONTO (Bs.)",
                  style: "tableHeader",
                  alignment: "right",
                },
              ],
              [
                {
                  text: movimientos.ultima_modificacion
                    ? new Date(
                        movimientos.ultima_modificacion,
                      ).toLocaleDateString("es-VE")
                    : "Registro Inicial",
                  style: "tableCell",
                },
                {
                  text: fmt(movimientos.anticipo),
                  style: ["tableCell", "amount"],
                },
              ],
            ],
          },
          layout: "lightHorizontalLines",
        },

        // FIRMAS
        {
          columns: [
            {
              text: "_________________________________\nCARLOS CONTRERAS MENESES\nTCNEL.\nJEFE DEL DPTO. DE FIDEICOMISO",
              alignment: "center",
              bold: true,
              fontSize: 8,
              color: "#475569",
            },
            {
              text: "_________________________________\nJOSÉ TRINIDAD DORANTE\nTCNEL.\nGERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
              alignment: "center",
              bold: true,
              fontSize: 8,
              color: "#475569",
            },
          ],
          margin: [0, 60, 0, 0],
        },
      ],
    };

    pdfMake
      .createPdf(docDefinition)
      .getBase64()
      .then((base64Data: string) => {
        const dataUri = `data:application/pdf;base64,${base64Data}`;

        if (window.parent && window !== window.parent) {
          window.parent.postMessage(
            {
              type: "OPEN_PDF",
              payload: {
                fileName: `Hoja_Vida_${cedula}.pdf`,
                data: dataUri,
              },
            },
            "*",
          );
        } else {
          pdfMake.createPdf(docDefinition).open();
        }
      });
  }

  guardarFamiliar() {
    if (this.familiarForm.valid) {
      console.log("Datos del Familiar:", this.familiarForm.value);
      // Lógica para agregar a la tabla
      this.familiarForm.reset();
    }
  }

  getGradoBadgePath(): string {
    const gradoStr = this.identificacionForm?.get("grado")?.value;
    if (!gradoStr) return "";
    let badge = String(gradoStr).toLowerCase().trim();

    // Reglas de negocio para normalizar grados a nombres de archivo
    if (badge === "1er tte") badge = "ptte";
    badge = badge.replace(/\//g, "").replace(/\./g, "").replace(/\s+/g, "");

    return `assets/img/ipsfa/grados/${badge}.webp`;
  }

  getFotoUrl(): string {
    if (this.fotoAfiliadoBlobUrl) {
      return this.fotoAfiliadoBlobUrl;
    }
    return ""; // Retorna vacío para que el HTML muestre el ícono de FontAwesome
  }

  ngOnDestroy(): void {
    this.layoutService.toggleCards(true);
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModalEmitirTIM(content: any) {
    this.selectedMotivoEmision = "";
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  emitirTIM(modal: any) {
    if (!this.selectedMotivoEmision) {
      return;
    }
    console.log("Emitiendo TIM con motivo:", this.selectedMotivoEmision);
    modal.close();
  }

  openModalConfirmarGuardar(content: any) {
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  confirmarGuardado(modal: any) {
    console.log("Guardando cambios del afiliado...");
    // Aquí se llamaría al método que realmente envía el formulario
    // this.onSubmit();
    modal.close();
  }

  openModalConsultarNetos(content: any) {
    this.selectedNomina = "";
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  generarNeto(modal: any) {
    if (!this.selectedNomina) return;
    console.log("Generando Neto para la nómina:", this.selectedNomina);
    // Lógica de impresión/generación PDF
    modal.close();
  }

  openModalAgregarFamiliar(content: any) {
    this.selectedNacionalidadFamiliar = "";
    this.cedulaFamiliar = "";
    this.selectedParentescoFamiliar = "";
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  continuarRegistroFamiliar(modal: any) {
    if (
      !this.selectedNacionalidadFamiliar ||
      !this.cedulaFamiliar ||
      !this.selectedParentescoFamiliar
    )
      return;

    console.log("Iniciando registro de familiar:", {
      nacionalidad: this.selectedNacionalidadFamiliar,
      cedula: this.cedulaFamiliar,
      parentesco: this.selectedParentescoFamiliar,
    });

    // Aquí se procedería a abrir el modal de detalles (MdlFamiliarComponent)
    // o a cargar la data inicial para el registro completo.
    modal.close();
  }

  // Modal Historial de Movimientos
  openModalZoomFoto(content: any) {
    this.modalService.open(content, {
      centered: true,
      size: "xl",
      backdrop: "static",
      windowClass: "zoom-modal-window",
    });
  }

  openModalActualizarFoto(content: any) {
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  seleccionarOpcionFoto(opcion: string, modal: any) {
    modal.close();
    if (opcion === "camara") {
      this.abrirModalWebcam();
    } else if (opcion === "archivo") {
      document.getElementById("fileUploadInput")?.click();
    }
  }

  // File handling para subida de fotos locales
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  procesarArchivo(file: File) {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      console.error("Formato de imagen inválido. Solo JPG y PNG permitidos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotoAfiliadoBlobUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  // Webcam handling nativa
  abrirModalWebcam() {
    this.modalService
      .open(this.modalWebcam, {
        centered: true,
        size: "lg",
        backdrop: "static",
      })
      .result.then(
        (_) => this.detenerCamara(),
        (_) => this.detenerCamara(),
      );

    this.iniciarCamara();
  }

  iniciarCamara() {
    this.webcamActive = false;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        })
        .then((stream) => {
          this.stream = stream;
          this.webcamActive = true;
          this.cdr.detectChanges();

          let attempts = 0;
          const attachVideo = setInterval(() => {
            const video = document.getElementById(
              "webcamVideo",
            ) as HTMLVideoElement;
            if (video) {
              clearInterval(attachVideo);
              video.muted = true;
              video.srcObject = stream;
              video
                .play()
                .catch((e) => console.error("Error reproduciendo video:", e));
            }
            attempts++;
            if (attempts > 20) {
              clearInterval(attachVideo);
              console.error("No se pudo enlazar el video tras 2 segundos");
            }
          }, 100);
        })
        .catch((err) => {
          console.error("Error accediendo a la cámara", err);
          this.webcamActive = false;
        });
    }
  }

  capturarFoto() {
    const video = document.getElementById("webcamVideo") as HTMLVideoElement;
    if (video && this.webcamActive) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        this.fotoAfiliadoBlobUrl = dataUrl;
        this.detenerCamara();
      }
    }
  }

  detenerCamara() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.webcamActive = false;
    this.modalService.dismissAll();
    this.cdr.detectChanges();
  }

  openModalHistorialMovimientos(content: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showPrintDropdown = false; // Close the dropdown if open

    this.tipoMovimientoFiltro = "";
    this.paginaActual = 1;
    this.generarMovimientosMock(); // Para demostración (o cargar desde servicio)
    this.filtrarMovimientos();

    this.modalService.open(content, {
      centered: true,
      size: "lg",
      backdrop: "static",
    });
  }

  private generarMovimientosMock() {
    this.movimientosOriginales = [];
    const tipos = ["INGRESO", "EGRESO", "AJUSTE"];
    const descripcionesIngreso = [
      "Abono de Nómina",
      "Bono Vacacional",
      "Aguinaldos",
      "Retroactivo",
    ];
    const descripcionesEgreso = [
      "Descuento Préstamo",
      "Retención ISRL",
      "Pago Seguro",
      "Cargo Administrativo",
    ];
    const descripcionesAjuste = [
      "Ajuste Salarial",
      "Corrección de Saldo",
      "Reintegro",
    ];

    const now = new Date();

    // Generar 35 movimientos aleatorios
    for (let i = 0; i < 35; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      let desc = "";
      let monto = 0;

      if (tipo === "INGRESO") {
        desc =
          descripcionesIngreso[
            Math.floor(Math.random() * descripcionesIngreso.length)
          ];
        monto = Math.random() * 5000 + 500;
      } else if (tipo === "EGRESO") {
        desc =
          descripcionesEgreso[
            Math.floor(Math.random() * descripcionesEgreso.length)
          ];
        monto = -(Math.random() * 1000 + 100);
      } else {
        desc =
          descripcionesAjuste[
            Math.floor(Math.random() * descripcionesAjuste.length)
          ];
        monto = Math.random() * 1000 - 500;
      }

      // Random date within the last 6 months
      const fecha = new Date(
        now.getTime() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000,
      );

      this.movimientosOriginales.push({
        fecha: fecha,
        tipo: tipo,
        descripcion: desc,
        monto: monto,
      });
    }
  }

  filtrarMovimientos() {
    if (this.tipoMovimientoFiltro) {
      this.movimientosFiltrados = this.movimientosOriginales.filter(
        (m) => m.tipo === this.tipoMovimientoFiltro,
      );
    } else {
      this.movimientosFiltrados = [...this.movimientosOriginales];
    }

    // Ordenar por fecha (Mayor a menor - más recientes primero)
    this.movimientosFiltrados.sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime(),
    );

    this.totalMovimientos = this.movimientosFiltrados.length;
    this.totalPaginas = Math.ceil(this.totalMovimientos / this.itemsPorPagina);

    // Reset a la pagina 1 si la pagina actual excede el total tras filtrar
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = 1;
    } else if (this.totalPaginas === 0) {
      this.paginaActual = 1;
    }

    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const startIndex = (this.paginaActual - 1) * this.itemsPorPagina;
    const endIndex = startIndex + this.itemsPorPagina;
    this.movimientosPaginados = this.movimientosFiltrados.slice(
      startIndex,
      endIndex,
    );
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPaginas) {
      this.paginaActual = page;
      this.actualizarPaginacion();
    }
  }

  getPaginas(): number[] {
    const pages: number[] = [];
    // Lógica simple para mostrar hasta 5 páginas cercanas
    let startPage = Math.max(1, this.paginaActual - 2);
    let endPage = Math.min(this.totalPaginas, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  openModalAgregarAsignacion(content: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.asignacionForm.reset();
    this.modalService.open(content, {
      centered: true,
      size: "md",
      backdrop: "static",
    });
  }

  guardarAsignacion(modal: any) {
    if (this.asignacionForm.valid) {
      console.log("Asignación guardada:", this.asignacionForm.value);
      // Lógica para guardar aquí
      modal.close();
    } else {
      this.asignacionForm.markAllAsTouched();
    }
  }

  openModalHistorialSueldo(content: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.generarSueldosMock();
    this.actualizarPaginacionSueldos();
    this.modalService.open(content, {
      centered: true,
      size: "lg",
      scrollable: true,
      backdrop: "static",
    });
  }

  generarSueldosMock() {
    this.sueldosOriginales = [
      {
        fecha: new Date("2024-05-01T10:00:00"),
        sueldoBase: 1500,
        sueldoMensual: 2500,
      },
      {
        fecha: new Date("2024-04-01T10:00:00"),
        sueldoBase: 1500,
        sueldoMensual: 2500,
      },
      {
        fecha: new Date("2024-03-01T10:00:00"),
        sueldoBase: 1400,
        sueldoMensual: 2350,
      },
      {
        fecha: new Date("2024-02-01T10:00:00"),
        sueldoBase: 1400,
        sueldoMensual: 2350,
      },
      {
        fecha: new Date("2024-01-01T10:00:00"),
        sueldoBase: 1300,
        sueldoMensual: 2200,
      },
      {
        fecha: new Date("2023-12-01T10:00:00"),
        sueldoBase: 1300,
        sueldoMensual: 2200,
      },
      {
        fecha: new Date("2023-11-01T10:00:00"),
        sueldoBase: 1200,
        sueldoMensual: 2000,
      },
    ];
  }

  actualizarPaginacionSueldos() {
    this.totalSueldos = this.sueldosOriginales.length;
    this.totalPaginasSueldo = Math.ceil(
      this.totalSueldos / this.sueldosPorPagina,
    );
    const inicio = (this.paginaSueldoActual - 1) * this.sueldosPorPagina;
    const fin = inicio + this.sueldosPorPagina;
    this.sueldosPaginados = this.sueldosOriginales.slice(inicio, fin);
  }

  cambiarPaginaSueldo(page: number) {
    if (page >= 1 && page <= this.totalPaginasSueldo) {
      this.paginaSueldoActual = page;
      this.actualizarPaginacionSueldos();
    }
  }

  getPaginasSueldo(): number[] {
    const pages: number[] = [];
    let startPage = Math.max(1, this.paginaSueldoActual - 2);
    let endPage = Math.min(this.totalPaginasSueldo, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPhotoId() {
    const cedula = this.identificacionForm?.get(
      "persona.datobasico.cedula",
    )?.value;
    if (cedula && cedula.toString().trim() !== "") {
      this.isLoadingFoto = true;
      const payload = {
        ruta: "imagenes/" + cedula + "/",
        archivo: "foto.jpg",
      };
      this.apiService.postBlob("dwscdn", payload).subscribe({
        next: (data: Blob) => {
          this.isLoadingFoto = false;
          if (data && data.size > 0) {
            this.fotoAfiliadoBlobUrl = URL.createObjectURL(data);
            this.cdr.detectChanges();
          } else {
            this.fotoAfiliadoBlobUrl = "";
          }
        },
        error: (error) => {
          this.isLoadingFoto = false;
          console.error(error);
          this.fotoAfiliadoBlobUrl = "";
        },
      });
    }
  }

  getDirectivaID() {
    const cedula = this.identificacionForm?.get(
      "persona.datobasico.cedula",
    )?.value;
    if (cedula && cedula.toString().trim() !== "") {
      const payload = {
        funcion: environment.funcion.OBTENER_BENEFICIARIO_DIRECTIVA_ID,
        parametros: `${cedula}`,
      };
      this.apiService.post("crud", payload).subscribe({
        next: (data: any) => {
          let directivaId = data.Cuerpo[0].directiva_sueldo_id;
          console.log("Directiva ID:", directivaId);
          this.getCalcId(directivaId, cedula);
          this.cdr.detectChanges();
        },
        error: (error) => {},
      });
    }
  }

  /**
   * Obtener los calculos de un beneficiario siempre que sea fideicomiso
   *
   */
  getCalcId(directivaId: number, cedula: string) {
    const netInfo = JSON.parse(sessionStorage.getItem("net_info") || "{}");
    const config = netInfo.config || {};

    const fnx = {
      funcion: "Fnx_ProcesarBeneficiario",
      id_cliente: config.clientId,
      aplicacion: "sandra.app.ipsfa",
      trackid: this.trackId, //seguimiento para descargar y la carpeta que se va a crear
      nombre: "NOMINA DE PRESTACIONES SOCIALES 2026",
      autor: "Sandra",
      ciclo: "03MAR2026",
      cedula: cedula,
      accion: "Parental",
      directiva_id: directivaId,
    };

    this.apiService.post("fnx", fnx).subscribe({
      next: (data: any) => {
        //   console.log(data);
        this.id = data.contenido.id; //id de la funcion fnx
      },
      error: (error) => {},
    });
  }

  private initMessagePort(): void {
    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (event.ports && event.ports.length > 0) {
        this.port = event.ports[0];
        this.port.onmessage = (msgEvent) => this.handlePortMessage(msgEvent);
        // console.log("[LotesComponent] Canal MessagePort establecido.");
      }
      if (msg && msg.type === "EXEC_FNX_FINALIZADO") {
        this.notifyCompletion(msg);
      }
    });
  }

  // --- KERNEL PACE LOGIC ---

  private handlePortMessage(event: MessageEvent) {
    if (event.data && event.data.type === "EXEC_FNX_FINALIZADO") {
      this.notifyCompletion(event.data);
    }
  }

  private notifyCompletion(msg: any) {
    this.zone.run(() => {
      const newContent = msg.payload?.data || msg.data;

      if (
        Array.isArray(JSON.parse(newContent)) &&
        JSON.parse(newContent).length > 0
      ) {
        this.calculosBunker = JSON.parse(newContent)[0];
        this.isBunkerSync = true;

        if (
          this.calculosBunker &&
          this.calculosBunker.status_id !== undefined
        ) {
          const datobasico = this.identificacionForm.get(
            "persona.datobasico",
          ) as FormGroup;
          if (datobasico) {
            datobasico
              .get("estatus")
              ?.setValue(String(this.calculosBunker.status_id));
          }
        }

        this.cdr.detectChanges();
        console.log("Datos de cálculo sincronizados", this.calculosBunker);
      }

      //   console.log(newContent);
      //   window.parent.postMessage(
      //     { type: "START_DOWNLOAD", id: this.id, trackingId: this.trackId },
      //     "*",
      //   );
    });
  }
}
