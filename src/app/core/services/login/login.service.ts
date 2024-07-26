import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { IToken } from '../../models/login/token-model';
import { IUsuario } from '../../models/login/usuario-model';
import {ApiService} from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public url: string =  environment.api;
  public id = '';
  public sToken: any;
  public token: any;
  public usuario: any;
  public aplicacion: any;

  constructor(private router: Router, private http: ApiService) {
    this.id = environment.id;
    if (this.isToken()) { this.sToken = sessionStorage.getItem('token'); }
    // if (sessionStorage.getItem('token') !== undefined) {
    // }
  }

  async Iniciar() {
    await this.getUserDecrypt();
    this.obenterAplicacion();
  }

  getLogin(user: IUsuario): Observable<IToken> {
    return this.http.postLogin<IUsuario, IToken>(environment.subPath.login, user);
  }

  makeUser(user: IUsuario): Observable<any> {
    const url = this.url + 'identicacion';
    return this.http.postLogin<IUsuario, any>(url, user, {});
  }

  logout() {
    this.router.navigate(['login']);
    this.removeSessionStorage('id');
    this.removeSessionStorage('token');
  }

  protected getUserDecrypt(): any {
    const e = sessionStorage.getItem('token');
    const s = e.split('.');

    // var str = Buffer.from(s[1], 'base64').toString();
    const str = atob(s[1]);
    this.token = JSON.parse(str);
    // console.info(this.Token)
    this.usuario = this.token.Usuario;
    return JSON.parse(str);
  }

    // ObenterAplicacion
  protected obenterAplicacion() {
    const app = this.token.Usuario.Aplicacion;
    app.forEach(e => {
      if (e.id === this.id) {
        this.aplicacion = e;
      }
    });
  }

  obtenerMenu(): any {
    return this.aplicacion.Rol.Menu;
  }

  obtenerSubMenu(idUrl: string): any {
    const app = this.aplicacion;
    let subMenu = [];
    app.Rol.Menu.forEach(e => {
      if (e.url === idUrl) {
        subMenu = e.SubMenu;
      }
    });
    return subMenu;
  }

  /* ELIMINAR CUALRQUIER COSA EN EL SESSION STORAGE DEBES MANDAR EL KEY */
  protected removeSessionStorage(key: any) {
    sessionStorage.removeItem(key);
  }

   /*** EL TOKEN EXISTE?
   * SI => TRUE, NO => FALSE
   **/
  isToken() {
    return sessionStorage.getItem('token') !== undefined ? false : true;
  }
}
