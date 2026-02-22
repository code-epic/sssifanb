import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-lotes',
    templateUrl: './lotes.component.html',
    styleUrls: ['./lotes.component.scss']
})
export class LotesComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Procesos en Lote',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
