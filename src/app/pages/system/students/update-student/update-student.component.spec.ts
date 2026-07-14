import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateStudentComponent } from './update-student.component';
import { StudentsService, ShowStudentDTO as ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_STUDENT: ShowStudentDTO = { id: 's1', userName: 'joao', cpf: null, email: 'joao@test.com', firstName: 'João', lastName: 'Silva', isActive: true };

describe('UpdateStudentComponent', () => {
  let component: UpdateStudentComponent;
  let fixture: ComponentFixture<UpdateStudentComponent>;
  let componentRef: ComponentRef<UpdateStudentComponent>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const studentsSpy = jasmine.createSpyObj('StudentsService', [
      'apiStudentsIdPut', 'apiStudentsIdPhotoUrlGet', 'apiStudentsIdPhotoPost', 'apiStudentsIdPhotoDelete',
    ]);
    studentsSpy.apiStudentsIdPhotoUrlGet.and.returnValue(of({ url: null }));
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateStudentComponent],
      providers: [
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateStudentComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('student', MOCK_STUDENT);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input student', () => {
    expect((component as any).form.get('userName')?.value).toBe('joao');
    expect((component as any).form.get('email')?.value).toBe('joao@test.com');
  });

  it('should have valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('email')?.setValue('bad-email');
    (component as any).save();
    expect(studentsService.apiStudentsIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiStudentsIdPut with correct id on valid save', () => {
    studentsService.apiStudentsIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(studentsService.apiStudentsIdPut).toHaveBeenCalledWith('s1', jasmine.any(Object));
  });

  it('should emit studentUpdated and show success on successful save', () => {
    studentsService.apiStudentsIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.studentUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    studentsService.apiStudentsIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar!', jasmine.any(String));
  });

  it('should load photo url when student input changes', () => {
    expect(studentsService.apiStudentsIdPhotoUrlGet).toHaveBeenCalledWith('s1');
  });

  it('should reject non-image files on photo selection', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;
    (component as any).onPhotoSelected(event);
    expect(ns.showError).toHaveBeenCalledWith('Arquivo Inválido', jasmine.any(String));
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should reject files larger than 5MB', () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const event = { target: { files: [bigFile] } } as unknown as Event;
    (component as any).onPhotoSelected(event);
    expect(ns.showError).toHaveBeenCalledWith('Arquivo Muito Grande', jasmine.any(String));
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should set selectedPhotoFile on valid image selection', () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    (component as any).onPhotoSelected(event);
    expect((component as any).selectedPhotoFile()).toBe(file);
  });

  it('should upload photo and refresh photo url on uploadPhoto()', () => {
    studentsService.apiStudentsIdPhotoPost.and.returnValue(of({} as any));
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    (component as any).onPhotoSelected(event);
    (component as any).uploadPhoto();
    expect(studentsService.apiStudentsIdPhotoPost).toHaveBeenCalledWith('s1', file);
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).selectedPhotoFile()).toBeNull();
  });

  it('should show error notification when photo upload fails', () => {
    studentsService.apiStudentsIdPhotoPost.and.returnValue(throwError(() => new Error()));
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    (component as any).onPhotoSelected(event);
    (component as any).uploadPhoto();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Enviar Foto', jasmine.any(String));
  });

  it('should remove photo and clear photoUrl on removePhoto()', () => {
    studentsService.apiStudentsIdPhotoDelete.and.returnValue(of({} as any));
    (component as any).photoUrl.set('http://example.com/photo.png');
    (component as any).removePhoto();
    expect(studentsService.apiStudentsIdPhotoDelete).toHaveBeenCalledWith('s1');
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).photoUrl()).toBeNull();
  });

  it('should show error notification when photo removal fails', () => {
    studentsService.apiStudentsIdPhotoDelete.and.returnValue(throwError(() => new Error()));
    (component as any).removePhoto();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Remover Foto', jasmine.any(String));
  });
});
