import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { FrequenciesComponent } from './frequencies.component';
import { provideToastr } from 'ngx-toastr';

describe('FrequenciesComponent', () => {
  let component: FrequenciesComponent;
  let fixture: ComponentFixture<FrequenciesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrequenciesComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrequenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
