import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FilterComponent } from './filter.component';

describe('FilterComponent', () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default placeholder "Buscar..."', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    expect(input.placeholder).toBe('Buscar...');
  });

  it('should reflect custom placeholder input', () => {
    fixture.componentRef.setInput('placeholder', 'Buscar aluno');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    expect(input.placeholder).toBe('Buscar aluno');
  });

  it('should not show clear button when inputValue is empty', () => {
    expect(fixture.nativeElement.querySelector('.filter-bar__clear')).toBeNull();
  });

  it('should show clear button when inputValue is not empty', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    tick(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-bar__clear')).not.toBeNull();
  }));

  it('should emit searchChange after 400ms debounce', fakeAsync(() => {
    const emitted: string[] = [];
    component.searchChange.subscribe(v => emitted.push(v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    tick(399);
    expect(emitted.length).toBe(0);
    tick(1);
    expect(emitted).toEqual(['test']);
  }));

  it('should emit searchReset and clear inputValue when clear button clicked', fakeAsync(() => {
    let resetCount = 0;
    component.searchReset.subscribe(() => resetCount++);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    tick(500);
    fixture.detectChanges();

    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-bar__clear');
    clearBtn.click();
    fixture.detectChanges();

    expect(resetCount).toBe(1);
    expect((component as any).inputValue()).toBe('');
  }));

  it('should sync parent value input to internal inputValue', fakeAsync(() => {
    fixture.componentRef.setInput('value', 'from parent');
    tick(0);
    fixture.detectChanges();
    expect((component as any).inputValue()).toBe('from parent');
  }));
});
