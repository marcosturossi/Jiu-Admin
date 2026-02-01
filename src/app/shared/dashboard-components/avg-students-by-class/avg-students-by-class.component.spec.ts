import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvgStudentsByClassComponent } from './avg-students-by-class.component';

describe('AvgStudentsByClassComponent', () => {
  let component: AvgStudentsByClassComponent;
  let fixture: ComponentFixture<AvgStudentsByClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvgStudentsByClassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvgStudentsByClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
