import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdatePersonsComponent } from './update-persons.component';

describe('UpdatePersonsComponent', () => {
  let component: UpdatePersonsComponent;
  let fixture: ComponentFixture<UpdatePersonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePersonsComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePersonsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('person', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
