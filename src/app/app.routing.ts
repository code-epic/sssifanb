import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './feature/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './feature/layouts/auth-layout/auth-layout.component';

export const routes: Routes =[
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }, 
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./feature/layouts/admin-layout/admin-layout.routing').then(m => m.AdminLayoutRoutes)
      }
    ]
  }, {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./feature/layouts/auth-layout/auth-layout.routing').then(m => m.AuthLayoutRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
