import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvgBeltsByClassComponent } from './avg-belts-by-class.component';

describe('AvgBeltsByClassComponent', () => {
  let component: AvgBeltsByClassComponent;
  let fixture: ComponentFixture<AvgBeltsByClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvgBeltsByClassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvgBeltsByClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
