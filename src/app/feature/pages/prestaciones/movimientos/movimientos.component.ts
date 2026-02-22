import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-movimientos',
    templateUrl: './movimientos.component.html',
    styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Movimientos',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
