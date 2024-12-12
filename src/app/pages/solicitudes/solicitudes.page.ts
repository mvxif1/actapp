import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { Apiv4Service } from 'src/app/services/apiv4.service';

interface Solicitud {
  begin: any;
  content: any;
  id: any;
  itilcategories_id: any;
  state: any;
  title: any;
  type: any;
  urgency: any;
}

interface Actividad {
  begin: any;
  content: any;
  id: any;
  itilcategories_id: any;
  state: any;
  title: any;
  type: any;
  urgency: any;
  
}

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.page.html',
  styleUrls: ['./solicitudes.page.scss'],
  providers: [DatePipe]
})
export class SolicitudesPage implements OnInit {
  username: string = ''; 
  password: string = '';
  tipo: number = 2;

  displaySolicitud: Solicitud[] = [];

  idticketSelect: any;
  detalleTicket: Actividad[]= [];
  constructor(private loadingCtrl: LoadingController, private apiv4: Apiv4Service, private datePipe: DatePipe) { }

  ngOnInit() {
    this.fetchTickets();
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
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
    this.apiv4.getTicketTecnico(this.username, this.password, this.tipo).subscribe(
      (response: any) => {
        console.log(response);
        this.displaySolicitud = response.data || [];
        this.ocultarCarga(loading);
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
        this.ocultarCarga(loading);
      },
    );
  }

  getUrgencyColor(urgency: any): string {
    const value = parseInt(urgency, 10); // Convierte a número
    switch (value) {
      case 4: return 'red';    // Alta urgencia
      case 3: return 'orange'; // Media urgencia
      case 2: return 'green';  // Baja urgencia
      default: return 'transparent'; // Por defecto sin color
    }
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

  sanitizeNull(value: any): string {
  return value === null || value === undefined ? '' : value;
  }

  getDetalleTicket(idticket: string){
    this.apiv4.getDetalleTicket(this.username, this.password, idticket).subscribe(
      (response) => {
        console.log(response);
        this.detalleTicket = response.actividad || [];
        if (this.detalleTicket) {
          this.displaySolicitud = [];
        }
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
      },
    );
  }



}

