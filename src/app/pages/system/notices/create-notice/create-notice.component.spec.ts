import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateNoticeComponent } from './create-notice.component';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateNoticeComponent', () => {
  let component: CreateNoticeComponent;
  let fixture: ComponentFixture<CreateNoticeComponent>;
  let noticesService: jasmine.SpyObj<NoticesService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const noticesSpy = jasmine.createSpyObj('NoticesService', ['apiNoticesPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateNoticeComponent],
      providers: [
        { provide: NoticesService, useValue: noticesSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateNoticeComponent);
    component = fixture.componentInstance;
    noticesService = TestBed.inject(NoticesService) as jasmine.SpyObj<NoticesService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (description required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when description is filled', () => {
    (component as any).form.patchValue({ description: 'Aviso importante' });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).save();
    expect(noticesService.apiNoticesPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiNoticesPost with correct DTO on valid save', () => {
    noticesService.apiNoticesPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ description: 'Aviso importante', isActive: true });
    (component as any).save();
    expect(noticesService.apiNoticesPost).toHaveBeenCalledWith(jasmine.objectContaining({ description: 'Aviso importante' }));
  });

  it('should emit noticeCreated and show success on successful save', () => {
    noticesService.apiNoticesPost.and.returnValue(of({} as any));
    let emitted = false;
    component.noticeCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ description: 'Aviso importante' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalledWith('Aviso Criado!', jasmine.any(String));
  });

  it('should show error notification on service failure', () => {
    noticesService.apiNoticesPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ description: 'Aviso importante' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Aviso!', jasmine.any(String));
  });
});
