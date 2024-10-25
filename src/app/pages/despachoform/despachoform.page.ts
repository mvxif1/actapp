import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ApiService } from 'src/app/services/api.service';
import { DbService } from 'src/app/services/db.service';

@Component({
  selector: 'app-despachoform',
  templateUrl: './despachoform.page.html',
  styleUrls: ['./despachoform.page.scss'],
})
export class DespachoformPage implements OnInit {
  photos: string[] = [];

  loading: boolean = false;

  loadingImage: boolean = false;
  formulario!: FormGroup;
  datos = {
    nombre: '',
    clave: ''
  }
  http: any;
  constructor(private db: DbService,private camera: Camera, private apiService: ApiService, private formBuilder: FormBuilder) {
    this.formulario = this.formBuilder.group({
      nombre: [''],
      clave: [''],
    })
   }

  ngOnInit() {
  }

  enviarFormulario() {
    const url = 'https://desarrollo.act.cl/ACTServicios/api/apiApp.php';
    const datos = this.formulario.value;

    this.http.post(url, datos).subscribe(
      (respuesta: any) => {
        console.log('Respuesta del servidor:', respuesta);
      },
      (error: any) => {
        console.error('Error:', error);
      }
    );
  }

  fechaHoy() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
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
  async cerrarTicket(){
    const confirmado = await this.db.presentAlertConfirm("¿Estás seguro de que vas a cerrar el ticket?", "Si", "No")
    if(confirmado){
      this.db.presentAlertP("Has cerrado el ticket con exito!");
    }else{
      this.db.presentAlertN("Cancelado!");
    }
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