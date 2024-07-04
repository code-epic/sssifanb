import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
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
    imports: [MatFormField, MatLabel, MatInput, MatIcon, MatSuffix, MatMiniFabButton, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatPaginator]
})
export class TablaComponent implements OnInit {
 
  public xAPI : IAPICore = {
    funcion : '',
    parametros : ''
  }


  public ELEMENT_DATA: Maestro[] = [];
  

  displayedColumns: string[] = ['codigo', 'nombre', 'fecha'];
  dataSource : any

  @ViewChild(MatPaginator) paginator: MatPaginator;

  //@Input ('columnas') displayedColumns: string[];

  @Input () API: any // = ['codigo', 'nombre', 'descripcion'];

  constructor(private apiService : ApiService) {
    
   }


  async ngOnChanges(){
    console.log('Entrando a la conexion ', this.API)
    if (this.API != "0" ) {
      await this.cargarContenido()
    }

    
  //  this.ELEMENT_DATA.push( {codigo: '03', nombre: 'PUNTO DE VENTA',  usuario: 'PUNTO DE VENTA'})
  //  console.info(this.ELEMENT_DATA)

  }


  ngAfterViewInit() {
    
    
    
  }


  

  ngOnInit(): void {
  }

  cargarContenido() : any{
    
    this.ELEMENT_DATA = []
    this.xAPI.funcion = "CCEC_CContenido"
    this.xAPI.parametros = this.API
    this.apiService.Ejecutar(this.xAPI).subscribe(
      (data) => {
        
        this.ELEMENT_DATA = data.Cuerpo
        this.dataSource = new MatTableDataSource<Maestro>(this.ELEMENT_DATA)
        this.dataSource.paginator = this.paginator
      },
      (err) => {
        console.error(err)
      }
    )
  }

}
