import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { DbService } from 'src/app/services/db.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  loginForm!: FormGroup;
  mensajeError: String = '';

  constructor(private formBuilder: FormBuilder, private dbservice: DbService, private navCtrl: NavController) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    this.checkRememberedSession();
  }

  async iniciarUsuario(){
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    const rememberMe = this.loginForm.value.rememberMe;
    
    let usuario = await this.dbservice.iniciarSesion(email, password);
    if (usuario) {
      if (rememberMe) {
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
      }
      this.dbservice.setRolActual(1);
      this.loginForm.reset();
      this.navCtrl.navigateForward('/inicio')
      this.dbservice.presentAlertP("Has ingresado al usuario");
    } else {
      this.loginForm.reset()
      this.dbservice.presentAlertN("Usuario ingresado incorrecto")
    }
  }

  private checkRememberedSession() {
    const rememberedEmail = localStorage.getItem('email');
    const rememberedPassword = localStorage.getItem('password');
    if (rememberedEmail && rememberedPassword) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        password: rememberedPassword,
        rememberMe: true
      });
    }
  }
}
