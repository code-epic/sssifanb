import { Component, forwardRef, Input, Injectable } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbDatepickerModule, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';

function toInteger(value: any): number {
    return parseInt(`${value}`, 10);
}

function isNumber(value: any): value is number {
    return !isNaN(toInteger(value));
}

function padNumber(value: number) {
    if (isNumber(value)) {
        return `0${value}`.slice(-2);
    } else {
        return '';
    }
}

@Injectable()
export class PastelDateParserFormatter extends NgbDateParserFormatter {
    parse(value: string): NgbDateStruct | null {
        if (value) {
            const dateParts = value.trim().split('/');
            if (dateParts.length === 1 && isNumber(dateParts[0])) {
                return { day: toInteger(dateParts[0]), month: -1, year: -1 };
            } else if (dateParts.length === 2 && isNumber(dateParts[0]) && isNumber(dateParts[1])) {
                return { day: toInteger(dateParts[0]), month: toInteger(dateParts[1]), year: -1 };
            } else if (dateParts.length === 3 && isNumber(dateParts[0]) && isNumber(dateParts[1]) && isNumber(dateParts[2])) {
                return { day: toInteger(dateParts[0]), month: toInteger(dateParts[1]), year: toInteger(dateParts[2]) };
            }
        }
        return null;
    }

    format(date: NgbDateStruct | null): string {
        return date && date.year && date.month && date.day ?
            `${padNumber(date.day)}/${padNumber(date.month)}/${date.year}` :
            '';
    }
}

@Component({
    selector: 'app-pastel-datepicker',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbDatepickerModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PastelDatepickerComponent),
            multi: true
        },
        { provide: NgbDateParserFormatter, useClass: PastelDateParserFormatter }
    ],
    templateUrl: './pastel-datepicker.component.html',
    styleUrls: ['./pastel-datepicker.component.scss']
})
export class PastelDatepickerComponent implements ControlValueAccessor {
    constructor(private parserFormatter: NgbDateParserFormatter) { }

    @Input() placeholder: string = 'DD/MM/YYYY';
    @Input() iconClass: string = 'fas fa-calendar-alt';
    @Input() placement: string = 'bottom-left bottom-right top-left top-right';
    @Input() container: string | null = 'body';

    dateStruct: NgbDateStruct | null = null;
    private focusedAndValued: boolean = false;

    private onChange: (value: string | null) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(val: string): void {
        if (val) {
            // Intentar parsear YYYY-MM-DD
            if (val.includes('-')) {
                const parts = val.split('-');
                if (parts.length >= 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const day = parseInt(parts[2].substr(0, 2));
                    this.dateStruct = { year, month, day };
                }
            } else if (val.includes('/')) {
                const parts = val.split('/');
                if (parts.length >= 3) {
                    this.dateStruct = { year: parseInt(parts[2]), month: parseInt(parts[1]), day: parseInt(parts[0]) };
                }
            }
        } else {
            this.dateStruct = null;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    onDateSelect(date: NgbDateStruct | null) {
        if (date && date.year && date.month && date.day) {
            const y = date.year;
            const m = padNumber(date.month);
            const d = padNumber(date.day);
            this.onChange(`${y}-${m}-${d}`);
        } else {
            this.onChange(null);
        }
        this.onTouched();
    }

    onInputBlur() {
        this.onTouched();
    }

    onManualInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const eventType = (event as InputEvent).inputType;

        // Permitimos borrar tranquilamente sin re-añadir el slash
        if (eventType === 'deleteContentBackward' || eventType === 'deleteContentForward') {
            if (input.value === '') {
                this.dateStruct = null;
                this.onChange(null);
            }
            return;
        }

        let value = input.value.replace(/\D/g, ''); // Elimina todo lo que no sea dígito

        if (value.length > 8) {
            value = value.substring(0, 8);
        }

        let formattedValue = value;
        if (value.length >= 3 && value.length <= 4) {
            formattedValue = `${value.slice(0, 2)}/${value.slice(2)}`;
        } else if (value.length >= 5) {
            formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        }

        input.value = formattedValue;

        const parsed = this.parserFormatter.parse(formattedValue);
        if (parsed && parsed.year > 1900 && parsed.month >= 1 && parsed.month <= 12 && parsed.day >= 1 && parsed.day <= 31) {
            this.dateStruct = parsed;
            const y = parsed.year;
            const m = padNumber(parsed.month);
            const d = padNumber(parsed.day);
            this.onChange(`${y}-${m}-${d}`);
        }
    }

    onInputFocus(event: FocusEvent) {
        const input = event.target as HTMLInputElement;
        if (input.value && input.value.length > 0) {
            this.focusedAndValued = true;
            input.select();
        }
    }

    onKeyDown(event: KeyboardEvent) {
        const input = event.target as HTMLInputElement;
        // Si acabamos de entrar y presionan una tecla de número/letra (para sobreescribir)
        if (this.focusedAndValued && /^[0-9]$/.test(event.key)) {
            input.value = ''; // Limpiamos la caja para que empiece de cero
            this.dateStruct = null;
            this.onChange(null);
            this.focusedAndValued = false;
        } else if (event.key !== 'Tab') {
            this.focusedAndValued = false; // Se cancela con cualquier otra navegación o backspace etc
        }
    }
}
