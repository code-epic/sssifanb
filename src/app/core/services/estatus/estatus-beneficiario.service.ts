import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { environment } from '../../../../environments/environment';
import { IEstatusBeneficiario } from '../../models/estatus/estatus-beneficiario.model';

@Injectable({
  providedIn: 'root'
})
export class EstatusBeneficiarioService {

  public estatusBeneficiarios: IEstatusBeneficiario[] = [];

  constructor(private apiService: ApiService) {
    this.cargarDesdeLocalStorage();
    // Si ya existe sesión y no hay datos en localStorage, ejecuta la carga en segundo plano
    if (sessionStorage.getItem('token') && this.estatusBeneficiarios.length === 0) {
      this.initEstatus().subscribe({
        error: (err) => console.error('EstatusBeneficiarioService: Error en carga automatizada inicial', err)
      });
    }
  }

  /**
   * Inicializa la carga de estatus de beneficiarios.
   * Si la data ya existe en localStorage, la lee directamente sin consultar el backend.
   * En caso contrario, realiza la consulta HTTP y extrae el Cuerpo de la respuesta.
   */
  public initEstatus(): Observable<IEstatusBeneficiario[]> {
    const storedData = localStorage.getItem('estatus_beneficiarios');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.estatusBeneficiarios = parsed;
          return of(parsed);
        }
      } catch (e) {
        console.warn('EstatusBeneficiarioService: Error parseando estatus_beneficiarios en localStorage. Consultando backend...', e);
      }
    }

    const payload = {
      funcion: environment.funcion.LISTAR_ESTATUS,
      parametros: ""
    };

    return this.apiService.post<any>('crud', payload).pipe(
      map((response: any) => {
        if (response && response.Cuerpo) {
          return response.Cuerpo;
        }
        return Array.isArray(response) ? response : [];
      }),
      tap((cuerpo: IEstatusBeneficiario[]) => {
        this.estatusBeneficiarios = cuerpo;
        localStorage.setItem('estatus_beneficiarios', JSON.stringify(cuerpo));
      })
    );
  }

  /**
   * Carga sincrónicamente la data del localStorage al estado del servicio
   */
  private cargarDesdeLocalStorage(): void {
    const storedData = localStorage.getItem('estatus_beneficiarios');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed)) {
          this.estatusBeneficiarios = parsed;
        }
      } catch (e) {
        console.error('EstatusBeneficiarioService: Fallo al deserializar estatus_beneficiarios de localStorage', e);
      }
    }
  }
}
