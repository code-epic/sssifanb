import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-fideicomitentes',
    templateUrl: './fideicomitentes.component.html',
    styleUrls: ['./fideicomitentes.component.scss']
})
export class FideicomitentesComponent implements OnInit {
    
    // Simulación de datos para la vista premium
    fideicomitentes: any[] = [
        { id: 'F001', nombre: 'Fondo de Ahorro FANB', saldo: 154200.50, fecha: '2026-05-01' },
        { id: 'F002', nombre: 'Fideicomiso Especial 2024', saldo: 89000.00, fecha: '2026-04-15' }
    ];

    constructor(private layoutService: LayoutService) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Fideicomitentes',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }
}
