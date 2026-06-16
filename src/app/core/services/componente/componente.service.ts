import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { environment } from '../../../../environments/environment';
import { IComponenteFANB } from '../../models/componente/componente.model';

@Injectable({
  providedIn: 'root'
})
export class ComponenteService {

  public dataComponente: IComponenteFANB[] = [];

  constructor(private apiService: ApiService) {
    this.cargarDesdeLocalStorage();
    // Si ya existe sesión y no hay datos en localStorage, ejecuta la carga en segundo plano
    if (sessionStorage.getItem('token') && this.dataComponente.length === 0) {
      this.initComponentes().subscribe({
        error: (err) => console.error('ComponenteService: Error en carga automatizada inicial', err)
      });
    }
  }

  /**
   * Inicializa la carga de componentes de la FANB.
   * Si la data ya existe en localStorage, la lee directamente sin consultar el backend.
   * En caso contrario, realiza la consulta HTTP.
   */
  public initComponentes(): Observable<IComponenteFANB[]> {
    const storedData = localStorage.getItem('data_componente');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.dataComponente = parsed;
          return of(parsed);
        }
      } catch (e) {
        console.warn('ComponenteService: Error parseando data_componente en localStorage. Consultando backend...', e);
      }
    }

    const payload = {
      funcion: environment.funcion.LISTAR_GRADOS,
      parametros: ""
    };

    return this.apiService.post<IComponenteFANB[]>('crud', payload).pipe(
      tap((data: IComponenteFANB[]) => {
        if (Array.isArray(data)) {
          this.dataComponente = data;
          localStorage.setItem('data_componente', JSON.stringify(data));
        }
      })
    );
  }

  /**
   * Carga sincrónicamente la data del localStorage al estado del servicio
   */
  private cargarDesdeLocalStorage(): void {
    const storedData = localStorage.getItem('data_componente');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed)) {
          this.dataComponente = parsed;
        }
      } catch (e) {
        console.error('ComponenteService: Fallo al deserializar data_componente de localStorage', e);
      }
    }
  }
}
