import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-nom-patria',
    templateUrl: './patria.component.html',
    styleUrls: ['./patria.component.scss']
})
export class PatriaComponent implements OnInit {

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Pensionados / Nomina: Patria',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

}
