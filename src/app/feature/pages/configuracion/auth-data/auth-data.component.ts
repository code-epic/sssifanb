import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IAfiliado } from 'src/app/core/models/afiliacion/afiliado.model';
import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { environment } from 'src/environments/environment';
import { UtilService } from 'src/app/core/services/util/util.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth-data',
  templateUrl: './auth-data.component.html',
  styleUrl: './auth-data.component.scss'
})
export class AuthDataComponent implements OnInit {
  activeTab: string = 'listado';
  editando: boolean = false;
  authForm: FormGroup;

  componentes: string[] = ['EJÉRCITO BOLIVARIANO', 'ARMADA BOLIVARIANA', 'AVIACIÓN MILITAR BOLIVARIANA', 'GUARDIA NACIONAL BOLIVARIANA', 'MILICIA BOLIVARIANA'];
  grados: string[] = ['GENERAL EN JEFE', 'GENERAL DE DIVISIÓN', 'GENERAL DE BRIGADA', 'CORONEL', 'TENIENTE CORONEL', 'MAYOR', 'CAPITÁN', 'PRIMER TENIENTE', 'TENIENTE', 'SARGENTO MAYOR DE PRIMERA', 'SARGENTO MAYOR DE SEGUNDA', 'SARGENTO MAYOR DE TERCERA', 'SARGENTO PRIMERO'];
  niveles: any[] = [
    { label: 'BAJO', value: 0, color: 'infop' },
    { label: 'MEDIO', value: 1, color: 'warningp' },
    { label: 'ALTO', value: 2, color: 'dangerp' }
  ];

  loading: boolean = false;

  tableConfig: DynamicTableConfig = {
    selectable: true,
    rowClickable: true,
    showPagination: true,
    pageSize: 10,
    hoverActions: true,
    tableClass: 'mailbox-table w-100 mb-0',
    containerClass: 'p-0 border-0 shadow-none rounded-20',
    columns: [
      { key: 'cedula_html', header: 'Cédula', type: 'html', width: '120px' },
      { key: 'nombre_completo', header: 'Nombre Apellidos', sortable: true },
      { key: 'grado_html', header: 'Grado', type: 'html', align: 'center', width: '100px' },
      { key: 'componente_desc', header: 'Componente', sortable: true, width: '200px' },
      { key: 'nivel_html', header: 'Autorización', type: 'html', align: 'right', width: '140px' }
    ],
    actions: [
      { name: 'ver', icon: 'fa fa-search', tooltip: 'Ver Detalle', buttonClass: 'btn-pastel-icon-circle pastel-success mx-1 tooltip-action' },
      { name: 'eliminar', icon: 'fa fa-times', tooltip: 'Quitar Autorización', buttonClass: 'btn-pastel-icon-circle pastel-danger mx-1 tooltip-action' }
    ]
  };

  tableData = [];
  filteredData = [];
  searchTerm: string = '';
  allSelected: boolean = false;

  constructor(
    private fb: FormBuilder,
    private layoutService: LayoutService,
    private apiService: ApiService,
    private utilService: UtilService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.layoutService.updateHeader({
      title: 'Configuraciones / Autorización de Datos',
      showBackButton: true,
      alertSeverity: 1,
      showAlertsIcon: true
    });
    this.initForm();
    this.listMilitaryAuthority();
  }

