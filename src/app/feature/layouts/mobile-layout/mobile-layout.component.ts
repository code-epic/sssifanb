import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { LayoutService, IHeaderConfig } from "src/app/core/services/layout/layout.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-mobile-layout",
  templateUrl: "./mobile-layout.component.html",
  styleUrls: ["./mobile-layout.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
})
export class MobileLayoutComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  public headerConfig: IHeaderConfig | null = null;
  public isBlurActive: boolean = false;

  public get showNavigation(): boolean {
    return this.router.url !== "/login" && this.router.url !== "/logout";
  }

  ngOnInit(): void {
    // Listen to header config changes
    this.layoutService.headerConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.headerConfig = config;
        this.cdr.markForCheck();
      });

    // Listen to global blur changes
    this.layoutService.blur$
      .pipe(takeUntil(this.destroy$))
      .subscribe((blur) => {
        this.isBlurActive = blur;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    if (this.headerConfig?.showBackButton) {
      this.location.back();
    }
  }

  goHome(): void {
    this.router.navigate(["/principal"]);
  }

  logout(): void {
    this.router.navigate(["/logout"]);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
