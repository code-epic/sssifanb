import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IAPICore } from '../../../core/models/api/api-model';
import { ApiService } from '../../../core/services/api.service';
import { HechiceroComponent } from '../generico/hechicero/hechicero.component';
import { TablaComponent } from '../generico/tabla/tabla.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';

@Component({
  selector: 'app-configurar',
  templateUrl: './configurar.component.html',
  styleUrls: ['./configurar.component.scss'],
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    FormsModule, 
    NgFor, 
    MatOption, 
    MatIcon, 
    MatSuffix, 
    MatButton, 
    TablaComponent, 
    HechiceroComponent]
})
export class ConfigurarComponent implements OnInit {

  public producto: string = "0"

  public xAPI: IAPICore = {
    funcion: '',
    parametros: ''
  }

  @ViewChild('hechicero', { static: true }) hechicero: TemplateRef<any>;

  public lstMaestro: any



  constructor(public dialog: MatDialog, private apiService: ApiService) { }

  ngOnInit(): void {
    this.xAPI.funcion = "CCEC_CMaestro"
    this.xAPI.parametros = "%"
    this.apiService.Ejecutar(this.xAPI).subscribe(
      (data) => {
        this.lstMaestro = data.Cuerpo
      },
      (err) => {
        console.error(err)
      }
    )

  }

  openDialog(): void {
    const dialogRef = this.dialog.open(this.hechicero, {
      width: '850px',
      data: {},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      // this.animal = result;
    });
  }

  seleccionNavegacion(e) {

  }
}
