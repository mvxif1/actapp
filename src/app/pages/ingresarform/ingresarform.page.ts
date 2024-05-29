import { Component } from '@angular/core';
import { PdfService } from 'src/app/services/pdf.service';

@Component({
  selector: 'app-ingresarform',
  templateUrl: './ingresarform.page.html',
  styleUrls: ['./ingresarform.page.scss'],
})
export class IngresarformPage {
  eventocli: string = '';
  requerimiento: string = '';
  tiempotr: string = '';
  kmrecorridos: string = '';
  eventoact: string = '';
  cliente: string = '';
  fecha: string = '';
  horainicio: string = '';
  horatermino: string = '';

  constructor(private pdfService: PdfService) { }


}
