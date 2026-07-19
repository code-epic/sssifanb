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
    hoverActions: true,
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
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "oficio",
        header: "Oficio",
        type: "text",
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "expediente",
        header: "Expediente",
        type: "text",
        align: "center",
        cssClass: "align-middle font-weight-bold",
      },
      {
        key: "montoFormat",
        header: "Monto Total (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
      },
      {
        key: "estatusFormat",
        header: "Estatus",
        type: "html",
        align: "center",
        cssClass: "align-middle",
      },
    ],
    actions: [
      {
        name: "aprobar",
        icon: "fa-check",
        tooltip: "Ejecutar Medida",
        buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
      },
      {
        name: "ver",
        icon: "fa-eye",
        tooltip: "Ver Expediente",
        buttonClass: "btn-circular btn-amber-soft shadow-sm ml-2",
      },
    ],
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
      {
        key: "estatusFormat",
        header: "Estatus",
        type: "html",
        align: "center",
        cssClass: "align-middle",
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
    this.loadTabs();
    this.loadData();
    this.getMotivosJudiciales();
  }

  private loadTabs(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.workflowTabs = [
        { id: "RECIBIDO", nombre: "Recibidos" },
        { id: "PROCESO", nombre: "En Proceso" },
        { id: "EJECUTADO", nombre: "Ejecutados" },
        { id: "SUSPENDIDO", nombre: "Suspendidos" },
      ];
      this.currentTabId = "RECIBIDO";
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
      const rawData = [
        {
          cedula: "15442331",
          nombre: "ADRIANZA PAREDES LUIS",
          tipo: "ANTIGÜEDAD",
          oficio: "OF-2023-99",
          expediente: "EXP-9922",
          monto: 12500.0,
          estatus: "Pendiente",
        },
        {
          cedula: "10223112",
          nombre: "MENDEZ RIVAS JOSE",
          tipo: "INTERESES",
          oficio: "OF-2023-45",
          expediente: "EXP-4501",
          monto: 3400.5,
          estatus: "Ejecutado",
        },
      ];

      this.masterData = rawData.map((item) => ({
        ...item,
        cedulaFormat: `<span class="badge badge-pill bg-light text-muted border shadow-sm font-weight-bold px-2 py-1">${item.cedula}</span>`,
        montoFormat: `<span class="font-weight-bold" style="color: #0f172a;">${item.monto.toLocaleString("es-VE")}</span>`,
        estatusFormat: this.getStatusBadge(item.estatus),
      }));
      this.mainTableData = [...this.masterData];
      this.isLoadingData = false;
    }, 500);
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
              this.getMedidasJudiciales();
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

  public solicitarMedida(): void {
    this.medidaForm = {}; // reset
    this.currentModalStep = 1;
    this.modalService.open(this.modalSolicitar, { centered: true, size: "lg" });
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

      this.currentModalStep = 1;
      this.modalService.open(this.modalSolicitar, {
        centered: true,
        size: "lg",
      });
    }
  }

  public nextStep(): void {
    if (this.currentModalStep < 4) this.currentModalStep++;
  }

  public prevStep(): void {
    if (this.currentModalStep > 1) this.currentModalStep--;
  }

  public onActionClick(event: any): void {
    const { action, row } = event;
    this.selectedRecord = row;
    if (action === "aprobar") {
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
    alert("La medida judicial ha sido registrada exitosamente.");
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
      parametros: "",
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

  public getMedidasJudiciales(): void {
    let payload = {};
    payload = {
      funcion: environment.funcion.CONSULTAR_MEDIDAS_JUDICIALES,
      parametros: `${this.searchCedula}`,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data && data.Cuerpo && data.Cuerpo.length > 0) {
          this.lstMedidas = data.Cuerpo;
          console.log(this.lstMedidas);
          this.historyTableData = this.lstMedidas.map((item: any) => {
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

            let tipoName = "Medida Judicial";
            if (item.tipo_medida_id == 1) tipoName = "ASIGNACIÓN DE ANTIGÜEDAD";
            else if (item.tipo_medida_id == 2) tipoName = "INTERESES";

            let estatusName = item.status_id == 1 ? "Pendiente" : "Ejecutado";

            return {
              ...item,
              oficio: item.nro_oficio || "S/N",
              tipo: tipoName,
              montoFormat: `<span class="font-weight-bold" style="font-size: 1.05rem;">Bs ${Number(item.total_monto || 0).toLocaleString("es-VE")}</span>`,
              fecha: fechaStr,
              estatusFormat: this.getStatusBadge(estatusName),
            };
          });
        } else {
          this.lstMedidas = [];
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
