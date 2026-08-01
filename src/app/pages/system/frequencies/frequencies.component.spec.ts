import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { FrequenciesComponent } from './frequencies.component';
import { FrequencyService, ShowFrequencyDTO as ShowFrequencyDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';

const MOCK_FREQUENCY: ShowFrequencyDTO = { id: 'f1', studentId: 'student-1', lessonId: 'lesson-1', lessonScheduledDate: '2024-03-01' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_FREQUENCY, id: `fr${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('FrequenciesComponent', () => {
  let component: FrequenciesComponent;
  let fixture: ComponentFixture<FrequenciesComponent>;
  let frequencyService: jasmine.SpyObj<FrequencyService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const frequencySpy = jasmine.createSpyObj('FrequencyService', ['apiFrequencyGet', 'apiFrequencyIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    frequencySpy.apiFrequencyGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[5] ?? 1), Number(args[6] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [FrequenciesComponent],
      providers: [
        provideRouter([]),
        { provide: FrequencyService, useValue: frequencySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FrequenciesComponent);
    component = fixture.componentInstance;
    frequencyService = TestBed.inject(FrequencyService) as jasmine.SpyObj<FrequencyService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((frequencyService.apiFrequencyGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    expect((frequencyService.apiFrequencyGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(25);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('deleteFrequency', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      frequencyService.apiFrequencyIdDelete.and.returnValue(of(null as any));
      frequencyService.apiFrequencyGet.calls.reset();
    });

    it('should delete frequency and reload on confirmation', async () => {
      await (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(frequencyService.apiFrequencyIdDelete).toHaveBeenCalledWith(MOCK_FREQUENCY.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(frequencyService.apiFrequencyIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      frequencyService.apiFrequencyIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
