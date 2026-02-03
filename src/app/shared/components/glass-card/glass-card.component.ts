import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IGlassCard {
    title: string;
    value: string;
    icon: string;
    trendText: string;
    trendIcon: string;
    trendClass: string;
    description: string;
    route: string;
}

@Component({
    selector: 'app-glass-card',
    templateUrl: './glass-card.component.html',
    styleUrls: ['./glass-card.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class GlassCardComponent {
    @Input() cards: IGlassCard[] = [];
    @Output() cardClick = new EventEmitter<string>();

    onClick(route: string) {
        this.cardClick.emit(route);
    }
}
