import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import Swal from 'sweetalert2';
import { DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-calculos',
  templateUrl: './calculos.component.html',
  styleUrls: ['./calculos.component.scss']
})
export class CalculosComponent implements OnInit {

  public formDirectiva: FormGroup;
  public pasoActual: number = 1;
  public tipoCalculoCodigo: string = '';
  public tipoCalculoTitle: string = '';
  public cargandoArchivos: boolean = false;

  constructor(
    private layoutService: LayoutService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.formDirectiva = this.fb.group({
      tipoNomina: ['0', Validators.required],
      directiva: ['', Validators.required],
      formaPago: ['0', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      mes: ['0', Validators.required]
    });
  }

  ngOnInit(): void {
    this.layoutService.toggleCards(false);
    this.layoutService.updateHeader({
      title: 'Nómina / Cálculos y Procesamiento',
      showBackButton: true,
      alertSeverity: 1,
      showAlertsIcon: true
    });


  }

  abrirModalCalculo(content: any, codigo: string, title: string) {
    this.tipoCalculoCodigo = codigo;
    this.tipoCalculoTitle = title;
    this.pasoActual = 1;
    this.formDirectiva.reset({ tipoNomina: '0', formaPago: '0' });
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true });
  }


  simularEjecucion(modal: any) {
    modal.close();
    let timerInterval: any;
    Swal.fire({
      title: 'Procesando en el Kernel...',
      html: 'Transpilando liquidación en <b></b> milisegundos.',
      timer: 3000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
        const timer = Swal.getPopup()?.querySelector('b');
        if (timer) {
          timerInterval = setInterval(() => {
            timer.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        }
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    });
  }

  simularCargaArchivos() {
    this.cargandoArchivos = true;
    setTimeout(() => {
      this.cargandoArchivos = false;
      this.pasoActual = 4;
    }, 2000);
  }

  // == DYNAMIC TABLE CONF && MOCK DATA ==

  public nominaTableConfig: DynamicTableConfig = {
    selectable: false,
    showPagination: true,
    pageSize: 5,
    columns: [
      { key: 'codigo', header: 'Código Serie', sortable: true, type: 'text', isCustomHTML: true },
      { key: 'tipoNominaHtml', header: 'Tipo de Nómina', sortable: true, type: 'html' },
      { key: 'fechaRangoHtml', header: 'Rango Fechas', sortable: true, type: 'html' },
      { key: 'registros', header: 'Registros', sortable: true, type: 'text', totalize: true },
      { key: 'total', header: 'Total Neto (Bs)', type: 'currency', sortable: true, totalize: true },
      { key: 'estado', header: 'Estado', type: 'badge', sortable: true, badgeColorKey: 'estadoColor', iconKey: 'estadoIcon' }
    ],
    actions: [
      { name: 'ver', icon: 'fa-eye', tooltip: 'Ver Detalles' },
      { name: 'descargar', icon: 'fa-download', tooltip: 'Descargar TXT' },
      { name: 'cerrar', icon: 'fa-lock text-warning', tooltip: 'Cerrar Nómina', buttonClass: 'btn-amber-soft' }
    ]
  };

  public nominaData = [
    {
      codigo: '<span class="font-weight-600 font-monospace" style="color: #334155;">NMN-2026-10-RCP</span>',
      tipoNominaHtml: `<div class="font-weight-600" style="color: #475569; line-height: 1.2;">NOMINA MENSUAL</div><small class="text-muted font-weight-500" style="font-size: 0.75rem;">Retirados con Pensión</small>`,
      fechaRangoHtml: '<span class="text-muted font-weight-500" style="font-size: 0.85rem;"><i class="far fa-calendar-alt mr-1"></i> 01/10/2026 - 31/10/2026</span>',
      registros: 42500,
      total: 12450890.00,
      estado: 'Procesando',
      estadoColor: 'badge-teal',
      estadoIcon: 'fa-cog fa-spin'
    },
    {
      codigo: '<span class="font-weight-600 font-monospace" style="color: #334155;">NMN-2026-09-FCP</span>',
      tipoNominaHtml: `<div class="font-weight-600" style="color: #475569; line-height: 1.2;">NOMINA MENSUAL</div><small class="text-muted font-weight-500" style="font-size: 0.75rem;">Sobrevivientes</small>`,
      fechaRangoHtml: '<span class="text-muted font-weight-500" style="font-size: 0.85rem;"><i class="far fa-calendar-alt mr-1"></i> 01/09/2026 - 30/09/2026</span>',
      registros: 18200,
      total: 4120500.00,
      estado: 'Aprobada',
      estadoColor: 'badge-blue',
      estadoIcon: 'fa-check-double'
    }
  ];

  public conceptosTableConfig: DynamicTableConfig = {
    selectable: true,
    showPagination: false,
    columns: [
      { key: 'codigo', header: 'Código', sortable: true, type: 'html', width: '150px' },
      { key: 'descripcion', header: 'Descripción del Concepto', sortable: true, type: 'text' }
    ]
  };

  public conceptosData = [
    { codigo: '<span class="font-monospace text-primary-teal" style="font-size: 0.8rem;">P-001</span>', descripcion: 'Sueldo Básico Pensión' },
    { codigo: '<span class="font-monospace text-primary-teal" style="font-size: 0.8rem;">P-002</span>', descripcion: 'Prima de Antigüedad' },
    { codigo: '<span class="font-monospace text-primary-teal" style="font-size: 0.8rem;">D-001</span>', descripcion: 'Deducción Caja de Ahorros' }
  ];

  onTableAction(event: any, modalConfirmarCerrar: any) {
    if (event.actionName === 'cerrar') {
      this.openModal(modalConfirmarCerrar);
    }
  }

  onConceptosSelected(selected: any[]) {
    // console.log('Seleccionados:', selected);
  }
}
