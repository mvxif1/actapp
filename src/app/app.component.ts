import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DbService } from './services/db.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  logueado : number = 0;
  constructor(private navCtrl: NavController, private dbService: DbService) {}
  

  cerrarSesion(){
    this.logueado = 0;
    this.navCtrl.navigateForward('/home');
    this.dbService.presentAlertP("Has cerrado sesión con exito!");
  }
}
