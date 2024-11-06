import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Camera } from '@ionic-native/camera/ngx';
import { ApiService } from 'src/app/services/api.service';

interface Ticket {
  id: string;
  titulo: string;
  detalle: string;
  guia: string | null;
}

@Component({
  selector: 'app-despachoform',
  templateUrl: './despachoform.page.html',
  styleUrls: ['./despachoform.page.scss'],
})
export class DespachoformPage implements OnInit {
  ticketsArray: Ticket[] = [];
  username: string = ''; 
  password: string = '';
  base64Image: string | ArrayBuffer | null = null;

  //filtro por id
  filtroTicketArray: Ticket[] = [];
  searchTerm: string = ''; // Término de búsqueda
  selectedTicket: Ticket | null = null; // Ticket seleccionado para mostrar
  isLoading: boolean = false; // Indicador de carga
  constructor(
    private camera: Camera, 
    private formBuilder: FormBuilder, 
    private http: HttpClient, 
    private api: ApiService
  ) {}

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
  }
  
  refreshTickets(event: any) {
    this.fetchTickets();
    event.target.complete();
  }

  fetchTickets() {
    this.isLoading = true; // Mostrar spinner
    this.api.getListTickets(this.username, this.password).subscribe({
      next: (response) => {
        this.ticketsArray = response.tickets || [];
        this.filtroTicketArray = this.ticketsArray; // Inicializar con todos los tickets
        this.isLoading = false; // Ocultar spinner
      },
      error: (error) => {
        console.error('Error al obtener los tickets:', error);
        this.isLoading = false; // Ocultar spinner en caso de error
      },
    });
  }
  

  filtrarTicket() {
    this.isLoading = true;
    // Resetear el ticket seleccionado cuando se haga una nueva búsqueda
    this.selectedTicket = null;
  
    if (this.searchTerm.trim() === '') {
      // Si no hay término de búsqueda, mostrar todos los tickets
      this.filtroTicketArray = this.ticketsArray;
      this.isLoading = false;
    } else {
      // Filtrar los tickets según el término de búsqueda
      setTimeout(() => { 
        this.filtroTicketArray = this.ticketsArray.filter(ticket => 
          ticket.id.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        this.isLoading = false; 
      }, 500);
    }
  }
  
  onTicketSelect(ticketId: string) {
    // Encontramos el ticket seleccionado
    this.selectedTicket = this.ticketsArray.find(ticket => ticket.id === ticketId) || null;
  
    // Después de seleccionar el ticket, ocultamos los demás resultados de la búsqueda
    if (this.selectedTicket) {
      this.filtroTicketArray = []; // Solo mostrar el ticket seleccionado
    }
  }
  volverListTicket() {
    this.selectedTicket = null;
    this.filtroTicketArray = this.ticketsArray; // Volver a mostrar todos los tickets
  }
  


  decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  onFileSelected(event: Event, ticket: Ticket) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.base64Image = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  cerrarTicket(ticket: Ticket) {
    if (!this.base64Image || typeof this.base64Image !== 'string') {
      console.error('No hay archivo seleccionado o el formato no es válido.');
      return;
    }

    const idticket = ticket.id;
    const nombreArchivo = `GUIATicket${idticket}`;
    const archivoBase64 = this.base64Image.split(',')[1];

    this.api.cerrarTicket(this.username, this.password, idticket, nombreArchivo, archivoBase64).subscribe({
      next: (response) => {
        console.log('Respuesta de la API:', response);
      },
      error: (error) => {
        console.error('Error al cerrar el ticket:', error);
      },
    });
  }
}



  
  
  
  

  
  
  
  
/*
  takePhoto() {
    this.loadingImage = true; // Activar mensaje de carga

    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };

    this.camera.getPicture(options).then((imageData) => {
      this.photos.push('data:image/jpeg;base64,' + imageData);

      // Limit to 10 photos
      if (this.photos.length > 10) {
        this.photos.splice(0, 1);
      }

      this.loadingImage = false; 
    }, (err) => {
      console.log('Error taking photo', err);
      this.loadingImage = false;
    });
  }

  selectFromGallery() {
    this.loadingImage = true;

    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      saveToPhotoAlbum: false
    };

    this.camera.getPicture(options).then((imageData) => {
      this.photos.push('data:image/jpeg;base64,' + imageData);

      if (this.photos.length > 10) {
        this.photos.splice(0, 1); 
      }

      this.loadingImage = false; 
    }, (err) => {
      console.log('Error selecting photo', err);
      this.loadingImage = false;
    });
  }

  async deletePhoto(index: number) {
    const eliminar = await this.db.presentAlertConfirm("¿Estás seguro de que quieres borrar la foto?", "Si", "No")
    if(eliminar){
      this.db.presentAlertP("Has borrado la foto con exito!");
      this.photos.splice(index, 1);
    }else{
      this.db.presentAlertN("Cancelado!")
    }
    
  }


/*    <ion-item>
      <ion-text style="font-size: 12px;">Fecha: </ion-text>
      <ion-input id="fecha" [value]="fechaHoy()" readonly style="margin-left: 10px;"></ion-input>
    </ion-item>
    <ion-card-title style="font-size: 13px;">ADJUNTAR ARCHIVO DE CIERRE</ion-card-title>
    <ion-grid *ngIf="photos.length > 0">
      <ion-row>
        <ion-col size="6" *ngFor="let photo of photos; let i = index">
          <img [src]="photo" width="100%" height="auto">
          <div class="ion-text-center">
            <ion-button (click)="deletePhoto(i)" fill="clear" class="delete-button">
              <ion-icon name="trash-outline" style="color: white;"></ion-icon>
            </ion-button>
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
    <ion-grid *ngIf="photos.length === 0">
      <ion-item>
        <ion-row style="width: 100%;">
          <ion-col size="12"
            style="height: 230px; margin-bottom: 20px; background-color: white; border: 2px solid rgba(0, 0, 0, 0.200); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="color: gray; font-weight: 500;">
              No hay fotos
            </div>
          </ion-col>
        </ion-row>
      </ion-item>
    </ion-grid>
    <ion-item class="ion-text-center">
      <ion-button size="small" color="medium" style="width: 50%;" (click)="takePhoto()">Cámara</ion-button>
      <ion-button size="small" color="medium" style="width: 50%;" (click)="selectFromGallery()">Galería</ion-button>
    </ion-item>
  </ion-list>
  <ion-button expand="full" (click)="cerrarTicket()">Cerrar Ticket</ion-button>*/