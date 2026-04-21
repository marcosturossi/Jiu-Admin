import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdateNoticeComponent } from './update-notice.component';
import { provideToastr } from 'ngx-toastr';

describe('UpdateNoticeComponent', () => {
  let component: UpdateNoticeComponent;
  let fixture: ComponentFixture<UpdateNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateNoticeComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateNoticeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('notice', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
