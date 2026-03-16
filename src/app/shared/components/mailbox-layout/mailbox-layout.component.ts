import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdown, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/core/services/layout/layout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mailbox-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './mailbox-layout.component.html',
  styleUrls: ['./mailbox-layout.component.scss']
})
export class MailboxLayoutComponent implements OnInit, OnDestroy {
  public isBlurActive: boolean = false;
  private blurSub: Subscription;

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

  constructor(private layoutService: LayoutService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.blurSub = this.layoutService.blur$.subscribe(active => {
      this.isBlurActive = active;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.blurSub) this.blurSub.unsubscribe();
  }

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
