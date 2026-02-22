import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-nom-retroactivos',
    templateUrl: './retroactivos.component.html',
    styleUrls: ['./retroactivos.component.scss']
})
export class RetroactivosComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Pensionados / Nomina: Retroactivos',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
