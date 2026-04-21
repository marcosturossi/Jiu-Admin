import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateNotificationComponent } from './create-notification.component';
import { provideToastr } from 'ngx-toastr';

describe('CreateNotificationComponent', () => {
  let component: CreateNotificationComponent;
  let fixture: ComponentFixture<CreateNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNotificationComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
