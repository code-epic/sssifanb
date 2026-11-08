import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  HostListener,
} from "@angular/core";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import { map, debounceTime, distinctUntilChanged } from "rxjs/operators";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import Swal from "sweetalert2";
import { ApiService } from "src/app/core/services/api.service";
import { environment } from "src/environments/environment";

export interface Discrepancia {
  id: string;
  cedula: string;
  status: string;
  grupoValidacion: string;
  fechaOperacion: string;
  anioReconocido: number;
  grado: string;
  diferencias: any[];
  linea: string;
  rawCSV?: string;
  parametro: string;
  detalles: any;
  casos: string;
  estatus: number;
  motivo?: any;
}

@Component({
  selector: "app-auditoria-discrepancias",
  templateUrl: "./auditoria-discrepancias.component.html",
  styleUrls: ["./auditoria-discrepancias.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaDiscrepanciasComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @Input() componenteSeleccionado: string = "";
  @Output() volver = new EventEmitter<void>();

  // State Management (Optimized for 1,000+ records)
  private registrosSubject = new BehaviorSubject<Discrepancia[]>([]);
  private searchSubject = new BehaviorSubject<string>("");
  private filterGroupSubject = new BehaviorSubject<string>("TODOS");

  public registros$: Observable<Discrepancia[]>;
  public activeRecordId: string | null = null;
  public activeRecord: Discrepancia | null = null;
  public kpis = {
    total: 0,
    fechas: 0,
    reconocimiento: 0,
    grados: 0,
    familia: 0,
    profesion: 0,
    nuevo: 0,
    reincorporados: 0,
    paralizados: 0,
    cambioComponente: 0,
    retirados: 0,
  };
  public isLoadingData: boolean = true;

  // Folder Navigation State
  public currentFolder: string | null = null;
  public selectedFolderId: string | null = null;

  public navigationFolders = [
    {
      id: "NUEVO",
      name: "Nuevos",
      icon: "fa-user-plus",
      color: "#3b82f6",
      count: 0,
    },
    {
      id: "REINCORPORADOS",
      name: "Reincorporados",
      icon: "fa-user-check",
      color: "#14b8a6",
      count: 0,
    },
    {
      id: "PARALIZADOS",
      name: "Paralizados",
      icon: "fa-user-slash",
      color: "#f43f5e",
      count: 0,
    },
    {
      id: "CAMBIO_COMPONENTE",
      name: "Cambio de Componente",
      icon: "fa-exchange-alt",
      color: "#8b5cf6",
      count: 0,
    },
    {
      id: "RETIRADOS",
      name: "Retirados",
      icon: "fa-user-minus",
      color: "#94a3b8",
      count: 0,
    },
    {
      id: "FECHAS",
      name: "Fechas",
      icon: "fa-calendar-times",
      color: "#6366f1",
      count: 0,
    },
    {
      id: "GRADOS",
      name: "Grados",
      icon: "fa-medal",
      color: "#eab308",
      count: 0,
    },
    {
      id: "TIEMPO_RECONOCIDO",
      name: "T. Reconocido",
      icon: "fa-history",
      color: "#10b981",
      count: 0,
    },
    {
      id: "FAMILIA",
      name: "Carga Familiar",
      icon: "fa-users",
      color: "#ec4899",
      count: 0,
    },
    {
      id: "PROFESION",
      name: "Profesión",
      icon: "fa-user-md",
      color: "#f97316",
      count: 0,
    },
    {
      id: "TODOS",
      name: "Todas las Discrepancias",
      icon: "fa-folder-open",
      color: "#64748b",
      count: 0,
    },
  ];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {
    // Pipeline Reactivo para Búsqueda y Filtrado
    this.registros$ = combineLatest([
      this.registrosSubject,
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.filterGroupSubject,
    ]).pipe(
      map(([registros, search, group]) => {
        let filtered = registros;
        if (group !== "TODOS") {
          filtered = filtered.filter((r) => r.grupoValidacion.includes(group));
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((r) => {
            const matchCedula = r.cedula.includes(search);
            const matchGrupo = r.grupoValidacion.toLowerCase().includes(s);
            const matchEtiquetas = r.diferencias.some(
              (d) =>
                d.etiqueta.toLowerCase().includes(s) ||
                d.campo.toLowerCase().includes(s),
            );
            return matchCedula || matchGrupo || matchEtiquetas;
          });
        }
        this.calculateKPIs(filtered);
        return filtered;
      }),
    );

    // Keep the observable active so calculateKPIs runs even when currentFolder is null (Level 0)
    this.registros$.subscribe(() => {
      this.cdr.markForCheck(); // Update the view with the new counts
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  public async loadAllData() {
    this.isLoadingData = true;
    this.registrosSubject.next([]); // Limpiar data anterior
    this.cdr.markForCheck();

    try {
      // Ejecutar ambos streams en paralelo
      await Promise.all([this.loadPendingData(), this.LoadDataDiscrepacia()]);
    } catch (error) {
      console.error("Error al cargar datos combinados:", error);
    } finally {
      this.isLoadingData = false;
      this.cdr.markForCheck();
    }
  }

  public async loadPendingData() {
    const compId = this.getCompontente();

    const payload = {
      funcion: environment.funcion.LISTAR_REVISION_FIDEICOMITENTES,
      parametros: compId.toString(),
    };

    const acumulado: Discrepancia[] = [];

    try {
      await this.apiService.postStream("crudstream", payload, (item: any) => {
        // item tiene el formato {parametro: 3, listado: [ {linea:"",casos:"rechazos",cedula:"10309188",estatus:0,detalles:{...},motivo:{...}}... ]}
        if (!item || !item.listado || !Array.isArray(item.listado)) return;

        const parametro = item.parametro;

        item.listado.forEach((element: any) => {
          const { linea, casos, cedula, estatus, detalles, motivo } = element;

          const diferencias: any[] = [];
          const carpetas = new Set<string>();
          const dts = detalles || {};

          // 1. Evaluar objeto 'motivo' si viene estructurado desde el backend
          if (motivo) {
            if (Array.isArray(motivo.categorias) && motivo.categorias.length > 0) {
              motivo.categorias.forEach((cat: string) => {
                const normal = this.normalizarCategoria(cat);
                if (normal) carpetas.add(normal);
              });
            }

            if (Array.isArray(motivo.campos) && motivo.campos.length > 0) {
              motivo.campos.forEach((c: any) => {
                const carp = this.getCarpetaPorCampo(c.campo);
                if (carp !== "OTROS") {
                  carpetas.add(carp);
                }
                diferencias.push({
                  campo: c.campo,
                  etiqueta: this.formatEtiqueta(c.campo),
                  origenCSV: c.valor_csv !== undefined && c.valor_csv !== null ? String(c.valor_csv) : "",
                  sistemaGRPC: c.valor_sssifanb !== undefined && c.valor_sssifanb !== null ? String(c.valor_sssifanb) : "",
                  carpeta: carp,
                });
              });
            }
          }

          // 2. Si no se especificaron discrepancias por motivo, recurrir a comparación con delimitador detectado
          if (carpetas.size === 0) {
            const delimiter = (linea || "").includes(";") ? ";" : ",";
            const csvValues = (linea || "").split(delimiter);
            const csvObj: any = {
              cedula: (csvValues[0] || "").trim(),
              grado: (csvValues[1] || "").trim(),
              n_hijos: (csvValues[2] || "").trim(),
              fecha_ingreso: (csvValues[3] || "").trim(),
              f_ult_ascenso: (csvValues[4] || "").trim(),
              st_profesion: (csvValues[5] || "").trim(),
              anio_reconocido: (csvValues[6] || "").trim(),
              mes_reconocido: (csvValues[7] || "").trim(),
              dia_reconocido: (csvValues[8] || "").trim(),
            };

            Object.keys(dts).forEach((key) => {
              if (csvObj[key] === undefined) return;
              const valCSV = csvObj[key];
              const valSistema = dts[key];

              const normalize = (v: any) =>
                v !== null && v !== undefined
                  ? v.toString().trim().split("T")[0]
                  : "";

              if (valCSV !== "" && valSistema !== "" && normalize(valCSV) !== normalize(valSistema)) {
                const carpeta = this.getCarpetaPorCampo(key);
                carpetas.add(carpeta);

                diferencias.push({
                  campo: key,
                  etiqueta: this.formatEtiqueta(key),
                  origenCSV: valCSV,
                  sistemaGRPC: valSistema,
                  carpeta: carpeta,
                });
              }
            });
          }

          // 3. Evaluar estatus administrativos
          if (element.componente_id == null && element.grado_id == null && (carpetas.size === 0 || carpetas.has("OTROS"))) {
            carpetas.add("NUEVO");
          } else if (element.componente && element.componente_id && element.componente != element.componente_id) {
            carpetas.add("CAMBIO_COMPONENTE");
          }

          if (estatus == 202 || estatus == 203) {
            carpetas.add("REINCORPORADOS");
          } else if (estatus == 205) {
            carpetas.add("PARALIZADOS");
          } else if (estatus == 204 || estatus == 206) {
            carpetas.add("RETIRADOS");
          }

          const grupoValidacion =
            carpetas.size > 0
              ? Array.from(carpetas).join(", ")
              : (casos === "rechazos" ? "RECHAZADO" : "SIN DISCREPANCIAS");

          acumulado.push({
            id: cedula || new Date().getTime().toString() + Math.random(),
            cedula: cedula || "N/A",
            status: casos === "rechazos" || carpetas.size > 0 ? "PartialMatch" : "Match",
            grupoValidacion: grupoValidacion,
            fechaOperacion: new Date().toISOString().split("T")[0],
            anioReconocido: Number(dts.anio_reconocido || 0),
            grado: dts.grado || "",
            diferencias: diferencias,
            linea: linea || "",
            rawCSV: linea || "",
            parametro: parametro,
            detalles: dts,
            casos: casos,
            estatus: estatus,
            motivo: motivo,
          });
        });
      });

      this.registrosSubject.next([
        ...this.registrosSubject.value,
        ...acumulado,
      ]);
      this.cdr.markForCheck();
    } catch (error) {
      console.error("Error al cargar datos en stream:", error);
    }
  }

  public getCompontente(abreviado?: string): number {
    const valor = (
      abreviado ||
      this.componenteSeleccionado ||
      sessionStorage.getItem("existe_componente") ||
      ""
    )
      .trim()
      .toUpperCase();

    if (valor.startsWith("EJ") || valor.includes("EJERC")) {
      return 1;
    }
    if (valor.startsWith("AR") || valor.includes("ARMADA")) {
      return 2;
    }
    if (valor.startsWith("AV") || valor.includes("AVIAC")) {
      return 3;
    }
    if (
      valor.startsWith("GN") ||
      valor.startsWith("GU") ||
      valor.includes("GUARDIA") ||
      valor.includes("GNB")
    ) {
      return 4;
    }
    return 0;
  }

  /**
   * Obtiene el nombre del componente en minúsculas requerido por la consulta (ejercito, aviacion, guardia, armada).
   */
  public getNombreComponenteParam(comp?: string): string {
    const valor = (
      comp ||
      this.componenteSeleccionado ||
      sessionStorage.getItem("existe_componente") ||
      ""
    )
      .trim()
      .toUpperCase();

    if (valor.startsWith("AV") || valor.includes("AVIAC")) {
      return "aviacion";
    }
    if (valor.startsWith("EJ") || valor.includes("EJERC")) {
      return "ejercito";
    }
    if (
      valor.startsWith("GN") ||
      valor.startsWith("GU") ||
      valor.includes("GUARDIA") ||
      valor.includes("GNB")
    ) {
      return "guardia";
    }
    if (valor.startsWith("AR") || valor.includes("ARMADA")) {
      return "armada";
    }
    return valor.toLowerCase();
  }

  /**
   * Normaliza la categoría indicada en motivo.categorias a los IDs de carpetas del sistema.
   */
  public normalizarCategoria(cat: string): string {
    if (!cat) return "OTROS";
    const c = cat.trim().toUpperCase();
    if (c.includes("GRADO")) return "GRADOS";
    if (c.includes("FECHA")) return "FECHAS";
    if (c.includes("RECONOC") || c.includes("TIEMPO")) return "TIEMPO_RECONOCIDO";
    if (c.includes("FAMILI") || c.includes("HIJO")) return "FAMILIA";
    if (c.includes("PROFESI")) return "PROFESION";
    if (c.includes("NUEVO")) return "NUEVO";
    if (c.includes("REINCORPORA")) return "REINCORPORADOS";
    if (c.includes("PARALIZA")) return "PARALIZADOS";
    if (c.includes("CAMBIO") || c.includes("COMPONENTE")) return "CAMBIO_COMPONENTE";
    if (c.includes("RETIRA")) return "RETIRADOS";
    return c;
  }

  /**
   * Deduce la carpeta de validación asociada a un campo con discrepancia.
   */
  public getCarpetaPorCampo(campo: string): string {
    const f = (campo || "").toLowerCase();
    if (f.includes("grado")) return "GRADOS";
    if (f.includes("fecha") || f === "f_ult_ascenso") return "FECHAS";
    if (f.includes("reconocido")) return "TIEMPO_RECONOCIDO";
    if (f.includes("profesion") || f === "st_profesion") return "PROFESION";
    if (f.includes("hijo") || f === "n_hijos" || f.includes("familia")) return "FAMILIA";
    if (f.includes("componente")) return "CAMBIO_COMPONENTE";
    return "OTROS";
  }

  /**
   * Formatea la etiqueta legible para un campo técnico.
   */
  public formatEtiqueta(campo: string): string {
    const etiquetas: Record<string, string> = {
      grado: "Grado",
      n_hijos: "Número de Hijos",
      fecha_ingreso: "Fecha de Ingreso",
      f_ult_ascenso: "Fecha Último Ascenso",
      st_profesion: "Prima de Profesión",
      anio_reconocido: "Años Reconocidos",
      mes_reconocido: "Meses Reconocidos",
      dia_reconocido: "Días Reconocidos",
      componente: "Componente Militar",
    };
    return (
      etiquetas[campo] ||
      campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ")
    );
  }

  public async LoadDataDiscrepacia() {
    const compNombre = this.getNombreComponenteParam();
    const payload = {
      funcion: environment.funcion.LISTAR_TMP_COMPONENTE,
      parametros: compNombre,
    };

    const acumulado: Discrepancia[] = [];

    try {
      await this.apiService.postStream(
        "crudstream",
        payload,
        (element: any) => {
          if (!element) return;

          // Descomenta este console.log temporalmente si necesitas ver qué trae cada fila
          // console.log("Fila recibida: ", element);

          const carpetas = new Set<string>();
          const diferencias: any[] = [];

          // Condiciones especiales del usuario para clasificar en la carpeta
          // Si el militar no existe en la base de datos, componente_id y grado_id serán nulos
          if (element.componente_id == null && element.grado_id == null) {
            carpetas.add("NUEVO");
          } else if (element.componente != element.componente_id) {
            carpetas.add("CAMBIO_COMPONENTE");
          } else {
            if (element.status_id == 202 || element.status_id == 203) {
              carpetas.add("REINCORPORADOS");
            }
            if (element.status_id == 205) {
              carpetas.add("PARALIZADOS");
            }
            if (element.status_id == 204 || element.status_id == 206) {
              carpetas.add("RETIRADOS");
            }
          }

          const grupoValidacion =
            carpetas.size > 0
              ? Array.from(carpetas).join(", ")
              : "SIN DISCREPANCIAS";

          acumulado.push({
            id:
              element.cedula || new Date().getTime().toString() + Math.random(),
            cedula: element.cedula || "N/A",
            status: carpetas.size > 0 ? "PartialMatch" : "Match",
            grupoValidacion: grupoValidacion,
            fechaOperacion: new Date().toISOString().split("T")[0],
            anioReconocido: Number(element.anio_reconocido || 0),
            grado: element.grado || "",
            diferencias: diferencias,
            linea: "",
            parametro: "3",
            detalles: element,
            casos: "",
            estatus: element.status_id,
          });
        },
      );

      this.registrosSubject.next([
        ...this.registrosSubject.value,
        ...acumulado,
      ]);
      this.cdr.markForCheck();
    } catch (error) {
      console.error("Error al cargar datos en stream:", error);
    }
  }

  private calculateKPIs(data: Discrepancia[]): void {
    this.kpis = {
      total: data.length,
      fechas: data.filter((d) => d.grupoValidacion.includes("FECHAS")).length,
      reconocimiento: data.filter((d) =>
        d.grupoValidacion.includes("TIEMPO_RECONOCIDO"),
      ).length,
      grados: data.filter((d) => d.grupoValidacion.includes("GRADOS")).length,
      familia: data.filter((d) => d.grupoValidacion.includes("FAMILIA")).length,
      profesion: data.filter((d) => d.grupoValidacion.includes("PROFESION"))
        .length,
      nuevo: data.filter((d) => d.grupoValidacion.includes("NUEVO")).length,
      reincorporados: data.filter((d) =>
        d.grupoValidacion.includes("REINCORPORADOS"),
      ).length,
      paralizados: data.filter((d) => d.grupoValidacion.includes("PARALIZADOS"))
        .length,
      cambioComponente: data.filter((d) =>
        d.grupoValidacion.includes("CAMBIO_COMPONENTE"),
      ).length,
      retirados: data.filter((d) => d.grupoValidacion.includes("RETIRADOS"))
        .length,
    };

    // Update Folder Counts
    this.navigationFolders.forEach((f) => {
      if (f.id === "TODOS") f.count = this.kpis.total;
      else if (f.id === "FECHAS") f.count = this.kpis.fechas;
      else if (f.id === "GRADOS") f.count = this.kpis.grados;
      else if (f.id === "TIEMPO_RECONOCIDO") f.count = this.kpis.reconocimiento;
      else if (f.id === "FAMILIA") f.count = this.kpis.familia;
      else if (f.id === "PROFESION") f.count = this.kpis.profesion;
      else if (f.id === "NUEVO") f.count = this.kpis.nuevo;
      else if (f.id === "REINCORPORADOS") f.count = this.kpis.reincorporados;
      else if (f.id === "PARALIZADOS") f.count = this.kpis.paralizados;
      else if (f.id === "CAMBIO_COMPONENTE")
        f.count = this.kpis.cambioComponente;
      else if (f.id === "RETIRADOS") f.count = this.kpis.retirados;
    });
  }

  // Búsqueda y Filtros
  public onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  public setFilter(grupo: string): void {
    this.filterGroupSubject.next(grupo);
    if (this.viewport) {
      this.viewport.scrollToIndex(0, "smooth");
    }
  }

  // Folder Navigation Methods
  public openFolder(folderId: string): void {
    this.currentFolder = folderId;
    this.setFilter(folderId);
    this.activeRecordId = null;
    this.activeRecord = null;
  }

  public closeFolder(): void {
    this.currentFolder = null;
    this.setFilter("TODOS");
    this.activeRecordId = null;
    this.activeRecord = null;
  }

  public getFolderDetails(folderId: string) {
    return (
      this.navigationFolders.find((f) => f.id === folderId) ||
      this.navigationFolders[this.navigationFolders.length - 1]
    );
  }

  @HostListener("document:keydown.escape", ["$event"])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.currentFolder) {
      this.closeFolder();
      this.cdr.markForCheck();
    }
  }

  public mostrarEstadisticas(): void {
    const total = this.kpis.total;
    const calcWidth = (val: number) => (total > 0 ? (val / total) * 100 : 0);
    const calcPct = (val: number) =>
      total > 0 ? `${Math.round((val / total) * 100)}%` : "0%";

    const discrepanciasCount =
      this.kpis.grados +
      this.kpis.fechas +
      this.kpis.reconocimiento +
      this.kpis.familia +
      this.kpis.profesion;

    const sinDiscrepancias = Math.max(0, total - discrepanciasCount);

    const categoriasConfig = [
      {
        id: "GRADOS",
        label: "Grados Militares",
        val: this.kpis.grados,
        color: "#eab308",
        icon: "fa-medal",
      },
      {
        id: "FECHAS",
        label: "Fechas (Ingreso / Ascenso)",
        val: this.kpis.fechas,
        color: "#6366f1",
        icon: "fa-calendar-times",
      },
      {
        id: "TIEMPO_RECONOCIDO",
        label: "Tiempo Reconocido",
        val: this.kpis.reconocimiento,
        color: "#10b981",
        icon: "fa-history",
      },
      {
        id: "FAMILIA",
        label: "Carga Familiar (Hijos)",
        val: this.kpis.familia,
        color: "#ec4899",
        icon: "fa-users",
      },
      {
        id: "PROFESION",
        label: "Prima de Profesión",
        val: this.kpis.profesion,
        color: "#f97316",
        icon: "fa-user-md",
      },
      {
        id: "NUEVO",
        label: "Nuevos en Sistema",
        val: this.kpis.nuevo,
        color: "#3b82f6",
        icon: "fa-user-plus",
      },
      {
        id: "REINCORPORADOS",
        label: "Reincorporados",
        val: this.kpis.reincorporados,
        color: "#14b8a6",
        icon: "fa-user-check",
      },
      {
        id: "PARALIZADOS",
        label: "Paralizados",
        val: this.kpis.paralizados,
        color: "#f43f5e",
        icon: "fa-user-slash",
      },
      {
        id: "CAMBIO_COMPONENTE",
        label: "Cambio de Componente",
        val: this.kpis.cambioComponente,
        color: "#8b5cf6",
        icon: "fa-exchange-alt",
      },
      {
        id: "RETIRADOS",
        label: "Retirados",
        val: this.kpis.retirados,
        color: "#94a3b8",
        icon: "fa-user-minus",
      },
    ];

    const filasHtml = categoriasConfig
      .map(
        (c) => `
        <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 4px;">
            <span style="font-weight: 600; color: #334155; font-size: 0.85rem; display: flex; align-items: center;">
              <i class="fas ${c.icon} mr-2" style="color: ${c.color}; font-size: 0.85rem; width: 16px;"></i> ${c.label}
            </span>
            <span style="font-weight: 700; color: ${c.color}; font-size: 0.85rem;">
              ${c.val} <small style="font-weight: 500; opacity: 0.75; font-size: 0.75rem;">(${calcPct(c.val)})</small>
            </span>
          </div>
          <div style="width: 100%; background: #e2e8f0; border-radius: 6px; height: 8px; overflow: hidden;">
            <div style="width: ${calcWidth(c.val)}%; background: ${c.color}; height: 100%; border-radius: 6px; transition: width 0.8s ease-in-out;"></div>
          </div>
        </div>
      `,
      )
      .join("");

    Swal.fire({
      title: "Resumen Estadístico de Auditoría",
      html: `
        <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px; text-align: left;">
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 10px 12px; border-radius: 12px; text-align: center;">
              <span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.4px;">Total Evaluado</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: #1e293b; line-height: 1.2;">${total}</div>
            </div>
            <div style="background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.2); padding: 10px 12px; border-radius: 12px; text-align: center;">
              <span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 700; color: #b45309; letter-spacing: 0.4px;">Discrepancias</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: #b45309; line-height: 1.2;">${discrepanciasCount}</div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px 12px; border-radius: 12px; text-align: center;">
              <span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 700; color: #047857; letter-spacing: 0.4px;">Conformes</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: #047857; line-height: 1.2;">${sinDiscrepancias}</div>
            </div>
          </div>

          <div style="max-height: 320px; overflow-y: auto; padding-right: 4px;">
            ${filasHtml}
          </div>

        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn btn-outline-secondary px-4 py-2 mt-3",
        popup: "rounded-20 px-4 py-4",
        title: "font-weight-bold text-left w-100 m-0",
      },
    });
  }

  // Acciones Atómicas
  public selectRecord(id: string): void {
    if (this.activeRecordId !== id) {
      this.activeRecordId = id; // Resetea contexto visual para evitar colisiones
      this.activeRecord =
        this.registrosSubject.value.find((r) => r.id === id) || null;
    }
  }

  public async procesarAccion(
    registro: Discrepancia,
    accion: "ACEPTAR" | "RECHAZAR",
  ): Promise<void> {
    this.selectRecord(registro.id);
    const isAceptar = accion === "ACEPTAR";

    const confirm = await Swal.fire({
      title: isAceptar ? "¿Aceptar Cambio?" : "¿Rechazar Cambio?",
      text: `Se aplicará la acción sobre la cédula ${registro.cedula}. Esta operación actualizará la base de datos.`,
      icon: isAceptar ? "warning" : "error",
      showCancelButton: true,
      confirmButtonText: isAceptar
        ? "Aceptar y Sincronizar"
        : "Mantener Original",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: isAceptar
          ? "btn btn-header-action teal"
          : "btn btn-header-action red",
        popup: "auditoria-modal-popup border-0 rounded-20 px-4 py-4",
      },
    });

    if (confirm.isConfirmed) {
      // Remover elemento de la memoria cliente (Optimización visual)
      const current = this.registrosSubject.value.filter(
        (r) => r.id !== registro.id,
      );
      this.registrosSubject.next(current);
      this.activeRecordId = null; // Clean state
      this.activeRecord = null;

      Swal.fire({
        title: "¡Sincronizado!",
        text: "El registro ha sido actualizado con éxito.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  public scrollToIndex(direction: "NEXT" | "PREV"): void {
    if (!this.viewport) return;
    const offset = direction === "NEXT" ? 1 : -1;
    const current = this.viewport.measureScrollOffset("top");
    this.viewport.scrollToOffset(current + offset * 250, "smooth");
  }

  public trackById(index: number, item: Discrepancia): string {
    return item.id;
  }
}
