import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContractVersionsComponent } from './contract-versions.component';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { ShowContractDTO, ShowContractVersionDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { environment } from '../../../../enviroments/environment';

const MOCK_CONTRACT: ShowContractDTO = { id: 'c1' } as ShowContractDTO;

const MOCK_VERSIONS: ShowContractVersionDTO[] = [
  { id: 'v1', contractId: 'c1', sentAt: '2026-01-01T00:00:00Z', acceptedAt: null, acceptedIp: null, isCurrentlyAccepted: false },
];

describe('ContractVersionsComponent', () => {
  let component: ContractVersionsComponent;
  let fixture: ComponentFixture<ContractVersionsComponent>;
  let componentRef: ComponentRef<ContractVersionsComponent>;
  let contractService: jasmine.SpyObj<ContractService>;
  let httpMock: HttpTestingController;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ContractService', ['apiContractIdVersionsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    serviceSpy.apiContractIdVersionsGet.and.returnValue(of(MOCK_VERSIONS));

    await TestBed.configureTestingModule({
      imports: [ContractVersionsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContractService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractVersionsComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    contractService = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
    httpMock = TestBed.inject(HttpTestingController);
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('contract', MOCK_CONTRACT);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load versions for the given contract', () => {
    expect(contractService.apiContractIdVersionsGet).toHaveBeenCalledWith('c1');
    expect((component as any).versions()).toEqual(MOCK_VERSIONS);
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error when loading versions fails', () => {
    contractService.apiContractIdVersionsGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(ContractVersionsComponent);
    f2.componentRef.setInput('contract', MOCK_CONTRACT);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should request the PDF and trigger a download on downloadPdf()', () => {
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
    const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');

    (component as any).downloadPdf(MOCK_VERSIONS[0]);

    const req = httpMock.expectOne(`${environment.server}/api/contract/versions/v1/document`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf-bytes'], { type: 'application/pdf' }));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
    expect((component as any).downloadingVersionId()).toBeNull();
  });

  it('should show error notification when the download fails', () => {
    (component as any).downloadPdf(MOCK_VERSIONS[0]);

    const req = httpMock.expectOne(`${environment.server}/api/contract/versions/v1/document`);
    req.flush(new Blob(['error']), { status: 500, statusText: 'Server Error' });

    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).downloadingVersionId()).toBeNull();
  });
});
