import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';
import { Network } from '@ionic-native/network/ngx';
import { IonModal, LoadingController } from '@ionic/angular';
import imageCompression from 'browser-image-compression';



interface Ticket {
  id: string;
  titulo: string;
  detalle: string;
  guia: string | null;
}

interface Guia {
  guia: string;
  ticket: Ticket[];
  tareaid: any;
}

interface Opciones{
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-despachoform',
  templateUrl: './despachoform.page.html',
  styleUrls: ['./despachoform.page.scss'],
})
export class DespachoformPage implements OnInit {
  @ViewChild('problemaModal') problemaModal!: IonModal;
  @ViewChild('evidenciaModal') evidenciaModal!: IonModal;

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
  selectedRetiro: any;
  selectedTicket: Ticket | null = null;
  busquedaGuias: boolean = true;

  //mostrar contenidos de botones
  mostrarDetalle = false;
  mostrarContenido = false;

  //carga (SPINNER)
  isLoading: boolean = false;

  //carga de fotos
  photos: string[] = [];
  loadingImageAdicional: boolean = false;

  additionalPhotos: string[] = [];

  id: string = '';
  //problemas con entrega
  opciones: Opciones[] = []; // Propiedad para almacenar las opciones
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
    private loadingCtrl: LoadingController
  ) {
    this.problemaForm = this.formBuilder.group({
      tipoProblema: ['', Validators.required]
    })
    this.otroProblemaForm = this.formBuilder.group({
      otroProblema: ['']
    });

  }

  ngOnInit() {
    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;
    this.fetchTickets();
    this.getProblema();
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
  
  //recarga tickets
  refreshTickets(event: any) {
    this.variablesVacias(); // Esto reinicia las variables importantes
    this.fetchTickets().then(() => {
      event.target.complete(); // Marca el refresh como completo
    });
  }
  

  //carga tickets al hacer scroll
  loadMoreTickets(event: any) {
    const nextBatchIndex = this.currentBatchIndex + this.numGuiasCarga;
    const newTickets = this.filtroTicketArray.slice(this.currentBatchIndex, nextBatchIndex);
    this.displayGuias = [...this.displayGuias, ...newTickets];
    this.currentBatchIndex = nextBatchIndex;
  
    event.target.complete();
  
    // Desactiva el scroll infinito si todas las guías han sido cargadas
    if (this.displayGuias.length >= this.filtroTicketArray.length) {
      event.target.disabled = true;
      this.infiniteScrollDisabled = true;
    }
  }
  

  async filtrarTicket(event: any) {
    console.log('Evento de búsqueda:', event.target.value);  // Verifica el valor del input
    this.isLoading = true;
    const loading = await this.Cargando();
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
      this.ocultarCarga(loading);
      this.cdr.detectChanges();
    }, 500);
  }
  
  async fetchTickets() {
    this.isLoading = true;
    const loading = await this.Cargando();
    this.api.getListTickets(this.username, this.password).subscribe(
      (response: any) => {
        console.log(response);
        this.guiaArray = response.tickets || [];
        this.guiaArray.shift();
        this.filtroTicketArray = [...this.guiaArray];
        this.displayGuias = this.filtroTicketArray.slice(0, this.numGuiasCarga);
        this.currentBatchIndex = this.numGuiasCarga; //ajuste de índice al nuevo batch cargado
        this.infiniteScrollDisabled = this.displayGuias.length >= this.filtroTicketArray.length;
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
  
  get guiasConTareaId(): number {
    return this.guiaArray.filter(guia => guia.tareaid !== undefined && guia.tareaid !== null).length;
  }
  
  onGuiaSelect(guiaId: string) {
    this.selectedGuia = this.guiaArray.find(guia => guia.guia === guiaId) || null;
    this.infiniteScrollDisabled = true;
    this.busquedaGuias = false;
    if (this.selectedGuia) {
      this.displayGuias = [];
    }
  }
  
  async retirarDespacho(guiaId: string) {
    this.isLoading = true;
    const loading = await this.Cargando();
    this.selectedRetiro = this.guiaArray.find(guia => guia.guia === guiaId) || null;
    if (this.selectedRetiro && this.selectedRetiro.ticket && this.selectedRetiro.ticket.length > 0) {
      for (const ticket of this.selectedRetiro.ticket) {
        this.api.setTareaRetiro(this.username, this.password, ticket.id).subscribe(
          (response) => {
            this.isLoading = false;
            this.ocultarCarga(loading);
            this.db.presentAlertP("Despacho retirado con exito!")
            this.fetchTickets();
            console.log(`Retiro de despacho para ticket ${ticket.id} exitoso`, response);
          },
          (error) => {
            console.error(`Error al retirar despacho para ticket ${ticket.id}`, error);
          }
        );
      }
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

  isTicketVisible(ticketId: string): boolean {
    return this.selectedTicket?.id === ticketId && this.mostrarDetalle;
  }
  
  variablesVacias() {
    this.selectedGuia = null;
    this.displayGuias = [];
    this.filtroTicketArray = [];
    this.currentBatchIndex = 0;
    this.infiniteScrollDisabled = false;
    this.isLoading = false;
    this.mostrarContenido = false;
    this.mostrarDetalle = false;
    this.photos = [];
    this.additionalPhotos = [];
    this.busquedaGuias = true;
  }
  

  async volverListTicket() {
    await this.fetchTickets();
    this.variablesVacias();
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
  

  async takePhoto() {
    this.isLoading = true;
    const loading = await this.showLoading();
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
  
    this.camera.getPicture(options).then(async (imageData) => {
      try {
        const base64Image = 'data:image/jpeg;base64,' + imageData;
        const compressedImage = await this.compressImage(base64Image); // Llama a la función de compresión
        this.photos.push(compressedImage);
  
        // Límite de 1 foto
        if (this.photos.length > 1) {
          this.db.presentAlertN("Solamente puedes adjuntar 1 imagen"); 
          this.photos.splice(0, 1);
        }
      } catch (error) {
        console.error('Error al comprimir la imagen', error);
      } finally {
        this.isLoading = false;
        this.hideLoading(loading);
      }
    }, (err) => {
      console.log('Error toma de foto', err);
      this.isLoading = false; 
      this.hideLoading(loading);
    });
  }
  
  async selectFromGallery() {
    this.isLoading = true;
    const loading = await this.showLoading();
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      saveToPhotoAlbum: false
    };
  
    this.camera.getPicture(options).then(async (imageData) => {
      try {
        const base64Image = 'data:image/jpeg;base64,' + imageData;
        const compressedImage = await this.compressImage(base64Image); // Llama a la función de compresión
        this.photos.push(compressedImage);
  
        if (this.photos.length > 10) {
          this.photos.splice(0, 1);
        }
      } catch (error) {
        console.error('Error al comprimir la imagen', error);
      } finally {
        this.isLoading = false;
        this.ocultarCarga(loading);
      }
    }, (err) => {
      console.log('Error seleccionando foto', err);
      this.isLoading = false;
      this.ocultarCarga(loading); 
    });
  }
  
  // Función genérica para comprimir imágenes
  async compressImage(base64Image: string): Promise<string> {
    const blob = this.base64ToBlob(base64Image);
  
    // Convierte el Blob en un File
    const file = new File([blob], 'image.jpg', { type: blob.type });
  
    // Comprime la imagen
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true
    });
  
    return this.blobToBase64(compressedFile);
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

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando imagen...',
      spinner: 'crescent',
      backdropDismiss: false 
    });

    await loading.present();
    return loading;
  }

  // Método para ocultar el loading
  async hideLoading(loading: any) {
    await loading.dismiss();
  }

  async takeEvidencePhoto() {
    this.loadingImageAdicional = true;
    const loading = await this.showLoading();
  
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: false,
      correctOrientation: true,
    };
  
    if (this.additionalPhotos.length >= 10) {
      this.loadingImageAdicional = false;
      await this.hideLoading(loading);
      return this.db.presentAlertN('Límite de fotos superado. n\ Solo puedes adjuntar un máximo de 10 fotos.');
    }
  
    this.camera.getPicture(options).then(async (imageData) => {
      const compressedImage = await this.compressImage('data:image/jpeg;base64,' + imageData);
      this.additionalPhotos.push(compressedImage);
  
      this.cdr.detectChanges(); // Forzar detección de cambios
      this.loadingImageAdicional = false;
      await this.hideLoading(loading);
    }, (err) => {
      console.log('Error al tomar la foto de evidencia', err);
      this.loadingImageAdicional = false;
      this.hideLoading(loading); 
    });
  }
  
  async selectEvidenceFromGallery() {
    this.loadingImageAdicional = true;
    const loading = await this.showLoading();
  
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      saveToPhotoAlbum: false,
    };
  
    if (this.additionalPhotos.length >= 10) {
      this.loadingImageAdicional = false;
      await this.hideLoading(loading);
      return this.db.presentAlertN('Límite de fotos superado. n\ Solo puedes adjuntar un máximo de 10 fotos.');
      
    }
  
    this.camera.getPicture(options).then(async (imageData) => {
      const compressedImage = await this.compressImage('data:image/jpeg;base64,' + imageData);
      this.additionalPhotos.push(compressedImage);
  
      this.cdr.detectChanges(); // Forzar detección de cambios
      this.loadingImageAdicional = false;
      await this.hideLoading(loading); // Ocultar loading después de cargar la imagen
    }, (err) => {
      console.log('Error seleccionando la foto de evidencia', err);
      this.loadingImageAdicional = false;
      this.hideLoading(loading); // Ocultar loading si ocurre un error
    });
  }
  
  

  async deletePhotoAditional(index: number) {
    const eliminar = await this.db.presentAlertConfirm("¿Estás seguro de que quieres borrar la foto?", "Si", "No");
    if(eliminar){
      this.db.presentAlertP("Has borrado la foto con exito!");
      this.additionalPhotos.splice(index, 1);
    }else{
      this.db.presentAlertN("Cancelado!")
    } 
  }

    // Conversión de Base64 a Blob
  base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      arrayBuffer[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mimeString });
  }
  
  // Conversión de Blob a Base64
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  aceptarEvidencia() {
    console.log('Evidencia Aceptada');
    this.evidenciaModal.dismiss();
  }
  
  cancelarEvidencia() {
    console.log('Operación Cancelada');
    this.additionalPhotos.splice(0, this.additionalPhotos.length);
    this.evidenciaModal.dismiss();
  }

  //************************* PROBLEMA AL ENTREGAR DESPACHO ************************************
  getProblema() {
    this.api.getListTipoProblema(this.username, this.password).subscribe({
      next: (response) => {
        this.opciones = response.opciones || [];
      },
      error: (error) => {
        console.error('Error al obtener los problemas:', error);
      },
    });
  }

    async problema() {
      const tipoProblema = this.problemaForm.get('tipoProblema')?.value;
      var descripcionProblema = tipoProblema;
    
      if (tipoProblema === 'Otros') {
        descripcionProblema = this.otroProblemaForm.get('otroProblema')?.value;
      }

      //atraves de opcion.nombre se obtiene el id con opcionSeleccionadaId.id
      const opcionSeleccionadaId = this.opciones.find(opcion => opcion.nombre === tipoProblema);
      
      for (const ticket of this.selectedGuia!.ticket) {
        this.isLoading = true;
        const loading = await this.Cargando();
  
        this.api.setTicketNota(this.username, this.password, ticket.id, descripcionProblema, opcionSeleccionadaId!.id).subscribe({
          next: (response) =>{
            console.log(response);
            this.ocultarCarga(loading);
            this.variablesVacias();
            this.db.presentAlertP("Problema al entregar enviado correctamente!")
            
          }
        });
      }
    }
  
    isAceptarEnabled(): boolean {
      const tipoProblema = this.problemaForm.get('tipoProblema')!.value;
      const otroProblema = this.otroProblemaForm.get('otroProblema')!.value;
      
      return (tipoProblema && (tipoProblema !== 'Otro' || (tipoProblema === 'Otro' && otroProblema.trim().length > 0)));
    }
  
    onInputText(): void {
      this.isAceptarEnabled();
    }
  
    aceptarProblema() {
      const tipoProblema = this.problemaForm.get('tipoProblema')!.value;
      let descripcionProblema = tipoProblema;
  
      if (tipoProblema === 'Otro') {
        descripcionProblema = this.otroProblemaForm.get('otroProblema')!.value;
        if (!descripcionProblema || descripcionProblema.trim() === '') {
          this.db.presentAlertN('Por favor, escribe una descripción del problema.');
          return;
        }
      }
  
      this.problemaModal.dismiss().then(() => {
        this.problemaForm.get('tipoProblema')?.reset();
      });
      this.problema();
    }
  
    cancelarProblema() {
      this.problemaModal.dismiss().then(() => {
        this.problemaForm.get('tipoProblema')?.reset();
      });
    }
    //*************************************************************//  

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
  
    if (this.internet.type === 'none') {
      await this.db.presentAlertN('No hay conexión a internet. Por favor, conéctese a internet para cerrar los tickets.');
      return;
    }
  
    const archivoBase64 = this.photos[0].split(',')[1];
  
    this.isLoading = true;
    const loading = await this.Cargando();
  
    if (this.selectedGuia && this.selectedGuia.ticket.length > 0) {
      const ticketPromises = this.selectedGuia.ticket.map(ticket => {
        const fileType = this.photos[0].split(';')[0].split('/')[1];
        const nombreArchivo = `_${this.selectedGuia!.guia}_${ticket.id}.${fileType}`;
  
        // Subir la foto principal
        const cerrarTicketPromise = this.api.cerrarTicket(this.username, this.password, ticket.id, nombreArchivo, archivoBase64).toPromise()
          .then(response => {
            if (response.error !== 200) {
              throw new Error(`Error al cerrar el ticket ${ticket.id}: ${response.mensaje}`);
            }
            console.log(`Ticket ${ticket.id} cerrado correctamente`);
          });
  
        // Subir evidencia adicional si existe
        const additionalPhotosPromises = this.additionalPhotos.map((additionalPhoto, index) => {
          const additionalArchivoBase64 = additionalPhoto.split(',')[1];
          const additionalFileType = additionalPhoto.split(';')[0].split('/')[1];
          const additionalNombreArchivo = `_${this.selectedGuia!.guia}_${ticket.id}_${index + 1}.${additionalFileType}`;
  
          return this.api.cerrarTicketAdicional(this.username, this.password, ticket.id, additionalNombreArchivo, additionalArchivoBase64).toPromise()
            .then(response => {
              if (response.error !== 200) {
                throw new Error(`Error al subir evidencia adicional para el ticket ${ticket.id}: ${response.mensaje}`);
              }
              console.log(`Evidencia adicional subida correctamente para el ticket ${ticket.id}`);
            });
        });
  
        return Promise.all([cerrarTicketPromise, ...additionalPhotosPromises]);
      });
  
      try {
        await Promise.all(ticketPromises); // Esperar a que todos los tickets y fotos se suban
        this.db.presentAlertP(`Todos los tickets de la guía ${this.selectedGuia?.guia} han sido cerrados exitosamente.`);
  
        // Borrar la guía seleccionada y resetear variables
        const index = this.guiaArray.findIndex(guia => guia.guia === this.selectedGuia?.guia);
        if (index !== -1) {
          this.guiaArray.splice(index, 1);
        }
        this.ocultarCarga(loading);
        this.variablesVacias();
      } catch (error) {
        console.error(error);
        this.db.presentAlertN('Hubo un error al cerrar los tickets o subir las fotos. Intenta de nuevo.');
        this.isLoading = false;
        this.ocultarCarga(loading);
      }
    } else {
      this.db.presentAlertN('No se ha seleccionado una guía válida o no tiene tickets.');
    }
  }
  

