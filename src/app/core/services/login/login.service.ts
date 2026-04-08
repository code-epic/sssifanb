import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { IToken } from '../../models/login/token-model';
import { IUsuario } from '../../models/login/usuario-model';
import { ApiService } from '../api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Sha256Service } from '../util/sha256';
import { IAPICore } from '../../models/api/api-model';
import Swal from 'sweetalert2';
import { UtilService } from '../util/util.service';
import { jwtDecode } from 'jwt-decode';
import { ROUTES } from '../../models/menu/menu-models';



export interface UClave {
  login: string;
  clave: string;
  nueva: string;
  repetir: string;
  correo: string;
}

@Injectable({
  providedIn: 'root'
})



export class LoginService {

  public URL: string = environment.API;

  public Id = '';

  public SToken: any;

  public Token: any;

  public Usuario: any;

  public Aplicacion: any;

  public urlGet = '';



  public xAPI: IAPICore = {
    funcion: '',
    parametros: ''
  }

  constructor(
    private utils: UtilService,
    private apiService: ApiService,
    private router: Router,
    private sha256: Sha256Service,
    private http: HttpClient) {

    this.Id = environment.ID;
    if (sessionStorage.getItem('token') != undefined) {
      this.SToken = sessionStorage.getItem('token')
      this.getUserDecrypt(this.SToken)
    }
  }

  async IniciarSesion(itk: string) {
    this.Token = await this.getUserDecrypt(itk)
    sessionStorage.setItem("token", itk);
    sessionStorage.removeItem("token_failed"); // Limpiamos rastro de fallo previo
    this.obenterAplicacion(itk)
  }

  async Iniciar(token: string = '') {
    token = token == '' ? sessionStorage.getItem('token') : token
    sessionStorage.removeItem("token_failed"); // Limpiamos rastro de fallo previo
    await this.getUserDecrypt(token);
    this.obenterAplicacion(token);
  }
  getLogin(user: string, clave: string): Observable<IToken> {
    const netInfo = sessionStorage.getItem('net_info');
    let deviceContext = '';
    if (netInfo) {
      const info = JSON.parse(netInfo);
      const context = {
        os_info: info.system?.os_info || 'unknown',
        mac_address: info.system?.mac_address || 'unknown',
        network: info.network || 'unknown',
      };
      deviceContext = btoa(JSON.stringify(context));
    }

    return from(this.sha256.EncryptDeviceContext(deviceContext, environment.Hash.slice(0, 32))).pipe(
      switchMap(encodeDeviceContext => {
        const timestamp = new Date().getTime().toString();
        const headers = new HttpHeaders({
          'X-Skip-Interceptor': 'true',
          'Content-Type': 'application/json',
          'X-Device-Context': encodeDeviceContext,
          'X-Timestamp': timestamp,
          'Web-API-key': environment.Hash,
        });

        const usuario = {
          nombre: user,
          clave: clave,
        };

        return this.apiService.post<IToken>('wusuario/loginV2', usuario, undefined, headers);
      })
    );
  }



  public getUserDecrypt(cadena_jwt: string): any {
    if (!cadena_jwt || cadena_jwt === 'undefined' || cadena_jwt === 'null') {
      console.warn('LoginService: Token inválido o ausente en getUserDecrypt');
      return null;
    }
    try {
      const token: any = jwtDecode(cadena_jwt);
      this.Token = token;
      this.Usuario = this.Token?.Usuario || {};
      return this.Token;
    } catch (error) {
      console.error('LoginService: Error al decodificar JWT', error);
      return null;
    }
  }


  obtenerMenu(): any {
    return JSON.parse(sessionStorage.getItem('menu'))
  }

  obtenerPrivilegiosMenu(menu: string, subMenu: string): any {
    let Prv: any;
    let lst = this.obtenerSubMenu(menu)
    lst.forEach(e => {
      if (e.url === subMenu && e.url != '') {
        if (e.Privilegios.length > 0) Prv = e.Privilegios
      }
    });
    return Prv;
  }

