import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateNoticeComponent } from './create-notice.component';
import { provideToastr } from 'ngx-toastr';

describe('CreateNoticeComponent', () => {
  let component: CreateNoticeComponent;
  let fixture: ComponentFixture<CreateNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNoticeComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
