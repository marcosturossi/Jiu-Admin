import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { CreateFrequencyComponent } from './create-frequency.component';

describe('CreateFrequencyComponent', () => {
  let component: CreateFrequencyComponent;
  let fixture: ComponentFixture<CreateFrequencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFrequencyComponent],
      providers: [provideHttpClient(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFrequencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
