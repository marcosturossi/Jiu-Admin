import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchSelectComponent } from './search-select.component';
import { SearchOption } from './search-option';

const OPTIONS: SearchOption[] = [
  { id: '1', label: 'João Silva' },
  { id: '2', label: 'Maria Santos' },
  { id: '3', label: 'Carlos Pereira' },
];

describe('SearchSelectComponent', () => {
  let fixture: ComponentFixture<SearchSelectComponent>;
  let component: SearchSelectComponent;

  function setup(overrides: {
    options?: SearchOption[];
    selected?: SearchOption | null;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
  } = {}) {
    fixture = TestBed.createComponent(SearchSelectComponent);
    fixture.componentRef.setInput('options', overrides.options ?? OPTIONS);
    if (overrides.selected !== undefined) {
      fixture.componentRef.setInput('selected', overrides.selected);
    }
    if (overrides.placeholder !== undefined) {
      fixture.componentRef.setInput('placeholder', overrides.placeholder);
    }
    if (overrides.label !== undefined) {
      fixture.componentRef.setInput('label', overrides.label);
    }
    if (overrides.disabled !== undefined) {
      fixture.componentRef.setInput('disabled', overrides.disabled);
    }
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchSelectComponent],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders placeholder when nothing is selected', () => {
    setup({ placeholder: 'Selecione um aluno' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Selecione um aluno');
  });

  it('renders selected label when something is selected', () => {
    setup({ selected: OPTIONS[0] });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('João Silva');
  });

  it('does not render modal when closed', () => {
    setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.modal')).toBeNull();
  });

  it('opens modal on trigger button click', () => {
    setup();
    const trigger = fixture.nativeElement.querySelector('button.search-select-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();
  });

  it('closes modal on backdrop click', () => {
    setup();
    (component as any).isOpen.set(true);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('closes modal on close button click', () => {
    setup();
    (component as any).isOpen.set(true);
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('filters options based on query (case-insensitive)', () => {
    setup();
    (component as any).isOpen.set(true);
    (component as any).query.set('joão');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li.list-group-item.list-group-item-action:not(.search-select-clear)');
    expect(items.length).toBe(1);
    expect(items[0].textContent.trim()).toBe('João Silva');
  });

  it('emits selectionChange with the selected option on item click', () => {
    setup();
    (component as any).isOpen.set(true);
    fixture.detectChanges();
    let emitted: SearchOption | null | undefined;
    component.selectionChange.subscribe((v: SearchOption | null) => (emitted = v));
    const items = fixture.nativeElement.querySelectorAll('li.list-group-item.list-group-item-action');
    (items[0] as HTMLElement).click();
    expect(emitted).toEqual(OPTIONS[0]);
  });

  it('emits selectionChange with null when "Limpar seleção" is clicked', () => {
    setup({ selected: OPTIONS[0] });
    (component as any).isOpen.set(true);
    fixture.detectChanges();
    let emitted: SearchOption | null | undefined;
    component.selectionChange.subscribe((v: SearchOption | null) => (emitted = v));
    const clearItem = fixture.nativeElement.querySelector('li.search-select-clear') as HTMLElement;
    clearItem.click();
    fixture.detectChanges();
    expect(emitted).toBeNull();
  });

  it('shows "Nenhum resultado encontrado" when no matches', () => {
    setup();
    (component as any).isOpen.set(true);
    (component as any).query.set('zzzzzz');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Nenhum resultado encontrado.');
  });

  it('does NOT open modal when disabled', () => {
    setup({ disabled: true });
    const trigger = fixture.nativeElement.querySelector('button.search-select-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('clears query when modal is closed', () => {
    setup();
    (component as any).isOpen.set(true);
    (component as any).query.set('joão');
    fixture.detectChanges();
    (component as any).close();
    expect((component as any).query()).toBe('');
  });

  it('marks selected option with active class', () => {
    setup({ selected: OPTIONS[1] });
    (component as any).isOpen.set(true);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li.list-group-item.active');
    expect(items.length).toBe(1);
    expect(items[0].textContent.trim()).toBe('Maria Santos');
  });
});
