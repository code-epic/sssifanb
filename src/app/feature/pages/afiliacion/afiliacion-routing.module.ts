import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IdentificacionComponent } from './identificacion/identificacion.component';
import { ReportesComponent } from './reportes/reportes.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { TimComponent } from './tim/tim.component';
import { AfiUsuarioComponent } from './afi-usuario/afi-usuario.component';


const routes: Routes = [
    { path: 'identificacion', component: IdentificacionComponent },
    { path: 'usuario', component: AfiUsuarioComponent },
    { path: 'reportes', component: ReportesComponent },
    { path: 'configuracion', component: ConfiguracionComponent },
    { path: 'tim', component: TimComponent },
    { path: '', redirectTo: 'identificacion', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AfiliacionRoutingModule { }
