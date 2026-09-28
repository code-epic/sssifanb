import { Component, OnInit } from '@angular/core';
import { Router, RouterLinkActive, RouterLink } from '@angular/router';
import { LoginService } from 'src/app/core/services/login/login.service';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { ROUTES } from '../../../core/models/menu/menu-models';
import { AfiliadoService } from '../../../core/services/afiliacion/afiliado.service';
import { environment } from 'src/environments/environment';

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
  public usuario: string = '';
  public cargo: string = '';

  public get buildDateFormatted(): string {
    const raw = environment.buildDateTime;
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return raw;
    }
  }

  public get version(): string {
    return environment.version || '';
  }

  public get fullVersionInfo(): string {
    const date = this.buildDateFormatted;
    const ver = this.version;
    if (date && ver) {
      return `${date} ${ver}`;
    }
    return date || ver;
  }

  constructor(
    private router: Router,
    public loginService: LoginService,
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

    if (this.loginService.Usuario) {
      this.usuario = this.loginService.Usuario.nombre || '';
      this.cargo = this.loginService.Usuario.cargo || '';
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
