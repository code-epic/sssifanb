import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrestacionesRoutingModule } from './prestaciones-routing.module';

import { AnticiposComponent } from './anticipos/anticipos.component';
import { FiniquitosComponent } from './finiquitos/finiquitos.component';
import { JudicialesComponent } from './judiciales/judiciales.component';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { OrdenesPagoComponent } from './ordenes-pago/ordenes-pago.component';
import { LotesComponent } from './lotes/lotes.component';
import { ReportesComponent } from './reportes/reportes.component';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PastelDatepickerComponent } from 'src/app/shared/components/pastel-datepicker/pastel-datepicker.component';

@NgModule({
    declarations: [
        AnticiposComponent,
        FiniquitosComponent,
        JudicialesComponent,
        MovimientosComponent,
        OrdenesPagoComponent,
        LotesComponent,
        ReportesComponent
    ],
    imports: [
        CommonModule,
        PrestacionesRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbModalModule,
        PastelDatepickerComponent
    ]
})
export class PrestacionesModule { }
