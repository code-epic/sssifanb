import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ComponenteService } from './core/services/componente/componente.service';
import { EstatusBeneficiarioService } from './core/services/estatus/estatus-beneficiario.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
  title = 'argon-dashboard-angular';

  constructor(
    private componenteService: ComponenteService,
    private estatusBeneficiarioService: EstatusBeneficiarioService
  ) {}
}
