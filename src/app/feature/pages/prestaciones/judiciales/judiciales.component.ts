import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
} from "@angular/core";
import { ApiService } from "src/app/core/services/api.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { DynamicTableConfig } from "src/app/shared/components/dynamic-table/dynamic-table.component";
import { BaseWorkflowClass } from "src/app/shared/classes/base-workflow.class";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PrestacionesSharedService } from "src/app/core/services/prestaciones/prestaciones-shared.service";
import { LoginService } from "src/app/core/services/login/login.service";
import { UtilService } from "src/app/core/services/util/util.service";
import { environment } from "src/environments/environment";
import { IAPICore } from "src/app/core/models/api/api-model";
import {
  IMedidaJudicial,
  IMedidaJudicialForm,
} from "src/app/core/models/prestaciones/medida-judicial.model";
import Swal from "sweetalert2";

@Component({
  selector: "app-prest-judiciales",
  templateUrl: "./judiciales.component.html",
  styleUrls: ["./judiciales.component.scss"],
})
export class JudicialesComponent extends BaseWorkflowClass implements OnInit {
  @ViewChild("modalSolicitar") modalSolicitar!: TemplateRef<any>;
  @ViewChild("modalAprobar") modalAprobar!: TemplateRef<any>;
  @ViewChild("modalCSV") modalCSV!: TemplateRef<any>;
  @ViewChild("modalExito") modalExito!: TemplateRef<any>;

  public isNewRecordView: boolean = false;
  public searchCedula: string = "";
  public militarData: any = null;
  public selectedRecord: any = null;
  public currentModalStep: number = 1;
  public isLoadingData: boolean = false;
  public allSelected: boolean = false;
  public isSearching: boolean = false;
  public isSavingMedida: boolean = false;
  public lastSearchedCedula: string = "";
  public lstMotivos: any[] = [];
  private masterData: any[] = [];

  // --- CONFIG: Tabla Principal ---
  public mainTableConfig: DynamicTableConfig = {
    selectable: false,
    rowClickable: true,
    showPagination: true,
    pageSize: 10,
    hoverActions: false,
    tableClass: "mailbox-table w-100 mb-0 table-horizontal-scroll",
    containerClass: "p-0 border-0 shadow-none table-scroll-container",
    columns: [
      {
        key: "titularFormat",
        header: "Titular (Militar)",
        type: "html",
        align: "left",
        width: "230px",
        cssClass: "px-2 py-1 align-middle",
      },
      {
        key: "beneficiarioFormat",
        header: "Beneficiario / C.I.",
        type: "html",
        align: "left",
        width: "210px",
        cssClass: "px-2 py-1 align-middle",
      },
      {
        key: "documentoFormat",
        header: "Medida / Oficio / Exp.",
        type: "html",
        align: "left",
        width: "195px",
        cssClass: "px-2 py-1 align-middle",
      },
      {
        key: "montoFormat",
        header: "Monto Total (Bs)",
        type: "html",
        align: "right",
        width: "125px",
        cssClass: "align-middle pr-3 text-nowrap",
      },
    ],
    actions: [],
  };

  public mainTableData: any[] = [];

  // --- CONFIG: Tabla Historial (Vista Registro) ---
  public historyTableConfig: DynamicTableConfig = {
    selectable: false,
    rowClickable: false,
    showPagination: true,
    pageSize: 5,
    hoverActions: false,
    tableClass: "mailbox-table w-100 table-horizontal-scroll",
    containerClass: "p-0 border-0 shadow-none rounded-20 table-scroll-container",
    columns: [
      {
        key: "documentoFormat",
        header: "Medida / Oficio / Exp.",
        type: "html",
        align: "left",
        width: "190px",
        cssClass: "px-2 py-1 align-middle",
      },
      {
        key: "beneficiarioFormat",
        header: "Beneficiario / C.I.",
        type: "html",
        align: "left",
        width: "195px",
        cssClass: "px-2 py-1 align-middle",
      },
      {
        key: "institucion",
        header: "Tribunal / Institución",
        type: "text",
        align: "left",
        width: "150px",
        cssClass: "align-middle text-truncate small text-muted",
      },
      {
        key: "autoridad",
        header: "Autoridad / Juez",
        type: "text",
        align: "left",
        width: "130px",
        cssClass: "align-middle text-truncate small text-muted",
      },
      {
        key: "calculoFormat",
        header: "Cálculo",
        type: "html",
        align: "center",
        width: "80px",
        cssClass: "align-middle text-center",
      },
      {
        key: "montoFormat",
        header: "Monto (Bs)",
        type: "html",
        align: "right",
        width: "120px",
        cssClass: "align-middle pr-2 text-nowrap",
      },
      {
        key: "fecha",
        header: "Fecha Doc.",
        type: "text",
        align: "center",
        width: "90px",
        cssClass: "text-muted align-middle text-nowrap",
      },
      {
        key: "observacion",
        header: "Observación",
        type: "text",
        align: "left",
        width: "150px",
        cssClass: "align-middle text-truncate small text-muted",
      },
    ],
    actions: [
      {
        name: "editar",
        icon: "fa-pencil-alt",
        tooltip: "Modificar Medida",
        buttonClass: "btn-circular btn-info-soft shadow-sm ml-2",
      },
    ],
  };

  public historyTableData: any[] = [];
  public lstMedidas: any;
  public medidaForm: IMedidaJudicialForm = {};
  public xAPI: IAPICore = {} as IAPICore;
  fechaDesde: string;
  fechaHasta: string;
  lstMedidasID: any;

