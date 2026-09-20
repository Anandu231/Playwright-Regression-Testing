import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  // Form inputs
  readonly fullName: Locator;
  readonly email: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly zipCode: Locator;

  // Validation errors
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly addressError: Locator;
  readonly cityError: Locator;
  readonly zipError: Locator;

  // Order summary / totals
  readonly orderSummary: Locator;
  readonly orderItems: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly shipping: Locator;
  readonly totalCost: Locator;

  // Buttons
  readonly placeOrderBtn: Locator;
  readonly backToCartBtn: Locator;
  readonly continueShoppingBtn: Locator;

  // Success state
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.fullName            = page.locator('#full-name');
    this.email               = page.locator('#email');
    this.address             = page.locator('#address');
    this.city                = page.locator('#city');
    this.zipCode             = page.locator('#zip-code');

    this.nameError           = page.locator('#name-error');
    this.emailError          = page.locator('#email-error');
    this.addressError        = page.locator('#address-error');
    this.cityError           = page.locator('#city-error');
    this.zipError            = page.locator('#zip-error');

    this.orderSummary        = page.locator('.order-summary-checkout');
    this.orderItems          = page.locator('#order-items');
    this.subtotal            = page.locator('#subtotal');
    this.tax                 = page.locator('#tax');
    this.shipping            = page.locator('#shipping');
    this.totalCost           = page.locator('#total-cost');

    this.placeOrderBtn       = page.locator('#btn-place-order');
    this.backToCartBtn       = page.locator('.btn-back-cart');
    this.continueShoppingBtn = page.locator('.btn-continue-shopping');

    this.successMessage      = page.locator('#success-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('checkout.html');
  }

  async fillForm(data: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
  }): Promise<void> {
    await this.fullName.fill(data.fullName);
    await this.email.fill(data.email);
    await this.address.fill(data.address);
    await this.city.fill(data.city);
    await this.zipCode.fill(data.zipCode);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderBtn.click();
  }

  async parsePrice(locator: Locator): Promise<number> {
    const text = await locator.textContent() ?? '';
    return parseFloat(text.replace('$', '').trim());
  }
}
