import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateBeltComponent } from './update-belt.component';
import { BeltService, ShowBeltDTO as ShowBeltDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_BELT: ShowBeltDTO = { id: 'b1', color: 'Azul', orderIndex: 2, isForKids: false };

describe('UpdateBeltComponent', () => {
  let component: UpdateBeltComponent;
  let fixture: ComponentFixture<UpdateBeltComponent>;
  let componentRef: ComponentRef<UpdateBeltComponent>;
  let beltService: jasmine.SpyObj<BeltService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateBeltComponent],
      providers: [
        { provide: BeltService, useValue: beltSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateBeltComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    beltService = TestBed.inject(BeltService) as jasmine.SpyObj<BeltService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('belt', MOCK_BELT);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input belt', () => {
    expect((component as any).form.get('color')?.value).toBe('Azul');
    expect((component as any).form.get('orderIndex')?.value).toBe(2);
  });

  it('should have valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should re-patch form when belt input changes', () => {
    componentRef.setInput('belt', { ...MOCK_BELT, color: 'Preta' });
    fixture.detectChanges();
    expect((component as any).form.get('color')?.value).toBe('Preta');
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('color')?.setValue('');
    (component as any).save();
    expect(beltService.apiBeltIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiBeltIdPut with correct id and DTO on valid save', () => {
    beltService.apiBeltIdPut.and.returnValue(of({} as any));
    (component as any).form.patchValue({ color: 'Preta', orderIndex: 5 });
    (component as any).save();
    expect(beltService.apiBeltIdPut).toHaveBeenCalledWith('b1', jasmine.objectContaining({ color: 'Preta', orderIndex: 5 }));
  });

  it('should emit beltUpdated and show success on successful save', () => {
    beltService.apiBeltIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.beltUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalledWith('Faixa Atualizada!', jasmine.any(String));
  });

  it('should show error notification on service failure', () => {
    beltService.apiBeltIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Faixa!', jasmine.any(String));
  });
});
