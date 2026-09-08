import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PdfLayoutBase } from "../../../afiliacion/identificacion/pdf/pdf-layout-base.component";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Sha256Service } from "src/app/core/services/util/sha256";

@Component({
  selector: "app-punto-cuenta",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-none">
      <!-- Logic component, template is hidden -->
    </div>
  `,
})
export class PuntoCuentaComponent extends PdfLayoutBase {
  private sha256 = inject(Sha256Service);

  @Input() public militar: any;
  @Input() public ordenPago: any;
  @Input() public calculosBunker: any;
  @Input() public usuario: string = "";

  /**
   * Genera el PDF del Punto de Cuenta para la solicitud de anticipo aprobada
   */
  public async generarPDFPuntoCuenta(ordenParam?: any): Promise<void> {
    const orden = ordenParam || this.ordenPago || {};
    const militarObj = this.militar || {};
    const bunker = this.calculosBunker || {};

    const cedula =
      orden.cedula ||
      orden.cedula_beneficiario ||
      militarObj.cedula ||
      militarObj.persona?.datobasico?.cedula ||
      "";
    const docId = `ptocnta-${cedula}-${Date.now()}`;
    const hashId = await this.sha256.hash(docId);
    const nroRef = hashId.substring(0, 6).toUpperCase();

    const qrPayload = {
      id: hashId,
      ruta: "https://sssifanb.ipsfa.gob.ve/validar/" + btoa(cedula),
      tipo: "png",
    };

    const [logoImg, qrImg, firmaImg, selloImg] = await Promise.all([
      this.loadLogo(),
      this.loadQRBase64(qrPayload),
      this.loadFirma(),
      this.loadSello(),
    ]);

    const bodyContent = this.buildPuntoCuentaBody(
      orden,
      militarObj,
      bunker,
      nroRef,
    );

    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg: "", // Sin foto del militar en Punto de Cuenta
      hidePhoto: true,
      pageOrientation: "landscape", // Punto de Cuenta en formato Horizontal
      qrImg,
      firmaImg,
      selloImg,
      title: "PUNTO DE CUENTA - SOLICITUD DE ANTICIPO",
      bodyContent,
    });

    return new Promise<void>((resolve, reject) => {
      try {
        pdfMake
          .createPdf(docDefinition)
          .getBase64()
          .then((base64Data: string) => {
            const dataUri = `data:application/pdf;base64,${base64Data}`;
            const fileName = `Punto_De_Cuenta_Anticipo_${cedula}.pdf`;

            if (window.parent && window !== window.parent) {
              window.parent.postMessage(
                {
                  type: "OPEN_PDF",
                  payload: {
                    fileName,
                    data: dataUri,
                  },
                },
                "*",
              );
              resolve();
            } else {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent,
              );
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

  private buildPuntoCuentaBody(
    orden: any,
    militarObj: any,
    bunker: any,
    hashRef: string,
  ): any[] {
    const formatter = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmt = (val: any) => formatter.format(Number(val) || 0);

    const now = new Date();
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const fechaTexto = `Caracas, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;

    const datobasico = militarObj.persona?.datobasico || {};
    const gradoNombre =
      militarObj.grado?.descripcion ||
      militarObj.nombre_grado ||
      orden.nombre_grado ||
      orden.grado ||
      "";
    const nombres =
      datobasico.nombrecompleto ||
      datobasico.nombres ||
      militarObj.nombres ||
      orden.nombres_beneficiario ||
      orden.nombre ||
      "";
    const apellidos =
      datobasico.apellidos ||
      militarObj.apellidos ||
      orden.apellidos_beneficiario ||
      "";
    const nombreCompletoMilitar = `${gradoNombre} ${nombres} ${apellidos}`.trim();
    const rawCedula =
      datobasico.cedula ||
      militarObj.cedula ||
      orden.cedula ||
      orden.cedula_beneficiario ||
      "";
    const cedula = this.formatCedula(rawCedula);
    const componente =
      militarObj.componente?.descripcion ||
      militarObj.nombre_componente ||
      orden.componente ||
      "";

    const motivo = (
      orden.motivo ||
      orden.motivoTexto ||
      "SOLICITUD DE ANTICIPO DE PRESTACIONES"
    ).toUpperCase();

    const asignacionAntiguedad = bunker.base?.asignacion_antiguedad || 0;
    const asignacionDepositada =
      bunker.base?.depositado_en_banco || bunker.base?.deposito_banco || 0;
    const porcentajeCancelado = bunker.base?.porcentaje_cancelado || 0;
    const anticiposAcumulados = bunker.movimientos?.anticipo || 0;
    const montoOtorgar = orden.monto || orden.montoBs || 0;
    const porcentajeOtorgado = orden.porcentaje || 0;
    const usrModificacion = orden.usr_creacion || this.usuario || "SYSTEM";

    return [
      // Encabezado Fecha
      {
        text: fechaTexto,
        alignment: "right",
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      // Encabezado Destinatario y Nro Punto de Cuenta
      {
        table: {
          widths: ["15%", "50%", "35%"],
          body: [
            [
              { text: "PARA:", fontSize: 10, bold: true },
              { text: "PRESIDENTE DEL IPSFA", fontSize: 10, bold: true },
              {
                text: `Nro. 320.600-${hashRef}r`,
                fontSize: 10,
                bold: true,
                alignment: "center",
              },
            ],
            [
              { text: "DE:", fontSize: 10, bold: true },
              {
                text: "GERENCIA DE BIENESTAR Y SEGURIDAD SOCIAL",
                fontSize: 10,
                bold: true,
              },
              { text: "", fontSize: 10 },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 12],
      },
      // Tabla Principal: ASUNTO | DECISIÓN | MARCO LEGAL
      {
        table: {
          widths: ["52%", "28%", "20%"],
          body: [
            [
              {
                text: "ASUNTO",
                alignment: "center",
                bold: true,
                fillColor: "#dddddd",
                fontSize: 9,
              },
              {
                text: "DECISIÓN",
                alignment: "center",
                bold: true,
                fillColor: "#dddddd",
                fontSize: 9,
              },
              {
                text: "MARCO LEGAL",
                alignment: "center",
                bold: true,
                fillColor: "#dddddd",
                fontSize: 9,
              },
            ],
            [
              // Columna 1: ASUNTO
              {
                stack: [
                  {
                    text: [
                      "  Esta Gerencia somete a la consideración del ciudadano GD. Presidente de la Junta Administradora del IPSFA, la solicitud formulada por ",
                      { text: nombreCompletoMilitar, bold: true },
                      " titular de la cédula de identidad ",
                      { text: `${cedula} (${componente})`, bold: true },
                      " de un adelanto de su Asignación de Antigüedad, con la finalidad: ",
                      { text: motivo, bold: true },
                      "\n\n",
                      "  Al profesional le corresponde por concepto de Asignación de Antigüedad, la cantidad de Bs. ",
                      { text: fmt(asignacionAntiguedad), bold: true },
                      ". Actualmente se le ha depositado un monto total de Bs. ",
                      { text: fmt(asignacionDepositada), bold: true },
                      " lo que representa el ",
                      { text: `${fmt(porcentajeCancelado)}%`, bold: true },
                      " de la Asignación de Antigüedad y se le han otorgado adelantos que totalizan la cantidad de Bs. ",
                      { text: fmt(anticiposAcumulados), bold: true },
                      ". El monto a otorgar es de Bs. ",
                      { text: fmt(montoOtorgar), bold: true },
                      " lo que representa el ",
                      { text: `${fmt(porcentajeOtorgado)}%`, bold: true },
                      " del total depositado en banco.\n\n",
                      "  Esta solicitud cumple con lo establecido en el Artículo 59 de la LOSSFANB (LEY NEGRO PRIMERO).\n\n",
                      "  Por lo que me permito realizar esta tramitación con opinión favorable.\n\n\n\n",
                    ],
                    fontSize: 8.5,
                    alignment: "justify",
                    lineHeight: 1.3,
                  },
                  {
                    text: "TCNEL. CARLOS JOSE MORENO RODRIGUEZ\nGERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
                    alignment: "center",
                    bold: true,
                    fontSize: 8.5,
                  },
                ],
                margin: [4, 6, 4, 6],
              },
              // Columna 2: DECISIÓN
              {
                stack: [
                  {
                    table: {
                      widths: ["60%", "40%"],
                      body: [
                        [
                          { text: "APROBADO", fontSize: 8, bold: true },
                          { text: "[   ]", fontSize: 8, alignment: "center" },
                        ],
                        [
                          { text: "NEGADO", fontSize: 8, bold: true },
                          { text: "[   ]", fontSize: 8, alignment: "center" },
                        ],
                        [
                          { text: "VISTO", fontSize: 8, bold: true },
                          { text: "[   ]", fontSize: 8, alignment: "center" },
                        ],
                        [
                          { text: "DIFERIDO", fontSize: 8, bold: true },
                          { text: "[   ]", fontSize: 8, alignment: "center" },
                        ],
                        [
                          { text: "OTRO", fontSize: 8, bold: true },
                          { text: "[   ]", fontSize: 8, alignment: "center" },
                        ],
                      ],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 60],
                  },
                  {
                    text: "ENRIQUE JOSÉ AROCHA RIVAS\nGENERAL DE DIVISIÓN\nPRESIDENTE DEL I.P.S.F.A.",
                    alignment: "center",
                    bold: true,
                    fontSize: 8,
                  },
                ],
                margin: [4, 6, 4, 6],
              },
              // Columna 3: MARCO LEGAL
              {
                text: "De conformidad con lo dispuesto en el Artículo 59 de la Ley Negro Primero de fecha 29DIC2015, en concordancia con lo establecido en los Artículos 5,6,7 y 8 del Reglamento Parcial de la Ley de Seguridad Social de las Fuerzas Armadas Nacionales Relativo al Pago de la Asignación de Antigüedad y Fallecimiento al Personal Militar Profesional de la Fuerza Armada Nacional de fecha 27JUN2005.",
                fontSize: 8,
                alignment: "justify",
                lineHeight: 1.3,
                margin: [4, 6, 4, 6],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      },
      // Pie de página con usuario
      {
        text: `RJBB/${usrModificacion}`,
        fontSize: 8,
        margin: [0, 15, 0, 0],
      },
    ];
  }
}
