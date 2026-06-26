import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './feature/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './feature/layouts/auth-layout/auth-layout.component';
import { isMobileGuard, isDesktopGuard } from './core/guards/mobile.guard';

export const routes: Routes = [
  // --- MOBILE VIEWS & LAYOUT ---
  {
    path: '',
    canMatch: [isMobileGuard],
    loadComponent: () => import('./feature/layouts/mobile-layout/mobile-layout.component').then(m => m.MobileLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./feature/pages/mobile/login/mobile-login.component').then(m => m.MobileLoginComponent)
      },
      {
        path: 'principal',
        loadComponent: () => import('./feature/pages/mobile/principal/mobile-principal.component').then(m => m.MobilePrincipalComponent)
      },
      {
        path: 'buscador',
        loadComponent: () => import('./feature/pages/mobile/buscador/mobile-buscador.component').then(m => m.MobileBuscadorComponent)
      },
      {
        path: 'afiliacion/identificacion',
        loadComponent: () => import('./feature/pages/mobile/identificacion/mobile-identificacion.component').then(m => m.MobileIdentificacionComponent)
      },
      {
        path: 'logout',
        loadComponent: () => import('./feature/pages/mobile/logout/mobile-logout.component').then(m => m.MobileLogoutComponent)
      }
    ]
  },

  // --- DESKTOP VIEWS & LAYOUTS ---
  {
    path: '',
    canMatch: [isDesktopGuard],
    redirectTo: 'login',
    pathMatch: 'full',
  }, {
    path: '',
    canMatch: [isDesktopGuard],
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./feature/layouts/admin-layout/admin-layout.routing').then(m => m.AdminLayoutRoutes)
      }
    ]
  }, {
    path: '',
    canMatch: [isDesktopGuard],
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./feature/layouts/auth-layout/auth-layout.routing').then(m => m.AuthLayoutRoutes)
      }
    ]
  },
  {
    path: 'afiliacion',
    canMatch: [isDesktopGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./feature/pages/afiliacion/afiliacion.module').then(m => m.AfiliacionModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