//EJEMPLO
async cerrarTicketPC() {
  const confirmar = await this.db.presentAlertConfirm('¿Estás seguro de que quieres cerrar todos los tickets de esta guía?', 'Sí', 'No');
  if (!confirmar) {
    await this.db.presentAlertN('Operación cancelada');
    return;
  }

  if (this.internet.type === 'none') {
    await this.db.presentAlertN('No hay conexión a internet. Por favor, conéctese a internet para cerrar los tickets.');
    return;
  }

  // Creamos un input file para seleccionar la foto
  const inputFile = document.createElement('input');
  inputFile.type = 'file';
  inputFile.accept = 'image/*';
  
  // Cuando se selecciona un archivo, lo procesamos
  inputFile.onchange = async (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = `data:image/jpeg;base64,${reader.result?.toString().split(',')[1]}`; // prefijo para visualizar correctamente
        const archivoBase64 = base64Image.split(',')[1];
        
        // Continuamos con el proceso de cerrar el ticket
        this.isLoading = true;
        const loading = await this.Cargando();

        if (this.selectedGuia && this.selectedGuia.ticket.length > 0) {
          const ticketPromises = this.selectedGuia.ticket.map(ticket => {
            const fileType = file.type.split('/')[1]; // Obtener el tipo de archivo
            const nombreArchivo = `_${this.selectedGuia!.guia}_${ticket.id}.${fileType}`;
            
            // Subir la foto principal
            const cerrarTicketPromise = this.api.cerrarTicket(this.username, this.password, ticket.id, nombreArchivo, archivoBase64).toPromise()
              .then(response => {
                if (response.error !== 200) {
                  throw new Error(`Error al cerrar el ticket ${ticket.id}: ${response.mensaje}`);
                }
                console.log(`Ticket ${ticket.id} cerrado correctamente`);
              });

            return cerrarTicketPromise;
          });

          try {
            await Promise.all(ticketPromises); // Esperar a que todos los tickets se cierren
            this.db.presentAlertP(`Todos los tickets de la guía ${this.selectedGuia?.guia} han sido cerrados exitosamente.`);

            // Borrar la guía seleccionada y resetear variables
            const index = this.guiaArray.findIndex(guia => guia.guia === this.selectedGuia?.guia);
            if (index !== -1) {
              this.guiaArray.splice(index, 1);
            }
            this.ocultarCarga(loading);
            this.variablesVacias();
          } catch (error) {
            console.error(error);
            this.db.presentAlertN('Hubo un error al cerrar los tickets o subir las fotos. Intenta de nuevo.');
            this.isLoading = false;
            this.ocultarCarga(loading);
          }
        } else {
          this.db.presentAlertN('No se ha seleccionado una guía válida o no tiene tickets.');
        }
      };
      
      // Leer el archivo como base64
      reader.readAsDataURL(file);
    }
  };

  // Abrir el input para que el usuario seleccione una imagen
  inputFile.click();
}



}
