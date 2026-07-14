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
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';

describe('DetailStudentComponent', () => {
  let component: DetailStudentComponent;
  let fixture: ComponentFixture<DetailStudentComponent>;

  let studentsSpy: jasmine.SpyObj<StudentsService>;
  let contractSpy: jasmine.SpyObj<ContractService>;
  let graduationSpy: jasmine.SpyObj<GraduationService>;
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
    notifySpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);
    subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    studentsSpy.apiStudentsIdGet.and.returnValue(of(mockStudent) as any);
    contractSpy.apiContractGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);
    graduationSpy.apiGraduationGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);

    await TestBed.configureTestingModule({
      imports: [DetailStudentComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StudentsService,    useValue: studentsSpy },
        { provide: ContractService,    useValue: contractSpy },
        { provide: GraduationService,  useValue: graduationSpy },
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
});

