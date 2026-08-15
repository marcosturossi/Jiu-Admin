import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { OnboardingBeltFormComponent } from './onboarding-belt-form.component';
import { StudentBeltInfo } from './student-onboarding.component';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';
import { NotificationService } from '../../../services/notification.service';

const EMPTY_INFO: StudentBeltInfo = { beltId: '', startDate: '2026-01-01' };

describe('OnboardingBeltFormComponent', () => {
  let component: OnboardingBeltFormComponent;
  let fixture: ComponentFixture<OnboardingBeltFormComponent>;
  let componentRef: ComponentRef<OnboardingBeltFormComponent>;

  beforeEach(async () => {
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [OnboardingBeltFormComponent],
      providers: [
        provideHttpClient(),
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingBeltFormComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    componentRef.setInput('data', { ...EMPTY_INFO });
    componentRef.setInput('belts', []);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should emit a partial dataChange when a field updates', () => {
    spyOn(component.dataChange, 'emit');
    (component as any).onDataChange('beltId', 'blue');
    expect(component.dataChange.emit).toHaveBeenCalledWith({ beltId: 'blue' });
  });

  it('should not show the create-belt modal by default', () => {
    expect((component as any).openedCreateBelt()).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-create-belt')).toBeNull();
  });

  it('should open the create-belt modal when requested', () => {
    (component as any).openedCreateBelt.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal.show')).toBeTruthy();
  });

  it('should close the modal, patch beltId and bubble up beltCreated when a belt is created', () => {
    spyOn(component.beltCreated, 'emit');
    (component as any).openedCreateBelt.set(true);
    const belt: ShowBeltDTO = { id: 'belt-1', color: 'Azul' } as any;

    (component as any).onBeltCreated(belt);

    expect((component as any).openedCreateBelt()).toBeFalse();
    expect(component.beltCreated.emit).toHaveBeenCalledWith(belt);
  });

  it('should render belt options from the belts input', () => {
    componentRef.setInput('belts', [{ id: 'b1', color: 'Branca' }, { id: 'b2', color: 'Azul' }] as ShowBeltDTO[]);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('#beltId option');
    expect(options.length).toBe(3);
  });
});
