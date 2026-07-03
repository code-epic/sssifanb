import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PdfLayoutBase } from "./pdf-layout-base.component";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Sha256Service } from "src/app/core/services/util/sha256";
import { UtilService } from "src/app/core/services/util/util.service";

@Component({
  selector: "app-hoja-vida",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-none">
      <!-- Logic component, template is hidden -->
    </div>
  `,
})
export class HojaVidaComponent extends PdfLayoutBase {
  private sha256 = inject(Sha256Service);
  private utilService = inject(UtilService);

  @Input() public militar: any;
  @Input() public calculosBunker: any;
  @Input() public fechaUltimoAnticipo: string = "";
  @Input() public movimientos: any[] = [];

  /**
   * Ejecuta la generación y apertura de la Hoja de Vida en PDF
   */
  public async generarPDFHojaDeVida(): Promise<void> {
    if (!this.militar) {
      console.warn("No hay datos de militar cargados para generar la hoja de vida.");
      return;
    }

    const militarDb = this.militar.persona?.datobasico;
    const cedulaTitular = militarDb?.cedula || "";
    const abrevGrado =
      this.militar?.grado?.abreviatura ||
      this.militar?.Grado?.abreviatura ||
      "";

    const docId = `hv-${cedulaTitular}`;
    const hashId = await this.sha256.hash(docId);

    const qrPayload = {
      id: hashId,
      ruta: "https://sssifanb.ipsfa.gob.ve/validar/" + btoa(cedulaTitular),
      tipo: "png",
    };

    const [logoImg, photoImg, gradoBadgeImg, qrImg, firmaImg, selloImg] = await Promise.all([
      this.loadLogo(),
      this.loadPhotoBase64(cedulaTitular),
      this.loadGradoBadgeBase64(abrevGrado),
      this.loadQRBase64(qrPayload),
      this.loadFirma(),
      this.loadSello(),
    ]);

    const bodyContent = this.buildBodyContent(militarDb, this.calculosBunker);

    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg,
      qrImg,
      gradoBadgeImg,
      firmaImg,
      selloImg,
      title: "Hoja de Vida SSSIFANB",
      bodyContent,
    });

    return new Promise<void>((resolve, reject) => {
      try {
        pdfMake
          .createPdf(docDefinition)
          .getBase64()
          .then((base64Data: string) => {
            const dataUri = `data:application/pdf;base64,${base64Data}`;
            const fileName = `Hoja_Vida_${cedulaTitular}.pdf`;

            if (window.parent && window !== window.parent) {
              window.parent.postMessage(
                {
                  type: "OPEN_PDF",
                  payload: {
                    fileName,
                    data: dataUri,
                  },
                },
                "*"
              );
              resolve();
            } else {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (isMobile) {
                pdfMake
                  .createPdf(docDefinition)
                  .getBlob()
                  .then((blob: Blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    resolve();
                  });
              } else {
                pdfMake.createPdf(docDefinition).open();
                resolve();
              }
            }
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  private buildBodyContent(militarDb: any, bunker: any): any[] {
    const formatter = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmt = (val: any) => formatter.format(Number(val) || 0);

    const moneda = "Bs.";
    const base = bunker?.base || {};
    const calculos = base?.calculos || {};
    const movimientos = bunker?.movimientos || {};

    const componentes = ["EJB", "ARV", "FAV", "GN", "MIL"];
    const compIdx = militarDb?.componente_id ? militarDb.componente_id - 1 : 0;
    const componenteFull = componentes[compIdx] || "N/D";
    
    // Configuración de tabla heredada de la constancia
    const standardTableLayout = {
      hLineWidth: (i: number) => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => "#CBD5E1",
      paddingTop: () => 3,
      paddingBottom: () => 3,
    };

    // Procesar movimientos históricos para la tabla final
    let historyRows: any[][] = [
      [
        { text: "Concepto", style: "tableHeader" },
        { text: "Monto", style: "tableHeader", alignment: "right" },
        { text: "Fecha Contable", style: "tableHeader", alignment: "center" }
      ]
    ];

    if (this.movimientos && this.movimientos.length > 0) {
      this.movimientos.forEach((item: any) => {
        let fecha = "N/A";
        if (item.f_contable) {
          const d = new Date(item.f_contable);
          fecha = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : "N/A";
        }
        
        historyRows.push([
          { text: (item.concepto || "ANTICIPO").toUpperCase(), fontSize: 8.5 },
          { text: `Bs ${fmt(item.monto)}`, fontSize: 8.5, bold: true, alignment: "right", color: "#10B981" },
          { text: fecha, fontSize: 8.5, alignment: "center" }
        ]);
      });
    } else {
      historyRows.push([
        { text: "No se encontraron movimientos registrados.", colSpan: 3, alignment: "center", fontSize: 8.5, italic: true, margin: [0, 5, 0, 5] },
        {}, {}
      ]);
    }

    return [
      // DATOS PERSONALES
      { text: "DATOS PERSONALES Y PROFESIONALES", style: "seccionHeader" },
      {
        table: {
          widths: ["33%", "33%", "34%"],
          body: [
            [
              { text: "Cédula Identidad", style: "tableHeader" },
              { text: "Nombres y Apellidos", style: "tableHeader" },
              { text: "Estatus", style: "tableHeader" }
            ],
            [
              { text: `V-${militarDb?.cedula || "N/D"}`, fontSize: 8.5, bold: true },
              { text: String(bunker?.nombres || militarDb?.nombres || "N/D").toUpperCase() + " " + String(bunker?.apellidos || militarDb?.apellidos || "").toUpperCase(), fontSize: 8.5 },
              { text: String(bunker?.estatus || "N/D").toUpperCase(), fontSize: 8.5 }
            ],
            [
              { text: "Componente", style: "tableHeader" },
              { text: "Fecha Ingreso", style: "tableHeader" },
              { text: "Fecha Retiro / Últ. Ascenso", style: "tableHeader" }
            ],
            [
              { text: componenteFull, fontSize: 8.5, bold: true },
              { text: bunker?.f_ingreso_sistema ? new Date(bunker.f_ingreso_sistema).toLocaleDateString("es-VE") : "N/D", fontSize: 8.5 },
              { text: (bunker?.f_retiro ? new Date(bunker.f_retiro).toLocaleDateString("es-VE") : "N/D") + " / " + (bunker?.f_ult_ascenso ? new Date(bunker.f_ult_ascenso).toLocaleDateString("es-VE") : "N/D"), fontSize: 8.5 }
            ]
          ]
        },
        layout: standardTableLayout,
        margin: [0, 0, 0, 10]
      },

      // RESUMEN SALARIAL Y PRIMAS
      { text: "RESUMEN SALARIAL Y PRIMAS", style: "seccionHeader" },
      {
        columns: [
          {
            width: "48%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Concepto Salarial", style: "tableHeader" },
                  { text: "Monto", style: "tableHeader", alignment: "right" }
                ],
                [
                  { text: "Sueldo Base", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.sueldo_base)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Sueldo Mensual", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.sueldo_mensual)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Bono Vacacional", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.vacaciones)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Bono Fin de Año", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.aguinaldos)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "SUELDO INTEGRAL", fontSize: 8.5, bold: true },
                  { text: `${moneda} ${fmt(base.sueldo_integral)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ]
              ]
            },
            layout: standardTableLayout
          },
          { width: "4%", text: "" },
          {
            width: "48%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Primas y Compensaciones", style: "tableHeader" },
                  { text: "Monto", style: "tableHeader", alignment: "right" }
                ],
                [
                  { text: "Descendencia", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(calculos.prima_descendencia)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Profesionalización", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(calculos.prima_profesionalizacion)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Tiempo de Servicio", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(calculos.prima_tiemposervicio)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "No Ascenso", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(calculos.prima_noascenso)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ]
              ]
            },
            layout: standardTableLayout
          }
        ],
        margin: [0, 0, 0, 10]
      },

      // ASIGNACION DE ANTIGÜEDAD Y FIDEICOMISO
      { text: "ASIGNACIÓN DE ANTIGÜEDAD Y FIDEICOMISO", style: "seccionHeader" },
      {
        columns: [
          {
            width: "48%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Datos Asignación", style: "tableHeader" },
                  { text: "Monto", style: "tableHeader", alignment: "right" }
                ],
                [
                  { text: "A. de Antigüedad", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.asignacion_antiguedad)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Días Adicionales", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(movimientos.deposito_de_dias_adicionales)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Diferencia A.A.", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.diferencia_asignacion)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Embargo", fontSize: 8.5, color: "#EF4444" },
                  { text: `- ${moneda} ${fmt(movimientos.embargo)}`, fontSize: 8.5, bold: true, color: "#EF4444", alignment: "right" }
                ]
              ]
            },
            layout: standardTableLayout
          },
          { width: "4%", text: "" },
          {
            width: "48%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Haberes en Banco", style: "tableHeader" },
                  { text: "Monto", style: "tableHeader", alignment: "right" }
                ],
                [
                  { text: "Capital En Banco", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(base.deposito_banco)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Garantías", fontSize: 8.5 },
                  { text: `${moneda} ${fmt(movimientos.deposito_de_garantias)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ],
                [
                  { text: "Anticipos", fontSize: 8.5, color: "#EF4444" },
                  { text: `- ${moneda} ${fmt(movimientos.anticipo)}`, fontSize: 8.5, bold: true, color: "#EF4444", alignment: "right" }
                ],
                [
                  { text: "SALDO DISPONIBLE", fontSize: 8.5, bold: true },
                  { text: `${moneda} ${fmt(base.saldo_disponible)}`, fontSize: 8.5, bold: true, alignment: "right" }
                ]
              ]
            },
            layout: standardTableLayout
          }
        ],
        margin: [0, 0, 0, 10]
      },

      // DETALLES ADICIONALES DE PAGO
      { text: "DETALLES ADICIONALES DE PAGO", style: "seccionHeader" },
      {
        table: {
          widths: ["40%", "30%", "30%"],
          body: historyRows
        },
        layout: standardTableLayout,
        margin: [0, 0, 0, 10]
      }
    ];
  }
}
