import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-conf-parametros',
    templateUrl: './parametros.component.html',
    styleUrls: ['./parametros.component.scss']
})
export class ParametrosComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Configuración / Parámetros',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
