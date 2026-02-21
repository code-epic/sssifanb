import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';
import { IAfiliado } from 'src/app/core/models/afiliacion/afiliado.model';
import { MdlFamiliarComponent } from './mdl-familiar/mdl-familiar.component';

@Component({
    selector: 'app-afi-identificacion',
    templateUrl: './identificacion.component.html',
    styleUrls: ['./identificacion.component.scss']
})
export class IdentificacionComponent implements OnInit, OnDestroy {

    public identificacionForm: FormGroup;
    public familiares: any[] = []; // Lista para la tabla
    public familiarForm: FormGroup;
    public currentTab: string = 'militar';
    public moneda: string = 'Bs.';

    // Var to control the pastel printing dropdown menu visibility
    public showPrintDropdown: boolean = false;

    constructor(
        private layoutService: LayoutService,
        private fb: FormBuilder,
        private afiliadoService: AfiliadoService,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal
    ) { }

    @HostListener('document:click', ['$event'])
    closePrintDropdown(event: MouseEvent) {
        // Find if target is the print dropdown button
        const targetElement = event.target as HTMLElement;
        if (!targetElement.closest('#printDocsDropdown')) {
            this.showPrintDropdown = false;
        }
    }

    ngOnInit(): void {
        this.layoutService.triggerScrollToTop();

        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Identificación Militar',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: true
        });

        this.initForms();

        this.afiliadoService.afiliado$.subscribe((data: any) => {
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
        return 'assets/img/theme/team-4-800x800.jpg'; // Imagen de relleno por defecto si no hay cédula aún
    }

    ngOnDestroy(): void {
        this.layoutService.toggleCards(true);
    }
}
