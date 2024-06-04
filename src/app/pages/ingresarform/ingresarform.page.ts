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
    const incidente = (document.getElementById('incidente') as HTMLIonRadioGroupElement)?.value || '';
    const requerimiento = (document.getElementById('requerimiento') as HTMLIonRadioGroupElement)?.value || '';
    const tiempoTraslado = (document.getElementById('tiempoTraslado') as HTMLInputElement)?.value || '';
    const kilometrosRecorridos = (document.getElementById('kilometrosRecorridos') as HTMLInputElement)?.value || '';
    const eventoACT = (document.getElementById('eventoACT') as HTMLInputElement)?.value || '';
    const cliente = (document.getElementById('cliente') as HTMLInputElement)?.value || '';
    const fecha = (document.getElementById('fecha') as HTMLIonDatetimeElement)?.value || '';
    const horaInicio = (document.getElementById('horaInicio') as HTMLIonDatetimeElement)?.value || '';
    const horaTermino = (document.getElementById('horaTermino') as HTMLIonDatetimeElement)?.value || '';
    const clienteSite = (document.getElementById('clienteSite') as HTMLInputElement)?.value || '';
    const contacto = (document.getElementById('contacto') as HTMLInputElement)?.value || '';
    const telefonoContacto = (document.getElementById('telefonoContacto') as HTMLInputElement)?.value || '';
    const direccion = (document.getElementById('direccion') as HTMLInputElement)?.value || '';
    const marca = (document.getElementById('marca') as HTMLInputElement)?.value || '';
    const equipo = (document.getElementById('equipo') as HTMLInputElement)?.value || '';
    const modelo = (document.getElementById('modelo') as HTMLInputElement)?.value || '';
    const partNumber = (document.getElementById('partNumber') as HTMLInputElement)?.value || '';
    const serie = (document.getElementById('serie') as HTMLInputElement)?.value || '';
    const ip = (document.getElementById('ip') as HTMLInputElement)?.value || '';
    const versionSO = (document.getElementById('versionSO') as HTMLInputElement)?.value || '';
    const contadorPaginas = (document.getElementById('contadorPaginas') as HTMLInputElement)?.value || '';
    const contadorPaginasRadio = (document.getElementById('contadorPaginasRadio') as HTMLIonRadioGroupElement)?.value || '';
    const kitMantenimiento = (document.getElementById('kitMantenimiento') as HTMLIonRadioGroupElement)?.value || '';

    const image = await this.fotoPdf('assets/ticket.jpg');
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'JPEG', 0, 0, 565, 792);
    pdf.setFontSize(8),
    pdf.text(eventoCliente, 161, 80),
    pdf.text(incidente, 260, 140),
    pdf.text(requerimiento, 260, 155),
    pdf.text(tiempoTraslado, 195, 115),
    pdf.text(kilometrosRecorridos, 195, 124),
    pdf.text(eventoACT, 260, 200),
    pdf.text(cliente, 260, 215),
    pdf.text(fecha, 260, 230),
    pdf.text(horaInicio, 260, 245),
    pdf.text(horaTermino, 260, 260),
  
    pdf.text(clienteSite, 260, 275),
    pdf.text(contacto, 260, 290),
    pdf.text(telefonoContacto, 260, 305),
    pdf.text(direccion, 260, 320),
  
    pdf.text(marca, 260, 335),
    pdf.text(equipo, 260, 350),
    pdf.text(modelo, 260, 365),
    pdf.text(partNumber, 260, 380),
    pdf.text(serie, 260, 395),
    pdf.text(ip, 260, 410),
    pdf.text(versionSO, 260, 425),
    pdf.text(contadorPaginas, 260, 440),
    pdf.text(contadorPaginasRadio, 260, 455),
    pdf.text(kitMantenimiento, 260, 470);
    if (this.signatureImage) {
      pdf.addImage(this.signatureImage, 'PNG', 100, 500, 200, 100); // Ajusta las coordenadas y el tamaño según sea necesario
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



