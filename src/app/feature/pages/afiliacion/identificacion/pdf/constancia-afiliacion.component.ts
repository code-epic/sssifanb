import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PdfLayoutBase } from "./pdf-layout-base.component";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Sha256Service } from "src/app/core/services/util/sha256";
import { UtilService } from "src/app/core/services/util/util.service";

@Component({
  selector: "app-constancia-afiliacion",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-none">
      <!-- Logic component, template is hidden -->
    </div>
  `,
})
export class ConstanciaAfiliacionComponent extends PdfLayoutBase {
  private sha256 = inject(Sha256Service);
  private utilService = inject(UtilService);

  @Input() public militar: any;
  @Input() public familiares: any[] = [];
  @Input() public firmante = {
    nombre: "GD. CÉSAR AUGUSTO FEBRES CABELLO",
    grado: "GENERAL DE DIVISIÓN",
    cargo: "PRESIDENTE DE LA JUNTA ADMINISTRADORA DEL I.P.S.F.A.N.B.",
  };

  /**
   * Ejecuta la generación y apertura de la Constancia de Afiliación en PDF
   */
  public async generarPDFConstancia(): Promise<void> {
    if (!this.militar) {
      console.warn(
        "No hay datos de militar cargados para generar la constancia.",
      );
      return;
    }

    const militarDb = this.militar.persona?.datobasico;
    const cedulaTitular = militarDb?.cedula || "";
    const abrevGrado =
      this.militar?.grado?.abreviatura ||
      this.militar?.Grado?.abreviatura ||
      "";

    const docId = `doc-${cedulaTitular}`;
    const hashId = await this.sha256.hash(docId);

    // Objeto JSON exacto para el endpoint MakeQR solicitado para evitar Bad Request 400
    const qrPayload = {
      id: hashId,
      ruta: "https://sssifanb.ipsfa.gob.ve/validar/" + btoa(cedulaTitular),
      tipo: "png",
    };

    // 1. Cargar assets en paralelo (Omitiendo watermarkImg para usar la marca de agua textual I.P.S.F.A.N.B)
    const [logoImg, photoImg, gradoBadgeImg, qrImg, firmaImg, selloImg] = await Promise.all([
      this.loadLogo(),
      this.loadPhotoBase64(cedulaTitular),
      this.loadGradoBadgeBase64(abrevGrado),
      this.loadQRBase64(qrPayload),
      this.loadFirma(),
      this.loadSello(),
    ]);

    // 2. Construir el cuerpo dinámico del PDF
    const bodyContent = this.buildBodyContent(militarDb);

    // 3. Crear el Document Definition extendiendo del Base Layout
    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg,
      gradoBadgeImg,
      qrImg,
      firmaImg,
      selloImg,
      title: "CONSTANCIA DE AFILIACIÓN",
      bodyContent,
    });

    // 4. Renderizar y transmitir el PDF al contenedor principal (Tauri/Browser)
    pdfMake
      .createPdf(docDefinition)
      .getBase64()
      .then((base64Data: string) => {
        const dataUri = `data:application/pdf;base64,${base64Data}`;
        const fileName = `Constancia_Afiliacion_${cedulaTitular}.pdf`;

        if (window.parent && window !== window.parent) {
          window.parent.postMessage(
            {
              type: "OPEN_PDF",
              payload: {
                fileName,
                base64: dataUri,
              },
            },
            "*",
          );
        } else {
          // Descarga usando blob para máxima compatibilidad con navegadores y webviews móviles
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
              });
          } else {
            pdfMake.createPdf(docDefinition).open();
          }
        }
      });
  }

  /**
   * Formatea cualquier objeto, cadena o timestamp de fecha al estándar DD/MM/YYYY con ceros a la izquierda
   */
  private formatToDDMMYYYY(dateInput: any): string {
    if (!dateInput) return "N/D";
    try {
      let dateObj: Date;
      if (typeof dateInput === "string") {
        dateObj = new Date(dateInput);
      } else if (dateInput.$date && typeof dateInput.$date === "string") {
        dateObj = new Date(dateInput.$date);
      } else if (dateInput instanceof Date) {
        dateObj = new Date(dateInput.getTime());
      } else {
        dateObj = new Date(dateInput);
      }

      if (isNaN(dateObj.getTime())) return "N/D";

      // Aplicar el desfase de zona horaria local (getTimezoneOffset) al igual que en la interfaz del sistema
      const offset = dateObj.getTimezoneOffset();
      dateObj.setMinutes(dateObj.getMinutes() + offset);

      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (e) {
      return "N/D";
    }
  }

  /**
   * Construye los elementos y tablas que conforman el cuerpo de la constancia
   */
  private buildBodyContent(militarDb: any): any[] {
    // Extracción de nombres y apellidos
    let nombres = "";
    let apellidos = "";
    if (militarDb) {
      nombres =
        militarDb.nombres ||
        [militarDb.nombreprimero, militarDb.nombresegundo]
          .filter(Boolean)
          .join(" ") ||
        militarDb.primernombre ||
        "";
      apellidos =
        militarDb.apellidos ||
        [militarDb.apellidoprimero, militarDb.apellidosegundo]
          .filter(Boolean)
          .join(" ") ||
        militarDb.primerapellido ||
        "";
    }
    const nombreCompleto =
      `${nombres} ${apellidos}`.trim().toUpperCase() || "NO DISPONIBLE";
    const cedula = militarDb?.cedula || "N/D";
    const sexo = String(militarDb?.sexo || "")
      .toUpperCase()
      .trim();

    // Mapeo del Estado Civil según el Sexo
    const rawEdoCivil = String(
      this.militar.persona?.estadocivil || militarDb?.estadocivil || "",
    )
      .toUpperCase()
      .trim();
    let edoCivil = "SOLTERO(A)";

    if (sexo === "M") {
      if (rawEdoCivil === "S" || rawEdoCivil === "SOLTERO")
        edoCivil = "SOLTERO";
      else if (rawEdoCivil === "C" || rawEdoCivil === "CASADO")
        edoCivil = "CASADO";
      else if (rawEdoCivil === "D" || rawEdoCivil === "DIVORCIADO")
        edoCivil = "DIVORCIADO";
      else if (rawEdoCivil === "V" || rawEdoCivil === "VIUDO")
        edoCivil = "VIUDO";
      else edoCivil = rawEdoCivil || "SOLTERO";
    } else if (sexo === "F") {
      if (
        rawEdoCivil === "S" ||
        rawEdoCivil === "SOLTERA" ||
        rawEdoCivil === "SOLTERO"
      )
        edoCivil = "SOLTERA";
      else if (
        rawEdoCivil === "C" ||
        rawEdoCivil === "CASADA" ||
        rawEdoCivil === "CASADO"
      )
        edoCivil = "CASADA";
      else if (
        rawEdoCivil === "D" ||
        rawEdoCivil === "DIVORCIADA" ||
        rawEdoCivil === "DIVORCIADO"
      )
        edoCivil = "DIVORCIADA";
      else if (
        rawEdoCivil === "V" ||
        rawEdoCivil === "VIUDA" ||
        rawEdoCivil === "VIUDO"
      )
        edoCivil = "VIUDA";
      else edoCivil = rawEdoCivil || "SOLTERA";
    } else {
      if (rawEdoCivil === "S") edoCivil = "SOLTERO(A)";
      else if (rawEdoCivil === "C") edoCivil = "CASADO(A)";
      else if (rawEdoCivil === "D") edoCivil = "DIVORCIADO(A)";
      else if (rawEdoCivil === "V") edoCivil = "VIUDO(A)";
      else edoCivil = rawEdoCivil || "SOLTERO(A)";
    }

    // Formateo estricto a DD/MM/YYYY
    const fechaNac = this.formatToDDMMYYYY(militarDb?.fechanacimiento);
    const sexoStr =
      sexo === "M" ? "MASCULINO" : sexo === "F" ? "FEMENINO" : "N/D";

    // Datos Militares
    let componente = "N/D";
    if (this.militar.componente) {
      if (typeof this.militar.componente === "string") {
        componente = this.militar.componente;
      } else if (this.militar.componente.descripcion) {
        componente = this.militar.componente.descripcion;
      } else if (this.militar.componente.nombre) {
        componente = this.militar.componente.nombre;
      } else if (this.militar.componente.abreviatura) {
        componente = this.militar.componente.abreviatura;
      }
    }

    let grado = "N/D";
    if (this.militar.grado) {
      if (typeof this.militar.grado === "string") {
        grado = this.militar.grado;
      } else if (this.militar.grado.descripcion) {
        grado = this.militar.grado.descripcion;
      } else if (this.militar.grado.nombre) {
        grado = this.militar.grado.nombre;
      } else if (this.militar.grado.abreviatura) {
        grado = this.militar.grado.abreviatura;
      }
    }

    let situacion = "N/D";
    if (this.militar.situacion) {
      const code = String(
        typeof this.militar.situacion === "string"
          ? this.militar.situacion
          : this.militar.situacion.nombre ||
              this.militar.situacion.abreviatura ||
              "",
      )
        .toUpperCase()
        .trim();

      if (code === "ACT") {
        situacion = "ACTIVO";
      } else if (code === "RCP") {
        situacion = "RETIRADO CON PENSIÓN";
      } else if (code === "RSP") {
        situacion = "RETIRADO SIN PENSIÓN";
      } else if (code === "PG") {
        situacion = "PENSIONADO DE GRACIA";
      } else if (code === "I") {
        situacion = "INVALIDEZ";
      } else {
        situacion = code || "N/D";
      }
    }

    let categoria = "N/D";
    if (this.militar.categoria) {
      const code = String(
        typeof this.militar.categoria === "string"
          ? this.militar.categoria
          : this.militar.categoria.nombre || this.militar.categoria.abreviatura || ""
      ).toUpperCase().trim();

      if (code === "EFE") {
        categoria = "EFECTIVO";
      } else if (code === "ASI") {
        categoria = "ASIMILADO";
      } else {
        categoria = code || "N/D";
      }
    }

    // Formateo estricto a DD/MM/YYYY para fechas de servicio
    const fIngreso = this.formatToDDMMYYYY(this.militar.fingreso);
    const fAscenso = this.formatToDDMMYYYY(this.militar.fascenso);
    // Calcular dinámicamente los años de servicio alineado con la lógica de la WEB
    let fingresoIso = "";
    let fretiroIso = "";
    if (this.militar.fingreso) {
      const dateVal = this.militar.fingreso.$date || this.militar.fingreso;
      if (typeof dateVal === "string") {
        fingresoIso = dateVal.split("T")[0];
      }
    }
    if (this.militar.fretiro) {
      const dateVal = this.militar.fretiro.$date || this.militar.fretiro;
      if (typeof dateVal === "string") {
        fretiroIso = dateVal.split("T")[0];
      }
    }
    const sitCode = String(this.militar.situacion || "").toUpperCase().trim();
    const anosServicio = this.utilService.calcularTServicio(fingresoIso, fretiroIso, sitCode) || "N/D";

    const fechaHoyString = this.getFechaHoyTexto();

    return [
      // 1. Texto de Acreditación Principal
      {
        text: [
          { text: "Quien suscribe, " },
          { text: this.firmante.nombre, bold: true },
          { text: `, en mi carácter de ` },
          { text: this.firmante.cargo, bold: true },
          {
            text: ", hace constar por medio de la presente que el (la) CIUDADANO (A): ",
          },
          { text: `${String(grado).toUpperCase()} `, bold: true },
          { text: `${nombreCompleto}`, bold: true },
          { text: ", del componente " },
          { text: `${String(componente).toUpperCase()}`, bold: true },
          { text: ", titular de la Cédula de Identidad número " },
          { text: `V.- ${cedula}`, bold: true },
          {
            text: ", se encuentra registrado(a) y Afiliado(a) en la base de datos de Seguridad Social de este Instituto.",
          },
        ],
        alignment: "justify",
        fontSize: 9.5,
        lineHeight: 1.4,
        margin: [0, 5, 0, 10],
      },

      // 2. Tabla Datos Personales
      { text: "DATOS PERSONALES", style: "seccionHeader" },
      {
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: [
            [
              { text: "Estado Civil", style: "tableHeader" },
              { text: "Fecha Nacimiento", style: "tableHeader" },
              { text: "Género / Sexo", style: "tableHeader" },
              { text: "Cédula Identidad", style: "tableHeader" },
            ],
            [
              { text: String(edoCivil).toUpperCase(), fontSize: 8.5 },
              { text: fechaNac, fontSize: 8.5 },
              { text: String(sexoStr).toUpperCase(), fontSize: 8.5 },
              { text: `V-${cedula}`, bold: true, fontSize: 8.5 },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#CBD5E1",
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 8],
      },

      // 3. Tabla Datos Militares
      { text: "DATOS MILITARES", style: "seccionHeader" },
      {
        table: {
          widths: ["20%", "30%", "20%", "30%"],
          body: [
            [
              { text: "Componente", style: "tableHeader" },
              {
                text: String(componente).toUpperCase(),
                bold: true,
                fontSize: 8.5,
              },
              { text: "Grado Militar", style: "tableHeader" },
              { text: String(grado).toUpperCase(), bold: true, fontSize: 8.5 },
            ],
            [
              { text: "Situación", style: "tableHeader" },
              { text: String(situacion).toUpperCase(), fontSize: 8.5 },
              { text: "Categoría", style: "tableHeader" },
              { text: String(categoria).toUpperCase(), fontSize: 8.5 },
            ],
            [
              { text: "Ingreso FANB", style: "tableHeader" },
              { text: fIngreso, fontSize: 8.5 },
              { text: "Último Ascenso", style: "tableHeader" },
              { text: fAscenso, fontSize: 8.5 },
            ],
            [
              { text: "Años Servicio", style: "tableHeader" },
              { text: anosServicio, colSpan: 3, fontSize: 8.5 },
              {},
              {},
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#CBD5E1",
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 10],
      },

      // 4. Tabla Familiares Afiliados (Condensada)
      { text: "FAMILIARES AFILIADOS REGISTRADOS", style: "seccionHeader" },
      this.buildFamiliaresTable(),

      // 5. Cierre Legal del Documento
      {
        text: `Constancia que se expide a petición de la parte interesada en la Ciudad de Caracas, a los ${fechaHoyString}.`,
        fontSize: 9.5,
        alignment: "justify",
        margin: [0, 10, 0, 15],
      },

      // 6. Firma y Sello (Alineado más abajo mediante un margen superior aumentado)
      {
        margin: [0, 10, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              // Contenedor de firma y sello superpuestos
              ...(this.firmaBase64
                ? [
                    {
                      columns: [
                        { width: "*", text: "" },
                        {
                          image: "firma",
                          width: 185, // Más alargada horizontalmente
                          height: 64,
                          alignment: "center",
                        },
                        {
                          image: "sello",
                          width: 115,  // Aún más ancho para mayor notoriedad
                          height: 62,
                          margin: [-60, -2, 0, 0], // Incrementamos el solapamiento a la izquierda
                        },
                        { width: "*", text: "" },
                      ],
                      margin: [60, 0, 0, -18], // Desplazamos la firma y el sello 60pt a la derecha, cerca de la línea
                    },
                  ]
                : []),
              {
                text: "_______________________________________",
                alignment: "center",
                color: "#94A3B8",
              },
              {
                text: this.firmante.nombre,
                bold: true,
                alignment: "center",
                fontSize: 8.5,
                margin: [0, 2, 0, 0],
              },
              {
                text: this.firmante.grado,
                alignment: "center",
                fontSize: 7.5,
                color: "#475569",
              },
              {
                text: this.firmante.cargo,
                alignment: "center",
                fontSize: 7,
                color: "#475569",
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Genera el nodo de tabla condensada para familiares
   */
  private buildFamiliaresTable(): any {
    if (!this.familiares || this.familiares.length === 0) {
      return {
        text: "No se registran familiares afiliados cargados en el sistema.",
        fontSize: 8.5,
        italic: true,
        margin: [0, 3, 0, 8],
      };
    }

    const tableBody: any[][] = [
      [
        { text: "Parentesco", style: "tableHeader" },
        { text: "Cédula", style: "tableHeader" },
        { text: "Nombres y Apellidos", style: "tableHeader" },
        { text: "Fecha Nacimiento", style: "tableHeader" },
        { text: "Estatus Afiliación", style: "tableHeader" },
      ],
    ];

    this.familiares.forEach((fam) => {
      const parentesco = fam.parentesco || "N/D";
      const cedula = fam.cedula || "S/C";
      const nombres = fam.nombres || "N/D";
      const fechanac = this.formatToDDMMYYYY(fam.fechanacimiento); // Formateo estricto a DD/MM/YYYY
      const estatus = fam.inactivo ? "INACTIVO" : "ACTIVO";
      const estatusStyle = fam.inactivo
        ? { text: estatus, color: "#EF4444", fontSize: 8 }
        : { text: estatus, color: "#10B981", bold: true, fontSize: 8 };

      tableBody.push([
        { text: String(parentesco).toUpperCase(), fontSize: 8 },
        { text: cedula, fontSize: 8 },
        { text: String(nombres).toUpperCase(), fontSize: 8 },
        { text: fechanac, fontSize: 8 },
        estatusStyle,
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ["15%", "15%", "40%", "15%", "15%"],
        body: tableBody,
      },
      layout: {
        hLineWidth: (i: number) => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#E2E8F0",
        paddingTop: () => 2.2,
        paddingBottom: () => 2.2,
      },
      margin: [0, 0, 0, 8],
    };
  }

  /**
   * Retorna la fecha de hoy formateada de forma textual en castellano
   */
  private getFechaHoyTexto(): string {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = meses[hoy.getMonth()];
    const anio = hoy.getFullYear();

    return `${dia} días del mes de ${mes} del año ${anio}`;
  }
}
