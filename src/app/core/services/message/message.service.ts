import { EventEmitter, Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class MessageService {


    contenido$ = new EventEmitter<any>();
    contenido: []
    estatusText$ = new EventEmitter<string>();
    estatusText: string = ''

    producto$ = new EventEmitter<any>();
    producto: []

    buzon$ = new EventEmitter<any>();
    buzon: string = ''

    progreso$ = new EventEmitter<any>();
    progreso: any = ''

    finalizacion$ = new EventEmitter<any>();
    finalizacion: any = ''

    public CONFIRM_FILE_MESSAGE = "¿Esta seguro que desea procesar el archivo?";
    public CONFIRM_MULTI_FILE_MESSAGE = "¿Esta seguro que desea procesar el lote de archivos?";


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