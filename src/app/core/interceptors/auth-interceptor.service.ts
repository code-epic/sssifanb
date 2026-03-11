
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2'
import { Sha256Service } from '../services/util/sha256';
import { environment } from 'src/environments/environment';
import { LoginService } from '../services/login/login.service';

import { HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { SecurityQueueService } from '../services/util/security-queue.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  private SECRET_KEY = environment.Hash


  constructor(
    private _login: LoginService,
    private sha256: Sha256Service,
    private securityQueue: SecurityQueueService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (req.headers.has('X-Skip-Interceptor')) {
      const cleanReq = req.clone({
        headers: req.headers.delete('X-Skip-Interceptor')
      });
      return next.handle(cleanReq);
    }

    if (!req.body || req.method === 'GET') {
      return this.procesarPeticion(req, next);
    }

    const token: string = sessionStorage.getItem("token")

    const timestamp = new Date().getTime().toString();
    const payload = JSON.stringify(req.body) + timestamp;
    return from(this.sha256.hmac(payload, this.SECRET_KEY)).pipe(
      switchMap(signature => {
        const secureReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Web-API-key': this.SECRET_KEY,
            'X-Signature': signature,
            'X-Timestamp': timestamp
          }
        });

        return this.procesarPeticion(secureReq, next);
      })
    );

  }




  // Factorizamos el manejo de errores para mantener el código limpio
  private procesarPeticion(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      switchMap((event: HttpEvent<any>) => {
        // 1. Detectar si la respuesta es el paquete "LOCKED"
        if (event instanceof HttpResponse && event.body?.status === 'LOCKED') {
          return this.manejarBloqueoSeguridad(event, request.body);
        }
        return [event]; // Si no está bloqueado, sigue su curso normal
      }),

      catchError((err: HttpErrorResponse) => {

        switch (err.status) {
          case 401:
            this.cerrar(err.error.msj || 'Sesión expirada');
            break;
          case 402:
            // this.cerrar('Pago requerido');
            break;
          case 403:
            if (!err.error.msj) {
              this.cerrar('Acceso denegado');
            } else {
              this.TimeOut(err.error.msj);
            }

            break;
          case 504:
            this.cerrar('Error de conexión con el servidor');
            break;
        }
        return throwError(err);
      })
    );
  }



  private manejarBloqueoSeguridad(response: HttpResponse<any>, payloadOriginal: any): Observable<HttpEvent<any>> {
    const { authorization_id, data_encrypted } = response.body;

    // 1. Crear el canal de respuesta (RxJS Subject)
    const respuestaRust$ = new Subject<HttpEvent<any>>();

    // 2. Registrar en la cola global de seguridad
    this.securityQueue.enqueue(authorization_id, response, respuestaRust$, data_encrypted, payloadOriginal);

    // 3. Mostrar alerta de espera (Contexto 1: Bloqueante con opción a encolar)
    this.AlertaSeguridad(authorization_id).then(result => {
      if (result.isConfirmed) {
        this.securityQueue.notifyMinimized(authorization_id);
        console.log('Solicitud minimizada a segundo plano:', authorization_id);
      }
    });

    // 4. Crear puente con App Principal (Tauri/Rust)
    const canal = new MessageChannel();
    canal.port1.onmessage = (mensaje) => {
      if (mensaje.data.error) {
        this.securityQueue.reject(authorization_id, mensaje.data.error);
        if (Swal.isVisible()) {
          Swal.fire({
            title: 'Autorización Denegada',
            text: 'El supervisor ha rechazado la solicitud.',
            icon: 'error',
            confirmButtonText: 'Cerrar',
            customClass: { confirmButton: 'btn btn-header-action red px-4' }
          });
        }
      } else {
        // Éxito: El canal de Rust devolvió el payload limpio
        this.securityQueue.resolve(authorization_id, mensaje.data.payload);
        if (Swal.isVisible()) {
          Swal.close();
        }
      }
    };

    // 5. Notificar a RUST (vía App Principal)
    window.parent.postMessage({
      type: 'SOLICITAR_AUTORIZACION',
      authId: authorization_id,
      payload: data_encrypted,
      content: payloadOriginal
    }, '*', [canal.port2]);

    return respuestaRust$.asObservable();
  }


  private AlertaSeguridad(id: string): Promise<any> {
    return Swal.fire({
      title: 'Validación de Identidad',
      html: `
        <div class="text-center">
          <p class="mb-3" style="font-size: 0.85rem; line-height: 1.4; color: #8b6b6b !important; opacity: 0.9;">
            Esta operación requiere la <strong>Firma Digital</strong> de un supervisor para ser procesada en este terminal.
          </p>
          
          <div class="security-card p-4 rounded-30 mb-3" 
               style="background: linear-gradient(135deg, #fffafa 0%, #fdf5f5 100%); border: 1.5px solid #f2e1e1; box-shadow: 0 10px 30px rgba(122, 90, 90, 0.04);">
            <div class="d-flex justify-content-between align-items-center mb-3">
               <span class="badge badge-pill px-3 py-1" style="background: #d68b8b; color: white; font-size: 0.6rem; letter-spacing: 1.2px; opacity: 0.85;">ID TRANSACCIÓN</span>
               <i class="fas fa-fingerprint" style="font-size: 1.1rem; opacity: 0.3; color: #d68b8b;"></i>
            </div>
            <div class="ticket-id-container py-1">
               <h3 class="font-weight-800 mb-0" style="font-size: 1.1rem; font-family: 'Fira Code', monospace; color: #7a5a5a !important;">#${id.substring(0, 16).toUpperCase()}...</h3>
            </div>
            <div class="progress mt-3" style="height: 6px; background: rgba(255,255,255,0.8); border-radius: 10px;">
              <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%; border-radius: 10px; background-color: #d68b8b; opacity: 0.65;"></div>
            </div>
          </div>

          <div class="mt-3 mb-2">
            <div class="spinner-grow" role="status" style="width: 1.2rem; height: 1.2rem; opacity: 0.4; color: #d68b8b !important;"></div>
            <p class="font-weight-800 mt-2 mb-1" style="color: #8b6b6b; font-size: 0.85rem; letter-spacing: 0.5px;">ESPERANDO AUTORIZACIÓN...</p>
            <small class="text-muted d-block" style="font-size: 0.75rem; opacity: 0.7;">La tarea continuará en segundo plano al ser minimizada.</small>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-layer-group mr-2"></i> Minimizar y Esperar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: `rgba(122, 90, 90, 0.35)`,
      customClass: {
        popup: 'pastel-swal-popup border-0 rounded-30 px-4 py-3',
        title: 'text-dark font-weight-900 pt-3 mt-2',
        confirmButton: 'px-5 py-3 font-weight-700',
      },
      didOpen: (modal) => {
        const confirmBtn = modal.querySelector('.swal2-confirm') as HTMLElement;
        if (confirmBtn) {
          confirmBtn.style.backgroundColor = '#d68b8b';
          confirmBtn.style.borderColor = '#c27a7a';
          confirmBtn.style.color = '#ffffff';
          confirmBtn.style.borderRadius = '20px';
          confirmBtn.style.fontSize = '0.9rem';
          confirmBtn.style.boxShadow = '0 10px 20px rgba(214, 139, 139, 0.2)';
          confirmBtn.style.transition = 'all 0.3s ease';
        }
      }
    });
  }

  cerrar(msj: string) {
    Swal.fire({
      title: 'Sesión Finalizada',
      text: msj,
      icon: 'error',
      showCancelButton: false,
      confirmButtonText: 'Entendido',
      allowEscapeKey: false,
      allowOutsideClick: false,
      customClass: {
        popup: 'pastel-swal-popup border-0 rounded-20 px-4 py-4',
        confirmButton: 'btn btn-header-action red px-5',
        title: 'text-dark font-weight-bold pt-2',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this._login.logout();
      }
    });
  }


  TimeOut(msj: string) {
    Swal.fire({
      title: 'Aviso del Sistema',
      text: msj,
      icon: 'info',
      showCancelButton: false,
      confirmButtonText: 'Aceptar',
      allowEscapeKey: false,
      allowOutsideClick: false,
      customClass: {
        popup: 'pastel-swal-popup border-0 rounded-20 px-4 py-4',
        confirmButton: 'btn btn-header-action teal px-5',
        title: 'text-dark font-weight-bold pt-2',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        console.error('Error 403:', msj);
      }
    });
  }


}