import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://desarrollo.act.cl/ACTServicios/api/apiApp.php';
  
  constructor(private http: HttpClient) {}

  getListTickets(username: string, password: string): Observable<any> {
    // Codificar las credenciales en base64
    const token = btoa(`${username}:${password}`);

    // Configurar los headers para la solicitud POST
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    // Crear el cuerpo de la solicitud con acción y token
    const body = `ACCION=getTicketsProveedor&token=${token}`;

    // Hacer la solicitud POST
    return this.http.post(this.baseUrl, body, { headers });
  }
}