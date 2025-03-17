import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MATERIAL_FORM_MODULE, MATERIAL_MODULES } from '../../../../core/imports/material/material';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...MATERIAL_FORM_MODULE,
    ...MATERIAL_MODULES
  ],
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.css']
})
export class DynamicTableComponent implements OnInit, OnChanges {
  @Input() columns: { key: string, name: string }[] = [];
  @Input() data: any[] = [];
  @Input() actions: { name: string, handler: (element: any) => void }[] = [];

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [];

  ngOnInit() {
    this.updateTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.dataSource = new MatTableDataSource<any>(this.data);
    this.displayedColumns = this.columns.map(column => column.key);
    if (this.actions && this.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  updateTable() {
    this.dataSource.data = this.data;
    this.displayedColumns = this.columns.map(column => column.key);
    if (this.actions && this.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
    this.dataSource._updateChangeSubscription();
  }
}
