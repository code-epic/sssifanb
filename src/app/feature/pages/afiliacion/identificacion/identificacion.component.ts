import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';
import { IAfiliado } from 'src/app/core/models/afiliacion/afiliado.model';
import { MdlFamiliarComponent } from './mdl-familiar/mdl-familiar.component';
import { LoginService } from 'src/app/core/services/login/login.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { COMPONENTES_MILITARES, GRADOS_MILITARES } from 'src/app/core/models/militar/militar.model';

@Component({
    selector: 'app-afi-identificacion',
    templateUrl: './identificacion.component.html',
    styleUrls: ['./identificacion.component.scss']
})
export class IdentificacionComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    public componentes = COMPONENTES_MILITARES;
    public grados = GRADOS_MILITARES;

    public identificacionForm: FormGroup;
    public familiares: any[] = []; // Lista para la tabla
    public familiarForm: FormGroup;
    public asignacionForm: FormGroup;
    public currentTab: string = 'militar';
    public moneda: string = 'Bs.';
    public fechaVencimientoTIM: string = '';

    // Var to control the pastel printing dropdown menu visibility
    public showPrintDropdown: boolean = false;

    public selectedMotivoEmision: string = '';
    public selectedNomina: string = '';

    // Add Family Member Modal Data
    public selectedNacionalidadFamiliar: string = '';
    public cedulaFamiliar: string = '';
    public selectedParentescoFamiliar: string = '';

    // Historial Movimientos Data
    public tipoMovimientoFiltro: string = '';
    public movimientosOriginales: any[] = [];
    public movimientosFiltrados: any[] = [];
    public movimientosPaginados: any[] = [];
    public paginaActual: number = 1;
    public itemsPorPagina: number = 5;
    public totalMovimientos: number = 0;
    public totalPaginas: number = 0;

    // Historial Sueldos Data
    public sueldosOriginales: any[] = [];
    public sueldosPaginados: any[] = [];
    public paginaSueldoActual: number = 1;
    public sueldosPorPagina: number = 5;
    public totalSueldos: number = 0;
    public totalPaginasSueldo: number = 0;

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
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private afiliadoService: AfiliadoService,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal,
        private loginService: LoginService
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
            alertSeverity: 2,
            showAlertsIcon: false
        });


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

        this.asignacionForm = this.fb.group({
            comisionServicio: ['', [Validators.required, Validators.min(0)]],
            montoRecuperado: ['', [Validators.required, Validators.min(0)]],
            fecha: ['', Validators.required],
            descripcion: ['', Validators.required]
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

    // Modal Historial de Movimientos
    openModalHistorialMovimientos(content: any, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.showPrintDropdown = false; // Close the dropdown if open

        this.tipoMovimientoFiltro = '';
        this.paginaActual = 1;
        this.generarMovimientosMock(); // Para demostración (o cargar desde servicio)
        this.filtrarMovimientos();

        this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    }

    private generarMovimientosMock() {
        this.movimientosOriginales = [];
        const tipos = ['INGRESO', 'EGRESO', 'AJUSTE'];
        const descripcionesIngreso = ['Abono de Nómina', 'Bono Vacacional', 'Aguinaldos', 'Retroactivo'];
        const descripcionesEgreso = ['Descuento Préstamo', 'Retención ISRL', 'Pago Seguro', 'Cargo Administrativo'];
        const descripcionesAjuste = ['Ajuste Salarial', 'Corrección de Saldo', 'Reintegro'];
        
        const now = new Date();
        
        // Generar 35 movimientos aleatorios
        for (let i = 0; i < 35; i++) {
            const tipo = tipos[Math.floor(Math.random() * tipos.length)];
            let desc = '';
            let monto = 0;
            
            if (tipo === 'INGRESO') {
                desc = descripcionesIngreso[Math.floor(Math.random() * descripcionesIngreso.length)];
                monto = Math.random() * 5000 + 500;
            } else if (tipo === 'EGRESO') {
                desc = descripcionesEgreso[Math.floor(Math.random() * descripcionesEgreso.length)];
                monto = -(Math.random() * 1000 + 100);
            } else {
                desc = descripcionesAjuste[Math.floor(Math.random() * descripcionesAjuste.length)];
                monto = (Math.random() * 1000) - 500;
            }
            
            // Random date within the last 6 months
            const fecha = new Date(now.getTime() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
            
            this.movimientosOriginales.push({
                fecha: fecha,
                tipo: tipo,
                descripcion: desc,
                monto: monto
            });
        }
    }

    filtrarMovimientos() {
        if (this.tipoMovimientoFiltro) {
            this.movimientosFiltrados = this.movimientosOriginales.filter(m => m.tipo === this.tipoMovimientoFiltro);
        } else {
            this.movimientosFiltrados = [...this.movimientosOriginales];
        }

        // Ordenar por fecha (Mayor a menor - más recientes primero)
        this.movimientosFiltrados.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        this.totalMovimientos = this.movimientosFiltrados.length;
        this.totalPaginas = Math.ceil(this.totalMovimientos / this.itemsPorPagina);
        
        // Reset a la pagina 1 si la pagina actual excede el total tras filtrar
        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
            this.paginaActual = 1;
        } else if (this.totalPaginas === 0) {
            this.paginaActual = 1;
        }

        this.actualizarPaginacion();
    }

    actualizarPaginacion() {
        const startIndex = (this.paginaActual - 1) * this.itemsPorPagina;
        const endIndex = startIndex + this.itemsPorPagina;
        this.movimientosPaginados = this.movimientosFiltrados.slice(startIndex, endIndex);
    }

    cambiarPagina(page: number) {
        if (page >= 1 && page <= this.totalPaginas) {
            this.paginaActual = page;
            this.actualizarPaginacion();
        }
    }

    getPaginas(): number[] {
        const pages: number[] = [];
        // Lógica simple para mostrar hasta 5 páginas cercanas
        let startPage = Math.max(1, this.paginaActual - 2);
        let endPage = Math.min(this.totalPaginas, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }

    openModalAgregarAsignacion(content: any, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.asignacionForm.reset();
        this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static' });
    }

    guardarAsignacion(modal: any) {
        if (this.asignacionForm.valid) {
            console.log('Asignación guardada:', this.asignacionForm.value);
            // Lógica para guardar aquí
            modal.close();
        } else {
            this.asignacionForm.markAllAsTouched();
        }
    }

    openModalHistorialSueldo(content: any, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.generarSueldosMock();
        this.actualizarPaginacionSueldos();
        this.modalService.open(content, { centered: true, size: 'lg', scrollable: true, backdrop: 'static' });
    }

    generarSueldosMock() {
        this.sueldosOriginales = [
            { fecha: new Date('2024-05-01T10:00:00'), sueldoBase: 1500, sueldoMensual: 2500 },
            { fecha: new Date('2024-04-01T10:00:00'), sueldoBase: 1500, sueldoMensual: 2500 },
            { fecha: new Date('2024-03-01T10:00:00'), sueldoBase: 1400, sueldoMensual: 2350 },
            { fecha: new Date('2024-02-01T10:00:00'), sueldoBase: 1400, sueldoMensual: 2350 },
            { fecha: new Date('2024-01-01T10:00:00'), sueldoBase: 1300, sueldoMensual: 2200 },
            { fecha: new Date('2023-12-01T10:00:00'), sueldoBase: 1300, sueldoMensual: 2200 },
            { fecha: new Date('2023-11-01T10:00:00'), sueldoBase: 1200, sueldoMensual: 2000 }
        ];
    }

    actualizarPaginacionSueldos() {
        this.totalSueldos = this.sueldosOriginales.length;
        this.totalPaginasSueldo = Math.ceil(this.totalSueldos / this.sueldosPorPagina);
        const inicio = (this.paginaSueldoActual - 1) * this.sueldosPorPagina;
        const fin = inicio + this.sueldosPorPagina;
        this.sueldosPaginados = this.sueldosOriginales.slice(inicio, fin);
    }

    cambiarPaginaSueldo(page: number) {
        if (page >= 1 && page <= this.totalPaginasSueldo) {
            this.paginaSueldoActual = page;
            this.actualizarPaginacionSueldos();
        }
    }

    getPaginasSueldo(): number[] {
        const pages: number[] = [];
        let startPage = Math.max(1, this.paginaSueldoActual - 2);
        let endPage = Math.min(this.totalPaginasSueldo, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }
}
