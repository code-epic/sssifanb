import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PdfLayoutBase } from "../../../afiliacion/identificacion/pdf/pdf-layout-base.component";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Sha256Service } from "src/app/core/services/util/sha256";

@Component({
  selector: "app-carta-banco",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-none">
      <!-- Logic component for Carta a Banco Memorandum PDF generation -->
    </div>
  `,
})
export class CartaBancoComponent extends PdfLayoutBase {
  private sha256 = inject(Sha256Service);

  @Input() public anticiposList: any[] = [];
  @Input() public fechaDesde: string = "";
  @Input() public fechaHasta: string = "";
  @Input() public usuario: string = "";

  /**
   * Convierte un número de cantidad a texto en letras en español
   */
  public numeroALetras(num: number): string {
    const unidades = [
      "",
      "UN",
      "DOS",
      "TRES",
      "CUATRO",
      "CINCO",
      "SEIS",
      "SIETE",
      "OCHO",
      "NUEVE",
      "DIEZ",
      "ONCE",
      "DOCE",
      "TRECE",
      "CATORCE",
      "QUINCE",
      "DIECISEIS",
      "DIECISIETE",
      "DIECIOCHO",
      "DIECINUEVE",
      "VEINTE",
      "VEINTIUNO",
      "VEINTIDOS",
      "VEINTITRES",
      "VEINTICUATRO",
      "VEINTICINCO",
      "VEINTISEIS",
      "VEINTISIETE",
      "VEINTIOCHO",
      "VEINTINUEVE",
    ];
    const decenas = [
      "",
      "",
      "VEINTE",
      "TREINTA",
      "CUARENTA",
      "CINCUENTA",
      "SESENTA",
      "SETENTA",
      "OCHENTA",
      "NOVENTA",
    ];
    const centenas = [
      "",
      "CIENTO",
      "DOSCIENTOS",
      "TRESCIENTOS",
      "CUATROCIENTOS",
      "QUINIENTOS",
      "SEISCIENTOS",
      "SETECIENTOS",
      "OCHOCIENTOS",
      "NOVECIENTOS",
    ];

    if (num === 0) return "CERO";
    if (num === 1) return "UNA";
    if (num < 30) return unidades[num];
    if (num < 100) {
      const d = Math.floor(num / 10);
      const u = num % 10;
      return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
    }
    if (num === 100) return "CIEN";
    if (num < 1000) {
      const c = Math.floor(num / 100);
      const r = num % 100;
      return `${centenas[c]} ${this.numeroALetras(r)}`.trim();
    }
    if (num < 1000000) {
      const miles = Math.floor(num / 1000);
      const r = num % 1000;
      const strMiles = miles === 1 ? "MIL" : `${this.numeroALetras(miles)} MIL`;
      return r === 0 ? strMiles : `${strMiles} ${this.numeroALetras(r)}`.trim();
    }
    return String(num);
  }

  /**
   * Genera el PDF Memorandum "Carta a Banco" de la remisión de anticipos aprobados
   */
  public async generarPDFCartaBanco(listaCustom?: any[]): Promise<void> {
    const list = listaCustom || this.anticiposList || [];
    const docId = `cartabanco-${Date.now()}`;
    const hashId = await this.sha256.hash(docId);
    const nroRef = hashId.substring(0, 6).toUpperCase();

    const qrPayload = {
      id: hashId,
      ruta: "https://sssifanb.ipsfa.gob.ve/validar/cartabanco/" + nroRef,
      tipo: "png",
    };

    const [logoImg, qrImg, firmaImg, selloImg] = await Promise.all([
      this.loadLogo(),
      this.loadQRBase64(qrPayload),
      this.loadFirma(),
      this.loadSello(),
    ]);

    const bodyContent = this.buildCartaBancoBody(list, nroRef);

    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg: "",
      hidePhoto: true, // Sin foto en Carta a Banco
      qrImg,
      firmaImg,
      selloImg,
      title: "MEMORÁNDUM - REMISIÓN DE SOLICITUDES DE ADELANTOS",
      bodyContent,
    });

    return new Promise<void>((resolve, reject) => {
      try {
        pdfMake
          .createPdf(docDefinition)
          .getBase64()
          .then((base64Data: string) => {
            const dataUri = `data:application/pdf;base64,${base64Data}`;
            const fileName = `Carta_A_Banco_Anticipos_${nroRef}.pdf`;

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

  /**
   * Formatea un número de cédula agregando puntos separadores de miles y millones (ej: 12.345.678)
   */
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

  private buildCartaBancoBody(list: any[], hashRef: string): any[] {
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
    const fechaActualTexto = `Caracas, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;

    // Fecha de procesamiento (o rango)
    let fechaProcesados = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    if (this.fechaDesde) {
      const fParts = this.fechaDesde.split(" ")[0].split("-");
      if (fParts.length === 3) {
        fechaProcesados = `${fParts[2]}/${fParts[1]}/${fParts[0]}`;
      }
    }

    // Ordenar la lista por número de cédula ascendente
    const sortedList = [...list].sort((a, b) => {
      const cedA = Number(
        String(a.cedula_beneficiario || a.cedula_afiliado || a.cedula || 0).replace(/\D/g, "")
      );
      const cedB = Number(
        String(b.cedula_beneficiario || b.cedula_afiliado || b.cedula || 0).replace(/\D/g, "")
      );
      return cedA - cedB;
    });

    const cantidadNumeros = sortedList.length;
    const cantidadLetras = this.numeroALetras(cantidadNumeros);
    const usrModificacion = this.usuario || this.getResponsable() || "SYSTEM";

    // Filas para la tabla anexa de anticipos
    let totalMonto = 0;
    const tableRows = sortedList.map((item, idx) => {
      const rawCedula =
        item.cedula_beneficiario || item.cedula_afiliado || item.cedula || "";
      const cedulaFormatted = this.formatCedula(rawCedula);
      const nombre =
        `${item.nombres_beneficiario || ""} ${item.apellidos_beneficiario || ""}`.trim() ||
        item.nombre ||
        item.nombre_completo ||
        "N/A";
      const grado =
        item.grado ||
        item.nombre_grado ||
        item.descripcion_grado ||
        item.grado_descripcion ||
        "N/D";
      const componente =
        item.componente || item.nombre_componente || item.descripcion_componente || "FANB";
      const monto = Number(item.monto) || Number(item.montoBs) || 0;
      totalMonto += monto;

      const rowBg = idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF";

      return [
        { text: (idx + 1).toString(), alignment: "center", fontSize: 8, fillColor: rowBg },
        { text: cedulaFormatted, fontSize: 8, bold: true, fillColor: rowBg },
        { text: nombre, fontSize: 8, fillColor: rowBg },
        { text: grado, fontSize: 8, fillColor: rowBg },
        { text: componente, fontSize: 8, alignment: "center", fillColor: rowBg },
        { text: fmt(monto), alignment: "right", fontSize: 8, bold: true, fillColor: rowBg },
      ];
    });

    return [
      // Encabezado Titulo Memorandum
      {
        text: "MEMORÁNDUM",
        alignment: "center",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 15],
      },
      // Datos del Memorándum
      {
        table: {
          widths: ["15%", "85%"],
          body: [
            [
              { text: "Nro.", fontSize: 10, bold: true },
              {
                text: `320.600-${hashRef}/01`,
                fontSize: 10,
                bold: true,
              },
            ],
            [
              { text: "DE:", fontSize: 10, bold: true },
              {
                text: "TCNEL. GERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
                fontSize: 10,
                bold: true,
              },
            ],
            [
              { text: "PARA:", fontSize: 10, bold: true },
              {
                text: "CNEL. GERENTE DE FINANZAS\nA/C SUB. GERENCIA DE TESORERIA",
                fontSize: 10,
                bold: true,
              },
            ],
            [
              { text: "ASUNTO:", fontSize: 10, bold: true },
              {
                text: "REMISION DE SOLICITUDES DE ADELANTOS.",
                fontSize: 10,
                bold: true,
              },
            ],
            [
              { text: "REF.:", fontSize: 10, bold: true },
              {
                text: "LOSSFAN (LEY NEGRO PRIMERO)",
                fontSize: 10,
                bold: true,
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 20],
      },
      // Cuerpo del Texto
      {
        text: [
          "    Tengo el honor de dirigirme a usted en la oportunidad de remitirle anexo a la presente ",
          { text: `${cantidadLetras} ( ${cantidadNumeros} )`, bold: true },
          " solicitudes de adelantos correspondientes a los diferentes componentes, para su debido trámite ante las entidades bancarias descritas en la relación anexa, procesados el ",
          { text: fechaProcesados, bold: true },
          ".\n\n",
          "    Remisión que hago llegar a usted, para su conocimiento y demás fines.\n\n\n",
        ],
        fontSize: 10,
        alignment: "justify",
        lineHeight: 1.5,
        margin: [0, 0, 0, 15],
      },
      // Firma
      {
        stack: [
          { text: "Atentamente,", alignment: "center", fontSize: 10 },
          {
            text: fechaActualTexto,
            alignment: "right",
            fontSize: 9,
            margin: [0, 5, 0, 20],
          },
          {
            text: "TCNEL. CARLOS JOSE MORENO RODRIGUEZ\nGERENTE DE BIENESTAR Y SEGURIDAD SOCIAL",
            alignment: "center",
            bold: true,
            fontSize: 9.5,
          },
        ],
        margin: [0, 0, 0, 20],
      },
      // Tabla Anexa de Adelantos si hay registros
      ...(sortedList.length > 0
        ? [
            {
              text: "RELACIÓN DE ADELANTOS REMITIDOS",
              style: "seccionHeader",
              alignment: "center",
              margin: [0, 10, 0, 8],
              pageBreak: "before",
            },
            {
              table: {
                headerRows: 1,
                widths: ["5%", "17%", "33%", "16%", "14%", "15%"],
                body: [
                  [
                    {
                      text: "#",
                      style: "tableHeader",
                      alignment: "center",
                    },
                    { text: "Cédula", style: "tableHeader" },
                    { text: "Beneficiario / Nombre", style: "tableHeader" },
                    { text: "Grado", style: "tableHeader" },
                    { text: "Componente", style: "tableHeader", alignment: "center" },
                    {
                      text: "Monto (Bs.)",
                      style: "tableHeader",
                      alignment: "right",
                    },
                  ],
                  ...tableRows,
                  [
                    {
                      text: "TOTAL REMITIDO",
                      colSpan: 5,
                      bold: true,
                      alignment: "right",
                      fontSize: 8.5,
                      fillColor: "#F1F5F9",
                    },
                    {},
                    {},
                    {},
                    {},
                    {
                      text: fmt(totalMonto),
                      bold: true,
                      alignment: "right",
                      fontSize: 8.5,
                      fillColor: "#F1F5F9",
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => "#cbd5e1",
                vLineColor: () => "#cbd5e1",
              },
            },
          ]
        : []),
      // Pie de firma de usuario
      {
        text: `RJBB/${usrModificacion}`,
        fontSize: 8,
        margin: [0, 20, 0, 0],
      },
    ];
  }
}
