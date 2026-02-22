import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-conf-directivas',
    templateUrl: './directivas.component.html',
    styleUrls: ['./directivas.component.scss']
})
export class DirectivasComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Configuración / Directivas',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
