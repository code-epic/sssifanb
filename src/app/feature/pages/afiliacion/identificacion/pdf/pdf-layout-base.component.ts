import { inject } from "@angular/core";
import { ApiService } from "src/app/core/services/api.service";
import * as pdfMake from "pdfmake/build/pdfmake";
import { lastValueFrom } from "rxjs";

const pdfFonts = require("pdfmake/build/vfs_fonts");
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

export class PdfLayoutBase {
  protected apiService = inject(ApiService);

  public watermarkText: string = "I.P.S.F.A.N.B";
  public isWatermarkEnabled: boolean = true;
  public tokenInfo: string = "TOKEN-N/D";

  protected logoBase64: string = "";
  protected watermarkBase64: string = "";

  /**
   * Carga el logotipo de la institución en base64 de forma directa
   */
  protected async loadLogo(): Promise<string> {
    if (this.logoBase64) return this.logoBase64;
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = "./assets/img/ipsfa/logo.webp";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          this.logoBase64 = canvas.toDataURL("image/png");
          resolve(this.logoBase64);
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    });
  }

  /**
   * Carga el escudo oficial para la marca de agua
   */
  protected async loadWatermarkImage(): Promise<string> {
    if (this.watermarkBase64) return this.watermarkBase64;
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = "./assets/img/ipsfa/ipsfa-imagen.webp";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          this.watermarkBase64 = canvas.toDataURL("image/png");
          resolve(this.watermarkBase64);
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    });
  }

  /**
   * Carga la imagen de insignia del grado en base64 de forma dinámica
   */
  protected async loadGradoBadgeBase64(abrev: string): Promise<string> {
    if (!abrev) return "";
    let badge = String(abrev).toLowerCase().trim();
    if (badge === "1er tte") badge = "ptte";
    badge = badge.replace(/\//g, "").replace(/\./g, "").replace(/\s+/g, "");

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = `./assets/img/ipsfa/grados/${badge}.webp`;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    });
  }

  /**
   * Obtiene la fotografía del afiliado mediante el API central
   */
  protected async loadPhotoBase64(militarCedula: string, familiarCedula?: string): Promise<string> {
    try {
      const blob = await lastValueFrom(this.apiService.getPhotoId(militarCedula, familiarCedula));
      if (!blob || blob.size === 0) return "";
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Fallo al cargar la foto:", familiarCedula || militarCedula, e);
      return "";
    }
  }

  /**
   * Llama al servicio de generación de Código QR (solicitando Blob ya que el backend devuelve la imagen binaria)
   */
  protected async loadQRBase64(datos: any): Promise<string> {
    try {
      const blob = await lastValueFrom(this.apiService.postBlob("makeqr", datos));
      if (!blob || blob.size === 0) return "";
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Fallo al generar QR:", e);
      return "";
    }
  }

  /**
   * Genera el docDefinition con Cabecera (Logo, membrete, foto), Footer (QR, metadatos) y cuerpo
   */
  protected async buildDocDefinition(options: {
    logoImg?: string;
    photoImg?: string;
    qrImg?: string;
    watermarkImg?: string;
    gradoBadgeImg?: string;
    title: string;
    bodyContent: any[];
  }): Promise<any> {
    const buildDateTime = new Date().toLocaleString("es-VE");
    const responsable = this.getResponsable();
    const firmaDigitalSesion = this.getDigitalSignature();

    return {
      pageSize: "LETTER",
      pageMargins: [36, 105, 36, 68],
      background: (currentPage: number, pageCount: number) => {
        if (!this.isWatermarkEnabled) return {};
        if (options.watermarkImg) {
          return {
            image: "watermark",
            width: 320,
            opacity: 0.03,
            alignment: "center",
            margin: [0, 200, 0, 0],
          };
        }
        return {
          text: this.watermarkText,
          color: "#64748B",
          opacity: 0.04,
          bold: true,
          fontSize: 55,
          alignment: "center",
          margin: [0, 250, 0, 0],
          angle: 45,
        };
      },
      header: (currentPage: number, pageCount: number) => {
        return {
          margin: [36, 15, 36, 0],
          columns: [
            // Cabecera Zona 1: Logo Oficial (Agrandado y directo sin círculo)
            ...(options.logoImg
              ? [
                  {
                    width: 75,
                    image: "logo",
                    fit: [68, 68],
                    alignment: "left",
                    margin: [0, 0, 5, 0],
                  },
                ]
              : []),
            // Cabecera Zona 2: Membrete Oficial
            {
              width: "*",
              stack: [
                { text: "REPÚBLICA BOLIVARIANA DE VENEZUELA", bold: true, fontSize: 8 },
                { text: "MINISTERIO DEL PODER POPULAR PARA LA DEFENSA", fontSize: 7 },
                { text: "VICEMINISTERIO DE SERVICIOS PARA LA DEFENSA", fontSize: 7 },
                { text: "DIRECCIÓN GENERAL DE EMPRESAS Y SERVICIOS", fontSize: 7 },
                { text: "INSTITUTO DE PREVISIÓN SOCIAL DE LA", fontSize: 7 },
                { text: "FUERZA ARMADA NACIONAL BOLIVARIANA", bold: true, fontSize: 8.5 },
                { text: "RIF: G-20003692-3", color: "#64748B", fontSize: 7 },
              ],
              alignment: "center",
              lineHeight: 1.15,
              color: "#1E293B",
            },
            // Cabecera Zona 3: Foto del Militar/Afiliado (Agrandada + Grado debajo)
            {
              width: 70,
              stack: [
                ...(options.photoImg
                  ? [
                      {
                        image: "photo",
                        fit: [60, 72],
                        alignment: "center",
                      },
                    ]
                  : [
                      {
                        canvas: [
                          {
                            type: "rect",
                            x: 0,
                            y: 0,
                            w: 60,
                            h: 72,
                            r: 2,
                            lineColor: "#CBD5E1",
                            lineWidth: 1,
                          },
                        ],
                      },
                      {
                        text: "FOTO",
                        alignment: "center",
                        fontSize: 8,
                        color: "#94A3B8",
                        margin: [0, -42, 0, 0],
                      },
                    ]),
                // Grado gráfico debajo de la foto
                ...(options.gradoBadgeImg
                  ? [
                      {
                        image: "gradoBadge",
                        fit: [55, 18],
                        alignment: "center",
                        margin: [0, 4, 0, 0],
                      },
                    ]
                  : []),
              ],
            },
          ],
        };
      },
      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [36, 10, 36, 0],
          columns: [
            // Pie de Página Zona 1: Cláusulas y Metadata Token
            {
              width: "*",
              stack: [
                {
                  text: "Esta constancia es un documento electrónico con validez legal según las regulaciones del I.P.S.F.A.N.B.",
                  fontSize: 7,
                  color: "#64748B",
                  italic: true,
                },
                {
                  text: `Generado por: ${responsable} | Firma Digital Sesión: ${firmaDigitalSesion}`,
                  fontSize: 6.5,
                  color: "#94A3B8",
                  margin: [0, 4, 0, 0],
                },
                {
                  text: `Fecha de Emisión: ${buildDateTime}`,
                  fontSize: 6.5,
                  color: "#94A3B8",
                },
              ],
            },
            // Pie de Página Zona 2: Código QR de Validación
            {
              width: 50,
              stack: options.qrImg
                ? [
                    {
                      image: "qr",
                      fit: [45, 45],
                      alignment: "right",
                    },
                  ]
                : [
                    {
                      canvas: [
                        {
                          type: "rect",
                          x: 0,
                          y: 0,
                          w: 45,
                          h: 45,
                          r: 2,
                          lineColor: "#CBD5E1",
                          lineWidth: 1,
                        },
                      ],
                    },
                    {
                      text: "QR",
                      alignment: "center",
                      fontSize: 6,
                      color: "#94A3B8",
                      margin: [0, -28, 0, 0],
                    },
                  ],
            },
          ],
        };
      },
      content: [
        { text: options.title.toUpperCase(), style: "tituloReporte" },
        ...options.bodyContent,
      ],
      // Diccionario de imágenes de pdfMake para resolver referencias en cabecera/pie/cuerpo
      images: {
        ...(options.logoImg ? { logo: options.logoImg } : {}),
        ...(options.photoImg ? { photo: options.photoImg } : {}),
        ...(options.qrImg ? { qr: options.qrImg } : {}),
        ...(options.watermarkImg ? { watermark: options.watermarkImg } : {}),
        ...(options.gradoBadgeImg ? { gradoBadge: options.gradoBadgeImg } : {}),
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.25,
        color: "#1E293B",
      },
      styles: {
        tituloReporte: {
          fontSize: 12,
          bold: true,
          alignment: "center",
          margin: [0, 5, 0, 10],
          color: "#0F172A",
          letterSpacing: 0.5,
        },
        seccionHeader: {
          fontSize: 8.5,
          bold: true,
          color: "#334155",
          fillColor: "#F1F5F9",
          margin: [0, 8, 0, 4],
        },
        tableHeader: {
          bold: true,
          fontSize: 8,
          color: "#FFFFFF",
          fillColor: "#475569",
        },
        subrayado: {
          bold: true,
          color: "#0F172A",
        },
      },
    };
  }

  /**
   * Resuelve el correo/usuario responsable mediante la lectura del token de la sesión
   */
  protected getResponsable(): string {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload?.Usuario?.correo || payload?.Usuario?.usuario || "SISTEMA";
      } catch (e) {}
    }
    return "SISTEMA IPSFA";
  }

  /**
   * Resuelve la sesión de firma digital firmadigital.sesion del JWT
   */
  protected getDigitalSignature(): string {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Mapeo flexible del campo firmadigital.sesion
        const sesion = payload?.Usuario?.firmadigital?.sesion || 
                       payload?.firmadigital?.sesion || 
                       payload?.Usuario?.usuario ||
                       payload?.Usuario?.id ||
                       "IPSFA-SIGN-DIGITAL-9812";
        return sesion;
      } catch (e) {}
    }
    return "IPSFA-SIGN-DEFAULT";
  }
}
