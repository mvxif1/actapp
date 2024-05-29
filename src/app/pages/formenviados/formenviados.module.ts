import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormenviadosPageRoutingModule } from './formenviados-routing.module';

import { FormenviadosPage } from './formenviados.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormenviadosPageRoutingModule
  ],
  declarations: [FormenviadosPage]
})
export class FormenviadosPageModule {}
