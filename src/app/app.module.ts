import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Camera } from '@ionic-native/camera/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, SQLite, Camera],
  bootstrap: [AppComponent],
})
export class AppModule {}
