import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LessonsComponent } from './lessons.component';
import { LessonService } from '../../../generated_services/api/lesson.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowLessonDTO } from '../../../generated_services/model/showLessonDTO';

const MOCK_LESSON: ShowLessonDTO = { id: 'l1', title: 'Aula de Guarda', scheduledDate: '2024-03-01', isActive: true };
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_LESSON] };
const MOCK_PAGE = { items: [MOCK_LESSON], totalCount: 1, totalPages: 1 };

describe('LessonsComponent', () => {
  let component: LessonsComponent;
  let fixture: ComponentFixture<LessonsComponent>;
  let lessonService: jasmine.SpyObj<LessonService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const lessonSpy = jasmine.createSpyObj('LessonService', ['apiLessonGet', 'apiLessonIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    lessonSpy.apiLessonGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [LessonsComponent],
      providers: [
        { provide: LessonService, useValue: lessonSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonsComponent);
    component = fixture.componentInstance;
    lessonService = TestBed.inject(LessonService) as jasmine.SpyObj<LessonService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Aulas'); });

  it('should load lessons on init', () => {
    expect(lessonService.apiLessonGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    lessonService.apiLessonGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected lesson', () => {
    (component as any).openEdit(MOCK_LESSON);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_LESSON);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    lessonService.apiLessonGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(lessonService.apiLessonGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    lessonService.apiLessonGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(lessonService.apiLessonGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    lessonService.apiLessonGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(lessonService.apiLessonGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(4);
    lessonService.apiLessonGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(lessonService.apiLessonGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      lessonService.apiLessonIdDelete.and.returnValue(of(null as any));
      lessonService.apiLessonGet.calls.reset();
    });

    it('should delete lesson and reload on confirmation', () => {
      (component as any).delete(MOCK_LESSON);
      expect(lessonService.apiLessonIdDelete).toHaveBeenCalledWith(MOCK_LESSON.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(lessonService.apiLessonGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_LESSON);
      expect(lessonService.apiLessonIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      lessonService.apiLessonIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_LESSON);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
