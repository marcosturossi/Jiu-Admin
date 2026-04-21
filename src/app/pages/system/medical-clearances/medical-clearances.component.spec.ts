import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MedicalClearancesComponent } from './medical-clearances.component';
import { provideToastr } from 'ngx-toastr';

describe('MedicalClearancesComponent', () => {
  let component: MedicalClearancesComponent;
  let fixture: ComponentFixture<MedicalClearancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalClearancesComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalClearancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
