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
  public async generarPDFPuntoCuenta(
    ordenParam?: any,
    militarParam?: any,
    calculosParam?: any,
  ): Promise<void> {
    const orden = ordenParam || this.ordenPago || {};
    const militarObj = militarParam || this.militar || {};
    const bunker = calculosParam || this.calculosBunker || {};

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

    const usrModificacion = orden.usr_creacion || this.usuario || "SYSTEM";

    const bodyContent = this.buildPuntoCuentaBody(
      orden,
      militarObj,
      bunker,
      nroRef,
      firmaImg,
      selloImg,
    );

    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg: "", // Sin foto en Punto de Cuenta
      hidePhoto: true,
      pageOrientation: "portrait", // Formato Vertical
      qrImg,
      firmaImg,
      selloImg,
      title: "",
      bodyContent,
    });

    // Configuración exacta para formato vertical idéntico al modelo militar oficial
    docDefinition.pageOrientation = "portrait";
    docDefinition.pageMargins = [34, 122, 34, 45];
    docDefinition.content = bodyContent;

    const now = new Date();
    const mesesCortos = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    const fechaCorta = `${String(now.getDate()).padStart(2, "0")} ${mesesCortos[now.getMonth()]} ${now.getFullYear()}`;

    // Encabezado institucional idéntico al formato oficial
    docDefinition.header = (currentPage: number, pageCount: number) => {
      return {
        margin: [34, 12, 34, 0],
        stack: [
          {
            text: "PUNTO DE CUENTA AL CIUDADANO GENERAL DE DIVISIÓN\nPRESIDENTE DE LA JUNTA ADMINISTRADORA DEL I.P.S.F.A.",
            alignment: "center",
            bold: true,
            fontSize: 9.5,
            margin: [0, 0, 0, 5],
          },
          {
            table: {
              widths: ["30%", "70%"],
              body: [
                [
                  // Columna izquierda: Logo + Membrete + N° Referencia
                  {
                    stack: [
                      logoImg
                        ? { image: "logo", fit: [38, 38], alignment: "center" }
                        : { text: "", margin: [0, 10, 0, 0] },
                      {
                        text: "República Bolivariana de Venezuela",
                        alignment: "center",
                        bold: true,
                        fontSize: 6,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: "Instituto de Previsión Social de la FANB",
                        alignment: "center",
                        fontSize: 5.5,
                        margin: [0, 0, 0, 2],
                      },
                      {
                        table: {
                          widths: ["100%"],
                          body: [
                            [
                              {
                                text: `N°  320.600 - ${nroRef}r`,
                                bold: true,
                                fontSize: 8,
                                alignment: "center",
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
                    ],
                    margin: [2, 2, 2, 2],
                  },
                  // Columna derecha: Presentante + Fecha + Página
                  {
                    table: {
                      widths: ["68%", "32%"],
                      body: [
                        [
                          {
                            colSpan: 2,
                            stack: [
                              {
                                text: "Presentante:",
                                fontSize: 7,
                                color: "#475569",
                              },
                              {
                                text: "TCNEL. CARLOS JOSE MORENO RODRIGUEZ",
                                bold: true,
                                fontSize: 8,
                                alignment: "center",
                                margin: [0, 1, 0, 0],
                              },
                              {
                                text: "GERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
                                bold: true,
                                fontSize: 7,
                                alignment: "center",
                              },
                            ],
                            margin: [4, 2, 4, 2],
                          },
                          {},
                        ],
                        [
                          {
                            text: `Fecha:  ${fechaCorta}`,
                            fontSize: 7.5,
                            bold: true,
                            margin: [4, 3, 4, 3],
                          },
                          {
                            text: `Página: ${currentPage}/${pageCount}`,
                            fontSize: 7.5,
                            bold: true,
                            alignment: "center",
                            margin: [2, 3, 2, 3],
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
        ],
      };
    };

    // Pie de página con control de modificación y validación electrónica
    docDefinition.footer = (currentPage: number, pageCount: number) => {
      return {
        margin: [34, 6, 34, 0],
        columns: [
          {
            width: "*",
            stack: [
              {
                text: `RJBB/${usrModificacion}`,
                fontSize: 7.5,
                bold: true,
                color: "#334155",
                margin: [0, 0, 0, 2],
              },
              {
                text: "Esta constancia es un documento electrónico con validez legal según las regulaciones del I.P.S.F.A.N.B.",
                fontSize: 6.5,
                color: "#64748B",
                italic: true,
              },
            ],
          },
          ...(qrImg
            ? [
                {
                  width: 38,
                  image: "qr",
                  fit: [34, 34],
                  alignment: "right",
                },
              ]
            : []),
        ],
      };
    };

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
    firmaImg: string,
    selloImg: string,
  ): any[] {
    const formatter = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmt = (val: any) => formatter.format(Number(val) || 0);

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
    const nombreCompletoMilitar =
      `${gradoNombre} ${nombres} ${apellidos}`.trim();
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

    const redHeader = (title: string) => ({
      text: title,
      fillColor: "#B91C1C",
      color: "#FFFFFF",
      bold: true,
      fontSize: 8.5,
      margin: [4, 2, 4, 2],
    });

    const boxLayout = {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    };

    return [
      // 1. SECCIÓN: ASUNTO
      {
        table: {
          widths: ["100%"],
          dontBreakRows: true,
          body: [
            [redHeader("ASUNTO:")],
            [
              {
                text: [
                  "SOLICITUD DE ADELANTO DE ASIGNACIÓN DE ANTIGÜEDAD FORMULADA POR EL ",
                  { text: nombreCompletoMilitar.toUpperCase(), bold: true },
                  ", TITULAR DE LA CÉDULA DE IDENTIDAD ",
                  {
                    text: `${cedula} (${componente})`.toUpperCase(),
                    bold: true,
                  },
                  ", CON LA FINALIDAD: ",
                  { text: motivo, bold: true },
                  ".",
                ],
                fontSize: 8,
                alignment: "justify",
                lineHeight: 1.25,
                margin: [5, 5, 5, 5],
              },
            ],
          ],
        },
        layout: boxLayout,
        margin: [0, 0, 0, 6],
      },

      // 2. SECCIÓN: ARGUMENTACIÓN
      {
        table: {
          widths: ["100%"],
          dontBreakRows: true,
          body: [
            [redHeader("ARGUMENTACIÓN:")],
            [
              {
                stack: [
                  {
                    text: [
                      "  Esta Gerencia somete a la consideración del ciudadano GD. Presidente de la Junta Administradora del IPSFA, el siguiente planteamiento:\n\n",
                      "  La solicitud formulada por el ciudadano ",
                      { text: nombreCompletoMilitar, bold: true },
                      ", titular de la cédula de identidad ",
                      { text: `${cedula} (${componente})`, bold: true },
                      ", quien solicita un adelanto de su Asignación de Antigüedad, con la finalidad de: ",
                      { text: motivo, bold: true },
                      ".\n\n",
                      "  Al profesional militar le corresponde por concepto de Asignación de Antigüedad la cantidad de Bs. ",
                      { text: fmt(asignacionAntiguedad), bold: true },
                      ". Actualmente se le ha depositado un monto total de Bs. ",
                      { text: fmt(asignacionDepositada), bold: true },
                      ", lo que representa el ",
                      { text: `${fmt(porcentajeCancelado)}%`, bold: true },
                      " de la Asignación de Antigüedad y se le han otorgado adelantos que totalizan la cantidad de Bs. ",
                      { text: fmt(anticiposAcumulados), bold: true },
                      ". El monto a otorgar es de Bs. ",
                      { text: fmt(montoOtorgar), bold: true },
                      ", lo que representa el ",
                      { text: `${fmt(porcentajeOtorgado)}%`, bold: true },
                      " del total depositado en banco.\n\n",
                      "  De conformidad con lo dispuesto en el Artículo 59 de la Ley Orgánica de Seguridad Social de las Fuerzas Armadas Nacionales (Ley Negro Primero) de fecha 29DIC2015, en concordancia con lo establecido en los Artículos 5, 6, 7 y 8 del Reglamento Parcial de la Ley de Seguridad Social de las Fuerzas Armadas Nacionales Relativo al Pago de la Asignación de Antigüedad y Fallecimiento al Personal Militar Profesional de la Fuerza Armada Nacional de fecha 27JUN2005.\n\n",
                      "  La presente solicitud cumple a cabalidad con los extremos de ley y normativas vigentes.",
                    ],
                    fontSize: 8,
                    alignment: "justify",
                    lineHeight: 1.25,
                  },
                ],
                margin: [5, 5, 5, 5],
              },
            ],
          ],
        },
        layout: boxLayout,
        margin: [0, 0, 0, 6],
      },

      // 3. SECCIÓN: PROPUESTA
      {
        table: {
          widths: ["100%"],
          dontBreakRows: true,
          body: [
            [redHeader("PROPUESTA:")],
            [
              {
                text: [
                  "  Salvo mejor criterio, esta Gerencia propone muy respetuosamente al ciudadano GD. Presidente de la Junta Administradora del IPSFA, se autorice la tramitación y liquidación del adelanto de Asignación de Antigüedad por la cantidad de Bs. ",
                  { text: fmt(montoOtorgar), bold: true },
                  " (",
                  { text: `${fmt(porcentajeOtorgado)}%`, bold: true },
                  " del total depositado en banco), a favor del ciudadano ",
                  { text: nombreCompletoMilitar, bold: true },
                  ", titular de la cédula de identidad ",
                  { text: `${cedula} (${componente})`, bold: true },
                  ", con la finalidad: ",
                  { text: motivo, bold: true },
                  ", por lo que me permito realizar esta tramitación con opinión favorable.",
                ],
                fontSize: 8,
                alignment: "justify",
                lineHeight: 1.25,
                margin: [5, 5, 5, 5],
              },
            ],
          ],
        },
        layout: boxLayout,
        margin: [0, 0, 0, 6],
      },

      // 4. SECCIÓN: DECISIÓN
      {
        table: {
          widths: ["100%"],
          dontBreakRows: true,
          body: [
            [
              redHeader(
                "DECISIÓN DEL PRESIDENTE DE LA JUNTA ADMINISTRADORA DEL I.P.S.F.A.:",
              ),
            ],
            [
              {
                stack: [
                  // Opciones de decisión
                  {
                    table: {
                      widths: ["20%", "20%", "20%", "20%", "20%"],
                      body: [
                        [
                          {
                            text: [
                              { text: "APROBADO ", bold: true },
                              { text: "[   ]", bold: true },
                            ],
                            alignment: "center",
                            fontSize: 7.5,
                          },
                          {
                            text: [
                              { text: "NEGADO ", bold: true },
                              { text: "[   ]", bold: true },
                            ],
                            alignment: "center",
                            fontSize: 7.5,
                          },
                          {
                            text: [
                              { text: "VISTO ", bold: true },
                              { text: "[   ]", bold: true },
                            ],
                            alignment: "center",
                            fontSize: 7.5,
                          },
                          {
                            text: [
                              { text: "DIFERIDO ", bold: true },
                              { text: "[   ]", bold: true },
                            ],
                            alignment: "center",
                            fontSize: 7.5,
                          },
                          {
                            text: [
                              { text: "OTRO ", bold: true },
                              { text: "[   ]", bold: true },
                            ],
                            alignment: "center",
                            fontSize: 7.5,
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                    margin: [0, 2, 0, 10],
                  },
                  // Firmas de representantes institucionales
                  {
                    columns: [
                      // Presentante (Izquierda)
                      {
                        width: "50%",
                        stack: [
                          { text: "", margin: [0, 26, 0, 0] },
                          {
                            text: "_______________________________________",
                            alignment: "center",
                            color: "#64748B",
                          },
                          {
                            text: "TCNEL. JOSE TRINIDAD DORANTE",
                            bold: true,
                            fontSize: 8,
                            alignment: "center",
                            margin: [0, 2, 0, 0],
                          },
                          {
                            text: "GERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
                            bold: true,
                            fontSize: 7,
                            alignment: "center",
                          },
                        ],
                      },
                      // Presidente (Derecha)
                      {
                        width: "50%",
                        stack: [
                          ...(firmaImg
                            ? [
                                {
                                  columns: [
                                    { width: "*", text: "" },
                                    {
                                      image: "firma",
                                      width: 110,
                                      height: 40,
                                      alignment: "center",
                                    },
                                    ...(selloImg
                                      ? [
                                          {
                                            image: "sello",
                                            width: 55,
                                            height: 40,
                                            margin: [-30, -5, 0, 0],
                                          },
                                        ]
                                      : []),
                                    { width: "*", text: "" },
                                  ],
                                  margin: [0, 0, 0, -14],
                                },
                              ]
                            : [{ text: "", margin: [0, 26, 0, 0] }]),
                          {
                            text: "_______________________________________",
                            alignment: "center",
                            color: "#64748B",
                          },
                          {
                            text: "ENRIQUE JOSÉ AROCHA RIVAS",
                            bold: true,
                            fontSize: 8,
                            alignment: "center",
                            margin: [0, 2, 0, 0],
                          },
                          {
                            text: "GENERAL DE DIVISIÓN",
                            bold: true,
                            fontSize: 7,
                            alignment: "center",
                          },
                          {
                            text: "PRESIDENTE DEL I.P.S.F.A.",
                            bold: true,
                            fontSize: 7,
                            alignment: "center",
                          },
                        ],
                      },
                    ],
                    margin: [0, 0, 0, 4],
                  },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: boxLayout,
        margin: [0, 0, 0, 4],
      },
    ];
  }
}
