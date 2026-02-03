
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
import { Sha256Service } from '../services/util/sha256';
import { environment } from 'src/environments/environment';
import { LoginService } from '../services/login/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  private SECRET_KEY = environment.Hash


  constructor(private _login: LoginService, private sha256: Sha256Service) { }

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
              console.error('Error 403:', err);
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





  cerrar(msj: string) {
    Swal.fire({
      title: "Alerta",
      text: msj,
      icon: "error",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Gracias por su tiempo",
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this._login.logout();
      }
    });
  }
}