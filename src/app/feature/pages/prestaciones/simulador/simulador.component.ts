import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';
import { ApiService } from 'src/app/core/services/api.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { COMPONENTES_MILITARES, GRADOS_MILITARES } from 'src/app/core/models/militar/militar.model';

@Component({
  selector: 'app-simulador',
  templateUrl: './simulador.component.html',
  styleUrls: ['./simulador.component.scss']
})
export class SimuladorComponent implements OnInit, OnDestroy {
  @ViewChild('modalConfirmar') modalConfirmar: TemplateRef<any>;
  @ViewChild('cedulaInput') cedulaInput: ElementRef;

  public componentes = COMPONENTES_MILITARES;
  public grados = GRADOS_MILITARES;

  public simuladorForm: FormGroup;
  public resultados: any = null;
  public isLoadingSearch: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private layoutService: LayoutService,
    private apiService: ApiService,
    private utilService: UtilService,
    private afiliadoService: AfiliadoService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.updateHeader();
    
    // Auto-focus al iniciar
    setTimeout(() => this.focusSearch(), 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.simuladorForm = this.fb.group({
      cedula: [''],
      nombres: [{ value: '', disabled: true }],
      apellidos: [{ value: '', disabled: true }],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      componente: ['', Validators.required],
      grado: ['', Validators.required],
      fechaIngreso: ['', Validators.required],
      fechaUltAscenso: ['', Validators.required],
      nHijos: [0, [Validators.required, Validators.min(0)]],
      
      sb: [0, [Validators.required, Validators.min(0)]],
      alicBonoVac: [0, [Validators.required, Validators.min(0)]],
      pDocu: [0, [Validators.required, Validators.min(0)]],
      pProf: [0, [Validators.required, Validators.min(0)]],
      alicFin: [0, [Validators.required, Validators.min(0)]],
      pTS: [0, [Validators.required, Validators.min(0)]],
      ts: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private updateHeader() {
    this.layoutService.updateHeader({
      title: 'Simulador de Prestaciones',
      showBackButton: true,
      alertSeverity: 1
    });
    this.layoutService.triggerScrollToTop();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
  }

  focusSearch() {
    if (this.cedulaInput) {
      this.cedulaInput.nativeElement.focus();
      this.cedulaInput.nativeElement.select();
    }
  }

  onSearchEnter(event: any) {
    if (event) event.preventDefault();
    const cedula = this.simuladorForm.get('cedula')?.value;
    if (!cedula || cedula.length < 4) return;

    this.consultarPorCedula(cedula);
  }

  consultarPorCedula(cedula: string) {
    this.isLoadingSearch = true;
    const payload = {
      funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR,
      parametros: cedula,
    };

    this.apiService.post("crud", payload).subscribe({
      next: (data: any) => {
        this.isLoadingSearch = false;
        if (data) {
          this.poblarDatos(data);
        } else {
          this.utilService.AlertMini('top-end', 'error', 'No se encontró el expediente', 2000);
        }
      },
      error: () => {
        this.isLoadingSearch = false;
        this.utilService.AlertMini('top-end', 'error', 'Error en la conexión', 2000);
      }
    });
  }

  private poblarDatos(data: any) {
    // Normalizar datos del afiliado
    const m = Array.isArray(data) ? data[0] : data;
    
    this.simuladorForm.patchValue({
      nombres: m.persona.datobasico.nombres,
      apellidos: m.persona.datobasico.apellidos,
      componente: m.componente.abreviatura,
      grado: m.grado.abreviatura,
      fechaIngreso: m.fingreso ? m.fingreso.split('T')[0] : '',
      fechaUltAscenso: m.fult_ascenso ? m.fult_ascenso.split('T')[0] : '',
      nHijos: m.persona.datobasico.numerohijos || 0
    });
    
    this.utilService.AlertMini('top-end', 'success', 'Expediente cargado', 1500);
  }

  confirmarCalculo() {
    if (this.simuladorForm.invalid) {
      this.utilService.AlertMini('top-end', 'warning', 'Complete los campos requeridos', 2000);
      return;
    }
    this.modalService.open(this.modalConfirmar, { centered: true, size: 'md' });
  }

  ejecutarCalculo(modal: any) {
    const v = this.simuladorForm.getRawValue(); // Obtener incluso deshabilitados
    
    const sm = Number(v.sb) + Number(v.pDocu) + Number(v.pTS) + Number(v.pProf);
    const alicTotal = Number(v.alicBonoVac) + Number(v.alicFin);
    const si = sm + alicTotal;
    const aa = si * Number(v.ts);

    this.resultados = {
      sm: sm.toFixed(2),
      si: si.toFixed(2),
      aa: aa.toFixed(2),
      fechaCalculo: v.fecha
    };

    modal.close();
    this.layoutService.triggerScrollToTop();
  }

  limpiar() {
    this.simuladorForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      nHijos: 0,
      sb: 0,
      alicBonoVac: 0,
      pDocu: 0,
      pProf: 0,
      alicFin: 0,
      pTS: 0,
      ts: 0
    });
    this.resultados = null;
    this.focusSearch();
  }
}
