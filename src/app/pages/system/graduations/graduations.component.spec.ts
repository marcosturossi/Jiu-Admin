import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraduationsComponent } from './graduations.component';

describe('GraduationsComponent', () => {
  let component: GraduationsComponent;
  let fixture: ComponentFixture<GraduationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraduationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
