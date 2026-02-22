import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParametrosComponent } from './parametros/parametros.component';
import { TasaBcvComponent } from './tasa-bcv/tasa-bcv.component';
import { DirectivasComponent } from './directivas/directivas.component';

const routes: Routes = [
    { path: 'parametros', component: ParametrosComponent },
    { path: 'tasa-bcv', component: TasaBcvComponent },
    { path: 'directivas', component: DirectivasComponent },
    { path: '', redirectTo: 'parametros', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
