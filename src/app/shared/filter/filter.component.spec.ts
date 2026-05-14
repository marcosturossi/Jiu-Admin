import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FilterComponent } from './filter.component';
import { FilterField, FilterOutput } from './filter.types';

const STATUS_FIELD: FilterField = {
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
  ],
};

const NAME_FIELD: FilterField = { key: 'name', label: 'Nome', type: 'text' };

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

  it('should emit filterChange (text) after 400ms debounce', fakeAsync(() => {
    const emitted: FilterOutput[] = [];
    component.filterChange.subscribe(v => emitted.push(v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    tick(399);
    expect(emitted.length).toBe(0);
    tick(1);
    expect(emitted.length).toBe(1);
    expect(emitted[0].text).toBe('test');
    expect(emitted[0].conditions).toEqual([]);
  }));

  it('should clear inputValue and emit filterChange when clear button clicked', fakeAsync(() => {
    const emitted: FilterOutput[] = [];
    component.filterChange.subscribe(v => emitted.push(v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.filter-bar__input');
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    tick(500);
    fixture.detectChanges();

    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-bar__clear');
    clearBtn.click();
    fixture.detectChanges();

    expect((component as any).inputValue()).toBe('');
    // emitted twice: once from debounce, once from clear
    expect(emitted.length).toBe(2);
    expect(emitted[1].text).toBe('');
  }));

  it('should NOT show advanced button when fields=[]', () => {
    expect(fixture.nativeElement.querySelector('.filter-bar__advanced')).toBeNull();
  });

  it('should show advanced button when fields are provided', () => {
    fixture.componentRef.setInput('fields', [NAME_FIELD]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-bar__advanced')).not.toBeNull();
  });

  it('should open modal when advanced button clicked', () => {
    fixture.componentRef.setInput('fields', [NAME_FIELD]);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-bar__advanced');
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();
  });

  it('should close modal when close button clicked', () => {
    fixture.componentRef.setInput('fields', [NAME_FIELD]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.filter-bar__advanced').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-close').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('should add a condition row when "Adicionar condição" clicked', () => {
    fixture.componentRef.setInput('fields', [NAME_FIELD]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.filter-bar__advanced').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-body button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.condition-row').length).toBe(1);
  });

  it('should apply conditions and emit filterChange with them', fakeAsync(() => {
    const emitted: FilterOutput[] = [];
    component.filterChange.subscribe(v => emitted.push(v));

    fixture.componentRef.setInput('fields', [STATUS_FIELD]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.filter-bar__advanced').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-body button').click();
    fixture.detectChanges();

    // Set value in select
    const valueSelect: HTMLSelectElement = fixture.nativeElement.querySelector('.condition-row__value');
    valueSelect.value = 'active';
    valueSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Click apply
    const applyBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.modal-footer .btn-primary');
    applyBtn.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].conditions.length).toBe(1);
    expect(emitted[0].conditions[0].field.key).toBe('status');
    expect(emitted[0].conditions[0].value).toBe('active');
  }));

  it('should show badge with condition count on advanced button', fakeAsync(() => {
    fixture.componentRef.setInput('fields', [STATUS_FIELD]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.filter-bar__advanced').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-body button').click();
    fixture.detectChanges();

    const valueSelect: HTMLSelectElement = fixture.nativeElement.querySelector('.condition-row__value');
    valueSelect.value = 'active';
    valueSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-footer .btn-primary').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.filter-bar__badge')?.textContent?.trim()).toBe('1');
  }));

  it('should remove active chip and re-emit filterChange', fakeAsync(() => {
    const emitted: FilterOutput[] = [];
    component.filterChange.subscribe(v => emitted.push(v));

    fixture.componentRef.setInput('fields', [STATUS_FIELD]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.filter-bar__advanced').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-body button').click();
    fixture.detectChanges();

    const valueSelect: HTMLSelectElement = fixture.nativeElement.querySelector('.condition-row__value');
    valueSelect.value = 'active';
    valueSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-footer .btn-primary').click();
    fixture.detectChanges();

    const removeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-chip__remove');
    removeBtn.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(2); // apply + remove
    expect(emitted[1].conditions).toEqual([]);
  }));
});
