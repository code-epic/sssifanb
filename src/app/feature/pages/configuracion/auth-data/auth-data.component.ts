import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-auth-data',
  templateUrl: './auth-data.component.html',
  styleUrl: './auth-data.component.scss'
})
export class AuthDataComponent implements OnInit {
  activeTab: string = 'listado';
  editando: boolean = false;
  authForm: FormGroup;

  componentes: string[] = ['EJÉRCITO', 'ARMADA', 'AVIACIÓN', 'GUARDIA NACIONAL', 'MILICIA'];
  grados: string[] = ['GENERAL EN JEFE', 'GENERAL DE DIVISIÓN', 'GENERAL DE BRIGADA', 'CORONEL', 'TENIENTE CORONEL', 'MAYOR', 'CAPITÁN', 'PRIMER TENIENTE', 'TENIENTE'];
  niveles: any[] = [
    { label: 'BAJO', value: 0, color: 'success' },
    { label: 'MEDIO', value: 1, color: 'warning' },
    { label: 'ALTO', value: 2, color: 'danger' }
  ];

  tableConfig: DynamicTableConfig = {
    selectable: true,
    rowClickable: true,
    showPagination: true,
    pageSize: 10,
    hoverActions: true,
    tableClass: 'mailbox-table w-100 mb-0',
    containerClass: 'p-0 border-0 shadow-none rounded-20',
    columns: [
      { key: 'cedula', header: 'Cédula', sortable: true },
      { key: 'nombre_completo', header: 'Nombres y Apellidos', sortable: true },
      { key: 'componente', header: 'Componente', sortable: true },
      { key: 'grado', header: 'Grado' },
      { key: 'nivel_label', header: 'Nivel Acceso', type: 'badge', badgeColorKey: 'nivel_color' }
    ],
    actions: [
      { name: 'ver', icon: 'fa fa-search', tooltip: 'Ver Detalle', buttonClass: 'btn-circular btn-info-soft shadow-sm ml-2' },
      { name: 'eliminar', icon: 'fa fa-trash', tooltip: 'Eliminar', buttonClass: 'btn-circular btn-danger-soft shadow-sm ml-2' }
    ]
  };

  tableData = [
    { id: 1, cedula: '12345678', nombre_completo: 'JUAN PÉREZ', componente: 'EJÉRCITO', grado: 'CORONEL', nivel: 2, nivel_label: 'ALTO', nivel_color: 'danger' },
    { id: 2, cedula: '87654321', nombre_completo: 'MARÍA RODRÍGUEZ', componente: 'ARMADA', grado: 'MAYOR', nivel: 1, nivel_label: 'MEDIO', nivel_color: 'warning' },
    { id: 3, cedula: '11223344', nombre_completo: 'PEDRO LÓPEZ', componente: 'AVIACIÓN', grado: 'CAPITÁN', nivel: 0, nivel_label: 'BAJO', nivel_color: 'success' }
  ];

  constructor(
    private fb: FormBuilder,
    private layoutService: LayoutService
  ) { }

  ngOnInit(): void {
    this.layoutService.updateHeader({
      title: 'Configuraciones / Autorización de Datos',
      showBackButton: true,
      alertSeverity: 1,
      showAlertsIcon: true
    });
    this.initForm();
  }

  initForm(): void {
    this.authForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      componente: ['', Validators.required],
      grado: ['', Validators.required],
      nivel: [0, Validators.required]
    });
  }

  nuevaAutorizacion() {
    this.editando = false;
    this.authForm.reset({ nivel: 0 });
    this.activeTab = 'mantenimiento';
  }

  onRowClicked(row: any) {
    this.editando = true;
    const nombres = row.nombre_completo.split(' ');
    this.authForm.patchValue({
      cedula: row.cedula,
      nombre: nombres[0],
      apellido: nombres.slice(1).join(' '),
      componente: row.componente,
      grado: row.grado,
      nivel: row.nivel
    });
    this.activeTab = 'mantenimiento';
  }

  onTableAction(event: any) {
    if (event.actionName === 'ver') {
      this.onRowClicked(event.row);
    } else if (event.actionName === 'eliminar') {
      console.log('Eliminar autorización:', event.row);
      // Aquí abriría el modal de confirmación
    }
  }

  onSubmit(): void {
    if (this.authForm.valid) {
      console.log('Guardando Autorización:', this.authForm.value);
      this.activeTab = 'listado';
    } else {
      this.markAllAsTouched();
    }
  }

  private markAllAsTouched(): void {
    Object.values(this.authForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
