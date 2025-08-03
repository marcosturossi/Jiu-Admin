import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFrequencyComponent } from './create-frequency.component';

describe('CreateFrequencyComponent', () => {
  let component: CreateFrequencyComponent;
  let fixture: ComponentFixture<CreateFrequencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFrequencyComponent]
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
