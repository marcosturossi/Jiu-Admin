import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { GraduationsComponent } from './graduations.component';
import { provideToastr } from 'ngx-toastr';

describe('GraduationsComponent', () => {
  let component: GraduationsComponent;
  let fixture: ComponentFixture<GraduationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationsComponent],
      providers: [provideHttpClient(), provideToastr()]
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
