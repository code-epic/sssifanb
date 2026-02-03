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
import { PerfilService } from 'src/app/core/services/perfil/perfil.service';
import { FormUploadComponent } from "./componets/form-upload/form-upload.component";
import { filter, forkJoin, map, Observable, of, tap } from 'rxjs';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatProgressBarModule,
    MatButton,
    ChildremComponent,
    CambiarclaveComponent,
    FormUploadComponent,
  ]
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

  form: FormGroup;

  constructor(
    private loginService: LoginService,
    private fb: FormBuilder,
    private perfilService: PerfilService,
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
      // dni: new FormControl(null, [Validators.required, onlyNumberValidator()]),
      // typeDni: new FormControl(null, []),
      // name: new FormControl(null, [Validators.required]),
      // lastname: new FormControl(null, []),
      // campo1: new FormControl(null, []),
      // campo2: new FormControl(null, []),
      archivo: new FormControl(null, []),
    });

    if (this.loginService.Usuario != null) {
      console.log(this.loginService.Usuario);
      this.nombrecompleto = this.loginService.Usuario.nombre;
      this.nombre = this.loginService.Usuario.Usuario;
      this.perfil = this.loginService.Usuario.Perfil.descripcion;
      this.correo = this.loginService.Usuario.correo;
      this.cedula = this.loginService.Usuario.cedula;
    }

    this.getAllData();
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

  progress = 0;
  message = "";
  uploading = false;
  onReceivedFile(event: any) {

    this.uploading = true;
    this.progress = 0;

    this.perfilService.upload(event)
      .pipe(
        tap(event => {
          console.log(event.type);

          if (event.type === HttpEventType.UploadProgress) {
            const progressEvent = event as { loaded: number, total: number };
            this.totalSize = progressEvent.total; // Almacena el tamaño total
            this.simulateProgress(); // Simula el progreso
          } else if (event.type === HttpEventType.Response) {
            clearInterval(this.intervalId);
            this.progress = 100;
            this.message = "Archivo guardado";
            // this.uploading = false;
          }

        })
      ).subscribe({
        next: (value: any) => {
          console.log("=> ", value);

        },
        error: (error) => {
          this.message = "Error al subir el archivo";
          this.uploading = false;
        }
      });

    // this.perfilService.upload(event).subscribe({
    //   next: (value:any) => {
    //     console.log("=> ", value);

    //   }
    // })

  }

  intervalId: any;
  millisecons = 500;
  totalSize = 0; // Almacena el tamaño total del archivo
  simulateProgress() {
    let currentLoaded = 0;
    this.intervalId = setInterval(() => {
      if (currentLoaded >= this.totalSize) {
        clearInterval(this.intervalId);
        return;
      }
      currentLoaded += this.totalSize / 100; // Incrementa el loaded gradualmente
      this.progress = Math.round((100 * currentLoaded) / this.totalSize);
      if (this.progress >= 100) {
        clearInterval(this.intervalId);
        this.progress = 100;
      }
    }, this.millisecons); // Ajusta el intervalo para controlar la velocidad
  }

  getAllData() {
    forkJoin([
      this.perfilService.sexo(),
      this.perfilService.pais(),
      this.perfilService.estado(),
    ]).subscribe({
      next: ([peticion1, peticion2, peticion3]) => {
        console.log("peticion1", peticion1);
        console.log("peticion2", peticion2);
        console.log("peticion3", peticion3);
      },
      error: (error: any) => {
        console.error('Error in one or both observables:', error);
      }
    });
  }


  private getEventMessage(event: HttpEvent<any>, file: File) {
    switch (event.type) {
      case HttpEventType.Sent:
        return `Uploading file "${file.name}" of size ${file.size}.`;

      case HttpEventType.UploadProgress:
        // Compute and show the % done:
        const percentDone = event.total ? Math.round(100 * event.loaded / event.total) : 0;
        return `File "${file.name}" is ${percentDone}% uploaded.`;

      case HttpEventType.Response:
        return `File "${file.name}" was completely uploaded!`;

      default:
        return `File "${file.name}" surprising upload event: ${event.type}.`;
    }
  }


}


