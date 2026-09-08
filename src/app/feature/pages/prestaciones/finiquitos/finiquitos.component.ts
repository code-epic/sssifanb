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

export interface IFiniquito {
  usr_modificacion?: string;
  emisor?: string;
  revision?: string;
  observacion?: string;
  cedula_afiliado?: string;
  cedula_beneficiario?: string;
  fecha?: string;
  usr_creacion?: string;
  status_id?: number;
  monto?: number;
  nombres_beneficiario?: string;
  apellidos_beneficiario?: string;
  motivo?: string;
  partida?: string;
  deuda?: number;
  intereses?: number;
  f_retiro?: string;
  tipo_id?: number;
  f_creacion?: string;
  f_ult_modificacion?: string;
  observ_ult_modificacion?: string;
  autoriza?: string;
}

@Component({
  selector: "app-prest-finiquitos",
  templateUrl: "./finiquitos.component.html",
  styleUrls: ["./finiquitos.component.scss"],
})
export class FiniquitosComponent
  extends BaseWorkflowClass
  implements OnDestroy
{
  onMailboxSelectAll($event: boolean) {
    throw new Error("Method not implemented.");
  }
  @ViewChild("modalAprobar") modalAprobar!: TemplateRef<any>;
  @ViewChild("modalRechazar") modalRechazar!: TemplateRef<any>;
  @ViewChild("modalCSV") modalCSV!: TemplateRef<any>;
  @ViewChild("modalSolicitar") modalSolicitar!: TemplateRef<any>;

  public isNewFiniquitoView: boolean = false;
  public searchCedula: string = "";
  private lastSearchedCedula: string = "";
  public militarData: any = null;

  private masterPendingData: any[] = [];
  public isSearching: boolean = false;
  public calculosData: any = null;
  private calculosSub!: Subscription;

  public fechaDesde: string = "";
  public fechaHasta: string = "";

  public isTableLoading: boolean = false;

  // Campos para nuevo Finiquito
  public partidaPresupuestaria: string = "01.01.02.01";
  public motivoFiniquito: string = "RETIRO POR TIEMPO DE SERVICIO";
  public observacion: string = "";
  public montoDeuda: number = 0;
  public montoRecuperar: number = 0;
  public ajusteIntereses: number = 0;
  public fechaRetiro: string = "";

  public get totalAsignacionAntiguedad(): number {
    return Number(this.calculosData?.base?.asignacion_antiguedad || 0);
  }

  public get totalDepositadoBanco(): number {
    return Number(
      this.calculosData?.base?.depositado_en_banco ||
        this.calculosData?.base?.deposito_banco ||
        0,
    );
  }

  public get totalEmbargos(): number {
    return Number(
      this.calculosData?.base?.total_embargo ||
        this.calculosData?.movimientos?.embargos ||
        0,
    );
  }

  public get totalAnticipos(): number {
    return Number(this.calculosData?.movimientos?.anticipo || 0);
  }

  public get montoDiferencia(): number {
    const diff = this.totalAsignacionAntiguedad - this.totalDepositadoBanco;
    return diff > 0 ? diff : 0;
  }

  public get montoNetoLiquidado(): number {
    const base =
      this.totalDepositadoBanco > 0
        ? this.totalDepositadoBanco
        : this.totalAsignacionAntiguedad;
    const neto =
      base +
      this.montoDiferencia +
      (Number(this.ajusteIntereses) || 0) -
      ((Number(this.montoDeuda) || 0) +
        (Number(this.montoRecuperar) || 0) +
        this.totalEmbargos);
    return neto > 0 ? neto : 0;
  }

  // --- CONFIG: Tabla Principal (Finiquitos Pendientes) ---
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
        header: "Monto Liquidado (Bs)",
        type: "html",
        align: "right",
        cssClass: "align-middle pr-4",
      },
      {
        key: "fecha",
        header: "Fecha Finiquito",
        type: "text",
        align: "center",
        cssClass: "text-muted align-middle",
      },
      {
        key: "motivo",
        header: "Motivo / Concepto",
        type: "text",
        align: "left",
        cssClass: "align-middle text-muted",
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
        tooltip: "Aprobar Finiquito",
        buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
      },
      {
        name: "rechazar",
        icon: "fa-times",
        tooltip: "Rechazar Finiquito",
        buttonClass: "btn-circular btn-danger-soft shadow-sm ml-2",
      },
    ],
  };

  public pendingTableData: any[] = [];

  // --- CONFIG: Tabla Histórico ---
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
        header: "# Finiquito",
        type: "text",
        align: "center",
        cssClass: "font-weight-bold text-muted",
      },
      {
        key: "fechaFormat",
        header: "Fecha",
        type: "text",
        align: "center",
      },
      {
        key: "motivo",
        header: "Motivo",
        type: "text",
        align: "left",
      },
      {
        key: "montoFormat",
        header: "Monto Total (Bs.)",
        type: "html",
        align: "right",
        cssClass: "font-weight-bold text-dark pr-4",
      },
      {
        key: "estatusFormat",
        header: "Estatus",
        type: "html",
        align: "center",
      },
    ],
  };

  public historyTableData: any[] = [];
  public selectedMilitar: any = null;

  constructor(
    protected override apiService: ApiService,
    protected override layoutService: LayoutService,
    private modalService: NgbModal,
    private prestacionesService: PrestacionesSharedService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    private utilService: UtilService,
  ) {
    super(apiService, layoutService, "Principal / Prestaciones: Finiquitos");
  }

  protected override onInitExtension(): void {
    const today = new Date();
    this.fechaDesde = `${today.getFullYear()}-01-01 00:00:00`;
    this.fechaHasta = `${today.getFullYear() + 1}-01-01 00:00:00`;

    this.loadMockTabs();
    this.loadPendingData();

    this.calculosSub = this.prestacionesService.calculos$.subscribe(
      (calcResult) => {
        if (calcResult) {
          this.calculosData = calcResult;
          this.cdr.markForCheck();
        }
      },
    );
  }

  ngOnDestroy(): void {
    if (this.calculosSub) {
      this.calculosSub.unsubscribe();
    }
  }

  private loadMockTabs(): void {
    this.isLoadingData = true;
    setTimeout(() => {
      this.workflowTabs = [
        { id: "101", nombre: "Pendientes" },
        { id: "100", nombre: "Procesados" },
        { id: "102", nombre: "Rechazados" },
        { id: "103", nombre: "Reversados" },
      ];
      this.currentTabId = "101";
      this.isLoadingData = false;
    }, 500);
  }

  public toggleView(): void {
    this.isNewFiniquitoView = !this.isNewFiniquitoView;
    if (!this.isNewFiniquitoView) {
      this.searchCedula = "";
      this.lastSearchedCedula = "";
      this.militarData = null;
      this.historyTableData = [];
    }
  }

  public formatCedula(cedula: any): string {
    if (!cedula) return "";
    const str = String(cedula).trim();
    const match = str.match(/^([VvEeJjGgP-]+)?\s*(\d+)$/);
    if (match) {
      const prefix = match[1] ? match[1].toUpperCase() + "-" : "";
      const num = Number(match[2]);
      return prefix + num.toLocaleString("de-DE");
    }
    const cleanNum = str.replace(/\D/g, "");
    if (cleanNum) {
      return Number(cleanNum).toLocaleString("de-DE");
    }
    return str;
  }

  public formatNombreCompleto(item: any): string {
    if (!item) return "";
    const nomBen = (item.nombres_beneficiario || item.nombres || "").trim();
    const apeBen = (item.apellidos_beneficiario || item.apellidos || "").trim();

    if (!nomBen && !apeBen) return "";
    if (!apeBen) return nomBen;
    if (!nomBen) return apeBen;

    if (nomBen.toUpperCase().includes(apeBen.toUpperCase())) {
      return nomBen;
    }

    return `${nomBen} ${apeBen}`;
  }

  public loadPendingData(): void {
    const statusId = this.currentTabId || "101";

    if (statusId === "102" || statusId === "103") {
      this.pendingTableConfig.columns = [
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
          key: "observacionFormat",
          header: "Motivo / Observación",
          type: "html",
          align: "left",
          cssClass: "align-middle",
        },
        {
          key: "montoFormat",
          header: "Monto Liquidado (Bs)",
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
      ];
    } else {
      this.pendingTableConfig.columns = [
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
          header: "Monto Liquidado (Bs)",
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
      ];
    }

    if (statusId === "101") {
      this.pendingTableConfig.actions = [
        {
          name: "aprobar",
          icon: "fa-check",
          tooltip: "Aprobar Finiquito",
          buttonClass: "btn-circular btn-success-soft shadow-sm ml-2",
        },
        {
          name: "rechazar",
          icon: "fa-times",
          tooltip: "Rechazar Finiquito",
          buttonClass: "btn-circular btn-danger-soft shadow-sm ml-2",
        },
      ];
    } else if (statusId === "100") {
      this.pendingTableConfig.actions = [
        {
          name: "reversar",
          icon: "fa-history",
          tooltip: "Reversar Finiquito",
          buttonClass: "btn-circular btn-warning-soft shadow-sm ml-2",
        },
      ];
    } else {
      this.pendingTableConfig.actions = [];
    }

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

    const payload = {
      funcion: environment.funcion.CONSULTAR_ORDENES,
      parametros: `${statusId},${fDesde},${fHasta}`,
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

            const obsTexto = (item.observacion || item.observ_ult_modificacion || "").trim() || "N/A";

            return {
              ...item,
              cedula: item.cedula_beneficiario || item.cedula,
              nombre: this.formatNombreCompleto(item),
              grado: (item.nombre_grado || "").trim(),
              componente: (item.nombre_componente || "").trim(),
              motivo:
                item.motivo || item.observacion || "FINIQUITO DE PRESTACIONES",
              montoBs: item.monto ? parseFloat(item.monto) : 0,
              fecha: fechaStr,
              estatus: item.nombre_anticipo || "PENDIENTE",

              cedulaFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${this.formatCedula(item.cedula_beneficiario)}</span>`,
              gradoFormat: `<span style="color: #64748b; font-weight: 500;">${item.nombre_grado || ""}</span>`,
              componenteFormat: this.getComponentBadge(
                item.nombre_componente || "",
              ),
              observacionFormat: `<span class="badge badge-pill bg-light text-muted border font-weight-500 text-wrap text-left py-1 px-2" style="font-size: 0.8rem; max-width: 220px; line-height: 1.3;">${obsTexto}</span>`,
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
        console.error("Error al consultar finiquitos:", error);
      },
    });
  }

  public buscarMilitar(): void {
    if (!this.searchCedula || this.isSearching) return;

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
              this.militarData = Array.isArray(data) ? data[0] : data;
              if (this.militarData.fingreso) {
                this.militarData.fingreso = this.utilService.formatDate(
                  this.militarData.fingreso,
                );
              }

              this.cargarMovimientos();

              this.prestacionesService
                .obtenerDirectivaId(this.searchCedula)
                .subscribe({
                  next: (dirData: any) => {
                    const directivaObj = dirData.Cuerpo?.[0];
                    const directivaId = directivaObj?.directiva_sueldo_id || 1;
                    const gradoId =
                      directivaObj?.grado_id ||
                      this.militarData?.grado_id ||
                      this.militarData?.grado?.id;

                    this.prestacionesService
                      .iniciarCalculosPrestaciones(
                        directivaId,
                        this.searchCedula,
                        "",
                        gradoId,
                      )
                      .subscribe({
                        next: (calcRes) =>
                          console.log("Cálculos finiquito iniciados:", calcRes),
                        error: (calcErr) =>
                          console.error("Error cálculos finiquito:", calcErr),
                      });
                  },
                });
            } else {
              alert("No se encontraron resultados para la cédula ingresada.");
            }
          } catch (e) {
            console.error("Excepción al buscar militar para finiquito:", e);
          }
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSearching = false;
          alert("Ocurrió un error al buscar la cédula.");
          this.cdr.markForCheck();
        },
      });
  }

  private cargarMovimientos(): void {
    this.prestacionesService
      .consultarMovimientos(this.searchCedula, 6)
      .subscribe({
        next: (movData: any) => {
          if (movData.Cuerpo && movData.Cuerpo.length > 0) {
            this.historyTableData = movData.Cuerpo.map(
              (item: any, idx: number) => ({
                idSolicitud: `#FIN-${item.id || idx + 1}`,
                fechaFormat: item.fecha ? item.fecha.split(" ")[0] : "N/D",
                motivo: item.motivo || "FINIQUITO DE PRESTACIONES",
                montoFormat: `<span class="text-dark font-weight-bold">Bs. ${(item.monto ? parseFloat(item.monto) : 0).toLocaleString("es-VE")}</span>`,
                estatusFormat: this.getStatusBadge(
                  item.nombre_anticipo || "PROCESADO",
                ),
              }),
            );
          } else {
            this.historyTableData = [];
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Error al cargar movimientos de finiquito:", err);
          this.historyTableData = [];
          this.cdr.markForCheck();
        },
      });
  }

  public onMailboxSearch(query: string): void {
    if (!query || query.trim() === "") {
      this.pendingTableData = [...this.masterPendingData];
      return;
    }
    const cleanQuery = query.toLowerCase().trim();
    this.pendingTableData = this.masterPendingData.filter(
      (item) =>
        (item.cedula && item.cedula.toLowerCase().includes(cleanQuery)) ||
        (item.nombre && item.nombre.toLowerCase().includes(cleanQuery)) ||
        (item.componente && item.componente.toLowerCase().includes(cleanQuery)),
    );
  }

  public onMailboxTabSwitch(tabId: string): void {
    this.currentTabId = tabId;
    this.loadPendingData();
  }

  public onMailboxRefresh(): void {
    this.loadPendingData();
  }

  public mostrarConfirmacionCSV(): void {
    this.modalService.open(this.modalCSV, {
      centered: true,
      size: "md",
      windowClass: "pastel-modal",
    });
  }

  public downloadCSV(data: any[], filename: string): void {
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
      "monto",
      "fecha",
      "usr_creacion",
      "usr_modificacion",
      "nombre_grado",
      "nombre_componente",
    ];

    const csvContent =
      headers.join(separator) +
      "\n" +
      data
        .map((row) => {
          return headers
            .map((k) => {
              let val = row[k] === null || row[k] === undefined ? "" : row[k];
              val = String(val).replace(/"/g, '""');
              return `"${val}"`;
            })
            .join(separator);
        })
        .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public confirmarCSV(): void {
    const statusName =
      this.workflowTabs.find((t: any) => t.id === this.currentTabId)?.nombre ||
      "Pendientes";
    this.downloadCSV(
      this.pendingTableData,
      `finiquitos_${statusName.toLowerCase().replace(/ /g, "_")}.csv`,
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
      alert(`Ver detalles del finiquito de ${event.row.nombre}`);
    }
  }

  public confirmarAprobacion(): void {
    alert(
      `Finiquito de ${this.selectedMilitar?.nombre} aprobado exitosamente.`,
    );
    this.modalService.dismissAll();
  }

  public confirmarRechazo(): void {
    alert(`Finiquito de ${this.selectedMilitar?.nombre} rechazado.`);
    this.modalService.dismissAll();
  }

  public solicitarFiniquito(): void {
    this.observacion = "";
    this.montoDeuda = 0;
    this.montoRecuperar = 0;
    this.modalService.open(this.modalSolicitar, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });
  }

  public procesarSolicitud(): void {
    this.insertarFiniquito();
  }

  public get finiquitoData(): IFiniquito {
    const now = new Date();
    const fechaDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timestampStr = `${fechaDate} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const cedulaStr =
      this.militarData?.persona?.datobasico?.cedula ||
      this.militarData?.cedula ||
      this.searchCedula ||
      "";
    const nombresStr =
      this.militarData?.persona?.datobasico?.nombres ||
      this.militarData?.nombres ||
      "";
    const apellidosStr =
      this.militarData?.persona?.datobasico?.apellidos ||
      this.militarData?.apellidos ||
      "";
    const usrName = this.loginService.Usuario?.usuario || "SISTEMA";

    const totalMonto =
      this.montoNetoLiquidado ||
      this.calculosData?.base?.asignacion_antiguedad ||
      this.calculosData?.base?.depositado_en_banco ||
      0;

    return {
      cedula_beneficiario: cedulaStr,
      cedula_afiliado: cedulaStr,
      nombres_beneficiario: nombresStr,
      apellidos_beneficiario: apellidosStr,
      emisor: "IPSFA",
      revision: usrName,
      autoriza: usrName,
      motivo: this.motivoFiniquito || "FINIQUITO DE PRESTACIONES",
      status_id: 101,
      monto: Number(totalMonto),
      fecha: fechaDate,
      observacion:
        this.observacion || "LIQUIDACIÓN DEFINITIVA DE PRESTACIONES SOCIALES",
      tipo_id: 6,
      f_creacion: timestampStr,
      usr_creacion: usrName,
      f_ult_modificacion: timestampStr,
      usr_modificacion: usrName,
      observ_ult_modificacion: "SOLICITUD INICIAL DE FINIQUITO",
      partida: this.partidaPresupuestaria,
      deuda: Number(this.montoDeuda) || 0,
      intereses: Number(this.ajusteIntereses) || 0,
      f_retiro: this.fechaRetiro || fechaDate,
    };
  }

  public insertarFiniquito(): void {
    const payload = {
      valores: JSON.stringify(this.finiquitoData),
      funcion: environment.funcion.INSERTAR_ORDEN,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (res: any) => {
        this.modalService.dismissAll();
        alert("Finiquito procesado e insertado exitosamente.");
        this.toggleView();
        this.loadPendingData();
      },
      error: (err) => {
        console.error("Error insertando finiquito:", err);
        alert("Ocurrió un error al procesar el finiquito.");
      },
    });
  }

  private getComponentBadge(comp: string): string {
    const c = comp.toUpperCase();
    if (c.includes("EJÉRCITO") || c.includes("EJERCITO") || c.includes("EJ")) {
      return `<span class="badge badge-pill bg-success-soft text-success font-weight-600 px-3 py-1">EJÉRCITO</span>`;
    }
    if (c.includes("ARMADA") || c.includes("AR")) {
      return `<span class="badge badge-pill bg-info-soft text-info font-weight-600 px-3 py-1">ARMADA</span>`;
    }
    if (c.includes("AVIACIÓN") || c.includes("AVIACION") || c.includes("AM")) {
      return `<span class="badge badge-pill bg-primary-soft text-primary font-weight-600 px-3 py-1">AVIACIÓN</span>`;
    }
    if (c.includes("GUARDIA") || c.includes("GN")) {
      return `<span class="badge badge-pill bg-warning-soft text-warning font-weight-600 px-3 py-1">GUARDIA</span>`;
    }
    return `<span class="badge badge-pill bg-secondary-soft text-secondary font-weight-600 px-3 py-1">${comp || "FANB"}</span>`;
  }

  private getStatusBadge(status: string): string {
    const s = status.toUpperCase();
    if (s.includes("PROCESADO") || s.includes("APROBADO") || s === "100") {
      return `<span class="badge badge-pill bg-emerald-soft text-emerald font-weight-bold px-3 py-1"><i class="fas fa-check-circle mr-1"></i> APROBADO</span>`;
    }
    if (s.includes("RECHAZADO") || s === "102") {
      return `<span class="badge badge-pill bg-danger-soft text-danger font-weight-bold px-3 py-1"><i class="fas fa-times-circle mr-1"></i> RECHAZADO</span>`;
    }
    return `<span class="badge badge-pill bg-amber-soft text-amber font-weight-bold px-3 py-1"><i class="fas fa-clock mr-1"></i> PENDIENTE</span>`;
  }
}
