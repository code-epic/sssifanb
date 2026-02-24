import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AfiliacionRoutingModule } from './afiliacion-routing.module';
import { IdentificacionComponent } from './identificacion/identificacion.component';
import { ReportesComponent } from './reportes/reportes.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { TimComponent } from './tim/tim.component';
import { AfiUsuarioComponent } from './afi-usuario/afi-usuario.component';
import { PastelDatepickerComponent } from 'src/app/shared/components/pastel-datepicker/pastel-datepicker.component';
import { IndicadoresComponent } from './indicadores/indicadores.component';
import { LiberacionesComponent } from './liberaciones/liberaciones.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DynamicTableComponent } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@NgModule({
    declarations: [
        IdentificacionComponent,
        ReportesComponent,
        ConfiguracionComponent,
        TimComponent,
        IndicadoresComponent,
        LiberacionesComponent,
        AfiUsuarioComponent
    ],
    imports: [
        CommonModule,
        AfiliacionRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        PastelDatepickerComponent,
        NgbDropdownModule,
        DynamicTableComponent
    ]
})
export class AfiliacionModule { }
