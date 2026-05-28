import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

@Component({
    selector: 'app-prest-reportes',
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
    reporteForm!: FormGroup;

    componentes = [
        { id: 'EJB', nombre: 'EJÉRCITO BOLIVARIANO' },
        { id: 'ARB', nombre: 'ARMADA BOLIVARIANA' },
        { id: 'AMB', nombre: 'AVIACIÓN MILITAR BOLIVARIANA' },
        { id: 'GNB', nombre: 'GUARDIA NACIONAL BOLIVARIANA' },
    ];

    grados = [
        { id: '1', nombre: 'Todos los grados' },
        // Add more as needed
    ];

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Principal / Prestaciones: Reportes',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.initForm();
    }

    initForm() {
        this.reporteForm = this.fb.group({
            cedula: ['', [Validators.pattern('^[0-9]+$')]],
            nombres: [''],
            componente: [''],
            situacion: ['ACT'],
            grado: [''],
            fechaDesde: ['', Validators.required],
            fechaHasta: ['', Validators.required]
        });
    }

    consultar() {
        if (this.reporteForm.valid) {
            console.log('Consultando con filtros:', this.reporteForm.value);
            // Implement query logic
        } else {
            this.reporteForm.markAllAsTouched();
        }
    }

    imprimir() {
        if (this.reporteForm.valid) {
            console.log('Imprimiendo reporte con filtros:', this.reporteForm.value);
            // Implement print logic
        } else {
            this.reporteForm.markAllAsTouched();
        }
    }
}
