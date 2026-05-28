import { Component, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DynamicTableComponent, DynamicTableConfig } from 'src/app/shared/components/dynamic-table/dynamic-table.component';
import { PastelDatepickerComponent } from 'src/app/shared/components/pastel-datepicker/pastel-datepicker.component';
import { MailboxLayoutComponent } from 'src/app/shared/components/mailbox-layout/mailbox-layout.component';

import { ApiService } from 'src/app/core/services/api.service';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { BaseWorkflowClass } from 'src/app/shared/classes/base-workflow.class';
import { UtilService } from 'src/app/core/services/util/util.service';
import { FileService } from 'src/app/core/services/file.service';
import { ZstdCodec } from 'zstd-codec';
import { COMPONENTES_MILITARES, GRADOS_MILITARES } from 'src/app/core/models/militar/militar.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cargar-nomina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    DynamicTableComponent,
    PastelDatepickerComponent,
    MailboxLayoutComponent
  ],
  templateUrl: './cargar-nomina.component.html',
  styleUrls: ['./cargar-nomina.component.scss']
})
export class CargarNominaComponent extends BaseWorkflowClass implements OnInit {

    public componentes = COMPONENTES_MILITARES;
    public grados = GRADOS_MILITARES;

    @ViewChild('modalAprobar') modalAprobar!: TemplateRef<any>;
    @ViewChild('modalRechazar') modalRechazar!: TemplateRef<any>;
    @ViewChild('modalCSV') modalCSV!: TemplateRef<any>;
    @ViewChild('modalNuevo') modalNuevo!: TemplateRef<any>;

    public isNewView: boolean = false;
    public pasoActual: number = 1;
    public cargandoArchivos: boolean = false;
    public progresoCarga: number = 0;
    public progresoSubida: number = 0;
    public estadoSubida: string = '';
    public fileToUpload: File | null = null;
    public totalRegistros: number = 0;
    public erroresFechas: any[] = [];
    public totalErroresFechas: number = 0;
    public headerOriginal: string = '';
    public lineasCorrectas: string[] = [];
    public totalRegistrosCorrectos: number = 0;

    public searchCedula: string = '';
    public militarData: any = null;
    public selectedItem: any = null;
    private masterPendingData: any[] = [];

    // Fields for the wizard step 1
    public tipoNominaSeleccionado: string = '';
    public componenteSeleccionado: string = '';
    public fechaRegistro: string = '';
    public mostrarDetalles: boolean = false;

    // --- CONFIG: Tabla Principal (Cargar Nómina) ---
    public pendingTableConfig: DynamicTableConfig = {
        selectable: false,
        rowClickable: true,
        showPagination: true,
        pageSize: 10,
        hoverActions: true,
        tableClass: 'mailbox-table w-100 mb-0',
        containerClass: 'p-0 border-0 shadow-none',
        columns: [
            { key: 'idFormat', header: 'ID', type: 'html', align: 'left', cssClass: 'px-4 py-3 align-middle text-nowrap' },
            { key: 'componenteFormat', header: 'Comp.', type: 'html', align: 'center', cssClass: 'align-middle' },
            { key: 'origenFormat', header: 'Archivo', type: 'html', align: 'left', cssClass: 'align-middle' },
            { key: 'cantidadFormat', header: 'Procesados', type: 'html', align: 'center', cssClass: 'align-middle font-weight-700' },
            { key: 'fechaFormat', header: 'Fecha', type: 'html', align: 'center', cssClass: 'text-muted align-middle' },
            { key: 'estatusFormat', header: 'Estatus', type: 'html', align: 'center', cssClass: 'align-middle' }
        ],
        actions: [
            { name: 'procesar', icon: 'fa-cogs', tooltip: 'Procesar', buttonClass: 'btn-circular btn-success-soft shadow-sm ml-2' },
            { name: 'ver', icon: 'fa-file-alt', tooltip: 'Ver Documento', buttonClass: 'btn-circular btn-info-soft shadow-sm ml-2' }
        ]
    };

    public pendingTableData: any[] = [];

