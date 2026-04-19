import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { UpdateGraduationComponent } from './update-graduation.component';

describe('UpdateGraduationComponent', () => {
  let component: UpdateGraduationComponent;
  let fixture: ComponentFixture<UpdateGraduationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationComponent],
      providers: [provideHttpClient(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateGraduationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graduation', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
