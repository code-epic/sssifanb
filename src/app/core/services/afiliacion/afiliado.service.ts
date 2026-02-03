import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IAfiliado } from '../../models/afiliacion/afiliado.model';

@Injectable({
    providedIn: 'root'
})
export class AfiliadoService {

    private afiliadoSubject = new BehaviorSubject<IAfiliado | null>(null);
    public afiliado$: Observable<IAfiliado | null> = this.afiliadoSubject.asObservable();

    constructor() { }

    setAfiliado(afiliado: IAfiliado) {
        this.afiliadoSubject.next(afiliado);
    }

    getAfiliado(): IAfiliado | null {
        return this.afiliadoSubject.getValue();
    }

    clearAfiliado() {
        this.afiliadoSubject.next(null);
    }
}
