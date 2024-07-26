import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {NgxUiLoaderService, NgxUiLoaderModule} from 'ngx-ui-loader';
import {IToken} from '../../../core/models/login/token-model';
import {LoginService} from 'src/app/core/services/login/login.service';
import {FormsModule} from '@angular/forms';
import {IUsuario} from '../../../core/models/login/usuario-model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [NgxUiLoaderModule, FormsModule]
})

export class LoginComponent implements OnInit {
    errors: string[];
    usuario: string;
    clave: string;
    loading = false;

    public itk: IToken;
    private index = 0;

    constructor(private router: Router,
                private loginService: LoginService,
                private toastrService: ToastrService,
                private ngxService: NgxUiLoaderService) {
        if (loginService.isToken()) {
            this.router.navigate(['/principal']).then(r => {
            });
        }
        // if (sessionStorage.getItem("token") != undefined ){
        //   this.router.navigate(['/principal']);
        // }
    }

    ngOnInit() {
    }

    async login() {
        this.ngxService.startLoader('loader-login');
        const command: IUsuario = {
            nombre: this.usuario,
            clave: this.clave
        };
        this.loginService.getLogin(command).subscribe(
            (data) => {
                this.itk = data;
                sessionStorage.setItem('token', this.itk.token);
                this.ngxService.stopLoader('loader-login');
                this.router.navigate(['/principal']);
            },
            (error) => {
                this.usuario = '';
                this.clave = '';
                this.ngxService.stopLoader('loader-login');

                this.toastrService.error(
                    'Error al acceder a los datos de conexion',
                    `Bus Empresarial`
                );
            }
        );
    }

}
