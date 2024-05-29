import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngresarformPage } from './ingresarform.page';

describe('IngresarformPage', () => {
  let component: IngresarformPage;
  let fixture: ComponentFixture<IngresarformPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngresarformPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
