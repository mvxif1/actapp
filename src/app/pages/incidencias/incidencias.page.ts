import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { DatePipe } from '@angular/common';
import { Apiv4Service } from 'src/app/services/apiv4.service';

interface Incidencia {
  begin: any;
  content: any;
  id: any;
  itilcategories_id: any;
  movimiento:  any;
  state: any;
  title: any;
  type: any;
  urgency: any;
}

interface Actividad {
  begin: any;
  content: any;
  date: any;
  end: any;
  id: any;
  name: any;
  state: any;
  tipo: any;
  users_id: any;
  
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
  filtroIncidenciaArray: Incidencia[] = [];

  idticketSelect: string | null = null; 
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

  variablesVacias(){
    this.idticketSelect = null;
    this.detalleTicket = [];
    this.displayIncidencia = [];
    this.filtroIncidenciaArray = [];
  }
  // Método para ocultar el loading
  async ocultarCarga(loading: any) {
    await loading.dismiss();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'd \'de\' MMMM \'de\' y - HH:mm') || '';
  }

  refreshIncidencias(event: any) {
    this.variablesVacias();
    this.fetchTickets().then(() => {
      event.target.complete(); // Marca el refresco como completado
    });
  }

  // Método de búsqueda y filtrado
  async filtrarIncidencias(event: any) {
    const loading = await this.Cargando();

    const query = event.target.value?.toLowerCase() || '';
    if (query === '') {
      this.displayIncidencia = [...this.filtroIncidenciaArray];
    } else {
      this.displayIncidencia = this.filtroIncidenciaArray.filter((incidencia) =>
        incidencia.id.toString().includes(query) || // Filtrar por ID
        incidencia.content?.toLowerCase().includes(query) // Filtrar por contenido
      );
    }

    setTimeout(() => {
      this.ocultarCarga(loading);
    }, 500);
  }


  async fetchTickets() {
    const loading = await this.Cargando();
    this.apiv4.getTicketTecnico(this.username, this.password, this.tipo).subscribe(
      (response: any) => {
        console.log(response);
        this.displayIncidencia = response.data || [];
        this.filtroIncidenciaArray = [...this.displayIncidencia];
        this.displayIncidencia.forEach((i: Incidencia) => {
          if (!i.movimiento) {
            i.movimiento = 'En Camino';
          } else if (i.movimiento === 'En Camino') { 
            i.movimiento = 'En Cliente';
          } else if (i.movimiento === 'En Cliente') { 
            i.movimiento = 'Generar PDF';
          }
        });
        
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

  getTipoColor(tipo: string): string {
    if (tipo === 'NOTA') {
      return '#e0e0e0'; 
    } else if (tipo === 'TAREA') {
      return '#ffd580'; 
    }
    return '#f9f9f9';
  }

  async actualizarUbicacion(i: Incidencia) {
    const loading = await this.Cargando();
  
    let estadoActual = i.movimiento;
    let enviarMovimiento = '';
    let cambiarMovimiento = '';
  
    if (estadoActual === 'En Camino') {
      enviarMovimiento = 'En Camino';
      cambiarMovimiento = 'En Cliente';
      
    } else 
    if (estadoActual === 'En Cliente') {
      enviarMovimiento = 'En Cliente';
      cambiarMovimiento = 'Generar PDF';
    } else 
    if (estadoActual === 'Generar PDF') {
      enviarMovimiento = 'Generar PDF';
    }
  
    // Lógica para actualizar el estado y ubicación
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitud = position.coords.latitude;
      const longitud = position.coords.longitude;
  
      this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, i.id).subscribe(
        (response: any) => {
          console.log('Ubicación actualizada:', response);
          this.ocultarCarga(loading);
          i.movimiento = cambiarMovimiento; 
        },
        (error) => {
          console.error('Error al actualizar la ubicación:', error);
        }
      );
    },
    (error) => {
      console.error('Error al obtener la geolocalización:', error);
      alert('No se pudo obtener la ubicación. Asegúrate de tener el GPS activado.');
    });
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

  async getDetalleTicket(idticket: string){
    const loading = await this.Cargando();
    this.idticketSelect = idticket;
    this.apiv4.getDetalleTicket(this.username, this.password, idticket).subscribe(
      (response) => {
        console.log(response);
        this.detalleTicket = response.actividad || [];
        this.detalleTicket.forEach(ticket => {
          ticket.tipo = ticket.tipo;  // Guardar tipo en cada ticket
        });
  
        if (this.detalleTicket.length > 0) {
          this.displayIncidencia = [];
        }
        this.ocultarCarga(loading);
      },
      (error) => {
        this.ocultarCarga(loading);
        console.error('Error al obtener los tickets:', error);
      },
    );
  }

  volverAtras() {
    this.variablesVacias();
    this.fetchTickets();
  }

  getItemsTicket(idticket: string){
    this.apiv4.getItemsTicket(this.username, this.password, idticket).subscribe(
      (response) => {
        console.log(response);
        this.detalleTicket = response.actividad || [];
        if (this.detalleTicket) {
          this.displayIncidencia = [];
        }
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
      },
    );
  }

  async setUbicacionGps(ticket: any) {
  }
}
