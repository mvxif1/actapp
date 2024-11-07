import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';

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
  searchTerm: string = '';
  selectedTicket: Ticket | null = null;
  
  mostrarContenido = false;
  //carga (SPINNER)
  isLoading: boolean = false; 
  //carga de fotos
  photos: string[] = [];
  loadingImage!: boolean;
  constructor(
    private camera: Camera, 
    private formBuilder: FormBuilder, 
    private http: HttpClient, 
    private api: ApiService,
    private db: DbService
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
    this.isLoading = true;
    this.api.getListTickets(this.username, this.password).subscribe({
      next: (response) => {
        this.ticketsArray = response.tickets || [];
        this.filtroTicketArray = this.ticketsArray;
        this.isLoading = false; 
      },
      error: (error) => {
        console.error('Error al obtener los tickets:', error);
        this.isLoading = false;
      },
    });
  }
  

  filtrarTicket() {
    this.isLoading = true;
    this.selectedTicket = null;
  
    if (this.searchTerm.trim() === '') {
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
  despliegaContenido() {
    this.mostrarContenido = !this.mostrarContenido;
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
        this.base64Image = `data:image/jpeg;base64,${reader.result?.toString().split(',')[1]}`; //prefijo para visualizar correctamente
      };
      reader.readAsDataURL(file);
    }
  }
  

  takePhoto() {
    this.loadingImage = true;
    this.isLoading = true;
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

      // limite de 3 fotos
      if (this.photos.length > 3) {
        this.db.presentAlertN("Superaste el limite de imagenes adjuntas"); 
        this.photos.splice(0, 1);
      }
      this.loadingImage = false;
      this.isLoading = false; 
    }, (err) => {
      console.log('Error toma de foto', err);
      this.loadingImage = false;
    });
  }

  selectFromGallery() {
    this.loadingImage = true;
    this.isLoading = true;
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
      this.isLoading = false;
    }, (err) => {
      console.log('Error selecting photo', err);
      this.loadingImage = false;
    });
  }

  async deletePhoto(index: number) {
    const eliminar = await this.db.presentAlertConfirm("¿Estás seguro de que quieres borrar la foto?", "Si", "No");
    if(eliminar){
      this.db.presentAlertP("Has borrado la foto con exito!");
      this.photos.splice(index, 1);
    }else{
      this.db.presentAlertN("Cancelado!")
    } 
  }

  async cerrarTicket() {
    if (!this.selectedTicket) {
      console.error('No hay un ticket seleccionado');
      await this.db.presentAlertN('No hay un ticket seleccionado');
      return;
    }
  
    if (this.photos.length === 0) {
      console.error('No se ha adjuntado una foto');
      await this.db.presentAlertN('Debe adjuntar al menos una foto para cerrar el ticket');
      return;
    }

    const confirmar = await this.db.presentAlertConfirm('¿Estás seguro de que quieres cerrar el ticket?', 'Sí', 'No');
    if (!confirmar) {
      await this.db.presentAlertN('Cancelado');
      return;
    }
    this.isLoading = true;
    const nombreArchivo = `ticket_${this.selectedTicket.id}_cierre.jpg`;
    const archivoBase64 = this.photos[0].split(',')[1];
  
    this.api.cerrarTicket(this.username, this.password, this.selectedTicket.id, nombreArchivo, archivoBase64)
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          if (response.error === 200) {
            console.log(response.mensaje);
            await this.db.presentAlertP(`Ticket ${this.selectedTicket?.id} cerrado correctamente.`);
            this.fetchTickets();
            this.selectedTicket = null;
            this.photos = [];
          } else {
            console.error('Error al cerrar el ticket:', response.mensaje);
            await this.db.presentAlertN(`Error al cerrar el ticket: ${response.mensaje}`);
          }
        },
        error: async (error) => {
          this.isLoading = false;
          console.error('Error en la solicitud:', error);
          await this.db.presentAlertN('Hubo un problema al cerrar el ticket. Intente nuevamente.');
        }
      });
  }




  //PRUEBA
  async cerrarTicketP() {
    // Confirmación antes de cerrar el ticket
    const confirmacion = await this.db.presentAlertConfirm(
      '¿Estás seguro que quieres cerrar el ticket?',
      'Sí, cerrar ticket',
      'Cancelar'
    );
  
    if (confirmacion) {
      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = '.jpg, .jpeg, .png';
      inputFile.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target?.files?.length) {
          const file = target.files[0];
          
          //console.log('Archivo seleccionado:');
          //console.log('Nombre del archivo:', file.name);
          //console.log('Tamaño del archivo:', file.size);
          //console.log('Tipo de archivo:', file.type);
  
          // Leer el archivo seleccionado como Base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64File = reader.result as string;

            // Depurar la cadena Base64
            //console.log('Base64 del archivo:', base64File);
  
            // Eliminar el prefijo data:image/jpeg;base64, si existe
            const base64Image = base64File.split(',')[1]; // Elimina el prefijo si es necesario
            //console.log('Base64 limpio:', base64Image);
  
            // Verificar si tenemos un ticket seleccionado
            if (this.selectedTicket) {
              // Depurar los datos que se enviarán a la API
              //console.log('Enviando datos a la API:');
              //console.log('ID del Ticket:', this.selectedTicket.id);
              //console.log('Nombre del archivo:', file.name);
              //console.log('Base64 del archivo:', base64Image);
  
              // Llamar a la API para cerrar el ticket
              this.api.cerrarTicket(this.username, this.password, this.selectedTicket.id, file.name,  base64Image
              ).subscribe({
                next: (response) => {
                  console.log("Respuesta de la API: ", response);
                },
                error: (error) => {
                  // Si la API devuelve un error, mostramos un mensaje de error
                  console.error('Error al cerrar el ticket:', error);
                  this.db.presentAlertN('Error al cerrar el ticket. Intenta de nuevo.');
                }
              });
            } else {
              this.db.presentAlertN('No se ha seleccionado un ticket.');
            }
          };
          reader.readAsDataURL(file); // Convertir el archivo a base64
        } else {
          this.db.presentAlertN('No se seleccionó ningún archivo');
        }
      };
  
      // Abrir el selector de archivos
      inputFile.click();
    } else {
      this.db.presentAlertN('Operación cancelada');
    }
  }

  
}



  
  
  
  
/*  
  */
  
  
  
  
/*

    */