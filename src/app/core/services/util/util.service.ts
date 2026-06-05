import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';


@Injectable({
  providedIn: 'root'
})
export class UtilService {


  //
  constructor() {

  }


  /**
   * Fecha Actual del sistema desde la application
   * @param dias sumar dias a la fecha actual 
   * @returns retorna la fecha actual del sistema en formato YYYY-MM-DD
   */
  FechaActual(dias: number = 0): string {
    let date = new Date()

    if (dias > 0) date.setDate(date.getDate() + dias)

    let output = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return output
  }

  //retorna fecha en formato Dia/Mes/Anio
  ConvertirFecha(fecha: any): string {
    return fecha.year + '-' + + fecha.month + '-' + fecha.day
  }


  GenerarId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  Semillero(id: string): string {
    var f = new Date()
    var anio = f.getFullYear().toString().substring(2, 4)
    var mes = this.zfill((f.getMonth() + 1).toString(), 2)
    var dia = this.zfill(f.getDate().toString(), 2)
    return anio + mes + dia + '-' + this.zfill(id, 5)
  }

  public zfill(number, width) {
    var numberOutput = Math.abs(number); /* Valor absoluto del número */
    var length = number.toString().length; /* Largo del número */
    var zero = "0"; /* String de cero */

    if (width <= length) {
      if (number < 0) {
        return ("-" + numberOutput.toString());
      } else {
        return numberOutput.toString();
      }
    } else {
      if (number < 0) {
        return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
      } else {
        return ((zero.repeat(width - length)) + numberOutput.toString());
      }
    }


  }

  //convertir cadena a minuscula y sin carateres especiales
  ConvertirCadena(cadena: string): string {
    return cadena.toLowerCase().replace(/á/g, "a").replace(/ê/g, "i").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u")
  }

  AlertMini(position: any, icon: any, title: any, timer: number) {
    const Toast = Swal.mixin({
      toast: true,
      position: position,
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    Toast.fire({
      icon: icon,
      title: title
    })
  }

  // Generador UUID v4 compatible con navegadores
  uuidv4(): string {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }); // Genera un ID universal único
      localStorage.setItem('userId', id);
    }
    return id;
  }


  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- MIGRATED FROM CargarNominaComponent --- //

  formatFechaRelativa(fechaString: string): string {
    if (!fechaString) return "";
    const date = new Date(fechaString);
    if (isNaN(date.getTime())) return fechaString;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const absoluteStr = `${day}/${month}/${year} ${hours}:${minutes}`;

    const diffMs = new Date().getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    let relativeStr = "";
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      relativeStr = `Hace ${days} día${days > 1 ? "s" : ""}`;
    } else if (diffHrs > 0) {
      relativeStr = `Hace ${diffHrs} hora${diffHrs > 1 ? "s" : ""}`;
    } else if (diffMins > 0) {
      relativeStr = `Hace ${diffMins} min${diffMins > 1 ? "s" : ""}`;
    } else {
      relativeStr = "Hace un momento";
    }

    return `
            <div class="d-flex flex-column align-items-center">
                <span class="text-dark font-weight-600 mb-1" style="font-size: 0.9rem;">${absoluteStr}</span>
                <small class="text-muted" style="font-size: 0.75rem;"><i class="fas fa-clock mr-1"></i>${relativeStr}</small>
            </div>
        `;
  }

  isDateColumn(colName: string): boolean {
    const name = colName.toLowerCase();
    return (
      name.includes("fecha") || name.startsWith("f_") || name.includes("date")
    );
  }

  isDateValue(cell: string): boolean {
    if (!cell) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(cell.trim());
  }

  parseAndNormalizeDate(value: string): string {
    if (!value) return "";
    value = value.trim();

    // Check if starting with 4-digit year: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD, etc.
    const yyyyMMddRegex = /^(\d{4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,2})$/;
    const matchYmd = value.match(yyyyMMddRegex);
    if (matchYmd) {
      const year = matchYmd[1];
      const month = matchYmd[2].padStart(2, "0");
      const day = matchYmd[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Check if starting with day: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, etc.
    const ddMMyyyyRegex = /^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{4})$/;
    const matchDmy = value.match(ddMMyyyyRegex);
    if (matchDmy) {
      const day = matchDmy[1].padStart(2, "0");
      const month = matchDmy[2].padStart(2, "0");
      const year = matchDmy[3];
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  isValidDateYYYYMMDD(value: string): boolean {
    if (!value) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) return false;

    const parts = value.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    return day <= daysInMonth[month - 1];
  }

  isValidDateDDMMYYYY(value: string): boolean {
    if (!value) return false;
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(value)) return false;

    const parts = value.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    return day <= daysInMonth[month - 1];
  }

  parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const separator = ";";
    const keys = Object.keys(data[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      data
        .map((row) => {
          return keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join("\n");

    const csvBase64 = btoa(unescape(encodeURIComponent("\ufeff" + csvContent)));
    const csvDataUri = `data:text/csv;base64,${csvBase64}`;

    if (window.parent && window !== window.parent) {
      window.parent.postMessage(
        {
          type: "OPEN_CSV",
          payload: {
            fileName: filename,
            data: csvDataUri,
          },
        },
        "*"
      );
    } else {
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  // FechaMoment(fecha: any, formato: string = "LLLL") {
  //   moment.locale('es')
  //   // Fix: Validar si la fecha es un string no ISO para evitar warning de moment.js
  //   if (typeof fecha === 'string' && !fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
  //     const date = new Date(fecha);
  //     if (!isNaN(date.getTime())) {
  //       return moment(date).format(formato);
  //     }
  //   }
  //   return moment(fecha).format(formato)
  // }

  // FechaMomentL(fecha: any) {
  //   return this.FechaMoment(fecha, "L")
  // }


}
