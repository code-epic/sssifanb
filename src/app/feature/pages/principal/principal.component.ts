import { Component, OnInit } from '@angular/core';
import { BuscadorComponent } from '../generico/buscador/buscador.component';



@Component({
    selector: 'app-principal',
    templateUrl: './principal.component.html',
    styleUrls: ['./principal.component.scss'],
    standalone: true,
    imports: [BuscadorComponent]
})
export class PrincipalComponent implements OnInit {

  public datasets: any;
  public data: any;
  public salesChart;
  public clicked: boolean = true;
  public clicked1: boolean = false;

  ngOnInit() {

  }

}
