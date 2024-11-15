import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DbService } from './services/db.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  usuario: any;
  logueado: boolean = false;

  constructor(private navCtrl: NavController, private db: DbService, private api: ApiService) {
    this.usuario = {};
  }
  
  estaLogueado(): boolean {
    return this.logueado;
  }

  iniciarSesion() {
    this.logueado = true;
  }

  cerrarsesion() {
    this.logueado = false;
    localStorage.setItem('email', '');
    localStorage.setItem('password', '');
    this.navCtrl.navigateForward('/home'); 
    this.db.presentAlertP("Has cerrado sesión con éxito!");
  }
}
