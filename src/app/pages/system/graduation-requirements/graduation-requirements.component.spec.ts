import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraduationRequirementsComponent } from './graduation-requirements.component';

describe('GraduationRequirementsComponent', () => {
  let component: GraduationRequirementsComponent;
  let fixture: ComponentFixture<GraduationRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationRequirementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraduationRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
