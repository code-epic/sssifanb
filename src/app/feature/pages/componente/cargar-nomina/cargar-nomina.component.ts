import {
  Component,
  TemplateRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  DynamicTableComponent,
  DynamicTableConfig,
} from "src/app/shared/components/dynamic-table/dynamic-table.component";
import { PastelDatepickerComponent } from "src/app/shared/components/pastel-datepicker/pastel-datepicker.component";
import { MailboxLayoutComponent } from "src/app/shared/components/mailbox-layout/mailbox-layout.component";

import { ApiService } from "src/app/core/services/api.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { BaseWorkflowClass } from "src/app/shared/classes/base-workflow.class";
import { UtilService } from "src/app/core/services/util/util.service";
import { FileService } from "src/app/core/services/file.service";
import { ZstdCodec } from "zstd-codec";
import {
  COMPONENTES_MILITARES,
  GRADOS_MILITARES,
} from "src/app/core/models/militar/militar.model";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";

@Component({
  selector: "app-cargar-nomina",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    DynamicTableComponent,
    PastelDatepickerComponent,
    MailboxLayoutComponent,
  ],
  templateUrl: "./cargar-nomina.component.html",
  styleUrls: ["./cargar-nomina.component.scss"],
})
export class CargarNominaComponent extends BaseWorkflowClass implements OnInit {
  public componentes = COMPONENTES_MILITARES;
  public grados = GRADOS_MILITARES;

  @ViewChild("modalAprobar") modalAprobar!: TemplateRef<any>;
  @ViewChild("modalRechazar") modalRechazar!: TemplateRef<any>;
  @ViewChild("modalCSV") modalCSV!: TemplateRef<any>;
  @ViewChild("modalNuevo") modalNuevo!: TemplateRef<any>;
  @ViewChild("modalHomologacion") modalHomologacion!: TemplateRef<any>;

  // Variables de Homologación de Grados
  public homologaciones: any[] = [];
  public filteredHomologaciones: any[] = [];
  public filtroBusqueda: string = "";
  public filtroComponente: string = "";
  public filtroGrado: string = "";
  public editandoHomologacion: boolean = false;
  public homologacionForm: any = {
    id: "",
    descripcion: "",
    abreviatura: "",
    codIpsfanb: "",
    codComponente: "",
    cod_componente: "",
  };

  private defaultHomologaciones = [
    {
      id: "1",
      descripcion: "GENERAL EN JEFE",
      abreviatura: "G/J",
      codIpsfanb: "G/J",
      codComponente: "EJ",
    },
    {
      id: "2",
      descripcion: "ALMIRANTE EN JEFE",
      abreviatura: "A/J",
      codIpsfanb: "A/J",
      codComponente: "AR",
    },
    {
      id: "3",
      descripcion: "MAYOR GENERAL",
      abreviatura: "M/G",
      codIpsfanb: "M/G",
      codComponente: "AV",
    },
    {
      id: "4",
      descripcion: "ALMIRANTE",
      abreviatura: "ALM",
      codIpsfanb: "ALM",
      codComponente: "AR",
    },
    {
      id: "5",
      descripcion: "GENERAL DE DIVISIÓN",
      abreviatura: "G/D",
      codIpsfanb: "G/D",
      codComponente: "EJ",
    },
    {
      id: "6",
      descripcion: "VICEALMIRANTE",
      abreviatura: "V/A",
      codIpsfanb: "V/A",
      codComponente: "AR",
    },
    {
      id: "7",
      descripcion: "GENERAL DE BRIGADA",
      abreviatura: "G/B",
      codIpsfanb: "G/B",
      codComponente: "GN",
    },
    {
      id: "8",
      descripcion: "CONTRALMIRANTE",
      abreviatura: "C/A",
      codIpsfanb: "C/A",
      codComponente: "AR",
    },
    {
      id: "9",
      descripcion: "CORONEL",
      abreviatura: "CNEL",
      codIpsfanb: "CNEL",
      codComponente: "EJ",
    },
    {
      id: "10",
      descripcion: "CAPITÁN DE NAVÍO",
      abreviatura: "C/N",
      codIpsfanb: "C/N",
      codComponente: "AR",
    },
  ];

  public pasoActual: number = 1;
  public cargandoArchivos: boolean = false;
  public isManifestLoaded: boolean = false;
  public progresoCarga: number = 0;
  public progresoSubida: number = 0;
  public estadoSubida: string = "";
  public fileToUpload: File | null = null;
  public totalRegistros: number = 0;
  public erroresFechas: any[] = [];
  public totalErroresFechas: number = 0;
  public headerOriginal: string = "";
  public lineasCorrectas: string[] = [];
  public totalRegistrosCorrectos: number = 0;
  public columnasPrevia: string[] = [];
  public lineasCorrectasPrevia: string[][] = [];

  public selectedItem: any = null;
  private masterPendingData: any[] = [];
  public manifestFilesData: any[] = [];

  @ViewChild("modalEstadisticas") modalEstadisticas!: TemplateRef<any>;

  // Fields for the wizard step 1
  public tipoNominaSeleccionado: string = "";
  public componenteSeleccionado: string = "";
  public fechaRegistro: string = "";
  public mostrarDetalles: boolean = true;

  public validacionHomologada = [];

  // Variables para las 4 tarjetas de indicadores
  public showCards: boolean = false;
  public cardCorrectoCount: number = 0;
  public cardRevisionCount: number = 0;
  public cardRechazoCount: number = 0;
  public cardNuevosCount: number = 0;

  // Variables para porcentajes (100% = Correctos + Revision + Nuevos)
  public pctCorrectos: number = 0;
  public pctRevision: number = 0;
  public pctNuevos: number = 0;

