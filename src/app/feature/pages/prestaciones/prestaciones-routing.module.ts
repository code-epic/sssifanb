import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnticiposComponent } from './anticipos/anticipos.component';
import { FiniquitosComponent } from './finiquitos/finiquitos.component';
import { JudicialesComponent } from './judiciales/judiciales.component';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { OrdenesPagoComponent } from './ordenes-pago/ordenes-pago.component';
import { LotesComponent } from './lotes/lotes.component';
import { ReportesComponent } from './reportes/reportes.component';
import { PatriaComponent } from './patria/patria.component';
import { FideicomitentesComponent } from './movimientos/fideicomitentes/fideicomitentes.component';
import { SimuladorComponent } from './simulador/simulador.component';

const routes: Routes = [
    { path: 'anticipos', component: AnticiposComponent },
    { path: 'finiquitos', component: FiniquitosComponent },
    { path: 'judiciales', component: JudicialesComponent },
    { path: 'movimientos', component: MovimientosComponent },
    { path: 'ordenes-pago', component: OrdenesPagoComponent },
    { path: 'lotes', component: LotesComponent },
    { path: 'reportes', component: ReportesComponent },
    { path: 'patria', component: PatriaComponent },
    { path: 'fideicomitentes', component: FideicomitentesComponent },
    { path: 'simulador', component: SimuladorComponent },
    { path: '', redirectTo: 'anticipos', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PrestacionesRoutingModule { }
