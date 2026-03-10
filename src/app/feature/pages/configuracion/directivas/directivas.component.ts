import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@Component({
    selector: 'app-conf-directivas',
    templateUrl: './directivas.component.html',
    styleUrls: ['./directivas.component.scss']
})
export class DirectivasComponent implements OnInit {

    activeTab: string = 'libreria';
    activeSubTab: string = 'tabulador';
    editando: boolean = false;

    formDirectiva: FormGroup;
    formPrima: FormGroup;

    tableConfig: DynamicTableConfig = {
        selectable: true,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none rounded-20',
        columns: [
            { key: 'codigo', header: 'Código', sortable: true },
            { key: 'nombre', header: 'Nombre / Motivo', sortable: true },
            { key: 'fecha_inicio', header: 'F. Inicio', sortable: true },
            { key: 'fecha_fin', header: 'F. Fin' },
            { key: 'salario_minimo', header: 'Salario Mínimo', type: 'currency' },
            { key: 'estatus', header: 'Estatus', type: 'badge', badgeColorKey: 'estatusColor' }
        ],
        actions: [
            { name: 'ver', icon: 'fa fa-search', tooltip: 'Consultar', buttonClass: 'btn-circular btn-info-soft shadow-sm ml-2' },
            { name: 'clonar', icon: 'fa fa-copy', tooltip: 'Clonar', buttonClass: 'btn-circular btn-primary-soft shadow-sm ml-2' },
            { name: 'anular', icon: 'fa fa-times', tooltip: 'Anular', buttonClass: 'btn-circular btn-danger-soft shadow-sm ml-2' }
        ]
    };

    tableData = [
        { id: 1, codigo: 'DIR-2023', nombre: 'Incremento Salarial 2023', fecha_inicio: '01/01/2023', fecha_fin: '31/12/2023', salario_minimo: 130, estatus: 'ACTIVO', estatusColor: 'success' },
        { id: 2, codigo: 'DIR-2022', nombre: 'Ajuste Presidencial', fecha_inicio: '15/03/2022', fecha_fin: '31/12/2022', salario_minimo: 130, estatus: 'CERRADA', estatusColor: 'secondary' }
    ];

    dicVariables = [
        { id: 'componente', label: 'Componente', icon: 'fa-shield-alt' },
        { id: 'grado', label: 'Grado Jerárquico', icon: 'fa-star' },
        { id: 'sueldo_basico', label: 'Sueldo Básico', icon: 'fa-money-bill-wave' },
        { id: 'tiempo_servicio', label: 'Tiempo de Servicio', icon: 'fa-calendar-check' },
        { id: 'hijos', label: 'Cantidad de Hijos', icon: 'fa-child' },
        { id: 'calculo', label: 'Cálculo por Monto Fijo/3%', icon: 'fa-calculator' },
        { id: 'total_primas', label: 'Total Primas', icon: 'fa-layer-group' },
        { id: 'sueldo_minimo', label: 'Sueldo Mínimo', icon: 'fa-coins' },
        { id: 'unidad_tributaria', label: 'Unidad Tributaria', icon: 'fa-file-invoice' },
        { id: 'sueldo_mensual', label: 'Sueldo Mensual', icon: 'fa-wallet' },
        { id: 'porcentaje_profesionalizacion', label: 'Porcentaje Profesionalización', icon: 'fa-graduation-cap' }
    ];

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private modalService: NgbModal
    ) {
        this.formDirectiva = this.fb.group({
            codigo: ['', Validators.required],
            nombre: ['', Validators.required],
            fecha_inicio: ['', Validators.required],
            fecha_fin: [''],
            salario_minimo: [0, Validators.required],
            unidad_tributaria: [0, Validators.required],
            porcentaje: [0]
        });

        this.formPrima = this.fb.group({
            primaid: ['0X'],
            prima_nombre: [''],
            estructura: [''],
            cuenta: [''],
            partida: [''],
            formula: ['']
        });
    }

    ngOnInit(): void {
        this.layoutService.updateHeader({
            title: 'Configuración / Directiva de Sueldo',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });
    }

    nuevaDirectiva() {
        this.editando = false;
        this.formDirectiva.reset();
        this.formPrima.reset();
        this.activeTab = 'mantenimiento';
    }

    onRowClicked(row: any) {
        this.editando = true;
        this.formDirectiva.patchValue({
            codigo: row.codigo,
            nombre: row.nombre,
            fecha_inicio: row.fecha_inicio,
            fecha_fin: row.fecha_fin,
            salario_minimo: row.salario_minimo,
            unidad_tributaria: 10,
            porcentaje: 0
        });
        this.activeTab = 'mantenimiento';
    }

    onTableAction(event: any, modalConfirmar: TemplateRef<any>, modalEliminar?: TemplateRef<any>) {
        if (event.actionName === 'clonar') {
            this.modalService.open(modalConfirmar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'anular' && modalEliminar) {
            this.modalService.open(modalEliminar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'ver') {
            this.onRowClicked(event.row);
        }
    }

    abrirModalVariables(modal: TemplateRef<any>) {
        this.modalService.open(modal, { centered: true, size: 'lg' });
    }

    insertarVariable(variableId: string) {
        const formulaControl = this.formPrima.get('formula');
        const currentValue = formulaControl?.value || '';
        formulaControl?.setValue(currentValue + ' ' + variableId + ' ');
        this.modalService.dismissAll();
    }

    insertarOperador(op: string) {
        const formulaControl = this.formPrima.get('formula');
        const currentValue = formulaControl?.value || '';
        formulaControl?.setValue(currentValue + op);
    }
}
