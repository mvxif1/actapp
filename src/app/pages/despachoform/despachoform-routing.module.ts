import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DespachoformPage } from './despachoform.page';

const routes: Routes = [
  {
    path: '',
    component: DespachoformPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DespachoformPageRoutingModule {}
