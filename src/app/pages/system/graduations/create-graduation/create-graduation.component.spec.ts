import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateGraduationComponent } from './create-graduation.component';
import { provideToastr } from 'ngx-toastr';

describe('CreateGraduationComponent', () => {
  let component: CreateGraduationComponent;
  let fixture: ComponentFixture<CreateGraduationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGraduationComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGraduationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
