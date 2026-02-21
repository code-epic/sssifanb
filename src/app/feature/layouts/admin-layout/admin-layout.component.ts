import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Importante para *ngIf
import { Router, RouterOutlet } from '@angular/router';
import { trigger, style, transition, animate } from '@angular/animations';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MessageService } from 'src/app/core/services/message/message.service';

import { GlassCardComponent } from '../../../shared/components/glass-card/glass-card.component';

import { LayoutService, IHeaderConfig } from 'src/app/core/services/layout/layout.service';
import { AfiliadoService } from 'src/app/core/services/afiliacion/afiliado.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, SidebarComponent, NavbarComponent, RouterOutlet, GlassCardComponent],
  animations: [
    trigger('slideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)', height: 0, overflow: 'hidden', marginTop: 0, marginBottom: 0 }),
        animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)', height: '*', marginTop: '*', marginBottom: '*' }))
      ]),
      transition(':leave', [
        animate('0.4s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 0, transform: 'translateY(-30px)', height: 0, overflow: 'hidden', marginTop: 0, marginBottom: 0 }))
      ])
    ])
  ]
})
export class AdminLayoutComponent implements OnInit {

  public datasets: any;
  public data: any;
  public salesChart;
  public clicked: boolean = true;
  public clicked1: boolean = false;
  public pagina: string = '';
  public showCards: boolean = true;

  public headerConfig: IHeaderConfig;

  public glassCards = [
    {
      title: 'Principal',
      value: 'Inicio',
      icon: 'fas fa-home',
      trendText: 'Página inicial',
      trendIcon: 'fas fa-arrow-up',
      trendClass: 'text-success',
      description: 'del sistema',
      route: 'principal'
    },
    {
      title: 'Perfil',
      value: 'Usuario',
      icon: 'fas fa-user-secret',
      trendText: 'Datos',
      trendIcon: 'fas fa-arrow-up',
      trendClass: 'text-success',
      description: 'generales',
      route: 'afiliacion/usuario'
    },
    {
      title: 'Panel',
      value: 'Configuración',
      icon: 'fas fa-cog',
      trendText: 'Área',
      trendIcon: 'fas fa-arrow-up',
      trendClass: 'text-success',
      description: 'del sistema',
      route: 'configurar'
    },
    {
      title: 'Reportes',
      value: 'General',
      icon: 'fas fa-print',
      trendText: 'Documentos',
      trendIcon: 'fas fa-arrow-down',
      trendClass: 'text-warning',
      description: 'varios',
      route: 'afiliacion/reportes'
    }
  ];

  constructor(
    private ruta: Router,
    private msj: MessageService,
    private layoutService: LayoutService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private afiliadoService: AfiliadoService
  ) { }

  ngOnInit() {
    const pagina = this.ruta.url.split("/") // Fix previous logic assumption if possible, but keeping it
    this.pagina = pagina[1] ? pagina[1].toUpperCase() : ''

    this.msj.contenido$.subscribe(e => {
      console.log(e)
      this.pagina = e
    })

    // Suscribirse al estado de las tarjetas
    this.layoutService.showCards$.subscribe(visible => {
      this.showCards = visible;
      this.cdr.detectChanges(); // Forzar actualización visual
    });

    // Suscribirse a la configuración del header
    this.layoutService.headerConfig$.subscribe(config => {
      this.headerConfig = config;
      this.cdr.detectChanges();
    });

    // Suscribirse al evento global de forzar scroll top
    this.layoutService.scrollToTop$.subscribe(() => {
      this.doNativeScrollToTop();
    });
  }

  doNativeScrollToTop() {
    // Intento 1: Componente Main Context (Argon Wrapper)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      mainContent.scrollTop = 0;
    }
    // Intento 2: Tarjeta central contenedora (Si tiene overflow)
    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
      cardBody.scrollTo({ top: 0, behavior: 'smooth' });
      cardBody.scrollTop = 0;
    }
    // Intento 3: Scroll Nativo Global
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  IrA(url: string) {
    this.pagina = url.toUpperCase()
    this.layoutService.toggleCards(true); // Reset cards when navigating
    this.layoutService.updateHeader({ // Reset header when navigating
      title: url.charAt(0).toUpperCase() + url.slice(1),
      showBackButton: false,
      alertSeverity: 1
    });
    this.ruta.navigate(['/' + url]);
  }

  goBack() {
    this.afiliadoService.clearAfiliado(); // 1. Restablecer el logo del sidebar
    this.layoutService.triggerScrollToTop(); // 2. Despachar el evento de scroll global al contenedor
    this.location.back();
  }

  toggleCardsVisibility() {
    this.layoutService.toggleCards(!this.showCards);
  }

  getHeaderClass() {
    if (!this.headerConfig) return '';
    switch (this.headerConfig.alertSeverity) {
      case 2: return 'header-warn'; // Azul
      case 3: return 'header-critical'; // Rojo
      default: return '';
    }
  }

}
