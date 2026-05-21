import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FrequenciesComponent } from './frequencies.component';
import { FrequencyService, CarlonGracieBackendAttendanceApplicationDTOsShowFrequencyDTO as ShowFrequencyDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

const MOCK_FREQUENCY: ShowFrequencyDTO = { id: 'f1', studentId: 'student-1', lessonId: 'lesson-1', lessonScheduledDate: '2024-03-01' };
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_FREQUENCY] };
const MOCK_PAGE = { items: [MOCK_FREQUENCY], totalCount: 1, totalPages: 1 };

describe('FrequenciesComponent', () => {
  let component: FrequenciesComponent;
  let fixture: ComponentFixture<FrequenciesComponent>;
  let frequencyService: jasmine.SpyObj<FrequencyService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const frequencySpy = jasmine.createSpyObj('FrequencyService', ['apiFrequencyGet', 'apiFrequencyIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    frequencySpy.apiFrequencyGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [FrequenciesComponent],
      providers: [
        { provide: FrequencyService, useValue: frequencySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FrequenciesComponent);
    component = fixture.componentInstance;
    frequencyService = TestBed.inject(FrequencyService) as jasmine.SpyObj<FrequencyService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Frequências'); });

  it('should load frequencies on init', () => {
    expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    frequencyService.apiFrequencyGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected frequency', () => {
    (component as any).openEdit(MOCK_FREQUENCY);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_FREQUENCY);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).onPageChange(3);
    expect((component as any).currentPage()).toBe(3);
    expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(4);
    frequencyService.apiFrequencyGet.calls.reset();
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
  });

  describe('deleteFrequency', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      frequencyService.apiFrequencyIdDelete.and.returnValue(of(null as any));
      frequencyService.apiFrequencyGet.calls.reset();
    });

    it('should delete frequency and reload on confirmation', () => {
      (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(frequencyService.apiFrequencyIdDelete).toHaveBeenCalledWith(MOCK_FREQUENCY.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(frequencyService.apiFrequencyGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(frequencyService.apiFrequencyIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      frequencyService.apiFrequencyIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).deleteFrequency(MOCK_FREQUENCY);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
