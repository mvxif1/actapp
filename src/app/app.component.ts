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

  username: string = ''; 
  password: string = '';
  ayuda: string = '';

  constructor(private navCtrl: NavController, private db: DbService, private api: ApiService) {
    this.usuario = {};
  }
  
  estaLogueado(): boolean {
    return this.logueado;
  }

  iniciarSesion() {
    this.logueado = true;
  }
  getAyuda() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.api.getAyuda(this.username, this.password).subscribe(
      (response: any) => {
        console.log(response)
        const ayudaTexto = response.ayuda;
        this.db.presentAlertW(ayudaTexto);
      },
      (error) => {
        console.error('Error al obtener la ayuda:', error);
        this.ayuda = 'Hubo un error al obtener la ayuda. Intenta nuevamente.';
      }
    );
  }
  
  
  
  cerrarsesion() {
    this.logueado = false;
    localStorage.setItem('email', '');
    localStorage.setItem('password', '');
    this.navCtrl.navigateForward('/home'); 
    this.db.presentAlertP("Has cerrado sesión con éxito!");
  }
}
