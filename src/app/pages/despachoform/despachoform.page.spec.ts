import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DespachoformPage } from './despachoform.page';

describe('DespachoformPage', () => {
  let component: DespachoformPage;
  let fixture: ComponentFixture<DespachoformPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DespachoformPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
