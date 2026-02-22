import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';

import { ParametrosComponent } from './parametros/parametros.component';
import { TasaBcvComponent } from './tasa-bcv/tasa-bcv.component';
import { DirectivasComponent } from './directivas/directivas.component';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
        ParametrosComponent,
        TasaBcvComponent,
        DirectivasComponent
    ],
    imports: [
        CommonModule,
        ConfiguracionRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbModalModule
    ]
})
export class ConfiguracionModule { }
