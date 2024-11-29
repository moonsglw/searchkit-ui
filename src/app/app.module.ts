import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule, routingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { PrimeNgModule } from './primeng/primeng.module';

import { DatePipe } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './views/auth/auth.service';
import { ConfigService } from './services/config.service';
import { BnNgIdleService } from 'bn-ng-idle';
import { httpInterceptorProviders } from './views/auth/http.interceptor';
import { SortPipe } from './pipes/sort.pipe';
import { UtilService } from './services/util.service';

@NgModule({
  declarations: [
    AppComponent,
    routingComponents,
    SortPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PrimeNgModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [MessageService, DatePipe, ConfirmationService, AuthService, ConfigService, BnNgIdleService,
    httpInterceptorProviders, UtilService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
