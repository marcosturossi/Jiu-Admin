import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdatePersonsComponent } from './update-persons.component';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../../generated_services/api2/model/personDetailResponse';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

const MOCK_PERSON: PersonDetailResponse = { id: 'p1', name: 'Carlos Silva', created_at: '2024-01-01', updated_at: '2024-01-01', is_active: true, images: [] };

describe('UpdatePersonsComponent', () => {
  let component: UpdatePersonsComponent;
  let fixture: ComponentFixture<UpdatePersonsComponent>;
  let componentRef: ComponentRef<UpdatePersonsComponent>;
  let personsService: jasmine.SpyObj<PersonsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const personsSpy = jasmine.createSpyObj('PersonsService', ['addPersonImagesApiV1PersonsPersonIdImagesPost', 'removePersonImageApiV1PersonsPersonIdImagesImageIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    await TestBed.configureTestingModule({
      imports: [UpdatePersonsComponent],
      providers: [
        { provide: PersonsService, useValue: personsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdatePersonsComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    personsService = TestBed.inject(PersonsService) as jasmine.SpyObj<PersonsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    componentRef.setInput('person', MOCK_PERSON);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form name from input person', () => {
    expect((component as any).personForm.get('name')?.value).toBe('Carlos Silva');
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should emit personUpdated without calling API when no new images selected', () => {
    let emitted = false;
    component.personUpdated.subscribe(() => (emitted = true));
    (component as any).update();
    expect(personsService.addPersonImagesApiV1PersonsPersonIdImagesPost).not.toHaveBeenCalled();
    expect(emitted).toBeTrue();
  });

  it('should call addPersonImages when new images are selected', () => {
    personsService.addPersonImagesApiV1PersonsPersonIdImagesPost.and.returnValue(of({} as any));
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    (component as any).selectedFiles.set([mockFile]);
    (component as any).previewUrls.set(['data:image/jpeg;base64,xxx']);
    (component as any).update();
    expect(personsService.addPersonImagesApiV1PersonsPersonIdImagesPost).toHaveBeenCalledWith('p1', jasmine.any(Array));
  });

  it('should remove image on removeImage confirmation', async () => {
    confirmService.confirm.and.returnValue(Promise.resolve(true));
    const mockImg = { id: 1, base64: 'data:image/png;base64,abc' };
    (component as any).existingImages.set([mockImg]);
    personsService.removePersonImageApiV1PersonsPersonIdImagesImageIdDelete.and.returnValue(of({} as any));
    await (component as any).removeImage(mockImg);
    expect(personsService.removePersonImageApiV1PersonsPersonIdImagesImageIdDelete).toHaveBeenCalledWith('p1', 1);
    expect(ns.showSuccess).toHaveBeenCalled();
  });
});
