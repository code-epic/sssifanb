import { Component, OnInit } from '@angular/core';
import { Router, RouterLinkActive, RouterLink } from '@angular/router';
import { LoginService } from 'src/app/core/services/login/login.service';
import { NgFor } from '@angular/common';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { ROUTES } from '../../../core/models/menu/menu-models';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [RouterLinkActive, RouterLink, NgbCollapse, NgFor]
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public isCollapsed = true;

  constructor(private router: Router, private loginService: LoginService) { }

  async ngOnInit() {
    this.menuItems = ROUTES;
    // Si ROUTES está vacío (ej. F5), intentar recargarlo desde le sesión
    if (ROUTES.length == 0) {
      this.loginService.cargarMenu();
    }

    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });
  }
}
