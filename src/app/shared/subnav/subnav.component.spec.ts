import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubnavComponent } from './subnav.component';
import { SubnavService } from '../../services/subnav.service';

describe('SubnavComponent', () => {
  let component: SubnavComponent;
  let fixture: ComponentFixture<SubnavComponent>;
  let subnavService: SubnavService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnavComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SubnavComponent);
    component = fixture.componentInstance;
    subnavService = TestBed.inject(SubnavService);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should render the title from SubnavService', () => {
    subnavService.setTitle('Turmas');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Turmas');
  });

  it('should update rendered title when service title changes', () => {
    subnavService.setTitle('Faixas');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Faixas');
  });
});
