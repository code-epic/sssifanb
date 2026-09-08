import { Injectable, NgZone } from "@angular/core";
import { ApiService } from "../api.service";
import { environment } from "src/environments/environment";
import { Observable, Subject } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class PrestacionesSharedService {
  // Subject to emit calculations when they arrive from MessagePort
  private calculosSubject = new Subject<any>();
  public calculos$ = this.calculosSubject.asObservable();

  private port: MessagePort | null = null;
  private isMessagePortInitialized = false;
  private currentTaskId: string | null = null;

  constructor(
    private apiService: ApiService,
    private zone: NgZone,
  ) {
    this.initMessagePort();
  }

  /**
   * Initialize MessagePort to listen for calculation events
   */
  private initMessagePort(): void {
    if (this.isMessagePortInitialized) return;

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (event.ports && event.ports.length > 0) {
        this.port = event.ports[0];
        this.port.onmessage = (msgEvent) => this.handlePortMessage(msgEvent);
      }
      if (msg && msg.type === "EXEC_FNX_FINALIZADO") {
        this.notifyCompletion(msg);
      }
    });
    this.isMessagePortInitialized = true;
  }

  private handlePortMessage(event: MessageEvent) {
    if (event.data && event.data.type === "EXEC_FNX_FINALIZADO") {
      this.notifyCompletion(event.data);
    }
  }

  private notifyCompletion(msg: any) {
    const taskId = msg.payload?.taskId || msg.taskId;
    if (this.currentTaskId && taskId && taskId !== this.currentTaskId) {
      console.log(
        `[PrestacionesSharedService] Ignorando taskId no coincidente (${taskId} vs ${this.currentTaskId})`,
      );
      return;
    }
    this.zone.run(() => {
      const newContent = msg.payload?.data || msg.data;
      if (newContent) {
        try {
          const parsed = JSON.parse(newContent);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.calculosSubject.next(parsed[0]);
          }
        } catch (e) {
          console.error("Error parsing calculos prestaciones payload", e);
        }
      }
    });
  }

  /**
   * Busca un militar por su cédula, considerando el cargo del usuario actual.
   * Si no hay resultados con cargo, hace fallback a búsqueda global si es necesario (manejado por el componente).
   *
   * @param cedula Cédula a buscar
   * @param cargo Cargo del usuario (opcional)
   * @returns Observable con el resultado de la búsqueda
   */
  public buscarMilitarPorCedula(
    cedula: string,
    cargo: string = "",
  ): Observable<any> {
    let payload = {};
    payload = {
      funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR,
      parametros: cedula,
    };

    // console.log("Enviando petición a la API con payload:", payload);
    return this.apiService.post("crud", payload);
  }

  /**
   * Consulta los movimientos asociados a un militar
   * @param cedula Cédula del militar
   * @param tipoMovimiento Tipo de movimiento (ej: 5 para Anticipos)
   */
  public consultarMovimientos(
    cedula: string,
    tipoMovimiento: number = 5,
  ): Observable<any> {
    const payload = {
      funcion: environment.funcion.CONSULTAR_MOVIMIENTOS,
      parametros: `${cedula},${tipoMovimiento}`,
    };
    console.log("Enviando consulta de movimientos:", payload);
    return this.apiService.post("crud", payload);
  }

  /**
   * Obtiene el ID de la directiva de sueldo para el cálculo
   * @param cedula Cédula del militar
   */
  public obtenerDirectivaId(cedula: string): Observable<any> {
    const payload = {
      funcion: environment.funcion.OBTENER_BENEFICIARIO_DIRECTIVA_ID,
      parametros: `${cedula}`,
    };
    return this.apiService.post("crud", payload);
  }

  /**
   * Dispara el cálculo de prestaciones usando la función fnx
   * @param directivaId ID de la directiva de sueldo
   * @param cedula Cédula del militar
   * @param trackId ID de seguimiento (opcional, generado si no se provee)
   * @param gradoId ID del grado del militar (opcional)
   */
  public iniciarCalculosPrestaciones(
    directivaId: number,
    cedula: string,
    trackId: string = "",
    gradoId?: number,
  ): Observable<any> {
    const netInfo = JSON.parse(sessionStorage.getItem("net_info") || "{}");
    const config = netInfo.config || {};
    const tId = trackId || `CALC_${new Date().getTime()}`;

    const fnx: any = {
      funcion: "Fnx_ProcesarBeneficiario",
      id_cliente: config.clientId,
      aplicacion: "sandra.app.ipsfa",
      trackid: tId,
      nombre: "NOMINA DE PRESTACIONES SOCIALES 2026", // Ajustar si es necesario parametrizar
      autor: "Sandra",
      ciclo: "03MAR2026", // Ajustar si es necesario parametrizar
      cedula: cedula,
      accion: "track",
      directiva_id: directivaId,
    };

    if (gradoId !== undefined && gradoId !== null) {
      fnx.grado_id = gradoId;
    }

    return this.apiService.post("fnx", fnx).pipe(
      tap((res: any) => {
        if (res && res.contenido && res.contenido.id) {
          this.currentTaskId = res.contenido.id;
        }
      }),
    );
  }
}