    constructor(
        protected override apiService: ApiService,
        protected override layoutService: LayoutService,
        private modalService: NgbModal,
        private utilService: UtilService,
        private fileService: FileService
    ) {
        super(apiService, layoutService, 'Principal / Componente: Cargar Nómina');
    }

    protected override onInitExtension(): void {
        this.loadMockTabs();
        this.loadPendingData();
    }

    private loadMockTabs(): void {
        this.isLoadingData = true;
        setTimeout(() => {
            this.workflowTabs = [
                { id: 'PROCESO', nombre: 'En Proceso' },
                { id: 'APROBADO', nombre: 'Aprobados' },
                { id: 'RECHAZADO', nombre: 'Rechazados' }
            ];
            this.currentTabId = 'PROCESO';
            this.isLoadingData = false;
        }, 500);
    }

    public toggleView(): void {
        this.isNewView = !this.isNewView;
        if (!this.isNewView) {
            this.searchCedula = '';
            this.militarData = null;
        }
    }

    public onMailboxSearch(term: string): void {
        if (!term) {
            this.pendingTableData = [...this.masterPendingData];
            return;
        }
        const st = term.toLowerCase();
        this.pendingTableData = this.masterPendingData.filter(item =>
            (item.id && item.id.toLowerCase().includes(st)) ||
            (item.origen && item.origen.toLowerCase().includes(st)) ||
            (item.componente && item.componente.toLowerCase().includes(st))
        );
    }

    public onMailboxTabSwitch(tabId: string): void {
        this.onTabSwitch(tabId, () => {
            this.loadPendingData();
        });
    }

    public onMailboxRefresh(): void {
        this.loadPendingData();
    }

    public onMailboxSelectAll(checked: boolean): void {
        this.allSelected = checked;
    }

    public loadPendingData(): void {
        this.isLoadingData = true;
        const payload = {
            funcion: environment.funcion.LISTAR_FIDEICOMITENTES,
            parametros: ''
        };

        this.apiService.post('crud', payload).subscribe({
            next: (data: any) => {
                this.isLoadingData = false;
                let rawData = [];
                if (Array.isArray(data)) {
                    rawData = data;
                } else if (data && data.Cuerpo) {
                    rawData = data.Cuerpo;
                } else if (data && typeof data === 'object') {
                    rawData = [data]; // En caso de que devuelva el objeto directo
                }

                const mappedData = rawData.map(item => ({
                    ...item,
                    idFormat: `
                        <div class="d-flex flex-column align-items-start">
                            <span class="text-dark font-weight-600 mb-1" style="font-size: 0.9rem;">${item.id || 'N/A'}</span>
                            <small class="text-muted text-truncate" style="font-size: 0.75rem; max-width: 150px;" title="${item.responsable || 'SISTEMA'}">
                                <i class="fas fa-user-shield mr-1 text-primary-teal"></i>${item.responsable || 'SISTEMA'}
                            </small>
                        </div>
                    `,
                    componenteFormat: this.getComponentBadge(item.componente || 'N/A'),
                    origenFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;"><i class="fas fa-file-csv text-muted mr-1"></i>${item.origen || ''}</span>`,
                    cantidadFormat: `<span class="text-dark font-weight-600" style="font-size: 0.9rem;">${item.procesados || 0}</span>`,
                    fechaFormat: this.formatFechaRelativa(item.fecha),
                    estatusFormat: this.getStatusBadge(item.estatus || 'PENDIENTE')
                }));

                this.masterPendingData = [...mappedData];
                this.pendingTableData = [...mappedData];
            },
            error: (err) => {
                this.isLoadingData = false;
                console.error('Error al cargar datos:', err);
                this.masterPendingData = [];
                this.pendingTableData = [];
            }
        });
    }

