import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
// tslint:disable-next-line:max-line-length
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { IAPICore } from '../../../../core/models/api/api-model';
import { ApiService } from '../../../../core/services/api.service';
import { Maestro } from '../../../../core/services/util/tabla.service';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';

@Component({
    selector: 'app-tabla',
    templateUrl: './tabla.component.html',
    styleUrls: ['./tabla.component.scss'],
    standalone: true,
    // tslint:disable-next-line:max-line-length
    imports: [MatFormField, MatLabel, MatInput, MatIcon, MatSuffix, MatMiniFabButton, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatPaginator]
})
export class TablaComponent implements OnInit {
  public xAPI: IAPICore = {
    funcion : '',
    parametros : ''
  };

  public ELEMENT_DATA: Maestro[] = [];
  displayedColumns: string[] = ['codigo', 'nombre', 'fecha'];
  dataSource: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @Input () API: any;

  constructor(private apiService: ApiService) {}


  async ngOnChanges() {
    console.log('Entrando a la conexion ', this.API);
      // tslint:disable-next-line:triple-equals
    if (this.API !== '0' ) {
      await this.cargarContenido();
    }
  }

  ngOnInit(): void {
  }

  cargarContenido(): any {
    this.ELEMENT_DATA = [];
    this.xAPI.funcion = 'CCEC_CContenido';
    this.xAPI.parametros = this.API;

    this.apiService.post(this.xAPI).subscribe({
        next: this.successCargarContenido.bind(this),
        error: this.errorCargarContenido.bind(this)
    });
  }

  successCargarContenido(data: any){
      this.ELEMENT_DATA = data.Cuerpo;
      this.dataSource = new MatTableDataSource<Maestro>(this.ELEMENT_DATA);
      this.dataSource.paginator = this.paginator;
  }

  errorCargarContenido(error: any) {
      console.log('error =>', error);
  }

}
