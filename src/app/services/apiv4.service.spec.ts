import { TestBed } from '@angular/core/testing';

import { Apiv4Service } from './apiv4.service';

describe('Apiv4Service', () => {
  let service: Apiv4Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Apiv4Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