    private formatFechaRelativa(fechaString: string): string {
        if (!fechaString) return '';
        const date = new Date(fechaString);
        if (isNaN(date.getTime())) return fechaString;

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const absoluteStr = `${day}/${month}/${year} ${hours}:${minutes}`;

        const diffMs = new Date().getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        let relativeStr = '';
        if (diffHrs > 24) {
            const days = Math.floor(diffHrs / 24);
            relativeStr = `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else if (diffHrs > 0) {
            relativeStr = `Hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
        } else if (diffMins > 0) {
            relativeStr = `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;
        } else {
            relativeStr = 'Hace un momento';
        }

        return `
            <div class="d-flex flex-column align-items-center">
                <span class="text-dark font-weight-600 mb-1" style="font-size: 0.9rem;">${absoluteStr}</span>
                <small class="text-muted" style="font-size: 0.75rem;"><i class="fas fa-clock mr-1"></i>${relativeStr}</small>
            </div>
        `;
    }

    public triggerFileSelect(input: HTMLInputElement): void {
        if (this.cargandoArchivos) return;
        input.click();
    }

    public onFileChange(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.utilService.AlertMini('top-end', 'error', 'El archivo supera los 10MB permitidos', 3000);
            return;
        }

        // Validar extensión
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'csv') {
            this.utilService.AlertMini('top-end', 'error', 'Solo se permiten archivos CSV', 3000);
            return;
        }

        this.fileToUpload = file;
        this.validarYProcesarCSV(file);
    }

    private validarYProcesarCSV(file: File): void {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/);
            if (lines.length <= 1) {
                this.utilService.AlertMini('top-end', 'error', 'Archivo sin datos', 2000);
                return;
            }

            const header = lines[0].toLowerCase();
            this.headerOriginal = lines[0];
            const delimiter = header.includes(';') ? ';' : ',';
            const columns = header.split(delimiter).map((c: string) => c.trim());

            const required = ['cedula', 'grado', 'n_hijos', 'fecha_ingreso', 'f_ult_ascenso', 'st_profesion', 'anio_reconocido', 'mes_reconocido', 'dia_reconocido'];
            const missing = required.filter(col => !columns.includes(col));

            if (missing.length > 0) {
                this.utilService.AlertMini('top-end', 'error', `Columnas faltantes: ${missing.join(', ')}`, 4000);
                return;
            }

            this.analizarFechasCSV(lines, delimiter, columns);

            this.totalRegistros = lines.filter(l => l.trim() !== '').length - 1;
            this.simularCarga();
        };
        reader.readAsText(file);
    }

    private simularCarga(): void {
        this.cargandoArchivos = true;
        this.progresoCarga = 0;

        const interval = setInterval(() => {
            this.progresoCarga += Math.floor(Math.random() * 15) + 5;
            if (this.progresoCarga >= 100) {
                this.progresoCarga = 100;
                clearInterval(interval);
                setTimeout(() => {
                    this.cargandoArchivos = false;
                    this.pasoActual = 3; // Paso de éxito
                }, 800);
            }
        }, 200);
    }

    public procesarFinal(): void {
        const reporteData = {
            procesados: this.totalRegistros,
            correctos: this.totalRegistrosCorrectos,
            errores: this.totalErroresFechas,
            responsable: "Usuario Actual", 
            fecha: new Date().toISOString(),
            login: "usuario_login",
            lineasCorrectas: this.lineasCorrectas,
            lineasErrores: this.erroresFechas,
            headerOriginal: this.headerOriginal,
            tipoNomina: this.tipoNominaSeleccionado,
            componente: this.componenteSeleccionado,
            fechaRegistro: this.fechaRegistro
        };
        
        const jsonStr = JSON.stringify(reporteData);
        const textEncoder = new TextEncoder();
        const bytes = textEncoder.encode(jsonStr);

        // Simulando estado de carga
        this.cargandoArchivos = true;

        ZstdCodec.run((zstd: any) => {
            try {
                const simple = new zstd.Simple();
                const compressed = simple.compress(bytes);
                
                // IMPORTANTE: El array devuelto por zstd-codec es una vista de la memoria WASM.
                // Intentar pasarlo directo a un Blob causa un "DataCloneError".
                // Debemos copiarlo a un Uint8Array de Javascript normal.
                const safeArray = new Uint8Array(compressed);
                
                // Crear el archivo ZST
                const blob = new Blob([safeArray], { type: 'application/zstd' });
                const file = new File([blob], 'reporte_nomina.zst', { type: 'application/zstd' });
                
                const formData = new FormData();
                formData.append('archivos', file);
                formData.append('identificador', 'NOM-CargarNomina');
                formData.append('return', 'true');
                
                // Endpoint (FileService ya le agrega environment.API)
                const endpoint = 'subirarchivos';
                
                this.fileService.uploadWithProgress(endpoint, formData).subscribe({
                    next: (event: any) => {
                        if (event.state === 'LOADING') {
                            this.progresoSubida = event.progress;
                            this.estadoSubida = `Enviando archivo... ${event.progress}%`;
                        } else if (event.state === 'DONE') {
                            this.cargandoArchivos = false;
                            this.progresoSubida = 100;
                            this.estadoSubida = '¡Completado!';
                            this.utilService.AlertMini('top-end', 'success', 'Nómina enviada y procesada con éxito', 2500);
                            this.modalService.dismissAll();
                            this.loadPendingData();
                            
                            this.registrarNominaColeccion(event.body);
                        }
                    },
                    error: (error: any) => {
                        console.error('Error uploading file:', error);
                        this.cargandoArchivos = false;
                        this.utilService.AlertMini('top-end', 'error', 'Hubo un error al enviar la nómina', 3000);
                    }
                });
            } catch (err) {
                console.error('Error during ZST compression:', err);
                this.cargandoArchivos = false;
                this.utilService.AlertMini('top-end', 'error', 'Error al comprimir el archivo ZST', 3000);
            }
        });
    }

    private registrarNominaColeccion(uploadEventBody: any): void {
        const endpoint = 'ccoleccion';
        
        // Se asegura un id para la cláusula 'donde'. Si la respuesta del servidor no tiene ID, se usa uno generado.
        const idRegistro = uploadEventBody?.id || `NOM-${new Date().getTime()}`;
        
        // Calculamos la taza como el porcentaje de OKs vs Total Procesado (evitando división por cero)
        const tazaCalculada = this.totalRegistros > 0 
            ? Math.round((this.totalRegistrosCorrectos / this.totalRegistros) * 100) 
            : 0;

        // Extendemos el body recibido con los nuevos atributos solicitados
        const objetoExtendido = {
            ...(uploadEventBody || {}),
            estatus: 'PENDIENTE',
            procesados: this.totalRegistros,
            errores: this.totalErroresFechas,
            ok: this.totalRegistrosCorrectos,
            taza: tazaCalculada,
            origen: this.fileToUpload?.name || 'Archivo Desconocido',
            componente: this.componenteSeleccionado || 'Desconocido'
        };
        
        const body = {
            "coleccion": "file-cargarnomina",
            "objeto": objetoExtendido,
            "donde": `{\"id\":\"${idRegistro}\"}`,
            "driver": "MGDBA",
            "upsert": true
        };
        
        this.apiService.post(endpoint, body).subscribe({
            next: (resp) => {
                console.log('[Cargar Nómina] Nómina cargada con éxito:', resp);
            },
            error: (err) => {
                console.error('[Cargar Nómina] Error al registrar en ccoleccion:', err);
                this.utilService.AlertMini('top-end', 'error', 'Error al procesar la colección', 3000);
            }
        });
    }

    public buscarExpediente(): void {
        if (!this.searchCedula) return;
        this.militarData = {
            cedula: this.searchCedula,
            nombres: 'GUSTAVO ADOLFO RIVAS TOVAR',
            componente: 'GUARDIA NACIONAL BOLIVARIANA',
            grado: 'CORONEL',
            situacion: 'ACTIVO'
        };
    }

    public mostrarConfirmacionCSV(): void {
        this.modalService.open(this.modalCSV, { centered: true, size: 'md', windowClass: 'pastel-modal' });
    }

    public confirmarCSV(): void {
        this.downloadCSV(this.pendingTableData, 'nomina.csv');
        this.modalService.dismissAll();
    }

    public onPendingTableAction(event: any): void {
        this.selectedItem = event.row;
        if (event.actionName === 'procesar') {
            this.modalService.open(this.modalAprobar, { centered: true, size: 'md', windowClass: 'pastel-modal' });
        } else if (event.actionName === 'ver') {
            alert(`Ver documento de ${event.row.id}`);
        }
    }

    public confirmarAprobacion(): void {
        alert(`Registro ${this.selectedItem?.id} aprobado.`);
        this.modalService.dismissAll();
    }

    public confirmarRechazo(): void {
        alert(`Registro ${this.selectedItem?.id} rechazado.`);
        this.modalService.dismissAll();
    }

    public nuevoFideicomitente(): void {
        this.pasoActual = 1;
        this.tipoNominaSeleccionado = '';
        this.componenteSeleccionado = '';
        this.fechaRegistro = '';
        this.mostrarDetalles = false;
        this.fileToUpload = null;
        this.cargandoArchivos = false;
        this.progresoCarga = 0;
        this.progresoSubida = 0;
        this.estadoSubida = '';
        this.erroresFechas = [];
        this.totalErroresFechas = 0;
        this.lineasCorrectas = [];
        this.totalRegistrosCorrectos = 0;
        this.totalRegistros = 0;
        this.modalService.open(this.modalNuevo, { centered: true, size: 'lg', windowClass: 'pastel-modal' });
    }

    public siguientePaso(): void {
        if (!this.tipoNominaSeleccionado || !this.componenteSeleccionado || !this.fechaRegistro) {
            this.utilService.AlertMini('top-end', 'error', 'El tipo de nómina, componente y fecha son obligatorios', 3000);
            return;
        }
        this.pasoActual = 2;
    }

    public procesarNuevo(): void {
        alert('Registro creado con éxito.');
        this.modalService.dismissAll();
    }

    public descargarErroresCSV(): void {
        if (this.erroresFechas.length === 0) return;
        
        const dataToExport = this.erroresFechas.map(err => ({
            'Linea': err.linea,
            'Cedula': err.cedula,
            'Columna': err.columna,
            'Valor_Errado': err.valor,
            'Detalle_Error': err.detalle
        }));

        this.downloadCSV(dataToExport, 'SSS001-ERR.csv');
    }

    public descargarCorrectosCSV(): void {
        if (this.lineasCorrectas.length === 0) return;
        
        const csvContent = this.headerOriginal + '\n' + this.lineasCorrectas.join('\n');
        const csvBase64 = btoa(unescape(encodeURIComponent("\ufeff" + csvContent)));
        const csvDataUri = `data:text/csv;base64,${csvBase64}`;
        const filename = 'SSS001-OK.csv';

        if (window.parent && window !== window.parent) {
            window.parent.postMessage({
                type: 'OPEN_CSV',
                payload: {
                    fileName: filename,
                    data: csvDataUri
                }
            }, '*');
        } else {
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    private analizarFechasCSV(lines: string[], delimiter: string, columns: string[]): void {
        this.erroresFechas = [];
        this.lineasCorrectas = [];
        const cedulaIndex = columns.indexOf('cedula');
        
        // Identify all date columns
        const dateColumnIndexes: number[] = [];
        columns.forEach((col, idx) => {
            if (this.isDateColumn(col)) {
                dateColumnIndexes.push(idx);
            }
        });

        // First pass: count occurrences of each cedula to find duplicates
        const cedulaOccurrences = new Map<string, number[]>();
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cells = this.parseCSVLine(line, delimiter);
            const cedula = cedulaIndex !== -1 && cells[cedulaIndex] ? cells[cedulaIndex].trim() : 'N/A';
            if (cedula && cedula !== 'N/A') {
                if (!cedulaOccurrences.has(cedula)) {
                    cedulaOccurrences.set(cedula, []);
                }
                cedulaOccurrences.get(cedula)!.push(i);
            }
        }

        // Loop through each line (excluding header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cells = this.parseCSVLine(line, delimiter);
            const cedula = cedulaIndex !== -1 && cells[cedulaIndex] ? cells[cedulaIndex].trim() : 'N/A';
            const isDuplicate = cedula && cedula !== 'N/A' && (cedulaOccurrences.get(cedula)?.length || 0) > 1;
            let hasError = false;
            
            // Check all identified date columns for this row
            dateColumnIndexes.forEach(colIdx => {
                const value = cells[colIdx] ? cells[colIdx].trim() : '';
                if (!this.isValidDateDDMMYYYY(value)) {
                    hasError = true;
                    this.erroresFechas.push({
                        linea: i + 1, // Line number (header is line 1, first data is line 2)
                        cedula: cedula,
                        columna: columns[colIdx],
                        valor: value || '[Vacío]',
                        detalle: 'Formato incorrecto. Se espera DD/MM/YYYY'
                    });
                }
            });

            if (isDuplicate) {
                hasError = true;
                this.erroresFechas.push({
                    linea: i + 1,
                    cedula: cedula,
                    columna: 'cedula',
                    valor: cedula,
                    detalle: 'Cédula duplicada en el archivo'
                });
            }

            if (!hasError) {
                this.lineasCorrectas.push(lines[i]);
            }
        }
        this.totalErroresFechas = this.erroresFechas.length;
        this.totalRegistrosCorrectos = this.lineasCorrectas.length;
    }

    private isDateColumn(colName: string): boolean {
        const name = colName.toLowerCase();
        return name.includes('fecha') || name.startsWith('f_') || name.includes('date');
    }

    private isValidDateDDMMYYYY(value: string): boolean {
        if (!value) return false;
        // Check regex format DD/MM/YYYY
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(value)) return false;
        
        const parts = value.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        if (year < 1900 || year > 2100) return false;

        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
            daysInMonth[1] = 29;
        }
        return day <= daysInMonth[month - 1];
    }

    private parseCSVLine(line: string, delimiter: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    private downloadCSV(data: any[], filename: string) {
        if (data.length === 0) return;
        const separator = ';';
        const keys = Object.keys(data[0]);
        const csvContent =
            keys.join(separator) +
            '\n' +
            data.map(row => {
                return keys.map(k => {
                    let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                    cell = cell.toString().replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            }).join('\n');

        // Adaptación para Sandra Sandbox Bridge
        const csvBase64 = btoa(unescape(encodeURIComponent("\ufeff" + csvContent)));
        const csvDataUri = `data:text/csv;base64,${csvBase64}`;

        if (window.parent && window !== window.parent) {
            window.parent.postMessage({
                type: 'OPEN_CSV',
                payload: {
                    fileName: filename,
                    data: csvDataUri
                }
            }, '*');
        } else {
            // Fallback para cuando no corre dentro de Sandra
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    private getComponentBadge(comp: string): string {
        const colors: any = {
            'EJ': 'text-danger', 'EJB': 'text-danger',
            'AR': 'text-info', 'ARB': 'text-info',
            'AV': 'text-primary', 'AMB': 'text-primary',
            'GN': 'text-success', 'GNB': 'text-success'
        };
        const colorClass = colors[comp] || 'text-muted';
        return `<span class="font-weight-600 ${colorClass}" style="font-size: 0.9rem;"><i class="fas fa-circle mr-1" style="font-size: 0.4rem; vertical-align: middle; margin-bottom: 2px;"></i>${comp}</span>`;
    }

    private getStatusBadge(estatus: string): string {
        let icon = 'fa-clock';
        let colorClass = 'text-warning';
        
        switch (estatus) {
            case 'APROBADO':
            case 'PROCESADO':
                icon = 'fa-check-circle';
                colorClass = 'text-success';
                break;
            case 'RECHAZADA':
            case 'ERROR':
                icon = 'fa-times-circle';
                colorClass = 'text-danger';
                break;
            case 'PENDIENTE':
            case 'EN PROCESO':
            default:
                icon = 'fa-clock';
                colorClass = 'text-warning';
                break;
        }
        
        return `<span class="font-weight-600 ${colorClass}" style="font-size: 0.9rem;"><i class="fas ${icon} mr-1"></i>${estatus}</span>`;
    }
}
