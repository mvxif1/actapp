import { Component, ViewChild} from '@angular/core';
import jsPDF from 'jspdf';
@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {

  constructor() { }

  async loadImage(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
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

    const image = await this.loadImage('assets/ticket.jpg');
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'JPEG', 0, 0, 565, 792);

    pdf.setFontSize(8);
    pdf.text(eventoCliente, 161, 80);
    pdf.text(incidente, 260, 140);
    pdf.text(requerimiento, 260, 155);
    pdf.text(tiempoTraslado, 195, 115);
    pdf.text(kilometrosRecorridos, 195, 124);
    pdf.text(eventoACT, 260, 200);
    pdf.text(cliente, 260, 215);
    pdf.text(fecha, 260, 230);
    pdf.text(horaInicio, 260, 245);
    pdf.text(horaTermino, 260, 260);

    pdf.text(clienteSite, 260, 275);
    pdf.text(contacto, 260, 290);
    pdf.text(telefonoContacto, 260, 305);
    pdf.text(direccion, 260, 320);

    pdf.text(marca, 260, 335);
    pdf.text(equipo, 260, 350);
    pdf.text(modelo, 260, 365);
    pdf.text(partNumber, 260, 380);
    pdf.text(serie, 260, 395);
    pdf.text(ip, 260, 410);
    pdf.text(versionSO, 260, 425);
    pdf.text(contadorPaginas, 260, 440);
    pdf.text(contadorPaginasRadio, 260, 455);
    pdf.text(kitMantenimiento, 260, 470);

    pdf.save('orden_de_servicio.pdf');
  }


}
