import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBeltComponent } from './create-belt.component';

describe('CreateBeltComponent', () => {
  let component: CreateBeltComponent;
  let fixture: ComponentFixture<CreateBeltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBeltComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBeltComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
