import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpEvent, HttpResponse } from '@angular/common/http';

export interface PendingAuthorization {
    id: string;
    timestamp: number;
    response: HttpResponse<any>;
    subject: Subject<HttpEvent<any>>;
    encryptedPayload: any;
    originalPayload: any;
    status: 'waiting' | 'authorized' | 'rejected';
    minimized?: boolean; // Indica si el usuario cerró el modal de espera
    decryptedData?: any; // Almacenamos el resultado para tickets diferidos
}

@Injectable({
    providedIn: 'root'
})
export class SecurityQueueService {

    private _queue = new BehaviorSubject<PendingAuthorization[]>([]);
    public queue$ = this._queue.asObservable();

    private _minimized = new Subject<string>();
    public minimized$ = this._minimized.asObservable();

    private STORAGE_KEY = 'sss_security_queue_v1';

    constructor(private zone: NgZone) {
        this.hydrate();
        this.listenToParent();
    }

    /**
     * Escucha permanente de mensajes del padre (Rust/Tauri)
     */
    private listenToParent() {
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg && msg.type === 'AUTORIZACION_APROBADA') {
                console.log(`📡 Mensaje global recibido para: ${msg.authId}`);
                this.zone.run(() => {
                    const payload = msg.data !== undefined ? msg.data : msg.payload;
                    this.resolve(msg.authId, payload);
                });
            }
        });
    }

    private hydrate() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const metadata = JSON.parse(saved);
                const restored = metadata.map(m => ({
                    ...m,
                    subject: new Subject<HttpEvent<any>>(),
                    status: m.status || 'waiting'
                }));
                this._queue.next(restored);
            } catch (e) {
                console.error('Error hydrating security queue', e);
            }
        }
    }

    private syncStorage() {
        const queue = this._queue.getValue().map(({ id, timestamp, encryptedPayload, originalPayload, status, minimized, decryptedData }) => ({
            id, timestamp, encryptedPayload, originalPayload, status, minimized, decryptedData
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }

    /**
     * Agrega una nueva petición bloqueada a la cola global de seguridad
     */
    enqueue(authId: string, response: HttpResponse<any>, subject: Subject<HttpEvent<any>>, payload: any, originalPayload: any) {
        const newItem: PendingAuthorization = {
            id: authId,
            timestamp: Date.now(),
            response,
            subject,
            encryptedPayload: payload,
            originalPayload: originalPayload,
            status: 'waiting',
            minimized: false
        };

        const currentQueue = this._queue.getValue();
        this._queue.next([...currentQueue, newItem]);
        this.syncStorage();
        return newItem;
    }

    /**
     * Notifica que el usuario ha minimizado la alerta y desea continuar
     */
    notifyMinimized(authId: string) {
        const currentQueue = this._queue.getValue();
        const normalizedId = (authId || "").toLowerCase();
        const item = currentQueue.find(i => (i.id || "").toLowerCase() === normalizedId);
        if (item) {
            item.minimized = true;
            this.syncStorage();
        }
        this._minimized.next(authId);
    }

    resolve(authId: string, decryptedPayload: any) {
        const currentQueue = this._queue.getValue();
        const normalizedId = (authId || "").toLowerCase();
        const item = currentQueue.find(i => (i.id || "").toLowerCase() === normalizedId);

        if (item) {
            console.log(`Resolviendo petición ${item.id}. Minimizada: ${item.minimized}`);
            
            // Si el item tiene un subject, significa que Angular está esperando activamente
            if (!item.minimized && item.response && item.subject) {
                const nuevaRespuesta = item.response.clone({ body: decryptedPayload });
                item.subject.next(nuevaRespuesta);
                item.subject.complete();
                this.removeFromQueue(item.id);
            } 
            else {
                // Caso Ticket persistente
                const updatedQueue = currentQueue.map(i => 
                    (i.id || "").toLowerCase() === normalizedId 
                    ? { ...i, status: 'authorized' as const, decryptedData: decryptedPayload } 
                    : i
                );
                this._queue.next(updatedQueue);
                this.syncStorage();
            }
        } else {
            console.warn(`No se encontró la petición ${authId} en la cola local`);
        }
    }

    /**
     * El usuario hace clic en un ticket resuelto para aplicar la respuesta
     */
    applyResolution(authId: string) {
        const currentQueue = this._queue.getValue();
        const normalizedId = (authId || "").toLowerCase();
        const item = currentQueue.find(i => (i.id || "").toLowerCase() === normalizedId);

        if (item && item.status === 'authorized' && item.decryptedData) {
            if (item.response && item.subject) {
                const nuevaRespuesta = item.response.clone({ body: item.decryptedData });
                item.subject.next(nuevaRespuesta);
                item.subject.complete();
            }
            
            window.parent.postMessage({
                id: 'TAREA_ATENDIDA',
                authorization_id: item.id,
                timestamp: Date.now()
            }, '*');

            this.removeFromQueue(item.id);
        }
    }

    /**
     * Rechaza una petición (si el supervisor deniega o el usuario cancela)
     */
    reject(authId: string, error: any) {
        const currentQueue = this._queue.getValue();
        const normalizedId = (authId || "").toLowerCase();
        const item = currentQueue.find(i => (i.id || "").toLowerCase() === normalizedId);

        if (item) {
            console.error(`Petición ${item.id} rechazada por seguridad:`, error);
            item.subject.error(error);
            this.removeFromQueue(item.id);
        }
    }

    private removeFromQueue(authId: string) {
        const filtered = this._queue.getValue().filter(i => i.id !== authId);
        this._queue.next(filtered);
        this.syncStorage();
    }

    getQueueCount() {
        return this._queue.getValue().length;
    }

    /**
     * Solicita al padre el estado actual de una autorización (Sincronización Manual)
     */
    syncWithParent(authId: string) {
        window.parent.postMessage({
            type: 'CONSULTAR_ESTADO_AUTORIZACION',
            authId: authId
        }, '*');
    }
}
