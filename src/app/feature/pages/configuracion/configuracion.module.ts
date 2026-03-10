import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';

import { ParametrosComponent } from './parametros/parametros.component';
import { TasaBcvComponent } from './tasa-bcv/tasa-bcv.component';
import { DirectivasComponent } from './directivas/directivas.component';
import { AuthDataComponent } from './auth-data/auth-data.component';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PastelDatepickerComponent } from 'src/app/shared/components/pastel-datepicker/pastel-datepicker.component';

import { DynamicTableComponent } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@NgModule({
    declarations: [
        ParametrosComponent,
        TasaBcvComponent,
        DirectivasComponent,
        AuthDataComponent
    ],
    imports: [
        CommonModule,
        ConfiguracionRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbModalModule,
        PastelDatepickerComponent,
        DynamicTableComponent
    ]
})
export class ConfiguracionModule { }
