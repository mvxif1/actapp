import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DespachadosPage } from './despachados.page';

describe('DespachadosPage', () => {
  let component: DespachadosPage;
  let fixture: ComponentFixture<DespachadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DespachadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
