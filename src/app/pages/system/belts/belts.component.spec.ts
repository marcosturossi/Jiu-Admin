import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BeltsComponent } from './belts.component';
import { provideToastr } from 'ngx-toastr';

describe('BeltsComponent', () => {
  let component: BeltsComponent;
  let fixture: ComponentFixture<BeltsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeltsComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeltsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
