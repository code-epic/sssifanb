import { Routes } from '@angular/router';
import { BuscadorComponent } from '../../pages/generico/buscador/buscador.component';
import { PerfilComponent } from '../../pages/generico/perfil/perfil.component';
import { PrincipalComponent } from '../../pages/principal/principal.component';
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
    {
        path: 'afiliacion',
        loadChildren: () => import('../../pages/afiliacion/afiliacion.module').then(m => m.AfiliacionModule)
    },
    {
        path: 'prestaciones',
        loadChildren: () => import('../../pages/prestaciones/prestaciones.module').then(m => m.PrestacionesModule)
    },
    {
        path: 'nomina',
        loadChildren: () => import('../../pages/nomina/nomina.module').then(m => m.NominaModule)
    },
    {
        path: 'configuracion',
        loadChildren: () => import('../../pages/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
    },
];

