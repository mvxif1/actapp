import { FormControl } from '@angular/forms';


const RutValidator = {
  validaRut(rutCompleto: string): boolean {
    rutCompleto = rutCompleto.replace('‐', '-');

    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto)) {
      return false;
    }

    const tmp = rutCompleto.split('-');
    const digv = tmp[1].toUpperCase();
    const rut = tmp[0];

    return this.dv(rut) === digv;
  },
  
  dv(T: string): string {
    let M = 0, S = 1;
    for (let i = T.length - 1; i >= 0; i--) {
      S = (S + parseInt(T.charAt(i)) * (9 - M++ % 6)) % 11;
    }
    return S ? (S - 1).toString() : 'k';
  }
};

function correoValido(control: FormControl) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(control.value)) {
    return { 'correoInvalido': true };
  }
  return null;
}

function mayuscula(control: FormControl) {
  const tieneMayuscula = /[A-Z]/.test(control.value);
  if (!tieneMayuscula) {
    return { 'mayuscula': true };
  }
  return null;
}

function minuscula(control: FormControl) {
  const tieneMinuscula = /[a-z]/.test(control.value);
  if (!tieneMinuscula) {
    return { 'minuscula': true };
  }
  return null;
}

function numero(control: FormControl) {
  const tieneNumero = /[0-9]/.test(control.value);
  if (!tieneNumero) {
    return { 'numero': true };
  }
  return null;
}

function caracterespecial(control: FormControl) {
  const tieneCaracterEspecial = /[@$!%*?&.]/.test(control.value);
  if (!tieneCaracterEspecial) {
    return { 'caracterespecial': true };
  }
  return null;
}

function matchPassword(control: FormControl) {
  const contraseña = control.root.get('clave');
  const confirmcontraseña = control.value;

  if (contraseña && confirmcontraseña !== contraseña.value) {
    return { mismatch: true };
  }

  return null;
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DbService } from 'src/app/services/db.service';
import { NavController } from '@ionic/angular';
import { Usuario } from 'src/app/services/usuario';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {
  usuarios: Usuario[] = [];
  registroForm: FormGroup;
  id_rol : number = 1;
  constructor(private formBuilder: FormBuilder, private dbService: DbService, private navCtrl: NavController) { 
    this.registroForm = this.formBuilder.group({
      rut: ['', [Validators.required, this.validateRutFormat.bind(this)]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, correoValido]],
      clave: ['', [Validators.required, mayuscula, minuscula, numero, caracterespecial, Validators.minLength(8)]],
      claveConfirmar: ['', [Validators.required, matchPassword]],
    });
  }
  
  validateRutFormat(control: FormControl) {
    const rut = control.value;
    if (!RutValidator.validaRut(rut)) {
      return { invalidRut: true };
    }
    return null;
  }

  ngOnInit() {
    this.dbService.fetchUsuarios().subscribe(usuarios => {
      this.usuarios = usuarios;
    });
  }

  registrarUsuario() {
    if (this.registroForm.valid) {
      const formulario = this.registroForm.value;
      this.dbService.registrarUsuario(formulario.nombre, formulario.apellido, formulario.rut, formulario.correo, formulario.clave) 
      console.log('Usuario registrado:');
      this.navCtrl.navigateForward('/login');
    }
  }
}

