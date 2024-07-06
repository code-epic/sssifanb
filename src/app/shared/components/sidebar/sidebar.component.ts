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

  constructor(private router: Router, private loginService: LoginService) { 

  }

  async ngOnInit() {

    if (ROUTES.length == 0){
      await this.loginService.Iniciar()
      var App = this.loginService.Aplicacion
      
      App.Rol.Menu.forEach(e => {
        ROUTES.push({
          path : e.url,
          title: e.nombre,
          icon : e.icono,
          class : e.clase
        })
      });
    }
    this.menuItems = ROUTES.filter(menuItem => menuItem);    
    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });
  }
}