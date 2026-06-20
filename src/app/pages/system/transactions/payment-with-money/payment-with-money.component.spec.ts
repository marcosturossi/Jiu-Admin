import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentWithMoney, PaymentWithMoneyComponent } from './payment-with-money.component';

describe('PaymentWithMoneyComponent', () => {
  let component: PaymentWithMoneyComponent;
  let fixture: ComponentFixture<PaymentWithMoneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentWithMoneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentWithMoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
