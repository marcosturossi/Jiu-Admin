import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvgStudentsByBeltComponent } from './avg-students-by-belt.component';

describe('AvgStudentsByBeltComponent', () => {
  let component: AvgStudentsByBeltComponent;
  let fixture: ComponentFixture<AvgStudentsByBeltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvgStudentsByBeltComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvgStudentsByBeltComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
