import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdateFrequencyComponent } from './update-frequency.component';
import { provideToastr } from 'ngx-toastr';

describe('UpdateFrequencyComponent', () => {
  let component: UpdateFrequencyComponent;
  let fixture: ComponentFixture<UpdateFrequencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateFrequencyComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateFrequencyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('frequency', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
