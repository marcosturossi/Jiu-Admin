import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePersonsComponent } from './update-persons.component';

describe('UpdatePersonsComponent', () => {
  let component: UpdatePersonsComponent;
  let fixture: ComponentFixture<UpdatePersonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePersonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePersonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
