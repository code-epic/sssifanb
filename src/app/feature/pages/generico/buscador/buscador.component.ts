import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';
import { ApiService } from '../../../../core/services/api.service';
import { LoginService } from '../../../../core/services/login/login.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';
import { MatIcon } from '@angular/material/icon';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { NgClass, NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { IAfiliado } from 'src/app/core/models/afiliacion/afiliado.model';
import { AfiListarComponent } from '../../afiliacion/afi-listar/afi-listar.component';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.scss'],
  standalone: true,
  imports: [NgxUiLoaderModule, FormsModule, NgClass, NgIf, MatTabGroup, MatTab, MatTabLabel, MatIcon, NgFor, DecimalPipe, AfiListarComponent]
})
export class BuscadorComponent implements OnInit {

  public focus: boolean = true;
  public buscar: string = '';
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public militares: IAfiliado[] = [];

  constructor(
    private apiService: ApiService,
    private layoutService: LayoutService,
    private router: Router,
    private modalService: NgbModal,
    public loginService: LoginService,
    private ngxService: NgxUiLoaderService,
    private afiliadoService: AfiliadoService
  ) { }

  ngOnInit(): void {
    this.layoutService.toggleCards(true);
    this.layoutService.updateHeader({
      title: 'Principal / Buscador',
      showBackButton: false,
      alertSeverity: 1,
      showAlertsIcon: false
    });

    // Restore Search Session
    const session = sessionStorage.getItem('buscador_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        this.buscar = data.q;
        this.militares = data.res;
      } catch (e) {
        sessionStorage.removeItem('buscador_session');
      }
    }
  }

  // Sanitization / Validation
  private validarEntrada(texto: string): string | null {
    if (!texto) return null;
    let sanitized = texto.replace(/[';\\]/g, '');
    if (/0x[0-9A-Fa-f]+/.test(sanitized)) {
      return null;
    }
    return sanitized.trim();
  }

  Consultar(event: any) {
    if (event) event.preventDefault();
    this.errorMessage = '';

    const inputVal = this.validarEntrada(this.buscar);

    if (!inputVal || inputVal.length < 3) {
      this.errorMessage = 'Ingrese al menos 3 caracteres válidos.';
      return;
    }

    this.isLoading = true;
    this.militares = []; // Clear previous results immediately

    setTimeout(() => {
      this.routeSearch(inputVal);
    }, 1200);
  }

  private routeSearch(valor: string) {
    const isNumeric = /^\d+$/.test(valor);
    if (isNumeric) {
      this.buscarCedula(valor);
    } else {
      this.buscarCadena(valor);
    }
  }

  buscarCedula(cedula: string) {
    const payload = { "funcion": "FANB_CIdentificarMilitar", "parametros": cedula };
    this.militares = [];
    sessionStorage.removeItem('buscador_session'); // Clear session on direct ID search
    this.apiService.post('crud', payload).subscribe({
      next: (data: IAfiliado) => {
        this.isLoading = false;
        if (data) {
          this.afiliadoService.setAfiliado(data);
          this.router.navigate(['/afiliacion/identificacion']);
        } else {
          this.errorMessage = "No se encontró el afiliado.";
        }
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.errorMessage = 'Error al consultar el servicio.';
      }
    });
  }

  async buscarCadena(cadena: string) {
    const payload = { 'funcion': 'IPSFA_LMilitares', 'parametros': cadena.replace(/"/g, '\\"') };

    try {
      const data = await this.apiService.postStream<IAfiliado[]>('crud', payload);
      this.isLoading = false;
      this.militares = data || [];

      // Save Session
      sessionStorage.setItem('buscador_session', JSON.stringify({
        q: cadena,
        res: this.militares
      }))
      this.buscar = '';

    } catch (error) {
      console.error(error);
      this.isLoading = false;
      this.errorMessage = 'Error al consultar el servicio.'
      this.buscar = '';
    }
  }

  selectMilitarFromList(militar: any) {
    this.afiliadoService.setAfiliado(militar);
    this.router.navigate(['/afiliacion/identificacion']);
  }

  open(content) {
    this.modalService.open(content, { size: 'lg' });
  }
}
