import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PdfLayoutBase } from "./pdf-layout-base.component";
import * as pdfMake from "pdfmake/build/pdfmake";

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
      console.warn("No hay datos de militar cargados para generar la constancia.");
      return;
    }

    const militarDb = this.militar.persona?.datobasico;
    const cedulaTitular = militarDb?.cedula || "";
    const abrevGrado = this.militar?.grado?.abreviatura || this.militar?.Grado?.abreviatura || "";

    // Objeto JSON exacto para el endpoint MakeQR solicitado para evitar Bad Request 400
    const qrPayload = {
      id: "doc-456",
      ruta: "https://api.sandra.com/docs/456",
      tipo: "png"
    };

    // 1. Cargar assets en paralelo (Omitiendo watermarkImg para usar la marca de agua textual I.P.S.F.A.N.B)
    const [logoImg, photoImg, gradoBadgeImg, qrImg] = await Promise.all([
      this.loadLogo(),
      this.loadPhotoBase64(cedulaTitular),
      this.loadGradoBadgeBase64(abrevGrado),
      this.loadQRBase64(qrPayload),
    ]);

    // 2. Construir el cuerpo dinámico del PDF
    const bodyContent = this.buildBodyContent(militarDb);

    // 3. Crear el Document Definition extendiendo del Base Layout
    const docDefinition = await this.buildDocDefinition({
      logoImg,
      photoImg,
      gradoBadgeImg,
      qrImg,
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
          pdfMake.createPdf(docDefinition).open();
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
      if (dateInput instanceof Date) {
        dateObj = dateInput;
      } else if (typeof dateInput === "string") {
        const cleanStr = dateInput.split("T")[0];
        const parts = cleanStr.split("-");
        if (parts.length === 3) {
          // Formato YYYY-MM-DD
          dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          dateObj = new Date(dateInput);
        }
      } else if (dateInput.$date) {
        dateObj = new Date(dateInput.$date);
      } else {
        dateObj = new Date(dateInput);
      }

      if (isNaN(dateObj.getTime())) return "N/D";

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
      nombres = militarDb.nombres || 
                [militarDb.nombreprimero, militarDb.nombresegundo].filter(Boolean).join(" ") ||
                militarDb.primernombre || "";
      apellidos = militarDb.apellidos || 
                  [militarDb.apellidoprimero, militarDb.apellidosegundo].filter(Boolean).join(" ") ||
                  militarDb.primerapellido || "";
    }
    const nombreCompleto = `${nombres} ${apellidos}`.trim().toUpperCase() || "NO DISPONIBLE";
    const cedula = militarDb?.cedula || "N/D";
    const sexo = String(militarDb?.sexo || "").toUpperCase().trim();
    
    // Mapeo del Estado Civil según el Sexo
    const rawEdoCivil = String(this.militar.persona?.estadocivil || militarDb?.estadocivil || "").toUpperCase().trim();
    let edoCivil = "SOLTERO(A)";
    
    if (sexo === "M") {
      if (rawEdoCivil === "S" || rawEdoCivil === "SOLTERO") edoCivil = "SOLTERO";
      else if (rawEdoCivil === "C" || rawEdoCivil === "CASADO") edoCivil = "CASADO";
      else if (rawEdoCivil === "D" || rawEdoCivil === "DIVORCIADO") edoCivil = "DIVORCIADO";
      else if (rawEdoCivil === "V" || rawEdoCivil === "VIUDO") edoCivil = "VIUDO";
      else edoCivil = rawEdoCivil || "SOLTERO";
    } else if (sexo === "F") {
      if (rawEdoCivil === "S" || rawEdoCivil === "SOLTERA" || rawEdoCivil === "SOLTERO") edoCivil = "SOLTERA";
      else if (rawEdoCivil === "C" || rawEdoCivil === "CASADA" || rawEdoCivil === "CASADO") edoCivil = "CASADA";
      else if (rawEdoCivil === "D" || rawEdoCivil === "DIVORCIADA" || rawEdoCivil === "DIVORCIADO") edoCivil = "DIVORCIADA";
      else if (rawEdoCivil === "V" || rawEdoCivil === "VIUDA" || rawEdoCivil === "VIUDO") edoCivil = "VIUDA";
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
    const sexoStr = sexo === "M" ? "MASCULINO" : sexo === "F" ? "FEMENINO" : "N/D";

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
      if (typeof this.militar.situacion === "string") {
        situacion = this.militar.situacion === "ACT" ? "ACTIVO" : this.militar.situacion === "RET" ? "RETIRO" : this.militar.situacion;
      } else if (this.militar.situacion.nombre) {
        situacion = this.militar.situacion.nombre;
      }
    }

    let categoria = "N/D";
    if (this.militar.categoria) {
      if (typeof this.militar.categoria === "string") {
        categoria = this.militar.categoria;
      } else if (this.militar.categoria.nombre) {
        categoria = this.militar.categoria.nombre;
      }
    }

    // Formateo estricto a DD/MM/YYYY para fechas de servicio
    const fIngreso = this.formatToDDMMYYYY(this.militar.fingreso);
    const fAscenso = this.formatToDDMMYYYY(this.militar.fascenso);
    const anosServicio = this.militar.tiempodeservicio || "N/D";

    const fechaHoyString = this.getFechaHoyTexto();

    return [
      // 1. Texto de Acreditación Principal
      {
        text: [
          { text: "Quien suscribe, " },
          { text: this.firmante.nombre, bold: true },
          { text: `, en mi carácter de ` },
          { text: this.firmante.cargo, bold: true },
          { text: ", hace constar por medio de la presente que el (la) CIUDADANO (A): " },
          { text: `${String(grado).toUpperCase()} `, bold: true },
          { text: `${nombreCompleto}`, bold: true },
          { text: ", del componente " },
          { text: `${String(componente).toUpperCase()}`, bold: true },
          { text: ", titular de la Cédula de Identidad número " },
          { text: `V.- ${cedula}`, bold: true },
          { text: ", se encuentra registrado(a) y Afiliado(a) en la base de datos de Seguridad Social de este Instituto." }
        ],
        alignment: "justify",
        fontSize: 9.5,
        lineHeight: 1.4,
        margin: [0, 5, 0, 10]
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
              { text: "Cédula Identidad", style: "tableHeader" }
            ],
            [
              { text: String(edoCivil).toUpperCase(), fontSize: 8.5 },
              { text: fechaNac, fontSize: 8.5 },
              { text: String(sexoStr).toUpperCase(), fontSize: 8.5 },
              { text: `V-${cedula}`, bold: true, fontSize: 8.5 }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: number) => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#CBD5E1",
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 8]
      },

      // 3. Tabla Datos Militares
      { text: "DATOS MILITARES", style: "seccionHeader" },
      {
        table: {
          widths: ["20%", "30%", "20%", "30%"],
          body: [
            [
              { text: "Componente", style: "tableHeader" },
              { text: String(componente).toUpperCase(), bold: true, fontSize: 8.5 },
              { text: "Grado Militar", style: "tableHeader" },
              { text: String(grado).toUpperCase(), bold: true, fontSize: 8.5 }
            ],
            [
              { text: "Situación", style: "tableHeader" },
              { text: String(situacion).toUpperCase(), fontSize: 8.5 },
              { text: "Categoría", style: "tableHeader" },
              { text: String(categoria).toUpperCase(), fontSize: 8.5 }
            ],
            [
              { text: "Ingreso FANB", style: "tableHeader" },
              { text: fIngreso, fontSize: 8.5 },
              { text: "Último Ascenso", style: "tableHeader" },
              { text: fAscenso, fontSize: 8.5 }
            ],
            [
              { text: "Años Servicio", style: "tableHeader" },
              { text: anosServicio, colSpan: 3, fontSize: 8.5 }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: number) => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#CBD5E1",
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      },

      // 4. Tabla Familiares Afiliados (Condensada)
      { text: "FAMILIARES AFILIADOS REGISTRADOS", style: "seccionHeader" },
      this.buildFamiliaresTable(),

      // 5. Cierre Legal del Documento
      {
        text: `Constancia que se expide a petición de la parte interesada en la Ciudad de Caracas, a los ${fechaHoyString}.`,
        fontSize: 9.5,
        alignment: "justify",
        margin: [0, 10, 0, 15]
      },

      // 6. Firma y Sello (Alineado más abajo mediante un margen superior aumentado)
      {
        margin: [0, 55, 0, 0], // Aumentado a 55pt para empujar la firma más abajo calculando el espacio disponible
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "_______________________________________",
                alignment: "center",
                color: "#94A3B8"
              },
              {
                text: this.firmante.nombre,
                bold: true,
                alignment: "center",
                fontSize: 8.5,
                margin: [0, 2, 0, 0]
              },
              {
                text: this.firmante.grado,
                alignment: "center",
                fontSize: 7.5,
                color: "#475569"
              },
              {
                text: this.firmante.cargo,
                alignment: "center",
                fontSize: 7,
                color: "#475569"
              }
            ]
          }
        ]
      }
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
        margin: [0, 3, 0, 8]
      };
    }

    const tableBody: any[][] = [
      [
        { text: "Parentesco", style: "tableHeader" },
        { text: "Cédula", style: "tableHeader" },
        { text: "Nombres y Apellidos", style: "tableHeader" },
        { text: "Fecha Nacimiento", style: "tableHeader" },
        { text: "Estatus Afiliación", style: "tableHeader" }
      ]
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
        estatusStyle
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ["15%", "15%", "40%", "15%", "15%"],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#E2E8F0",
        paddingTop: () => 2.2,
        paddingBottom: () => 2.2
      },
      margin: [0, 0, 0, 8]
    };
  }

  /**
   * Retorna la fecha de hoy formateada de forma textual en castellano
   */
  private getFechaHoyTexto(): string {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = meses[hoy.getMonth()];
    const anio = hoy.getFullYear();

    return `${dia} días del mes de ${mes} del año ${anio}`;
  }
}
