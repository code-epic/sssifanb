import {
  Component,
  TemplateRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { ApiService } from "src/app/core/services/api.service";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { UtilService } from "../../../../core/services/util/util.service";
import { DynamicTableConfig } from "src/app/shared/components/dynamic-table/dynamic-table.component";
import { BaseWorkflowClass } from "src/app/shared/classes/base-workflow.class";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PrestacionesSharedService } from "src/app/core/services/prestaciones/prestaciones-shared.service";
import { LoginService } from "src/app/core/services/login/login.service";
import { Subscription } from "rxjs";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-prest-anticipos",
  templateUrl: "./anticipos.component.html",
  styleUrls: ["./anticipos.component.scss"],
})
export class AnticiposComponent extends BaseWorkflowClass implements OnDestroy {
  @ViewChild("modalAprobar") modalAprobar!: TemplateRef<any>;
  @ViewChild("modalRechazar") modalRechazar!: TemplateRef<any>;
  @ViewChild("modalCSV") modalCSV!: TemplateRef<any>;
  @ViewChild("modalSolicitar") modalSolicitar!: TemplateRef<any>;

  public isNewAnticipoView: boolean = false;
  public searchCedula: string = "";
  private lastSearchedCedula: string = "";
  public militarData: any = null;
  public selectedMilitar: any = null;

  public porcentajeAnticipo: number = 0;
  public montoAnticipo: number = 0;
  public motivoAnticipo: string = "";

  private masterPendingData: any[] = [];
  public isSearching: boolean = false;
  public calculosData: any = null;
  private calculosSub!: Subscription;

  public fechaDesde: string = "";
  public fechaHasta: string = "";

  public isTableLoading: boolean = false;

