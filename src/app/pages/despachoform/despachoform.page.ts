import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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

interface ProblemaResponse {
  opciones: string[];
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
  //carga por 10 tickets
  displayGuias: Guia[] = [];
  numGuiasCarga: number = 10;
  currentBatchIndex: number = 0; //indica indice actual para cargar mas guias
  infiniteScrollDisabled: boolean = false;

  //filtro por id
  filtroTicketArray: Guia[] = [];
  searchTerm: string = '';
  selectedGuia: Guia | null = null;
  selectedTicket: Ticket | null = null;
  busquedaGuias: boolean = true;

  //mostrar contenidos de botones
  mostrarDetalle = false;
  mostrarContenido = false;

  //carga (SPINNER)
  isLoading: boolean = false;

  //carga de fotos
  photos: string[] = [];
  loadingImage!: boolean;

  //problemas con entrega
  opciones: string[] = []; // Propiedad para almacenar las opciones
  selectedProblema: string | null = null;
  problemaForm!: FormGroup;
  otroProblemaForm!: FormGroup;
  textProblema: boolean = false;

  constructor(
    private camera: Camera, 
    private api: ApiService,
    private db: DbService,
    private internet: Network,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {
    this.problemaForm = this.formBuilder.group({
      tipoProblema: ['']
    })
    this.otroProblemaForm = this.formBuilder.group({
      otroProblema: ['']
    })
  }

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
    this.getProblema();
  }
  
  //recarga tickets
  refreshTickets(event: any) {
    this.selectedGuia = null;
    this.displayGuias = this.guiaArray;
    this.infiniteScrollDisabled = false;
    this.mostrarContenido = false;
    this.mostrarDetalle = false;
    this.busquedaGuias = true;
    this.fetchTickets();
    event.target.complete();
  }

  //carga tickets al hacer scroll
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

  fetchTickets() {
    this.isLoading = true;
    this.api.getListTickets(this.username, this.password).subscribe({
      next: (response) => {
        console.log(response);
        this.guiaArray = response.tickets || [];
        this.guiaArray.shift();
        this.filtroTicketArray = this.guiaArray;
        this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
        this.isLoading = false;
        
      },
      error: (error) => {
        console.error('Error al obtener los tickets:', error);
        this.isLoading = false;
      },
    });
  }
  

  filtrarTicket(event: any) {
    console.log('Evento de búsqueda:', event.target.value);  // Verifica el valor del input
    this.isLoading = true;
    this.selectedGuia= null;
    this.cdr.detectChanges();
  
    const query = event.target.value?.toLowerCase() || '';
    console.log('Consulta de búsqueda:', query);  // Verifica la cadena de búsqueda
  
    if (query === '') {
      this.filtroTicketArray = [...this.guiaArray];
      this.displayGuias = [...this.guiaArray];
    } else {
      this.filtroTicketArray = this.guiaArray.filter(guia => 
        guia.guia.toLowerCase().includes(query)
      );
      this.displayGuias = this.guiaArray.filter(guia => 
        guia.guia.toLowerCase().includes(query)
      );
    }
  
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }
  
  
  onGuiaSelect(guiaId: string) {
    this.selectedGuia = this.guiaArray.find(guia => guia.guia === guiaId) || null;
    this.infiniteScrollDisabled = true;
    this.busquedaGuias = false;
    if (this.selectedGuia) {
      this.displayGuias = [];
    }
  }
  
  onTicketSelect(ticketId: string) {
    if (this.selectedTicket && this.selectedTicket.id === ticketId) {
      this.mostrarDetalle = !this.mostrarDetalle;
    } else {
      this.selectedTicket = this.selectedGuia?.ticket.find(t => t.id === ticketId) || null;
      this.mostrarDetalle = true;
    }
  }
  
  

