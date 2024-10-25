import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://desarrollo.act.cl/ACTServicios/api/apiApp.php';
  
  constructor(private http: HttpClient) {}

  enviarDatos(datos: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.baseUrl, datos, { headers });
  }
}