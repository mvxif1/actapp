import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { DatePipe } from '@angular/common';

interface Incidencia {
  id: string;
  name: string;
  begin: string;
  content: string;
  status: string;
}

@Component({
  selector: 'app-incidencias',
  templateUrl: './incidencias.page.html',
  styleUrls: ['./incidencias.page.scss'],
  providers: [DatePipe]
})

export class IncidenciasPage implements OnInit {
  username: string = ''; 
  password: string = '';
  tipo: number = 1;
  displayIncidencia: Incidencia[] = [];
  constructor(private loadingCtrl: LoadingController, private api: ApiService, private datePipe: DatePipe) { }

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
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

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'd \'de\' MMMM \'de\' y - HH:mm') || '';
  }

  async fetchTickets() {
    const loading = await this.Cargando();
    this.api.getTicketTecnico(this.username, this.password, this.tipo).subscribe(
      (response: any) => {
        console.log(response);
        this.displayIncidencia = response.data || [];
        this.ocultarCarga(loading);
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
        this.ocultarCarga(loading);
      },
    );
  }

  decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    const decodedHtml = txt.value;

    // Crear un contenedor con display: flex y añadir el HTML decodificado
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.innerHTML = decodedHtml;

    // Devolver el HTML con el estilo aplicado
    return wrapper.outerHTML;
  }

}
