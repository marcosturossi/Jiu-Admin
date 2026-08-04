import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AcademyProfileComponent } from './academy-profile.component';
import { MyAcademyService } from '../../../generated_services/api/myAcademy.service';
import { AddressService } from '../../../generated_services/api/address.service';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';

const MOCK_ACADEMY = {
  id: 'academy-1',
  name: 'Test Academy',
  slug: 'test-academy',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  cnpj: '12.345.678/0001-90',
  email: 'contato@test.com',
  zipCode: '01001-000',
  street: 'Rua Teste',
  number: '123',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
} as any;

const EXPECTED_FORM_VALUE = {
  name: 'Test Academy',
  cnpj: '12.345.678/0001-90',
  email: 'contato@test.com',
  zipCode: '01001-000',
  street: 'Rua Teste',
  number: '123',
  complement: '',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
};

describe('AcademyProfileComponent', () => {
  let component: AcademyProfileComponent;
  let fixture: ComponentFixture<AcademyProfileComponent>;
  let myAcademyService: jasmine.SpyObj<MyAcademyService>;
  let addressService: jasmine.SpyObj<AddressService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const myAcademySpy = jasmine.createSpyObj('MyAcademyService', ['apiAcademyMeGet', 'apiAcademyMePut']);
    const addressSpy = jasmine.createSpyObj('AddressService', ['apiAddressCepGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    myAcademySpy.apiAcademyMeGet.and.returnValue(of(MOCK_ACADEMY));

    await TestBed.configureTestingModule({
      imports: [AcademyProfileComponent],
      providers: [
        { provide: MyAcademyService, useValue: myAcademySpy },
        { provide: AddressService, useValue: addressSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademyProfileComponent);
    component = fixture.componentInstance;
    myAcademyService = TestBed.inject(MyAcademyService) as jasmine.SpyObj<MyAcademyService>;
    addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load and populate the form with the academy data', () => {
    expect((component as any).form.value).toEqual(EXPECTED_FORM_VALUE);
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should set loading to false and notify an error on load failure', () => {
    myAcademyService.apiAcademyMeGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(AcademyProfileComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should block save and show an error when the name is missing', () => {
    (component as any).form.get('name')?.setValue('');
    (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
    expect(myAcademyService.apiAcademyMePut).not.toHaveBeenCalled();
  });

  it('should save the form and notify success', () => {
    myAcademyService.apiAcademyMePut.and.returnValue(of(MOCK_ACADEMY));
    (component as any).form.get('street')?.setValue('Nova Rua');

    (component as any).save();

    expect(myAcademyService.apiAcademyMePut).toHaveBeenCalledWith({
      name: 'Test Academy',
      cnpj: '12.345.678/0001-90',
      email: 'contato@test.com',
      zipCode: '01001-000',
      street: 'Nova Rua',
      number: '123',
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should send null for blank optional fields', () => {
    myAcademyService.apiAcademyMePut.and.returnValue(of(MOCK_ACADEMY));
    (component as any).form.patchValue({
      cnpj: '', email: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    });

    (component as any).save();

    expect(myAcademyService.apiAcademyMePut).toHaveBeenCalledWith({
      name: 'Test Academy',
      cnpj: null,
      email: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
    });
  });

  it('should surface an error and reset saving state when the save request fails', () => {
    myAcademyService.apiAcademyMePut.and.returnValue(throwError(() => new Error('network down')));

    (component as any).save();

    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should autofill address fields when a full CEP is entered', () => {
    addressService.apiAddressCepGet.and.returnValue(of({
      street: 'Rua Encontrada', number: null, complement: 'Fundos', neighborhood: 'Bairro Novo', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20000-000',
    } as any));
    (component as any).form.get('zipCode')?.setValue('20000000');

    (component as any).onZipCodeChange();

    expect(addressService.apiAddressCepGet).toHaveBeenCalledWith('20000000');
    expect((component as any).form.value.street).toBe('Rua Encontrada');
    expect((component as any).form.value.city).toBe('Rio de Janeiro');
    expect((component as any).form.value.state).toBe('RJ');
  });

  it('should not look up an incomplete CEP', () => {
    (component as any).form.get('zipCode')?.setValue('123');
    (component as any).onZipCodeChange();
    expect(addressService.apiAddressCepGet).not.toHaveBeenCalled();
  });
});
