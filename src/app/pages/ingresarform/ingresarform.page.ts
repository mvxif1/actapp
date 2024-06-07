import { Component, ViewChild, ElementRef} from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import  SignaturePad  from 'signature_pad';
import jsPDF from 'jspdf';
import { DbService } from 'src/app/services/db.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  signaturePad: any;
  signatureImage: any;
  ingresarform! : FormGroup;
  pattern = {
    numeros: /^\d{1,9}$/,
    correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    ptsynum: /^[1-9.]+$/
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
      nserie: ['', [Validators.required]],
      ip: ['', [Validators.required , Validators.pattern(this.pattern.ptsynum)]],
      accesorios: ['', [Validators.required]],

      equipoEspera: ['no', Validators.required],
      equipoOperativo: ['no', Validators.required],
      equipoBackup: ['no', Validators.required],

      nombrecli: ['', [Validators.required]],
      rutcli: ['', [Validators.required]],

    })
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
    console.log(this.signatureImage);
  }
  limpiar(){
    this.signaturePad.clear();
    this.db.presentAlertP("Se ha limpiado correctamente la firma");
  }



  async generarPDF() {
    //ORDEN DE SERVICIO
    const eventoCliente = (document.getElementById('eventoCliente') as HTMLInputElement)?.value || '';
    const tiposervicio = (document.getElementById('servicio') as HTMLSelectElement)?.value || '';
    const fecha = (document.getElementById('fecha') as HTMLInputElement)?.value || '';
    const horaInicio = (document.getElementById('horaInicio') as HTMLInputElement)?.value || '';
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

    const image = await this.fotoPdf('assets/orden_de_servicio.jpeg');
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'JPEG', 0, 0, 560, 752);
    pdf.setFontSize(8),
    //ORDEN DE SERVICIO
    pdf.text(eventoCliente, 218, 81),
    pdf.text(tiposervicio, 133, 108),
    pdf.text(fecha, 465, 81),
    pdf.text(horaInicio, 471, 95),
    pdf.text(horaTermino, 483, 108),
    //INFORMACION DEL CLIENTE
    pdf.text(cliente, 87, 155),
    pdf.text(direccion, 101, 169),
    pdf.text(ciudad, 86, 183),
    pdf.text(contacto, 292, 155),
    pdf.text(telefono, 292, 170),
    pdf.text(correo, 292, 185);
    //INFORMACION DEL HARDWARE
    if (tipoEquipo === 'impresion') {
      pdf.circle(185, 250, 10); // Coordenadas para Opción A
    } else {
      pdf.circle(222, 250, 10); // Coordenadas para Opción B
    };
    pdf.text(marca, 79, 270),
    pdf.text(modelo, 87, 284),
    pdf.text(nserie, 90, 298),
    pdf.text(ip, 62, 313),
    pdf.text(accesorios, 101, 327),
    //DESCRIPCION DEL CASO
    pdf.text(problemareport, 146, 357),
    pdf.text(solucionreport, 92, 404);
    //STATUS DE SERVICIO
    //pdf.text(equipoEspera, 218, 81),
    //pdf.text(equipoOperativo, 218, 81),
    //pdf.text(equipoBackup, 218, 81),
    //REPUESTO
    //pdf.text(nombreRepuesto, 218, 81),
    //pdf.text(nparteRepuesto, 218, 81),
    //pdf.text(estadoRepuesto, 218, 81);

    if (this.signatureImage) {
      pdf.addImage(this.signatureImage, 'PNG', 400, 660, 200, 100); // Ajusta las coordenadas y el tamaño según sea necesario
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



