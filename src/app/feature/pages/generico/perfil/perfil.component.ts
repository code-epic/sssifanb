import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgFor } from '@angular/common';
import { ChildremComponent } from './componets/childrem/childrem.component';
import { log } from 'console';
import { onlyNumberValidator } from 'src/app/core/directive/only-number-validator.directive';

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
    ChildremComponent,
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

  @Input() form: FormGroup;

  constructor(
    private loginService: LoginService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: NgbModal) {
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(this.cambiarClave, {
      width: '500px',
      data: { name: this.name, animal: this.animal },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.animal = result;
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({ 
      dni: new FormControl(null, [Validators.required, onlyNumberValidator()]),
      typeDni: new FormControl(null, []),
      name: new FormControl(null, [Validators.required]),
      lastname: new FormControl(null, []),
      campo1: new FormControl(null, []),
      campo2: new FormControl(null, []),
    });

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


  // protected datosDeMiHijo: any;

  public json = {
    dni: null,
    typeDni: 'V',
    name: null,
    lastname: 'GUILARTE',
    campo1: 'GUILARTE',
    campo2: 'GUILARTE',
  }

  // //papa
  // onRecibirInfoDeMiHijo(event: any) {
  //   console.log("event papa", event);
  //   this.datosDeMiHijo = event;
  // }


  save() {
    console.log("save", this.form.getRawValue());
  }
  // getErrorMessage() {
  //   if (this.email.hasError('required')) {
  //     return 'Debe instroducir correo';
  //   }

  //   return this.email.hasError('email') ? 'Correo no validado' : '';
  // }

}


