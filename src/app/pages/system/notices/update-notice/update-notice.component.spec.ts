import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateNoticeComponent } from './update-notice.component';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { ShowNoticesDTO } from '../../../../generated_services/model/showNoticesDTO';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_NOTICE: ShowNoticesDTO = { id: 'n1', description: 'Aviso importante', isActive: true };

describe('UpdateNoticeComponent', () => {
  let component: UpdateNoticeComponent;
  let fixture: ComponentFixture<UpdateNoticeComponent>;
  let componentRef: ComponentRef<UpdateNoticeComponent>;
  let noticesService: jasmine.SpyObj<NoticesService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const noticesSpy = jasmine.createSpyObj('NoticesService', ['apiNoticesIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateNoticeComponent],
      providers: [
        { provide: NoticesService, useValue: noticesSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateNoticeComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    noticesService = TestBed.inject(NoticesService) as jasmine.SpyObj<NoticesService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('notice', MOCK_NOTICE);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input notice', () => {
    expect((component as any).form.get('description')?.value).toBe('Aviso importante');
    expect((component as any).form.get('isActive')?.value).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('description')?.setValue('');
    (component as any).save();
    expect(noticesService.apiNoticesIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiNoticesIdPut with correct id on valid save', () => {
    noticesService.apiNoticesIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(noticesService.apiNoticesIdPut).toHaveBeenCalledWith('n1', jasmine.any(Object));
  });

  it('should emit noticeUpdated and show success on successful save', () => {
    noticesService.apiNoticesIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.noticeUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalledWith('Aviso Atualizado!', jasmine.any(String));
  });

  it('should show error notification on service failure', () => {
    noticesService.apiNoticesIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Aviso!', jasmine.any(String));
  });
});
