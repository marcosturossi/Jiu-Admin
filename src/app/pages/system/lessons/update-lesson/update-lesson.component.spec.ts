import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdateLessonComponent } from './update-lesson.component';
import { provideToastr } from 'ngx-toastr';

describe('UpdateLessonComponent', () => {
  let component: UpdateLessonComponent;
  let fixture: ComponentFixture<UpdateLessonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateLessonComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateLessonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lesson', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
