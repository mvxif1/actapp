import { Component, ViewChild, ElementRef} from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import  SignaturePad  from 'signature_pad';
import jsPDF from 'jspdf';
import { DbService } from 'src/app/services/db.service';


@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {
  @ViewChild('canvas', { static: true }) signaturePadElement!: ElementRef;
  signaturePad: any;
  signatureImage: any;
  constructor(private db: DbService, private elementRef: ElementRef) { }

  ngOnInit(){
    const canvas: any = this.elementRef.nativeElement.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height= window.innerHeight -140;
    console.log(canvas.width, ' - ', canvas.height);
    if (this.signaturePad){
      this.signaturePad.clear();
    }
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
    
    const dosdigitosprincipales = parseInt(value.slice(0, 2), 10);
    if (dosdigitosprincipales > 23) {
      value = '23' + value.slice(2);
    }
    // Insertar ":" en la tercera posición si hay al menos tres caracteres
    if (value.length >= 3) {
      value = value.slice(0, 2) + ':' + value.slice(2);
    }
    let ampm = "AM";
    if (dosdigitosprincipales >= 12) {
      ampm = "PM";
    }
    
    // Actualizar el texto del <ion-text> con el valor de ampm
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
    console.log(this.signatureImage);
  }
  limpiar(){
    this.signaturePad.clear();
  }



  async generarPDF() {
    const eventoCliente = (document.getElementById('eventoCliente') as HTMLInputElement)?.value || '';
    const tiposervicio = (document.getElementById('servicio') as HTMLSelectElement)?.value || '';
    const fecha = (document.getElementById('fecha') as HTMLInputElement)?.value || '';
    const horaInicio = (document.getElementById('horaInicio') as HTMLInputElement)?.value || '';
    const horaTermino = (document.getElementById('horaTermino') as HTMLInputElement)?.value || '';
    

    const image = await this.fotoPdf('assets/orden_de_servicio.jpeg');
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'JPEG', 0, 0, 560, 752);
    pdf.setFontSize(8),
    pdf.text(eventoCliente, 218, 81),
    pdf.text(tiposervicio, 133, 108),
    pdf.text(fecha, 465, 81),
    pdf.text(horaInicio, 471, 95),
    pdf.text(horaTermino, 483, 108);
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



