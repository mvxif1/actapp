import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

interface Notas {
  id: string;
  itemtype: string;
  items_id: string;
  date: string;
  users_id: string;
  users_id_editor: string;
  content: string;
  is_private: string;
  requesttypes_id: string;
  date_mod: string;
  date_creation: string;
  timeline_position: string;
  sourceitems_id: string;
  sourceof_items_id: string;
  links: any[];
}

interface Ticket {
    id: string;
    titulo: string;
    detalle: string;
    guia: string | null;
    notas: Notas[]; 
}

interface Guia {
  guia: string;
  ticket: Ticket[];
}



@Component({
  selector: 'app-despachados',
  templateUrl: './despachados.page.html',
  styleUrls: ['./despachados.page.scss'],
})
export class DespachadosPage implements OnInit {
  username: string = '';
  password: string = '';

  guiaArray: Guia[] = [];
  notasArray: Notas[] = [];
  // carga por 10 tickets
  displayGuias: Guia[] = [];
  numGuiasCarga: number = 10;
  currentBatchIndex: number = 0; // indica índice actual para cargar más guías
  infiniteScrollDisabled: boolean = false;

  // filtro por id
  isLoading: boolean = false;
  filtroTicketArray: Guia[] = [];
  searchTerm: string = '';
  selectedGuia: Guia | null = null;
  selectedTicket: Ticket | null = null;
  busquedaGuias: boolean = true;
  selectedNotas: any[] = [];
  // mostrar contenidos de botones
  mostrarDetalle = false;
  mostrarContenido = false;

  constructor(private api: ApiService, private loadingCtrl: LoadingController, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
  }

  async Cargando() {
    const loading = await this.loadingCtrl.create({
      message: 'Espere un momento...',
      spinner: 'crescent',
      backdropDismiss: false, // Para evitar que el loading se cierre cuando toquen fuera
    });

    await loading.present();
    return loading;
  }

  // Método para ocultar el loading
  async ocultarCarga(loading: any) {
    await loading.dismiss();
  }

  // recarga tickets
  refreshTickets(event: any) {
    this.selectedGuia = null;
    this.displayGuias = this.guiaArray;
    this.infiniteScrollDisabled = false;
    this.busquedaGuias = true;
    this.fetchTickets();
    event.target.complete();
  }

  // carga tickets al hacer scroll
  loadMoreTickets(event: any) {
    const nextBatchIndex = this.currentBatchIndex + this.numGuiasCarga;
    const newTickets = this.filtroTicketArray.slice(this.currentBatchIndex, nextBatchIndex);
    this.displayGuias = [...this.displayGuias, ...newTickets];
    this.currentBatchIndex = nextBatchIndex;

    event.target.complete();

    // Desactivar el scroll si todos los tickets están cargados
    if (this.displayGuias.length >= this.filtroTicketArray.length) {
      event.target.disabled = true;
    }
  }

  async filtrarTicket(event: any) {
    console.log('Evento de búsqueda:', event.target.value); // Verifica el valor del input
    const loading = await this.Cargando();
    this.selectedGuia = null;
    this.cdr.detectChanges();

    const query = event.target.value?.toLowerCase() || '';
    console.log('Consulta de búsqueda:', query); // Verifica la cadena de búsqueda

    if (query === '') {
      this.filtroTicketArray = [...this.guiaArray];
      this.displayGuias = [...this.guiaArray];
    } else {
      this.filtroTicketArray = this.guiaArray.filter((guia) =>
        guia.guia.toLowerCase().includes(query)
      );
      this.displayGuias = this.guiaArray.filter((guia) =>
        guia.guia.toLowerCase().includes(query)
      );
    }

    setTimeout(() => {
      this.ocultarCarga(loading);
      this.cdr.detectChanges();
    }, 500);
  }

  async fetchTickets() {
    this.isLoading = true;
    const loading = await this.Cargando();
    this.api.getListTicketsDespachados(this.username, this.password).subscribe(
      (response: any) => {
        
        this.guiaArray = response.tickets || [];
        this.guiaArray.shift();
        console.log(this.guiaArray);
        this.filtroTicketArray = this.guiaArray;
        this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
        this.isLoading = false;
        this.ocultarCarga(loading);
        
      },
      (error) => {
        console.error('Error al obtener los tickets:', error);
        this.ocultarCarga(loading);
        this.isLoading = false;
      },
    );
  }
  
  onGuiaSelect(guiaId: string) {
    this.selectedGuia = this.guiaArray.find(guia => guia.guia === guiaId) || null;
    this.infiniteScrollDisabled = true;
    this.busquedaGuias = false;
    if (this.selectedGuia) {
      this.displayGuias = [];
    }

    console.log("Este es un selected guia: ",this.selectedGuia)
  }

  onTicketSelect(ticketId: string) {
    if (this.selectedTicket && this.selectedTicket.id === ticketId) {
      this.mostrarDetalle = !this.mostrarDetalle;
    } else {
      this.selectedTicket = this.selectedGuia?.ticket.find(t => t.id === ticketId) || null;
      this.mostrarDetalle = true;
    }
    
    if (this.onNotasSelect("") as any) {
      this.selectedNotas = this.selectedTicket!.notas;  // Aquí se guardan todas las notas del ticket
    }

    console.log("Estas son las notas del ticket: ", this.selectedNotas);
    console.log("Este es un selected ticket: ", this.selectedTicket);
  }
  

  onNotasSelect(notasId: string) {
    const selectedNota = this.selectedTicket?.notas.find(nota => nota.id === notasId);
    if (selectedNota) {
      console.log('Nota seleccionada:', selectedNota);
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

  despliegaContenido() {
    this.mostrarContenido = !this.mostrarContenido;
  }

  async volverListTicket() {
    this.isLoading = true;
    const loading = await this.Cargando();
    setTimeout(() => {
      this.selectedGuia = null;
      this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
      this.isLoading = false;
      this.ocultarCarga(loading);
      this.mostrarContenido = false;
      this.mostrarDetalle = false;
      this.infiniteScrollDisabled = false;
      this.busquedaGuias = true;
    }, 500);
  }
}
