import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import Swal from 'sweetalert2';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@Component({
    selector: 'app-nom-conceptos',
    templateUrl: './conceptos.component.html',
    styleUrls: ['./conceptos.component.scss']
})
export class ConceptosComponent implements OnInit {

    public formConcepto: FormGroup;
    private indexEliminar: number = -1;
    public activeTab: string = 'libreria'; // 'libreria' o 'mantenimiento'
    public editando: boolean = false;

    // Pagination & Search
    public page: number = 1;
    public pageSize: number = 10;
    public mostrarBuscador: boolean = false;
    public searchTerm: string = '';

    public dicVariables: any[] = [
        { id: 'prima_descendencia', label: 'Prima Descendencia', icon: 'fa-child' },
        { id: 'prima_profesionalizacion', label: 'Prima Profesionalización', icon: 'fa-user-graduate' },
        { id: 'prima_tiemposervicio', label: 'Prima Tiempo Servicio', icon: 'fa-clock' },
        { id: 'sueldo_basico', label: 'Sueldo Básico', icon: 'fa-coins' },
        { id: 'tiempo_servicio', label: 'Tiempo de Servicio', icon: 'fa-calendar-alt' },
        { id: 'hijos', label: 'Nro. Hijos', icon: 'fa-baby' },
        { id: 'total_primas', label: 'Total Primas', icon: 'fa-chart-pie' },
        { id: 'sueldo_minimo', label: 'Sueldo Mínimo', icon: 'fa-money-bill-wave' },
        { id: 'aguinaldo', label: 'Aguinaldo', icon: 'fa-gift' },
        { id: 'unidad_tributaria', label: 'Und. Tributaria', icon: 'fa-file-invoice-dollar' },
        { id: 'porcentaje_pension', label: 'Porcentaje Pensión', icon: 'fa-percentage' }
    ];

