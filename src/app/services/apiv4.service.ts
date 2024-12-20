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

}
