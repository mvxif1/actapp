import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Apiv4Service {
  private baseUrl = 'https://desarrollo.act.cl/ACTServicios/apiv4/apiApp.php';
  private usuario: { username: string; sessionToken: string } | null = null;
  constructor(private http: HttpClient) {}
  
  iniciarSesion(username: string, password: string, uuid: string, platform: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=iniciarSesion&token=${token}&uuid=${uuid}&platform=${platform}`;
    return this.http.post(this.baseUrl, body, { headers });
  }  

  setUsuario(username: string, sessionToken: string): void {
    this.usuario = { username, sessionToken };
  }

  getUsuario(): { username: string; sessionToken: string } | null {
    return this.usuario;
  }

  getAyuda(username: string, password: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const body = `ACCION=getAyuda&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getTicketTecnico(username: string, password: string, tipo: number): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getTicketTecnico&token=${token}&tipo=${tipo}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getDetalleTicket(username: string, password: string, idticket: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getDetalleTicket&token=${token}&idticket=${idticket}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getItemsTicket(username: string, password: string, idticket: string, itilcategories_id: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getItemsTicket&token=${token}&idticket=${idticket}&itilcategories_id=${itilcategories_id}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }  

  setUbicacionGps(username: string, password: string, tipo: string, longitud: any, latitud: any, idticket: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setUbicacionGps&token=${token}&tipo=${tipo}&longitud=${longitud}&latitud=${latitud}&idticket=${idticket}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getDatosContrato(username: string, password: string, idcontrato: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getDatosContrato&token=${token}&idcontrato=${idcontrato}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }

  getItemsBackUp(username: string, password: string, idcontrato: any, tipoitem: any, locations_id: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getItemsBackUp&token=${token}&idcontrato=${idcontrato}&tipoitem=${tipoitem}&locations_id=${locations_id}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }
  
  cierraTarea(username: string, password: string, idtarea: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    console.log(idtarea);
    const body = `ACCION=CierraTarea&token=${token}&idtarea=${idtarea}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  setTareaRetiro(username: string, password: string, idticket: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTareaRetiro&token=${token}&idticket=${idticket}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }

  //Genera tarea asignado a coordinadora para retiro de maquina a laboratorio o despacho de maquina
  setTareaCoordinadora(username: string, password: string, idticket: any, idcategoria: any, texto: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTareaCoordinadora&token=${token}&idticket=${idticket}&idcategoria=${idcategoria}&texto=${texto}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }

  setTicketNota(username: string, password: string, idticket: any, nota: any, notaid: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTicketNota&token=${token}&idticket=${idticket}&nota=${nota}&notaid=${notaid}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }

  //Genera ticket de despacho o retiro asignado a coordinadora como subticket
  setTicket(username: string, password: string, idticket: any, titulo: any, contenido: any, itilcategories_id: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTicket&token=${token}&idticket=${idticket}&titulo=${titulo}&contenido=${contenido}&itilcategories_id=${itilcategories_id}`;
    
    return this.http.post(this.baseUrl, body, { headers });
  }

  //Sube evidencias y pdf (1 cierra y 0 no cierra)
  uploadDocumentTecnico(username: string, password: string, idticket: any, nombreArchivo: any, archivoBase64: any, tipoDocumento: any, cierra: any): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  
    const body = `ACCION=uploadDocumentTecnico&token=${token}&idticket=${idticket}&nombreArchivo=${nombreArchivo}&archivoBase64=${encodeURIComponent(archivoBase64)}&tipoDocumento=${tipoDocumento}&cierra=${cierra}`;
    return this.http.post(this.baseUrl, body, { headers });
  }
  
}