    public listaConceptos: any[] = [
        { codigo: 'P001', descripcion: 'Sueldo Básico Pensión', formula: '(sueldo_basico * 1.5)', cuenta: '200-10-10', partida: '4-01-01', tipo: 1, estatus: 1 },
        { codigo: 'P002', descripcion: 'Prima de Antigüedad', formula: '(tiempo_servicio * 100) + sueldo_minimo', cuenta: '200-10-20', partida: '4-01-02', tipo: 1, estatus: 1 },
        { codigo: 'D001', descripcion: 'Retención de Ley', formula: '(sueldo_basico * 0.05)', cuenta: '400-20-10', partida: '4-02-01', tipo: 0, estatus: 1 },
        { codigo: 'D002', descripcion: 'Préstamo Personal', formula: '(1500.00)', cuenta: '400-30-50', partida: '4-03-01', tipo: 3, estatus: 0 }
    ];

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private modalService: NgbModal
    ) {
        this.formConcepto = this.fb.group({
            codigo: ['', Validators.required],
            descripcion: ['', Validators.required],
            formula: ['', Validators.required],
            cuenta: ['', Validators.required],
            partida: ['', Validators.required],
            tipo: [1, Validators.required],
            estatus: [1, Validators.required]
        });

        this.procesarConceptosData();
    }

    public tableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        columns: [
            { key: 'codigoFormat', header: 'Código', sortable: true, type: 'html', width: '15%' },
            { key: 'descripcionFormat', header: 'Descripción', sortable: true, type: 'html', width: '50%' },
            { key: 'tipoFormat', header: 'Tipo', sortable: true, type: 'html', width: '15%', align: 'center' }
        ],
        actions: [
            { name: 'eliminar', icon: 'fa-trash-alt', tooltip: 'Eliminar Concepto', buttonClass: 'btn-danger-soft pastel-warning shadow-none' }
        ]
    };

    public tableData: any[] = [];

    private procesarConceptosData() {
        this.tableData = this.listaConceptos.map(m => {
            let tipoBadge = '';
            let tipoText = '';

            if (m.tipo === 1 || m.tipo === 2) {
                tipoBadge = 'background-color: rgba(46, 204, 113, 0.1); color: #27ae60;';
                tipoText = '+(A)';
            } else if (m.tipo === 0 || m.tipo === 3) {
                tipoBadge = 'background-color: rgba(220, 53, 69, 0.1); color: #dc3545;';
                tipoText = '-(D)';
            } else {
                tipoBadge = 'background-color: rgba(235, 154, 68, 0.1); color: #eb9a44;';
                tipoText = '(*) O.';
            }

            return {
                ...m,
                codigoFormat: `<span class="fw-bold text-dark font-monospace" style="font-size: 0.95rem;">${m.codigo}</span>`,
                descripcionFormat: `
                    <div class="fw-bold fs-6 text-dark opacity-75">${m.descripcion}</div>
                    <small class="text-primary-teal fw-bold d-block mt-1 font-monospace"><i class="fa fa-file-invoice me-1"></i> Partida: ${m.partida} | C.C: ${m.cuenta}</small>
                `,
                tipoFormat: `<span class="badge font-monospace px-3 py-2" style="border-radius: 8px; ${tipoBadge}">${tipoText}</span>`
            };
        });
    }

    public onTableAction(event: any, modal: any) {
        if (event.actionName === 'eliminar') {
            const index = this.listaConceptos.findIndex(c => c.codigo === event.row.codigo);
            if (index > -1) {
                // Pass a synthetic event since we don't have the real click event here
                this.confirmarEliminar(modal, index, { stopPropagation: () => { } } as any);
            }
        }
    }

    public onRowClicked(row: any) {
        this.seleccionarConcepto(row);
    }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Nómina / Gestión de Conceptos',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

    seleccionarConcepto(item: any) {
        this.formConcepto.patchValue({
            codigo: item.codigo,
            descripcion: item.descripcion,
            formula: item.formula,
            cuenta: item.cuenta,
            partida: item.partida,
            tipo: item.tipo,
            estatus: item.estatus
        });
        this.editando = true;
        this.activeTab = 'mantenimiento';
    }

    nuevoConcepto() {
        this.formConcepto.reset({ tipo: 1, estatus: 1 });
        this.editando = false;
        this.activeTab = 'mantenimiento';
    }

    // --- MANEJO DE VARIABLES EN FÓRMULA ---
    abrirModalVariables(content: any) {
        this.modalService.open(content, { centered: true, size: 'lg', windowClass: 'modal-premium' });
    }

    insertarVariable(variableId: string) {
        const formulaControl = this.formConcepto.get('formula');
        if (formulaControl) {
            const current = formulaControl.value || '';
            formulaControl.setValue(current ? `${current} [${variableId}]` : `[${variableId}]`);

            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: `Variable [${variableId}] añadida` });
        }
    }

    insertarOperador(op: string) {
        const formulaControl = this.formConcepto.get('formula');
        if (formulaControl) {
            const current = formulaControl.value || '';
            formulaControl.setValue(current ? `${current} ${op} ` : `${op} `);
        }
    }

    // --- GUARDAR CONCEPTO ---
    confirmarGuardar(content: any) {
        if (this.formConcepto.invalid) {
            Swal.fire({
                title: 'Evaluación Incompleta',
                text: 'Debe estructurar correctamente la fórmula y proveer un código válido.',
                icon: 'warning',
                customClass: { confirmButton: 'btn btn-ok' },
                buttonsStyling: false
            });
            return;
        }
        this.modalService.open(content, { centered: true, size: 'md' });
    }

    registrarConcepto(modal: any) {
        const formVal = this.formConcepto.value;

        if (this.editando) {
            const index = this.listaConceptos.findIndex(c => c.codigo === formVal.codigo);
            if (index > -1) {
                this.listaConceptos[index] = { ...formVal, tipo: parseInt(formVal.tipo, 10), estatus: parseInt(formVal.estatus, 10) };
            }
        } else {
            this.listaConceptos.unshift({
                ...formVal,
                tipo: parseInt(formVal.tipo, 10),
                estatus: parseInt(formVal.estatus, 10)
            });
        }

        this.procesarConceptosData();
        modal.close();

        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Kernel Rust Sincronizado. Concepto Activo.' });

        this.activeTab = 'libreria';
    }

    // --- ELIMINAR CONCEPTO ---
    confirmarEliminar(content: any, index: number, event: Event) {
        event.stopPropagation();
        this.indexEliminar = index;
        this.modalService.open(content, { centered: true, size: 'md' });
    }

    eliminarConcepto(modal: any) {
        if (this.indexEliminar > -1) {
            this.listaConceptos.splice(this.indexEliminar, 1);
            this.indexEliminar = -1;
            this.procesarConceptosData();
            modal.close();
            Swal.fire({
                title: 'Registro Desactivado',
                text: 'El concepto no se computará en las próximas ejecuciones.',
                icon: 'success',
                customClass: { confirmButton: 'btn btn-ok' },
                buttonsStyling: false
            });
        }
    }
}
