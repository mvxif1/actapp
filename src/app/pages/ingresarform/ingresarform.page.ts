const RutValidator = {
  validaRut(rutCompleto: string): boolean {
    if (!rutCompleto) {
      return false;
    }
    // Reemplaza el guion largo incorrecto
    rutCompleto = rutCompleto.replace('‐', '-');

    // Modificar la expresión regular para permitir RUTs que terminen en 'K'
    if (!/^[0-9]+[-]{1}[0-9kK]{1}$/.test(rutCompleto)) {
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
    return S ? (S - 1).toString() : 'K'; // Cambia 'k' a 'K'
  }
};




import { Component, ViewChild, ElementRef } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import SignaturePad from 'signature_pad';
import { DbService } from 'src/app/services/db.service';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonRadioGroup, LoadingController } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';
import { ActivatedRoute, Router } from '@angular/router';
import { Apiv4Service } from 'src/app/services/apiv4.service';
import { Subscription } from 'rxjs';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';

interface Cliente{
  region: any;
  ciudad: any;
  direccion: any;
  firstname: any;
  idlocations_id: any;
  name: any;
}

interface Detalle{
  begin_date: any;
  duration: any;
  name: any;
  num: any;
}

interface Modelo{
  detalle: DetalleM[];
  direccion: any;
  id: any;
  items_id: any;
  itemtype: any
}

interface DetalleM{
  contact_num: any;
  serial: any;
  name: any;
}

interface ItemTicket{
  detalle: DetalleItemTicket[];
  id: any;
  direccion: any;
  itemtype: any;
  items_id: any;
  tickets_id: any;
  itilcategoria: any;
  modelo: ModeloItemTicket[];
  
}

interface DetalleItemTicket{
  name: any;
  serial: any;
  networks_id: any;
}

interface ModeloItemTicket{
  comment: any;
  name: any;
}

