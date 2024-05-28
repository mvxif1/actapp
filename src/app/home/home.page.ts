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
    });
   }

  ngOnInit() {
  }
  async iniciarUsuario(){
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    const usuario = await this.dbservice.iniciarSesion(email, password);
    if (email === 'admin@admin.cl' && password === 'admin'){
      this.dbservice.setRolActual(2);
      this.loginForm.reset();
      this.navCtrl.navigateForward('/inicio');
      this.dbservice.presentAlertP("Iniciaste sesión correctamente!")
    }else{
      if(usuario){
        this.dbservice.setRolActual(1);
        this.loginForm.reset();
        this.navCtrl.navigateForward('/inicio')
      }else{
        this.loginForm.reset()
        this.dbservice.presentAlertN("Usuario ingresado incorrecto")
      }
    }


    
  }
}
