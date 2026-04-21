import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdateBeltComponent } from './update-belt.component';
import { provideToastr } from 'ngx-toastr';

describe('UpdateBeltComponent', () => {
  let component: UpdateBeltComponent;
  let fixture: ComponentFixture<UpdateBeltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateBeltComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateBeltComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('belt', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
