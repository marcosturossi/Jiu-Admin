import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContractTermsTemplatesComponent } from './contract-terms-templates.component';
import { ContractTermsTemplateService } from '../../../generated_services/api/contractTermsTemplate.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowContractTermsTemplateDTO } from '../../../generated_services/model/showContractTermsTemplateDTO';

const MOCK_TEMPLATE: ShowContractTermsTemplateDTO = {
  id: 't1',
  name: 'Padrão',
  text: 'Cláusulas padrão',
  createdAt: '2026-01-01T00:00:00Z' as unknown as string,
};

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_TEMPLATE, id: `t${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('ContractTermsTemplatesComponent', () => {
  let component: ContractTermsTemplatesComponent;
  let fixture: ComponentFixture<ContractTermsTemplatesComponent>;
  let contractTermsTemplateService: jasmine.SpyObj<ContractTermsTemplateService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ContractTermsTemplateService', ['apiContractTermsTemplateGet', 'apiContractTermsTemplateIdDelete', 'apiContractTermsTemplateIdPreviewGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    serviceSpy.apiContractTermsTemplateGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[1] ?? 1), Number(args[2] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [ContractTermsTemplatesComponent],
      providers: [
        { provide: ContractTermsTemplateService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractTermsTemplatesComponent);
    component = fixture.componentInstance;
    contractTermsTemplateService = TestBed.inject(ContractTermsTemplateService) as jasmine.SpyObj<ContractTermsTemplateService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load templates into the signal on init', () => {
    expect((component as any).items().items.length).toBe(10);
  });

  it('should show an error and stop loading when the initial load fails', () => {
    contractTermsTemplateService.apiContractTermsTemplateGet.and.returnValue(throwError(() => new Error('network down')));
    const f2 = TestBed.createComponent(ContractTermsTemplatesComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    contractTermsTemplateService.apiContractTermsTemplateGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(contractTermsTemplateService.apiContractTermsTemplateGet).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    contractTermsTemplateService.apiContractTermsTemplateGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((component as any).items().items.length).toBe(20);
  });

  describe('preview', () => {
    it('should open the dialog, fetch the rendered PDF and stop loading', () => {
      const pdfBlob = new Blob(['fake-pdf'], { type: 'application/pdf' });
      contractTermsTemplateService.apiContractTermsTemplateIdPreviewGet.and.returnValue(of(pdfBlob) as any);

      (component as any).openPreview(MOCK_TEMPLATE);

      expect((component as any).openedPreview()).toBeTrue();
      expect((component as any).previewing()).toEqual(MOCK_TEMPLATE);
      expect(contractTermsTemplateService.apiContractTermsTemplateIdPreviewGet).toHaveBeenCalledWith(
        MOCK_TEMPLATE.id!, 'body' as any, false, { httpHeaderAccept: 'application/pdf' },
      );
      expect((component as any).previewLoading()).toBeFalse();
      expect((component as any).previewBlob()).toBe(pdfBlob);
    });

    it('should show an error notification when the preview fails to generate', () => {
      contractTermsTemplateService.apiContractTermsTemplateIdPreviewGet.and.returnValue(throwError(() => new Error()));

      (component as any).openPreview(MOCK_TEMPLATE);

      expect((component as any).previewLoading()).toBeFalse();
      expect(ns.showError).toHaveBeenCalled();
    });

    it('should close the dialog and clear the preview blob', () => {
      contractTermsTemplateService.apiContractTermsTemplateIdPreviewGet.and.returnValue(of(new Blob()) as any);
      (component as any).openPreview(MOCK_TEMPLATE);

      (component as any).closePreview();

      expect((component as any).openedPreview()).toBeFalse();
      expect((component as any).previewing()).toBeNull();
      expect((component as any).previewBlob()).toBeUndefined();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      contractTermsTemplateService.apiContractTermsTemplateIdDelete.and.returnValue(of(null as any));
      contractTermsTemplateService.apiContractTermsTemplateGet.calls.reset();
    });

    it('should delete template and reload on confirmation', async () => {
      await (component as any).delete(MOCK_TEMPLATE);
      expect(contractTermsTemplateService.apiContractTermsTemplateIdDelete).toHaveBeenCalledWith(MOCK_TEMPLATE.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(contractTermsTemplateService.apiContractTermsTemplateGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_TEMPLATE);
      expect(contractTermsTemplateService.apiContractTermsTemplateIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      contractTermsTemplateService.apiContractTermsTemplateIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_TEMPLATE);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
