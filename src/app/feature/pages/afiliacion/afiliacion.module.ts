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


@NgModule({
    declarations: [
        IdentificacionComponent,
        ReportesComponent,
        ConfiguracionComponent,
        TimComponent,
        AfiUsuarioComponent
    ],
    imports: [
        CommonModule,
        AfiliacionRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        PastelDatepickerComponent
    ]
})
export class AfiliacionModule { }
