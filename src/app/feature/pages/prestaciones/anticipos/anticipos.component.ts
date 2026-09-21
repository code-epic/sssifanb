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
import Swal from "sweetalert2";

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
  @ViewChild("modalReversar") modalReversar!: TemplateRef<any>;
  @ViewChild("modalCSV") modalCSV!: TemplateRef<any>;
  @ViewChild("modalSolicitar") modalSolicitar!: TemplateRef<any>;
  @ViewChild("puntoCuentaPdf") puntoCuentaPdf!: PuntoCuentaComponent;
  @ViewChild("cartaBancoPdf") cartaBancoPdf!: CartaBancoComponent;

  public isNewAnticipoView: boolean = false;
  public searchCedula: string = "";
  private lastSearchedCedula: string = "";
  public militarData: any = null;
  public selectedMilitar: any = null;

  public motivoRechazoSelect: string = "Documentación Incompleta";
  public observacionRechazo: string = "";
  public motivoReversadoSelect: string = "Error en Cálculo o Monto Aprobado";
  public observacionReversado: string = "";
  public isProcessingAction: boolean = false;

  public porcentajeAnticipo: number = 0;
  public montoAnticipo: number = 0;
  public motivoAnticipo: string = "";
  public intentoProcesar: boolean = false;
  private timerValidacionMonto: any = null;
  private timerValidacionPorcentaje: any = null;

  private masterPendingData: any[] = [];
  public isSearching: boolean = false;
  public calculosData: any = null;
  private calculosSub!: Subscription;

  public fechaDesde: string = "";
  public fechaHasta: string = "";

  public filtroComponente: string = "";
  public filtroGrado: string = "";
  public gradosDisponibles: string[] = [];

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
    if (this.timerValidacionMonto) {
      clearTimeout(this.timerValidacionMonto);
      this.timerValidacionMonto = null;
    }
    if (this.timerValidacionPorcentaje) {
      clearTimeout(this.timerValidacionPorcentaje);
      this.timerValidacionPorcentaje = null;
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

  public getSaldoDisponible(): number {
    if (!this.calculosData) return 0;
    const base = this.calculosData.base;
    return Number(
      base?.saldo_disponible ??
        this.calculosData.saldo_disponible ??
        base?.depositado_en_banco ??
        base?.deposito_banco ??
        0,
    );
  }

  public getMontoDisponible(): number {
    return this.getSaldoDisponible();
  }

  public getMaxMontoAnticipoDisponible(): number {
    const saldo_disponible = this.getSaldoDisponible();
    if (saldo_disponible <= 0) return 0;

    const dem = Number(this.calculosData?.movimientos?.embargo || 0);

    const mt = saldo_disponible * 0.25;
    const monto_resguardo = dem > mt ? dem - mt : 0;

    const max_disponible = saldo_disponible * 0.75 - monto_resguardo;
    return max_disponible > 0 ? parseFloat(max_disponible.toFixed(2)) : 0;
  }

  public get militarNombreCompleto(): string {
    if (!this.militarData) return "";
    const db = this.militarData.persona?.datobasico;
    if (db?.nombrecompleto) return db.nombrecompleto;
    return this.formatNombreCompleto(this.militarData);
  }

  public get militarCedula(): string {
    const raw =
      this.militarData?.persona?.datobasico?.cedula ||
      this.militarData?.cedula ||
      this.searchCedula ||
      "";
    return this.formatCedula(raw);
  }

  public get militarGrado(): string {
    return (
      this.militarData?.grado?.descripcion ||
      this.militarData?.nombre_grado ||
      ""
    ).trim();
  }

  public get militarComponente(): string {
    return (
      this.militarData?.componente?.descripcion ||
      this.militarData?.nombre_componente ||
      ""
    ).trim();
  }

  public onPorcentajeInput(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    let val = input.value;

    // Elimina ceros a la izquierda cuando se transcriba (ej: "075" -> "75", "05" -> "5")
    if (/^0+[1-9]/.test(val)) {
      val = val.replace(/^0+/, "");
      input.value = val;
    } else if (val === "00") {
      val = "0";
      input.value = val;
    }

    let num = Number(val);
    // Si excede el 75%, que no pase de 75
    if (num > 75) {
      input.value = "75";
      this.porcentajeAnticipo = 75;
      this.validarYNotificarPorPorcentaje();
      return;
    }

    this.porcentajeAnticipo = isNaN(num) ? 0 : num;
    this.calcularPorPorcentaje();
  }

  public calcularPorPorcentaje(): void {
    if (!this.calculosData) return;

    // Normalizar ceros a la izquierda
    let rawVal = String(this.porcentajeAnticipo ?? "").trim();
    if (/^0+[1-9]/.test(rawVal)) {
      rawVal = rawVal.replace(/^0+/, "");
      this.porcentajeAnticipo = Number(rawVal);
    }

    let pct = Number(this.porcentajeAnticipo);
    if (isNaN(pct) || pct <= 0) {
      this.porcentajeAnticipo = 0;
      this.montoAnticipo = 0;
      return;
    }

    // Que no pase del 75%
    if (pct > 75) {
      this.porcentajeAnticipo = 75;
      pct = 75;
      this.validarYNotificarPorPorcentaje();
    }

    const saldo_disponible = this.getSaldoDisponible();
    if (saldo_disponible <= 0) {
      this.porcentajeAnticipo = 0;
      this.montoAnticipo = 0;
      return;
    }

    let montoCalculado = (saldo_disponible * pct) / 100;
    this.montoAnticipo = parseFloat(montoCalculado.toFixed(2));

    if (this.timerValidacionPorcentaje) {
      clearTimeout(this.timerValidacionPorcentaje);
      this.timerValidacionPorcentaje = null;
    }
  }

  public validarYNotificarPorPorcentaje(): boolean {
    if (this.timerValidacionPorcentaje) {
      clearTimeout(this.timerValidacionPorcentaje);
      this.timerValidacionPorcentaje = null;
    }

    if (!this.calculosData) return true;

    const saldo_disponible = this.getSaldoDisponible();
    const max_monto = this.getMaxMontoAnticipoDisponible();
    let pct = Number(this.porcentajeAnticipo);

    if (pct > 75) {
      const pctExcedido = pct;
      this.porcentajeAnticipo = 75;
      this.montoAnticipo = max_monto;
      this.cdr.detectChanges();

      this.mostrarAlertaLimiteExcedido(
        "Porcentaje Superior al Límite Legal",
        `El porcentaje ingresado (<strong>${pctExcedido}%</strong>) supera el tope máximo establecido del <strong>75%</strong> sobre el saldo disponible.`,
        `Se ha ajustado automáticamente al porcentaje máximo permitido por ley (<strong>75%</strong> equivalente a <strong>Bs. ${max_monto.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>).`
      );
      return false;
    }
    return true;
  }

  public calcularPorMonto(): void {
    if (!this.calculosData) return;

    let monto = Number(this.montoAnticipo);
    if (isNaN(monto) || monto <= 0) {
      this.porcentajeAnticipo = 0;
      return;
    }

    const saldo_disponible = this.getSaldoDisponible();
    if (saldo_disponible <= 0) {
      this.montoAnticipo = 0;
      this.porcentajeAnticipo = 0;
      return;
    }

    const max_monto = this.getMaxMontoAnticipoDisponible();
    let pct = (monto * 100) / saldo_disponible;
    this.porcentajeAnticipo = parseFloat(pct.toFixed(2));

    if (this.timerValidacionMonto) {
      clearTimeout(this.timerValidacionMonto);
      this.timerValidacionMonto = null;
    }

    // Si excede el monto máximo disponible, programa alerta elegante
    if (monto > max_monto) {
      this.timerValidacionMonto = setTimeout(() => {
        this.validarYNotificarMonto();
      }, 700);
    }
  }

  public validarYNotificarMonto(): boolean {
    if (this.timerValidacionMonto) {
      clearTimeout(this.timerValidacionMonto);
      this.timerValidacionMonto = null;
    }

    if (!this.calculosData) return true;

    const saldo_disponible = this.getSaldoDisponible();
    const max_monto = this.getMaxMontoAnticipoDisponible();
    let monto = Number(this.montoAnticipo);

    if (monto > max_monto) {
      const montoExcedido = monto;
      this.montoAnticipo = max_monto;
      this.porcentajeAnticipo = 75;
      this.cdr.detectChanges();

      this.mostrarAlertaLimiteExcedido(
        "Monto Superior al Límite Permitido",
        `El monto ingresado (<strong>Bs. ${montoExcedido.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>) supera el límite máximo legal disponible del <strong>75%</strong> (<strong>Bs. ${max_monto.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>).`,
        `Se ha ajustado automáticamente al monto máximo legal permitido (75% del Saldo Disponible).`
      );
      return false;
    }
    return true;
  }

  private mostrarAlertaLimiteExcedido(titulo: string, detalle: string, pie: string): void {
    if (Swal.isVisible()) return;

    Swal.fire({
      icon: "warning",
      title: `<span style="color: #1e293b; font-weight: 700; font-size: 1.25rem;">${titulo}</span>`,
      html: `
        <div style="font-size: 0.95rem; color: #475569; text-align: left; padding: 0.25rem 0.25rem;">
          <p style="margin-bottom: 1rem; line-height: 1.5;">${detalle}</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #598c89; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <div style="font-size: 0.85rem; color: #334155;">
              <i class="fas fa-info-circle mr-1" style="color: #598c89;"></i>
              ${pie}
            </div>
          </div>
          <div style="font-size: 0.78rem; color: #94a3b8; text-align: right; font-style: italic;">
            Ley Orgánica de Seguridad Social de la FANB (Negro Primero)
          </div>
        </div>
      `,
      confirmButtonText: '<i class="fas fa-check mr-1"></i> Entendido',
      confirmButtonColor: "#598c89",
      customClass: {
        popup: "border-0 shadow-lg rounded-20 px-3 py-3",
        confirmButton: "btn px-4 py-2 font-weight-bold shadow-sm",
      },
      buttonsStyling: true,
    });
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

    // Configurar columnas dinámicamente: Mostrar Observación sin Estatus en Rechazados (102) y Reversadas (103)
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
          header: "Monto (Bs)",
          type: "html",
          align: "right",
          cssClass: "align-middle pr-4",
        },
        {
          key: "fecha",
          header: "Fecha",
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
      ];
    }

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
          name: "reversar",
          icon: "fa-history",
          tooltip: "Reversar Anticipo",
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

            const nombreClean = this.formatNombreCompleto(item);
            const obsTexto = (item.observacion || item.observ_ult_modificacion || "").trim() || "N/A";

            return {
              ...item,
              id: item.id_operacion || item.id,
              id_operacion: item.id_operacion || item.id,
              cedula: item.cedula_beneficiario || item.cedula,
              nombre: nombreClean,
              nombres_beneficiario: item.nombres_beneficiario || item.nombres,
              apellidos_beneficiario:
                item.apellidos_beneficiario || item.apellidos,
              grado: (item.nombre_grado || "").trim(),
              componente: (item.nombre_componente || "").trim(),
              montoBs: item.monto ? parseFloat(item.monto) : 0,
              fecha: fechaStr,
              estatus: item.nombre_anticipo || "PENDIENTE",

              cedulaFormat: `<span class="badge badge-pill bg-light text-muted border border-secondary shadow-sm font-weight-bold px-2 py-1">${this.formatCedula(item.cedula_beneficiario || item.cedula)}</span>`,
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
          
          const gradosSet = new Set(this.masterPendingData.map(item => (item.grado || "").trim()).filter(g => g));
          this.gradosDisponibles = Array.from(gradosSet).sort();

          let filtered = [...mappedData];
          
          if (this.filtroComponente) {
            filtered = filtered.filter(item => item.componente === this.filtroComponente);
          }
          
          if (this.filtroGrado) {
            filtered = filtered.filter(item => (item.grado || "").trim() === this.filtroGrado);
          }

          this.pendingTableData = filtered;
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
        const cedula =
          row.cedula_beneficiario || row.cedula_afiliado || row.cedula;
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
              this.prestacionesService.buscarMilitarPorCedula(cedula),
            );
            const militarData = Array.isArray(res) ? res[0] : res;
            if (militarData) {
              const datobasico = militarData.persona?.datobasico || {};
              const nombreFull =
                datobasico.nombrecompleto ||
                `${datobasico.nombres || ""} ${datobasico.apellidos || ""}`.trim();
              const gradoDesc =
                militarData.grado?.descripcion ||
                militarData.nombre_grado ||
                row.grado;
              const compDesc =
                militarData.componente?.descripcion ||
                militarData.nombre_componente ||
                row.componente;

              return {
                ...row,
                nombre: nombreFull || row.nombre,
                nombres_beneficiario:
                  datobasico.nombres || row.nombres_beneficiario,
                apellidos_beneficiario:
                  datobasico.apellidos || row.apellidos_beneficiario,
                grado: gradoDesc || row.grado,
                nombre_grado: gradoDesc || row.nombre_grado,
                componente: compDesc || row.componente,
                nombre_componente: compDesc || row.nombre_componente,
              };
            }
          } catch (e) {
            console.warn(
              "No se pudo consultar detalle del militar para cédula:",
              cedula,
              e,
            );
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
      this.motivoRechazoSelect = "Documentación Incompleta";
      this.observacionRechazo = (event.row?.observacion || event.row?.motivo || "").trim();
      this.modalService.open(this.modalRechazar, {
        centered: true,
        size: "md",
        windowClass: "pastel-modal",
      });
    } else if (event.actionName === "reversar") {
      this.motivoReversadoSelect = "Error en Cálculo o Monto Aprobado";
      this.observacionReversado = (event.row?.observacion || event.row?.motivo || "").trim();
      this.modalService.open(this.modalReversar, {
        centered: true,
        size: "md",
        windowClass: "pastel-modal",
      });
    } else if (event.actionName === "cartaBanco") {
      this.generarCartaBanco(event.row);
    } else if (event.actionName === "ver") {
      alert(
        `Ver detalles de ${event.row.nombre || event.row.nombres_beneficiario || "solicitud"}`,
      );
    }
  }

  public async cargarDatosYPuntoCuenta(orden: any): Promise<void> {
    if (!this.puntoCuentaPdf || !orden) return;

    const cedula =
      orden.cedula_beneficiario || orden.cedula_afiliado || orden.cedula || "";

    let militarObj = this.militarData;
    let calculosObj = this.calculosData;

    const mCedula =
      militarObj?.cedula || militarObj?.persona?.datobasico?.cedula;
    const isSameCedula = mCedula && String(mCedula) === String(cedula);

    if (!isSameCedula) {
      militarObj = null;
      calculosObj = null;
      if (cedula) {
        try {
          const resMilitar = await lastValueFrom(
            this.prestacionesService.buscarMilitarPorCedula(cedula),
          );
          militarObj = Array.isArray(resMilitar) ? resMilitar[0] : resMilitar;
        } catch (e) {
          console.warn(
            "No se pudo obtener militarData para Punto de Cuenta:",
            e,
          );
        }
      }
    }

    if (!calculosObj && cedula) {
      try {
        const dirData: any = await lastValueFrom(
          this.prestacionesService.obtenerDirectivaId(cedula),
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
        console.warn(
          "No se pudieron obtener cálculos para Punto de Cuenta:",
          e,
        );
      }
    }

    await this.puntoCuentaPdf.generarPDFPuntoCuenta(
      orden,
      militarObj,
      calculosObj,
    );
  }

  public async confirmarAprobacion(): Promise<void> {
    if (!this.selectedMilitar || this.isProcessingAction) return;
    this.isProcessingAction = true;
    const militar = this.selectedMilitar;
    const orderId = String(
      militar.id_operacion ||
        militar.id ||
        militar.id_orden ||
        militar.oid ||
        militar.id_solicitud ||
        "",
    );

    console.log(
      "Confirmando aprobación -> id_operacion:",
      orderId,
      "militar:",
      militar,
    );
    try {
      if (orderId) {
        await this.actualizarEstatus("100", orderId);
      } else {
        console.warn(
          "ADVERTENCIA: No se detectó id_operacion para actualizar estatus.",
        );
      }
      await this.cargarDatosYPuntoCuenta(militar);
    } catch (e) {
      console.error("Error al aprobar anticipo:", e);
    } finally {
      this.isProcessingAction = false;
      this.modalService.dismissAll();
    }
  }

  public async confirmarRechazo(): Promise<void> {
    if (!this.selectedMilitar || this.isProcessingAction) return;
    this.isProcessingAction = true;
    const militar = this.selectedMilitar;
    const orderId = String(
      militar.id_operacion ||
        militar.id ||
        militar.id_orden ||
        militar.oid ||
        militar.id_solicitud ||
        "",
    );

    const obs =
      (this.observacionRechazo || "").trim() ||
      this.motivoRechazoSelect ||
      "RECHAZADO";

    console.log(
      "Confirmando rechazo -> id_operacion:",
      orderId,
      "militar:",
      militar,
      "obs:",
      obs,
    );
    try {
      if (orderId) {
        await this.actualizarEstatus("102", orderId, obs);
      } else {
        console.warn(
          "ADVERTENCIA: No se detectó id_operacion para actualizar estatus.",
        );
      }
    } catch (e) {
      console.error("Error al rechazar anticipo:", e);
    } finally {
      this.isProcessingAction = false;
      this.modalService.dismissAll();
    }
  }

  public async confirmarReversar(): Promise<void> {
    if (!this.selectedMilitar || this.isProcessingAction) return;
    this.isProcessingAction = true;
    const militar = this.selectedMilitar;
    const orderId = String(
      militar.id_operacion ||
        militar.id ||
        militar.id_orden ||
        militar.oid ||
        militar.id_solicitud ||
        "",
    );

    const obs =
      (this.observacionReversado || "").trim() ||
      this.motivoReversadoSelect ||
      "REVERSADO";

    console.log(
      "Confirmando reversión -> id_operacion:",
      orderId,
      "militar:",
      militar,
      "obs:",
      obs,
    );
    try {
      if (orderId) {
        await this.actualizarEstatus("103", orderId, obs);
      } else {
        console.warn(
          "ADVERTENCIA: No se detectó id_operacion para actualizar estatus.",
        );
      }
    } catch (e) {
      console.error("Error al reversar anticipo:", e);
    } finally {
      this.isProcessingAction = false;
      this.modalService.dismissAll();
    }
  }

  public solicitarAnticipo(): void {
    if (this.timerValidacionMonto) {
      clearTimeout(this.timerValidacionMonto);
      this.timerValidacionMonto = null;
    }
    if (this.timerValidacionPorcentaje) {
      clearTimeout(this.timerValidacionPorcentaje);
      this.timerValidacionPorcentaje = null;
    }
    this.porcentajeAnticipo = 0;
    this.montoAnticipo = 0;
    this.motivoAnticipo = "";
    this.intentoProcesar = false;
    this.cdr.detectChanges();

    const max_monto = this.getMaxMontoAnticipoDisponible();
    if (max_monto <= 0) {
      Swal.fire({
        icon: "warning",
        title: `<span style="color: #1e293b; font-weight: 700; font-size: 1.25rem;">Sin Disponibilidad</span>`,
        html: `
          <div style="font-size: 0.95rem; color: #475569; text-align: left; padding: 0.25rem 0.25rem;">
            <p style="margin-bottom: 0.5rem; line-height: 1.5;">El afiliado no posee saldo disponible o excede el límite de capacidad disponible en este momento.</p>
          </div>
        `,
        confirmButtonText: '<i class="fas fa-check mr-1"></i> Entendido',
        confirmButtonColor: "#598c89",
        customClass: {
          popup: "border-0 shadow-lg rounded-20 px-3 py-3",
          confirmButton: "btn px-4 py-2 font-weight-bold shadow-sm",
        },
      });
    }

    this.modalService.open(this.modalSolicitar, {
      centered: true,
      size: "lg",
      windowClass: "pastel-modal",
    });
  }

  public procesarSolicitud(): void {
    this.intentoProcesar = true;

    // Validación obligatoria del Motivo del Anticipo
    if (!this.motivoAnticipo || this.motivoAnticipo.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: `<span style="color: #1e293b; font-weight: 700; font-size: 1.25rem;">Motivo del Anticipo Requerido</span>`,
        html: `
          <div style="font-size: 0.95rem; color: #475569; text-align: left; padding: 0.25rem 0.25rem;">
            <p style="margin-bottom: 0.75rem; line-height: 1.5;">Debe seleccionar un <strong>Motivo del Anticipo</strong> para poder tramitar la solicitud.</p>
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 0.75rem 1rem;">
              <div style="font-size: 0.85rem; color: #92400e;">
                <i class="fas fa-exclamation-triangle mr-1" style="color: #f59e0b;"></i>
                El motivo es de carácter obligatorio según lo establecido en el Artículo 59 de la Ley Orgánica de Seguridad Social de la FANB (Ley Negro Primero).
              </div>
            </div>
          </div>
        `,
        confirmButtonText: '<i class="fas fa-check mr-1"></i> Entendido',
        confirmButtonColor: "#598c89",
        customClass: {
          popup: "border-0 shadow-lg rounded-20 px-3 py-3",
          confirmButton: "btn px-4 py-2 font-weight-bold shadow-sm",
        },
      });
      return;
    }

    // Validación de monto o porcentaje mayor a cero
    if (!this.montoAnticipo || Number(this.montoAnticipo) <= 0) {
      Swal.fire({
        icon: "warning",
        title: `<span style="color: #1e293b; font-weight: 700; font-size: 1.25rem;">Monto Inválido</span>`,
        html: `
          <div style="font-size: 0.95rem; color: #475569; text-align: left; padding: 0.25rem 0.25rem;">
            <p style="margin-bottom: 0.5rem; line-height: 1.5;">Debe indicar un porcentaje o monto mayor a cero para el anticipo.</p>
          </div>
        `,
        confirmButtonText: '<i class="fas fa-check mr-1"></i> Entendido',
        confirmButtonColor: "#598c89",
      });
      return;
    }

    if (!this.validarYNotificarMonto() || !this.validarYNotificarPorPorcentaje()) {
      return;
    }
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
      this.militarData?.nombres ||
      ""
    ).trim();
    const apellidos = (
      datobasico.apellidos ||
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
      Swal.fire({
        icon: "error",
        title: "Datos Faltantes",
        text: "No se han cargado los datos del militar.",
        confirmButtonColor: "#598c89",
      });
      return;
    }

    if (!this.motivoAnticipo) {
      this.procesarSolicitud();
      return;
    }

    if (!this.montoAnticipo || this.montoAnticipo <= 0) {
      alert("Por favor ingrese un monto válido para el anticipo.");
      return;
    }

    const max_monto = this.getMaxMontoAnticipoDisponible();
    if (this.montoAnticipo > max_monto) {
      this.validarYNotificarMonto();
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

  /**
   * Actualiza el estatus de una orden de manera síncrona/reactiva
   * @param codigo Código de la orden:
   *   103: REVERSADA
   *   102: RECHAZADA
   *   101: PENDIENTE
   *   100: APROBADO / EJECUTADO
   * @param id ID de la orden a actualizar
   * @param observacion Observación adicional a incluir en la actualización de la orden
   */
  public actualizarEstatus(
    codigo: string,
    id: string,
    observacion: string = "",
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.xAPI = {} as IAPICore;
      this.xAPI.funcion = environment.funcion.ACTUALIZAR_ORDEN;
      this.xAPI.parametros = `${codigo},${observacion},${id}`;

      this.apiService.post("crud", this.xAPI).subscribe({
        next: (data: any) => {
          console.log(
            `Estatus ${codigo} actualizado para la orden ${id}:`,
            data,
          );
          this.loadPendingData();
          resolve(data);
        },
        error: (err: any) => {
          console.error("Error al actualizar estatus de la orden:", err);
          reject(err);
        },
      });
    });
  }
}
