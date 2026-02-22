import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-nom-conceptos',
    templateUrl: './conceptos.component.html',
    styleUrls: ['./conceptos.component.scss']
})
export class ConceptosComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Pensionados / Nomina: Conceptos',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
