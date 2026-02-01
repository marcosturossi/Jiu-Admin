import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopStudentsComponent } from './top-students.component';

describe('TopStudentsComponent', () => {
  let component: TopStudentsComponent;
  let fixture: ComponentFixture<TopStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopStudentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
