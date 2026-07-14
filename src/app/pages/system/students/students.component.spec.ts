import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StudentsComponent } from './students.component';
import { StudentsService } from '../../../generated_services/api/students.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';

const MOCK_STUDENTS: ShowStudentDTO[] = Array.from({ length: 25 }, (_, i) => ({
  id: `s${i + 1}`,
  userName: `user${i + 1}`,
  email: `user${i + 1}@test.com`,
  firstName: `Nome${i + 1}`,
  lastName: `Sobrenome${i + 1}`,
  isActive: true,
  cpf: null,
}));
const MOCK_STUDENT = MOCK_STUDENTS[0];
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_STUDENTS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_STUDENTS.length,
  totalPages: Math.ceil(MOCK_STUDENTS.length / pageSize),
});

describe('StudentsComponent', () => {
  let component: StudentsComponent;
  let fixture: ComponentFixture<StudentsComponent>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet', 'apiStudentsIdDelete']);
    (studentsSpy as any).configuration = { basePath: 'http://localhost:8080' };
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    studentsSpy.apiStudentsGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[6] ?? 1), Number(args[7] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [StudentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsComponent);
    component = fixture.componentInstance;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(req => req.flush(new Blob(['fake-image'], { type: 'image/png' })));
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Estudantes'); });

  it('should load students on init', () => {
    expect((studentsService.apiStudentsGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(10);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    studentsService.apiStudentsGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected student', () => {
    (component as any).openEdit(MOCK_STUDENT);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_STUDENT);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    studentsService.apiStudentsGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(studentsService.apiStudentsGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    studentsService.apiStudentsGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(studentsService.apiStudentsGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    studentsService.apiStudentsGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((studentsService.apiStudentsGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe('s11');
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    studentsService.apiStudentsGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((studentsService.apiStudentsGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
  });

  it('should update filterText and reload on onFilterChange', () => {
    studentsService.apiStudentsGet.calls.reset();
    (component as any).onFilterChange({ text: 'João', conditions: [] });
    expect((component as any).filterText()).toBe('João');
    expect(studentsService.apiStudentsGet).toHaveBeenCalled();
  });

  it('should fetch photo via authenticated request for students with a photoUrl', () => {
    const studentsWithPhoto = [{ ...MOCK_STUDENT, photoUrl: 'student_s1.png' }];
    studentsService.apiStudentsGet.and.returnValue(of({ items: studentsWithPhoto, totalCount: 1, totalPages: 1 } as any));
    (component as any).load();

    const req = httpMock.expectOne('http://localhost:8080/api/Students/s1/photo');
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['fake-image'], { type: 'image/png' }));
  });

  it('should not request a photo for students without a photoUrl', () => {
    studentsService.apiStudentsGet.and.returnValue(of({ items: [MOCK_STUDENT], totalCount: 1, totalPages: 1 } as any));
    (component as any).load();
    httpMock.expectNone((req) => req.url.includes('/photo'));
    expect((component as any).photoUrls()).toEqual({});
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      studentsService.apiStudentsIdDelete.and.returnValue(of(null as any));
      studentsService.apiStudentsGet.calls.reset();
    });

    it('should delete student and reload on confirmation', () => {
      (component as any).delete(MOCK_STUDENT);
      expect(studentsService.apiStudentsIdDelete).toHaveBeenCalledWith(MOCK_STUDENT.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(studentsService.apiStudentsGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_STUDENT);
      expect(studentsService.apiStudentsIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      studentsService.apiStudentsIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_STUDENT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
