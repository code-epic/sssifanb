import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { LoginService } from '../../../../core/services/login/login.service';
import { CambiarclaveComponent } from './cambiarclave/cambiarclave.component';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

export interface DialogData {
  animal: string;
  name: string;
}


@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.component.html',
    styleUrls: ['./perfil.component.scss'],
    standalone: true,
    imports: [
      MatFormField,
      MatLabel,
      MatInput,
      MatSelect,
      FormsModule, 
      NgFor, 
      MatOption, 
      MatIcon, 
      MatSuffix, 
      MatButton, 
      CambiarclaveComponent]
})

export class PerfilComponent implements OnInit {

  public nombre: string = 'Analista'
  public nombrecompleto: string = ''
  public analista: string = ''
  public cedula: string = ''
  public telefono: string = ''
  public correo: string = ''
  public perfil: string = ''
  animal: string;
  name: string;

  @ViewChild('cambiarClave', { static: true }) cambiarClave: TemplateRef<any>;
  // email = new FormControl('', [Validators.required, Validators.email]);

  constructor(
    private loginService: LoginService,
    public dialog: MatDialog,
    private modalService: NgbModal) {


  }
  openDialog(): void {
    const dialogRef = this.dialog.open(this.cambiarClave, {
      width: '500px',
      data: {name: this.name, animal: this.animal},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.animal = result;
    });
  }

  ngOnInit(): void {
    if (this.loginService.usuario != null) {
      console.log(this.loginService.usuario);
      this.nombrecompleto = this.loginService.usuario.nombre;
      this.nombre = this.loginService.usuario.usuario;
      this.perfil = this.loginService.usuario.Perfil.descripcion;
      this.correo = this.loginService.usuario.correo;
      this.cedula = this.loginService.usuario.cedula;
    }
  }

  open(content) {
    this.modalService.open(content, { size: 'lg' });

  }



  // getErrorMessage() {
  //   if (this.email.hasError('required')) {
  //     return 'Debe instroducir correo';
  //   }

  //   return this.email.hasError('email') ? 'Correo no validado' : '';
  // }

}


