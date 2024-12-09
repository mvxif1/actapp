import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { DbService } from 'src/app/services/db.service';
import { AppComponent } from '../app.component';
import { Device } from '@capacitor/device';
import { Apiv4Service } from '../services/apiv4.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  loginForm!: FormGroup;
  mensajeError: String = '';
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(private formBuilder: FormBuilder, private dbservice: DbService, private navCtrl: NavController, private api: Apiv4Service, private appComponent: AppComponent) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    localStorage.setItem('email', '');
    localStorage.setItem('password', '');
    localStorage.setItem('userType', '');
    this.checkRememberedSession();
  }
  onEnterKeyPress(){
    if (this.loginForm.valid) {
      this.iniciarUsuario();
    }
  }
  async iniciarUsuario() {
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    const rememberMe = this.loginForm.value.rememberMe;
  
    // Obtén información del dispositivo
    const info = await Device.getInfo();
    const id = await Device.getId();
    const uuid = id.identifier || 'unknown';
    const platform = info.platform || 'unknown';
    
    this.api.iniciarSesion(email, password, uuid, platform).subscribe(
      (response) => {
        const sessionToken = response.session_token;
        const isTecnico = response.EsTecnico;
        console.log(email, password, uuid, platform, isTecnico);
        if (sessionToken) {
          this.email = email;
          this.password = password;
          this.appComponent.logueado = true;
          if (rememberMe) {
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
            localStorage.setItem('userType', isTecnico);
          }
          localStorage.setItem('userType', isTecnico);
          localStorage.setItem('email', email);
          localStorage.setItem('password', password);
          this.loginForm.reset();
          this.navCtrl.navigateRoot('/inicio');
          this.dbservice.presentAlertP("Has ingresado correctamente!");
        }
      },
      (error) => {
        this.loginForm.reset();
        this.dbservice.presentAlertN("Usuario ingresado incorrecto");
        console.error('Error al iniciar sesión:', error);
      }
    );
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alterna entre true y false
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
