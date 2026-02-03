import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-afi-listar',
    standalone: true,
    imports: [CommonModule, NgbPaginationModule, DatePipe],
    templateUrl: './afi-listar.component.html',
    styleUrls: ['./afi-listar.component.scss']
})
export class AfiListarComponent implements OnInit {

    @Input() militares: any[] = [];
    @Output() onSelect = new EventEmitter<any>();

    public page = 1;
    public pageSize = 5;

    constructor() { }

    ngOnInit(): void {
    }

    get displayedMilitares() {
        const startIndex = (this.page - 1) * this.pageSize;
        return this.militares.slice(startIndex, startIndex + this.pageSize);
    }

    selectMilitar(militar: any) {
        this.onSelect.emit(militar);
    }

}
