import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IngresarformPage } from './ingresarform.page';

const routes: Routes = [
  {
    path: '',
    component: IngresarformPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngresarformPageRoutingModule {}
