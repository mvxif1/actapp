import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormenviadosPage } from './formenviados.page';

const routes: Routes = [
  {
    path: '',
    component: FormenviadosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormenviadosPageRoutingModule {}
