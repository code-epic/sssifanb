import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as Chart from 'chart.js';
import { LayoutService } from 'src/app/core/services/layout/layout.service';

interface ISegmentacion {
    situacion: string;
    total: number;
}

interface IEstadisticaData {
    _id: string;
    segmentacion: ISegmentacion[];
    total_componente?: number; // Optional as key varies
    total_grado?: number;     // Optional
}

@Component({
    selector: 'app-afi-reportes',
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, AfterViewInit {

    @ViewChild('graficoModal') modalContent: any;
    public loading = false;
    public chartTitle: string = '';
    public chart: any;

    // Data Containers
    public estadisticasGrado: any[] = [];
    public estadisticasComponente: any[] = [];
    public estadisticasSituacion: any[] = [];
    public totalGeneral: number = 0;

    public showGlobalSituacion: boolean = false;

    public resumenComponentes: any[] = [
        { sigla: 'EJ', nombre: 'EJÉRCITO', activos: 0, reserva: 0, image: 'assets/img/componentes/EJ.webp' },
        { sigla: 'AR', nombre: 'ARMADA', activos: 0, reserva: 0, image: 'assets/img/componentes/AR.webp' },
        { sigla: 'AV', nombre: 'AVIACIÓN', activos: 0, reserva: 0, image: 'assets/img/componentes/AV.webp' },
        { sigla: 'GN', nombre: 'GUARDIA NACIONAL', activos: 0, reserva: 0, image: 'assets/img/componentes/GN.webp' },
    ];

    constructor(
        private apiService: ApiService,
        private layoutService: LayoutService,
        private modalService: NgbModal) {

    }

    ngOnInit(): void {
        this.layoutService.toggleCards(false);
        this.layoutService.updateHeader({
            title: 'Principal / Afiliación: Reportes',
            showBackButton: true,
            alertSeverity: 1,
            showAlertsIcon: false
        });
    }

    ngAfterViewInit() {
        this.loadStatistics();
    }

    loadStatistics() {
        this.loading = true;
        const payload = {
            "funcion": "IPSFA_CEstadisticasSituacion",
            "parametros": ''
        };

        this.apiService.post('crud', payload).subscribe({
            next: (data: any[]) => {
                this.loading = false;
                if (data && data.length > 0) {
                    const stats = data[0];
                    this.estadisticasComponente = stats.estadisticas_componente || [];
                    this.estadisticasGrado = stats.estadisticas_grado || [];

                    // 1. Compute Global Situacion from Components
                    this.processGlobalSituacion();

                    // 2. Compute Header Cards (Activos/Reserva)
                    this.updateResumenComponentes();

                    if (stats.total_general && stats.total_general.length > 0) {
                        this.totalGeneral = stats.total_general[0].total;
                    }
                }
            },
            error: (err) => {
                console.error("Error loading stats", err);
                this.loading = false;
            }
        });
    }

    processGlobalSituacion() {
        const map = new Map<string, number>();

        this.estadisticasComponente.forEach(comp => {
            if (comp.segmentacion) {
                comp.segmentacion.forEach((seg: any) => {
                    const key = seg.situacion || 'POR DEFINIR';
                    const current = map.get(key) || 0;
                    map.set(key, current + seg.total);
                });
            }
        });

        this.estadisticasSituacion = Array.from(map.entries())
            .map(([key, val]) => ({ _id: key, cantidad: val }))
            .sort((a, b) => b.cantidad - a.cantidad);
    }

    updateResumenComponentes() {
        this.resumenComponentes.forEach(card => {
            // Filter numeric matching based on Sigla
            const matches = this.estadisticasComponente.filter(c => {
                const name = c._id ? c._id.toUpperCase() : '';
                if (card.sigla === 'EJ') return name.includes('EJERCITO') || name.includes('EJÉRCITO');
                if (card.sigla === 'AR') return name.includes('ARMADA');
                if (card.sigla === 'AV') return name.includes('AVIACION') || name.includes('AVIACIÓN');
                if (card.sigla === 'GN') return name.includes('GUARDIA');
                return false;
            });

            let act = 0;
            let res = 0;

            matches.forEach(m => {
                if (m.segmentacion) {
                    m.segmentacion.forEach((s: any) => {
                        if (s.situacion === 'ACT') act += s.total;
                        if (['RCP', 'RSP'].includes(s.situacion)) res += s.total;
                    });
                }
            });

            card.activos = act;
            card.reserva = res;
        });
    }

    exportData(type: string) {
        let dataToExport: any[] = [];
        let filename = `reporte_${type}_${new Date().getTime()}.csv`;

        switch (type) {
            case 'componente':
                // Flatten nested structure for export? Or just summary? Summary is safer.
                dataToExport = this.estadisticasComponente.map(x => ({
                    Componente: x._id,
                    Total: x.total_componente
                }));
                break;
            case 'situacion':
                dataToExport = this.estadisticasSituacion.map(x => ({
                    Situacion: x._id,
                    Cantidad: x.cantidad
                }));
                break;
            case 'grado':
                dataToExport = this.estadisticasGrado.map(x => ({
                    Grado: x._id,
                    Total: x.total_grado
                }));
                break;
        }

        this.downloadCSV(dataToExport, filename);
    }

    downloadCSV(data: any[], filename: string) {
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

    public chartFilter: 'activos' | 'reserva' | 'total' = 'activos';
    public currentType: string = '';

    updateChartFilter(filter: 'activos' | 'reserva' | 'total') {
        if (this.chartFilter === filter) return;
        this.chartFilter = filter;
        this.generateChart(this.currentType);
    }

    openChart(type: string) {
        let title = '';
        this.currentType = type;
        this.chartFilter = 'activos'; // Reset default focus

        if (type === 'componente') title = 'POR COMPONENTE';
        if (type === 'situacion') title = 'POR SITUACIÓN GLOBAL';
        if (type === 'grado') title = 'POR GRADO / JERARQUÍA';

        this.chartTitle = title;

        // Open Modal
        this.modalService.open(this.modalContent, { size: 'lg', centered: true }).result.then(() => {
            // Closed
        }, () => { });

        // Wait for modal to render content then draw chart
        setTimeout(() => {
            this.generateChart(type);
        }, 300);
    }

    abbreviateLabel(label: string): string {
        const map: { [key: string]: string } = {
            'EJERCITO': 'EJ', 'ARMADA': 'AR', 'AVIACION': 'AV', 'GUARDIA NACIONAL': 'GN',
            'GENERAL EN JEFE': 'G/J', 'ALMIRANTE EN JEFE': 'A/J',
            'MAYOR GENERAL': 'M/G', 'ALMIRANTE': 'ALM',
            'GENERAL DE DIVISION': 'G/D', 'VICEALMIRANTE': 'V/A',
            'GENERAL DE BRIGADA': 'G/B', 'CONTRALMIRANTE': 'C/A',
            'CORONEL': 'CNEL', 'CAPITAN DE NAVIO': 'C/N',
            'TENIENTE CORONEL': 'T/C', 'CAPITAN DE FRAGATA': 'C/F',
            'MAYOR': 'MAY', 'CAPITAN DE CORBETA': 'C/C',
            'CAPITAN': 'CAP', 'TENIENTE DE NAVIO': 'T/N',
            'PRIMER TENIENTE': '1TTE', 'TENIENTE DE FRAGATA': 'T/F',
            'TENIENTE': 'TTE', 'ALFEREZ DE NAVIO': 'A/N',
            'SARGENTO SUPERVISOR': 'SS', 'SARGENTO AYUDANTE': 'SA',
            'SARGENTO MAYOR DE PRIMERA': 'SM1', 'SARGENTO MAYOR DE SEGUNDA': 'SM2',
            'SARGENTO MAYOR DE TERCERA': 'SM3', 'SARGENTO PRIMERO': 'S1', 'SARGENTO SEGUNDO': 'S2'
        };

        const upper = (label || '').toUpperCase();
        if (map[upper]) return map[upper];

        return label.length > 20 ? label.substring(0, 18) + '..' : label;
    }

    generateChart(type: string) {
        const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
        if (!ctx) return;

        // Destroy old chart if exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Global Font - Nunito
        Chart.defaults.global.defaultFontFamily = 'Nunito, sans-serif';
        Chart.defaults.global.defaultFontSize = 12;

        let labels: string[] = [];
        let data: number[] = [];
        let bgColors: string[] = [];
        let chartType = 'bar';

        // Refined Palette (Vibrant Pastel)
        const palette = [
            '#5e72e4', '#2dce89', '#11cdef', '#fb6340', '#f5365c',
            '#8965e0', '#ffd600', '#f3a4b5', '#2bffc6', '#32325d'
        ];

        const getCount = (item: any) => {
            if (this.chartFilter === 'total') {
                return (type === 'componente' ? item.total_componente : item.total_grado) || 0;
            } else if (this.chartFilter === 'reserva') {
                if (!item.segmentacion) return 0;
                return item.segmentacion
                    .filter((s: any) => ['RCP', 'RSP'].includes(s.situacion))
                    .reduce((acc: number, val: any) => acc + val.total, 0);
            } else {
                if (!item.segmentacion) return 0;
                return item.segmentacion
                    .filter((s: any) => s.situacion === 'ACT')
                    .reduce((acc: number, val: any) => acc + val.total, 0);
            }
        };

        if (type === 'componente') {
            this.estadisticasComponente.forEach((item, index) => {
                labels.push(this.abbreviateLabel(item._id));
                data.push(getCount(item));
                bgColors.push(palette[index % palette.length]);
            });
            chartType = 'bar';
        } else if (type === 'situacion') {
            this.estadisticasSituacion.forEach((item, index) => {
                labels.push(item._id);
                data.push(item.cantidad);
                bgColors.push(palette[index % palette.length]);
            });
            chartType = 'doughnut';
        } else if (type === 'grado') {
            // Filter and Sort
            let items = this.estadisticasGrado.map(x => ({
                _id: x._id,
                count: getCount(x)
            }));
            items.sort((a, b) => b.count - a.count);
            items = items.slice(0, 15);

            items.forEach((item, index) => {
                labels.push(this.abbreviateLabel(item._id));
                data.push(item.count);
                bgColors.push(palette[index % palette.length]);
            });
            chartType = 'horizontalBar';
        }

        this.chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: this.chartFilter === 'activos' ? 'Personal Activo' : (this.chartFilter === 'reserva' ? 'Personal en Reserva' : 'Total Afiliados'),
                    data: data,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1000, easing: 'easeOutQuart' },
                legend: {
                    display: type === 'situacion',
                    position: 'bottom',
                    labels: { fontColor: '#525f7f', usePointStyle: true, padding: 20 }
                },
                tooltips: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleFontColor: '#32325d',
                    bodyFontColor: '#525f7f',
                    borderColor: 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    xPadding: 15, yPadding: 15,
                    displayColors: true,
                    callbacks: {
                        label: function (tooltipItem: any, data: any) {
                            const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return ' ' + new Intl.NumberFormat('es-ES').format(value);
                        }
                    }
                },
                scales: (type !== 'situacion') ? {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            fontColor: '#8898aa',
                            fontFamily: 'Nunito',
                            padding: 10,
                            callback: function (value: any) {
                                return new Intl.NumberFormat('es-ES', { notation: "compact" }).format(value);
                            }
                        },
                        gridLines: { color: 'rgba(0,0,0,0.05)', zeroLineColor: 'rgba(0,0,0,0.05)' }
                    }],
                    xAxes: [{
                        ticks: { fontColor: '#8898aa', fontFamily: 'Nunito', padding: 10 },
                        gridLines: { display: false }
                    }]
                } : {}
            }
        });
    }

}