  // --- CONFIG: Tabla Principal (Cargar Nómina) ---
  public pendingTableConfig: DynamicTableConfig = {
    selectable: false,
    rowClickable: true,
    showPagination: true,
    pageSize: 10,
    hoverActions: true,
    tableClass: "mailbox-table w-100 mb-0",
    containerClass: "p-0 border-0 shadow-none",
    columns: [
      {
        key: "idFormat",
        header: "ID",
        type: "html",
        align: "left",
        cssClass: "px-4 py-3 align-middle text-nowrap",
      },
      {
        key: "componenteFormat",
        header: "Comp.",
        type: "html",
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "origenFormat",
        header: "Archivo",
        type: "html",
        align: "left",
        cssClass: "align-middle",
      },
      {
        key: "cantidadFormat",
        header: "Procesados",
        type: "html",
        align: "center",
        cssClass: "align-middle font-weight-700",
      },
      {
        key: "fechaFormat",
        header: "Fecha",
        type: "html",
        align: "center",
        cssClass: "text-muted align-middle",
      },
      {
        key: "estatusFormat",
        header: "Estatus",
        type: "html",
        align: "center",
        cssClass: "align-middle",
      },
    ],
    actions: [],
  };

  public pendingTableData: any[] = [];
  public Componente = "";

  constructor(
    protected override apiService: ApiService,
    protected override layoutService: LayoutService,
    private modalService: NgbModal,
    private utilService: UtilService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
  ) {
    super(apiService, layoutService, "");
  }

  ngOnInit(): void {
    this.layoutService.triggerScrollToTop();
    this.loadMockTabs();
    this.loadPendingData();

    this.layoutService.toggleCards(false);
    this.layoutService.updateHeader({
      title: "Principal / Componente: Cargar Nómina",
      showBackButton: true,
      alertSeverity: 1,
      showAlertsIcon: true,
    });
    let comp = sessionStorage.getItem("existe_componente") || "";
    comp = comp.trim().toUpperCase();

    let xAPI = {
      funcion: "Fnx_DatosFideicomitentes",
      componente: `${comp.substring(0, 2)}`,
      // componente: `19`,
    };

    this.apiService.post("fnx", xAPI).subscribe({
      next: (data: any) => {
        console.log(data.contenido.id);
        setTimeout(() => {
          this.apiService.get("fnx:" + data.contenido.id).subscribe({
            next: (data: any) => {
              console.log("datos de la nomina: " + data.documento);
              if (data.documento == "PROCESADO") {
                let manifiesto = JSON.parse(data.rs);
                console.log(manifiesto);
                if (manifiesto && manifiesto.metrics) {
                  this.cardCorrectoCount = manifiesto.metrics.hits_100 || 0;
                  this.cardRevisionCount =
                    manifiesto.metrics.diferencias_parciales || 0;
                  this.cardRechazoCount =
                    manifiesto.metrics.no_encontrados_csv || 0;

                  if (manifiesto.metrics.no_encontrados_grpc !== undefined) {
                    this.cardNuevosCount =
                      manifiesto.metrics.no_encontrados_grpc;
                  } else if (manifiesto.metrics.registros_csv !== undefined) {
                    this.cardNuevosCount =
                      manifiesto.metrics.registros_csv -
                      ((manifiesto.metrics.hits_100 || 0) +
                        (manifiesto.metrics.diferencias_parciales || 0));
                  } else {
                    this.cardNuevosCount = 0;
                  }

                  if (
                    manifiesto.archivos_generados &&
                    Array.isArray(manifiesto.archivos_generados)
                  ) {
                    this.isManifestLoaded = true;
                    this.manifestFilesData = manifiesto.archivos_generados.map(
                      (item: any) => ({
                        ...item,
                        idFormat: `<div class="d-flex flex-column align-items-start"><span class="text-dark font-weight-600 mb-1" style="font-size: 0.9rem;">${item.nombre}</span></div>`,
                        componenteFormat: this.getComponentBadge(
                          this.componenteSeleccionado || "N/A",
                        ),
                        origenFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;"><i class="fas fa-file-csv text-muted mr-1"></i>${item.nombre}</span>`,
                        cantidadFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;">${item.lineas > 0 ? item.lineas - 1 : 0}</span>`,
                        fechaFormat: this.utilService.formatFechaRelativa(
                          manifiesto.fecha || new Date().toISOString(),
                        ),
                        estatusFormat: `<span class="badge badge-pill badge-light text-muted border px-2 py-1" style="font-size: 0.75rem;">${item.descripcion || "Generado"}</span>`,
                      }),
                    );
                    this.filtrarDatosPorTab();
                  }

                  this.actualizarPorcentajes();
                  this.showCards = true;
                }
              } else if (data.documento == "ZOMBIE") {
                this.showCards = false;
                this.utilService.AlertMini(
                  "top-end",
                  "info",
                  `Nomina esta en proceso de revision`,
                  4000,
                );
              } else {
              }
            },
            error: (err) => {},
          });
        }, 1000);
      },
      error: (err) => {},
    });

    this.Componente = sessionStorage.getItem("existe_componente") || "";
    this.Componente =
      this.Componente.trim() != ""
        ? this.Componente.trim().toUpperCase().substring(0, 2)
        : "";
  }

  protected override onInitExtension(): void {}

