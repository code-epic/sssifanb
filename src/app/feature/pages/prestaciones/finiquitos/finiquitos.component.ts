import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-finiquitos',
    templateUrl: './finiquitos.component.html',
    styleUrls: ['./finiquitos.component.scss']
})
export class FiniquitosComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Finiquitos',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
