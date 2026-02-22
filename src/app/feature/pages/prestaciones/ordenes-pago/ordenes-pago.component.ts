import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-ordenes-pago',
    templateUrl: './ordenes-pago.component.html',
    styleUrls: ['./ordenes-pago.component.scss']
})
export class OrdenesPagoComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Ordenes de Pago',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
