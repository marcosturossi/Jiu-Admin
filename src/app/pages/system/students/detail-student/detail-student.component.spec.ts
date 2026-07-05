import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
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
      'apiStudentsIdPhotoUrlGet',
    ]);
    contractSpy = jasmine.createSpyObj('ContractService', ['apiContractGet']);
    graduationSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationGet']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);
    subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    studentsSpy.apiStudentsIdGet.and.returnValue(of(mockStudent) as any);
    studentsSpy.apiStudentsIdPhotoUrlGet.and.returnValue(of({ url: 'http://photo.url' }) as any);
    contractSpy.apiContractGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);
    graduationSpy.apiGraduationGet.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }) as any);

    await TestBed.configureTestingModule({
      imports: [DetailStudentComponent],
      providers: [
        provideHttpClient(),
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
    fixture.detectChanges();
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
});

