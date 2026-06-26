import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { LoginService } from "src/app/core/services/login/login.service";

interface LogoutStep {
  key: string;
  label: string;
  status: "pending" | "in-progress" | "done" | "error";
}

@Component({
  selector: "app-mobile-logout",
  templateUrl: "./mobile-logout.component.html",
  styleUrls: ["./mobile-logout.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class MobileLogoutComponent implements OnInit, OnDestroy {
  private loginService = inject(LoginService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  public steps: LogoutStep[] = [
    { key: "SERVER_LOGOUT", label: "Finalizando sesión en servidor", status: "pending" },
    { key: "CLEAR_SESSION", label: "Limpiando almacenamiento local", status: "pending" },
    { key: "REDIRECT", label: "Redirigiendo al inicio", status: "pending" },
  ];

  public finalMessage: string = "";
  public statusText: string = "";
  public confirmLogout: boolean = true;
  private redirectTimeout: any;

  private messageToStepKey: { [message: string]: string } = {
    "Finalizando sesión en el servidor...": "SERVER_LOGOUT",
    "No se pudo contactar al servidor, limpiando localmente...": "SERVER_LOGOUT",
    "Limpiando datos de la sesión...": "CLEAR_SESSION",
    "¡Hasta pronto!": "REDIRECT",
  };

  ngOnInit(): void {
    // Wait for user confirmation in mobile UI
  }

  cancelLogout(): void {
    this.router.navigate(["/principal"]);
  }

  confirmAndLogout(): void {
    this.confirmLogout = false;
    this.executeLogout();
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  async executeLogout(): Promise<void> {
    await this.loginService.performLogoutProcess((message: string) => {
      this.ngZone.run(() => {
        this.statusText = message.trim();
        this.updateStepStatus(message);
      });
    });
  }

  private updateStepStatus(message: string): void {
    const stepKey = this.messageToStepKey[message.trim()];
    if (!stepKey) return;

    const newSteps = this.steps.map((step) => ({ ...step }));
    const currentStepIndex = newSteps.findIndex((s) => s.key === stepKey);
    if (currentStepIndex === -1) return;

    // Mark previous steps as done
    for (let i = 0; i < currentStepIndex; i++) {
      if (newSteps[i].status !== "error") {
        newSteps[i].status = "done";
      }
    }

    // Mark current step
    if (message.includes("No se pudo")) {
      newSteps[currentStepIndex].status = "error";
    } else if (message === "¡Hasta pronto!") {
      newSteps[currentStepIndex].status = "done";
      this.statusText = "";
      this.finalMessage = "¡Sesión cerrada con éxito!";
      
      // Auto-redirect to login after 1.5 seconds
      this.redirectTimeout = setTimeout(() => {
        this.router.navigate(["/login"]);
      }, 1500);
    } else {
      newSteps[currentStepIndex].status = "in-progress";
    }

    this.steps = newSteps;
    this.cdr.markForCheck();
  }
}
