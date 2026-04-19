import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BirthdayThisMonthComponent } from './birthday-this-month.component';

describe('BirthdayThisMonthComponent', () => {
  let component: BirthdayThisMonthComponent;
  let fixture: ComponentFixture<BirthdayThisMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayThisMonthComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
