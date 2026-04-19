import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { UpdateBeltComponent } from './update-belt.component';

describe('UpdateBeltComponent', () => {
  let component: UpdateBeltComponent;
  let fixture: ComponentFixture<UpdateBeltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateBeltComponent],
      providers: [provideHttpClient(), MessageService]
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
