import { Component, OnInit } from '@angular/core';
import { Router, RouterLinkActive, RouterLink } from '@angular/router';
import { LoginService } from 'src/app/core/services/login/login.service';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { ROUTES } from '../../../core/models/menu/menu-models';
import { AfiliadoService } from '../../../core/services/afiliacion/afiliado.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLinkActive, RouterLink, NgbCollapse, NgFor, NgIf, NgClass]
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public isCollapsed = true;
  public logoUrl: string = './assets/img/ipsfa/logo.webp';
  public activeSubMenu: string | null = null;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private afiliadoService: AfiliadoService
  ) { }

  toggleSubMenu(menuId: string) {
    if (this.activeSubMenu === menuId) {
      this.activeSubMenu = null; // Cierra si hace clic de nuevo
    } else {
      this.activeSubMenu = menuId; // Abre el nuevo y cierra el anterior
    }
  }

  async ngOnInit() {
    this.menuItems = ROUTES;
    // Si ROUTES está vacío (ej. F5), intentar recargarlo desde le sesión
    if (ROUTES.length == 0) {
      this.loginService.cargarMenu();
    }

    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });

    // Escuchar cambios del Afiliado para cambiar Logo
    this.afiliadoService.afiliado$.subscribe(afiliado => {
      if (afiliado && afiliado.componente && afiliado.componente.abreviatura) {
        let abrev = afiliado.componente.abreviatura.toUpperCase();
        this.logoUrl = `./assets/img/componentes/${abrev}.webp`;
      } else {
        this.logoUrl = './assets/img/ipsfa/logo.webp';
      }
    });
  }
}
