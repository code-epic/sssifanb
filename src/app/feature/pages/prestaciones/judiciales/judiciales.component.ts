import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-judiciales',
    templateUrl: './judiciales.component.html',
    styleUrls: ['./judiciales.component.scss']
})
export class JudicialesComponent implements OnInit {
    constructor(private layoutService: LayoutService) { }
    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Medidas Judiciales',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
