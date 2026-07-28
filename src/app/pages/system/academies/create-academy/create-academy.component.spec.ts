import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateAcademyComponent } from './create-academy.component';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateAcademyComponent', () => {
  let component: CreateAcademyComponent;
  let fixture: ComponentFixture<CreateAcademyComponent>;
  let academyService: jasmine.SpyObj<AcademyService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const academySpy = jasmine.createSpyObj('AcademyService', ['apiAdminAcademiesPost']);
    const notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateAcademyComponent],
      providers: [
        { provide: AcademyService, useValue: academySpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAcademyComponent);
    component = fixture.componentInstance;
    academyService = TestBed.inject(AcademyService) as jasmine.SpyObj<AcademyService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form on init (required fields empty)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    const form = (component as any).form;
    form.setValue({
      name: 'Academy X',
      slug: 'academy-x',
      adminEmail: 'admin@example.com',
      adminFirstName: 'João',
      adminLastName: 'Silva',
    });
    expect(form.valid).toBeTrue();
  });

  it('should reject slug with uppercase or special characters', () => {
    const slugControl = (component as any).form.get('slug');
    slugControl.setValue('Academy_X!');
    expect(slugControl.errors?.['pattern']).toBeTruthy();
  });

  it('should accept slug with lowercase, numbers and hyphens', () => {
    const slugControl = (component as any).form.get('slug');
    slugControl.setValue('my-academy-123');
    expect(slugControl.errors).toBeNull();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid on save', () => {
    (component as any).save();
    expect(academyService.apiAdminAcademiesPost).not.toHaveBeenCalled();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Formulário Inválido',
      'Por favor, preencha todos os campos obrigatórios.',
    );
  });

  it('should call academy service with correct DTO on valid save', () => {
    academyService.apiAdminAcademiesPost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.setValue({
      name: 'Academy X',
      slug: 'academy-x',
      adminEmail: 'admin@example.com',
      adminFirstName: 'João',
      adminLastName: 'Silva',
    });
    (component as any).save();
    expect(academyService.apiAdminAcademiesPost).toHaveBeenCalledWith({
      name: 'Academy X',
      slug: 'academy-x',
      adminEmail: 'admin@example.com',
      adminFirstName: 'João',
      adminLastName: 'Silva',
    });
  });

  it('should emit academyCreated and show success on successful save', () => {
    academyService.apiAdminAcademiesPost.and.returnValue(of({} as any));
    let emitted = false;
    component.academyCreated.subscribe(() => (emitted = true));
    const form = (component as any).form;
    form.setValue({
      name: 'Academy X',
      slug: 'academy-x',
      adminEmail: 'admin@example.com',
      adminFirstName: 'João',
      adminLastName: 'Silva',
    });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(notificationService.showSuccess).toHaveBeenCalledWith(
      'Academia Criada!',
      'A nova academia foi criada com sucesso.',
    );
  });

  it('should show error notification on service failure', () => {
    academyService.apiAdminAcademiesPost.and.returnValue(throwError(() => new Error('fail')));
    const form = (component as any).form;
    form.setValue({
      name: 'Academy X',
      slug: 'academy-x',
      adminEmail: 'admin@example.com',
      adminFirstName: 'João',
      adminLastName: 'Silva',
    });
    (component as any).save();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Erro ao Criar',
      'Não foi possível criar a academia. Tente novamente.',
    );
  });
});
