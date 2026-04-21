import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreatePersonsComponent } from './create-persons.component';
import { provideToastr } from 'ngx-toastr';

describe('CreatePersonsComponent', () => {
  let component: CreatePersonsComponent;
  let fixture: ComponentFixture<CreatePersonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePersonsComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePersonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
