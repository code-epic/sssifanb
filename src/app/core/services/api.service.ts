import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IAPICore } from '../models/api/api-model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
   //Dirección Get para servicios en la página WEB
   URL =  environment.API

   hash = environment.Hash

   httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + sessionStorage.getItem('token') })
  };

  constructor( private http : HttpClient) {}

  //Ejecutar Api generales
  Ejecutar(xAPI : IAPICore) : Observable<any>{
    var url = this.URL + "crud" + this.hash
    return this.http.post<any>(url, xAPI, this.httpOptions);
  }

  EnviarArchivos(frm : FormData ) : Observable<any>{
    var httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + sessionStorage.getItem('token') 
      })
    };
    return this.http.post<any>(this.URL + "subirarchivos", frm, httpOptions);
  }

  Dws( peticion : string ) : string {
    return this.URL + 'dw/' + peticion
  }
}