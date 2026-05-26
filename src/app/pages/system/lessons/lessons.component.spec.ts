import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LessonsComponent } from './lessons.component';
import { LessonService } from '../../../generated_services/api/lesson.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowLessonDTO } from '../../../generated_services/model/showLessonDTO';

const MOCK_LESSON: ShowLessonDTO = { id: 'l1', title: 'Aula de Guarda', scheduledDate: '2024-03-01', isActive: true };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_LESSON, id: `ls${i + 1}` }));
const buildResponse = (top = 20, skip = 0) => ({
  '@odata.count': MOCK_ITEMS.length,
  value: MOCK_ITEMS.slice(skip, skip + top),
});

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
    lessonSpy.apiLessonGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[2] ?? 20), Number(args[3] ?? 0))));

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

  it('should update page and reload on onPageChange', () => {
    lessonService.apiLessonGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((lessonService.apiLessonGet as any)).toHaveBeenCalledWith(undefined, undefined, '10', '10', 'true', undefined, 'response');
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    lessonService.apiLessonGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((lessonService.apiLessonGet as any)).toHaveBeenCalledWith(undefined, undefined, '20', '0', 'true', undefined, 'response');
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
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
