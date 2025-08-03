import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateBeltComponent } from './update-belt.component';

describe('UpdateBeltComponent', () => {
  let component: UpdateBeltComponent;
  let fixture: ComponentFixture<UpdateBeltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateBeltComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateBeltComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
