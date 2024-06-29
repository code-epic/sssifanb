import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { CustomPaginator } from './paginator-intl'; //NLS configuracion de idiomas

import { MatLegacyPaginatorIntl as MatPaginatorIntl } from '@angular/material/legacy-paginator';

import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgxUiLoaderModule,  NgxUiLoaderConfig } from "ngx-ui-loader";

import { MatCommonModule } from '@angular/material/core';
import { ToastrModule, ToastContainerModule } from 'ngx-toastr';
import { AuthGuardGuard } from './services/seguridad/auth-guard.guard';
import { HashLocationStrategy, JsonPipe, LocationStrategy } from '@angular/common';

// import { AngularFileUploaderModule } from "angular-file-uploader";
import { AuthInterceptorService } from './services/seguridad/auth-interceptor.service';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  "bgsColor": "#79c680",
  "bgsOpacity": 0.2,
  "bgsPosition": "center-center",
  "bgsSize": 60,
  "bgsType": "ball-spin-clockwise",
  "blur": 8,
  "delay": 0,
  "fastFadeOut": true,
  "fgsColor": "#1ea24a",
  "fgsPosition": "center-center",
  "fgsSize": 50,
  "fgsType": "ball-spin-clockwise",
  "gap": 24,
  "logoPosition": "center-center",
  "logoSize": 120,
  "logoUrl": "",
  "masterLoaderId": "master",
  "overlayBorderRadius": "0",
  "overlayColor": "rgba(40, 40, 40, 0.63)",
  "pbColor": "#79c680",
  "pbDirection": "ltr",
  "pbThickness": 3,
  "hasProgressBar": true,
  "text": "",
  "textColor": "#FFFFFF",
  "textPosition": "center-center",
  "maxTime": -1,
  "minTime": 300
}



@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatButtonToggleModule,
    AutocompleteLibModule,
    MatListModule,
    ReactiveFormsModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatDialogModule,
    MatCommonModule,
    ToastContainerModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    MatToolbarModule,
    ToastrModule.forRoot({
      closeButton: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toast-top-right",
      preventDuplicates: false    }),
    // AngularFileUploaderModule

  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    AuthLayoutComponent,
  ],
  providers:  [
    {
      provide: [ LocationStrategy, AuthGuardGuard,  JsonPipe],
      useClass: HashLocationStrategy
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    },
    { 
      provide: MatPaginatorIntl, 
      useValue: CustomPaginator() 
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }