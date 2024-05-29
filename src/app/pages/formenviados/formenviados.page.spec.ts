import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormenviadosPage } from './formenviados.page';

describe('FormenviadosPage', () => {
  let component: FormenviadosPage;
  let fixture: ComponentFixture<FormenviadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormenviadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
