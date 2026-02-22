import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalculadoraComponent } from './calculadora/calculadora.component';
import { ConceptosComponent } from './conceptos/conceptos.component';
import { PatriaComponent } from './patria/patria.component';
import { RetroactivosComponent } from './retroactivos/retroactivos.component';

const routes: Routes = [
    { path: 'calculadora', component: CalculadoraComponent },
    { path: 'conceptos', component: ConceptosComponent },
    { path: 'patria', component: PatriaComponent },
    { path: 'retroactivos', component: RetroactivosComponent },
    { path: '', redirectTo: 'calculadora', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NominaRoutingModule { }
