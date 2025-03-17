import { Routes } from '@angular/router';
import { PrincipalComponent } from '../../pages/principal/principal.component';
import { AuthGuardGuard } from '../../../core/guards/auth-guard.guard';
import { BuscadorComponent } from '../../pages/generico/buscador/buscador.component';
import { PerfilComponent } from '../../pages/generico/perfil/perfil.component';
import { ConfigurarComponent } from '../../pages/configurar/configurar.component';
import { ReportesComponent } from '../../pages/reportes/reportes.component';
import { TemplateFormFileComponent } from '../../pages/template-form-file/template-form-file.component';

export const AdminLayoutRoutes: Routes = [
    {
        path: 'principal',
        component: PrincipalComponent,
        // canActivate: [AuthGuardGuard]
    }, {
        path: 'buscador',
        component: BuscadorComponent,
        // canActivate: [AuthGuardGuard]
    }, {
        path: 'perfil',
        component: PerfilComponent,
        // canActivate: [AuthGuardGuard]
    }, {
        path: 'configurar',
        component: ConfigurarComponent,
        // canActivate: [AuthGuardGuard]
    }, {
        path: 'reportes',
        component: ReportesComponent,
        // canActivate: [AuthGuardGuard]
    },
    {
        path: 'template-file',
        component: TemplateFormFileComponent,
        // canActivate: [AuthGuardGuard]
    },

];

