import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStudentsThisMonthComponent } from './new-students-this-month.component';

describe('NewStudentsThisMonthComponent', () => {
  let component: NewStudentsThisMonthComponent;
  let fixture: ComponentFixture<NewStudentsThisMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStudentsThisMonthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewStudentsThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
