import { Routes } from '@angular/router';
import { ConfigurarComponent } from '../../pages/configurar/configurar.component';
import { BuscadorComponent } from '../../pages/generico/buscador/buscador.component';
import { PerfilComponent } from '../../pages/generico/perfil/perfil.component';
import { PrincipalComponent } from '../../pages/principal/principal.component';
import { ReportesComponent } from '../../pages/reportes/reportes.component';
import { TemplateFormFileComponent } from '../../pages/template-form-file/template-form-file.component';
import { TemplateFormPictureComponent } from '../../pages/template-form-picture/template-form-picture.component';

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
    {
        path: 'template-picture',
        component: TemplateFormPictureComponent,
        // canActivate: [AuthGuardGuard]
    },

];

