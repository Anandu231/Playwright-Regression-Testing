import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly counter: Locator;
  readonly items: Locator;
  readonly itemDetails: Locator;
  readonly itemPrices: Locator;
  readonly increaseBtn: Locator;
  readonly decreaseBtn: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly shipping: Locator;
  readonly totalCost: Locator;
  readonly cartItemCounter: Locator;
  readonly checkoutBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.counter         = page.locator('#cart-counter');
    this.items           = page.locator('.cart-item');
    this.itemDetails     = page.locator('.cart-item-details');
    this.itemPrices      = page.locator('.cart-item-price');
    this.increaseBtn     = page.locator('.quantity-btn.increase');
    this.decreaseBtn     = page.locator('.quantity-btn.decrease');
    this.subtotal        = page.locator('#total');
    this.tax             = page.locator('#tax');
    this.shipping        = page.locator('#shipping');
    this.totalCost       = page.locator('#total-cost');
    this.cartItemCounter = page.locator('#cart-item-counter');
    this.checkoutBtn     = page.locator('#btn-checkout');
  }

  async navigate(): Promise<void> {
    await this.page.locator("a[href='cart.html']").first().click();
  }

  async badgeCount(): Promise<number> {
    const text = await this.counter.textContent();
    return parseInt((text ?? '').trim(), 10) || 0;
  }

  async parsePrice(locator: Locator): Promise<number> {
    const text = await locator.textContent() ?? '';
    return parseFloat(text.replace('$', ''));
  }
}
