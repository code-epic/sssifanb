import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-nom-calculadora',
    templateUrl: './calculadora.component.html',
    styleUrls: ['./calculadora.component.scss']
})
export class CalculadoraComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Pensionados / Nomina: Calculadora',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
