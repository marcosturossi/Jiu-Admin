import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FaceRecognitionComponent } from './face-recognition.component';
import { PersonsService } from '../../../generated_services/api2/api/persons.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PersonDetailResponse } from '../../../generated_services/api2/model/personDetailResponse';
import { PersonListResponse } from '../../../generated_services/api2/model/personListResponse';

const MOCK_PERSON: PersonDetailResponse = { id: 'p1', name: 'Carlos Silva', created_at: '2024-01-01', updated_at: '2024-01-01', is_active: true, images: [] };
const MOCK_LIST: PersonListResponse = { persons: [MOCK_PERSON], total: 1, page: 1, page_size: 10 };

describe('FaceRecognitionComponent', () => {
  let component: FaceRecognitionComponent;
  let fixture: ComponentFixture<FaceRecognitionComponent>;
  let personsService: jasmine.SpyObj<PersonsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const personsSpy = jasmine.createSpyObj('PersonsService', ['listPersonsApiV1PersonsGet', 'deletePersonApiV1PersonsPersonIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    personsSpy.listPersonsApiV1PersonsGet.and.returnValue(of(MOCK_LIST));

    await TestBed.configureTestingModule({
      imports: [FaceRecognitionComponent],
      providers: [
        { provide: PersonsService, useValue: personsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FaceRecognitionComponent);
    component = fixture.componentInstance;
    personsService = TestBed.inject(PersonsService) as jasmine.SpyObj<PersonsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Reconhecimento Facial'); });

  it('should load persons on init', () => {
    expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
    expect((component as any).persons()).toEqual([MOCK_PERSON]);
    expect((component as any).totalItems()).toBe(1);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    personsService.listPersonsApiV1PersonsGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected person', () => {
    (component as any).openEdit(MOCK_PERSON);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_PERSON);
  });

  it('should close create dialog and reload on onPersonCreated', () => {
    (component as any).openedCreate.set(true);
    personsService.listPersonsApiV1PersonsGet.calls.reset();
    (component as any).onPersonCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onPersonUpdated', () => {
    (component as any).openedUpdate.set(true);
    personsService.listPersonsApiV1PersonsGet.calls.reset();
    (component as any).onPersonUpdated(MOCK_PERSON);
    expect((component as any).openedUpdate()).toBeFalse();
    expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    personsService.listPersonsApiV1PersonsGet.and.returnValue(of({ ...MOCK_LIST, page: 2 } as any));
    personsService.listPersonsApiV1PersonsGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    personsService.listPersonsApiV1PersonsGet.and.returnValue(of({ ...MOCK_LIST, page: 1, page_size: 20 } as any));
    personsService.listPersonsApiV1PersonsGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
  });

  describe('deletePerson', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      personsService.deletePersonApiV1PersonsPersonIdDelete.and.returnValue(of(null as any));
      personsService.listPersonsApiV1PersonsGet.calls.reset();
    });

    it('should delete person and reload on confirmation', () => {
      (component as any).deletePerson(MOCK_PERSON);
      expect(personsService.deletePersonApiV1PersonsPersonIdDelete).toHaveBeenCalledWith(MOCK_PERSON.id);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(personsService.listPersonsApiV1PersonsGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).deletePerson(MOCK_PERSON);
      expect(personsService.deletePersonApiV1PersonsPersonIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      personsService.deletePersonApiV1PersonsPersonIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).deletePerson(MOCK_PERSON);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
