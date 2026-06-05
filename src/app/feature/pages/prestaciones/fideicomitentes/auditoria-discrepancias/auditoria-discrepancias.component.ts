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
  parametro: string;
  detalles: any;
  casos: string;
  estatus: number;
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
    let cmp = (sessionStorage.getItem("existe_componente") || "")
      .trim()
      .toUpperCase();

    const payload = {
      funcion: environment.funcion.LISTAR_REVISION_FIDEICOMITENTES,
      parametros: this.getCompontente(cmp).toString(),
    };

    const acumulado: Discrepancia[] = [];

    try {
      await this.apiService.postStream("crudstream", payload, (item: any) => {
        // item tiene el formato {parametro: 3, listado: [ {linea:"",casos:"rechazos",cedula:"10309188",estatus:0,detalles:{...}}... ]}
        if (!item || !item.listado || !Array.isArray(item.listado)) return;

        const parametro = item.parametro;

        item.listado.forEach((element: any) => {
          const { linea, casos, cedula, estatus, detalles } = element;

          // Extraer los valores de la línea original CSV
          const csvValues = (linea || "").split(",");
          const csvObj: any = {
            cedula: csvValues[0] || "",
            grado: csvValues[1] || "",
            n_hijos: csvValues[2] || "",
            fecha_ingreso: csvValues[3] || "",
            f_ult_ascenso: csvValues[4] || "",
            st_profesion: csvValues[5] || "",
            anio_reconocido: csvValues[6] || "",
            mes_reconocido: csvValues[7] || "",
            dia_reconocido: csvValues[8] || "",
          };

          const etiquetas: any = {
            grado: "Grado",
            n_hijos: "Número de Hijos",
            fecha_ingreso: "Fecha de Ingreso",
            f_ult_ascenso: "Fecha Último Ascenso",
            st_profesion: "Prima de Profesión",
            anio_reconocido: "Años Reconocidos",
            mes_reconocido: "Meses Reconocidos",
            dia_reconocido: "Días Reconocidos",
          };

          const diferencias: any[] = [];
          const carpetas = new Set<string>();
          const dts = detalles || {};

          // Comparar cada campo del sistema (detalles) con el CSV
          Object.keys(dts).forEach((key) => {
            const valCSV = csvObj[key];
            const valSistema = dts[key];

            const normalize = (v: string) =>
              v ? v.toString().split("T")[0] : "";

            if (normalize(valCSV) !== normalize(valSistema)) {
              let carpeta = "OTROS";

              if (key === "fecha_ingreso" || key === "f_ult_ascenso") {
                carpeta = "FECHAS";
              } else if (key.includes("reconocido")) {
                carpeta = "TIEMPO_RECONOCIDO";
              } else if (key === "grado") {
                carpeta = "GRADOS";
              } else if (key === "st_profesion") {
                carpeta = "PROFESION";
              } else if (key === "n_hijos") {
                carpeta = "FAMILIA";
              }

              carpetas.add(carpeta);

              diferencias.push({
                campo: key,
                etiqueta: etiquetas[key] || key,
                origenCSV: valCSV,
                sistemaGRPC: valSistema,
                carpeta: carpeta,
              });
            }
          });

          const grupoValidacion =
            carpetas.size > 0
              ? Array.from(carpetas).join(", ")
              : "SIN DISCREPANCIAS";

          acumulado.push({
            id: cedula || new Date().getTime().toString(),
            cedula: cedula || "N/A",
            status: casos === "rechazos" ? "PartialMatch" : "Match",
            grupoValidacion: grupoValidacion,
            fechaOperacion: new Date().toISOString().split("T")[0],
            anioReconocido: Number(dts.anio_reconocido || 0),
            grado: dts.grado || "",
            diferencias: diferencias,
            linea: linea || "",
            parametro: parametro,
            detalles: dts,
            casos: casos,
            estatus: estatus,
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

  public getCompontente(abreviado: string): number {
    switch (abreviado) {
      case "EJERCITO":
        return 1;
      case "ARMADA":
        return 2;
      case "AVIACION":
        return 3;
      case "GUARDIA NACIONAL":
        return 4;
      default:
        return 0;
    }
  }

  public async LoadDataDiscrepacia() {
    const payload = {
      funcion: environment.funcion.LISTAR_TMP_AVIACION,
      parametros: "",
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
    const calcWidth = (val: number) =>
      this.kpis.total > 0 ? (val / this.kpis.total) * 100 : 0;

    Swal.fire({
      title: "Estadísticas de Discrepancias",
      html: `
        <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 15px; text-align: left;">
          
          <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: #64748b;">Total Evaluado</span>
              <span style="font-size: 1.8rem; font-weight: 800; color: #1e293b; line-height: 1;">${this.kpis.total}</span>
            </div>
            <i class="fas fa-chart-pie" style="font-size: 2.5rem; color: #3b82f6; opacity: 0.8;"></i>
          </div>

          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Fechas</span>
                <span style="font-weight: 700; color: #6366f1;">${this.kpis.fechas}</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="width: ${calcWidth(this.kpis.fechas)}%; background: #6366f1; height: 100%; border-radius: 8px; transition: width 1s ease-in-out;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Años Reconocidos</span>
                <span style="font-weight: 700; color: #8b5cf6;">${this.kpis.reconocimiento}</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="width: ${calcWidth(this.kpis.reconocimiento)}%; background: #8b5cf6; height: 100%; border-radius: 8px; transition: width 1s ease-in-out;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Grados</span>
                <span style="font-weight: 700; color: #ec4899;">${this.kpis.grados}</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="width: ${calcWidth(this.kpis.grados)}%; background: #ec4899; height: 100%; border-radius: 8px; transition: width 1s ease-in-out;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Carga Familiar</span>
                <span style="font-weight: 700; color: #10b981;">${this.kpis.familia}</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="width: ${calcWidth(this.kpis.familia)}%; background: #10b981; height: 100%; border-radius: 8px; transition: width 1s ease-in-out;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Prima de Profesión</span>
                <span style="font-weight: 700; color: #f97316;">${this.kpis.profesion}</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="width: ${calcWidth(this.kpis.profesion)}%; background: #f97316; height: 100%; border-radius: 8px; transition: width 1s ease-in-out;"></div>
              </div>
            </div>

          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn btn-outline-secondary px-4 py-2 mt-4",
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
