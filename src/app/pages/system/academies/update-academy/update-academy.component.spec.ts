import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UpdateAcademyComponent } from './update-academy.component';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { AddressService } from '../../../../generated_services/api/address.service';
import { NotificationService } from '../../../../services/notification.service';
import { ShowAcademyDto } from '../../../../generated_services/model/showAcademyDto';
import { ComponentRef } from '@angular/core';

const MOCK_ACADEMY: ShowAcademyDto = {
  id: 'abc-1',
  name: 'Carlson Gracie SP',
  slug: 'carlson-sp',
  isActive: true,
  createdAt: '2024-01-15',
  cnpj: null,
  email: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
};

const EMPTY_DTO_FIELDS = {
  cnpj: null, email: null, zipCode: null, street: null, number: null, complement: null, neighborhood: null, city: null, state: null,
};

describe('UpdateAcademyComponent', () => {
  let component: UpdateAcademyComponent;
  let fixture: ComponentFixture<UpdateAcademyComponent>;
  let componentRef: ComponentRef<UpdateAcademyComponent>;
  let academyService: jasmine.SpyObj<AcademyService>;
  let addressService: jasmine.SpyObj<AddressService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const academySpy = jasmine.createSpyObj('AcademyService', ['apiAdminAcademiesIdPut']);
    const addressSpy = jasmine.createSpyObj('AddressService', ['apiAddressCepGet']);
    const notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [UpdateAcademyComponent],
      providers: [
        { provide: AcademyService, useValue: academySpy },
        { provide: AddressService, useValue: addressSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateAcademyComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    academyService = TestBed.inject(AcademyService) as jasmine.SpyObj<AcademyService>;
    addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    componentRef.setInput('academy', MOCK_ACADEMY);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch form values from the input academy', () => {
    const form = (component as any).form;
    expect(form.get('name')?.value).toBe(MOCK_ACADEMY.name);
    expect(form.get('isActive')?.value).toBe(MOCK_ACADEMY.isActive);
  });

  it('should have a valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should re-patch form when academy input changes', () => {
    const updated: ShowAcademyDto = { ...MOCK_ACADEMY, name: 'Nova Academia', isActive: false };
    componentRef.setInput('academy', updated);
    fixture.detectChanges();
    const form = (component as any).form;
    expect(form.get('name')?.value).toBe('Nova Academia');
    expect(form.get('isActive')?.value).toBeFalse();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid on save', () => {
    (component as any).form.get('name')?.setValue('');
    (component as any).save();
    expect(academyService.apiAdminAcademiesIdPut).not.toHaveBeenCalled();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Formulário Inválido',
      'Por favor, preencha todos os campos obrigatórios.',
    );
  });

  it('should call academy service with correct id and DTO on valid save', () => {
    academyService.apiAdminAcademiesIdPut.and.returnValue(of(MOCK_ACADEMY as any));
    const form = (component as any).form;
    form.get('name')?.setValue('Novo Nome');
    form.get('isActive')?.setValue(false);
    (component as any).save();
    expect(academyService.apiAdminAcademiesIdPut).toHaveBeenCalledWith('abc-1', {
      name: 'Novo Nome',
      isActive: false,
      ...EMPTY_DTO_FIELDS,
    });
  });

  it('should include cnpj, email and address fields in the DTO when filled in', () => {
    academyService.apiAdminAcademiesIdPut.and.returnValue(of(MOCK_ACADEMY as any));
    const form = (component as any).form;
    form.patchValue({
      cnpj: '12.345.678/0001-90', email: 'contato@academia.com',
      zipCode: '01001-000', street: 'Rua A', number: '100', complement: 'Sala 2', neighborhood: 'Centro', city: 'São Paulo', state: 'SP',
    });
    (component as any).save();
    expect(academyService.apiAdminAcademiesIdPut).toHaveBeenCalledWith('abc-1', {
      name: 'Carlson Gracie SP',
      isActive: true,
      cnpj: '12.345.678/0001-90',
      email: 'contato@academia.com',
      zipCode: '01001-000',
      street: 'Rua A',
      number: '100',
      complement: 'Sala 2',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    });
  });

  it('should autofill address fields when a full CEP is entered', () => {
    addressService.apiAddressCepGet.and.returnValue(of({
      street: 'Rua Encontrada', number: null, complement: null, neighborhood: 'Bairro Novo', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20000-000',
    } as any));
    (component as any).form.get('zipCode')?.setValue('20000000');

    (component as any).onZipCodeChange();

    expect(addressService.apiAddressCepGet).toHaveBeenCalledWith('20000000');
    expect((component as any).form.value.city).toBe('Rio de Janeiro');
  });

  it('should emit academyUpdated and show success notification on successful save', () => {
    academyService.apiAdminAcademiesIdPut.and.returnValue(of(MOCK_ACADEMY as any));
    let emitted = false;
    component.academyUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(notificationService.showSuccess).toHaveBeenCalledWith(
      'Academia Atualizada!',
      jasmine.stringContaining('Carlson Gracie SP'),
    );
  });

  it('should show error notification on service failure', () => {
    academyService.apiAdminAcademiesIdPut.and.returnValue(throwError(() => new Error('fail')));
    (component as any).save();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Erro ao Atualizar',
      'Não foi possível atualizar a academia. Tente novamente.',
    );
  });
});
