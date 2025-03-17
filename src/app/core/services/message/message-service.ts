import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

    public CONFIRM_FILE_MESSAGE = "¿Esta seguro que desea procesar el archivo?";

    constructor() { }

    success(message: string, title: string = 'Completado') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    error(message: string, title: string = 'Error') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    info(message: string, title: string = 'Información') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }

    warning(message: string, title: string = 'Alerta') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }

    confirm(message: string, title: string = 'Ventana de Aprobación'): Promise<boolean> {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'No'
        }).then((result) => {
            return result.isConfirmed;
        });
    }
}