import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGraduationComponent } from './create-graduation.component';

describe('CreateGraduationComponent', () => {
  let component: CreateGraduationComponent;
  let fixture: ComponentFixture<CreateGraduationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGraduationComponent]
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
