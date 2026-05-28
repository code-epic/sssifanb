import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CargarNominaComponent } from './cargar-nomina/cargar-nomina.component';

const routes: Routes = [
  {
    path: 'cargar-nomina',
    component: CargarNominaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponenteRoutingModule { }
