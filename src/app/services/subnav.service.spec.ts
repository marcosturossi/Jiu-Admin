import { TestBed } from '@angular/core/testing';
import { SubnavService } from './subnav.service';

describe('SubnavService', () => {
  let service: SubnavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubnavService);
  });

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should have empty title by default', () => {
    expect(service.title()).toBe('');
  });

  it('should update title via setTitle()', () => {
    service.setTitle('Alunos');
    expect(service.title()).toBe('Alunos');
  });

  it('should overwrite previous title on subsequent setTitle() call', () => {
    service.setTitle('Faixas');
    service.setTitle('Turmas');
    expect(service.title()).toBe('Turmas');
  });
});
