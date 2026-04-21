import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateLessonComponent } from './create-lesson.component';
import { provideToastr } from 'ngx-toastr';

describe('CreateLessonComponent', () => {
  let component: CreateLessonComponent;
  let fixture: ComponentFixture<CreateLessonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLessonComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLessonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
