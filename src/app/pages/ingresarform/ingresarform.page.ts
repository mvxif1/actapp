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

import { Component, ViewChild, ElementRef} from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import  SignaturePad  from 'signature_pad';
import jsPDF from 'jspdf';
import { DbService } from 'src/app/services/db.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonRadioGroup } from '@ionic/angular';


@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {
  @ViewChild('equipoEspera') equipoEspera!: IonRadioGroup;
  @ViewChild('equipoOperativo') equipoOperativo!: IonRadioGroup;
  @ViewChild('equipoBackup') equipoBackup!: IonRadioGroup;
  @ViewChild('canvas', { static: true }) signaturePadElement!: ElementRef;
  repuestos: { nombre: any, numeroParte: any, estado: any }[] = [];
  //Firma
  signaturePad: any;
  signatureImage: any;
  firmaIngresada: boolean = false;
  
  //Formulario
  ingresarform! : FormGroup;
  repuestosform!: FormGroup;
  
  //Caracteres restantes
  maxChars= 200;
  role= '';
  chars= 0;
  maxChars1= 200;
  role1= '';
  chars1= 0;

  pattern = {
    numeros: /^\d{1,9}$/,
    correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ptsynum: /^[1-9.]+$/,
    letras: /^[a-zA-ZñÑ\s]+$/,
    mayusnum: /^[A-Z0-9]+$/,
    letrasynum: /^[a-zA-ZñÑ0-9]+$/
  };
  constructor(private formBuilder: FormBuilder ,private db: DbService, private elementRef: ElementRef) {
    this.ingresarform = this.formBuilder.group({
      //Orden de servicio
      eventocliente: ['', [Validators.required]],
      tiposervicio: ['', [Validators.required]],
      horainicio: ['', [Validators.required]],
      //Información de cliente
      cliente: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(this.pattern.numeros)]],
      correo: ['', [Validators.required, Validators.pattern(this.pattern.correo )]],
      //Información de hardware
      tipoequipo: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      nserie: ['', [Validators.required, Validators.pattern(this.pattern.mayusnum)]],
      ip: ['', [Validators.required , Validators.pattern(this.pattern.ptsynum)]],
      accesorios: ['', [Validators.required]],
      
      //Descripcion del caso
      problemareport: ['', [Validators.maxLength(200)]],
      solucionreport:['', [Validators.maxLength(200)]],
      
      //Status de servicio
      equipoEspera: ['no', [Validators.required]],
      equipoOperativo: ['no', [Validators.required]],
      equipoBackup: ['no', [Validators.required]],

      //Datos cliente
      nombrecli: ['', [Validators.required, Validators.pattern(this.pattern.letras)]],
      rutcli: ['', [Validators.required, this.validateRutFormat.bind(this)]],
      
      //Backup instalado
      marcabackup: ['', [Validators.required]],
      modelobackup: ['', [Validators.required]],
      nseriebackup: ['', [Validators.required]],
      ipbackup: ['', [Validators.required, Validators.pattern(this.pattern.ptsynum)]],
      contadorbackup: ['', [Validators.required]]
    });

    this.repuestosform = this.formBuilder.group({
      //Repuestos
      nombreRepuesto: ['', [Validators.required]],
      nparteRepuesto: ['', [Validators.required, Validators.pattern(this.pattern.letrasynum)]],
      estadoRepuesto: ['', [Validators.required]],
    });
   }
  
  
  ngOnInit(){
    const canvas: any = this.elementRef.nativeElement.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height= window.innerHeight -140;
    console.log(canvas.width, ' - ', canvas.height);
    if (this.signaturePad){
      this.signaturePad.clear();
    }
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
  transformarAMayusculas1(event: any) {
    const inputValue = event.target.value;
    event.target.value = inputValue.toUpperCase();
    this.ingresarform.get('nseriebackup')!.setValue(inputValue.toUpperCase());
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
  
    if (todasNo) {
      // Si todas las opciones están en "NO", establecer una de ellas en "SI"
      if (radioGroup !== this.equipoEspera) {
        this.equipoEspera.value = 'si';
      } else if (radioGroup !== this.equipoOperativo) {
        this.equipoOperativo.value = 'si';
      } else if (radioGroup !== this.equipoBackup) {
        this.equipoBackup.value = 'si';
      }
    } else if (value === 'si') {
      // Si se selecciona "SI", establecer los otros grupos en "NO"
      if (radioGroup !== this.equipoEspera) {
        this.equipoEspera.value = 'no';
      }
      if (radioGroup !== this.equipoOperativo) {
        this.equipoOperativo.value = 'no';
      }
      if (radioGroup !== this.equipoBackup) {
        this.equipoBackup.value = 'no';
      }
    }
  }

  agregarRepuesto(nombre: any, numeroParte: any, estado: any) {
    this.repuestos.push({ nombre: nombre, numeroParte: numeroParte, estado: estado });
    this.db.presentAlertP("Repuesta agregado correctamente!");
  }
  borrarRepuesto(index: number){
    this.repuestos.splice(index,1);
    this.db.presentAlertP("Repuesto borrado correctamente!");
  }
  
  fechaHoy(){
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
      periodo = '    PM';
    } else {
      periodo = '    AM';
    }
    return `${hora}:${minutos}${periodo}`;
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
    if (dosdigitosfinales > 59){
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

  guardar(){
    this.signatureImage = this.signaturePad.toDataURL();
    this.db.presentAlertP("Se ha guardado correctamente la firma");
    this.firmaIngresada = true;
    console.log(this.signatureImage);
  }
  limpiar(){
    this.signaturePad.clear();
    this.firmaIngresada = false;
    this.db.presentAlertP("Se ha limpiado correctamente la firma");
  }



  async generarPDF() {
    //ORDEN DE SERVICIO
    const eventoCliente = (document.getElementById('eventoCliente') as HTMLInputElement)?.value || '';
    const tiposervicio = (document.getElementById('tipoServicio') as HTMLSelectElement)?.value || '';
    const fecha = (document.getElementById('fecha') as HTMLInputElement)?.value || '';
    const horaInicio = (document.getElementById('horaInicio') as HTMLInputElement)?.value || '';
    const ampmElement = document.getElementById('ampm') as HTMLIonTextElement;
    const ampm = ampmElement ? ampmElement.textContent || '' : '';
    const horaTermino = (document.getElementById('horaTermino') as HTMLInputElement)?.value || '';
    

    //INFORMACION DEL CLIENTE
    const cliente = (document.getElementById('cliente') as HTMLInputElement)?.value || '';
    const direccion = (document.getElementById('direccion') as HTMLInputElement)?.value || '';
    const contacto = (document.getElementById('contacto') as HTMLInputElement)?.value || '';
    const telefono = (document.getElementById('telefono') as HTMLInputElement)?.value || '';
    const correo = (document.getElementById('correo') as HTMLInputElement)?.value || '';
    const ciudad = (document.getElementById('ciudad') as HTMLInputElement)?.value || '';
    //INFORMACION DEL HARDWARE
    const tipoEquipo = (document.getElementById('tipoEquipo') as HTMLSelectElement)?.value || '';
    const marca = (document.getElementById('marca') as HTMLInputElement)?.value || '';
    const modelo = (document.getElementById('modelo') as HTMLInputElement)?.value || '';
    const nserie = (document.getElementById('nserie') as HTMLInputElement)?.value || '';
    const ip = (document.getElementById('ip') as HTMLInputElement)?.value || '';
    const accesorios = (document.getElementById('accesorios') as HTMLInputElement)?.value || '';
    
    //DESCRIPCION DEL CASO
    const problemareport = (document.getElementById('problemareport') as HTMLTextAreaElement)?.value || '';
    const solucionreport = (document.getElementById('solucionreport') as HTMLTextAreaElement)?.value || '';

    //STATUS DE SERVICIO
    const equipoEspera = (document.getElementById('equipoEspera') as HTMLIonRadioGroupElement)?.value || '';
    const equipoOperativo = (document.getElementById('equipoOperativo') as HTMLIonRadioGroupElement)?.value || '';
    const equipoBackup = (document.getElementById('equipoBackup') as HTMLIonRadioGroupElement)?.value || '';

    //REPUESTOS
    const nombreRepuesto = (document.getElementById('nombreRepuesto') as HTMLInputElement)?.value || '';
    const nparteRepuesto = (document.getElementById('nparteRepuesto') as HTMLInputElement)?.value || '';
    const estadoRepuesto = (document.getElementById('estadoRepuesto') as HTMLInputElement)?.value || '';

    //INFORMACION EQUIPO BACKUP
    const marcabackup = (document.getElementById('marcabackup') as HTMLInputElement)?.value || '';
    const modelobackup = (document.getElementById('modelobackup') as HTMLInputElement)?.value || '';
    const nseriebackup = (document.getElementById('nseriebackup') as HTMLInputElement)?.value || '';
    const ipbackup = (document.getElementById('ipbackup') as HTMLInputElement)?.value || '';
    const contadorbackup = (document.getElementById('contadorbackup') as HTMLInputElement)?.value || '';

    //DATOS CLIENTE
    const nombrecli = (document.getElementById('nombrecli') as HTMLInputElement)?.value || '';
    const rutcli = (document.getElementById('rutcli') as HTMLInputElement)?.value || '';

    const image = await this.fotoPdf('assets/orden_de_servicio.jpeg');
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'JPEG', 0, 0, 565, 731);
    pdf.setFontSize(16),
    pdf.getFontList,
    pdf.getFont,
    //ORDEN DE SERVICIO
    pdf.text(eventoCliente, 190, 85),

    pdf.setFontSize(11)

    if (tiposervicio === 'Incidente') {
      pdf.text(tiposervicio, 121, 110);
    } else {
      if(tiposervicio === 'Solicitud')
      pdf.text(tiposervicio, 121, 110
      );
    }
    pdf.text(fecha, 435, 84),
    pdf.text(horaInicio, 475, 98),
    pdf.text(ampm, 515, 98),

    pdf.text(horaTermino, 475, 110),
    //INFORMACION DEL CLIENTE
    pdf.text(cliente, 84, 157),
    pdf.text(direccion, 100, 172),
    pdf.text(ciudad, 85, 186),
    pdf.text(contacto, 292, 157),
    pdf.text(telefono, 292, 172),
    pdf.text(correo, 292, 189)
    //INFORMACION DEL HARDWARE
    pdf.setFillColor(255, 0, 0);
    if (tipoEquipo === 'impresion') {
      pdf.circle(183, 252, 7, "F"); // Coordenadas para Opción A
    } else {
      pdf.circle(222, 252, 7, "F"
      ); // Coordenadas para Opción B
    }
    pdf.text(marca, 98, 273),
    pdf.text(modelo, 98, 288),
    pdf.text(nserie, 98, 302),
    pdf.text(ip, 60, 316),
    pdf.text(accesorios, 98, 330);
  
    //DESCRIPCION DEL CASO
    const problemareportLines = pdf.splitTextToSize(problemareport, 400);
    const solucionreportLines = pdf.splitTextToSize(solucionreport, 430);

    pdf.text(problemareportLines, 145, 360);
    pdf.text(solucionreportLines, 88, 408);

    //REPUESTOS
    pdf.setFontSize(8);
    const maxRepuestos = Math.min(this.repuestos.length, 3); // Máximo de 3 repuestos o la cantidad de repuestos disponible
    let yPosition = 480; // Posición vertical inicial para los repuestos
    for (let i = 0; i < maxRepuestos; i++) {
        const repuesto = this.repuestos[i];
        pdf.text(repuesto.nombre, 55, yPosition); // Ajusta las coordenadas según lo necesites
        pdf.text(repuesto.numeroParte, 200, yPosition); // Ajusta las coordenadas según lo necesites
        pdf.text(repuesto.estado, 360, yPosition); // Ajusta las coordenadas según lo necesites
        yPosition += 10; // Incrementa la posición vertical para el siguiente repuesto
    };
    
    //INFORMACION EQUIPO BACKUP
    pdf.setFontSize(11),
    pdf.text(marcabackup, 350, 565),
    pdf.text(modelobackup, 350, 581),
    pdf.text(nseriebackup, 350, 595),
    pdf.text(ipbackup, 350, 609),
    pdf.text(contadorbackup, 350, 624);

    //STATUS DE SERVICIO
    if (equipoEspera === 'si') {
      // Coordenadas para equipoEspera
      pdf.circle(184, 555, 7, "F");
      pdf.circle(222, 570, 7, "F");
      pdf.circle(224, 586, 7, "F");
    }

    if (equipoOperativo === 'si') {
      // Coordenadas para equipoEspera
      pdf.circle(222, 555, 7, "F");
      pdf.circle(185, 570, 7, "F");
      pdf.circle(224, 586, 7, "F");
    }

    if (equipoBackup === 'si') {
      // Coordenadas para equipoEspera
      pdf.circle(222, 555, 7, "F");
      pdf.circle(222, 570, 7, "F");
      pdf.circle(184, 586, 7, "F");
    }

    pdf.text(nombrecli, 310, 650),
    pdf.text(rutcli, 310, 665);
    if (this.signatureImage) {
      pdf.addImage(this.signatureImage, 'PNG', 300, 670, 150, 60); // Ajusta las coordenadas y el tamaño según sea necesario
    }

    pdf.save(eventoCliente + ".pdf");

    const pdfBase64 = pdf.output('datauristring'); // Convertir PDF a base64
    const pdfData = pdfBase64.split(',')[1]; // Eliminar el prefijo 'data:application/pdf;base64,'
   try {
      const fileName = eventoCliente + ".pdf";
      const archivoGuardado = await Filesystem.writeFile({
        path: fileName, // Ruta completa del archivo en la carpeta de descargas
        data: pdfData,
        directory: Directory.External, // Puedes usar cualquier directorio en este caso
      });
      this.db.presentAlertP("Archivo guardado correctamente");
      console.log('Archivo guardado en descargas:', archivoGuardado.uri);
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
    }
  }
}



