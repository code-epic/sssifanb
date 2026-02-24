import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdown, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-mailbox-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './mailbox-layout.component.html',
  styleUrls: ['./mailbox-layout.component.scss']
})
export class MailboxLayoutComponent {

  @ViewChild('filterDropdown') filterDropdown!: NgbDropdown;

  // Lista de Pestañas
  @Input() tabs: any[] = [];
  @Input() currentTabId: string = '';
  @Input() isLoadingTabs: boolean = false;

  // Toolbar Params
  @Input() showToolbar: boolean = true;
  @Input() allSelected: boolean = false;
  @Input() searchPlaceholder: string = 'Buscar registro...';
  @Input() hasFilters: boolean = true;
  @Input() searchTerm: string = '';

  // Eventos de salida
  @Output() tabSwitch = new EventEmitter<string>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() refresh = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  constructor() { }

  onSearchSubmit() {
    this.search.emit(this.searchTerm);
  }

  onTabClick(id: string) {
    this.tabSwitch.emit(id);
  }

  onSelectAll(event: any) {
    this.selectAll.emit(event.target.checked);
  }

  onRefresh() {
    this.refresh.emit();
  }

  getTabIcon(name: string): string {
    if (!name) return 'fa-folder';
    const str = name.toUpperCase();
    if (str.includes('RECIBIDO')) return 'fa-inbox';
    if (str.includes('PROCESO') || str.includes('PENDIENTE')) return 'fa-tasks';
    if (str.includes('IMPRESO')) return 'fa-print';
    if (str.includes('APROBADO') || str.includes('LIBERADO')) return 'fa-check-circle';
    if (str.includes('RECHAZADO') || str.includes('ANULADO')) return 'fa-times-circle';
    return 'fa-folder';
  }
}
