import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { UpdateFrequencyComponent } from './update-frequency.component';

describe('UpdateFrequencyComponent', () => {
  let component: UpdateFrequencyComponent;
  let fixture: ComponentFixture<UpdateFrequencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateFrequencyComponent],
      providers: [provideHttpClient(), MessageService]
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
