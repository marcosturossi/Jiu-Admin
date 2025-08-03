import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGraduationComponent } from './update-graduation.component';

describe('UpdateGraduationComponent', () => {
  let component: UpdateGraduationComponent;
  let fixture: ComponentFixture<UpdateGraduationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateGraduationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
