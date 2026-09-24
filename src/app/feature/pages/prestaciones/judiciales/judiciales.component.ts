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

  public isNewRecordView: boolean = false;
  public searchCedula: string = "";
  public militarData: any = null;
  public selectedRecord: any = null;
  public currentModalStep: number = 1;
  public isLoadingData: boolean = false;
  public allSelected: boolean = false;
  public isSearching: boolean = false;
  public lastSearchedCedula: string = "";
  public lstMotivos: any[] = [];
  private masterData: any[] = [];

  // --- CONFIG: Tabla Principal ---
  public mainTableConfig: DynamicTableConfig = {
    selectable: true,
    rowClickable: true,
    showPagination: true,
    pageSize: 10,
    hoverActions: false,
    tableClass: "mailbox-table w-100 mb-0",
    containerClass: "p-0 border-0 shadow-none",
    columns: [
      {
        key: "cedulaFormat",
        header: "Cédula",
        type: "html",
        align: "left",
        cssClass: "px-4 py-3 align-middle text-nowrap",
      },
      {
        key: "nombre",
        header: "Beneficiario",
        type: "text",
        align: "left",
        cssClass: "font-weight-600 align-middle text-dark",
      },
      {
        key: "tipo",
        header: "Tipo",
        type: "text",
        align: "left",
        cssClass: "align-middle",
      },
      {
        key: "oficio",
        header: "Oficio",
        type: "text",
        align: "left",
        cssClass: "align-middle",
      },
      {
        key: "expediente",
        header: "Expediente",
        type: "text",
        align: "left",
        cssClass: "align-middle font-weight-bold",
      },
      {
        key: "montoFormat",
        header: "Monto Total (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
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
    tableClass: "mailbox-table w-100",
    containerClass: "p-0 border-0 shadow-none rounded-20",
    columns: [
      {
        key: "oficio",
        header: "N° Oficio",
        type: "text",
        align: "left",
        cssClass: "font-weight-600 px-4 align-middle text-dark",
      },
      {
        key: "tipo",
        header: "Tipo Medida",
        type: "text",
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "montoFormat",
        header: "Monto (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
      },
      {
        key: "fecha",
        header: "Fecha Registro",
        type: "text",
        align: "center",
        cssClass: "text-muted align-middle",
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
  public medidaForm: any = {};
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

  public onMailboxSearch(term: string): void {
    if (!term) {
      this.mainTableData = [...this.masterData];
      return;
    }
    const st = term.toLowerCase();
    this.mainTableData = this.masterData.filter(
      (item) =>
        item.cedula.toLowerCase().includes(st) ||
        item.nombre.toLowerCase().includes(st) ||
        item.expediente.toLowerCase().includes(st),
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
            let tipoName = "MEDIDA JUDICIAL";
            if (item.tipo_medida_id == 1) tipoName = "ASIG. ANTIGUEDAD";
            else if (item.tipo_medida_id == 2) tipoName = "INTERESES";

            return {
              ...item,
              cedulaFormat: `<span class="badge badge-pill bg-light text-muted border shadow-sm font-weight-bold px-2 py-1">${item.cedula}</span>`,
              nombre: (item.n_beneficiario || "S/N").toUpperCase(),
              tipo: tipoName,
              oficio: (item.nro_oficio || "S/N").toUpperCase(),
              expediente: (item.nro_expediente || "S/N").toUpperCase(),
              montoFormat: `<span class="font-weight-bold" style="color: #0f172a; font-size: 1.05rem;">Bs. ${Number(item.total_monto || 0).toLocaleString("es-VE")}</span>`,
            };
          });
          this.mainTableData = [...this.masterData];
        } else {
          this.lstMedidas = [];
          this.masterData = [];
          this.mainTableData = [];
        }

        if (this.currentTabId === "220") {
          this.mainTableConfig.actions = [
            {
              name: "imprimir",
              icon: "fa-print",
              tooltip: "Imprimir Medida",
              buttonClass: "btn-circular btn-info-soft shadow-sm ml-2",
            },
            {
              name: "modificar",
              icon: "fa-pencil-alt",
              tooltip: "Modificar Medida",
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
              name: "imprimir",
              icon: "fa-print",
              tooltip: "Imprimir Medida",
              buttonClass: "btn-circular btn-info-soft shadow-sm ml-2",
            },
            {
              name: "reactivar",
              icon: "fa-play",
              tooltip: "Reactivar",
              buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
            },
          ];
        } else if (this.currentTabId === "223") {
          this.mainTableConfig.actions = [
            {
              name: "imprimir",
              icon: "fa-print",
              tooltip: "Imprimir Medida",
              buttonClass: "btn-circular btn-info-soft shadow-sm ml-2",
            },
          ];
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

  public buscarMilitar(): void {
    if (!this.searchCedula) {
      return;
    }
    if (this.isSearching) {
      return;
    }
    if (this.searchCedula === this.lastSearchedCedula) {
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
    const salario = Number(this.medidaForm.salario) || 0;
    const mensualidades = Number(this.medidaForm.mensualidades) || 0;
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
    const { action, row } = event;
    this.selectedRecord = row;
    
    if (action === "inactivar") {
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
          console.log("Inactivando medida:", row);
          Swal.fire('Inactivada', 'La medida judicial ha sido inactivada exitosamente.', 'success');
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
          console.log("Suspendiendo medida:", row);
          Swal.fire('Suspendida', 'La medida judicial ha sido suspendida exitosamente.', 'success');
        }
      });
    } else if (action === "aprobar") {
      this.modalService.open(this.modalAprobar, { centered: true });
    } else if (action === "ver") {
      console.log("Ver expediente:", row);
    }
  }

  public exportarCSV(): void {
    this.modalService.open(this.modalCSV, { centered: true });
  }

  public confirmarCSV(): void {
    alert("Generando archivo CSV de Medidas Judiciales...");
    this.modalService.dismissAll();
  }

  public confirmarEjecucion(): void {
    alert("Medida Judicial ejecutada correctamente.");
    this.modalService.dismissAll();
    this.loadData();
  }

  public procesarSolicitud(): void {
    Swal.fire({
      icon: "success",
      title: `<span style="color: #1e293b; font-weight: 700; font-size: 1.25rem;">Medida Judicial Registrada</span>`,
      html: `
        <div style="font-size: 0.95rem; color: #475569; text-align: left; padding: 0.25rem 0.25rem;">
          <p style="margin-bottom: 0.75rem; line-height: 1.5;">La medida judicial ha sido registrada exitosamente para el expediente militar.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #598c89; border-radius: 8px; padding: 0.75rem 1rem;">
            <div style="font-size: 0.85rem; color: #334155;">
              <i class="fas fa-check-circle mr-1" style="color: #598c89;"></i>
              Beneficiario: <strong>${this.medidaForm.n_beneficiario || "N/A"}</strong> | C.I. <strong>${this.medidaForm.ci_beneficiario || "N/A"}</strong>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: '<i class="fas fa-check mr-1"></i> Finalizar',
      confirmButtonColor: "#598c89",
      customClass: {
        popup: "border-0 shadow-lg rounded-20 px-3 py-3",
        confirmButton: "btn px-4 py-2 font-weight-bold shadow-sm",
      },
    });

    this.modalService.dismissAll();
    this.toggleView();
    this.loadData();
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

            let tipoName = "MEDIDA JUDICIAL";
            if (item.tipo_medida_id == 1) tipoName = "ASIG. ANTIGUEDAD";
            else if (item.tipo_medida_id == 2) tipoName = "INTERESES";

            return {
              ...item,
              oficio: (item.nro_oficio || "S/N").toUpperCase(),
              tipo: tipoName,
              montoFormat: `<span class="font-weight-bold" style="font-size: 1.05rem;">Bs. ${Number(item.total_monto || 0).toLocaleString("es-VE")}</span>`,
              fecha: fechaStr,
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
