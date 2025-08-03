import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateNoticeComponent } from './update-notice.component';

describe('UpdateNoticeComponent', () => {
  let component: UpdateNoticeComponent;
  let fixture: ComponentFixture<UpdateNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateNoticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
