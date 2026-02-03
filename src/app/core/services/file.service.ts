import { HttpClient, HttpHeaders, HttpEventType, HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from "@angular/core";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface UploadProgressEvent {
    loaded: number;
    total: number;
    progress: number;
    state: 'LOADING' | 'DONE' | 'IDLE';
    body?: any; // Para devolver la respuesta del servidor al finalizar
}

@Injectable({
    providedIn: 'root'
})
export class FileService {

    private _http = inject(HttpClient);
    private _url = environment.Url;

    constructor() { }

    /**
     * Sube archivos a un endpoint específico reportando el progreso.
     * @param endpoint Ruta del servicio (ej: 'subirarchivos')
     * @param formData Objeto FormData con los archivos
     * @returns Observable con el estado del progreso
     */
    uploadWithProgress(endpoint: string, formData: FormData): Observable<UploadProgressEvent> {
        const url = this._resolveUrl(endpoint);

        return this._http.post<any>(url, formData, {
            reportProgress: true,
            observe: 'events',
            // Nota: El interceptor de auth debería encargarse del token, 
            // pero si es necesario forzar encabezados específicos, se pueden añadir aquí.
        }).pipe(
            map((event: HttpEvent<any>): UploadProgressEvent => {
                switch (event.type) {
                    case HttpEventType.UploadProgress:
                        const total = event.total ?? 0;
                        const progress = total > 0 ? Math.round(100 * (event.loaded / total)) : 0;
                        return {
                            loaded: event.loaded,
                            total: total,
                            progress: progress,
                            state: 'LOADING'
                        };

                    case HttpEventType.Response:
                        return {
                            loaded: event.body ? 100 : 0,
                            total: 100,
                            progress: 100,
                            state: 'DONE',
                            body: event.body
                        };

                    default:
                        return { loaded: 0, total: 0, progress: 0, state: 'IDLE' };
                }
            })
        );
    }

    /**
     * Construye la URL completa (reutiliza lógica similar a ApiService para consistencia)
     */
    private _resolveUrl(endpoint: string): string {
        if (/^https?:\/\//.test(endpoint)) return endpoint;
        const base = this._url.endsWith('/') ? this._url : `${this._url}/`;
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        // Si el endpoint no incluye el prefijo de API y no es absoluto,
        // se asume que podría necesitar environment.API o usarse directamente.
        // Ajustar según la lógica de tus endpoints. 
        // En este caso, asumimos que 'endpoint' es la ruta completa después del dominio.
        return `${base}${path}`;
    }
}
