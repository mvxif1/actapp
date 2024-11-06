import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DespachoformPageRoutingModule } from './despachoform-routing.module';

import { DespachoformPage } from './despachoform.page';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DespachoformPageRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    
  ],
  declarations: [DespachoformPage]
})
export class DespachoformPageModule {}
