import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
})
export class AyudaPage implements OnInit {
  username: string = '';
  password: string = '';
  ayuda: any= {};
  constructor(private api: ApiService, private db: DbService, private navCtrl: NavController) { }

  ngOnInit() {
    this.getAyuda();
  }
  getAyuda() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.api.getAyuda(this.username, this.password).subscribe(
      (response: any) => {
        console.log(response);
        const ayudaTexto = response.ayuda;
        this.ayuda = ayudaTexto; // Asignamos el valor de la respuesta a la propiedad 'ayuda'
      },
      (error) => {
        console.error('Error al obtener la ayuda:', error);
        this.ayuda = 'Hubo un error al obtener la ayuda. Intenta nuevamente.';
      }
    );
  }

  volverAtras() {
    this.navCtrl.back();
  }

}
