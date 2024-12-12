import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {
  isTecnico: boolean = false;
  noTecnico: boolean = false;
  constructor() { }

  ngOnInit() {
    this.tipoUser();
  }

  tipoUser(){
    const userType = localStorage.getItem('userType');
    if(userType === '1'){
      this.isTecnico = true;
      this.noTecnico = false;
    }else 
    if(userType === '0'){
      this.isTecnico = false;
      this.noTecnico = true;
    }
  }

}
