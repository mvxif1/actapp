import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DbService } from 'src/app/services/db.service';
import { Usuario } from 'src/app/services/usuario';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  usuario!: Usuario | null;
  constructor(private navCtrl: NavController, private db: DbService) { }
  
  ngOnInit() {
    this.db.getUsuarioActual().subscribe((usuario) => {
      this.usuario = usuario;
    });
  
  }
  editarPerfil() {
    if (this.usuario) {
      this.navCtrl.navigateForward(['/editarperfil']);
    }
  }

}
