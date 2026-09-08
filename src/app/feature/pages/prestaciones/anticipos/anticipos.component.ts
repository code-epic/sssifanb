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
import { Subscription, lastValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import { IAPICore } from "src/app/core/models/api/api-model";

export interface IAnticipo {
  usr_modificacion?: string;
  emisor?: string;
  porcentaje?: number;
  observacion?: string;
  cedula_afiliado?: string;
  cedula_beneficiario?: string;
  fecha?: string;
  usr_creacion?: string;
  status_id?: number;
  monto?: number;
  apellidos_beneficiario?: string;
  movimiento_id?: number;
  observ_ult_modificacion?: string;
  autoriza?: string;
  tipo_id?: number;
  nombres_beneficiario?: string;
  tipoan?: number;
  revision?: string;
  motivo?: string;
  f_creacion?: string;
  f_ult_modificacion?: string;
}

import { PuntoCuentaComponent } from "./pdf/punto-cuenta.component";
import { CartaBancoComponent } from "./pdf/carta-banco.component";

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
  @ViewChild("puntoCuentaPdf") puntoCuentaPdf!: PuntoCuentaComponent;
  @ViewChild("cartaBancoPdf") cartaBancoPdf!: CartaBancoComponent;

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
    this.fechaDesde = `${today.getFullYear()}-01-01 00:00:00`;
    this.fechaHasta = `${today.getFullYear() + 1}-01-01 00:00:00`;

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

  private getMontoDisponible(): number {
    if (!this.calculosData || !this.calculosData.base) return 0;
    return Number(
      this.calculosData.base.depositado_en_banco ||
        this.calculosData.base.deposito_banco ||
        this.calculosData.base.saldo_disponible ||
        0,
    );
  }

  private getMaxMontoAnticipoDisponible(): number {
    const monto_disponible = this.getMontoDisponible();
    if (monto_disponible <= 0) return 0;

    const anticipos_aux = Number(this.calculosData?.movimientos?.anticipo || 0);
    const dem = Number(this.calculosData?.movimientos?.embargo || 0);

    const mt = monto_disponible * 0.25;
    const monto_resguardo = dem > mt ? dem - mt : 0;

    const max_disponible =
      monto_disponible * 0.75 - anticipos_aux - monto_resguardo;
    return max_disponible > 0 ? parseFloat(max_disponible.toFixed(2)) : 0;
  }

  public calcularPorPorcentaje(): void {
    if (!this.calculosData) return;

    let pct = Number(this.porcentajeAnticipo);
    if (isNaN(pct) || pct <= 0) {
      this.porcentajeAnticipo = 0;
      this.montoAnticipo = 0;
      return;
    }

    const monto_disponible = this.getMontoDisponible();
    if (monto_disponible <= 0) {
      this.porcentajeAnticipo = 0;
      this.montoAnticipo = 0;
      return;
    }

    const max_monto = this.getMaxMontoAnticipoDisponible();
    let montoCalculado = (monto_disponible * pct) / 100;

    if (montoCalculado > max_monto) {
      montoCalculado = max_monto;
      this.porcentajeAnticipo = parseFloat(
        ((max_monto * 100) / monto_disponible).toFixed(2),
      );
    }

    this.montoAnticipo = parseFloat(montoCalculado.toFixed(2));
  }

  public calcularPorMonto(): void {
    if (!this.calculosData) return;

    let monto = Number(this.montoAnticipo);
    if (isNaN(monto) || monto <= 0) {
      this.porcentajeAnticipo = 0;
      return;
    }

    const monto_disponible = this.getMontoDisponible();
    if (monto_disponible <= 0) {
      this.montoAnticipo = 0;
      this.porcentajeAnticipo = 0;
      return;
    }

    const max_monto = this.getMaxMontoAnticipoDisponible();

    if (monto > max_monto) {
      monto = max_monto;
      this.montoAnticipo = monto;
    }

    const pct = (monto * 100) / monto_disponible;
    this.porcentajeAnticipo = parseFloat(pct.toFixed(2));
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
      ];
    } else if (statusId === "100") {
      this.pendingTableConfig.actions = [
        {
          name: "cartaBanco",
          icon: "fa-file-pdf",
          tooltip: "Carta a Banco",
          buttonClass: "btn-circular btn-info-soft shadow-sm ml-2",
        },
        {
          name: "ver",
          icon: "fa-eye",
          tooltip: "Ver Detalles",
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

              cedulaFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${this.formatCedula(item.cedula_beneficiario)}</span>`,
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
    if (
      this.searchCedula === this.lastSearchedCedula &&
      this.militarData &&
      this.calculosData
    ) {
      return;
    }

    this.isSearching = true;
    this.lastSearchedCedula = this.searchCedula;
    this.militarData = null;
    this.historyTableData = [];
    this.calculosData = null;
    this.porcentajeAnticipo = 0;
    this.montoAnticipo = 0;

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

              // Consultar movimientos
              this.cargarMovimientos();

              // Obtener directivaID y gradoID modularizado (similar a identificación)
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

                    // Iniciar cálculos de prestaciones enviando directivaId y gradoId
                    this.prestacionesService
                      .iniciarCalculosPrestaciones(
                        directivaId,
                        this.searchCedula,
                        "",
                        gradoId,
                      )
                      .subscribe({
                        next: (calcRes) => {
                          console.log(
                            "fnx registrado exitosamente para cálculos:",
                            calcRes,
                          );
                        },
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

  public async generarCartaBanco(item?: any): Promise<void> {
    if (!this.cartaBancoPdf) return;

    try {
      const list = item ? [item] : [...(this.pendingTableData || [])];
      if (list.length === 0) return;

      // Enriquecer registros consultando por cédula si faltan datos del militar (grado, componente, nombre)
      const promises = list.map(async (row) => {
        const cedula = row.cedula_beneficiario || row.cedula_afiliado || row.cedula;
        if (!cedula) return row;

        if (
          !row.grado ||
          !row.componente ||
          !row.nombre ||
          row.grado === "N/D" ||
          row.componente === "FANB"
        ) {
          try {
            const res = await lastValueFrom(
              this.prestacionesService.buscarMilitarPorCedula(cedula)
            );
            const militarData = Array.isArray(res) ? res[0] : res;
            if (militarData) {
              const datobasico = militarData.persona?.datobasico || {};
              const nombreFull =
                datobasico.nombrecompleto ||
                `${datobasico.nombres || ""} ${datobasico.apellidos || ""}`.trim();
              const gradoDesc =
                militarData.grado?.descripcion || militarData.nombre_grado || row.grado;
              const compDesc =
                militarData.componente?.descripcion || militarData.nombre_componente || row.componente;

              return {
                ...row,
                nombre: nombreFull || row.nombre,
                nombres_beneficiario: datobasico.nombres || row.nombres_beneficiario,
                apellidos_beneficiario: datobasico.apellidos || row.apellidos_beneficiario,
                grado: gradoDesc || row.grado,
                nombre_grado: gradoDesc || row.nombre_grado,
                componente: compDesc || row.componente,
                nombre_componente: compDesc || row.nombre_componente,
              };
            }
          } catch (e) {
            console.warn("No se pudo consultar detalle del militar para cédula:", cedula, e);
          }
        }
        return row;
      });

      const enrichedList = await Promise.all(promises);
      await this.cartaBancoPdf.generarPDFCartaBanco(enrichedList);
    } catch (e) {
      console.error("Error generando Carta a Banco Memorandum:", e);
    }
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
    } else if (event.actionName === "cartaBanco") {
      this.generarCartaBanco(event.row);
    } else if (event.actionName === "ver") {
      alert(`Ver detalles de ${event.row.nombre || event.row.nombres_beneficiario || 'solicitud'}`);
    }
  }

  public async cargarDatosYPuntoCuenta(orden: any): Promise<void> {
    if (!this.puntoCuentaPdf || !orden) return;

    const cedula =
      orden.cedula_beneficiario || orden.cedula_afiliado || orden.cedula || "";

    let militarObj = this.militarData;
    let calculosObj = this.calculosData;

    const mCedula = militarObj?.cedula || militarObj?.persona?.datobasico?.cedula;
    const isSameCedula = mCedula && String(mCedula) === String(cedula);

    if (!isSameCedula) {
      militarObj = null;
      calculosObj = null;
      if (cedula) {
        try {
          const resMilitar = await lastValueFrom(
            this.prestacionesService.buscarMilitarPorCedula(cedula)
          );
          militarObj = Array.isArray(resMilitar) ? resMilitar[0] : resMilitar;
        } catch (e) {
          console.warn("No se pudo obtener militarData para Punto de Cuenta:", e);
        }
      }
    }

    if (!calculosObj && cedula) {
      try {
        const dirData: any = await lastValueFrom(
          this.prestacionesService.obtenerDirectivaId(cedula)
        );
        const directivaObj = dirData?.Cuerpo?.[0];
        const directivaId = directivaObj?.directiva_sueldo_id || 1;
        const gradoId =
          directivaObj?.grado_id ||
          militarObj?.grado_id ||
          militarObj?.grado?.id;

        const calculoPromise = new Promise<any>((resolve) => {
          const sub = this.prestacionesService.calculos$.subscribe((data) => {
            sub.unsubscribe();
            resolve(data);
          });
          setTimeout(() => {
            sub.unsubscribe();
            resolve(null);
          }, 3500);
        });

        this.prestacionesService
          .iniciarCalculosPrestaciones(directivaId, cedula, "", gradoId)
          .subscribe();

        calculosObj = await calculoPromise;
      } catch (e) {
        console.warn("No se pudieron obtener cálculos para Punto de Cuenta:", e);
      }
    }

    await this.puntoCuentaPdf.generarPDFPuntoCuenta(orden, militarObj, calculosObj);
  }

  public async confirmarAprobacion(): Promise<void> {
    const militar = this.selectedMilitar;
    this.modalService.dismissAll();

    try {
      await this.cargarDatosYPuntoCuenta(militar);
    } catch (e) {
      console.error("Error generando PDF de Punto de Cuenta:", e);
    }
  }

  public confirmarRechazo(): void {
    alert(`Anticipo de ${this.selectedMilitar?.nombre} rechazado.`);
    this.modalService.dismissAll();
  }

  public solicitarAnticipo(): void {
    this.porcentajeAnticipo = 0;
    this.montoAnticipo = 0;
    this.motivoAnticipo = "";
    this.cdr.detectChanges();
    this.modalService.open(this.modalSolicitar, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });
  }

  public procesarSolicitud(): void {
    this.insertarAnticipo();
  }

  public get anticipoData(): IAnticipo {
    const now = new Date();
    const fechaDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timestampStr = `${fechaDate} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const cedula = this.militarData?.cedula || this.searchCedula || "";
    const datobasico = this.militarData?.persona?.datobasico || {};
    const nombres = (
      datobasico.nombres ||
      datobasico.nombrecompleto ||
      this.militarData?.nombres ||
      ""
    ).trim();
    const apellidos = (
      datobasico.apellidos ||
      datobasico.apellidocompleto ||
      this.militarData?.apellidos ||
      ""
    ).trim();
    const usuario =
      this.loginService.Usuario?.usuario ||
      this.loginService.Usuario?.login ||
      "SYSTEM";

    const motivosMap: { [key: string]: string } = {
      "1": "Adquisición de Vivienda",
      "2": "Reparación de Vivienda",
      "3": "Gastos Médicos Mayores",
      "4": "Educación",
    };
    const motivoTexto =
      motivosMap[this.motivoAnticipo] || this.motivoAnticipo || "";

    return {
      usr_modificacion: "",
      emisor: "",
      porcentaje: Math.round(this.porcentajeAnticipo || 0),
      observacion: "",
      cedula_afiliado: cedula,
      cedula_beneficiario: cedula,
      fecha: fechaDate,
      usr_creacion: usuario,
      status_id: 101,
      monto: Number(this.montoAnticipo || 0),
      apellidos_beneficiario: apellidos,
      movimiento_id: 5,
      observ_ult_modificacion: "",
      autoriza: "",
      tipo_id: 1,
      nombres_beneficiario: nombres,
      tipoan: 1,
      revision: "",
      motivo: motivoTexto,
      f_creacion: timestampStr,
      f_ult_modificacion: timestampStr,
    };
  }

  public insertarAnticipo(): void {
    if (!this.militarData) {
      alert("No se han cargado los datos del militar.");
      return;
    }

    if (!this.motivoAnticipo) {
      alert("Por favor seleccione un motivo para el anticipo.");
      return;
    }

    if (!this.montoAnticipo || this.montoAnticipo <= 0) {
      alert("Por favor ingrese un monto válido para el anticipo.");
      return;
    }

    this.xAPI = {} as IAPICore;
    this.xAPI.funcion = environment.funcion.INSERTAR_ORDEN;
    this.xAPI.valores = JSON.stringify(this.anticipoData);

    console.log(this.xAPI.valores);
    this.apiService.post("crud", this.xAPI).subscribe({
      next: (data: any) => {
        alert("La nueva solicitud de anticipo fue registrada con éxito.");
        this.modalService.dismissAll();
        this.toggleView();
        this.loadPendingData();
      },
      error: (err: any) => {
        console.error("Error al registrar anticipo:", err);
        alert("Ocurrió un error al registrar la solicitud de anticipo.");
      },
    });
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
