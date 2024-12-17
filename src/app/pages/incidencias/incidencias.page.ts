import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { DatePipe } from '@angular/common';
import { Apiv4Service } from 'src/app/services/apiv4.service';
import { Router } from '@angular/router';
import DOMPurify from 'dompurify';
import { identity, TimeoutError } from 'rxjs';
import { DbService } from 'src/app/services/db.service';

interface Incidencia {
  begin: any;
  content: any;
  id: any;
  itilcategories_id: any;
  movimiento:  Movimiento[];
  state: any;
  title: any;
  type: any;
  urgency: any;
}
interface Movimiento{
  fecha: any;
  id: any;
  idticket: any;
  latitud: any;
  longitud: any;
  movimiento: any;
  users_id: any;
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
  movimiento: any;
  filtroIncidenciaArray: Incidencia[] = [];

  idticketSelect: string | null = null; 
  detalleTicket: Actividad[]= [];
  fecha: any;
 
  contrato: any;
  constructor(private loadingCtrl: LoadingController, private apiv4: Apiv4Service, private datePipe: DatePipe, private router: Router, private db: DbService) { }

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
    
  }

  sanitizeContent(content: string): string {
    return DOMPurify.sanitize(content);
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
        this.displayIncidencia = response.data || [];
        this.filtroIncidenciaArray = [...this.displayIncidencia];
        this.displayIncidencia.forEach((i: Incidencia) => {
          const movimientos = Array.isArray(i.movimiento) ? i.movimiento : [i.movimiento];
          const fechas = Array.isArray(i.movimiento) ? i.movimiento : [i.movimiento];
          
          //recorre movimientos
          if (movimientos.length === 0 || !movimientos[0].movimiento) {
            i.movimiento = [{ movimiento: 'En Camino', fecha: null, id: null, idticket: null, latitud: null, longitud: null, users_id: null }];
          } else {
            movimientos.forEach((movimiento: Movimiento) => {
              if (movimiento.movimiento === 'En Camino') { 
                movimiento.movimiento = 'En Cliente';
              } else if (movimiento.movimiento === 'En Cliente') { 
                movimiento.movimiento = 'Generar PDF';
              }
            });
            i.movimiento = movimientos;
          }
          //recorre fechas
          fechas.forEach((fecha: Movimiento)=>{
            if (fecha.fecha) {
              i.movimiento[0].fecha = fecha.fecha; 
            }
          });

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
  
    let estadoActual = i.movimiento[0].movimiento;
    let enviarMovimiento = '';
    let cambiarMovimiento = '';
  
    // Validar contrato si el estado actual es "Generar PDF"
    if (estadoActual === 'Generar PDF') {
      const detalle = await this.checkContrato(i.id); // Obtener detalles del ticket
      if (detalle && detalle.contrato) {
        this.router.navigate(['/ingresarform'], {
          queryParams: { id: i.id, fecha: i.movimiento[0].fecha, contrato: detalle.contrato },
          fragment: 'info',
          replaceUrl: true,
          state: { itilcategories_id: i.itilcategories_id, tipoServicio: this.tipo}
        });
      } else {
        this.db.presentAlertN("Este ticket no tiene contrato asociado.");
      }
      this.ocultarCarga(loading);
      return;
    }
  
    if (estadoActual === 'En Camino') {
      enviarMovimiento = 'En Camino';
      cambiarMovimiento = 'En Cliente';
    } else if (estadoActual === 'En Cliente') {
      enviarMovimiento = 'En Cliente';
      cambiarMovimiento = 'Generar PDF';
    }
  
    // Lógica para actualizar el estado y ubicación
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitud = position.coords.latitude;
        const longitud = position.coords.longitude;
  
        this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, i.id).subscribe(
          (response: any) => {
            console.log('Ubicación actualizada:', response);
            this.ocultarCarga(loading);
            i.movimiento[0].movimiento = cambiarMovimiento;
            this.db.presentAlertP("Se registró correctamente!");
            this.fetchTickets();
          },
          (error) => {
            console.error('Error al actualizar la ubicación:', error);
          }
        );
      },
      (error) => {
        console.error('Error al obtener la geolocalización:', error);
        alert('No se pudo obtener la ubicación. Asegúrate de tener el GPS activado.');
      }
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

  sanitizeNull(value: any): string {
  return value === null || value === undefined ? '' : value;
  }

  async getDetalleTicket(idticket: string){
    const loading = await this.Cargando();
    this.idticketSelect = idticket;
    this.apiv4.getDetalleTicket(this.username, this.password, idticket).subscribe(
      (response) => {
        console.log(response);
        this.contrato = response.contrato;
        this.detalleTicket = response.actividad || [];
        this.detalleTicket.forEach(ticket => {
          ticket.tipo = ticket.tipo;
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

  async checkContrato(idticket: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiv4.getDetalleTicket(this.username, this.password, idticket).subscribe(
        (response) => {
          this.contrato = response.contrato;
          resolve(response);
        },
        (error) => {
          console.error('Error al obtener los detalles del ticket:', error);
          reject(error);
        }
      );
    });
  }
  
  

  volverAtras() {
    this.variablesVacias();
    this.fetchTickets();
  }
  
  
}
