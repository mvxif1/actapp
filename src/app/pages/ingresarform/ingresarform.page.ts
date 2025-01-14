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
  itemtype: any;
  
}

interface DetalleM{
  contact_num: any;
  serial: any;
  name: any;
  networks_id: any;
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

  idTarea: any;
  contrato: string = '';
  tipoitem: string = '';
  itilcategories: any;
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

  selectedBackup: Modelo | null = null;
  backupActivo: boolean = false;
  isModalOpen = false;
  conexionBackup: string = 'DESCONOCIDO';
  conexionBackups: string = 'DESCONOCIDO'; 
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

  // Método para ocultar el loading
  async ocultarCarga(loading: any) {
    await loading.dismiss();
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
    canvas.width = canvas.parentElement.offsetWidth - 25;
    canvas.height = 200;
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
    this.route.queryParams.subscribe(params => {
      const idTicket = params['id'];
      this.itilcategories = params['itilcategories'];
      this.idTarea = params['idTarea'];
      console.log(this.idTarea);
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
      this.getItemsTicket(idTicket, this.itilcategories);
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
        this.cliente = response;
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
        console.log('Respuesta getItemsTicket: ', this.detalleHardwareReport);
        if(this.detalleHardwareReport[0].itemtype = 'Printer'){
          this.ingresarform.patchValue({ tipoequipo: 'impresion' });
          this.ingresarform.patchValue({ tipoequipobackup: 'Printer' });
        }
        this.ingresarform.patchValue({marca: this.detalleHardwareReport[0].modelo[0].comment.split('_')[0].split(' ')[0]});
        this.ingresarform.patchValue({modelo: this.detalleHardwareReport[0].modelo[0].name});
        this.ingresarform.patchValue({nserie: this.detalleHardwareReport[0].detalle[0].serial});
        if(this.detalleHardwareReport[0].detalle[0].networks_id = 1){
          this.ingresarform.patchValue({tipoconexion: 'IP'});
        }else
        if(this.detalleHardwareReport[0].detalle[0].networks_id = 2){
          this.ingresarform.patchValue({tipoconexion: 'USB'});
        }else
        if(this.detalleHardwareReport[0].detalle[0].networks_id = 3){
          this.ingresarform.patchValue({tipoconexion: 'SIN'});
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
        if(this.modelosImpresoras[0].detalle[0]?.networks_id == 1){
          this.conexionBackups = 'IP'
        }    
          console.log('Respuesta getItemsBackUp: ',this.modelosImpresoras);
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
    let hora: string | number = today.getHours();
    const minutos = String(today.getMinutes()).padStart(2, '0');
    let periodo: string;
  
    hora = String(hora).padStart(2, '0'); 
  
    if (parseInt(hora) >= 12) {
      periodo = ' PM';
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
        this.backupActivo = false;
        this.solicitaRepuesto.value = 'no';
        this.solicitarBackup.value = 'no';
      } else if (radioGroup === this.solicitaRepuesto) {
        this.utilizaRepuestosActivo = false;
        this.validarCoordinadoraRepuesto = false;
        this.validarCoordinadoraBackup = false;
        this.backupActivo = false;
        this.equipoOperativo.value = 'no';
        this.solicitarBackup.value = 'no';
      } else if (radioGroup === this.solicitarBackup) {
        this.utilizaRepuestosActivo = false;
        this.validarCoordinadoraRepuesto = false;
        this.validarCoordinadoraBackup = false;
        this.backupActivo = false;
        this.equipoOperativo.value = 'no';
        this.solicitaRepuesto.value = 'no';
      }
    } else
    if(value === 'no'){
      this.backupActivo = false;
      //AQUI SE DEBE COLOCAR LOGICA PARA DESACTIVAR BOTON
    } else
    if(value === ''){
      this.equipoOperativo.value = 'no';
      this.solicitaRepuesto.value = 'no';
      this.solicitarBackup.value = 'no';
    }
  
    // Actualizar los valores del formulario
    this.ingresarform.patchValue({
      equipoOperativo: this.equipoOperativo.value,
      solicitaRepuesto: this.solicitaRepuesto.value,
      solicitarBackup: this.solicitarBackup.value
    });
  

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
      this.backupActivo = true;
      this.validarCoordinadoraBackup = true;
    } else if(this.validaCoordinadoraBackup.value === 'no'){
      this.backupActivo = false;
      this.validarCoordinadoraBackup = false;
      this.db.presentAlertN("Debes validar con coordinadora");
    }else{
      this.backupActivo = false;
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
    canvas.width = 400;
    canvas.height = 350;
    this.signaturePad = new SignaturePad(canvas, {
      penColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgba(255, 255, 255, 0)',
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

  isInformacionHardwareCompleta(): boolean | undefined {
    const tipoConexion = this.ingresarform.get('tipoconexion')?.value;
  
    return this.ingresarform.get('tipoequipo')?.valid &&
           this.ingresarform.get('marca')?.valid &&
           this.ingresarform.get('modelo')?.valid &&
           this.ingresarform.get('nserie')?.valid &&
           this.ingresarform.get('tipoconexion')?.valid &&
           (tipoConexion !== 'IP' || this.ipForm.get('ip')?.valid);
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

  mostrarErrorRepuestosOperativoNohayrepuestos(): boolean {
    return (this.ingresarform.get('equipoOperativo')?.value === 'si' && this.utilizoRepuestosform.get('utilizoRepuestos')?.value === 'si' && (this.repuestosOperativo && this.repuestosOperativo.length === 0));
  }

  isStatusServicioSolicitaRepuesto(): boolean{
    return (this.ingresarform.get('solicitaRepuesto')?.value === 'si' && this.validaCoordinadoraRepuestoForm.get('validaCoordinadoraRespuesto')?.value === '')
  }

  mostrarErrorSolicitaRepuestos(): boolean {
    return this.ingresarform.get('solicitaRepuesto')?.value === 'si' && this.validaCoordinadoraRepuestoForm.get('validaCoordinadoraRespuesto')?.value === 'si' && !this.repuestosform.valid;
  }

  mostrarErrorSolicitaRepuestosNohayrepuestos(): boolean {
    return (this.ingresarform.get('solicitaRepuesto')?.value === 'si' && this.validaCoordinadoraRepuestoForm.get('validaCoordinadoraRespuesto')?.value === 'si' && (this.repuestos && this.repuestos.length === 0));
  }

  isStatusServicioSolicitaBackup(): boolean{
    return (this.ingresarform.get('solicitarBackup')?.value === 'si' && this.validaCoordinadoraBackupForm.get('validaCoordinadoraBackup')?.value === '')
  }

  mostrarErrorSolicitaBackup(): boolean {
    return this.ingresarform.get('solicitarBackup')?.value === 'si' && this.validaCoordinadoraBackupForm.get('validaCoordinadoraBackup')?.value === 'si' && !this.selectedBackup;
  }

  mostrarErrorSolicitaBackupFormulario(): boolean {
    return this.ingresarform.get('solicitarBackup')?.value === 'si' && this.validaCoordinadoraBackupForm.get('validaCoordinadoraBackup')?.value === 'si' && !this.selectedBackup && !this.backupform.valid;
  }
  


  isDatosClienteCompleta(): boolean | undefined{
    return this.ingresarform.get('nombrecli')?.valid &&
           this.ingresarform.get('correocli')?.valid &&
           this.ingresarform.get('rutcli')?.valid;
  }


  async generarPDF() {
    try {
      // Crear el documento PDF
      const pdf = new jsPDF('p', 'pt', 'letter');

      if (this.signatureImage) {
        pdf.addImage(this.signatureImage, 'PNG', 300, 705, 100, 50);
      }
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

      const fileName = ".pdf";
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
  // Función para cerrar el modal
  cerrarModal() {
    this.isModalOpen = false;
  }

  abrirModalPrevisualizacion() {
    this.isModalOpen = true;
  }
  
  onBackupSelect(event: any) {
    const selectedId = event.detail.value; // ID del modelo seleccionado
    this.selectedBackup = this.modelosImpresoras.find(printer => printer.id === selectedId) || null;
  
    if (this.selectedBackup) {
      if (this.selectedBackup.detalle[0]?.networks_id == 1) {
        this.conexionBackup = 'IP';
      } else if (this.selectedBackup.detalle[0]?.networks_id == 2) {
        this.conexionBackup = 'USB';
      } else if (this.selectedBackup.detalle[0]?.networks_id == 3) {
        this.conexionBackup = 'SIN';
      }
    }

    this.backupActivo = this.selectedBackup !== null;
  }
  
  // Convertir PDF a base64
  convertPDFToBase64(doc: jsPDF): Promise<string> {
    return new Promise((resolve) => {
      const blob = doc.output('blob');
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]); // Devuelve solo el contenido base64
      reader.readAsDataURL(blob);
    });
  }
  

// Función para generar el PDF y enviarlo
async ejPDF() {
  const doc = new jsPDF({
    unit: 'mm',
    format: [565, 731],
    orientation: 'portrait',
  });

  const loading = await this.Cargando();

  const solicitaBackup = (document.getElementById('solicitaBackup') as HTMLIonRadioGroupElement)?.value || '';
  const equipoOperativo = (document.getElementById('equipoOperativo') as HTMLIonRadioGroupElement)?.value || '';
  const utilizoRepuestos = (document.getElementById('utilizoRepuestos') as HTMLIonRadioGroupElement)?.value || '';

  const solicitaRepuesto = (document.getElementById('solicitaRepuesto') as HTMLIonRadioGroupElement)?.value || '';
  const validaCoordinadoraRespuesto = (document.getElementById('validaCoordinadoraRespuesto') as HTMLIonRadioGroupElement)?.value || '';
  const validaCoordinadoraBackup = (document.getElementById('validaCoordinadoraBackup') as HTMLIonRadioGroupElement)?.value || '';
  
  const idTicket = this.ingresarform.get('eventocliente')?.value;
  const nombreArchivo = 'TICKET_' + idTicket + '.pdf';
  const tipoDocumento = 'OT_';

  const element = document.getElementById('contenidoHTML');

  if (element) {
    const scale = 560 / element.offsetWidth;

    // Generar el PDF y convertirlo a base64
    doc.html(element, {
      callback: async (doc) => {
        for (let i = 0; i < this.photos.length; i++) {
          const photo = this.photos[i];

          // Decodificar la imagen base64 para jsPDF
          const imgWidth = 190; // Ajusta el ancho de la imagen según el formato del PDF
          const imgHeight = 190; // Ajusta la altura de la imagen según el formato del PDF
          if (i > 0) {
            doc.addPage(); // Agregar una nueva página después de la primera
          }
          doc.addImage(photo, 'JPEG', 10, 10, imgWidth, imgHeight);
        }

        // Convertir el PDF a base64
        const pdfBase64 = await this.convertPDFToBase64(doc);
        //*********************Operativo sin problemas*********************
        if (equipoOperativo == 'si' && utilizoRepuestos == 'no') {
          const cierre = 1;
          this.apiv4.uploadDocumentTecnico(this.username, this.password, idTicket, nombreArchivo, pdfBase64, tipoDocumento, cierre).subscribe(
            async (response) => {
              this.apiv4.cierraTarea(this.username, this.password, this.idTarea).subscribe(
                (response) => {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const latitud = position.coords.latitude;
                      const longitud = position.coords.longitude;
                      const enviarMovimiento = "Trabajo realizado"
                      this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, idTicket).subscribe(
                        (response: any) => {
                          this.ocultarCarga(loading);
                          this.db.presentAlertP("Documento subido correctamente y tarea cerrada con exito!");
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
                },
                (error) => {
                  console.error("Error al cerrar la tarea (cierraTarea OPERATIVO SIN PROBLEMAS)", error);
                  this.db.presentAlertN("Error al cerrar la tarea.");
                  this.ocultarCarga(loading);
                }
              );
            },
            (error) => {
              console.error("Error al subir el documento (uploadDocumentTecnico)", error);
              this.db.presentAlertN("Error al subir el documento. Intente nuevamente.");
              this.ocultarCarga(loading);
              return;
            }
          );
        }else
        //*********************Operativo con utilizacion de repuestos*********************
        if(equipoOperativo == 'si' && utilizoRepuestos == 'si' && this.repuestosOperativo && this.repuestosOperativo.length > 0){
          const cierre = 1;
          this.apiv4.uploadDocumentTecnico(this.username, this.password, idTicket, nombreArchivo, pdfBase64, tipoDocumento, cierre).subscribe(
            async (response) => {
              console.log("Documento subido correctamente (uploadDocumentTecnico OPERATIVO CON UTILIZACION DE REPUESTOS)", response);
              this.apiv4.cierraTarea(this.username, this.password, this.idTarea).subscribe(
                (response) => {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const latitud = position.coords.latitude;
                      const longitud = position.coords.longitude;
                      const enviarMovimiento = "Trabajo realizado"
                      this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, idTicket).subscribe(
                        (response: any) => {
                          this.ocultarCarga(loading);
                          this.db.presentAlertP("Documento subido correctamente y tarea cerrada con exito!");
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
                },
                (error) => {
                  console.error("Error al cerrar la tarea (cierraTarea OPERATIVO CON UTILIZACION DE REPUESTOS)", error);
                  this.db.presentAlertN("Error al cerrar la tarea.");
                  this.ocultarCarga(loading);
                }
              );
            },
            (error) => {
              console.error("Error al subir el documento (uploadDocumentTecnico)", error);
              this.db.presentAlertN("Error al subir el documento. Intente nuevamente.");
              this.ocultarCarga(loading);
              return;
            }
          );
        };
  
        //****************Solicita repuesto del equipo*********************
        if (solicitaRepuesto === 'si' && validaCoordinadoraRespuesto === 'si' && this.repuestos && this.repuestos.length > 0) {
          const cierre = 0;
          this.apiv4.uploadDocumentTecnico(this.username, this.password, idTicket, nombreArchivo, pdfBase64, tipoDocumento, cierre).subscribe(
            async (response) => {
              this.apiv4.cierraTarea(this.username, this.password, this.idTarea).subscribe(
                (response) => {
                  const idCategoria = 29;
                  const texto = "Se solicita repuestos";
                  this.apiv4.setTareaCoordinadora(this.username, this.password, idTicket, idCategoria, texto).subscribe(
                    (response) => {
                      const titulo = "Se solicita repuestos";
                      const contenido = "Se solicitan repuestos" + this.itilcategories;
                      this.apiv4.setTicket(this.username, this.password, idTicket, titulo, contenido, this.itilcategories).subscribe(
                        (response) => {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const latitud = position.coords.latitude;
                              const longitud = position.coords.longitude;
                              const enviarMovimiento = "Trabajo realizado"
                              this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, idTicket).subscribe(
                                (response: any) => {
                                  this.ocultarCarga(loading);
                                  this.db.presentAlertP("Documento subido correctamente y tarea cerrada con exito!");
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
                        },
                        (error) => {
                          console.error("Error al crear el ticket (setTicket OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                          this.db.presentAlertN("Error al crear el ticket. Intente nuevamente.");
                          this.ocultarCarga(loading);
                        }
                      );
                    },
                    (error) => {
                      console.error("Error al asignar la tarea coordinadora (setTareaCoordinadora OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                      this.db.presentAlertN("Error al asignar la tarea coordinadora. Intente nuevamente.");
                      this.ocultarCarga(loading);
                    }
                  );
                },
                (error) => {
                  console.error("Error al cerrar la tarea (cierraTarea OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                  this.db.presentAlertN("Error al cerrar la tarea. Intente nuevamente.");
                  this.ocultarCarga(loading);
                }
              );
            },
            (error) => {
              console.error("Error al subir el documento (uploadDocumentTecnico)", error);
              this.db.presentAlertN("Error al subir el documento. Intente nuevamente.");
              this.ocultarCarga(loading);
            }
          );
        }
        
        //*********************Solicita backup para cliente (NO ESTA EN CLIENTE)*********************
        if(solicitaBackup == 'si' && validaCoordinadoraBackup == 'si'){
          const cierre = 0;
          this.apiv4.uploadDocumentTecnico(this.username, this.password, idTicket, nombreArchivo, pdfBase64, tipoDocumento, cierre).subscribe(
            async (response) => {
              this.apiv4.cierraTarea(this.username, this.password, this.idTarea).subscribe(
                (response) => {
                  const idCategoria = 30;
                  const texto = "Se solicita backup";
                  this.apiv4.setTareaCoordinadora(this.username, this.password, idTicket, idCategoria, texto).subscribe(
                    (response) => {
                      const titulo = "Se solicita despacho de backup";
                      const contenido = "Se solicita despacho de backup" + this.itilcategories;
                      this.apiv4.setTicket(this.username, this.password, idTicket, titulo, contenido, this.itilcategories).subscribe(
                        (response) => {
                          const titulo2 = "Se solicita retiro de backup";
                          const contenido2 = "Se solicita retiro de backup" + this.itilcategories;
                          this.apiv4.setTicket(this.username, this.password, idTicket, titulo2, contenido2, this.itilcategories).subscribe(
                            (response) => {
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  const latitud = position.coords.latitude;
                                  const longitud = position.coords.longitude;
                                  const enviarMovimiento = "Trabajo realizado"
                                  this.apiv4.setUbicacionGps(this.username, this.password, enviarMovimiento, longitud, latitud, idTicket).subscribe(
                                    (response: any) => {
                                      this.ocultarCarga(loading);
                                      this.db.presentAlertP("Documento subido correctamente y tarea cerrada con exito!");
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
                            },
                            (error) => {
                              console.error("Error al crear el ticket (setTicket OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                              this.db.presentAlertN("Error al crear el ticket. Intente nuevamente.");
                              this.ocultarCarga(loading);
                            }
                          );
                        },
                        (error) => {
                          console.error("Error al crear el ticket (setTicket OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                          this.db.presentAlertN("Error al crear el ticket. Intente nuevamente.");
                          this.ocultarCarga(loading);
                        }
                      );
                    },
                    (error) => {
                      console.error("Error al asignar la tarea coordinadora (setTareaCoordinadora OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                      this.db.presentAlertN("Error al asignar la tarea coordinadora. Intente nuevamente.");
                      this.ocultarCarga(loading);
                    }
                  );
                },
                (error) => {
                  console.error("Error al cerrar la tarea (cierraTarea OPERATIVO CON SOLICITA REPUESTO DEL EQUIPO)", error);
                  this.db.presentAlertN("Error al cerrar la tarea. Intente nuevamente.");
                  this.ocultarCarga(loading);
                }
              );
            },
            (error) => {
              console.error("Error al subir el documento (uploadDocumentTecnico)", error);
              this.db.presentAlertN("Error al subir el documento. Intente nuevamente.");
              this.ocultarCarga(loading);
            }
          );
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

      },
      html2canvas: {
        logging: false,
        letterRendering: true,
        scale: scale,
        width: element.offsetWidth,
        height: element.offsetHeight,
      },
    });

    this.cerrarModal();
  }
}
  
  
  

}