  // --- CONFIG: Tabla Principal (Pendientes) ---
  public pendingTableConfig: DynamicTableConfig = {
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
        header: "Nombres y Apellidos",
        type: "text",
        align: "left",
        cssClass: "font-weight-600 align-middle text-dark",
      },
      {
        key: "gradoFormat",
        header: "Grado",
        type: "html",
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "componenteFormat",
        header: "Comp.",
        type: "html",
        align: "center",
        cssClass: "align-middle",
      },
      {
        key: "montoFormat",
        header: "Monto Neto (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
      },
      {
        key: "fecha",
        header: "Fecha Solicitud",
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
        name: "aprobar",
        icon: "fa-check",
        tooltip: "Aprobar Anticipo",
        buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
      },
      {
        name: "rechazar",
        icon: "fa-times",
        tooltip: "Rechazar Anticipo",
        buttonClass: "btn-circular btn-danger-soft shadow-sm ml-2",
      },
      {
        name: "ver",
        icon: "fa-eye",
        tooltip: "Ver Expediente",
        buttonClass: "btn-circular btn-amber-soft shadow-sm ml-2",
      },
    ],
  };

  public pendingTableData: any[] = [];

  // --- CONFIG: Tabla Histórico (Vista Secundaria) ---
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
        key: "idSolicitud",
        header: "# Solicitud",
        type: "text",
        align: "left",
        cssClass: "font-weight-600 px-4 align-middle text-dark",
      },
      {
        key: "concepto",
        header: "Concepto",
        type: "text",
        align: "left",
        cssClass: "align-middle",
      },
      {
        key: "montoFormat",
        header: "Monto Pagado (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
      },
      {
        key: "fecha",
        header: "Fecha Aprobación",
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
  };

  public historyTableData: any[] = [];

  // Ahora inyectamos nuestras dependencias y las pasamos a la clase Base
  constructor(
    protected override apiService: ApiService,
    protected override layoutService: LayoutService,
    private modalService: NgbModal,
    private prestacionesService: PrestacionesSharedService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    private utilService: UtilService,
  ) {
    super(
      apiService,
      layoutService,
      "Principal / Prestaciones: Bandeja de Anticipos",
    );
  }

  // Gancho de inicio desde BaseWorkflowClass
  protected override onInitExtension(): void {
    const today = new Date();
    this.fechaDesde = `${today.getFullYear()}-01-01`;
    this.fechaHasta = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    this.loadMockTabs(); // Aquí podrías hacer: this.loadWorkflowTabs('API_FUNCTION', '1');
    this.loadPendingData();

    this.calculosSub = this.prestacionesService.calculos$.subscribe((data) => {
      if (data) {
        this.calculosData = data;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.calculosSub) {
      this.calculosSub.unsubscribe();
    }
  }

  // Método para simular la carga de tabuladores mientras conectamos DB
  private loadMockTabs(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.workflowTabs = [
        { id: "101", nombre: "Pendientes" },
        { id: "100", nombre: "Aprobados" },
        { id: "102", nombre: "Rechazados" },
        { id: "103", nombre: "Reversadas" },
      ];
      this.currentTabId = "101";
      this.isLoadingData = false;
    }, 500);
  }

  public toggleView(): void {
    this.isNewAnticipoView = !this.isNewAnticipoView;
    if (!this.isNewAnticipoView) {
      this.searchCedula = "";
      this.lastSearchedCedula = "";
      this.militarData = null;
      this.historyTableData = [];
    }
  }

  public calcularPorPorcentaje(): void {
    if (!this.calculosData) return;

    if (this.porcentajeAnticipo > 75) this.porcentajeAnticipo = 75;
    if (this.porcentajeAnticipo < 0) this.porcentajeAnticipo = 0;

    const monto_disponible = Number(
      this.calculosData.base?.depositado_en_banco || 0,
    );
    const anticipos_aux = Number(this.calculosData.movimientos?.anticipo || 0);
    const dem = Number(this.calculosData.movimientos?.embargo || 0);

    const mt = monto_disponible * 0.25;
    const monto_resguardo = dem > mt ? dem - mt : 0;

    const cantidad =
      (monto_disponible * this.porcentajeAnticipo) / 100 -
      anticipos_aux -
      monto_resguardo;

    this.montoAnticipo = cantidad > 0 ? parseFloat(cantidad.toFixed(2)) : 0;
  }

  public calcularPorMonto(): void {
    if (!this.calculosData) return;

    const monto_disponible = Number(
      this.calculosData.base?.depositado_en_banco || 0,
    );
    const anticipos_aux = Number(this.calculosData.movimientos?.anticipo || 0);
    const dem = Number(this.calculosData.movimientos?.embargo || 0);

    const mt = monto_disponible * 0.25;
    const monto_resguardo = dem > mt ? dem - mt : 0;

    const max_cantidad =
      (monto_disponible * 75) / 100 - anticipos_aux - monto_resguardo;

    if (this.montoAnticipo > max_cantidad) {
      this.montoAnticipo =
        max_cantidad > 0 ? parseFloat(max_cantidad.toFixed(2)) : 0;
    }

    if (this.montoAnticipo < 0) this.montoAnticipo = 0;

    let calculoPorcentaje = 0;
    const baseCalculo = monto_disponible / 100;
    if (baseCalculo > 0) {
      calculoPorcentaje =
        ((this.montoAnticipo + anticipos_aux + monto_resguardo) * 100) /
        monto_disponible;
    }

    this.porcentajeAnticipo =
      calculoPorcentaje > 75 ? 75 : parseFloat(calculoPorcentaje.toFixed(2));
  }

  // Eventos interceptados desde el Mailbox Layout
  public onMailboxSearch(term: string): void {
    if (!term) {
      this.pendingTableData = [...this.masterPendingData];
      return;
    }
    const st = term.toLowerCase();
    this.pendingTableData = this.masterPendingData.filter(
      (item) =>
        item.cedula.toLowerCase().includes(st) ||
        item.nombre.toLowerCase().includes(st),
    );
  }

  public onMailboxTabSwitch(tabId: string): void {
    this.masterPendingData = [];
    this.pendingTableData = [];
    this.isTableLoading = true;
    this.cdr.detectChanges();
    this.onTabSwitch(tabId, () => {
      this.loadPendingData();
    });
  }

  public onMailboxRefresh(): void {
    this.loadPendingData();
  }

  public onMailboxSelectAll(checked: boolean): void {
    this.allSelected = checked;
    // La tabla asume selection changes automáticamente dentro
  }

  // ------------------------------------
  // LÓGICA DE DATOS MOCKEADOS
  // ------------------------------------

  public loadPendingData(): void {
    const statusId = this.currentTabId || "101";
    
    // Configurar acciones dinámicamente según el estatus (101 = Pendientes)
    if (statusId === "101") {
      this.pendingTableConfig.actions = [
        {
          name: "aprobar",
          icon: "fa-check",
          tooltip: "Aprobar Anticipo",
          buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
        },
        {
          name: "rechazar",
          icon: "fa-times",
          tooltip: "Rechazar Anticipo",
          buttonClass: "btn-circular btn-danger-soft shadow-sm ml-2",
        },
        {
          name: "ver",
          icon: "fa-eye",
          tooltip: "Ver Expediente",
          buttonClass: "btn-circular btn-amber-soft shadow-sm ml-2",
        },
      ];
    } else {
      this.pendingTableConfig.actions = [
        {
          name: "ver",
          icon: "fa-eye",
          tooltip: "Ver Detalles",
          buttonClass: "btn-circular btn-amber-soft shadow-sm ml-2",
        },
      ];
    }

    const payload = {
      funcion: environment.funcion.CONSULTAR_ORDENES,
      parametros: `${statusId},${this.fechaDesde},${this.fechaHasta}`,
    };

    this.isTableLoading = true;

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        if (data.Cuerpo && data.Cuerpo.length > 0) {
          const rawData = data.Cuerpo;

          const mappedData = rawData.map((item: any) => {
            let fechaStr = item.fecha;
            if (fechaStr) {
              const d = new Date(fechaStr);
              fechaStr = isNaN(d.getTime())
                ? fechaStr
                : `${String(d.getDate()).padStart(2, "0")} ${d
                    .toLocaleString("es-ES", { month: "short" })
                    .replace(".", "")} ${d.getFullYear()}`;
            }

            return {
              ...item,
              cedula: item.cedula_beneficiario,
              nombre:
                `${item.nombres_beneficiario || ""} ${item.apellidos_beneficiario || ""}`.trim(),
              grado: (item.nombre_grado || "").trim(),
              componente: (item.nombre_componente || "").trim(),
              montoBs: item.monto ? parseFloat(item.monto) : 0,
              fecha: fechaStr,
              estatus: item.nombre_anticipo || "PENDIENTE",

              cedulaFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${item.cedula_beneficiario}</span>`,
              gradoFormat: `<span style="color: #64748b; font-weight: 500;">${item.nombre_grado || ""}</span>`,
              componenteFormat: this.getComponentBadge(
                item.nombre_componente || "",
              ),
              montoFormat: `<span class="font-weight-bold" style="color: #0f172a; font-size: 1.05rem;">${(item.monto ? parseFloat(item.monto) : 0).toLocaleString("es-VE")}</span>`,
              estatusFormat: this.getStatusBadge(
                item.nombre_anticipo || "PENDIENTE",
              ),
            };
          });

          this.masterPendingData = [...mappedData];
          this.pendingTableData = [...mappedData];
        } else {
          this.masterPendingData = [];
          this.pendingTableData = [];
        }
        this.isTableLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isTableLoading = false;
        this.cdr.detectChanges();
        console.error("Error al consultar órdenes:", error);
      },
    });
  }

  public cerrarFiltros(): void {
    document.body.click(); // Hack para cerrar dropdown
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
    this.calculosData = null;

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

              // Consultar movimientos
              this.cargarMovimientos();

              // Obtener directivaID modularizado
              this.prestacionesService
                .obtenerDirectivaId(this.searchCedula)
                .subscribe({
                  next: (dirData: any) => {
                    const directivaId =
                      dirData.Cuerpo?.[0]?.directiva_sueldo_id || 1;

                    // Iniciar cálculos de prestaciones
                    this.prestacionesService
                      .iniciarCalculosPrestaciones(
                        directivaId,
                        this.searchCedula,
                      )
                      .subscribe({
                        next: (calcRes) => {},
                        error: (calcErr) =>
                          console.error(
                            "Error en iniciarCalculosPrestaciones:",
                            calcErr,
                          ),
                      });
                  },
                  error: (dirErr) =>
                    console.error("Error obteniendo directiva ID:", dirErr),
                });
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

  private cargarMovimientos(): void {
    this.prestacionesService
      .consultarMovimientos(this.searchCedula, 5)
      .subscribe({
        next: (data: any) => {
          if (data.Cuerpo && data.Cuerpo.length > 0) {
            this.historyTableData = data.Cuerpo.map((item: any) => ({
              idSolicitud: item.id || "ANT-000",
              concepto: item.concepto || "Anticipo",
              montoFormat: `<span class="font-weight-bold text-success" style="font-size: 1.05rem;">Bs ${Number(item.monto || 0).toLocaleString("es-VE")}</span>`,
              fecha: item.f_contable
                ? this.utilService.formatDateDDMMYYYY(item.f_contable)
                : "N/A",
              estatusFormat: this.getStatusBadge(item.estatus || "Aprobado"),
            }));
          } else {
            console.log("No hay movimientos en data.Cuerpo");
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Error HTTP al consultar movimientos", err);
        },
      });
  }

  public mostrarConfirmacionCSV(): void {
    this.modalService.open(this.modalCSV, {
      centered: true,
      size: "md",
      windowClass: "pastel-modal",
    });
  }

  public confirmarCSV(): void {
    const statusName =
      this.workflowTabs.find((t: any) => t.id === this.currentTabId)?.nombre ||
      "Pendientes";
    this.downloadCSV(
      this.pendingTableData,
      `anticipos_${statusName.toLowerCase().replace(/ /g, "_")}.csv`,
    );
    this.modalService.dismissAll();
  }

  public onPendingTableAction(event: any): void {
    this.selectedMilitar = event.row;
    if (event.actionName === "aprobar") {
      this.modalService.open(this.modalAprobar, {
        centered: true,
        size: "md",
        windowClass: "pastel-modal",
      });
    } else if (event.actionName === "rechazar") {
      this.modalService.open(this.modalRechazar, {
        centered: true,
        size: "md",
        windowClass: "pastel-modal",
      });
    } else if (event.actionName === "ver") {
      alert(`Ver expediente de ${event.row.nombre}`);
    }
  }

  public confirmarAprobacion(): void {
    alert(
      `Anticipo de ${this.selectedMilitar?.nombre} aprobado satisfactoriamente.`,
    );
    this.modalService.dismissAll();
  }

  public confirmarRechazo(): void {
    alert(`Anticipo de ${this.selectedMilitar?.nombre} rechazado.`);
    this.modalService.dismissAll();
  }

  public solicitarAnticipo(): void {
    this.modalService.open(this.modalSolicitar, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });
  }

  public procesarSolicitud(): void {
    alert("La nueva solicitud de anticipo fue registrada con éxito.");
    this.modalService.dismissAll();
    this.toggleView();
  }

  public downloadCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;

    const separator = ";";
    const headers = [
      "cedula",
      "nombres",
      "apellidos",
      "status_id",
      "cedula_beneficiario",
      "nombres_beneficiario",
      "apellidos_beneficiario",
      "motivo",
      "emisor",
      "revision",
      "autoriza",
      "estatus_orden",
      "descripcion_orden",
      "movimiento_id",
      "monto",
      "fecha",
      "usr_creacion",
      "usr_modificacion",
      "f_creacion",
      "f_ult_modificacion",
      "porcentaje",
      "nombre_anticipo",
      "descripcion_anticipo",
      "codigo_grado",
      "nombre_grado",
      "codigo_componente",
      "nombre_componente",
    ];

    const csvContent =
      headers.join(separator) +
      "\n" +
      data
        .map((row) => {
          return headers
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join("\n");

    // Adaptación para Sandra Sandbox Bridge
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
    } else {
      // Fallback para cuando no corre dentro de Sandra
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

  // --- UTILS (Badges de UI Pastel) ---
  private getComponentBadge(comp: string): string {
    const colors: any = {
      EJB: "bg-pastel-danger text-danger",
      ARB: "bg-pastel-info text-info",
      AMB: "bg-pastel-primary text-primary",
      GNB: "bg-pastel-success text-success",
    };
    const colorClass = colors[comp] || "bg-light text-muted";
    return `<span class="badge ${colorClass} px-2 py-1 shadow-sm font-weight-bold" style="border-radius: 8px;">${comp}</span>`;
  }

  private getStatusBadge(estatus: string): string {
    if (estatus === "Aprobado" || estatus === "Depositado") {
      return `<span class="badge bg-pastel-success text-success px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-check-circle mr-1"></i> ${estatus}</span>`;
    } else if (estatus === "Pendiente") {
      return `<span class="badge bg-pastel-warning text-warning px-2 py-1 shadow-sm font-weight-600"><i class="fas fa-clock mr-1"></i> ${estatus}</span>`;
    } else if (estatus === "En Revisión") {
      return `<span class="badge px-2 py-1 shadow-sm font-weight-600" style="background-color: #e8f4f4; color: #4a8b89;"><i class="fas fa-search mr-1"></i> ${estatus}</span>`;
    } else {
      return `<span class="badge bg-light text-muted border px-2 py-1 shadow-sm font-weight-600">${estatus}</span>`;
    }
  }
}
