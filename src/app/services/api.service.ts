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
  
  iniciarSesion(username: string, password: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=iniciarSesion&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }

  setUsuario(username: string, sessionToken: string): void {
    this.usuario = { username, sessionToken };
  }

  // Método para obtener el usuario actual
  getUsuario(): { username: string; sessionToken: string } | null {
    return this.usuario;
  }


  getListTickets(username: string, password: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=getTicketsProveedor&token=${token}`;
    return this.http.post(this.baseUrl, body, { headers });
  }
  
  cerrarTicket(username: string, password: string, idticket: string, nombreArchivo: string, archivoBase64: string): Observable<any> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = `ACCION=uploadDocumentApp&token=${token}&idticket=${idticket}&nombreArchivo=${nombreArchivo}&archivoBase64=${archivoBase64}`;
    return this.http.post(this.baseUrl, body, { headers });
  }
}