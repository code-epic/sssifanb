import { Injectable, inject } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class MobileDetectionService {
  private _breakpointObserver = inject(BreakpointObserver);

  // Observable reactivo para detectar cambios en tiempo real
  public isMobile$: Observable<boolean> = this._breakpointObserver
    .observe([Breakpoints.Handset, "(max-width: 768px)"])
    .pipe(
      map((result) => result.matches),
      shareReplay(1),
    );

  // Consulta síncrona instantánea
  public get isMobile(): boolean {
    return this._breakpointObserver.isMatched([
      Breakpoints.Handset,
      "(max-width: 768px)",
    ]);
  }
}
