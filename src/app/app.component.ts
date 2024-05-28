import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DbService } from './services/db.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  usuario: any;
  logueado : number = 0;
  constructor(private navCtrl: NavController, private dbService: DbService) {
    this.usuario= {};
  }

  estaLogueado(): boolean{
    const rolActual = this.dbService.getRolActual();
    return rolActual === 1 || rolActual === 2;
  }
  
  esAdmin(): boolean{
    return this.dbService.getRolActual() === 2;
  }

  esUsuario(): boolean{
    return this.dbService.getRolActual() === 1;
  }

  cerrarsesion(){
    this.logueado = 0;
    this.dbService.setRolActual(0);
    this.navCtrl.navigateForward('/home');
    this.dbService.presentAlertP("Has cerrado sesión con exito!");
  }
}
