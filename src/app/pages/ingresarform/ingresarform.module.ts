import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngresarformPageRoutingModule } from './ingresarform-routing.module';

import { IngresarformPage } from './ingresarform.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IngresarformPageRoutingModule
  ],
  declarations: [IngresarformPage]
})
export class IngresarformPageModule {}
