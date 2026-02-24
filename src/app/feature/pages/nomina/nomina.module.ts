import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NominaRoutingModule } from './nomina-routing.module';

import { CalculadoraComponent } from './calculadora/calculadora.component';
import { ConceptosComponent } from './conceptos/conceptos.component';
import { PatriaComponent } from './patria/patria.component';
import { RetroactivosComponent } from './retroactivos/retroactivos.component';
import { CalculosComponent } from './calculos/calculos.component';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PastelDatepickerComponent } from 'src/app/shared/components/pastel-datepicker/pastel-datepicker.component';
import { DynamicTableComponent } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@NgModule({
    declarations: [
        CalculadoraComponent,
        ConceptosComponent,
        PatriaComponent,
        RetroactivosComponent,
        CalculosComponent
    ],
    imports: [
        CommonModule,
        NominaRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbModalModule,
        PastelDatepickerComponent,
        DynamicTableComponent
    ]
})
export class NominaModule { }
