import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://desarrollo.act.cl/ACTServicios/api/apiApp.php';
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
  
  getListTickets(username: string, password: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const body = `ACCION=getTicketsProveedor&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getListTicketsDespachados(username: string, password: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const body = `ACCION=getTicketsProveedorDespachado&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }
  
  cerrarTicket(username: string, password: string, idticket: string, nombreArchivo: string, archivoBase64: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=uploadDocumentApp&token=${token}&idticket=${idticket}&nombreArchivo=${nombreArchivo}&archivoBase64=${encodeURIComponent(archivoBase64)}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  cerrarTicketAdicional(username: string, password: string, idticket: string, nombreArchivo: string, archivoBase64: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=uploadEvidencia&token=${token}&idticket=${idticket}&nombreArchivo=${nombreArchivo}&archivoBase64=${encodeURIComponent(archivoBase64)}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  getListTipoProblema(username: string, password: string): Observable<any>{
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getTipoProblema&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  setTicketNota(username: string, password: string, idticket: string, nota: string, notaid: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTicketNota&token=${token}&idticket=${idticket}&nota=${nota}&notaid=${notaid}`;
    return this.http.post(this.baseUrl, body, { headers });
  }
  
  setTareaRetiro(username: string, password: string, idticket: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=setTareaRetiro&token=${token}&idticket=${idticket}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

}