import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';
import { Network } from '@ionic-native/network/ngx';

interface Ticket {
  id: string;
  titulo: string;
  detalle: string;
  guia: string | null;
}

interface Guia {
  guia: string;
  ticket: Ticket[];
}

@Component({
  selector: 'app-despachoform',
  templateUrl: './despachoform.page.html',
  styleUrls: ['./despachoform.page.scss'],
})
export class DespachoformPage implements OnInit {
  guiaArray: Guia[] = [];
  username: string = ''; 
  password: string = '';
  base64Image: string | ArrayBuffer | null = null;

  //filtro por id
  filtroTicketArray: Guia[] = [];
  searchTerm: string = '';
  selectedGuia: Guia | null = null;
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
    private db: DbService,
    private internet: Network,
    private cdr: ChangeDetectorRef
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
        const guiaMap: { [guiaId: string]: Guia } = {};

        // Agrupar tickets por guía
        response.tickets.forEach((ticket: Ticket) => {
          if (!guiaMap[ticket.guia!]) {
            guiaMap[ticket.guia!] = { guia: ticket.guia!, ticket: [] };
          }
          guiaMap[ticket.guia!].ticket.push(ticket);
        });

        // Convertir el mapa en un array de guías
        this.guiaArray = Object.values(guiaMap);
        this.isLoading = false; 
      },
      error: (error) => {
        console.error('Error al obtener los tickets:', error);
        this.isLoading = false;
      },
    });
  }
  

  filtrarTicket(event: any) {
    this.isLoading = true;
    this.cdr.detectChanges();  // Forzar la detección de cambios
  
    const query = event.target.value.toLowerCase(); 
    this.filtroTicketArray = this.guiaArray.filter(ticket => 
      ticket.guia.toLowerCase().includes(query)
    );
  
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();  // Forzar la detección de cambios
    }, 500);
  }
  onGuiaSelect(guiaId: string) {
    this.selectedGuia = this.guiaArray.find(guia => guia.guia === guiaId) || null;

    if (this.selectedGuia) {
      this.filtroTicketArray = [];
    }
  }
  
  onTicketSelect(ticketId: string) {
    this.selectedTicket = this.selectedGuia?.ticket.find(ticket => ticket.id === ticketId) || null;

  }

  volverListTicket() {
    this.selectedTicket = null;
    this.filtroTicketArray = this.guiaArray;
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

      // limite de 1 foto
      if (this.photos.length > 1) {
        this.db.presentAlertN("Solamente puedes adjuntar 1 imagen"); 
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
      await this.db.presentAlertN('No hay un ticket seleccionado');
      return;
    }
  
    if (this.photos.length === 0) {
      await this.db.presentAlertN('Debe adjuntar al menos una foto para cerrar el ticket');
      return;
    }

    const archivoBase64 = this.photos[0].split(',')[1];
    const imagenTamanio = (archivoBase64.length * 3) / 4;
    const maxTamanio = 20 * 1024 * 1024; 

    if (imagenTamanio > maxTamanio) {
      await this.db.presentAlertN('La imagen seleccionada es demasiado grande. Debe ser menor a 20 MB.');
      return;
    }

    if (this.internet.type === 'none') {
      await this.db.presentAlertN('No hay conexión a internet. Por favor, conéctese a internet para cerrar el ticket.');
      return;
    }

    const confirmar = await this.db.presentAlertConfirm('¿Estás seguro de que quieres cerrar el ticket?', 'Sí', 'No');
    if (!confirmar) {
      await this.db.presentAlertN('Cancelado');
      return;
    }
    this.isLoading = true;
    const fileType = this.photos[0].split(';')[0].split('/')[1]; 
    const nombreArchivo = `imagenGUIA_${this.selectedTicket.guia}_${this.selectedTicket.id}.${fileType}`; //imagenGUIA_(GUIA)_(IDTICKET).(TIPO ARCHIVO);
  
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