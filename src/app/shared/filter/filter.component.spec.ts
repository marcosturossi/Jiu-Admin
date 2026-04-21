import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterComponent } from './filter.component';
import { OperationEnum } from '../interface/filter.interface';

describe('FilterComponent', () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filterKeys', ['name', 'email']);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should emit closeFilterEvent when close() is called', () => {
    let emitted = false;
    component.closeFilterEvent.subscribe(() => (emitted = true));
    component.close();
    expect(emitted).toBeTrue();
  });

  it('should not emit setFilterEvent when save() called with no key selected', () => {
    let emitted = false;
    component.setFilterEvent.subscribe(() => (emitted = true));
    (component as any).selectedFilterKey.set('');
    component.save();
    expect(emitted).toBeFalse();
  });

  it('should emit setFilterEvent and closeFilterEvent when save() called with key set', () => {
    const events: any[] = [];
    let closedCount = 0;
    component.setFilterEvent.subscribe(e => events.push(e));
    component.closeFilterEvent.subscribe(() => closedCount++);
    (component as any).selectedFilterKey.set('name');
    (component as any).value.set('Carlos');
    (component as any).selectedOperation.set(OperationEnum.like);
    component.save();
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ key: 'name', operation: OperationEnum.like, value: 'Carlos' });
    expect(closedCount).toBe(1);
  });

  it('should expose OperationEnum values as operations array', () => {
    const ops = (component as any).operations as string[];
    expect(ops).toContain(OperationEnum.eq);
    expect(ops).toContain(OperationEnum.like);
  });
});