  constructor(
    protected override apiService: ApiService,
    protected override layoutService: LayoutService,
    private modalService: NgbModal,
    private prestacionesService: PrestacionesSharedService,
    private loginService: LoginService,
    private utilService: UtilService,
    private cdr: ChangeDetectorRef,
  ) {
    super(
      apiService,
      layoutService,
      "Principal / Prestaciones: Medidas Judiciales",
    );
  }

  protected override onInitExtension(): void {
    const today = new Date();
    this.fechaDesde = `${today.getFullYear()}-01-01`;
    this.fechaHasta = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    this.loadTabs();
    this.loadData();
    this.getMotivosJudiciales();
  }

  private loadTabs(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.workflowTabs = [
        { id: "220", nombre: "ACTIVO" },
        { id: "221", nombre: "INACTIVO" },
        { id: "222", nombre: "SUSPENDIDA" },
        { id: "223", nombre: "EJECUTADA / PAGADA" },
      ];
      this.currentTabId = "220";
      this.isLoadingData = false;
    }, 300);
  }

  public toggleView(): void {
    this.isNewRecordView = !this.isNewRecordView;
    if (!this.isNewRecordView) {
      this.searchCedula = "";
      this.militarData = null;
      this.historyTableData = [];
    }
  }

  public filtroTipo: string = "TODOS";

  public get totalTodos(): number {
    return this.masterData.length;
  }

  public get totalAntiguedad(): number {
    return this.masterData.filter((i) => i.tipoKey === "ANTIGUEDAD").length;
  }

  public get totalIntereses(): number {
    return this.masterData.filter((i) => i.tipoKey === "INTERESES").length;
  }

  public setFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  public aplicarFiltros(): void {
    let result = [...this.masterData];
    if (this.filtroTipo === "ANTIGUEDAD") {
      result = result.filter((i) => i.tipoKey === "ANTIGUEDAD");
    } else if (this.filtroTipo === "INTERESES") {
      result = result.filter((i) => i.tipoKey === "INTERESES");
    }
    this.mainTableData = result;
    this.cdr.markForCheck();
  }

  public onMailboxSearch(term: string): void {
    if (!term) {
      this.aplicarFiltros();
      return;
    }
    const st = term.toLowerCase().trim();
    let base = [...this.masterData];
    if (this.filtroTipo === "ANTIGUEDAD") {
      base = base.filter((i) => i.tipoKey === "ANTIGUEDAD");
    } else if (this.filtroTipo === "INTERESES") {
      base = base.filter((i) => i.tipoKey === "INTERESES");
    }

    this.mainTableData = base.filter(
      (item) =>
        String(item.cedula || "").toLowerCase().includes(st) ||
        String(item.titularNombre || "").toLowerCase().includes(st) ||
        String(item.grado || "").toLowerCase().includes(st) ||
        String(item.nombre || "").toLowerCase().includes(st) ||
        String(item.ci_beneficiario || "").toLowerCase().includes(st) ||
        String(item.expediente || "").toLowerCase().includes(st) ||
        String(item.oficio || "").toLowerCase().includes(st) ||
        String(item.tipoNombre || "").toLowerCase().includes(st),
    );
  }

  public onMailboxTabSwitch(tabId: string): void {
    this.onTabSwitch(tabId, () => {
      this.loadData();
    });
  }

  public loadData(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.getMedidasJudiciales();
      this.isLoadingData = false;
    }, 500);
  }

  public getMedidasJudiciales(): void {
    const fDesde = this.fechaDesde
      ? this.fechaDesde.includes(" ")
        ? this.fechaDesde
        : `${this.fechaDesde} 00:00:00`
      : `${new Date().getFullYear()}-01-01 00:00:00`;

    const fHasta = this.fechaHasta
      ? this.fechaHasta.includes(" ")
        ? this.fechaHasta
        : `${this.fechaHasta} 00:00:00`
      : `${new Date().getFullYear() + 1}-01-01 00:00:00`;

    let payload = {
      funcion: environment.funcion.CONSULTAR_MEDIDAS_JUDICIALES,
      parametros: `${this.currentTabId},${fDesde},${fHasta}`,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data && data.Cuerpo && data.Cuerpo.length > 0) {
          this.lstMedidas = data.Cuerpo;
          console.log(this.lstMedidas);

          this.masterData = this.lstMedidas.map((item: any) => {
            const rawTipo = String(
              item.tipo_medida || item.tipo_medida_id || item.tipo || "",
            ).toUpperCase();

            const esAntiguedad =
              item.tipo_medida_id == 1 ||
              rawTipo.includes("ANTIGUEDAD") ||
              rawTipo.includes("ASIG");
            const esInteres =
              item.tipo_medida_id == 2 || rawTipo.includes("INTERES");

            const tipoKey = esAntiguedad
              ? "ANTIGUEDAD"
              : esInteres
                ? "INTERESES"
                : "OTRO";
            const tipoName = esAntiguedad
              ? "ASIG. ANTIGÜEDAD"
              : esInteres
                ? "INTERESES"
                : "MEDIDA JUDICIAL";

            const tipoPrefix = esAntiguedad
              ? "AA"
              : esInteres
                ? "INT"
                : "MJ";

            const tipoBadge = esAntiguedad
              ? `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Asignación de Antigüedad" style="background-color: rgba(89, 140, 137, 0.10); color: #447270; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-shield-alt mr-1"></i> ${tipoPrefix}</span>`
              : esInteres
                ? `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Intereses de Mora" style="background-color: rgba(37, 99, 235, 0.08); color: #2563eb; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-percentage mr-1"></i> ${tipoPrefix}</span>`
                : `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Medida Judicial" style="background-color: #f1f5f9; color: #64748b; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-gavel mr-1"></i> ${tipoPrefix}</span>`;

            // Titular (Militar): Grado, Nombres, Apellidos y Cédula
            const gradoNom = (item.grado_nombre || item.grado_descripcion || "").trim().toUpperCase();
            const nombresTitular = (item.nombres || "").trim().toUpperCase();
            const apellidosTitular = (item.apellidos || "").trim().toUpperCase();
            const titularCompleto = `${nombresTitular} ${apellidosTitular}`.trim() || (item.nombre_militar || "S/N");
            const cedulaTitular = item.cedula || "S/N";

            const titularHtml = `
              <div class="d-flex align-items-center py-0.5">
                <div class="rounded-circle d-flex align-items-center justify-content-center mr-2" 
                     style="width: 25px; height: 25px; min-width: 25px; background: #f1f5f9; color: #475569; font-size: 0.65rem;">
                  <i class="fas fa-user-shield"></i>
                </div>
                <div class="d-flex flex-column text-truncate" style="line-height: 1.2;">
                  <div class="d-flex align-items-center text-truncate">
                    ${gradoNom ? `<span class="badge px-1 py-0 mr-1 font-weight-500" style="font-size: 0.64rem; background-color: #f1f5f9; color: #475569;">${gradoNom}</span>` : ""}
                    <span class="text-truncate font-weight-500" style="font-size: 0.81rem; color: #334155;" title="${titularCompleto}">${titularCompleto}</span>
                  </div>
                  <span class="text-muted d-inline-flex align-items-center mt-0.5" style="font-size: 0.70rem;">
                    <span class="mr-1" style="color: #94a3b8; font-weight: 500;">C.I.</span>
                    <span style="color: #64748b; font-weight: 500; font-variant-numeric: tabular-nums;">${cedulaTitular}</span>
                  </span>
                </div>
              </div>
            `;

            // Beneficiario: Nombre y Cédula de Beneficiario
            const beneficiarioNom = (item.n_beneficiario || "S/N").toUpperCase();
            const cedulaBeneficiario = item.ci_beneficiario || item.cedula_beneficiario || "S/N";

            const beneficiarioHtml = `
              <div class="d-flex align-items-center py-0.5">
                <div class="rounded-circle d-flex align-items-center justify-content-center mr-2" 
                     style="width: 25px; height: 25px; min-width: 25px; background: rgba(89, 140, 137, 0.10); color: #598c89; font-size: 0.65rem;">
                  <i class="fas fa-user"></i>
                </div>
                <div class="d-flex flex-column text-truncate" style="line-height: 1.2;">
                  <span class="text-truncate font-weight-500" style="font-size: 0.81rem; color: #334155;" title="${beneficiarioNom}">${beneficiarioNom}</span>
                  <span class="text-muted d-inline-flex align-items-center mt-0.5" style="font-size: 0.70rem;">
                    <span class="mr-1" style="color: #94a3b8; font-weight: 500;">C.I.</span>
                    <span style="color: #64748b; font-weight: 500; font-variant-numeric: tabular-nums;">${cedulaBeneficiario}</span>
                  </span>
                </div>
              </div>
            `;

            const oficioVal = (item.nro_oficio || "S/N").toUpperCase();
            const expedienteVal = (item.nro_expediente || "S/N").toUpperCase();

            const documentoHtml = `
              <div class="d-flex flex-column py-0.5" style="line-height: 1.2;">
                <div class="d-flex align-items-center mb-0.5 text-truncate">
                  ${tipoBadge}
                  <span class="ml-1.5 text-truncate font-weight-500" style="font-size: 0.79rem; color: #334155;" title="N° Oficio: ${oficioVal}">
                    <i class="far fa-file-alt text-muted mr-1" style="font-size: 0.67rem;"></i>${oficioVal}
                  </span>
                </div>
                <div class="text-muted d-inline-flex align-items-center" style="font-size: 0.70rem;">
                  <span class="mr-1" style="color: #94a3b8; font-weight: 500;">Exp.</span>
                  <span class="text-truncate" style="color: #64748b; font-weight: 500;" title="Expediente: ${expedienteVal}">${expedienteVal}</span>
                </div>
              </div>
            `;

            return {
              ...item,
              tipoKey: tipoKey,
              tipoNombre: tipoName,
              tipoFormat: tipoBadge,
              tipo: tipoName,
              titularFormat: titularHtml,
              titularNombre: titularCompleto,
              grado: gradoNom,
              beneficiarioFormat: beneficiarioHtml,
              nombre: beneficiarioNom,
              oficio: oficioVal,
              expediente: expedienteVal,
              documentoFormat: documentoHtml,
              montoFormat: `<span class="font-weight-600" style="color: #334155; font-size: 0.84rem; font-variant-numeric: tabular-nums;">Bs. ${Number(item.total_monto || 0).toLocaleString("es-VE")}</span>`,
            };
          });
          this.aplicarFiltros();
        } else {
          this.lstMedidas = [];
          this.masterData = [];
          this.mainTableData = [];
        }

        if (this.currentTabId === "220") {
          this.mainTableConfig.actions = [
            {
              name: "editar",
              icon: "fa-pencil-alt",
              tooltip: "Editar / Modificar Medida",
              buttonClass: "btn-circular btn-warning-soft shadow-sm ml-2",
            },
            {
              name: "suspender",
              icon: "fa-pause",
              tooltip: "Suspender Medida",
              buttonClass: "btn-circular btn-danger-soft shadow-sm ml-2",
            },
            {
              name: "inactivar",
              icon: "fa-times",
              tooltip: "Inactivar Medida",
              buttonClass: "btn-circular btn-dark-soft shadow-sm ml-2",
            },
          ];
        } else if (this.currentTabId === "221" || this.currentTabId === "222") {
          this.mainTableConfig.actions = [
            {
              name: "reactivar",
              icon: "fa-play",
              tooltip: "Reactivar",
              buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
            },
          ];
        } else if (this.currentTabId === "223") {
          this.mainTableConfig.actions = [];
        } else {
          this.mainTableConfig.actions = [];
        }

        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error("Error HTTP al consultar medidas judiciales", err);
      },
    });
  }

  public buscarMilitar(force: boolean = false): void {
    if (!this.searchCedula) {
      return;
    }
    if (this.isSearching) {
      return;
    }
    if (!force && this.searchCedula === this.lastSearchedCedula) {
      return;
    }

    this.isSearching = true;
    this.lastSearchedCedula = this.searchCedula;
    this.militarData = null;
    this.historyTableData = [];

    const cargo = this.loginService.Usuario?.cargo || "";

    this.prestacionesService
      .buscarMilitarPorCedula(this.searchCedula, cargo)
      .subscribe({
        next: (data: any) => {
          try {
            if (data && (!Array.isArray(data) || data.length > 0)) {
              this.militarData = data[0];
              if (this.militarData.fingreso) {
                this.militarData.fingreso = this.utilService.formatDate(
                  this.militarData.fingreso,
                );
              }

              // Consultar historial judicial
              this.getMedidasJudicialesID();
            } else {
              alert("No se encontraron resultados para la cédula ingresada.");
            }
          } catch (e) {
            console.error("Excepción procesando buscarMilitarPorCedula:", e);
          }
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Error HTTP al buscar militar", err);
          this.isSearching = false;
          alert("Ocurrió un error al buscar la cédula.");
          this.cdr.markForCheck();
        },
      });
  }

  public get militarNombreCompleto(): string {
    const p = this.militarData?.persona?.datobasico;
    if (p?.nombrecompleto) return p.nombrecompleto;
    const nombres = p?.nombres || this.militarData?.nombres || "";
    const apellidos = p?.apellidos || this.militarData?.apellidos || "";
    return `${nombres} ${apellidos}`.trim();
  }

  public get militarGrado(): string {
    return (
      this.militarData?.grado?.descripcion ||
      this.militarData?.nombre_grado ||
      ""
    ).trim();
  }

  public get militarCedula(): string {
    return (
      this.militarData?.cedula ||
      this.militarData?.persona?.datobasico?.cedula ||
      this.searchCedula ||
      ""
    );
  }

  public get militarComponente(): string {
    return (
      this.militarData?.componente?.descripcion ||
      this.militarData?.nombre_componente ||
      ""
    ).trim();
  }

  public solicitarMedida(): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.medidaForm = {
      tipo_medida_id: "1",
      motivo_id: 1,
      f_documento: todayStr,
      f_recepcion: todayStr,
      forma_pago_id: "",
      estado_id: "",
      ciudad_id: "",
      municipio_id: "",
      parentesco_id: "",
    };
    this.currentModalStep = 1;
    this.modalService.open(this.modalSolicitar, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });
  }

  public onHistoryAction(event: any): void {
    if (event.actionName === "editar") {
      this.medidaForm = { ...event.row };
      if (!this.medidaForm.motivo_id) {
        this.medidaForm.motivo_id = 1;
      }

      // Formatear la fecha para el input type="date" (YYYY-MM-DD)
      if (
        this.medidaForm.f_documento &&
        typeof this.medidaForm.f_documento === "string"
      ) {
        const parsed = this.medidaForm.f_documento.substring(0, 10);
        if (parsed.includes("-")) {
          this.medidaForm.f_documento = parsed;
        }
      }

      if (
        this.medidaForm.f_recepcion &&
        typeof this.medidaForm.f_recepcion === "string"
      ) {
        const parsed = this.medidaForm.f_recepcion.substring(0, 10);
        if (parsed.includes("-")) {
          this.medidaForm.f_recepcion = parsed;
        }
      }

      this.currentModalStep = 1;
      this.modalService.open(this.modalSolicitar, {
        centered: true,
        size: "lg",
        windowClass: "pastel-modal",
      });
    }
  }

  public calcularMontoTotal(): void {
    const salario = Number(this.medidaForm.salario ?? this.medidaForm.cantidad_salario) || 0;
    const mensualidades = Number(this.medidaForm.mensualidades) || 0;
    this.medidaForm.salario = salario;
    this.medidaForm.cantidad_salario = salario;
    this.medidaForm.total_monto = parseFloat(
      (salario * mensualidades).toFixed(2),
    );
  }

  public nextStep(): void {
    if (this.currentModalStep === 2) {
      if (
        !this.medidaForm.forma_pago_id ||
        this.medidaForm.porcentaje === undefined ||
        this.medidaForm.porcentaje === null ||
        this.medidaForm.porcentaje === "" ||
        this.medidaForm.unidad_tributaria === undefined ||
        this.medidaForm.unidad_tributaria === null ||
        this.medidaForm.unidad_tributaria === "" ||
        this.medidaForm.mensualidades === undefined ||
        this.medidaForm.mensualidades === null ||
        this.medidaForm.mensualidades === "" ||
        this.medidaForm.salario === undefined ||
        this.medidaForm.salario === null ||
        this.medidaForm.salario === "" ||
        this.medidaForm.total_monto === undefined ||
        this.medidaForm.total_monto === null ||
        this.medidaForm.total_monto === ""
      ) {
        Swal.fire({
          icon: "warning",
          title: "Campos Obligatorios",
          text: "Debe llenar todos los campos de la pestaña CÁLCULO antes de continuar.",
          confirmButtonColor: "#598c89",
        });
        return;
      }
    }
    if (this.currentModalStep < 4) this.currentModalStep++;
  }

  public prevStep(): void {
    if (this.currentModalStep > 1) this.currentModalStep--;
  }

  public onActionClick(event: any): void {
    const action = event.actionName || event.action;
    const row = event.row;
    this.selectedRecord = row;
    
    if (action === "modificar" || action === "editar") {
      this.editarMedida(row);
      return;
    } else if (action === "inactivar") {
      Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea inactivar esta medida judicial?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#598c89',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, inactivar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cambiarEstatusMedida(row, "221", "inactivada");
        }
      });
    } else if (action === "suspender") {
      Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea suspender esta medida judicial?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#598c89',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, suspender',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cambiarEstatusMedida(row, "222", "suspendida");
        }
      });
    } else if (action === "reactivar") {
      Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea reactivar esta medida judicial?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#598c89',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cambiarEstatusMedida(row, "220", "reactivada");
        }
      });
    } else if (action === "aprobar" || action === "ejecutar") {
      this.modalService.open(this.modalAprobar, { centered: true });
    } else if (action === "ver") {
      console.log("Ver expediente:", row);
    }
  }

  public cambiarEstatusMedida(
    row: any,
    nuevoEstatus: string | number,
    accionNombre: string,
  ): void {
    const cedula = String(row.cedula || "").trim();
    const fDoc = row.f_documento
      ? String(row.f_documento).split("T")[0].split(" ")[0].trim()
      : "";

    this.xAPI = {} as IAPICore;
    this.xAPI.funcion = environment.funcion.ACTUALIZAR_MEDIDA_JUDICIAL_ESTATUS;
    this.xAPI.parametros = `${cedula},${fDoc},${nuevoEstatus}`;

    this.apiService.post("crud", this.xAPI).subscribe({
      next: (data: any) => {
        Swal.fire({
          icon: "success",
          title: "Estatus Actualizado",
          text: `La medida judicial ha sido ${accionNombre} exitosamente.`,
          confirmButtonColor: "#598c89",
        });
        this.loadData();
      },
      error: (err: any) => {
        console.error(`Error al ${accionNombre} la medida judicial:`, err);
        Swal.fire({
          icon: "error",
          title: "Error al actualizar",
          text: `Ocurrió un error al intentar cambiar el estatus de la medida judicial.`,
          confirmButtonColor: "#598c89",
        });
      },
    });
  }

  public exportarCSV(): void {
    this.modalService.open(this.modalCSV, { centered: true });
  }

  public confirmarCSV(): void {
    const dataToExport =
      this.mainTableData && this.mainTableData.length > 0
        ? this.mainTableData
        : this.masterData && this.masterData.length > 0
          ? this.masterData
          : this.lstMedidas;

    if (!dataToExport || dataToExport.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros disponibles para exportar a CSV.",
        confirmButtonColor: "#598c89",
      });
      this.modalService.dismissAll();
      return;
    }

    const tabName =
      this.workflowTabs.find((t: any) => t.id === this.currentTabId)?.nombre ||
      "medidas";
    const cleanTabName = tabName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const today = new Date().toISOString().substring(0, 10);
    const filename = `medidas_judiciales_${cleanTabName}_${today}.csv`;

    this.downloadCSV(dataToExport, filename);
    this.modalService.dismissAll();
  }

  public downloadCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) return;

    const separator = ";";
    const columns: { header: string; getValue: (row: any) => any }[] = [
      { header: "CEDULA_TITULAR", getValue: (r) => r.cedula || "" },
      { header: "GRADO", getValue: (r) => r.grado || r.grado_nombre || "" },
      {
        header: "TITULAR",
        getValue: (r) =>
          r.titularNombre ||
          `${r.nombres || ""} ${r.apellidos || ""}`.trim() ||
          r.nombre_militar ||
          "",
      },
      { header: "TIPO_MEDIDA", getValue: (r) => r.tipo || r.tipoNombre || "" },
      { header: "NRO_OFICIO", getValue: (r) => r.oficio || r.nro_oficio || "" },
      {
        header: "NRO_EXPEDIENTE",
        getValue: (r) => r.expediente || r.nro_expediente || "",
      },
      {
        header: "FECHA_DOCUMENTO",
        getValue: (r) =>
          r.f_documento ? String(r.f_documento).substring(0, 10) : "",
      },
      {
        header: "CEDULA_BENEFICIARIO",
        getValue: (r) => r.ci_beneficiario || r.cedula_beneficiario || "",
      },
      {
        header: "BENEFICIARIO",
        getValue: (r) => r.n_beneficiario || r.nombre || "",
      },
      {
        header: "TOTAL_MONTO",
        getValue: (r) =>
          r.total_monto !== undefined && r.total_monto !== null
            ? r.total_monto
            : "",
      },
      { header: "PORCENTAJE", getValue: (r) => r.porcentaje ?? "" },
      {
        header: "UNIDAD_TRIBUTARIA",
        getValue: (r) => r.unidad_tributaria ?? "",
      },
      {
        header: "CANTIDAD_SALARIO",
        getValue: (r) => r.cantidad_salario ?? "",
      },
      { header: "MENSUALIDADES", getValue: (r) => r.mensualidades ?? "" },
      {
        header: "FORMA_PAGO",
        getValue: (r) =>
          r.forma_pago_id == 1
            ? "CHEQUE"
            : r.forma_pago_id == 2
              ? "DEPOSITO"
              : r.forma_pago_id == 3
                ? "TRANSFERENCIA"
                : r.forma_pago_id || "",
      },
      {
        header: "DESC_EMBARGO",
        getValue: (r) => r.desc_embargo || "",
      },
      {
        header: "INSTITUCION_TRIBUNAL",
        getValue: (r) => r.desc_institucion || r.institucion || "",
      },
      {
        header: "AUTORIDAD",
        getValue: (r) => r.nombre_autoridad || "",
      },
      {
        header: "CARGO_AUTORIDAD",
        getValue: (r) => r.cargo_autoridad || "",
      },
      {
        header: "ESTATUS",
        getValue: (r) =>
          r.status_id == 220
            ? "ACTIVO"
            : r.status_id == 221
              ? "INACTIVO"
              : r.status_id == 222
                ? "SUSPENDIDA"
                : r.status_id == 223
                  ? "EJECUTADA / PAGADA"
                  : r.status_id || "",
      },
      { header: "FECHA_CREACION", getValue: (r) => r.f_creacion || "" },
      { header: "USUARIO_CREACION", getValue: (r) => r.usr_creacion || "" },
    ];

    const headerLine = columns.map((c) => c.header).join(separator);
    const lines = data.map((row) =>
      columns
        .map((col) => {
          let val = col.getValue(row);
          if (val === null || val === undefined) val = "";
          let cellStr = String(val).replace(/"/g, '""');
          if (cellStr.search(/("|,|;|\n|\r)/g) >= 0) {
            cellStr = `"${cellStr}"`;
          }
          return cellStr;
        })
        .join(separator),
    );

    const csvContent = headerLine + "\n" + lines.join("\n");

    // Sandra Sandbox Bridge
    const csvBase64 = btoa(unescape(encodeURIComponent("\ufeff" + csvContent)));
    const csvDataUri = `data:text/csv;base64,${csvBase64}`;

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
    }

    // Descarga directa Blob en navegador
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
      URL.revokeObjectURL(url);
    }

    Swal.fire({
      icon: "success",
      title: "Archivo Generado",
      text: `El archivo '${filename}' se ha generado exitosamente.`,
      confirmButtonColor: "#598c89",
      timer: 2000,
      showConfirmButton: false,
    });
  }

  public confirmarEjecucion(): void {
    if (this.selectedRecord) {
      this.cambiarEstatusMedida(this.selectedRecord, "223", "ejecutada");
    }
    this.modalService.dismissAll();
  }

  public editarMedida(row: any): void {
    this.isNewRecordView = true;
    this.searchCedula = row?.cedula || "";
    this.lastSearchedCedula = "";
    this.buscarMilitar(true);
  }

  public get medidaJudicialData(): IMedidaJudicial {
    const now = new Date();
    const fechaDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const cedula = String(
      this.militarCedula ||
      this.militarData?.cedula ||
      this.militarData?.persona?.datobasico?.cedula ||
      this.searchCedula ||
      this.medidaForm.cedula ||
      "",
    ).trim();

    const parentescoMap: { [key: string]: number } = {
      "1": 1, "HIJO": 1, "HIJA": 1,
      "2": 2, "ESPOSA": 2, "CONYUGE": 2, "ESPOSO": 2,
      "3": 3, "PADRE": 3, "MADRE": 3,
      "4": 4, "CONCUBINA": 4, "CONCUBINO": 4,
      "5": 5, "HERMANO": 5, "HERMANA": 5,
      "6": 6, "OTRO": 6,
    };
    const pVal = String(this.medidaForm.parentesco_id || "").toUpperCase().trim();
    const parentescoId = parentescoMap[pVal] !== undefined ? parentescoMap[pVal] : (parseInt(pVal, 10) || 0);

    const fDoc = this.medidaForm.f_documento
      ? String(this.medidaForm.f_documento).substring(0, 10)
      : fechaDate;

    const usr =
      this.loginService.Usuario?.usuario ||
      this.loginService.Usuario?.login ||
      this.loginService.Usuario?.id ||
      "SYSTEM";

    const cantSalario = parseInt(
      String(this.medidaForm.cantidad_salario ?? this.medidaForm.salario ?? 0),
      10,
    ) || 0;

    return {
      cargo_autoridad: String(this.medidaForm.cargo_autoridad || "").trim(),
      unidad_tributaria: parseInt(String(this.medidaForm.unidad_tributaria || 0), 10) || 0,
      n_beneficiario: String(this.medidaForm.n_beneficiario || "").trim().toUpperCase(),
      desc_institucion: String(this.medidaForm.desc_institucion || this.medidaForm.institucion || "").trim(),
      ci_beneficiario: String(this.medidaForm.ci_beneficiario || "").trim(),
      nro_oficio: String(this.medidaForm.nro_oficio || "").trim(),
      cantidad_salario: cantSalario,
      n_autorizado: String(this.medidaForm.n_autorizado || "").trim().toUpperCase(),
      porcentaje: parseInt(String(this.medidaForm.porcentaje || 0), 10) || 0,
      motivo_id: parseInt(String(this.medidaForm.motivo_id || 1), 10) || 1,
      parentesco_id: parentescoId,
      municipio_id: parseInt(String(this.medidaForm.municipio_id || 0), 10) || 0,
      nombre_autoridad: String(this.medidaForm.nombre_autoridad || "").trim(),
      ci_autorizado: String(this.medidaForm.ci_autorizado || "").trim(),
      mensualidades: parseInt(String(this.medidaForm.mensualidades || 0), 10) || 0,
      desc_embargo: String(this.medidaForm.desc_embargo || "").trim(),
      observ_ult_modificacion: String(this.medidaForm.observ_ult_modificacion || "").trim(),
      cedula: cedula,
      f_documento: fDoc,
      tipo_medida_id: parseInt(String(this.medidaForm.tipo_medida_id || 1), 10) || 1,
      total_monto: parseFloat(Number(this.medidaForm.total_monto || 0).toFixed(2)),
      institucion: String(this.medidaForm.institucion || "").trim(),
      forma_pago_id: parseInt(String(this.medidaForm.forma_pago_id || 0), 10) || 0,
      nro_expediente: String(this.medidaForm.nro_expediente || "").trim(),
      status_id: parseInt(String(this.medidaForm.status_id || 220), 10) || 220,
      usr_creacion: usr,
      usr_modificacion: String(this.medidaForm.usr_modificacion || ""),
      f_creacion: fechaDate,
      f_ult_modificacion: fechaDate,
    };
  }

  public GuardarMedida(): void {
    if (!this.militarData && !this.searchCedula) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor busque y seleccione un afiliado primero.",
        confirmButtonColor: "#598c89",
      });
      return;
    }

    if (!this.medidaForm.nro_oficio || !this.medidaForm.nro_expediente) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Por favor ingrese el número de oficio y de expediente.",
        confirmButtonColor: "#598c89",
      });
      return;
    }

    if (!this.medidaForm.ci_beneficiario || !this.medidaForm.n_beneficiario) {
      Swal.fire({
        icon: "warning",
        title: "Datos del Beneficiario",
        text: "Por favor ingrese los datos del beneficiario (Cédula y Nombre).",
        confirmButtonColor: "#598c89",
      });
      return;
    }

    this.isSavingMedida = true;
    this.xAPI = {} as IAPICore;
    this.xAPI.funcion = environment.funcion.INSERTAR_MEDIDA_JUDICIAL;
    this.xAPI.valores = JSON.stringify(this.medidaJudicialData);

    console.log(this.xAPI.valores);
    this.apiService.post("crud", this.xAPI).subscribe({
      next: (data: any) => {
        this.isSavingMedida = false;
        this.modalService.dismissAll();
        if (this.modalExito) {
          this.modalService.open(this.modalExito, {
            centered: true,
            size: "md",
            windowClass: "pastel-modal",
          });
        }
        this.toggleView();
        this.loadData();
      },
      error: (err: any) => {
        this.isSavingMedida = false;
        console.error("Error al registrar medida judicial:", err);
        Swal.fire({
          icon: "error",
          title: "Error al Registrar",
          text: "Ocurrió un error al registrar la medida judicial en el servidor.",
          confirmButtonColor: "#598c89",
        });
      },
    });
  }

  public cerrarModalExito(): void {
    this.modalService.dismissAll();
  }

  public procesarSolicitud(): void {
    this.GuardarMedida();
  }

  private getStatusBadge(estatus: string): string {
    if (estatus === "Ejecutado")
      return `<span class="badge bg-pastel-success text-success px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-check-circle mr-1"></i> ${estatus}</span>`;
    if (estatus === "Pendiente")
      return `<span class="badge bg-pastel-warning text-warning px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-clock mr-1"></i> ${estatus}</span>`;
    return `<span class="badge bg-light text-muted border px-2 py-1 shadow-sm font-weight-600">${estatus}</span>`;
  }

  public getMotivosJudiciales(): void {
    let payload = {};
    payload = {
      funcion: environment.funcion.CONSULTAR_MOTIVOS_MEDIDA_JUDICIAL,
      parametros: `${this.currentTabId}`,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data && data.Cuerpo) {
          this.lstMotivos = data.Cuerpo;
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error("Error HTTP al consultar motivos judiciales", err);
      },
    });
  }

  public getMedidasJudicialesID(): void {
    let payload = {};
    payload = {
      funcion: environment.funcion.CONSULTAR_MEDIDAS_JUDICIALES_ID,
      parametros: `${this.searchCedula}`,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data && data.Cuerpo && data.Cuerpo.length > 0) {
          this.lstMedidasID = data.Cuerpo;
          console.log(this.lstMedidasID);
          this.historyTableData = this.lstMedidasID.map((item: any) => {
            let fechaStr = "N/A";
            if (
              item.f_documento &&
              typeof item.f_documento === "string" &&
              item.f_documento.includes("-")
            ) {
              const parts = item.f_documento.substring(0, 10).split("-");
              if (parts.length === 3)
                fechaStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            const rawTipo = String(
              item.tipo_medida || item.tipo_medida_id || item.tipo || "",
            ).toUpperCase();

            const esAntiguedad =
              item.tipo_medida_id == 1 ||
              rawTipo.includes("ANTIGUEDAD") ||
              rawTipo.includes("ASIG");
            const esInteres =
              item.tipo_medida_id == 2 || rawTipo.includes("INTERES");

            const tipoName = esAntiguedad
              ? "ASIG. ANTIGÜEDAD"
              : esInteres
                ? "INTERESES"
                : "MEDIDA JUDICIAL";

            const tipoPrefix = esAntiguedad
              ? "AA"
              : esInteres
                ? "INT"
                : "MJ";

            const tipoBadge = esAntiguedad
              ? `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Asignación de Antigüedad" style="background-color: rgba(89, 140, 137, 0.10); color: #447270; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-shield-alt mr-1"></i> ${tipoPrefix}</span>`
              : esInteres
                ? `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Intereses de Mora" style="background-color: rgba(37, 99, 235, 0.08); color: #2563eb; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-percentage mr-1"></i> ${tipoPrefix}</span>`
                : `<span class="badge px-2 py-0.5 rounded-pill font-weight-500" title="Medida Judicial" style="background-color: #f1f5f9; color: #64748b; font-size: 0.68rem; letter-spacing: 0.2px; cursor: help;"><i class="fas fa-gavel mr-1"></i> ${tipoPrefix}</span>`;

            const beneficiarioNom = (item.n_beneficiario || "S/N").toUpperCase();
            const cedulaBeneficiario = item.ci_beneficiario || item.cedula_beneficiario || item.cedula || "S/N";

            const beneficiarioHtml = `
              <div class="d-flex align-items-center py-0.5">
                <div class="rounded-circle d-flex align-items-center justify-content-center mr-2" 
                     style="width: 25px; height: 25px; min-width: 25px; background: rgba(89, 140, 137, 0.10); color: #598c89; font-size: 0.65rem;">
                  <i class="fas fa-user"></i>
                </div>
                <div class="d-flex flex-column text-truncate" style="line-height: 1.2;">
                  <span class="text-truncate font-weight-500" style="font-size: 0.81rem; color: #334155;" title="${beneficiarioNom}">${beneficiarioNom}</span>
                  <span class="text-muted d-inline-flex align-items-center mt-0.5" style="font-size: 0.70rem;">
                    <span class="mr-1" style="color: #94a3b8; font-weight: 500;">C.I.</span>
                    <span style="color: #64748b; font-weight: 500; font-variant-numeric: tabular-nums;">${cedulaBeneficiario}</span>
                  </span>
                </div>
              </div>
            `;

            let calculoText = "-";
            if (item.porcentaje && Number(item.porcentaje) > 0) {
              calculoText = `<span class="badge badge-pill font-weight-500 px-1.5 py-0.5" style="background: rgba(89, 140, 137, 0.10); color: #447270; font-size: 0.70rem;">${item.porcentaje}%</span>`;
            } else if (item.unidad_tributaria && Number(item.unidad_tributaria) > 0) {
              calculoText = `<span class="badge badge-pill font-weight-500 px-1.5 py-0.5" style="background: #f1f5f9; color: #475569; font-size: 0.70rem;">${item.unidad_tributaria} U.T.</span>`;
            } else if (item.tipo_calculo) {
              calculoText = `<span class="text-muted small" style="font-size: 0.70rem;">${item.tipo_calculo}</span>`;
            }

            const oficioVal = (item.nro_oficio || "S/N").toUpperCase();
            const expedienteVal = (item.nro_expediente || "S/N").toUpperCase();

            const documentoHtml = `
              <div class="d-flex flex-column py-0.5" style="line-height: 1.2;">
                <div class="d-flex align-items-center mb-0.5 text-truncate">
                  ${tipoBadge}
                  <span class="ml-1.5 text-truncate font-weight-500" style="font-size: 0.79rem; color: #334155;" title="N° Oficio: ${oficioVal}">
                    <i class="far fa-file-alt text-muted mr-1" style="font-size: 0.67rem;"></i>${oficioVal}
                  </span>
                </div>
                <div class="text-muted d-inline-flex align-items-center" style="font-size: 0.70rem;">
                  <span class="mr-1" style="color: #94a3b8; font-weight: 500;">Exp.</span>
                  <span class="text-truncate" style="color: #64748b; font-weight: 500;" title="Expediente: ${expedienteVal}">${expedienteVal}</span>
                </div>
              </div>
            `;

            return {
              ...item,
              oficio: oficioVal,
              expediente: expedienteVal,
              documentoFormat: documentoHtml,
              beneficiarioFormat: beneficiarioHtml,
              institucion: (item.desc_institucion || item.tribunal || "N/A").toUpperCase(),
              autoridad: (item.cargo_autoridad || item.autoridad || "N/A").toUpperCase(),
              tipoFormat: tipoBadge,
              tipo: tipoName,
              calculoFormat: calculoText,
              montoFormat: `<span class="font-weight-600" style="color: #334155; font-size: 0.84rem; font-variant-numeric: tabular-nums;">Bs. ${Number(item.total_monto || 0).toLocaleString("es-VE")}</span>`,
              fecha: fechaStr,
              observacion: item.observacion || "Sin observaciones",
            };
          });
        } else {
          this.lstMedidasID = [];
          this.historyTableData = [];
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error("Error HTTP al consultar medidas judiciales", err);
      },
    });
  }
}
