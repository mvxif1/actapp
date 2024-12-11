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

  getItemsTicket(username: string, password: string, idticket: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getItemsTicket&token=${token}&idticket=${idticket}`;
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
}