@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {
  photos: string[] = [];
  username: string = '';
  password: string = '';

  detalle: Detalle[] = [];
  cliente: Cliente[] = [];

  @ViewChild('equipoOperativo', { static: false }) equipoOperativo!: IonRadioGroup;
  @ViewChild('solicitaRepuesto', { static: false }) solicitaRepuesto!: IonRadioGroup;
  @ViewChild('solicitarBackup', { static: false }) solicitarBackup!: IonRadioGroup;

  @ViewChild('utilizoRepuestos') utilizoRepuestos!: IonRadioGroup;
  @ViewChild('validaCoordinadoraRespuesto') validaCoordinadoraRespuesto!: IonRadioGroup;
  @ViewChild('validaCoordinadoraBackup') validaCoordinadoraBackup!: IonRadioGroup;

  @ViewChild('contenidoHTML', { static: false }) contenidoHTML!: ElementRef;

  @ViewChild('canvas', { static: true }) signaturePadElement!: ElementRef;
  repuestos: { nombre: any, numeroParte: any, estado: any }[] = [];
  repuestosOperativo: { nombre: any, numeroParte: any, estado: any }[] = [];
  //Firma
  signaturePad: any;
  signatureImage: any;
  firmaIngresada: boolean = false;
  mostrarErrorFirma: boolean = false;

  //Formulario
  ingresarform!: FormGroup;
  repuestosform!: FormGroup;
  otramarcaForm!: FormGroup;
  ipForm!: FormGroup;
  backupform!: FormGroup;
  utilizoRepuestosform!: FormGroup;
  repuestosOperativoform!: FormGroup;
  validaCoordinadoraRepuestoForm!: FormGroup;
  validaCoordinadoraBackupForm!: FormGroup;

  repuestosactivado: boolean = false;
  utilizaRepuestosActivo: boolean = false;
  utilizaRepuestosInactivo: boolean = false;
  validarCoordinadoraRepuesto: boolean = false;
  validarCoordinadoraBackup: boolean = false;

  contrato: string = '';
  tipoitem: string = '';
  locations_id: any;
  subscriptions: Subscription = new Subscription();
  modelosImpresoras: Modelo[] = [];
  modelosComputadoras: Modelo[] = [];
  detalleHardwareReport: ItemTicket[] = [];
  lugarBackup: string = '';
  otramarcaActiva: boolean = false;
  //Caracteres restantes
  maxChars = 200;
  role = '';
  chars = 0;
  maxChars1 = 500;
  role1 = '';
  chars1 = 0;
  //Barra de carga
  loading: boolean = false; // Variable para controlar la visibilidad de la barra de carga
  loadingImage: boolean = false;

  pattern = {
    numeros: /^\d{1,9}$/,
    correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ptsynum: /^[0-9.]+$/,
    letras: /^[a-zA-ZñÑ\s]+$/,
    mayusnum: /^[A-Z0-9]+$/,
    letrasynum: /^[a-zA-ZñÑ0-9]+$/,

  };
  
  

  constructor(private formBuilder: FormBuilder, private db: DbService, private elementRef: ElementRef, private camera: Camera, private emailComposer: EmailComposer, private route: ActivatedRoute, private router: Router, private apiv4: Apiv4Service, private loadingCtrl: LoadingController) {
    this.ingresarform = this.formBuilder.group({
      //SECCION: Orden de servicio
      eventocliente: ['', [Validators.required]],
      tiposervicio: ['', [Validators.required]],
      fecha: [''],
      horainicio: ['', [Validators.required, this.validarHoras]],
      //SECCION: Información de cliente
      cliente: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      region: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(this.pattern.numeros)]],
      correo: ['', [Validators.required, Validators.pattern(this.pattern.correo)]],
      //SECCION: Información de hardware
      tipoequipo: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      nserie: ['', [Validators.required, Validators.pattern(this.pattern.mayusnum)]],
      tipoconexion: ['', [Validators.required]],
      accesorios: [''],

      //SECCION: Descripcion del caso
      problemareport: ['', [Validators.required, Validators.maxLength(200)]],
      solucionreport: ['', [Validators.required, Validators.maxLength(500)]],

      //SECCION: Status de servicio
      equipoOperativo: ['', [Validators.required]],
      solicitaRepuesto: ['', [Validators.required]],
      solicitarBackup: ['', [Validators.required]],

      tipoequipobackup: [''],
      modeloBackup: [''],

      //SECCION: Datos cliente
      nombrecli: ['', [Validators.required, Validators.pattern(this.pattern.letras)]],
      correocli: ['', [Validators.required, Validators.pattern(this.pattern.correo)]],
      rutcli: ['', [Validators.required, this.validateRutFormat.bind(this)]],
    });

    this.otramarcaForm = this.formBuilder.group({
      otraMarca: ['', [Validators.required]]
    })
    this.ipForm = this.formBuilder.group({
      ip : ['', [Validators.required, Validators.pattern(this.pattern.ptsynum)]],
    })

    this.backupform = this.formBuilder.group({
      //SECCION: Backup instalado
      marcabackup: ['', [Validators.required]],
      modelobackup: ['', [Validators.required]],
      nseriebackup: ['', [Validators.required]],
      ipbackup: ['', [Validators.pattern(this.pattern.ptsynum)]],
      contadorbackup: ['', [Validators.required]]
    })
    //SECCION: Utiliza repuestos
    this.utilizoRepuestosform = this.formBuilder.group({
      utilizoRepuestos: ['', [Validators.required]]
    })
    //SECCION: Repuestos en caso de ser equipo operativo con repuestos
    this.repuestosOperativoform = this.formBuilder.group({
      nombreRepuestoOperativo: ['', [Validators.required]],
      nparteRepuestoOperativo: ['', [Validators.required, Validators.pattern(this.pattern.letrasynum)]],
      estadoRepuestoOperativo: ['INSTALADO'],
    })
    //SECCION: Repuestos en caso de ser equipo espera de partes
    this.repuestosform = this.formBuilder.group({
      nombreRepuesto: ['', [Validators.required]],
      nparteRepuesto: ['', [Validators.required, Validators.pattern(this.pattern.letrasynum)]],
      estadoRepuesto: ['SOLICITUD'],
    });

    this.validaCoordinadoraRepuestoForm = this.formBuilder.group({
      validaCoordinadoraRespuesto: ['', [Validators.required]]
    });

    this.validaCoordinadoraBackupForm = this.formBuilder.group({
      validaCoordinadoraBackup: ['', [Validators.required]]
    });

  }

  clearFormValues(formGroup: FormGroup | FormArray) {
    if (formGroup instanceof FormGroup) {
      Object.keys(formGroup.controls).forEach(key => {
        const control = formGroup.get(key);
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.clearFormValues(control);
        } else {
          control?.setValue('');
        }
      });
    }
    else if (formGroup instanceof FormArray) {
      formGroup.controls.forEach(control => {
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.clearFormValues(control);
        } else {
          control.setValue('');
        }
      });
    }
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
  
  
  ionViewWillEnter() {
    this.clearFormValues(this.ingresarform);
    if (this.equipoOperativo) {
      this.equipoOperativo.value = ''; 
    }

    if (this.solicitaRepuesto) {
      this.solicitaRepuesto.value = ''; 
    }

    if (this.solicitarBackup) {
      this.solicitarBackup.value = ''; 
    }

    this.username = localStorage.getItem('email')!;
    this.password = localStorage.getItem('password')!;

    const canvas: any = this.elementRef.nativeElement.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 140;
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
    this.route.queryParams.subscribe(params => {
      const idTicket = params['id'];
      const itilcategories = params['itilcategories'];

      const direccionCompleta = params['direccion'];
      const partes = direccionCompleta.split(' > ');
      const direccion = partes.pop();
      const comuna = partes.pop();
      const region = partes.slice(-1).join(' ');

      this.ingresarform.patchValue({ direccion: direccion });
      this.ingresarform.patchValue({ comuna: comuna });
      this.ingresarform.patchValue({ region: region });


      const fechaCompleta= params['fecha'];
      const contrato = params['contrato'];
      const problemaReport = params['problemaReport'];
      this.contrato = contrato;
      const sanitizedProblemaReport = this.stripHTML(problemaReport);
      
      const [fecha, horaInicio] = fechaCompleta.split(' ');
      const horaFormateada = this.formatearhoraDirecto(horaInicio);
      this.getItemsTicket(idTicket, itilcategories);
      this.getDatosContrato(contrato);
      this.ingresarform.patchValue({ eventocliente: idTicket });
      this.ingresarform.patchValue({ fecha });
      this.ingresarform.patchValue({ horainicio: horaFormateada });
      this.ingresarform.patchValue({ problemareport: sanitizedProblemaReport });

      this.subscriptions.add(
        this.ingresarform.get('tipoequipobackup')?.valueChanges.subscribe((tipoItem) => {
          if (tipoItem === 'Printer') {
            this.getItemsBackUp(this.contrato, tipoItem);
          } else 
          if (tipoItem === 'Computer') {
            this.getItemsBackUp(this.contrato, tipoItem);
          }
        })
      );
    });
    
    // datos enviados de incidencias o solicitudes
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { itilcategories_id: string, tipoServicio: any, contrato: any } ;
    
    if(state?.tipoServicio === 1){
      this.ingresarform.patchValue({tiposervicio : 'Incidente'})
    } else{
      this.ingresarform.patchValue({tiposervicio : 'Solicitud'})
    }

  }

  private stripHTML(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  variablesVacios(){
    this.repuestosactivado = false;
    this.utilizaRepuestosActivo = false;
    this.utilizaRepuestosInactivo = false;
    this.validarCoordinadoraRepuesto = false;
    this.validarCoordinadoraBackup = false;
    this.firmaIngresada = false;
    this.mostrarErrorFirma = false;
  }

  getDatosContrato(idcontrato: any) {
    this.apiv4.getDatosContrato(this.username, this.password, idcontrato).subscribe(
      (response) => {
        this.cliente = [response];
        this.detalle = [response.detalle];
        console.log('Respuesta completa getDatosContrato:', this.cliente, this.detalle);
        this.ingresarform.patchValue({ cliente: (this.detalle[0].name || 'Sin valor')});
      },
      (error) => {
        console.error('Error al obtener datos del contrato:', error);
      }
    );
  }
  getItemsTicket(idticket: any, itilcategories_id: any){
    this.apiv4.getItemsTicket(this.username, this.password, idticket, itilcategories_id).subscribe(
      (response)=>{
        this.detalleHardwareReport = response.map((printer: any) => {
          if (!Array.isArray(printer.detalle)) {
            printer.detalle = [printer.detalle];
          }
          return printer;
        });
        console.log(this.detalleHardwareReport);
        if(this.detalleHardwareReport[0].itemtype = 'Printer'){
          this.ingresarform.patchValue({ tipoequipo: 'impresion' });
          this.ingresarform.patchValue({ tipoequipobackup: 'Printer' });
        }
        this.ingresarform.patchValue({marca: this.detalleHardwareReport[0].modelo[0].comment});
        this.ingresarform.patchValue({modelo: this.detalleHardwareReport[0].modelo[0].name});
        this.ingresarform.patchValue({nserie: this.detalleHardwareReport[0].detalle[0].serial});
        if(this.detalleHardwareReport[0].detalle[0].networks_id = 1){
          this.ingresarform.patchValue({tipoconexion: 'IP'});
        }

      })
  }
  
  getItemsBackUp(idcontrato: any, tipoItem: any) {
    this.apiv4.getItemsBackUp(this.username, this.password, idcontrato, tipoItem, this.locations_id).subscribe(
      (response) => {
        if (tipoItem === 'Printer') {
          this.modelosImpresoras = response.map((printer: any) => {
            if (!Array.isArray(printer.detalle)) {
              printer.detalle = [printer.detalle]; // Convertir a array
            }
            return printer;
          });
          
          console.log(this.modelosImpresoras);
        } else if (tipoItem === 'Computer') {
          this.modelosComputadoras = response;
        }
        
      }
      ,

      (error) => {
        console.error('Error al obtener datos del contrato:', error);
      }
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  volverAtras() {
    const previousUrl = localStorage.getItem('previousUrl');
    if (previousUrl) {
      this.router.navigate([previousUrl]);
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
      periodo = '  PM';
    } else {
      periodo = ' AM';
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



  formatearhoraDirecto(hora: string): string {
    let [horas, minutos] = hora.split(':').map(Number);
    const ampm = horas >= 12 ? 'PM' : 'AM';
  
    // Convertir a formato de 24 horas
    if (horas > 24) horas -= 24;
    if (horas === 0) horas = 24;
  
    // Retornar la hora formateada con AM/PM
    return `${this.pad(horas)}:${this.pad(minutos)} ${ampm}`;
  }
  
  obtenerAMPM(hora: string): string {
    const horas = parseInt(hora.split(':')[0], 10);
    return horas >= 24 ? 'PM' : 'AM';
  }

  // Función para agregar un cero a números menores de 10
  pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
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

  marca(){
    const marca = this.ingresarform.get('marca')!.value;
    if (marca === 'OTRO') {
      this.otramarcaForm.enable();
      if (this.otramarcaForm.valid && this.otramarcaForm.enabled){
        return false;
      } else {
        return true;
      }
    }

    this.otramarcaForm.disable();
    if (this.ingresarform.valid){
      return false;
    }

    if (marca === ''){
      return true;
    }

    return true;
  }

  tipoconexion() {
    const tipoconexion = this.ingresarform.get('tipoconexion')!.value;
    
    if (tipoconexion === 'IP') {
      this.ipForm.enable();
      // Si el formulario IP está habilitado y válido, el botón debe estar habilitado (retorna false para no estar deshabilitado)
      return !(this.ipForm.valid && this.ipForm.enabled);
    } 
  
    this.ipForm.disable();
  
    // Si el formulario principal es válido, el botón debe estar habilitado (retorna false para no estar deshabilitado)
    if (this.ingresarform.valid) {
      return false;
    }
  
    // Si el tipo de conexión está vacío, el botón debe estar deshabilitado (retorna true)
    if (tipoconexion === '') {
      return true;
    }
  
    // Por defecto, el botón está deshabilitado
    return true;
  }
  

  onSelected(radioGroup: IonRadioGroup, value: string) {
    if (value === 'si') {
      if (radioGroup === this.equipoOperativo) {
        this.utilizaRepuestosActivo = false;
        this.validarCoordinadoraRepuesto = false;
        this.validarCoordinadoraBackup = false;
        this.solicitaRepuesto.value = 'no';
        this.solicitarBackup.value = 'no';
      } else if (radioGroup === this.solicitaRepuesto) {
        this.utilizaRepuestosActivo = false;
        this.validarCoordinadoraRepuesto = false;
        this.validarCoordinadoraBackup = false;
        this.equipoOperativo.value = 'no';
        this.solicitarBackup.value = 'no';
      } else if (radioGroup === this.solicitarBackup) {
        this.utilizaRepuestosActivo = false;
        this.validarCoordinadoraRepuesto = false;
        this.validarCoordinadoraBackup = false;
        this.equipoOperativo.value = 'no';
        this.solicitaRepuesto.value = 'no';
      }
    }
  
    // Actualizar los valores del formulario
    this.ingresarform.patchValue({
      equipoOperativo: this.equipoOperativo.value,
      solicitaRepuesto: this.solicitaRepuesto.value,
      solicitarBackup: this.solicitarBackup.value
    });
  

  }

  getUbicacion(printer: any): string {
    if (this.cliente[0].direccion === printer) {
      return "En Cliente";
    } else {
      return "En Bodega";
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

  selectValidaCoordinadoraRepuesto(radioGroup: IonRadioGroup, value: string) {
    // Establecer el valor del grupo actual
    radioGroup.value = value;

    // Actualizar los valores del formulario
    this.validaCoordinadoraRepuestoForm.patchValue({
      validaCoordinadoraRespuesto: this.validaCoordinadoraRespuesto.value
    });

    if (this.validaCoordinadoraRespuesto.value === 'si') {
      this.validarCoordinadoraRepuesto = true;
    } else if(this.validaCoordinadoraRespuesto.value === 'no'){
      this.validarCoordinadoraRepuesto = false;
      this.db.presentAlertN("Debes validar con coordinadora");
    }else{
      this.validarCoordinadoraRepuesto = false;
    }
  }

  selectValidaCoordinadoraBackup(radioGroup: IonRadioGroup, value: string){
    radioGroup.value = value;
    
    this.validaCoordinadoraBackupForm.patchValue({
      validaCoordinadoraBackup: this.validaCoordinadoraBackup.value
    });

    if (this.validaCoordinadoraBackup.value === 'si') {
      this.validarCoordinadoraBackup = true;
    } else if(this.validaCoordinadoraBackup.value === 'no'){
      this.validarCoordinadoraBackup = false;
      this.db.presentAlertN("Debes validar con coordinadora");
    }else{
      this.validarCoordinadoraBackup = false;
    }
  }
  
  //Solicitar repuesto y validado por coordinadora
  agregarRepuesto(nombre: any, numeroParte: any, estado: any) {
    this.repuestos.push({ nombre: nombre, numeroParte: numeroParte, estado: estado });
    this.repuestosactivado = true;
    this.db.presentAlertP("Repuesta agregado solicitado correctamente!");
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
    canvas.width = 500;
    canvas.height = 250;
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
    if (this.isCanvasBlank()) {
      this.mostrarErrorFirma = false;
    } else {
      this.signatureImage = this.signaturePad.toDataURL();
      this.db.presentAlertP("Se ha guardado correctamente la firma");
      this.firmaIngresada = true;
      this.mostrarErrorFirma = true;
      console.log(this.signatureImage);
    }
  }

  limpiar() {
    this.signaturePad.clear();
    this.firmaIngresada = false;
    this.mostrarErrorFirma = false;
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

  isFormularioCompleto(): boolean | undefined{
    // Validar cada sección del formulario y devolver false si alguna sección no está completa
    return this.isOrdenServicioCompleta() &&
           this.isInformacionClienteCompleta() &&
           this.isInformacionHardwareCompleta() &&
           this.isDescripcionCasoCompleta() &&
           this.isStatusServicioCompleta() &&
           this.isDatosClienteCompleta();
  }

  isOrdenServicioCompleta(): boolean | undefined {
    return this.ingresarform.get('eventocliente')?.valid &&
           this.ingresarform.get('tiposervicio')?.valid &&
           this.ingresarform.get('horainicio')?.valid;
  }

  isInformacionClienteCompleta(): boolean | undefined{
    return this.ingresarform.get('cliente')?.valid &&
           this.ingresarform.get('direccion')?.valid &&
           this.ingresarform.get('region')?.valid &&
           this.ingresarform.get('contacto')?.valid &&
           this.ingresarform.get('telefono')?.valid &&
           this.ingresarform.get('correo')?.valid;
  }

  isInformacionHardwareCompleta(): boolean | undefined{
    return this.ingresarform.get('tipoequipo')?.valid &&
           this.ingresarform.get('marca')?.valid &&
           this.ingresarform.get('modelo')?.valid &&
           this.ingresarform.get('nserie')?.valid &&
           this.ingresarform.get('tipoconexion')?.valid 
  }

  isDescripcionCasoCompleta(): boolean | undefined{
    return this.ingresarform.get('problemareport')?.valid &&
           this.ingresarform.get('solucionreport')?.valid;
  }

  isStatusServicioCompleta(): boolean | undefined{
    return (this.ingresarform.get('solicitaBackup')?.value === 'si') ||
           (this.ingresarform.get('solicitaRepuesto')?.value === 'si') ||
           (this.ingresarform.get('equipoOperativo')?.value === 'si') ||
           (this.ingresarform.get('solicitarBackup')?.value === 'si');
  }
  isStatusServicioEquipoOperativo(): boolean | undefined{
    return (this.ingresarform.get('equipoOperativo')?.value === 'si' && this.utilizoRepuestosform.get('utilizoRepuestos')?.value === '')
  }

  mostrarErrorRepuestosOperativo(): boolean {
    return this.ingresarform.get('equipoOperativo')?.value === 'si' && this.utilizoRepuestosform.get('utilizoRepuestos')?.value === 'si' && !this.repuestosOperativoform.valid;
  }

  mostrarErrorBackup(): boolean {
    return this.ingresarform.get('solicitaRepuesto')?.value === 'si' && !this.backupform.valid;
  }

  mostrarErrorRepuestos(): boolean {
    return this.ingresarform.get('solicitaBackup')?.value === 'si' && !this.repuestosform.valid;
  }

  mostrarErrorRepuestosOperativoNohayrepuestos(): boolean {
    return (this.ingresarform.get('equipoOperativo')?.value === 'si' && this.utilizoRepuestosform.get('utilizoRepuestos')?.value === 'si' && (this.repuestosOperativo && this.repuestosOperativo.length === 0));
  }

  mostrarErrorRepuestosNohayrepuestos(): boolean {
    return this.ingresarform.get('solicitaBackup')?.value === 'si' && (this.repuestos && this.repuestos.length === 0);
  }

  isDatosClienteCompleta(): boolean | undefined{
    return this.ingresarform.get('nombrecli')?.valid &&
           this.ingresarform.get('correocli')?.valid &&
           this.ingresarform.get('rutcli')?.valid;
  }


  async generarPDF() {
    try {
      const eventoCliente = (document.getElementById('eventoCliente') as HTMLInputElement)?.value || '';
      const tiposervicio = (document.getElementById('tipoServicio') as HTMLSelectElement)?.value || '';
      const fecha = (document.getElementById('fecha') as HTMLInputElement)?.value || '';
      const horaInicio = (document.getElementById('horaInicio') as HTMLInputElement)?.value || '';
      const ampmElement = document.getElementById('ampm') as HTMLIonTextElement;
      const ampm = ampmElement ? ampmElement.textContent || '':'';
      const horaTermino = (document.getElementById('horaTermino') as HTMLInputElement)?.value || '';

      const cliente = (document.getElementById('cliente') as HTMLInputElement)?.value || '';
      const direccion = (document.getElementById('direccion') as HTMLInputElement)?.value || '';
      const contacto = (document.getElementById('contacto') as HTMLInputElement)?.value || '';
      const telefono = (document.getElementById('telefono') as HTMLInputElement)?.value || '';
      const correo = (document.getElementById('correo') as HTMLInputElement)?.value || '';
      const region = (document.getElementById('region') as HTMLInputElement)?.value || '';

      const tipoequipo = (document.getElementById('tipoequipo') as HTMLSelectElement)?.value || '';

      const marca = (document.getElementById('marca') as HTMLSelectElement)?.value || '';
      
      const modelo = (document.getElementById('modelo') as HTMLInputElement)?.value || '';
      const nserie = (document.getElementById('nserie') as HTMLInputElement)?.value || '';

      const tipoconexion = (document.getElementById('tipoconexion') as HTMLSelectElement)?.value || '';
      const ip = (document.getElementById('ip') as HTMLInputElement)?.value || '';

      const accesorios = (document.getElementById('accesorios') as HTMLInputElement)?.value || '';

      const problemareport = (document.getElementById('problemareport') as HTMLTextAreaElement)?.value || '';
      const solucionreport = (document.getElementById('solucionreport') as HTMLTextAreaElement)?.value || '';

      const solicitaBackup = (document.getElementById('solicitaBackup') as HTMLIonRadioGroupElement)?.value || '';
      const equipoOperativo = (document.getElementById('equipoOperativo') as HTMLIonRadioGroupElement)?.value || '';
      const utilizoRepuestos = (document.getElementById('utilizoRepuestos') as HTMLIonRadioGroupElement)?.value || '';
      
      const solicitaRepuesto = (document.getElementById('solicitaRepuesto') as HTMLIonRadioGroupElement)?.value || '';
      const validaCoordinadoraRespuesto = (document.getElementById('validaCoordinadoraRespuesto') as HTMLIonRadioGroupElement)?.value || '';
      const solicitarBackup = (document.getElementById('solicitarBackup') as HTMLIonRadioGroupElement)?.value || '';
      const validaCoordinadoraBackup = (document.getElementById('validaCoordinadoraBackup') as HTMLIonRadioGroupElement)?.value || '';


      const nombreRepuesto = (document.getElementById('nombreRepuesto') as HTMLInputElement)?.value || '';
      const nparteRepuesto = (document.getElementById('nparteRepuesto') as HTMLInputElement)?.value || '';
      const estadoRepuesto = (document.getElementById('estadoRepuesto') as HTMLInputElement)?.value || '';

      const nombrecli = (document.getElementById('nombrecli') as HTMLInputElement)?.value || '';
      const rutcli = (document.getElementById('rutcli') as HTMLInputElement)?.value || '';

      //Generacion de PDF con GLPI

      //*********************Operativo sin problemas*********************
      if(equipoOperativo == 'si' &&  utilizoRepuestos == 'no'){
        this.apiv4.uploadDocumentTecnico
        this.apiv4.cierraTarea
        console.log(" cierre ticket estado 5, cierre tarea original");
        return;
      }else
      //*********************Operativo con utilizacion de repuestos*********************
      if(equipoOperativo == 'si' && utilizoRepuestos == 'si' && this.repuestos && this.repuestos.length > 0){
        this.apiv4.uploadDocumentTecnico
        this.apiv4.cierraTarea
        
        //recorre repuestos
        let repuestosToUse;
        if (this.repuestosOperativo && this.repuestosOperativo.length > 0) {
          repuestosToUse = this.repuestosOperativo;
        }
        if (repuestosToUse) {
          const maxRepuestos = Math.min(repuestosToUse.length, 5);
          let yPosition = 587;
          for (let i = 0; i < maxRepuestos; i++) {
            const repuesto = repuestosToUse[i];
            //pdf.text(repuesto.nombre, 75, yPosition);
            //pdf.text(repuesto.numeroParte, 215, yPosition);
            //pdf.text(repuesto.estado, 360, yPosition);
            yPosition += 10;
          }
        }
        return;
      };

      //****************Solicita repuesto del equipo*********************
      if(solicitaRepuesto == 'si' && validaCoordinadoraRespuesto == 'si'){
        //recorre repuestos
        let repuestosToUse;
        if (this.repuestos && this.repuestos.length > 0) {
          repuestosToUse = this.repuestos;
        }
        if (repuestosToUse) {
          const maxRepuestos = Math.min(repuestosToUse.length, 5);
          let yPosition = 587;
          for (let i = 0; i < maxRepuestos; i++) {
            const repuesto = repuestosToUse[i];
            //pdf.text(repuesto.nombre, 75, yPosition);
            //pdf.text(repuesto.numeroParte, 215, yPosition);
            //pdf.text(repuesto.estado, 360, yPosition);
            yPosition += 10;
          }
        }
        this.apiv4.uploadDocumentTecnico
        this.apiv4.cierraTarea
        this.apiv4.setTareaCoordinadora
        this.apiv4.setTicket
        return;
      }
      //*********************Solicita backup para cliente (NO ESTA EN CLIENTE)*********************
      if(solicitaBackup == 'si' && validaCoordinadoraBackup == 'si'){
        this.apiv4.uploadDocumentTecnico
        this.apiv4.cierraTarea
        this.apiv4.setTareaCoordinadora
        //ticket de despacho backup
        this.apiv4.setTicket
        //ticket de retiro backup
        this.apiv4.setTicket
        return;
      }
      //*********************Solicita backup para cliente (ESTÁ EN CLIENTE)*********************
      if(solicitaBackup == 'si' && validaCoordinadoraBackup == 'si'){
        this.apiv4.uploadDocumentTecnico
        this.apiv4.cierraTarea
        this.apiv4.setTareaCoordinadora
        //ticket de despacho backup
        this.apiv4.setTicket
        //ticket de retiro backup
        this.apiv4.setTicket
        return;
      }

      // Crear el documento PDF
      const pdf = new jsPDF('p', 'pt', 'letter');

      // Añadir página de orden de servicio
      const image = await this.fotoPdf('assets/otservicio.jpg');
      pdf.addImage(image, 'JPEG', 0, 0, 565, 731);
      pdf.setFontSize(16);
      pdf.text(eventoCliente, 190, 74);
      pdf.setFontSize(11);
      pdf.setFont('Times');
      if (tiposervicio === 'Incidente') {
        pdf.text(tiposervicio, 127, 87);
      } else if (tiposervicio === 'Solicitud') {
        pdf.text(tiposervicio, 127, 87);
      }
      pdf.text(fecha, 475, 59);
      pdf.text(horaInicio, 475, 72);
      pdf.text(ampm, 505, 72);
      pdf.text(horaTermino, 475, 86);

      pdf.text(cliente, 110, 126);
      pdf.text(direccion, 110, 140);
      pdf.text(region, 110, 156);
      pdf.text(contacto, 372, 122);
      pdf.text(telefono, 372, 138);
      pdf.text(correo, 372, 152);
      if (tipoequipo === 'impresion') {
        pdf.circle(218, 208, 7, "F");
      } else if (tipoequipo === 'pc') {
        pdf.circle(255, 208, 7, "F");
      }
      pdf.getFontList;
      
      const otraMarca = (document.getElementById('otraMarca') as HTMLInputElement)?.value || '';
      if (marca === 'OTRO') {
        pdf.text(otraMarca, 145, 228);
      } else {
        pdf.text(marca, 145, 228);
      }
      pdf.text(modelo, 145, 243);
      pdf.text(nserie, 145, 257);
      if (tipoconexion === 'IP') {
        pdf.text(tipoconexion + ': ' + ip, 145, 272);
      } else {
        pdf.text(tipoconexion, 145, 272)
      }
      pdf.text(accesorios, 145, 286);
      const problemareportLines = pdf.splitTextToSize(problemareport, 400);
      const solucionreportLines = pdf.splitTextToSize(solucionreport, 430);
      pdf.text(problemareportLines, 145, 316);
      pdf.text(solucionreportLines, 90, 352);
      pdf.setFontSize(8);
      pdf.setFontSize(11);
      if (solicitaBackup === 'si') {
        pdf.circle(217, 466, 7, "F");
        pdf.circle(257, 482, 7, "F");
        pdf.circle(257, 498, 7, "F");
        pdf.circle(257, 514, 7, "F");
      }
      if (solicitarBackup === 'si') {
        pdf.circle(257, 466, 7, "F");
        pdf.circle(217, 482, 7, "F");
        pdf.circle(257, 498, 7, "F");
        pdf.circle(257, 514, 7, "F");
      }
      if (equipoOperativo === 'si') {
        pdf.circle(257, 466, 7, "F");
        pdf.circle(257, 482, 7, "F");
        pdf.circle(217, 498, 7, "F");
        pdf.circle(257, 514, 7, "F");
      }
      if (solicitaRepuesto === 'si') {
        pdf.circle(257, 466, 7, "F");
        pdf.circle(257, 482, 7, "F");
        pdf.circle(257, 498, 7, "F");
        pdf.circle(217, 514, 7, "F");
      }
      pdf.text(nombrecli, 310, 690);
      pdf.text(rutcli, 310, 700);

      if (this.signatureImage) {
        pdf.addImage(this.signatureImage, 'PNG', 300, 705, 100, 50);
      }
      console.log(pdf.getFontList());
      pdf.save();
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

      const pdfBase64 = pdf.output('datauristring'); 
      const pdfData = pdfBase64.split(',')[1]; 

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
      this.db.presentAlertP("Archivo guardado correctamente");


      console.log('Archivo guardado en descargas:', archivoGuardado.uri);
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
    }
  }
  ejPDF() {
    const element = document.getElementById('contenidoHTML');
    if (element) {

      const elementWidth = element.offsetWidth; // O usa getBoundingClientRect().width
    
      console.log("El ancho del elemento es: " + elementWidth + "px");
      const options = {
        margin: [10, 10, 10, 10], 
        filename: 'documento.pdf', 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().from(element).set(options).save();
    }
  }
  
  

}



