import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  //injections
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);

  //configurations
  public url: string = environment.API;
  public id = '';

  constructor() { }

  upload(formData: any) {
    const req = new HttpRequest('POST', this.url + environment.subPath, formData, {
      reportProgress: true
    });
    return this.httpClient.request(req);
  }

  load() {

  }

  sexo() {
    return of({ id: "2" });
    // return this.httpClient.post(url, formData);
  }

  pais() {
    return of({ id: "1" });
    // return this.httpClient.post(url, formData);
  }

  estado() {
    return of({ id: "1" });
    // return this.httpClient.post(url, formData);
  }
}
