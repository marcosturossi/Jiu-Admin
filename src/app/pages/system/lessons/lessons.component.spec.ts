import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LessonsComponent } from './lessons.component';
import { provideToastr } from 'ngx-toastr';

describe('LessonsComponent', () => {
  let component: LessonsComponent;
  let fixture: ComponentFixture<LessonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonsComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
