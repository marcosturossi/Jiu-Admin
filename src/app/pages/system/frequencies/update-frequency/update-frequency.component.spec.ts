import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateFrequencyComponent } from './update-frequency.component';
import { FrequencyService, StudentsService, ShowFrequencyDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_FREQUENCY: ShowFrequencyDTO = { id: 'f1', studentId: 'stu1', lessonId: 'l1', lessonScheduledDate: '2024-03-01T08:00:00Z' };

describe('UpdateFrequencyComponent', () => {
  let component: UpdateFrequencyComponent;
  let fixture: ComponentFixture<UpdateFrequencyComponent>;
  let componentRef: ComponentRef<UpdateFrequencyComponent>;
  let frequencyService: jasmine.SpyObj<FrequencyService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const freqSpy = jasmine.createSpyObj('FrequencyService', ['apiFrequencyIdPut']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    studentsSpy.apiStudentsGet.and.returnValue(of({ items: [{ id: 'stu1', firstName: 'João', lastName: 'Silva' }] }));
    await TestBed.configureTestingModule({
      imports: [UpdateFrequencyComponent],
      providers: [
        { provide: FrequencyService, useValue: freqSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateFrequencyComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    frequencyService = TestBed.inject(FrequencyService) as jasmine.SpyObj<FrequencyService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('frequency', MOCK_FREQUENCY);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input frequency', () => {
    expect((component as any).frequencyForm.get('studentId')?.value).toBe('stu1');
  });

  it('should load student options on init', () => {
    expect((component as any).studentOptions().length).toBe(1);
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).frequencyForm.get('studentId')?.setValue('');
    (component as any).update();
    expect(frequencyService.apiFrequencyIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiFrequencyIdPut with correct id on valid update', () => {
    frequencyService.apiFrequencyIdPut.and.returnValue(of({} as any));
    (component as any).update();
    expect(frequencyService.apiFrequencyIdPut).toHaveBeenCalledWith('f1', jasmine.any(Object));
  });

  it('should emit frequencyUpdated and show success on successful update', () => {
    frequencyService.apiFrequencyIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.frequencyUpdated.subscribe(() => (emitted = true));
    (component as any).update();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    frequencyService.apiFrequencyIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).update();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Frequência!', jasmine.any(String));
  });
});
