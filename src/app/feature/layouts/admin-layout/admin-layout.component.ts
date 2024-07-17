import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MensajeService } from 'src/app/core/services/util/mensaje.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss'],
    standalone: true,
    imports: [ SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent ]
})
export class AdminLayoutComponent implements OnInit {

  public datasets: any;
  public data: any;
  public salesChart;
  public clicked: boolean = true;
  public clicked1: boolean = false;
  public pagina : string = '';

  constructor(private ruta : Router, private msj: MensajeService) { }

  ngOnInit() {
    const pagina = this.ruta.url.split("/")
    this.pagina = pagina[1].toUpperCase()
    this.msj.contenido$.subscribe( e => {
      console.log(e)
      this.pagina = e
    })

  }

  IrA(url : string){
    
    this.pagina = url.toUpperCase()
    this.ruta.navigate(['/' + url]);
  }

}
