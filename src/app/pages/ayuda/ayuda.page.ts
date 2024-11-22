import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';

interface Ayuda {
  titulo: string;
  texto: string;
}

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
})
export class AyudaPage implements OnInit {
  username: string = '';
  password: string = '';
  displayAyuda: Ayuda[] = [];
  constructor(private api: ApiService, private db: DbService, private navCtrl: NavController) { }

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.getAyuda();
  }

  getAyuda() {
    this.api.getAyuda(this.username, this.password).subscribe(
      (response: any) => {
        console.log(response);
        this.displayAyuda = response.ayuda;
        }
    )
  }

  volverAtras() {
    this.navCtrl.back();
  }

}
