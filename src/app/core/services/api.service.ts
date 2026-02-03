import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type ApiParams = HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
export type ApiHeaders = HttpHeaders | { [header: string]: string | string[] };

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private _http = inject(HttpClient);
    private _url = environment.API;

    /**
     * Realiza una petición GET genérica
     * @param endpoint Endpoint relativo o URL absoluta
     * @param params Parámetros de la consulta
     */
    public get<T>(endpoint: string, params?: ApiParams, headers?: ApiHeaders): Observable<T> {
        return this._http.get<T>(this._resolveUrl(endpoint), { params, headers });
    }

    /**
     * Realiza una petición POST genérica
     * @param endpoint Endpoint relativo
     * @param body Cuerpo de la petición
     */
    public post<T>(endpoint: string, body: unknown, params?: ApiParams, headers?: ApiHeaders): Observable<T> {
        return this._http.post<T>(this._resolveUrl(endpoint), body, { params, headers });
    }

    /**
     * Realiza una petición PUT genérica
     * @param endpoint Endpoint relativo
     * @param body Cuerpo de la petición
     */
    public put<T>(endpoint: string, body: unknown, params?: ApiParams, headers?: ApiHeaders): Observable<T> {
        return this._http.put<T>(this._resolveUrl(endpoint), body, { params, headers });
    }

    /**
     * Realiza una petición DELETE genérica
     * @param endpoint Endpoint relativo
     */
    public delete<T>(endpoint: string, params?: ApiParams, headers?: ApiHeaders): Observable<T> {
        return this._http.delete<T>(this._resolveUrl(endpoint), { params, headers });
    }

    /**
     * Descarga un archivo (Blob)
     * @param endpoint Endpoint del archivo
     */
    public getFile(endpoint: string): Observable<Blob> {
        return this._http.get(this._resolveUrl(endpoint), { responseType: 'blob' });
    }

    /**
     * Sube un archivo mediante POST
     * @param endpoint Endpoint destino
     * @param body Puede ser FormData u otro objeto
     */
    public upload<T>(endpoint: string, body: unknown): Observable<T> {
        return this._http.post<T>(this._resolveUrl(endpoint), body);
    }

    // --- Métodos Legacy / Específicos del Proyecto ---

    /**
     * Construye la URL completa manejando slashes y dominios
     */
    private _resolveUrl(endpoint: string): string {
        if (/^https?:\/\//.test(endpoint)) return endpoint;

        // Asegurar que la URL base termine en /
        const baseUrl = this._url.endsWith('/') ? this._url : `${this._url}/`;
        // Limpiar el endpoint de slash inicial
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

        let url = baseUrl + cleanEndpoint;

        // Regla: si el endpoint inicia con 'crud' o 'fnx' y NO contiene ya el hash, lo anexamos.
        // Se asume que estos endpoints requieren la firma del hash.
        if ((cleanEndpoint.startsWith('crud') || cleanEndpoint.startsWith('fnx')) && !cleanEndpoint.includes(environment.Hash)) {
            url += ':' + environment.Hash;
        }

        return url;
    }


    /**
     * @param id uuid del usuario su conexion 
     * @returns 
     */
    public ExecBackup(dump: unknown): Observable<any> {
        return this.post('db/dump', dump);
    }


    /**
     * @param id uuid del usuario su conexion 
     * @returns 
     */
    public ExecRestore(restore: unknown): Observable<any> {
        return this.post('db/restore', restore);
    }

    /**
     * @param tipo png | base64
     * @returns QR
     */
    public GenerarQR_TOTP(tipo: string): Observable<any> {
        return this.post(`wusuario/gtotp/${tipo}`, {});
    }

    /**
     * @param tipo png | base64
     * @returns QR
     */
    public Validar_TOTP(codigo: string, tempAuthToken: string): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${tempAuthToken}`,
            'X-Skip-Interceptor': 'true'
        });
        return this.post('wusuario/vtotp', { codigo }, undefined, headers);
    }

    /**
     * @param tipo png | base64
     * @returns QR
     */
    public MultipleSesion(tempAuthToken: string): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${tempAuthToken}`,
            'X-Skip-Interceptor': 'true'
        });
        return this.post('wusuario/multiplesesion', {}, undefined, headers);
    }
    /**
     * @param tipo png | base64
     * @returns QR
     */
    public GetImageQR(id: string): Observable<any> {
        return this.get(`imgslocalbase64/${id}`);
    }


    /**
     * @param tipo png | base64
     * @returns QR
     */
    public MakeQR(objeto: unknown): Observable<any> {
        return this.post('makeqr', objeto);
    }

    /**
     * Realiza una petición POST procesando la respuesta como Stream (Chunked).
     * Útil para grandes conjuntos de datos enviados por el backend en fragmentos.
     * @param endpoint Endpoint relativo
     * @param body Cuerpo de datos
     */
    public async postStream<T>(endpoint: string, body: unknown): Promise<T> {
        const url = this._resolveUrl(endpoint);
        const token = sessionStorage.getItem('token'); // Ajustar según almacenamiento real

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP Stream Error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is not readable');

            const decoder = new TextDecoder();
            let jsonAccumulator = '';

            // Lectura del stream
            let chunkCount = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunkCount++;
                console.log(`[Stream] Received chunk #${chunkCount}, size: ${value.length} bytes`);
                jsonAccumulator += decoder.decode(value, { stream: true });
            }
            console.log(`[Stream] Finished. Total chunks: ${chunkCount}. Total size: ${jsonAccumulator.length} chars.`);

            // Parseo final del JSON completo
            return JSON.parse(jsonAccumulator) as T;

        } catch (error) {
            console.error('Stream processing failed:', error);
            throw error;
        }
    }

}
