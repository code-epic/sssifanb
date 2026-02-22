import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NominaRoutingModule } from './nomina-routing.module';

import { CalculadoraComponent } from './calculadora/calculadora.component';
import { ConceptosComponent } from './conceptos/conceptos.component';
import { PatriaComponent } from './patria/patria.component';
import { RetroactivosComponent } from './retroactivos/retroactivos.component';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
        CalculadoraComponent,
        ConceptosComponent,
        PatriaComponent,
        RetroactivosComponent
    ],
    imports: [
        CommonModule,
        NominaRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbModalModule
    ]
})
export class NominaModule { }
