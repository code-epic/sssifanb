import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';
import { IAfiliado } from 'src/app/core/models/afiliacion/afiliado.model';
import { MdlFamiliarComponent } from './mdl-familiar/mdl-familiar.component';
import { LoginService } from 'src/app/core/services/login/login.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/core/services/api.service';
import { environment } from 'src/environments/environment';
import { SecurityQueueService } from 'src/app/core/services/util/security-queue.service';
import { UtilService } from 'src/app/core/services/util/util.service';


@Component({
    selector: 'app-afi-identificacion',
    templateUrl: './identificacion.component.html',
    styleUrls: ['./identificacion.component.scss']
})
export class IdentificacionComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    public identificacionForm: FormGroup;
    public familiares: any[] = []; // Lista para la tabla
    public familiarForm: FormGroup;
    public currentTab: string = 'militar';
    public moneda: string = 'Bs.';
    public fechaVencimientoTIM: string = '';
    public isLoadingSearch: boolean = false;

    @ViewChild('cedulaInput') cedulaInput: ElementRef;


    // Var to control the pastel printing dropdown menu visibility
    public showPrintDropdown: boolean = false;

    public selectedMotivoEmision: string = '';
    public selectedNomina: string = '';

    // Add Family Member Modal Data
    public selectedNacionalidadFamiliar: string = '';
    public cedulaFamiliar: string = '';
    public selectedParentescoFamiliar: string = '';

    // Bancos Data
    public bancos: any[] = [
        { code: '0102', name: 'BANCO DE VENEZUELA', color: '#b91c1c' },
        { code: '0134', name: 'BANESCO', color: '#16a34a' },
        { code: '0105', name: 'MERCANTIL', color: '#1d4ed8' },
        { code: '0177', name: 'BANFANB', color: '#15803d' },
        { code: '0108', name: 'PROVINCIAL', color: '#1e40af' },
        { code: '0163', name: 'BANCO DEL TESORO', color: '#be123c' },
        { code: '0175', name: 'BICENTENARIO', color: '#991b1b' },
        { code: '0191', name: 'BNC', color: '#1e293b' },
        { code: '0172', name: 'BANCAMIGA', color: '#0369a1' },
        { code: '0114', name: 'BANCARIBE', color: '#0369a1' },
        { code: '0115', name: 'EXTERIOR', color: '#1d4ed8' },
        { code: '0151', name: 'FONDO COMÚN', color: '#ca8a04' },
        { code: '0174', name: 'BANPLUS', color: '#0f172a' },
        { code: '0157', name: 'DEL SUR', color: '#15803d' }
    ];
    public bancoSeleccionado: any = null;
    public cuentasBancarias: any[] = [];

    constructor(
        private fb: FormBuilder,
        private afiliadoService: AfiliadoService,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal,
        private loginService: LoginService,
        private router: Router,
        private apiService: ApiService,
        private securityQueue: SecurityQueueService,
        private utilservice: UtilService,
        private layoutService: LayoutService
    ) {
        console.log(sessionStorage.getItem('menu'));
    }



    ngOnInit(): void {
        this.initForms();

        this.layoutService.triggerScrollToTop();

        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Identificación Militar',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: false
        });

        // Auto-focus search field
        setTimeout(() => this.focusSearch(), 500);

        this.afiliadoService.afiliado$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
            if (data) {
                let afiliadoData = data;
                if (Array.isArray(data) && data.length > 0) {
                    afiliadoData = data[0];
                } else if (Array.isArray(data) && data.length === 0) {
                    return;
                }

                // console.log('Datos Crudos Normalizados:', afiliadoData);
                const parsedData = this.parseData(afiliadoData);
                // console.log('Datos Procesados (ready to patch):', parsedData);

                // Calcular Tiempo de Servicio
                this.tiempoServicio = this.calcularTServicio(parsedData.fingreso, parsedData.fretiro, parsedData.situacion);
                // Calcular Tiempo Total solo si hay tiempo reconocido
                const tieneReconocido = parsedData.areconocido > 0 || parsedData.mreconocido > 0 || parsedData.dreconocido > 0;
                this.tiempoServicioTotal = tieneReconocido
                    ? this.calcularTServicioTotal(parsedData.fingreso, parsedData.areconocido, parsedData.mreconocido, parsedData.dreconocido)
                    : '';

                // Mapear Vencimiento TIM
                this.fechaVencimientoTIM = this.formatDate(afiliadoData.tim?.fechavencimiento);

                // Procesar Familiares
                this.familiares = this.processFamiliares(afiliadoData.familiar);

                // Calcular hijos para el input si no venía explicitamente en la data
                if (parsedData.numerohijos === 0 || !parsedData.numerohijos) {
                    const cantHijos = this.familiares.filter(f => f.parentesco === 'HIJO' || f.parentesco === 'HIJA').length;
                    parsedData.numerohijos = cantHijos;
                }

                if (this.identificacionForm) {
                    try {
                        // 1. Patch Root Fields
                        ['categoria', 'situacion', 'clase', 'fingreso', 'fascenso', 'fretiro', 'nresuelto', 'posicion', 'componente', 'grado', 'numerohijos', 'areconocido', 'mreconocido', 'dreconocido', 'pprof'].forEach(key => {
                            if (parsedData[key] !== undefined) {
                                this.identificacionForm.get(key)?.setValue(parsedData[key]);
                            }
                        });

                        // 2. Patch Nested Persona Fields
                        if (parsedData.persona) {
                            const personaGroup = this.identificacionForm.get('persona') as FormGroup;
                            Object.keys(parsedData.persona).forEach(pKey => {
                                // Patch nested groups one by one
                                const nestedControl = personaGroup.get(pKey);
                                if (nestedControl && parsedData.persona[pKey]) {
                                    nestedControl.patchValue(parsedData.persona[pKey]);
                                }
                            });
                        }

                        this.cdr.detectChanges();
                    } catch (e) {
                        console.error('Error parcheando formulario:', e);
                    }
                }
            }
        });
    }

    @HostListener('document:click', ['$event'])
    closePrintDropdown(event: MouseEvent) {
        // Find if target is the print dropdown button
        const targetElement = event.target as HTMLElement;
        if (!targetElement.closest('#printDocsDropdown')) {
            this.showPrintDropdown = false;
        }
    }

    private processFamiliares(list: any[]): any[] {
        if (!list || !Array.isArray(list)) return [];
        return list.map(f => {
            const db = f.persona?.datobasico;

            // Robust check accounting for "true"/"false" strings, booleans, and 1/0 numbers
            const isMilitar = f.esmilitar === true || String(f.esmilitar).toLowerCase() === 'true' || f.esmilitar === 1;
            const isBeneficioFalse = f.beneficio === false || String(f.beneficio).toLowerCase() === 'false' || f.beneficio === 0;

            return {
                parentesco: this.resolvParentesco(f.parentesco, db?.sexo),
                cedula: db?.cedula ? `${db.nacionalidad || 'V'}-${db.cedula}` : 'S/C',
                nombres: (this.unirNombres(db) + ' ' + this.unirApellidos(db)).trim(),
                fechanacimiento: this.formatDate(db?.fechanacimiento),
                // "esmilitar" y "beneficio" son directos del objeto familiar (f), no de persona/datobasico
                esMilitar: isMilitar,
                inactivo: isBeneficioFalse,
                original: f
            };
        });
    }

    private resolvParentesco(parentesco: string, sexo: string = 'M'): string {
        const p = (parentesco || '').toUpperCase();
        const s = (sexo || 'M').toUpperCase();

        switch (p) {
            case 'PD': return s === 'F' ? 'MADRE' : 'PADRE';
            case 'HJ': return s === 'F' ? 'HIJA' : 'HIJO';
            case 'ES': case 'EA': return s === 'M' ? 'ESPOSO' : 'ESPOSA';
            case 'HM': return s === 'F' ? 'HERMANA' : 'HERMANO';
            default: return p;
        }
    }

    openFamiliarModal(familiar?: any) {
        const modalRef = this.modalService.open(MdlFamiliarComponent, { size: 'xl', centered: true });
        if (familiar && familiar.original) {
            modalRef.componentInstance.familiar = familiar.original;
        } else if (familiar) {
            modalRef.componentInstance.familiar = familiar;
        }

        modalRef.result.then((result) => {
            if (result) {
                console.log('Familiar guardado (Mock):', result);
            }
        }).catch(() => { });
    }

    public tiempoServicio: string = '';
    public tiempoServicioTotal: string = '';

    private calcularTServicio(fechaIngresoIso: string, fechaRetiroIso: string, situacion: string): string {
        if (!fechaIngresoIso) return '';

        const fechaActual = new Date();
        let annoA = fechaActual.getFullYear();
        let mesA = fechaActual.getMonth() + 1;
        let diaA = fechaActual.getDate();

        if (situacion !== "ACT" && fechaRetiroIso) {
            const fret = fechaRetiroIso.split("-");
            if (fret.length === 3) {
                annoA = parseInt(fret[0], 10);
                mesA = parseInt(fret[1], 10);
                diaA = parseInt(fret[2], 10);
            }
        }

        const f = fechaIngresoIso.split("-");
        if (f.length !== 3) return '';

        let anoN = parseInt(f[0], 10);
        let mesN = parseInt(f[1], 10);
        let diaM = parseInt(f[2], 10);

        let ano = annoA - anoN;
        let mes = mesA - mesN;
        let dia = diaA - diaM;

        if (dia < 0) {
            dia = 30 + dia;
            mes--;
        }
        if (mes < 0) { // Fix bug in original script which did mes <= 0
            mes = 12 + mes;
            ano--;
        }

        return `${ano}A ${mes}M ${dia}D`;
    }

    private calcularTServicioTotal(fechaIngresoIso: string, areconocido: number, mreconocido: number, dreconocido: number): string {
        const basic = this.calcularTServicio(fechaIngresoIso, '', 'ACT');
        if (!basic || !areconocido) return basic;

        const parts = basic.match(/(\d+)A\s*(\d+)M\s*(\d+)D/);
        if (!parts) return basic;

        let anos = parseInt(parts[1], 10) + areconocido;
        let meses = parseInt(parts[2], 10) + mreconocido;
        let dias = parseInt(parts[3], 10) + dreconocido;

        if (dias >= 30) {
            dias = dias - 30;
            meses++;
        }
        if (meses >= 12) {
            meses = meses - 12;
            anos++;
        }

        return `${anos}A ${meses}M ${dias}D`;
    }

    private parseData(data: any): any {
        return {
            categoria: data.categoria || 'EFE',
            situacion: data.situacion || 'ACT',
            clase: data.clase || 'OFI',
            fingreso: this.formatDate(data.fingreso),
            fascenso: this.formatDate(data.fascenso),
            fretiro: this.formatDate(data.fretiro),
            nresuelto: data.nresuelto || '',
            posicion: data.posicion || '',
            componente: data.componente?.abreviatura || '',
            grado: data.grado?.abreviatura || '',
            numerohijos: data.numerohijos || data.nhijo || 0,
            areconocido: data.areconocido || 0,
            mreconocido: data.mreconocido || 0,
            dreconocido: data.dreconocido || 0,
            pprof: data.pprof || 0,

            persona: {
                datobasico: {
                    cedula: data.persona?.datobasico?.cedula || '',
                    nombres: this.unirNombres(data.persona?.datobasico),
                    apellidos: this.unirApellidos(data.persona?.datobasico),
                    fechanacimiento: this.formatDate(data.persona?.datobasico?.fechanacimiento),
                    sexo: data.persona?.datobasico?.sexo || '',
                    estadocivil: data.persona?.datobasico?.estadocivil || ''
                },
                correo: {
                    principal: data.persona?.correo?.principal || ''
                },
                telefono: {
                    movil: data.persona?.telefono?.movil || ''
                },
                redsocial: {
                    twitter: data.persona?.redsocial?.twitter || '',
                    facebook: data.persona?.redsocial?.facebook || '',
                    instagram: data.persona?.redsocial?.instagram || ''
                },
                datofisico: {
                    peso: data.persona?.datofisico?.peso || '',
                    talla: data.persona?.datofisico?.talla || ''
                },
                datofisionomico: {
                    gruposanguineo: data.persona?.datofisionomico?.gruposanguineo || '',
                    colorpiel: data.persona?.datofisionomico?.colorpiel || '',
                    colorojos: data.persona?.datofisionomico?.colorojos || '',
                    colorcabello: data.persona?.datofisionomico?.colorcabello || ''
                },
                direccion: this.extractFirst(data.persona?.direccion, { calleavenida: '', casa: '', apartamento: '', estado: '', ciudad: '', municipio: '' }),
                datofinanciero: this.extractFirst(data.persona?.datofinanciero, { institucion: '', tipo: 'CA', cuenta: '' })
            }
        };
    }

    private extractFirst(arr: any, defaultObj: any): any {
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
        return defaultObj;
    }

    private unirNombres(db: any): string {
        if (!db) return '';
        return [db.nombreprimero, db.nombresegundo].filter(Boolean).join(' ');
    }

    private unirApellidos(db: any): string {
        if (!db) return '';
        return [db.apellidoprimero, db.apellidosegundo].filter(Boolean).join(' ');
    }

    private formatDate(mongoDate: any): string {
        if (!mongoDate) return '';
        let d: Date;

        if (typeof mongoDate === 'string') {
            d = new Date(mongoDate);
        } else if (mongoDate.$date && typeof mongoDate.$date === 'string') {
            d = new Date(mongoDate.$date);
        } else if (mongoDate.$date && mongoDate.$date.$numberLong) {
            d = new Date(parseInt(mongoDate.$date.$numberLong));
        } else {
            return '';
        }

        if (isNaN(d.getTime())) return '';

        return d.toISOString().split('T')[0];
    }

    private initForms() {
        this.identificacionForm = this.fb.group({
            // --- RAÍZ (Afiliado) ---
            categoria: ['EFE', Validators.required],
            situacion: ['ACT', Validators.required],
            clase: ['OFI', Validators.required],
            fingreso: ['', Validators.required],
            fascenso: ['', Validators.required],
            fretiro: [''],
            nresuelto: [''],
            posicion: [''],
            componente: ['', Validators.required],
            grado: ['', Validators.required],
            numerohijos: [''],
            areconocido: [''],
            mreconocido: [''],
            dreconocido: [''],
            pprof: [''],

            // --- PERSONA ---
            persona: this.fb.group({

                // Dato Básico
                datobasico: this.fb.group({
                    cedula: ['', Validators.required],
                    nombres: ['', Validators.required],
                    apellidos: ['', Validators.required],
                    fechanacimiento: ['', Validators.required],
                    sexo: ['', Validators.required],
                    estadocivil: ['', Validators.required]
                }),

                // Contacto
                correo: this.fb.group({
                    principal: ['', [Validators.email]]
                }),
                telefono: this.fb.group({
                    movil: ['']
                }),
                redsocial: this.fb.group({
                    twitter: [''],
                    facebook: [''],
                    instagram: ['']
                }),

                // Físico / Fisionómico
                datofisico: this.fb.group({
                    peso: [''],
                    talla: ['']
                }),
                datofisionomico: this.fb.group({
                    gruposanguineo: [''],
                    colorpiel: [''],
                    colorojos: [''],
                    colorcabello: ['']
                }),

                // Direccion
                direccion: this.fb.group({
                    estado: [''],
                    ciudad: [''],
                    municipio: [''],
                    calleavenida: ['', Validators.required],
                    casa: [''],
                    apartamento: ['']
                }),

                // Financiero
                datofinanciero: this.fb.group({
                    institucion: [''],
                    tipo: ['CA'],
                    cuenta: ['']
                })
            })
        });

        this.familiarForm = this.fb.group({
            cedula: ['', Validators.required],
            nombres: ['', Validators.required],
            parentesco: ['', Validators.required],
            fecha_nacimiento: ['', Validators.required]
        });

        // Listener para formateo de cuenta bancaria y detección de banco
        const cuentaControl = this.identificacionForm.get('persona.datofinanciero.cuenta');
        cuentaControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
            if (val) {
                const clean = val.replace(/\D/g, '').substring(0, 20);
                const formatted = this.applyMask(clean);
                if (val !== formatted) {
                    cuentaControl.setValue(formatted, { emitEvent: false });
                }

                // Detectar banco
                if (clean.length >= 4) {
                    const bCode = clean.substring(0, 4);
                    this.detectarBanco(bCode);
                } else {
                    this.bancoSeleccionado = null;
                }
            } else {
                this.bancoSeleccionado = null;
            }
        });
    }

    public agregarCuenta() {
        const form = this.identificacionForm.get('persona.datofinanciero');
        if (form && form.get('cuenta')?.value && form.get('institucion')?.value) {
            const nuevaCuenta = {
                institucion: form.get('institucion')?.value,
                nombreInstitucion: this.bancoSeleccionado?.name || 'OTRA',
                tipo: form.get('tipo')?.value,
                cuenta: form.get('cuenta')?.value,
                color: this.bancoSeleccionado?.color || '#64748b',
                archivo: null
            };
            this.cuentasBancarias.push(nuevaCuenta);

            // Limpiar campos para nueva entrada
            form.get('cuenta')?.setValue('');
            form.get('institucion')?.setValue('');
            this.bancoSeleccionado = null;
        }
    }

    public eliminarCuenta(index: number) {
        this.cuentasBancarias.splice(index, 1);
    }

    public adjuntarCertificado(index: number) {
        // Simulación de adjuntar archivo
        console.log('Adjuntando certificado para la cuenta:', this.cuentasBancarias[index].cuenta);
        this.cuentasBancarias[index].archivo = 'Certificado_Bancario.pdf';
    }

    private applyMask(val: string): string {
        if (!val) return '';
        let res = '';
        for (let i = 0; i < val.length; i++) {
            if (i === 4 || i === 8 || i === 10) res += '-';
            res += val[i];
        }
        return res;
    }

    private detectarBanco(code: string) {
        const banco = this.bancos.find(b => b.code === code);
        if (banco) {
            this.bancoSeleccionado = banco;
            this.identificacionForm.get('persona.datofinanciero.institucion')?.setValue(code, { emitEvent: false });
        } else {
            this.bancoSeleccionado = { code, name: 'OTRA INSTITUCIÓN', color: '#64748b' };
            this.identificacionForm.get('persona.datofinanciero.institucion')?.setValue('', { emitEvent: false });
        }
    }

    switchTab(tab: string) {
        this.currentTab = tab;
    }

    onSearchEnter(event: any) {
        if (event) event.preventDefault();
        const value = this.identificacionForm.get('persona.datobasico.cedula')?.value;
        if (!value || value.length < 3) return;

        this.isLoadingSearch = true;
        const isNumeric = /^\d+$/.test(value);
        
        if (isNumeric) {
            this.consultarPorCedula(value);
        } else {
            // Redirigir al buscador global con el texto
            sessionStorage.setItem("buscador_session", JSON.stringify({ q: value, res: [] }));
            this.router.navigate(['/principal/buscador']);
        }
    }

    consultarPorCedula(cedula: string) {
        const payload = {
            funcion: environment.funcion.CONSULTAR_IDENTIFICACION_MILITAR,
            parametros: cedula,
        };
        this.apiService.post("crud", payload).subscribe({
            next: (data: IAfiliado) => {
                this.isLoadingSearch = false;
                if (data) {
                    this.afiliadoService.setAfiliado(data);
                } else {
                    this.utilservice.AlertMini('top-end', 'error', 'No se encontró el afiliado', 2000);
                }
            },
            error: (err) => {
                this.isLoadingSearch = false;
                this.utilservice.AlertMini('top-end', 'error', 'Error en la consulta', 2000);
            }
        });
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        // Ctrl + K to focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.focusSearch();
        }

        // Alt + Left/Right for tabs
        if (event.altKey && event.key === 'ArrowRight') {
            this.moveTab(1);
        }
        if (event.altKey && event.key === 'ArrowLeft') {
            this.moveTab(-1);
        }
    }

    focusSearch() {
        if (this.cedulaInput) {
            this.cedulaInput.nativeElement.focus();
            this.cedulaInput.nativeElement.select();
        }
    }

    private moveTab(direction: number) {
        const tabs = ['militar', 'sueldo', 'antiguedad', 'banco', 'direccion', 'fisico'];
        const currentIndex = tabs.indexOf(this.currentTab);
        let nextIndex = currentIndex + direction;

        if (nextIndex >= tabs.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = tabs.length - 1;

        this.switchTab(tabs[nextIndex]);
        this.cdr.detectChanges();
    }

    guardarAfiliado() {
        if (this.identificacionForm.valid) {
            console.log('Datos del Afiliado (Modelo IAfiliado):', this.identificacionForm.value);
            // Lógica para guardar
        } else {
            console.error('Formulario inválido');
            this.identificacionForm.markAllAsTouched();
        }
    }

    imprimirDocumento(tipo: string, event: Event) {
        event.preventDefault();
        console.log('Generar documento:', tipo);

        const cedula = this.identificacionForm?.get('persona.datobasico.cedula')?.value;

        if (tipo === 'historial_movimientos') {
            // Abrir historial de movimientos en nueva pestaña
            if (cedula) {
                const url = `https://app.ipsfa.gob.ve/sssifanb/reportes/movimientos/${cedula}`;
                window.open(url, '_blank');
            }
            return;
        }

        // TODO: Implementar lógica de generación y apertura en nueva pestaña
    }

    guardarFamiliar() {
        if (this.familiarForm.valid) {
            console.log('Datos del Familiar:', this.familiarForm.value);
            // Lógica para agregar a la tabla
            this.familiarForm.reset();
        }
    }

    getGradoBadgePath(): string {
        const gradoStr = this.identificacionForm?.get('grado')?.value;
        if (!gradoStr) return '';
        let badge = String(gradoStr).toLowerCase().trim();

        // Reglas de negocio para normalizar grados a nombres de archivo
        if (badge === '1er tte') badge = 'ptte';
        badge = badge.replace(/\//g, '').replace(/\./g, '').replace(/\s+/g, '');

        return `assets/img/ipsfa/grados/${badge}.webp`;
    }

    getFotoUrl(): string {
        const cedula = this.identificacionForm?.get('persona.datobasico.cedula')?.value;
        if (cedula && cedula.toString().trim() !== '') {
            return `https://app.ipsfa.gob.ve/sssifanb/afiliacion/temp/${cedula}/foto.jpg`;
        }
        return 'assets/img/ipsfa/silueta.webp'; // Imagen de relleno por defecto si no hay cédula aún
    }

    ngOnDestroy(): void {
        this.layoutService.toggleCards(true);
        this.destroy$.next();
        this.destroy$.complete();
    }

    openModalEmitirTIM(content: any) {
        this.selectedMotivoEmision = '';
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    emitirTIM(modal: any) {
        if (!this.selectedMotivoEmision) {
            return;
        }
        console.log('Emitiendo TIM con motivo:', this.selectedMotivoEmision);
        modal.close();
    }

    openModalConfirmarGuardar(content: any) {
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    confirmarGuardado(modal: any) {
        console.log('Guardando cambios del afiliado...');
        // Aquí se llamaría al método que realmente envía el formulario
        // this.onSubmit(); 
        modal.close();
    }

    openModalConsultarNetos(content: any) {
        this.selectedNomina = '';
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    generarNeto(modal: any) {
        if (!this.selectedNomina) return;
        console.log('Generando Neto para la nómina:', this.selectedNomina);
        // Lógica de impresión/generación PDF
        modal.close();
    }

    openModalAgregarFamiliar(content: any) {
        this.selectedNacionalidadFamiliar = '';
        this.cedulaFamiliar = '';
        this.selectedParentescoFamiliar = '';
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    continuarRegistroFamiliar(modal: any) {
        if (!this.selectedNacionalidadFamiliar || !this.cedulaFamiliar || !this.selectedParentescoFamiliar) return;

        console.log('Iniciando registro de familiar:', {
            nacionalidad: this.selectedNacionalidadFamiliar,
            cedula: this.cedulaFamiliar,
            parentesco: this.selectedParentescoFamiliar
        });

        // Aquí se procedería a abrir el modal de detalles (MdlFamiliarComponent) 
        // o a cargar la data inicial para el registro completo.
        modal.close();
    }
}