  obtenerSubMenu(menu: string): any {
    let SubMenu = [];
    this.obtenerMenu().forEach(e => {
      if (e.url == menu) {
        SubMenu = e.SubMenu;
      }
    })

    return SubMenu;
  }

  isLogged() {
    return sessionStorage.getItem('token') ? true : false;
  }


  logout() {
    Swal.fire({
      title: '¿Desea cerrar sesión?',
      text: "Gracias por su tiempo",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5eaaa8',
      cancelButtonColor: '#ef9a9a',
      confirmButtonText: 'Si, cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/logout']);
      }
    })
  }



  /**
   * Orquesta el proceso de cierre de sesión completo, notificando el progreso.
   * @param progressCallback Una función para reportar el progreso a la UI.
   */
  public async performLogoutProcess(progressCallback: (message: string) => void) {
    try {
      progressCallback('Finalizando sesión en el servidor...');
      await this.utils.sleep(800); // Pequeña pausa para UX
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        }),
      };
      const url = this.URL + 'wusuario/logout:' + localStorage.getItem("userId");
      await this.http.post(url, {}, httpOptions).toPromise();
    } catch (error) {
      console.error("Error al contactar el servidor para logout (se procederá con la limpieza local):", error);
      progressCallback('No se pudo contactar al servidor, limpiando localmente...');
      await this.utils.sleep(1500);
    } finally {
      progressCallback('Limpiando datos de la sesión...');
      await this.utils.sleep(800); // Pequeña pausa para UX
      await this.clearSession();

      progressCallback('¡Hasta pronto!');
      await this.utils.sleep(1200); // Pequeña pausa para que el usuario lea el mensaje final.
      this.router.navigate(['/']);
    }
  }

  /**
   * Guarda las tareas pendientes y limpia el almacenamiento local y de sesión.
   * Es async para asegurar que los pasos se completen antes de continuar.
   */
  async clearSession(): Promise<void> {

    // Esto SIEMPRE debe ejecutarse para garantizar el cierre de sesión en el cliente.
    sessionStorage.clear();
    // localStorage.clear();

  }


  //ObenterAplicacion 
  protected obenterAplicacion(itk: string) {
    if (!this.Token || !this.Token.Usuario) {
      console.error('LoginService: No se puede obtener aplicación sin datos de usuario decodificados');
      return;
    }

    // console.log('LoginService: Obteniendo perfil de aplicación para:', this.Token.Usuario.cedula);
    let cadena = this.Token.Usuario.cedula + ',' + this.Token.Usuario.sistema + ',' + this.Token.Usuario.correo
    this.xAPI = {} as IAPICore
    this.xAPI.funcion = environment.funcion.CONSULTAR_USUARIO_PERFIL
    this.xAPI.parametros = cadena
    this.apiService.post("crud", this.xAPI).subscribe(
      async (data: any) => {
        try {
          // Verificamos que la data y las propiedades anidadas existan antes de usarlas
          if (!data || data.length === 0 || !data[0].Aplicacion || data[0].Aplicacion.length === 0 || !data[0].Aplicacion[0].Rol) {
            throw new Error("La respuesta del perfil de usuario no es válida o está vacía.");
          }

          // this.Menu = data[0].Aplicacion[0].Rol.Menu

          // console.log(this.consolidarAplicaciones(data[0].Aplicacion))

          let menu = await this.consolidarAplicaciones(data[0].Aplicacion).Rol.Menu
          sessionStorage.setItem('menu', JSON.stringify(menu))
          // sessionStorage.setItem("menu", JSON.stringify(data[0].Aplicacion[0].Rol.Menu));
          let texto = await this.sha256.hash(JSON.stringify(menu));

          this.utils.uuidv4();

          sessionStorage.setItem("crypt", texto);
          this.cargarMenu();
          this.router.navigate(["/principal"]).then(() => {
            window.location.reload();
          });
        } catch (e) {

          console.error('Error al procesar el perfil del usuario:', e);
          Swal.fire({
            title: 'Error de Perfil',
            text: 'No se pudo cargar la configuración de su perfil. Por favor, contacte al administrador.',
            icon: 'error'
          });
          sessionStorage.setItem('token_failed', itk);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('menu');
        }

      },
      (error) => {
        sessionStorage.setItem('token_failed', itk);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("menu");
        this.router.navigate(["/login"]);
        console.error('Fallo conectando al perfil del usuario: ', error)
      }
    )




  }


  public cargarMenu() {
    const menu = this.obtenerMenu();
    // console.log(menu);
    if (menu) {
      // Limpiamos ROUTES antes de llenarlo para evitar duplicados en recargas
      ROUTES.splice(0, ROUTES.length);
      menu.forEach((e: any) => {
        ROUTES.push({
          path: e.url,
          title: e.nombre,
          icon: e.icono,
          class: e.clase,
          SubMenu: e.SubMenu || []
        });
      });
    }
  }



  /**
   * Consolidación de Perfiles y Aplicaciones
   * 
   * Esta función es CRÍTICA para la gestión de seguridad multidimensional.
   * Permite que usuarios con múltiples perfiles (ej. Gerente y Operador) operen bajo
   * una ÚNICA sesión consolidada, evitando conflictos de acceso y cierres de sesión.
   * 
   * @param aplicaciones Listado de aplicaciones/roles devueltos por el backend
   * @returns Una aplicación unificada con todos los menús y privilegios combinados
   */
  consolidarAplicaciones(aplicaciones: any[]): any {
    if (!aplicaciones || aplicaciones.length === 0) return null;

    // Inicializamos la base con la primera aplicación del arreglo
    const appConsolidada = {
      ...aplicaciones[0],
      perfil: aplicaciones.map(a => a.perfil).join(' / '), // Concatenamos nombres para auditoría visual
      Rol: {
        ...aplicaciones[0].Rol,
        descripcion: "Perfil Consolidado",
        Menu: []
      }
    };

    // Mapa para evitar duplicidad de menús principales (ej. si dos perfiles tienen 'Expedientes')
    const menuMap = new Map<string, any>();

    aplicaciones.forEach(app => {
      app.Rol.Menu.forEach((itemMenu: any) => {
        const menuKey = itemMenu.url || itemMenu.nombre;

        if (!menuMap.has(menuKey)) {
          // Si el módulo es nuevo para esta sesión, lo registramos íntegro
          menuMap.set(menuKey, JSON.parse(JSON.stringify(itemMenu)));
        } else {
          // Si el módulo ya existe (ej. 'Administración'), unificamos sus SubMenús
          const menuExistente = menuMap.get(menuKey);

          itemMenu.SubMenu.forEach((nuevoSub: any) => {
            const subExistente = menuExistente.SubMenu.find((s: any) => s.url === nuevoSub.url);

            if (!subExistente) {
              // Si es una funcionalidad nueva en este módulo, la agregamos
              menuExistente.SubMenu.push(JSON.parse(JSON.stringify(nuevoSub)));
            } else {
              // Si la funcionalidad es compartida (ej. /expedientes), CONSOLIDAMOS PRIVILEGIOS
              // Esto asegura que el usuario tenga el MÁXIMO permiso disponible entre sus roles
              const privilegiosMap = new Map();

              // Cargamos privilegios actuales
              subExistente.Privilegios?.forEach((p: any) => privilegiosMap.set(p.metodo, p));
              // Inyectamos privilegios del nuevo rol sin sobreescribir los existentes
              nuevoSub.Privilegios?.forEach((p: any) => privilegiosMap.set(p.metodo, p));

              // El resultado es el conjunto unión de todos los métodos autorizados
              subExistente.Privilegios = Array.from(privilegiosMap.values());
            }
          });
        }
      });
    });

    // Reconstruimos el menú final consolidado
    appConsolidada.Rol.Menu = Array.from(menuMap.values());
    return appConsolidada;
  }


}
