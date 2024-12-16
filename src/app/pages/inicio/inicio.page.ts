import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {
  username: string = '';
  password: string = '';
  isTecnico: boolean = false;
  noTecnico: boolean = false;
  tieneDespachos: boolean = false;

  despachos: any[] = []; 

  constructor(private api: ApiService, private loadingCtrl: LoadingController) {}

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.tipoUser();
  }
  //carga
  async Cargando() {
    const loading = await this.loadingCtrl.create({
      message: 'Espere un momento...',
      spinner: 'crescent',
      backdropDismiss: false // Para evitar que el loading se cierre cuando toquen fuera
    });

    await loading.present();
    return loading;
  }

  // Método para ocultar el loading
  async ocultarCarga(loading: any) {
    await loading.dismiss();
  }

  async tipoUser() {
    const loading = await this.Cargando();
    const userType = Number(localStorage.getItem('userType')); 
    this.api.getListTickets(this.username, this.password).subscribe(
      (response: any) => {
        this.despachos = response.tickets || [];
        this.ocultarCarga(loading); 
        if (userType === 1) {
          this.isTecnico = true;
          this.noTecnico = false;
          this.tieneDespachos = this.despachos.length > 0; 
        } else if (userType === 0) {
          this.isTecnico = false;
          this.noTecnico = true;
          this.tieneDespachos = false; 
        }
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
        this.despachos = [];
        this.isTecnico = userType === 1;
        this.noTecnico = userType === 0;
        this.tieneDespachos = false; 
        this.ocultarCarga(loading);
      }
    );
  }
}
