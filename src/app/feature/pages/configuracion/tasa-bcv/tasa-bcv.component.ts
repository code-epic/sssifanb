import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LayoutService } from "src/app/core/services/layout/layout.service";
import { ApiService } from "src/app/core/services/api.service";
import { DynamicTableConfig } from "src/app/shared/components/dynamic-table/dynamic-table.component";
import Swal from "sweetalert2";

@Component({
  selector: "app-conf-tasa-bcv",
  templateUrl: "./tasa-bcv.component.html",
  styleUrls: ["./tasa-bcv.component.scss"],
})
export class TasaBcvComponent implements OnInit {
  public formTasa: FormGroup;
  public currentRate: any = null;
  public cargando: boolean = false;
  public historial: any[] = [];
  public tableData: any[] = [];

  public tableConfig: DynamicTableConfig = {
    selectable: false,
    rowClickable: false,
    showPagination: true,
    pageSize: 5,
    hoverActions: false,
    tableClass: "mailbox-table w-100 mb-0",
    containerClass: "p-0 border-0 shadow-none rounded-20",
    columns: [
      { key: "fechaConsultaFormat", header: "Fecha Consulta", type: "html" },
      { key: "monedaFormat", header: "Moneda", type: "html" },
      { key: "valorFormat", header: "Valor Tasa", type: "html" },
      { key: "fechaFormat", header: "Fecha Vigencia BCV", type: "html" },
      { key: "tipoFormat", header: "Tipo", type: "html" },
    ],
    actions: [],
  };

  private defaultHistorial: any[] = [];

  constructor(
    private layoutService: LayoutService,
    private fb: FormBuilder,
    private apiService: ApiService,
  ) {
    this.formTasa = this.fb.group({
      moneda: ["dolar", Validators.required],
      desde: [""],
      hasta: [""],
    });
  }

  ngOnInit(): void {
    this.layoutService.updateHeader({
      title: "Configuracion / Consulta de Divisas",
      showBackButton: true,
      alertSeverity: 1,
      showAlertsIcon: true,
    });

    this.cargarHistorial();
    this.consultarTasa(true); // Carga inicial silenciosa
  }

  cargarHistorial() {
    const stored = localStorage.getItem("historial_divisas");
    if (stored) {
      try {
        this.historial = JSON.parse(stored);
      } catch (e) {
        this.historial = [...this.defaultHistorial];
      }
    } else {
      this.historial = [...this.defaultHistorial];
    }
    this.actualizarTableData();
  }

  seleccionarMoneda(moneda: string) {
    this.formTasa.get("moneda")?.setValue(moneda);
    this.consultarTasa();
  }

  consultarTasa(silencioso: boolean = false) {
    if (this.formTasa.invalid) return;

    this.cargando = !silencioso;
    const formVal = this.formTasa.value;

    const payload: any = {
      moneda: formVal.moneda,
    };

    if (formVal.desde) {
      payload.desde = formVal.desde;
    }
    if (formVal.hasta) {
      payload.hasta = formVal.hasta;
    }

    this.apiService.post("divisa", payload).subscribe({
      next: (res: any) => {
        this.cargando = false;
        console.log(res);
        if (res && res.success && res.data) {
          this.currentRate = res.data;

          const record = {
            ...res.data,
            duracion: res.duracion_ms || res.transporte?.duration_ms || 2000,
          };

          // Agregar al historial si no es duplicado de moneda, valor y fecha (evita duplicados si la tasa no ha cambiado)
          const existe = this.historial.some(
            (h) =>
              h.moneda === record.moneda &&
              h.valor === record.valor &&
              h.fecha === record.fecha &&
              (h.desde || "") === (record.desde || "") &&
              (h.hasta || "") === (record.hasta || "")
          );
          if (!existe) {
            this.historial.unshift(record);
            if (this.historial.length > 20) {
              this.historial.pop();
            }
            localStorage.setItem(
              "historial_divisas",
              JSON.stringify(this.historial),
            );
            this.actualizarTableData();
          }

          if (!silencioso) {
            Swal.fire({
              title: "Tasa Consultada",
              text: `Se obtuvo con éxito el valor para: ${res.data.moneda === "euro" ? "Euro" : "Dólar"}`,
              icon: "success",
              customClass: {
                confirmButton: "btn btn-ok px-4",
              },
              buttonsStyling: false,
            });
          }
        } else {
          if (!silencioso) {
            Swal.fire({
              title: "Aviso",
              text: res.mensaje || "Respuesta de divisa vacía o inválida",
              icon: "warning",
              customClass: {
                confirmButton: "btn btn-ok px-4",
              },
              buttonsStyling: false,
            });
          }
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error("Error consultando divisa:", err);
        if (!silencioso) {
          Swal.fire({
            title: "Error de Conexión",
            text: "No se pudo obtener la tasa desde el servidor. Compruebe la conexión o intente más tarde.",
            icon: "error",
            customClass: {
              confirmButton: "btn btn-ok px-4",
            },
            buttonsStyling: false,
          });
        }
      },
    });
  }

  actualizarTableData() {
    this.tableData = this.historial.map((item) => {
      const dateStr = item.timestamp
        ? new Date(item.timestamp).toLocaleString()
        : "N/A";
      const monStr = item.moneda === "euro" ? "Euro EUR (€)" : "Dólar USD ($)";
      const typeStr = item.es_historico
        ? `<span class="badge" style="background: rgba(74, 85, 104, 0.08); color: #4a5568; border: 1px solid rgba(74, 85, 104, 0.15); border-radius: 6px; font-weight: 700; padding: 4px 8px; font-size: 0.7rem;">HISTÓRICO</span>`
        : `<span class="badge" style="background: rgba(89, 140, 137, 0.12); color: #598c89; border: 1px solid rgba(89, 140, 137, 0.2); border-radius: 6px; font-weight: 700; padding: 4px 8px; font-size: 0.7rem;">ACTUAL</span>`;
      const valColor = item.es_historico ? "text-secondary" : "text-verde-titulos";
      return {
        ...item,
        fechaConsultaFormat: `<span class="text-dark fw-bold small">${dateStr}</span>`,
        monedaFormat: `<span class="fw-bold">${monStr}</span>`,
        valorFormat: `<span class="fw-bold fs-6 ${valColor}">${item.valor} Bs.</span>`,
        fechaFormat: `<span class="text-muted small fw-bold">${item.fecha || "N/A"}</span>`,
        tipoFormat: typeStr,
      };
    });
  }

  borrarHistorial() {
    Swal.fire({
      title: "¿Limpiar Historial?",
      text: "Se borrarán todos los registros consultados del historial.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, limpiar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "btn btn-ok px-4 mr-2",
        cancelButton: "btn btn-cancel px-4",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.historial = [];
        localStorage.removeItem("historial_divisas");
        this.actualizarTableData();
        Swal.fire({
          title: "Historial Limpio",
          text: "El historial de consultas ha sido borrado.",
          icon: "success",
          customClass: {
            confirmButton: "btn btn-ok px-4",
          },
          buttonsStyling: false,
        });
      }
    });
  }
}
