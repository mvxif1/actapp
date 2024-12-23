import { Component } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { DbService } from './services/db.service';
import { ApiService } from './services/api.service';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  usuario: any;
  logueado: boolean = false;

  constructor(private navCtrl: NavController, private db: DbService, private api: ApiService, private platform: Platform, private router: Router) {
    this.usuario = {};
    this.initializeBackButtonCustomHandler();
  }

  initializeBackButtonCustomHandler() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.router.url === '/home') {
        App.exitApp();
      }
    });
  }
  
  estaLogueado(): boolean {
    return this.logueado;
  }

  iniciarSesion() {
    this.logueado = true;
  }

  cerrarsesion() {
    this.logueado = false;
    const userType = 0;
    localStorage.setItem('email', '');
    localStorage.setItem('password', '');
    localStorage.setItem('userType', userType.toString());
    console.log(localStorage.getItem('userType'));
    this.navCtrl.navigateRoot('/home'); 
    this.db.presentAlertP("Has cerrado sesión con éxito!");
  }
}