  private loadMockTabs(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.workflowTabs = [
        { id: "PRINCIPAL", nombre: "Activos / Procesados" },
        { id: "CORRECTOS", nombre: "Correctos" },
        { id: "REVISION", nombre: "Revisión" },
        { id: "NUEVOS", nombre: "Nuevos (Fideicomitentes)" },
      ];
      this.currentTabId = "PRINCIPAL";
      this.isLoadingData = false;
    }, 500);
  }

  public onMailboxSearch(term: string): void {
    if (!term) {
      this.filtrarDatosPorTab();
      return;
    }
    const st = term.toLowerCase();
    const isPrincipalOrNoManifest = this.currentTabId === "PRINCIPAL" || !this.isManifestLoaded;
    const activeDataset = isPrincipalOrNoManifest ? this.masterPendingData : this.manifestFilesData;

    this.pendingTableData = activeDataset.filter((item) => {
      const isItemFromManifest = this.isManifestLoaded && this.currentTabId !== "PRINCIPAL";
      const matchesSearch = isItemFromManifest
        ? (item.nombre && item.nombre.toLowerCase().includes(st))
        : (
            (item.id && item.id.toLowerCase().includes(st)) ||
            (item.origen && item.origen.toLowerCase().includes(st)) ||
            (item.componente && item.componente.toLowerCase().includes(st))
          );

      if (!matchesSearch) return false;

      switch (this.currentTabId) {
        case "PRINCIPAL":
          return true;
        case "CORRECTOS":
          if (this.isManifestLoaded) {
            return item.nombre && item.nombre.toLowerCase().includes("correcto");
          } else {
            return (
              item.estatus === "APROBADO" ||
              item.estatus === "PROCESO" ||
              item.estatus === "CONCILIADO" ||
              Number(item.errores) === 0
            );
          }
        case "REVISION":
          if (this.isManifestLoaded) {
            return item.nombre && item.nombre.toLowerCase().includes("rechazo");
          } else {
            return (
              item.estatus === "RECHAZADA" ||
              item.estatus === "ERROR" ||
              item.estatus === "RECHAZADO" ||
              Number(item.errores) > 0
            );
          }
        case "NUEVOS":
          if (this.isManifestLoaded) {
            return item.nombre && item.nombre.toLowerCase().includes("nuevo");
          } else {
            return (
              (item.origen && item.origen.toLowerCase().includes("nuevo")) ||
              item.estatus === "NUEVO" ||
              item.tipo === "NUEVO"
            );
          }
        default:
          return true;
      }
    });
  }

  public onMailboxTabSwitch(tabId: string): void {
    this.onTabSwitch(tabId, () => {
      this.filtrarDatosPorTab();
    });
  }

  public onMailboxRefresh(): void {
    this.loadPendingData();
  }

  public onMailboxSelectAll(checked: boolean): void {
    this.allSelected = checked;
  }

  private actualizarPorcentajes(): void {
    // Para las tarjetas, evaluamos el porcentaje basándonos únicamente en el universo "Sano/En Proceso"
    // para que la suma de estas tres tendencias sea exactamente 100%.
    const baseTotal =
      this.cardCorrectoCount + this.cardRevisionCount + this.cardNuevosCount;

    if (baseTotal > 0) {
      this.pctCorrectos = Number(
        ((this.cardCorrectoCount / baseTotal) * 100).toFixed(1),
      );
      this.pctRevision = Number(
        ((this.cardRevisionCount / baseTotal) * 100).toFixed(1),
      );
      this.pctNuevos = Number(
        ((this.cardNuevosCount / baseTotal) * 100).toFixed(1),
      );
    } else {
      this.pctCorrectos = 0;
      this.pctRevision = 0;
      this.pctNuevos = 0;
    }
    this.cdr.detectChanges();
  }

  public mostrarEstadisticas(): void {
    if (this.modalEstadisticas) {
      this.modalService.open(this.modalEstadisticas, {
        centered: true,
        size: "lg",
        windowClass: "pastel-modal",
      });
    }
  }

  public loadPendingData(): void {
    this.isLoadingData = true;
    let comp = sessionStorage.getItem("existe_componente") || "";
    comp = comp.trim().toUpperCase();

    const payload = {
      funcion: environment.funcion.LISTAR_FIDEICOMITENTES_POR_COMPONENTE,
      parametros: `${comp.substring(0, 2)}`,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        this.isLoadingData = false;
        let rawData = [];
        if (Array.isArray(data)) {
          rawData = data;
        } else if (data && data.Cuerpo) {
          rawData = data.Cuerpo;
        } else if (data && typeof data === "object") {
          rawData = [data]; // En caso de que devuelva el objeto directo
        }

        const mappedData = rawData.map((item) => ({
          ...item,
          idFormat: `
                        <div class="d-flex flex-column align-items-start">
                            <span class="text-dark font-weight-600 mb-1" style="font-size: 0.9rem;">${item.id || "N/A"}</span>
                            <small class="text-muted text-truncate" style="font-size: 0.75rem; max-width: 150px;" title="${item.responsable || "SISTEMA"}">
                                <i class="fas fa-user-shield mr-1 text-primary-teal"></i>${item.responsable || "SISTEMA"}
                            </small>
                        </div>
                    `,
          componenteFormat: this.getComponentBadge(item.componente || "N/A"),
          origenFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;"><i class="fas fa-file-csv text-muted mr-1"></i>${item.origen || ""}</span>`,
          cantidadFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;">${item.procesados || 0}</span>`,
          fechaFormat: this.utilService.formatFechaRelativa(item.fecha),
          estatusFormat: this.getStatusBadge(item.estatus || "PENDIENTE"),
        }));

        this.masterPendingData = [...mappedData];
        this.filtrarDatosPorTab();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingData = false;
        console.error("Error al cargar datos:", err);
        this.masterPendingData = [];
        this.pendingTableData = [];
        this.cdr.detectChanges();
      },
    });
  }

  public filtrarDatosPorTab(): void {
    let filtered: any[] = [];
    if (this.currentTabId === "PRINCIPAL") {
      filtered = [...this.masterPendingData];
    } else if (this.isManifestLoaded) {
      if (this.currentTabId === "CORRECTOS") {
        filtered = this.manifestFilesData.filter(
          (item) => item.nombre && item.nombre.toLowerCase().includes("correcto")
        );
      } else if (this.currentTabId === "REVISION") {
        filtered = this.manifestFilesData.filter(
          (item) => item.nombre && item.nombre.toLowerCase().includes("rechazo")
        );
      } else if (this.currentTabId === "NUEVOS") {
        filtered = this.manifestFilesData.filter(
          (item) => item.nombre && item.nombre.toLowerCase().includes("nuevo")
        );
      }
    } else {
      if (this.currentTabId === "CORRECTOS") {
        filtered = this.masterPendingData.filter(
          (item) =>
            item.estatus === "APROBADO" ||
            item.estatus === "PROCESO" ||
            item.estatus === "CONCILIADO" ||
            Number(item.errores) === 0
        );
      } else if (this.currentTabId === "REVISION") {
        filtered = this.masterPendingData.filter(
          (item) =>
            item.estatus === "RECHAZADA" ||
            item.estatus === "ERROR" ||
            item.estatus === "RECHAZADO" ||
            Number(item.errores) > 0
        );
      } else if (this.currentTabId === "NUEVOS") {
        filtered = this.masterPendingData.filter(
          (item) =>
            (item.origen && item.origen.toLowerCase().includes("nuevo")) ||
            item.estatus === "NUEVO" ||
            item.tipo === "NUEVO"
        );
      }
    }
    this.pendingTableData = filtered;
  }

  public triggerFileSelect(input: HTMLInputElement): void {
    if (this.cargandoArchivos) return;
    input.click();
  }

  public onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.utilService.AlertMini(
        "top-end",
        "error",
        "El archivo supera los 10MB permitidos",
        3000,
      );
      return;
    }

    // Validar extensión
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      this.utilService.AlertMini(
        "top-end",
        "error",
        "Solo se permiten archivos CSV",
        3000,
      );
      return;
    }

    this.fileToUpload = file;
    this.validarYProcesarCSV(file);
  }

  private validarYProcesarCSV(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        this.utilService.AlertMini(
          "top-end",
          "error",
          "Archivo sin datos",
          2000,
        );
        return;
      }

      const header = lines[0].toLowerCase();
      this.headerOriginal = lines[0];
      const delimiter = header.includes(";") ? ";" : ",";
      const columns = header.split(delimiter).map((c: string) => c.trim());

      const required = [
        "cedula",
        "grado",
        "n_hijos",
        "fecha_ingreso",
        "f_ult_ascenso",
        "st_profesion",
        "anio_reconocido",
        "mes_reconocido",
        "dia_reconocido",
      ];
      const missing = required.filter((col) => !columns.includes(col));

      if (missing.length > 0) {
        this.utilService.AlertMini(
          "top-end",
          "error",
          `Columnas faltantes: ${missing.join(", ")}`,
          4000,
        );
        return;
      }

      this.analizarFechasCSV(lines, delimiter, columns);

      this.totalRegistros = lines.filter((l) => l.trim() !== "").length - 1;
      this.simularCarga();
    };
    reader.readAsText(file);
  }

  private simularCarga(): void {
    this.cargandoArchivos = true;
    this.progresoCarga = 0;

    const interval = setInterval(() => {
      this.progresoCarga += Math.floor(Math.random() * 15) + 5;
      if (this.progresoCarga >= 100) {
        this.progresoCarga = 100;
        clearInterval(interval);
        setTimeout(() => {
          this.cargandoArchivos = false;
          this.pasoActual = 3; // Paso de éxito
          this.mostrarDetalles = true;
        }, 800);
      }
    }, 200);
  }

  public procesarFinal(): void {
    const csvContent =
      this.headerOriginal + "\n" + this.lineasCorrectas.join("\n");
    const textEncoder = new TextEncoder();
    const bytes = textEncoder.encode(csvContent);

    // Simulando estado de carga
    this.cargandoArchivos = true;

    ZstdCodec.run((zstd: any) => {
      try {
        const simple = new zstd.Simple();
        const compressed = simple.compress(bytes);

        // IMPORTANTE: El array devuelto por zstd-codec es una vista de la memoria WASM.
        // Intentar pasarlo directo a un Blob causa un "DataCloneError".
        // Debemos copiarlo a un Uint8Array de Javascript normal.
        const safeArray = new Uint8Array(compressed);

        // Crear el archivo ZST
        const blob = new Blob([safeArray], { type: "application/zstd" });
        const file = new File([blob], "reporte_nomina.zst", {
          type: "application/zstd",
        });

        const formData = new FormData();
        formData.append("archivos", file);
        formData.append("identificador", "NOM-" + this.Componente);
        formData.append("return", "true");

        // Endpoint (FileService ya le agrega environment.API)
        const endpoint = "subirarchivos";

        this.fileService.uploadWithProgress(endpoint, formData).subscribe({
          next: (event: any) => {
            if (event.state === "LOADING") {
              this.progresoSubida = event.progress;
              this.estadoSubida = `Enviando archivo... ${event.progress}%`;
            } else if (event.state === "DONE") {
              this.cargandoArchivos = false;
              this.progresoSubida = 100;
              this.estadoSubida = "¡Completado!";
              this.utilService.AlertMini(
                "top-end",
                "success",
                "Nómina enviada y procesada con éxito",
                2500,
              );
              this.modalService.dismissAll();
              this.loadPendingData();

              this.registrarNominaColeccion(event.body);
            }
          },
          error: (error: any) => {
            console.error("Error uploading file:", error);
            this.cargandoArchivos = false;
            this.utilService.AlertMini(
              "top-end",
              "error",
              "Hubo un error al enviar la nómina",
              3000,
            );
          },
        });
      } catch (err) {
        console.error("Error during ZST compression:", err);
        this.cargandoArchivos = false;
        this.utilService.AlertMini(
          "top-end",
          "error",
          "Error al comprimir el archivo ZST",
          3000,
        );
      }
    });
  }

  private registrarNominaColeccion(uploadEventBody: any): void {
    const endpoint = "ccoleccion";

    // Se asegura un id para la cláusula 'donde'. Si la respuesta del servidor no tiene ID, se usa uno generado.
    const idRegistro = uploadEventBody?.id || `NOM-${new Date().getTime()}`;

    // Calculamos la taza como el porcentaje de OKs vs Total Procesado (evitando división por cero)
    const tazaCalculada =
      this.totalRegistros > 0
        ? Math.round((this.totalRegistrosCorrectos / this.totalRegistros) * 100)
        : 0;

    // Extendemos el body recibido con los nuevos atributos solicitados
    const objetoExtendido = {
      ...(uploadEventBody || {}),
      estatus: "PENDIENTE",
      procesados: this.totalRegistros,
      errores: this.totalErroresFechas,
      ok: this.totalRegistrosCorrectos,
      taza: tazaCalculada,
      origen: this.fileToUpload?.name || "Archivo Desconocido",
      componente: this.componenteSeleccionado || "Desconocido",
    };

    const body = {
      coleccion: "file-fideicomitentes",
      objeto: objetoExtendido,
      donde: `{\"id\":\"${idRegistro}\"}`,
      driver: "MGDBA",
      upsert: true,
    };

    this.apiService.post(endpoint, body).subscribe({
      next: (resp) => {
        console.log("[Cargar Nómina] Nómina cargada con éxito:", resp);
        this.loadPendingData();
      },
      error: (err) => {
        console.error("[Cargar Nómina] Error al registrar en ccoleccion:", err);
        this.utilService.AlertMini(
          "top-end",
          "error",
          "Error al procesar la colección",
          3000,
        );
      },
    });
  }

  public confirmarCSV(): void {
    this.utilService.downloadCSV(this.pendingTableData, "nomina.csv");
    this.modalService.dismissAll();
  }

  public onPendingTableAction(event: any): void {
    this.selectedItem = event.row;
    if (event.actionName === "procesar") {
      this.modalService.open(this.modalAprobar, {
        centered: true,
        size: "md",
        windowClass: "pastel-modal",
      });
    } else if (event.actionName === "ver") {
      alert(`Ver documento de ${event.row.id}`);
    }
  }

  public confirmarAprobacion(): void {
    alert(`Registro ${this.selectedItem?.id} aprobado.`);
    this.modalService.dismissAll();
  }

  public confirmarRechazo(): void {
    alert(`Registro ${this.selectedItem?.id} rechazado.`);
    this.modalService.dismissAll();
  }

  public nuevoFideicomitente(): void {
    this.pasoActual = 1;
    this.tipoNominaSeleccionado = "PERSONAL MILITAR ACTIVO";

    // Obtener componente militar del sessionStorage
    let cmp = (sessionStorage.getItem("existe_componente") || "")
      .trim()
      .toUpperCase();
    let compAbbr = "";
    if (cmp.includes("EJERCITO") || cmp.includes("EJÉRCITO") || cmp === "EJ") {
      compAbbr = "EJ";
    } else if (cmp.includes("ARMADA") || cmp === "AR") {
      compAbbr = "AR";
    } else if (
      cmp.includes("AVIACION") ||
      cmp.includes("AVIACIÓN") ||
      cmp === "AV"
    ) {
      compAbbr = "AV";
    } else if (cmp.includes("GUARDIA") || cmp.includes("GNB") || cmp === "GN") {
      compAbbr = "GN";
    } else {
      compAbbr = cmp.substring(0, 2);
    }
    this.componenteSeleccionado = compAbbr;

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    this.fechaRegistro = `${yyyy}-${mm}-${dd}`;

    this.mostrarDetalles = false;
    this.fileToUpload = null;
    this.cargandoArchivos = false;
    this.progresoCarga = 0;
    this.progresoSubida = 0;
    this.estadoSubida = "";
    this.erroresFechas = [];
    this.totalErroresFechas = 0;
    this.lineasCorrectas = [];
    this.totalRegistrosCorrectos = 0;
    this.totalRegistros = 0;
    this.modalService.open(this.modalNuevo, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });

    this.listaHomologadaGrados();
  }

  public siguientePaso(): void {
    if (
      !this.tipoNominaSeleccionado ||
      !this.componenteSeleccionado ||
      !this.fechaRegistro
    ) {
      this.utilService.AlertMini(
        "top-end",
        "error",
        "El tipo de nómina, componente y fecha son obligatorios",
        3000,
      );
      return;
    }
    this.pasoActual = 2;
  }

  public procesarNuevo(): void {
    alert("Registro creado con éxito.");
    this.modalService.dismissAll();
  }

  public descargarErroresCSV(): void {
    if (this.erroresFechas.length === 0) return;

    const dataToExport = this.erroresFechas.map((err) => ({
      Linea: err.linea,
      Cedula: err.cedula,
      Columna: err.columna,
      Valor_Errado: err.valor,
      Detalle_Error: err.detalle,
    }));

    this.utilService.downloadCSV(dataToExport, "SSS001-ERR.csv");
  }

  public descargarCorrectosCSV(): void {
    if (this.lineasCorrectas.length === 0) return;

    const csvContent =
      this.headerOriginal + "\n" + this.lineasCorrectas.join("\n");
    const csvBase64 = btoa(unescape(encodeURIComponent("\ufeff" + csvContent)));
    const csvDataUri = `data:text/csv;base64,${csvBase64}`;
    const filename = "SSS001-OK.csv";

    if (window.parent && window !== window.parent) {
      window.parent.postMessage(
        {
          type: "OPEN_CSV",
          payload: {
            fileName: filename,
            data: csvDataUri,
          },
        },
        "*",
      );
    } else {
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  private analizarFechasCSV(
    lines: string[],
    delimiter: string,
    columns: string[],
  ): void {
    this.erroresFechas = [];
    this.lineasCorrectas = [];
    this.columnasPrevia = columns;
    this.lineasCorrectasPrevia = [];
    const cedulaIndex = columns.indexOf("cedula");
    const gradoIndex = columns.indexOf("grado");

    // Identify all date columns
    const dateColumnIndexes: number[] = [];
    columns.forEach((col, idx) => {
      if (this.utilService.isDateColumn(col)) {
        dateColumnIndexes.push(idx);
      }
    });

    // First pass: count occurrences of each cedula to find duplicates
    const cedulaOccurrences = new Map<string, number[]>();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = this.utilService.parseCSVLine(line, delimiter);
      const cedula =
        cedulaIndex !== -1 && cells[cedulaIndex]
          ? cells[cedulaIndex].trim()
          : "N/A";
      if (cedula && cedula !== "N/A") {
        if (!cedulaOccurrences.has(cedula)) {
          cedulaOccurrences.set(cedula, []);
        }
        cedulaOccurrences.get(cedula)!.push(i);
      }
    }

    // Loop through each line (excluding header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = this.utilService.parseCSVLine(line, delimiter);
      const cedula =
        cedulaIndex !== -1 && cells[cedulaIndex]
          ? cells[cedulaIndex].trim()
          : "N/A";
      const isDuplicate =
        cedula &&
        cedula !== "N/A" &&
        (cedulaOccurrences.get(cedula)?.length || 0) > 1;
      let hasError = false;
      // Homologar el grado: desde homologacion a cpace
      if (gradoIndex !== -1 && cells[gradoIndex]) {
        const rawGrado = cells[gradoIndex].trim();
        const found = this.validacionHomologada.find(
          (g: any) =>
            String(g.homologacion) === rawGrado ||
            String(g.codigo) === rawGrado,
        );
        if (found && found.cpace !== undefined && found.cpace !== null) {
          cells[gradoIndex] = String(found.cpace);
        }
      }

      // Check all identified date columns for this row
      dateColumnIndexes.forEach((colIdx) => {
        const rawValue = cells[colIdx] ? cells[colIdx].trim() : "";
        const normalizedValue =
          this.utilService.parseAndNormalizeDate(rawValue);
        cells[colIdx] = normalizedValue; // Update the cell in the array

        if (!this.utilService.isValidDateYYYYMMDD(normalizedValue)) {
          hasError = true;
          this.erroresFechas.push({
            linea: i + 1, // Line number (header is line 1, first data is line 2)
            cedula: cedula,
            columna: columns[colIdx],
            valor: rawValue || "[Vacío]",
            detalle: "Formato incorrecto. Se espera DD/MM/AAAA o AAAA-MM-DD",
          });
        }
      });

      if (isDuplicate) {
        hasError = true;
        this.erroresFechas.push({
          linea: i + 1,
          cedula: cedula,
          columna: "cedula",
          valor: cedula,
          detalle: "Cédula duplicada en el archivo",
        });
      }

      if (!hasError) {
        // Reconstruct the line with normalized dates
        const newLine = cells
          .map((cell) => {
            if (
              cell.includes(delimiter) ||
              cell.includes('"') ||
              cell.includes("\n") ||
              cell.includes("\r")
            ) {
              const escaped = cell.replace(/"/g, '""');
              return `"${escaped}"`;
            }
            return cell;
          })
          .join(delimiter);
        this.lineasCorrectas.push(newLine);

        if (this.lineasCorrectasPrevia.length < 10) {
          this.lineasCorrectasPrevia.push([...cells]);
        }
      }
    }
    this.totalErroresFechas = this.erroresFechas.length;
    this.totalRegistrosCorrectos = this.lineasCorrectas.length;
  }

  public isDateValue(cell: string): boolean {
    return this.utilService.isDateValue(cell);
  }

  private getComponentBadge(comp: string): string {
    const colors: any = {
      EJ: "text-danger",
      EJB: "text-danger",
      AR: "text-info",
      ARB: "text-info",
      AV: "text-primary",
      AMB: "text-primary",
      GN: "text-success",
      GNB: "text-success",
    };
    const colorClass = colors[comp] || "text-muted";
    return `<span class="font-weight-600 ${colorClass}" style="font-size: 0.9rem;"><i class="fas fa-circle mr-1" style="font-size: 0.4rem; vertical-align: middle; margin-bottom: 2px;"></i>${comp}</span>`;
  }

  private getStatusBadge(estatus: string): string {
    let icon = "fa-clock";
    let colorClass = "text-warning";

    switch (estatus) {
      case "APROBADO":
      case "PROCESADO":
        icon = "fa-check-circle";
        colorClass = "text-success";
        break;
      case "RECHAZADA":
      case "ERROR":
        icon = "fa-times-circle";
        colorClass = "text-danger";
        break;
      case "PENDIENTE":
      case "EN PROCESO":
      default:
        icon = "fa-clock";
        colorClass = "text-warning";
        break;
    }

    return `<span class="font-weight-600 ${colorClass}" style="font-size: 0.9rem;"><i class="fas ${icon} mr-1"></i>${estatus}</span>`;
  }

  public getNombreComponenteCompleto(): string {
    const comp = (sessionStorage.getItem("existe_componente") || "")
      .trim()
      .toUpperCase();
    if (comp.includes("EJERCITO") || comp.includes("EJÉRCITO") || comp === "EJ")
      return "EJÉRCITO BOLIVARIANO";
    if (comp.includes("ARMADA") || comp === "AR") return "ARMADA BOLIVARIANA";
    if (comp.includes("AVIACION") || comp.includes("AVIACIÓN") || comp === "AV")
      return "AVIACIÓN MILITAR BOLIVARIANA";
    if (comp.includes("GUARDIA") || comp.includes("GNB") || comp === "GN")
      return "GUARDIA NACIONAL BOLIVARIANA";
    return comp || "TODOS LOS COMPONENTES";
  }

  public getSessionExisteComponenteCamel(): string {
    return (
      sessionStorage.getItem("existe_componente") || "NO DEFINIDO"
    ).toUpperCase();
  }

  public getSessionExisteComponenteSnake(): string {
    return (
      sessionStorage.getItem("existe_componente") || "NO DEFINIDO"
    ).toUpperCase();
  }

  public onSelectGradoIpsfanb(cod: string): void {
    const found = this.grados.find((g) => g.abreviatura === cod);
    if (found) {
      this.homologacionForm.descripcion = found.nombre.toUpperCase();
      this.homologacionForm.abreviatura = found.abreviatura.toUpperCase();
      this.homologacionForm.codIpsfanb = found.abreviatura;
    } else {
      this.homologacionForm.descripcion = "";
      this.homologacionForm.abreviatura = "";
      this.homologacionForm.codIpsfanb = "";
    }
  }

  public abrirModalHomologacion(): void {
    this.filtroBusqueda = "";
    this.filtroComponente = "";
    this.filtroGrado = "";
    this.cancelarEdicionHomologacion();

    const componentFilter = (sessionStorage.getItem("existe_componente") || "")
      .trim()
      .toUpperCase();

    const matchesComponent = (compCode: string, filter: string): boolean => {
      if (!filter) return true;
      if (!compCode) return false;

      const code = compCode.trim().toUpperCase();
      const flt = filter.trim().toUpperCase();

      if (code === flt) return true;

      const isEjCode =
        code === "EJ" || code.includes("EJERCITO") || code.includes("EJÉRCITO");
      const isEjFilter =
        flt === "EJ" || flt.includes("EJERCITO") || flt.includes("EJÉRCITO");
      if (isEjCode && isEjFilter) return true;

      const isArCode = code === "AR" || code.includes("ARMADA");
      const isArFilter = flt === "AR" || flt.includes("ARMADA");
      if (isArCode && isArFilter) return true;

      const isAvCode =
        code === "AV" || code.includes("AVIACION") || code.includes("AVIACIÓN");
      const isAvFilter =
        flt === "AV" || flt.includes("AVIACION") || flt.includes("AVIACIÓN");
      if (isAvCode && isAvFilter) return true;

      const isGnCode =
        code === "GN" || code.includes("GUARDIA") || code.includes("GNB");
      const isGnFilter =
        flt === "GN" || flt.includes("GUARDIA") || flt.includes("GNB");
      if (isGnCode && isGnFilter) return true;

      return false;
    };

    const payload = {
      funcion: environment.funcion.LISTAR_GRADOS,
      parametros: "",
    };

    this.isLoadingData = true;
    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        this.isLoadingData = false;
        let rawData = [];
        if (Array.isArray(data)) rawData = data;
        const list: any[] = [];

        rawData.forEach((item: any) => {
          const gradesArray = item.Grado;
          if (item.codigo.substring(0, 2) == componentFilter.substring(0, 2)) {
            if (Array.isArray(gradesArray)) {
              gradesArray.forEach((g: any) => {
                const cpace = g.cpace ? String(g.cpace) : "";
                const excludedCodes = [
                  "3100",
                  "3110",
                  "3120",
                  "3130",
                  "3140",
                  "3150",
                  "3160",
                  "3170",
                ];
                if (excludedCodes.includes(cpace)) {
                  return;
                }

                list.push({
                  id: g.id || g._id || `HML-${Math.random()}`,
                  descripcion: (g.descripcion || g.nombre || "").toUpperCase(),
                  abreviatura:
                    g.codIpsfanb ||
                    g.cod_ipsfanb ||
                    g.codigo ||
                    g.equivalencia ||
                    "",
                  codIpsfanb: g.cpace || "",
                  codComponente:
                    g.homologacion || g.cod_componente || g.codComponente || "",
                  cod_componente:
                    g.homologacion || g.cod_componente || g.codComponente || "",
                });
              });
            }
          }
        });

        if (list.length > 0) {
          this.homologaciones = list;
        } else {
          if (componentFilter) {
            this.homologaciones = this.defaultHomologaciones.filter(
              (h: any) => {
                const compCode = (
                  h.codComponente ||
                  h.cod_componente ||
                  h.codigo ||
                  h.código ||
                  ""
                ).toString();
                return matchesComponent(compCode, componentFilter);
              },
            );
          } else {
            this.homologaciones = [...this.defaultHomologaciones];
          }
        }
        this.filtrarHomologaciones();
      },
      error: (err) => {
        this.isLoadingData = false;
        console.error("Error al cargar grados desde LISTAR_GRADOS:", err);

        let sourceList = [];
        const stored = localStorage.getItem("homologacion_grados");
        if (stored) {
          try {
            sourceList = JSON.parse(stored);
          } catch (e) {
            sourceList = [...this.defaultHomologaciones];
          }
        } else {
          sourceList = [...this.defaultHomologaciones];
        }

        if (componentFilter) {
          this.homologaciones = sourceList.filter((h: any) => {
            const compCode = (
              h.codComponente ||
              h.cod_componente ||
              h.codigo ||
              h.código ||
              ""
            ).toString();
            return matchesComponent(compCode, componentFilter);
          });
        } else {
          this.homologaciones = sourceList;
        }
        this.filtrarHomologaciones();
      },
    });

    this.modalService.open(this.modalHomologacion, {
      centered: true,
      size: "xl",
      windowClass: "pastel-modal modal-homologacion",
    });
  }

  public filtrarHomologaciones(): void {
    this.filteredHomologaciones = [...this.homologaciones];
  }

  public guardarHomologacion(): void {
    let {
      descripcion,
      abreviatura,
      codIpsfanb,
      codComponente,
      cod_componente,
    } = this.homologacionForm;

    const compVal = (codComponente || cod_componente || "").trim();
    codComponente = compVal;
    cod_componente = compVal;

    if (!descripcion || !abreviatura || !codIpsfanb || !compVal) {
      this.utilService.AlertMini(
        "top-end",
        "error",
        "Todos los campos son obligatorios",
        3000,
      );
      return;
    }

    const duplicated = this.homologaciones.find((h) => {
      if (h.id === this.homologacionForm.id) return false;
      const existingCompCode = (h.codComponente || h.cod_componente || "")
        .toString()
        .trim()
        .toUpperCase();
      return existingCompCode === compVal.toUpperCase();
    });

    if (duplicated) {
      this.utilService.AlertMini(
        "top-end",
        "error",
        `El código "${compVal}" ya está registrado en "${duplicated.descripcion}"`,
        4000,
      );
      return;
    }

    if (this.editandoHomologacion) {
      const idx = this.homologaciones.findIndex(
        (h) => h.id === this.homologacionForm.id,
      );
      if (idx !== -1) {
        this.homologaciones[idx] = {
          id: this.homologacionForm.id,
          descripcion: descripcion.toUpperCase().trim(),
          abreviatura: abreviatura.toUpperCase().trim(),
          codIpsfanb: codIpsfanb,
          codComponente: codComponente,
          cod_componente: cod_componente,
        };
        this.utilService.AlertMini(
          "top-end",
          "success",
          "Homologación actualizada con éxito",
          2500,
        );
      }
    } else {
      const nuevoId = `HML-${new Date().getTime()}`;
      const nuevoRegistro = {
        id: nuevoId,
        descripcion: descripcion.toUpperCase().trim(),
        abreviatura: abreviatura.toUpperCase().trim(),
        codIpsfanb: codIpsfanb,
        codComponente: codComponente,
        cod_componente: cod_componente,
      };
      this.homologaciones.unshift(nuevoRegistro);
      this.utilService.AlertMini(
        "top-end",
        "success",
        "Homologación creada con éxito",
        2500,
      );
    }

    localStorage.setItem(
      "homologacion_grados",
      JSON.stringify(this.homologaciones),
    );

    let cmp = sessionStorage.getItem("existe_componente") || "";
    cmp = cmp.trim().toUpperCase();

    const body = {
      funcion: "IPSFA_UComponentes",
      parametros: `${cmp.substring(0, 2)},${codIpsfanb},${cod_componente}`,
    };

    this.apiService.post("crud", body).subscribe({
      next: (resp) => {
        this.cancelarEdicionHomologacion();
        console.log("[Homologación] Sincronizado en MongoDB:", resp);
      },
      error: (err) => {
        this.cancelarEdicionHomologacion();
        console.error("[Homologación] Error al sincronizar MongoDB:", err);
      },
    });

    this.filtrarHomologaciones();
  }

  public editarHomologacion(item: any): void {
    this.homologacionForm = { ...item };
    this.editandoHomologacion = true;
  }

  public eliminarHomologacion(item: any): void {
    Swal.fire({
      title: "¿Eliminar Homologación?",
      text: `¿Está seguro de eliminar la homologación de "${item.descripcion}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#598c89",
      cancelButtonColor: "#6c767f",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "rounded-20 shadow-lg border-0 bg-white p-4",
        confirmButton: "btn btn-header-action shadow-none text-white",
        cancelButton: "btn btn-header-action gray shadow-none",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.homologaciones = this.homologaciones.filter(
          (h) => h.id !== item.id,
        );
        localStorage.setItem(
          "homologacion_grados",
          JSON.stringify(this.homologaciones),
        );

        this.utilService.AlertMini(
          "top-end",
          "success",
          "Homologación eliminada con éxito",
          2500,
        );
        this.filtrarHomologaciones();

        if (this.homologacionForm.id === item.id) {
          this.cancelarEdicionHomologacion();
        }
      }
    });
  }

  public cancelarEdicionHomologacion(): void {
    this.homologacionForm = {
      id: "",
      descripcion: "",
      abreviatura: "",
      codIpsfanb: "",
      codComponente: "",
      cod_componente: "",
    };
    this.editandoHomologacion = false;
  }

  async listaHomologadaGrados() {
    const componenteFilter = sessionStorage.getItem("existe_componente") || "";

    const payload = {
      funcion: environment.funcion.LISTAR_GRADOS,
      parametros: "",
    };

    this.isLoadingData = true;
    await this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        this.isLoadingData = false;
        let rawData = [];
        if (Array.isArray(data)) rawData = data;
        const list: any[] = [];

        rawData.forEach((item: any) => {
          const gradesArray = item.Grado;
          if (item.codigo.substring(0, 2) == componenteFilter.substring(0, 2)) {
            console.log(gradesArray);
            if (Array.isArray(gradesArray)) {
              const excludedCodes = [
                "3100",
                "3110",
                "3120",
                "3130",
                "3140",
                "3150",
                "3160",
                "3170",
              ];
              this.validacionHomologada = gradesArray.filter((g: any) => {
                const cpace = g.cpace ? String(g.cpace) : "";
                return !excludedCodes.includes(cpace);
              });
            }
          }
        });
      },
    });
  }
}
