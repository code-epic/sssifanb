import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

export interface DynamicTableColumn {
    key: string;
    header: string;
    type?: 'text' | 'currency' | 'date' | 'badge' | 'custom' | 'html';
    sortable?: boolean;
    totalize?: boolean;
    align?: 'left' | 'center' | 'right';
    badgeColorKey?: string; // e.g. resolves to "badge-teal", "badge-amber"
    iconKey?: string;       // e.g. resolves to "fa-cog fa-spin"
    width?: string;
    isCustomHTML?: boolean;
    cssClass?: string;      // custom classes for the <td>
}

export interface DynamicTableAction {
    name: string;
    icon: string;
    tooltip: string;
    iconColorClass?: string;
    buttonClass?: string;
}

export interface DynamicTableConfig {
    columns: DynamicTableColumn[];
    actions?: DynamicTableAction[];
    selectable?: boolean;
    rowClickable?: boolean;
    showPagination?: boolean;
    pageSize?: number;
    hideHeader?: boolean;
    hoverActions?: boolean;
    tableClass?: string; // custom classes for the <table>
    containerClass?: string; // custom classes for the wrapper <div>
}

@Component({
    selector: 'app-dynamic-table',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbTooltipModule, NgbPaginationModule],
    templateUrl: './dynamic-table.component.html',
    styleUrls: ['./dynamic-table.component.scss']
})
export class DynamicTableComponent implements OnChanges {
    @Input() config!: DynamicTableConfig;
    @Input() data: any[] = [];

    @Output() actionClicked = new EventEmitter<{ actionName: string, row: any }>();
    @Output() selectionChanged = new EventEmitter<any[]>();
    @Output() rowClicked = new EventEmitter<any>();

    // Pagination
    page: number = 1;
    pageSize: number = 10;

    // Sorting
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Selection
    selectedRows: Set<any> = new Set();
    selectAll: boolean = false;

    // Processed data
    processedData: any[] = [];
    paginatedData: any[] = [];

    // Totals
    totals: { [key: string]: number } = {};

    Math = Math;

    ngOnChanges(changes: any) {
        if (changes['data'] || changes['config']) {
            if (this.config?.pageSize) {
                this.pageSize = this.config.pageSize;
            }
            this.calculateTotals();
            this.applyFiltersAndSort();
        }
    }

    // selection logic
    toggleAll() {
        if (this.selectAll) {
            this.data.forEach(row => this.selectedRows.add(row));
        } else {
            this.selectedRows.clear();
        }
        this.emitSelection();
    }

    toggleRow(row: any) {
        if (this.selectedRows.has(row)) {
            this.selectedRows.delete(row);
            this.selectAll = false;
        } else {
            this.selectedRows.add(row);
            if (this.selectedRows.size === this.data.length && this.data.length > 0) {
                this.selectAll = true;
            }
        }
        this.emitSelection();
    }

    emitSelection() {
        this.selectionChanged.emit(Array.from(this.selectedRows));
    }

    // sorting logic
    sortBy(column: DynamicTableColumn) {
        if (!column.sortable) return;

        if (this.sortColumn === column.key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column.key;
            this.sortDirection = 'asc';
        }
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        let result = [...(this.data || [])];

        // sort
        if (this.sortColumn) {
            result.sort((a, b) => {
                let valA = a[this.sortColumn] || '';
                let valB = b[this.sortColumn] || '';

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        this.processedData = result;
        this.updatePagination();
    }

    updatePagination() {
        if (this.config?.showPagination) {
            const startIndex = (this.page - 1) * this.pageSize;
            this.paginatedData = this.processedData.slice(startIndex, startIndex + this.pageSize);
        } else {
            this.paginatedData = this.processedData;
        }
    }

    onPageChange(newPage: number) {
        this.page = newPage;
        this.updatePagination();
    }

    calculateTotals() {
        this.totals = {};
        if (!this.config?.columns || !this.data) return;

        this.config.columns.forEach(col => {
            if (col.totalize) {
                this.totals[col.key] = this.data.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0);
            }
        });
    }

    onAction(actionName: string, row: any) {
        this.actionClicked.emit({ actionName, row });
    }

    onRowClick(row: any) {
        if (this.config?.rowClickable) {
            this.rowClicked.emit(row);
        }
    }

    getColspan(): number {
        let base = this.config?.columns?.length || 0;
        if (this.config?.selectable) base++;
        if (this.config?.actions?.length) base++;
        return base;
    }

    hasTotals(): boolean {
        return this.config?.columns?.some(c => c.totalize) || false;
    }
}
