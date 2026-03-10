import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpEvent, HttpResponse } from '@angular/common/http';

export interface PendingAuthorization {
    id: string;
    timestamp: number;
    response: HttpResponse<any>;
    subject: Subject<HttpEvent<any>>;
    encryptedPayload: any;
    status: 'waiting' | 'authorized' | 'rejected';
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

    constructor() {
        this.hydrate();
    }

    private hydrate() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const metadata = JSON.parse(saved);
                const restored = metadata.map(m => ({
                    ...m,
                    subject: new Subject<HttpEvent<any>>(),
                    status: 'waiting'
                }));
                this._queue.next(restored);
            } catch (e) {
                console.error('Error hydrating security queue', e);
            }
        }
    }

    private syncStorage() {
        const queue = this._queue.getValue().map(({ id, timestamp, encryptedPayload, status }) => ({
            id, timestamp, encryptedPayload, status
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }

    /**
     * Agrega una nueva petición bloqueada a la cola global de seguridad
     */
    enqueue(authId: string, response: HttpResponse<any>, subject: Subject<HttpEvent<any>>, payload: any) {
        const newItem: PendingAuthorization = {
            id: authId,
            timestamp: Date.now(),
            response,
            subject,
            encryptedPayload: payload,
            status: 'waiting'
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
        this._minimized.next(authId);
    }

    /**
     * Resuelve una petición de la cola cuando Rust devuelve la data limpia
     */
    resolve(authId: string, decryptedPayload: any) {
        const currentQueue = this._queue.getValue();
        const item = currentQueue.find(i => i.id === authId);

        if (item) {
            if (item.response && item.subject) {
                const nuevaRespuesta = item.response.clone({ body: decryptedPayload });
                item.subject.next(nuevaRespuesta);
                item.subject.complete();
            }
            this.removeFromQueue(authId);
        }
    }

    /**
     * Rechaza una petición (si el supervisor deniega o el usuario cancela)
     */
    reject(authId: string, error: any) {
        const currentQueue = this._queue.getValue();
        const item = currentQueue.find(i => i.id === authId);

        if (item) {
            item.subject.error(error);
            this.removeFromQueue(authId);
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
}
