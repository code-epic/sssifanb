import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-reportes',
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Reportes',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
