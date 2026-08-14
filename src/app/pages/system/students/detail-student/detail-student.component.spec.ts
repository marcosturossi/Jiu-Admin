import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DetailStudentComponent } from './detail-student.component';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { AccountsReceivableService } from '../../../../generated_services/api/accountsReceivable.service';
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';

describe('DetailStudentComponent', () => {
  let component: DetailStudentComponent;
  let fixture: ComponentFixture<DetailStudentComponent>;

  let studentsSpy: jasmine.SpyObj<StudentsService>;
  let contractSpy: jasmine.SpyObj<ContractService>;
  let graduationSpy: jasmine.SpyObj<GraduationService>;
  let accountsReceivableSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let subnavSpy: jasmine.SpyObj<SubnavService>;
  let httpMock: HttpTestingController;

  const mockStudent = {
    id: 'test-id',
    firstName: 'João',
    lastName: 'Silva',
    userName: 'joaosilva',
    email: 'joao@test.com',
    cpf: '123.456.789-00',
    isActive: true,
    addresses: [],
    relationships: [],
  };

  beforeEach(async () => {
    studentsSpy = jasmine.createSpyObj('StudentsService', [
      'apiStudentsIdGet',
      'apiStudentsIdPhotoPost',
      'apiStudentsIdPhotoDelete',
    ]);
    (studentsSpy as any).configuration = { basePath: 'http://localhost:8080' };
    contractSpy = jasmine.createSpyObj('ContractService', ['apiContractGet']);
    graduationSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationGet']);
    accountsReceivableSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableStudentStudentIdGet']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);
    subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    studentsSpy.apiStudentsIdGet.and.returnValue(of(mockStudent) as any);
    contractSpy.apiContractGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);
    graduationSpy.apiGraduationGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);
    accountsReceivableSpy.apiAccountsReceivableStudentStudentIdGet.and.returnValue(of({ items: [], totalCount: 0, totalPages: 0 }) as any);

    await TestBed.configureTestingModule({
      imports: [DetailStudentComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StudentsService,    useValue: studentsSpy },
        { provide: ContractService,    useValue: contractSpy },
        { provide: GraduationService,  useValue: graduationSpy },
        { provide: AccountsReceivableService, useValue: accountsReceivableSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: SubnavService,      useValue: subnavSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'test-id' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailStudentComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const photoReq = httpMock.expectOne('http://localhost:8080/api/Students/test-id/photo');
    photoReq.flush(new Blob(['fake-image'], { type: 'image/png' }));
  });

  afterEach(() => {
    // Some actions (e.g. uploadPhoto) trigger a follow-up photo GET; drain without asserting on it.
    httpMock.match(() => true).forEach(req => req.flush(new Blob(['fake-image'], { type: 'image/png' })));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title on init', () => {
    expect(subnavSpy.setTitle).toHaveBeenCalledWith('Detalhes do Aluno');
  });

  it('should load student on init', () => {
    expect(studentsSpy.apiStudentsIdGet).toHaveBeenCalledWith('test-id');
    expect(component['student']()).toEqual(mockStudent);
  });

  it('should label billing types in Portuguese and fall back to the academy default for null/undefined', () => {
    expect((component as any).billingTypeLabel('PIX')).toBe('PIX');
    expect((component as any).billingTypeLabel('BOLETO')).toBe('Boleto');
    expect((component as any).billingTypeLabel('CREDIT_CARD')).toBe('Cartão de Crédito');
    expect((component as any).billingTypeLabel('MONEY')).toBe('Dinheiro');
    expect((component as any).billingTypeLabel(null)).toBe('Padrão da academia');
    expect((component as any).billingTypeLabel(undefined)).toBe('Padrão da academia');
  });

  it('should show error notification when student load fails', async () => {
    studentsSpy.apiStudentsIdGet.and.returnValue(throwError(() => new Error('server error')));

    // Recreate with failing spy
    fixture = TestBed.createComponent(DetailStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(notifySpy.showError).toHaveBeenCalledWith('Erro', 'Não foi possível carregar o aluno.');
  });

  it('should open photo editor when openPhotoEditor() is called', () => {
    (component as any).openPhotoEditor();
    expect((component as any).openedPhotoEditor()).toBeTrue();
  });

  it('should close photo editor and clear selection when closePhotoEditor() is called', () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    (component as any).onPhotoSelected({ target: { files: [file] } } as unknown as Event);
    (component as any).closePhotoEditor();
    expect((component as any).openedPhotoEditor()).toBeFalse();
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should reject non-image files on photo selection', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    (component as any).onPhotoSelected({ target: { files: [file] } } as unknown as Event);
    expect(notifySpy.showError).toHaveBeenCalledWith('Arquivo Inválido', jasmine.any(String));
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should reject files larger than 5MB', () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    (component as any).onPhotoSelected({ target: { files: [bigFile] } } as unknown as Event);
    expect(notifySpy.showError).toHaveBeenCalledWith('Arquivo Muito Grande', jasmine.any(String));
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should upload photo, refresh photo url and close editor on uploadPhoto()', () => {
    studentsSpy.apiStudentsIdPhotoPost.and.returnValue(of({} as any));
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    (component as any).onPhotoSelected({ target: { files: [file] } } as unknown as Event);
    (component as any).uploadPhoto();
    expect(studentsSpy.apiStudentsIdPhotoPost).toHaveBeenCalledWith('test-id', file);
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect((component as any).openedPhotoEditor()).toBeFalse();
  });

  it('should show error notification when photo upload fails', () => {
    studentsSpy.apiStudentsIdPhotoPost.and.returnValue(throwError(() => new Error()));
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    (component as any).onPhotoSelected({ target: { files: [file] } } as unknown as Event);
    (component as any).uploadPhoto();
    expect(notifySpy.showError).toHaveBeenCalledWith('Erro ao Enviar Foto', jasmine.any(String));
  });

  it('should remove photo and clear photoUrl on removePhoto()', () => {
    studentsSpy.apiStudentsIdPhotoDelete.and.returnValue(of({} as any));
    (component as any).removePhoto();
    expect(studentsSpy.apiStudentsIdPhotoDelete).toHaveBeenCalledWith('test-id');
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect((component as any).photoUrl()).toBeNull();
  });

  it('should show error notification when photo removal fails', () => {
    studentsSpy.apiStudentsIdPhotoDelete.and.returnValue(throwError(() => new Error()));
    (component as any).removePhoto();
    expect(notifySpy.showError).toHaveBeenCalledWith('Erro ao Remover Foto', jasmine.any(String));
  });

  it('should load the student\'s fees on init', () => {
    expect(accountsReceivableSpy.apiAccountsReceivableStudentStudentIdGet).toHaveBeenCalledWith(
      'test-id', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 50,
    );
    expect((component as any).isLoadingFees()).toBeFalse();
  });

  it('should show error notification when fee load fails', () => {
    accountsReceivableSpy.apiAccountsReceivableStudentStudentIdGet.and.returnValue(throwError(() => new Error()));
    (component as any).loadFees();
    expect(notifySpy.showError).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as contas a receber do aluno.');
  });

  it('should consider a Pending Income fee with no charge yet as chargeable', () => {
    const chargeable = (component as any).isChargeable({ status: 'Pending', type: 'Income', externalChargeId: null });
    const alreadyCharged = (component as any).isChargeable({ status: 'Pending', type: 'Income', externalChargeId: 'ext-1' });
    const paid = (component as any).isChargeable({ status: 'Paid', type: 'Income', externalChargeId: null });
    expect(chargeable).toBeTrue();
    expect(alreadyCharged).toBeFalse();
    expect(paid).toBeFalse();
  });

  it('should open and close the generate-charge dialog', () => {
    const fee = { id: 'fee-1', status: 'Pending', type: 'Income' };
    (component as any).openGenerateCharge(fee);
    expect((component as any).openedGenerateCharge()).toBeTrue();
    expect((component as any).selectedFee()).toEqual(fee);
    (component as any).closeGenerateCharge();
    expect((component as any).openedGenerateCharge()).toBeFalse();
    expect((component as any).selectedFee()).toBeNull();
  });

  it('should reload fees after a charge is generated or a payment is recorded', () => {
    accountsReceivableSpy.apiAccountsReceivableStudentStudentIdGet.calls.reset();
    (component as any).onChargeGenerated();
    (component as any).onPaymentWithMoney();
    expect(accountsReceivableSpy.apiAccountsReceivableStudentStudentIdGet).toHaveBeenCalledTimes(2);
  });

  it('should open and close the create-graduation dialog', () => {
    (component as any).openCreateGraduation();
    expect((component as any).openedCreateGraduation()).toBeTrue();
    (component as any).closeCreateGraduation();
    expect((component as any).openedCreateGraduation()).toBeFalse();
  });

  it('should close the dialog and reload graduations when a graduation is created', () => {
    graduationSpy.apiGraduationGet.calls.reset();
    (component as any).openCreateGraduation();
    (component as any).onGraduationCreated();
    expect((component as any).openedCreateGraduation()).toBeFalse();
    expect(graduationSpy.apiGraduationGet).toHaveBeenCalled();
  });
});

