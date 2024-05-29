import { Injectable } from '@angular/core';
import * as html2canvas from 'html2canvas';
import * as jspdf from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generarPDF() {
    const documentDefinition = {
      content: [
        { text: 'ORDEN DE SERVICIO', style: 'header' },
        // Aquí añades el contenido del formulario en formato de arreglo de objetos
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        }
      }
    };

    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

    pdfDocGenerator.getBuffer((buffer) => {
      const blob = new Blob([buffer], { type: 'application/pdf' });

      // Guardar el PDF en el dispositivo
      this.file.writeFile(this.file.dataDirectory, 'orden_servicio.pdf', blob, { replace: true }).then(fileEntry => {
        // Abrir el PDF
        this.fileOpener.open(fileEntry.nativeURL, 'application/pdf');
      });
    });
  }
}

