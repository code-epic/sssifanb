import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-conf-tasa-bcv',
    templateUrl: './tasa-bcv.component.html',
    styleUrls: ['./tasa-bcv.component.scss']
})
export class TasaBcvComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Configuración / Tasa BCV',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
