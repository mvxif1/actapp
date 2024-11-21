import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DespachadosPageRoutingModule } from './despachados-routing.module';

import { DespachadosPage } from './despachados.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DespachadosPageRoutingModule
  ],
  declarations: [DespachadosPage]
})
export class DespachadosPageModule {}
