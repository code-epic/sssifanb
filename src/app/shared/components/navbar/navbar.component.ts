import { Component, OnInit, ElementRef } from '@angular/core';
import { Location} from '@angular/common';
import Swal from 'sweetalert2';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { ROUTES } from 'src/app/core/models/menu/menu-models';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: true,
    imports: [RouterLinkActive, RouterLink, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu]
})
export class NavbarComponent implements OnInit {
  public focus;
  public listTitles: any[];
  public location: Location;
  constructor(location: Location) {
    this.location = location;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);
  }
  getTitle(){
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if(titlee.charAt(0) === '#'){
        titlee = titlee.slice( 1 );
    }

    for(var item = 0; item < this.listTitles.length; item++){
        if(this.listTitles[item].path === titlee){
            return this.listTitles[item].title;
        }
    }
    return 'Principal';
  }

  cerrar(){
    
    Swal.fire({
      title: 'Esta seguro?',
      text: "de salir del sistema!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, desconectarme!'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.clear()
        window.location.href = './';
      }
    })    
  }

}
