import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WishlistPage extends BasePage {
  readonly badge: Locator;
  readonly container: Locator;
  readonly items: Locator;
  readonly emptyState: Locator;
  readonly startShoppingBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.badge            = page.locator('#fav-count');
    this.container        = page.locator('.favorites-main');
    this.items            = page.locator('.favorites-main .product-card');
    this.emptyState       = page.locator('.empty-favorites');
    this.startShoppingBtn = page.locator('.shop-btn');
  }

  async navigate(): Promise<void> {
    await this.page.locator('a[href="favorites.html"]').first().click();
    await expect(this.container).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(
        async () => {
          const itemCount  = await this.items.count();
          const emptyCount = await this.emptyState.count();
          return itemCount > 0 || emptyCount > 0;
        },
        { timeout: 10_000 }
      )
      .toBe(true);
  }

  item(index: number): Locator {
    return this.items.nth(index);
  }

  async itemName(index: number): Promise<string> {
    return (await this.item(index).locator('div.product-title, h3.product-title').first().textContent())?.trim() ?? '';
  }

  async itemPrice(index: number): Promise<string> {
    return (await this.item(index).locator('.product-price-final').first().textContent())?.trim() ?? '';
  }

  async itemImageSrc(index: number): Promise<string | null> {
    return this.item(index).locator('.product-image-container img').first().getAttribute('src');
  }

  async removeItem(index: number): Promise<void> {
    const btn = this.item(index).locator('.btn-favorite');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async addToCartFromItem(index: number): Promise<void> {
    const btn = this.item(index).locator('.btn-add-to-cart');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async badgeCount(): Promise<number> {
    try {
      const text   = await this.badge.textContent();
      const digits = (text ?? '').trim().replace(/[^0-9]/g, '');
      return digits ? parseInt(digits, 10) : 0;
    } catch {
      return 0;
    }
  }

  async containsProduct(productName: string): Promise<boolean> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    const count = await this.items.count();
    for (let i = 0; i < count; i++) {
      if ((await this.itemName(i)).toLowerCase() === productName.toLowerCase()) return true;
    }
    return false;
  }
}
