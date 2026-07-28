import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateBeltComponent } from './create-belt.component';
import { BeltService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateBeltComponent', () => {
  let component: CreateBeltComponent;
  let fixture: ComponentFixture<CreateBeltComponent>;
  let beltService: jasmine.SpyObj<BeltService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateBeltComponent],
      providers: [
        { provide: BeltService, useValue: beltSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateBeltComponent);
    component = fixture.componentInstance;
    beltService = TestBed.inject(BeltService) as jasmine.SpyObj<BeltService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (color required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ color: 'Azul', orderIndex: 1 });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).save();
    expect(beltService.apiBeltPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiBeltPost with correct DTO on valid save', () => {
    beltService.apiBeltPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ color: 'Azul', orderIndex: 2, isForKids: false });
    (component as any).save();
    expect(beltService.apiBeltPost).toHaveBeenCalledWith(jasmine.objectContaining({ color: 'Azul', orderIndex: 2 }));
  });

  it('should emit beltCreated and show success on successful save', () => {
    beltService.apiBeltPost.and.returnValue(of({} as any));
    let emitted = false;
    component.beltCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ color: 'Azul', orderIndex: 1 });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalledWith('Faixa Criada!', jasmine.any(String));
  });

  it('should show error notification on service failure', () => {
    beltService.apiBeltPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ color: 'Azul', orderIndex: 1 });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Faixa!', jasmine.any(String));
  });
});
