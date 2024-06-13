import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/services/usuario';

function correoValido(control: FormControl) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(control.value)) {
    return { 'correoInvalido': true };
  }
  return null;
}

@Component({
  selector: 'app-editarperfil',
  templateUrl: './editarperfil.page.html',
  styleUrls: ['./editarperfil.page.scss'],
})
export class EditarperfilPage implements OnInit {
  editarForm!: FormGroup;
  usuario!: Usuario | null;

  constructor(private db: DbService, private router: Router, private formBuilder: FormBuilder) {
    this.editarForm = this.formBuilder.group({
      rut: [''],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, correoValido]],
    });
  }

  ngOnInit() {
    this.db.getUsuarioActual().subscribe((usuario) => {
      this.usuario = usuario;
      if (this.usuario) {
        this.editarForm.patchValue({
          rut: this.usuario.rut,
          nombre: this.usuario.nombre,
          apellido: this.usuario.apellido,
          correo: this.usuario.correo,
        });
      }
    });
  }
  
 guardarCambios() {
    if (this.usuario) {
      const { id } = this.usuario;
      const { nombre, apellido, correo } = this.editarForm.value;
      
      this.db.modificarPerfil(id, nombre, apellido, correo)
      this.usuario = { ...this.usuario, nombre, apellido, correo };
      this.db.setUsuario(this.usuario);
      this.db.presentAlertP('Se han guardado sus datos correctamente');
      this.router.navigate(['/perfil']);
    }
  }
}