  listMilitaryAuthority() {
    this.loading = true;
    const payload = { "funcion": environment.funcion.LISTAR_AFILIADO_AUTORIDAD, "parametros": "2" };
    this.apiService.post('crud', payload).subscribe({
      next: (res: any[]) => {
        if (res && Array.isArray(res)) {
          this.tableData = res.map(item => {
            const authLevel = Number(item.authorization_level || 0);
            const nivelObj = this.niveles.find(n => n.value === authLevel) || this.niveles[0];

            let icon = 'fa-shield-alt';
            let color = '#1e293b';
            if (authLevel === 1) icon = 'fa-lock';
            if (authLevel === 2) icon = 'fa-user-shield';

            // Lógica de Color para Grado Militar
            const gDesc = (item.grado?.descripcion || '').toUpperCase();
            const gAbr = (item.grado?.abreviatura || '').toUpperCase();
            let gColor = 'info'; // Default

            // Alta Jerarquía
            if (gDesc.includes('GENERAL') || gDesc.includes('ALMIRANTE') || gAbr.match(/^(GJ|GD|GB|MG|VA|CA|CRNL|CNEL)$/)) {
              gColor = 'indigo-soft';
            } else if (gDesc.includes('MAYOR') || gDesc.includes('CAPITAN') || gAbr.match(/^(MY|CAP|TTE|PTTE|TF|AN)$/)) {
              gColor = 'blue-soft';
            } else if (gDesc.includes('SARGENTO') || gAbr.match(/^(SM1|SM2|SM3|S1|S2)$/)) {
              gColor = 'amber-soft';
            }

            return {
              ...item,
              cedula_html: `<span class="badge badge-pill bg-light text-muted border font-weight-bold shadow-none" 
                                style="font-size: 0.68rem; letter-spacing: 0.3px; padding: 0.4em 0.8em; border-color: #cbd5e1 !important; color: #475569 !important;">
                                V-${item.id}
                            </span>`,
              nombre_completo: item.persona?.datobasico?.nombrecompleto?.toUpperCase(),
              grado_html: `<span class="font-weight-800 text-dark" style="font-size: 0.82rem;">${item.grado?.abreviatura?.toUpperCase() || ''}</span>`,
              componente_desc: item.componente?.descripcion?.toUpperCase(),
              nivel_html: `<div class="d-flex justify-content-end pr-2">
                            <div class="badge-pastel-minimal ${nivelObj.color}" 
                                style="font-size: 0.65rem; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; min-width: 90px; justify-content: center; border: 1px solid rgba(0,0,0,0.03);">
                                <i class="fas ${icon} mr-2" style="font-size: 0.7rem; opacity: 0.8;"></i>
                                <span style="font-weight: 800; letter-spacing: 0.5px;">${nivelObj.label}</span>
                            </div>
                        </div>`
            };
          });
          this.filteredData = [...this.tableData];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error listando autoridades:', error);
        this.loading = false;
      }
    });
  }

  initForm(): void {
    this.authForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      componente: ['', Validators.required],
      grado: ['', Validators.required],
      nivel: [1, Validators.required]
    });
  }

  nuevaAutorizacion() {
    this.editando = false;
    this.authForm.reset({ nivel: 0 });
    this.activeTab = 'mantenimiento';
  }

  filterTable() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredData = [...this.tableData];
      return;
    }
    this.filteredData = this.tableData.filter(row =>
      row.cedula?.toString().includes(term) ||
      row.nombre_completo?.toLowerCase().includes(term) ||
      row.componente_desc?.toLowerCase().includes(term)
    );
  }

  toggleAll(event: any) {
    this.allSelected = event.target.checked;
    // La tabla dinámica maneja la selección interna, pero aquí podríamos sincronizar estados si fuera necesario
  }

  onRowSelection(rows: any[]) {
    this.allSelected = rows.length === this.filteredData.length;
  }

  onRowClicked(row: any) {
    this.editando = true;
    this.authForm.patchValue({
      cedula: row.cedula,
      nombre: row.persona.datobasico.nombreprimero,
      apellido: row.persona.datobasico.apellidoprimero,
      componente: row.componente?.descripcion?.toUpperCase(),
      grado: row.grado?.descripcion?.toUpperCase(),
      nivel: Number(row.authorization_level || 0)
    });
    this.activeTab = 'mantenimiento';
  }

  onTableAction(event: any, contentDelete?: any) {
    if (event.actionName === 'ver') {
      this.selectedDocId = event.row.id || event.row.cedula;
      this.activeTab = 'mantenimiento';
      this.buscarCedula(this.selectedDocId);
    } else if (event.actionName === 'eliminar') {
      this.selectedDocId = event.row.cedula;
      this.modalService.open(contentDelete, { centered: true, size: 'md' });
    }
  }

  onSubmit(content?: any): void {
    if (this.authForm.valid) {
      this.updateMilitaryAuthority(content);
    } else {
      this.markAllAsTouched();
    }
  }

  updateMilitaryAuthority(content: any) {
    this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
  }

  selectedDocId: string = '';
  ejecutarEliminar(modal: any) {
    this.loading = true;
    modal.close();
    // Simulación de eliminación exitosa
    setTimeout(() => {
      this.loading = false;
      this.utilService.AlertMini('top-end', 'success', 'Autorización revocada con éxito', 3000);
      this.listMilitaryAuthority();
    }, 1000);
  }

  ejecutarUpdate(modal: any) {
    const { cedula, nivel } = this.authForm.value;
    this.loading = true;
    modal.close();

    const payload = {
      "funcion": environment.funcion.ACTUALIZAR_AFILIADO_AUTORIDAD,
      "parametros": `${cedula},${nivel}`
    };

    this.apiService.post('crud', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.utilService.AlertMini('top-end', 'success', 'Nivel de acceso actualizado con éxito', 3000);
        this.activeTab = 'listado';
        this.listMilitaryAuthority();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error actualizando:', error);
        this.utilService.AlertMini('top-end', 'error', 'No se pudo procesar la actualización', 3000);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.authForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  buscarCedula(cedula: string) {
    if (!cedula) return;

    const payload = { "funcion": environment.funcion.CONSULTAR_AFILIADO_AUTORIDAD, "parametros": cedula };

    this.apiService.post('crud', payload).subscribe({
      next: (res: any) => {
        // La respuesta es un array, tomamos el primero si existe
        if (res && res.length > 0) {
          const data = res[0];
          this.authForm.patchValue({
            cedula: data.id,
            nombre: data.persona.datobasico.nombreprimero?.toUpperCase(),
            apellido: data.persona.datobasico.apellidoprimero?.toUpperCase(),
            componente: data.componente?.descripcion?.toUpperCase(),
            grado: data.grado?.descripcion?.toUpperCase(),
            nivel: Number(data.authorization_level || 0)
          });
        }
      },
      error: (error) => {
        console.error('Error consultando cédula:', error);
      }
    });
  }
}
