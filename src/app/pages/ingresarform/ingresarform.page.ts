const RutValidator = {
  validaRut(rutCompleto: string): boolean {
    rutCompleto = rutCompleto.replace('‐', '-');

    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto)) {
      return false;
    }

    const tmp = rutCompleto.split('-');
    const digv = tmp[1].toUpperCase();
    const rut = tmp[0];

    return this.dv(rut) === digv;
  },

  dv(T: string): string {
    let M = 0, S = 1;
    for (let i = T.length - 1; i >= 0; i--) {
      S = (S + parseInt(T.charAt(i)) * (9 - M++ % 6)) % 11;
    }
    return S ? (S - 1).toString() : 'k';
  }
};



import { Component, ViewChild, ElementRef } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import SignaturePad from 'signature_pad';
import jsPDF from 'jspdf';
import { DbService } from 'src/app/services/db.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonRadioGroup } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';

@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {
  photos: string[] = [];
  @ViewChild('equipoEspera') equipoEspera!: IonRadioGroup;
  @ViewChild('equipoOperativo') equipoOperativo!: IonRadioGroup;
  @ViewChild('equipoBackup') equipoBackup!: IonRadioGroup;

  @ViewChild('utilizoRepuestos') utilizoRepuestos!: IonRadioGroup;

  @ViewChild('canvas', { static: true }) signaturePadElement!: ElementRef;
  repuestos: { nombre: any, numeroParte: any, estado: any }[] = [];
  repuestosOperativo: { nombre: any, numeroParte: any, estado: any }[] = [];
  //Firma
  signaturePad: any;
  signatureImage: any;
  firmaIngresada: boolean = false;

  //Formulario
  ingresarform!: FormGroup;
  repuestosform!: FormGroup;
  backupform!: FormGroup;
  utilizoRepuestosform!: FormGroup;
  repuestosOperativoform!: FormGroup;

  repuestosactivado: boolean = false;
  equipoactivado: boolean = false;
  backupactivado: boolean = false;
  utilizaRepuestosActivo: boolean = false;
  utilizaRepuestosInactivo: boolean = false;
  //Caracteres restantes
  maxChars = 200;
  role = '';
  chars = 0;
  maxChars1 = 200;
  role1 = '';
  chars1 = 0;
  //Barra de carga
  loading: boolean = false; // Variable para controlar la visibilidad de la barra de carga
  loadingImage: boolean = false;
  usuario!: any;

  pattern = {
    numeros: /^\d{1,9}$/,
    correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ptsynum: /^[0-9.]+$/,
    letras: /^[a-zA-ZñÑ\s]+$/,
    mayusnum: /^[A-Z0-9]+$/,
    letrasynum: /^[a-zA-ZñÑ0-9]+$/,

  };

  constructor(private formBuilder: FormBuilder, private db: DbService, private elementRef: ElementRef, private camera: Camera, private emailComposer: EmailComposer) {
    this.ingresarform = this.formBuilder.group({
      //Orden de servicio
      eventocliente: ['', [Validators.required]],
      tiposervicio: ['', [Validators.required]],
      horainicio: ['', [Validators.required, this.validarHoras]],
      //Información de cliente
      cliente: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.maxLength(35)]],
      ciudad: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(this.pattern.numeros)]],
      correo: ['', [Validators.required, Validators.pattern(this.pattern.correo)]],
      //Información de hardware
      tipoequipo: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      otraMarca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      nserie: ['', [Validators.required, Validators.pattern(this.pattern.mayusnum)]],
      ip: ['', [Validators.pattern(this.pattern.ptsynum)]],
      accesorios: [''],

      //Descripcion del caso
      problemareport: ['', [Validators.maxLength(200)]],
      solucionreport: ['', [Validators.maxLength(200)]],

      //Status de servicio
      equipoEspera: ['no', [Validators.required]],
      equipoOperativo: ['no', [Validators.required]],
      equipoBackup: ['no', [Validators.required]],

      //Datos cliente
      nombrecli: ['', [Validators.required, Validators.pattern(this.pattern.letras)]],
      correocli: ['', [Validators.required]],
      rutcli: ['', [Validators.required, this.validateRutFormat.bind(this)]],
    });

    this.backupform = this.formBuilder.group({
      //Backup instalado
      marcabackup: ['', [Validators.required]],
      modelobackup: ['', [Validators.required]],
      nseriebackup: ['', [Validators.required]],
      ipbackup: ['', [Validators.pattern(this.pattern.ptsynum)]],
      contadorbackup: ['', [Validators.required]]
    })
    //Utiliza repuestos
    this.utilizoRepuestosform = this.formBuilder.group({
      utilizoRepuestos: ['no', [Validators.required]]
    })
    //Repuestos en caso de ser equipo operativo con repuestos
    this.repuestosOperativoform = this.formBuilder.group({
      nombreRepuestoOperativo: ['', [Validators.required]],
      nparteRepuestoOperativo: ['', [Validators.required, Validators.pattern(this.pattern.letrasynum)]],
      estadoRepuestoOperativo: ['INSTALADO'],
    })
    //Repuestos en caso de ser equipo espera de partes
    this.repuestosform = this.formBuilder.group({
      nombreRepuesto: ['', [Validators.required]],
      nparteRepuesto: ['', [Validators.required, Validators.pattern(this.pattern.letrasynum)]],
      estadoRepuesto: ['SOLICITUD'],
    });

  }


  ngOnInit() {
    this.db.getUsuarioActual().subscribe((usuario) => {
      this.usuario = usuario;
    });
    const canvas: any = this.elementRef.nativeElement.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 140;
    console.log(canvas.width, ' - ', canvas.height);
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  fechaHoy() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
  horaActual() {
    const today = new Date();
    const hora = today.getHours();
    const minutos = String(today.getMinutes()).padStart(2, '0');
    let periodo: string;
    if (hora >= 12) {
      periodo = '   PM';
    } else {
      periodo = '   AM';
    }
    return `${hora}:${minutos}${periodo}`;
  }

  validarHoras(control: AbstractControl): { [key: string]: boolean } | null {
    const horaInicioValue = control.value;
    const horaInicio = (horaInicioValue !== null && horaInicioValue !== undefined) ? horaInicioValue.toString().replace(/[^0-9]/g, '') : '';

    const horaTerminoElement = document.getElementById('horaTermino') as HTMLIonInputElement | null;

    if (horaTerminoElement) {
      const horaTerminoValue = horaTerminoElement.value;
      const horaTermino = (horaTerminoValue !== null && horaTerminoValue !== undefined) ? horaTerminoValue.toString().replace(/[^0-9]/g, '') : '';

      if (parseInt(horaInicio, 10) > parseInt(horaTermino, 10)) {
        return { 'horaInvalida': true }; // Retorna un error si la hora de inicio es mayor que la de término
      }
    }

    return null; // Si la validación pasa o no hay un elemento 'horaTermino', retorna null
  }



  formatearhora(event: any) {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, ''); // Eliminar caracteres no numéricos
    if (value.length > 4) {
      value = value.slice(0, 4); // Limitar la longitud a 4 caracteres
    }

    let dosdigitosprincipales = parseInt(value.slice(0, 2), 10);
    let dosdigitosfinales = parseInt(value.slice(2), 10);
    if (dosdigitosprincipales > 23) {
      value = '23' + value.slice(2);
      dosdigitosprincipales = 23;
    }
    if (dosdigitosfinales > 59) {
      value = value.slice(0, 2) + '59'; // Limitar los minutos a 59
      dosdigitosfinales = 59;
    }
    // Insertar ":" en la tercera posición si hay al menos tres caracteres
    if (value.length >= 3) {
      value = value.slice(0, 2) + ':' + value.slice(2);
    }
    let ampm = "AM";
    if (dosdigitosprincipales >= 12) {
      ampm = "PM";
    }
    (document.getElementById('ampm') as HTMLIonTextElement).innerText = ampm;

    input.value = value;
  }

  validateRutFormat(control: FormControl) {
    const rut = control.value;
    if (!RutValidator.validaRut(rut)) {
      return { invalidRut: true };
    }
    return null;
  }

  transformarAMayusculas(event: any) {
    const inputValue = event.target.value;
    event.target.value = inputValue.toUpperCase();
    this.ingresarform.get('nserie')!.setValue(inputValue.toUpperCase());
  }

  isGenerarPDFDisabled() {
    const { equipoEspera, equipoOperativo, equipoBackup } = this.ingresarform.value;
    // Desactivar botón si todos los valores son 'no'
    const todasNo = equipoEspera === 'no' && equipoOperativo === 'no' && equipoBackup === 'no';

    if (todasNo) return true;

    // Activar botón si equipoOperativo es 'si'
    if (equipoOperativo === 'si' && this.utilizaRepuestosActivo && this.repuestosOperativo.length > 0) return false;
    if (equipoOperativo === 'si' && this.utilizaRepuestosInactivo) return false;
    // Activar botón si equipoBackup es válido
    if (this.backupform.valid) return false;

    // Activar botón si hay repuestos y equipoEspera es 'si'
    if (equipoEspera === 'si' && this.repuestos.length > 0) return false;

    return true;
  }

  onSelected(radioGroup: IonRadioGroup, value: string) {
    // Establecer el valor del grupo actual
    radioGroup.value = value;

    // Actualizar los valores del formulario
    this.ingresarform.patchValue({
      equipoEspera: this.equipoEspera.value,
      equipoOperativo: this.equipoOperativo.value,
      equipoBackup: this.equipoBackup.value
    });

    // Verificar si todas las opciones están en "NO"
    const todasNo = Object.values(this.ingresarform.value).every(val => val === 'no');

    if (todasNo) { // Si todas las opciones están en "NO", establecer una de ellas en "SI"
      if (radioGroup !== this.equipoEspera) {
        this.equipoEspera.value = 'si';
      } else if (radioGroup !== this.equipoOperativo) {
        this.equipoOperativo.value = 'si';
        this.equipoactivado = true;
      } else if (radioGroup !== this.equipoBackup) {
        this.equipoBackup.value = 'si';
      }
    } else if (value === 'si') { // Si se selecciona "SI", establecer los otros grupos en "NO"
      if (radioGroup !== this.equipoEspera) {
        this.equipoEspera.value = 'no';
      }
      if (radioGroup !== this.equipoOperativo) {
        this.equipoOperativo.value = 'no';
        this.equipoactivado = false;
      }
      if (radioGroup !== this.equipoBackup) {
        this.equipoBackup.value = 'no';
      }
    }

    if (this.equipoOperativo.value === 'si') {
      this.equipoactivado = true;
      this.utilizaRepuestosInactivo = false;
    } else if (this.equipoOperativo.value === 'no') {
      this.utilizaRepuestosActivo = false;
      this.utilizaRepuestosInactivo = true;
      this.equipoactivado = false;
    }

  }
  seleccionarutilizarepuestos(radioGroup: IonRadioGroup, value: string) {
    // Establecer el valor del grupo actual
    radioGroup.value = value;

    // Actualizar los valores del formulario
    this.utilizoRepuestosform.patchValue({
      utilizoRepuestos: this.utilizoRepuestos.value
    });

    if (this.utilizoRepuestos.value === 'si') {
      this.utilizaRepuestosActivo = true;
      this.utilizaRepuestosInactivo = false;
    } else {
      this.utilizaRepuestosActivo = false;
      this.utilizaRepuestosInactivo = true;
    }
  }

  agregarRepuesto(nombre: any, numeroParte: any, estado: any) {
    this.repuestos.push({ nombre: nombre, numeroParte: numeroParte, estado: estado });
    this.repuestosactivado = true;
    this.db.presentAlertP("Repuesta agregado correctamente!");
  }
  borrarRepuesto(index: number) {
    this.repuestos.splice(index, 1);
    if (this.repuestos.length === 0) {
      this.repuestosactivado = false;
    }
    this.db.presentAlertP("Repuesto borrado correctamente!");
  }

  agregarRepuestoOperativo(nombre: any, numeroParte: any, estado: any) {
    this.repuestosOperativo.push({ nombre: nombre, numeroParte: numeroParte, estado: estado });
    this.repuestosactivado = true;
    this.db.presentAlertP("Repuesta agregado correctamente!");
  }
  borrarRepuestoOperativo(index: number) {
    this.repuestosOperativo.splice(index, 1);
    if (this.repuestos.length === 0) {
      this.repuestosactivado = false;
    }
    this.db.presentAlertP("Repuesto borrado correctamente!");
  }

  ngAfterViewInit() {
    const canvas: HTMLCanvasElement = this.signaturePadElement.nativeElement;
    canvas.width = 300;
    canvas.height = 200;
    this.signaturePad = new SignaturePad(canvas, {
      penColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
    });
  }

  async fotoPdf(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  }
  isCanvasBlank(): boolean {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }

  guardar() {
    this.signatureImage = this.signaturePad.toDataURL();
    this.db.presentAlertP("Se ha guardado correctamente la firma");
    this.firmaIngresada = true;
    console.log(this.signatureImage);
  }
  limpiar() {
    this.signaturePad.clear();
    this.firmaIngresada = false;
    this.db.presentAlertP("Se ha limpiado correctamente la firma");
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
      // Add the photo to the array
      this.photos.push('data:image/jpeg;base64,' + imageData);

      // Limit to 10 photos
      if (this.photos.length > 10) {
        this.photos.splice(0, 1); // Remove the first (oldest) photo
      }

      this.loadingImage = false; // Desactivar mensaje de carga
    }, (err) => {
      console.log('Error taking photo', err);
      this.loadingImage = false; // Desactivar mensaje de carga en caso de error
    });
  }

  selectFromGallery() {
    this.loadingImage = true; // Activar mensaje de carga

    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      saveToPhotoAlbum: false
    };

    this.camera.getPicture(options).then((imageData) => {
      // Add the photo to the array
      this.photos.push('data:image/jpeg;base64,' + imageData);

      // Limit to 10 photos
      if (this.photos.length > 10) {
        this.photos.splice(0, 1); // Remove the first (oldest) photo
      }

      this.loadingImage = false; // Desactivar mensaje de carga
    }, (err) => {
      console.log('Error selecting photo', err);
      this.loadingImage = false; // Desactivar mensaje de carga en caso de error
    });
  }

  deletePhoto(index: number) {
    this.photos.splice(index, 1);
  }

  async generarPDF() {
    try {
      this.loading = true;
      const eventoCliente = (document.getElementById('eventoCliente') as HTMLInputElement)?.value || '';
      const tiposervicio = (document.getElementById('tipoServicio') as HTMLSelectElement)?.value || '';
      const fecha = (document.getElementById('fecha') as HTMLInputElement)?.value || '';
      const horaInicio = (document.getElementById('horaInicio') as HTMLInputElement)?.value || '';
      const ampmElement = document.getElementById('ampm') as HTMLIonTextElement;
      const ampm = ampmElement ? ampmElement.textContent || '' : '';
      const horaTermino = (document.getElementById('horaTermino') as HTMLInputElement)?.value || '';

      const cliente = (document.getElementById('cliente') as HTMLInputElement)?.value || '';
      const direccion = (document.getElementById('direccion') as HTMLInputElement)?.value || '';
      const contacto = (document.getElementById('contacto') as HTMLInputElement)?.value || '';
      const telefono = (document.getElementById('telefono') as HTMLInputElement)?.value || '';
      const correo = (document.getElementById('correo') as HTMLInputElement)?.value || '';
      const ciudad = (document.getElementById('ciudad') as HTMLInputElement)?.value || '';

      const tipoequipo = (document.getElementById('tipoequipo') as HTMLSelectElement)?.value || '';
      const marca = (document.getElementById('marca') as HTMLSelectElement)?.value || '';
      const modelo = (document.getElementById('modelo') as HTMLInputElement)?.value || '';
      const nserie = (document.getElementById('nserie') as HTMLInputElement)?.value || '';
      const ip = (document.getElementById('ip') as HTMLInputElement)?.value || '';
      const accesorios = (document.getElementById('accesorios') as HTMLInputElement)?.value || '';

      const problemareport = (document.getElementById('problemareport') as HTMLTextAreaElement)?.value || '';
      const solucionreport = (document.getElementById('solucionreport') as HTMLTextAreaElement)?.value || '';

      const equipoEspera = (document.getElementById('equipoEspera') as HTMLIonRadioGroupElement)?.value || '';
      const equipoOperativo = (document.getElementById('equipoOperativo') as HTMLIonRadioGroupElement)?.value || '';
      const equipoBackup = (document.getElementById('equipoBackup') as HTMLIonRadioGroupElement)?.value || '';

      const nombreRepuesto = (document.getElementById('nombreRepuesto') as HTMLInputElement)?.value || '';
      const nparteRepuesto = (document.getElementById('nparteRepuesto') as HTMLInputElement)?.value || '';
      const estadoRepuesto = (document.getElementById('estadoRepuesto') as HTMLInputElement)?.value || '';

      const marcabackup = (document.getElementById('marcabackup') as HTMLInputElement)?.value || '';
      const modelobackup = (document.getElementById('modelobackup') as HTMLInputElement)?.value || '';
      const nseriebackup = (document.getElementById('nseriebackup') as HTMLInputElement)?.value || '';
      const ipbackup = (document.getElementById('ipbackup') as HTMLInputElement)?.value || '';
      const contadorbackup = (document.getElementById('contadorbackup') as HTMLInputElement)?.value || '';

      const nombrecli = (document.getElementById('nombrecli') as HTMLInputElement)?.value || '';
      const rutcli = (document.getElementById('rutcli') as HTMLInputElement)?.value || '';

      // Crear el documento PDF
      const pdf = new jsPDF('p', 'pt', 'letter');

      // Añadir página de orden de servicio
      const image = await this.fotoPdf('assets/ordenservicio.jpeg');
      pdf.addImage(image, 'JPEG', 0, 0, 565, 731);
      pdf.setFontSize(16);
      pdf.text(eventoCliente, 190, 86);
      pdf.setFontSize(11);
      if (tiposervicio === 'Incidente') {
        pdf.text(tiposervicio, 121, 110);
      } else if (tiposervicio === 'Solicitud') {
        pdf.text(tiposervicio, 121, 110);
      }
      pdf.text(fecha, 435, 84);
      pdf.text(horaInicio, 475, 98);
      pdf.text(ampm, 515, 98);
      pdf.text(horaTermino, 475, 110);
      pdf.text(cliente, 100, 157);
      pdf.setFontSize(8);
      pdf.text(direccion, 100, 172);
      pdf.setFontSize(11);
      pdf.text(ciudad, 100, 186);
      pdf.text(contacto, 292, 157);
      pdf.text(telefono, 292, 172);
      pdf.text(correo, 292, 189);
      if (tipoequipo === 'impresion') {
        pdf.circle(185, 252, 7, "F");
      } else if (tiposervicio === 'pc') {
        pdf.circle(222, 252, 7, "F");
      }
      pdf.text(marca, 98, 273);
      pdf.text(modelo, 98, 288);
      pdf.text(nserie, 98, 302);
      pdf.text(ip, 98, 316);
      pdf.text(accesorios, 98, 330);
      const problemareportLines = pdf.splitTextToSize(problemareport, 400);
      const solucionreportLines = pdf.splitTextToSize(solucionreport, 430);
      pdf.text(problemareportLines, 145, 360);
      pdf.text(solucionreportLines, 88, 408);
      pdf.setFontSize(8);
      let repuestosToUse;
      if (this.repuestos && this.repuestos.length > 0) {
        repuestosToUse = this.repuestos;
      } else if (this.repuestosOperativo && this.repuestosOperativo.length > 0) {
        repuestosToUse = this.repuestosOperativo;
      }
      if (repuestosToUse) {
        const maxRepuestos = Math.min(repuestosToUse.length, 5);
        let yPosition = 480;
        for (let i = 0; i < maxRepuestos; i++) {
          const repuesto = repuestosToUse[i];
          pdf.text(repuesto.nombre, 55, yPosition);
          pdf.text(repuesto.numeroParte, 200, yPosition);
          pdf.text(repuesto.estado, 360, yPosition);
          yPosition += 10;
        }
      }
      pdf.setFontSize(11);
      pdf.text(marcabackup, 355, 599);
      pdf.text(modelobackup, 355, 613);
      pdf.text(nseriebackup, 355, 627);
      pdf.text(ipbackup, 355, 642);
      pdf.text(contadorbackup, 355, 656);
      if (equipoEspera === 'si') {
        pdf.circle(184, 586, 7, "F");
        pdf.circle(224, 602, 7, "F");
        pdf.circle(224, 619, 7, "F");
      }
      if (equipoOperativo === 'si') {
        pdf.circle(224, 586, 7, "F");
        pdf.circle(184, 602, 7, "F");
        pdf.circle(224, 619, 7, "F");
      }
      if (equipoBackup === 'si') {
        pdf.circle(224, 586, 7, "F");
        pdf.circle(224, 602, 7, "F");
        pdf.circle(184, 619, 7, "F");
      }
      pdf.text(nombrecli, 315, 682);
      pdf.text(rutcli, 315, 697);

      if (this.signatureImage) {
        pdf.addImage(this.signatureImage, 'PNG', 420, 680, 105, 50);
      }
      pdf.text(this.usuario.nombre + ' ' + this.usuario.apellido, 85, 682);
      pdf.text(this.usuario.rut, 85, 697);

      const imgWidth = 565;
      const imgHeight = 731;

      for (let i = 0; i < this.photos.length; i++) {
        if (i > 0 || pdf.internal.pages.length > 1) {
          pdf.addPage(); // Añadir una nueva página para cada foto, excepto la primera
        }
        const imageData = this.photos[i];
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const x = (pageWidth - imgWidth) / 2;
        const y = 0;
        pdf.addImage(imageData, 'JPEG', x, y, imgWidth, imgHeight);
      }

      const pdfBase64 = pdf.output('datauristring'); // Convertir PDF a base64
      const pdfData = pdfBase64.split(',')[1]; // Eliminar el prefijo 'data:application/pdf;base64,'

      const fileName = eventoCliente + ".pdf";
      const path = `${fileName}`;
      const downloadDir = '/TK_Descargas';

      const archivoGuardado = await Filesystem.writeFile({
        path: `${downloadDir}/${path}`,
        data: pdfData,
        directory: Directory.Documents,
        recursive: true
      });

      //=============== ABRIR ARCHIVO ====================//
      await FileOpener.openFile({
        path: archivoGuardado.uri,
      });
      //================================================//

      //=============== ENVIAR CORREO====================//
      const correocliente = (document.getElementById('correocli') as HTMLInputElement)?.value || '';
      const email = {
        to: correocliente, // El correo electrónico introducido por el usuario
        attachments: [archivoGuardado.uri], // Adjuntar el archivo guardado
        subject: 'Copia - Orden de servicio ACT ',
        body: 'Se adjunta copia de orden de servicio',
        isHtml: true,
      };
      const result = await this.emailComposer.open(email);
      console.log('Correo electrónico enviado', result);
      //================================================//

      this.db.presentAlertP("Archivo guardado correctamente");

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Archivo guardado correctamente.',
            body: 'Ticket guardado en documentos.',
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });

      console.log('Archivo guardado en descargas:', archivoGuardado.uri);
      this.loading = false;
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      this.loading = false;
    }
  }

}