  volverListTicket() {
    this.isLoading = true;
    setTimeout(() => {
      this.selectedGuia = null;
      this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga); 
      this.isLoading = false;
      this.mostrarContenido = false;
      this.mostrarDetalle = false;
      this.infiniteScrollDisabled = false;
      this.busquedaGuias = true;
    }, 500);
  }
  

  despliegaContenido(){
    this.mostrarContenido = !this.mostrarContenido;
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


  //subida de archivo
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
      this.isLoading = false; 
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
      this.isLoading = false; 
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

  getProblema() {
    this.api.getListTipoProblema(this.username, this.password).subscribe({
      next: (response) => {
        if (response && response.opciones) {
          this.opciones = response.opciones;
        } else {
          console.error('Respuesta inesperada:', response);
        }
      },
      error: (error) => {
        console.error('Error al obtener los problemas:', error);
      },
    });
  }

  async cerrarTicket() {
    const confirmar = await this.db.presentAlertConfirm('¿Estás seguro de que quieres cerrar todos los tickets de esta guía?', 'Sí', 'No');
    if (!confirmar) {
      await this.db.presentAlertN('Operación cancelada');
      return;
    }
  
    if (this.photos.length === 0) {
      await this.db.presentAlertN('Debe adjuntar al menos una foto para cerrar los tickets.');
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
      await this.db.presentAlertN('No hay conexión a internet. Por favor, conéctese a internet para cerrar los tickets.');
      return;
    }
  
    if (this.selectedGuia && this.selectedGuia.ticket.length > 0) {
      for (const ticket of this.selectedGuia.ticket) {
        const fileType = this.photos[0].split(';')[0].split('/')[1];
        const nombreArchivo = `imagenGUIA_${this.selectedGuia.guia}_${ticket.id}.${fileType}`;
  
        this.isLoading = true;
        await this.api.cerrarTicket(this.username, this.password, ticket.id, nombreArchivo, archivoBase64).subscribe({
          next: (response) => {
            if (response.error === 200) {
              console.log(`Ticket ${ticket.id} cerrado correctamente`);
            } else {
              console.error('Error al cerrar el ticket:', response.mensaje);
              this.db.presentAlertN(`Error al cerrar el ticket ${ticket.id}: ${response.mensaje}`);
            }
          },
          error: (error) => {
            console.error(`Error al cerrar el ticket ${ticket.id}:`, error);
            this.db.presentAlertN(`Error al cerrar el ticket ${ticket.id}. Intenta de nuevo.`);
          },
        });
      }
  
      // Retirar el mensaje de éxito de aquí y moverlo dentro del setTimeout
      setTimeout(() => {
        this.db.presentAlertP(`Todos los tickets de la guía ${this.selectedGuia?.guia} han sido cerrados exitosamente.`);
        
        // Borrar la guía seleccionada
        const index = this.guiaArray.findIndex(guia => guia.guia === this.selectedGuia?.guia);
        if (index !== -1) {
          this.guiaArray.splice(index, 1);
        }
  
        this.photos = [];
        this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
        this.isLoading = false;
        this.busquedaGuias = true;
        this.selectedGuia = null;
      }, 2000);
    } else {
      this.db.presentAlertN('No se ha seleccionado una guía válida o no tiene tickets.');
    }
  }
  
  




  //PRUEBA

  problema() {
    const tipoProblema = this.problemaForm.get('tipoProblema')?.value;
    var descripcionProblema = tipoProblema;
  
    if (tipoProblema === 'Otro') {
      descripcionProblema = this.otroProblemaForm.get('otroProblema')?.value;
    }
    
    for (const ticket of this.selectedGuia!.ticket) {
      // Asegúrate de que la descripción del problema se está pasando correctamente
      this.api.setTicketNota(this.username, this.password, ticket.id, descripcionProblema).subscribe({
        next: response => {
          try {
            const jsonResponse = JSON.parse(response);
            console.log(jsonResponse);  // Intenta parsear la respuesta
          } catch (error) {
            console.error('Respuesta no es JSON:', response);
          }
        },
        error: err => {
          console.error('Error al establecer la nota para el ticket:', err);
        }
      });
      
    }
  }
  



  async cerrarTicketP() {
    // Confirmación antes de cerrar los tickets
    const confirmacion = await this.db.presentAlertConfirm(
      '¿Estás seguro que quieres cerrar todos los tickets de esta guía?',
      'Sí, cerrar tickets',
      'Cancelar'
    );
  
    if (confirmacion) {
      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = '.jpg, .jpeg, .png';
  
      this.isLoading = true;
      inputFile.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target?.files?.length) {
          const file = target.files[0];
          const reader = new FileReader();
  
          reader.onloadend = async () => {
            const base64File = reader.result as string;
            const base64Image = base64File.split(',')[1];
  
            // Verifica si hay una guía seleccionada y que tiene tickets
            if (this.selectedGuia && this.selectedGuia.ticket.length > 0) {
              // Iterar sobre cada ticket de la guía seleccionada
              for (const ticket of this.selectedGuia.ticket) {
                await this.api.cerrarTicket(this.username, this.password, ticket.id, file.name, base64Image).subscribe({
                  next: (response) => {
                    console.log(`Respuesta de la API para ticket ${ticket.id}: `, response);
                  },
                  error: (error) => {
                    console.error(`Error al cerrar el ticket ${ticket.id}:`, error);
                    this.db.presentAlertN(`Error al cerrar el ticket ${ticket.id}. Intenta de nuevo.`);
                  }
                });
              }
              //borra la guia seleccionada
              const index = this.guiaArray.findIndex(guia => guia.guia === this.selectedGuia?.guia);
              if (index !== -1) {
                this.guiaArray.splice(index, 1);
              }
  
              //recargar los tickets
              setTimeout(() => {
                this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
                this.isLoading = false;
                this.busquedaGuias = true;
                this.selectedGuia = null;
              }, 2000);
              
            } else {
              this.db.presentAlertN('No se ha seleccionado una guía válida.');
            }
          };
  
          reader.readAsDataURL(file); // Convertir el archivo a base64
        } else {
          this.db.presentAlertN('No se seleccionó ningún archivo');
        }
      };
      
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