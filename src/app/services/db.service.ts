import { Injectable } from '@angular/core';
import { AlertController, NavController, Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Observable, BehaviorSubject } from 'rxjs';
import { Usuario } from './usuario';
import { Rol } from './rol';
import swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class DbService {
  private rolActual: number = 0;
  public database!: SQLiteObject;
  private logueado: number = 0;
  
  tablaUsuario: string = "CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre VARCHAR(100) NOT NULL, apellido VARCHAR(100) NOT NULL, rut VARCHAR(12) NOT NULL, correo VARCHAR(100) NOT NULL UNIQUE, clave VARCHAR(256) NOT NULL, id_rol INTEGER, FOREIGN KEY (id_rol) REFERENCES rol (id_rol));";
  tablaRol: string= "CREATE TABLE IF NOT EXISTS rol(id_rol INTEGER PRIMARY KEY autoincrement, nombre VARCHAR(50) NOT NULL);";
  private usuarioActual: BehaviorSubject<Usuario | null> = new BehaviorSubject<Usuario | null>(null);
  listaUsuarios = new BehaviorSubject([]);
  listaRoles = new BehaviorSubject([]);
  private DBLista: BehaviorSubject<boolean> = new BehaviorSubject(false);
  usuario!: Usuario;
  
  constructor(private alertController: AlertController, public sqlite: SQLite, private platform: Platform, private navCtrl: NavController,) {
    this.crearBD();

  }

  dbState(){
    return this.DBLista.asObservable();
  }
  fetchUsuarios(): Observable<Usuario[]> {
    return this.listaUsuarios.asObservable();
  }
  fetchRoles(): Observable<Rol[]> {
    return this.listaRoles.asObservable();
  }


  crearBD() {
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'dbact.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.crearTablas();
      }).catch(e => {
        this.presentAlertN("Error en crear BD: " + e);
      });
    });
  }

  async crearTablas() {
    try {
      await this.database.executeSql(this.tablaUsuario,[]);
      await this.database.executeSql(this.tablaRol,[]);
      
      this.DBLista.next(true)

      this.buscarUsuarios();
    } catch (e) {
      this.presentAlertN("Error en crear Tabla: " + e);
    }
  }

    //SERVICIOS DE USUARIOS
    buscarUsuarios() {
      return this.database.executeSql('SELECT * FROM usuario', []).then(res => {
        let items: any[] = [];
        if (res.rows.length > 0) {
          for (var i = 0; i < res.rows.length; i++) {
            items.push({
              id: res.rows.item(i).id,
              nombre: res.rows.item(i).nombre,
              apellido: res.rows.item(i).apellido,
              rut: res.rows.item(i).rut,
              correo: res.rows.item(i).correo,
              clave: res.rows.item(i).clave,
              id_rol: res.rows.item(i).id_rol
            });
          }
        }
        this.fetchUsuarios();
        this.listaUsuarios.next(items as any);
        this.usuarioActual.next(items.length > 0 ? items[0] : null);
      });
    }

    modificarPerfil(id: any, nombre: any, apellido: any, correo: any) {
      return this.database.executeSql('UPDATE usuario SET nombre=?, apellido=?, correo=? WHERE id=?', [nombre, apellido, correo, id]).then(res => {
        this.buscarUsuarios();
      });
    }
    
    registrarUsuario(nombre: string, apellido: string, rut: string, correo: string, clave: string) {
      const id_rolPredeterminado = 1;
      this.database.executeSql('INSERT INTO usuario (nombre, apellido, rut, correo, clave, id_rol) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellido, rut, correo, clave, id_rolPredeterminado]).then(() => {
        this.buscarUsuarios();
        this.presentAlertP("Usuario creado exitosamente");
      }).catch(e => {
        if (e.message.includes('UNIQUE constraint failed')) {
          this.presentAlertN("El RUT o correo ya está registrado");
        } else {
          this.presentAlertN("Error al registrar el usuario: " + e.message);
        }
      });
    }
    
    async iniciarSesion(correo: string, clave: string): Promise<Usuario | false> {
      return this.database.executeSql('SELECT * FROM usuario WHERE correo = ? AND clave = ?', [correo, clave])
        .then(res => {
          if (res.rows.length > 0) {
            const usuario: Usuario = {
              id: res.rows.item(0).id,
              nombre: res.rows.item(0).nombre,
              apellido: res.rows.item(0).apellido,
              rut: res.rows.item(0).rut,
              correo: res.rows.item(0).correo,
              clave: res.rows.item(0).clave,
              id_rol: res.rows.item(0).id_rol,
            };
            return usuario;
          } else {
            return false;
          }
        })
        .catch(e => {
          this.presentAlertN('Error al iniciar sesión: ' + e);
          return false;
        });
    }
    
  setRolActual(rol: number): void {
    this.rolActual = rol;
  }
  getRolActual(): number {
    return this.rolActual;
  }
  setUsuario(usuario: Usuario) {
    this.usuario = usuario;
    this.buscarUsuarios();
  }
  getUsuarioActual(): Observable<Usuario | null> {
    return this.usuarioActual.asObservable();
  }
  

  async presentAlertN(msj: string) {
    const alert = await swal.fire({
      backdrop : false,
      icon: 'error',
      width: '300px',
      title: 'Error!',
      text: msj,
      confirmButtonText: "Cerrar"
    })
  }

  async presentAlertP(msj: string) {
    const alert = await swal.fire({
      backdrop : false,
      icon: 'success',
      width: '300px',
      title: 'Exito!',
      text: msj,
      confirmButtonText: "Cerrar"
    })
  }
  async presentAlertW(msj: string) {
    const alert = await swal.fire({
      backdrop : false,
      icon: 'warning',
      width: '300px',
      text: msj,
      confirmButtonText: "Cerrar"
    })
  }

  async presentAlertConfirm(msj: string, textconfirm: string, textcancel: string) : Promise <boolean>{
    const result = await swal.fire({
      title: '¿Estás seguro?',
      text: msj,
      width: '300px',
      icon: 'warning',
      backdrop : false,
      showCancelButton: true,
      confirmButtonText: textconfirm,
      confirmButtonColor: '#3085d6',
      cancelButtonText: textcancel,
      cancelButtonColor: '#d33'
    });

    return result.isConfirmed
  }
}