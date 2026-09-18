import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  readonly container: Locator;
  readonly cards: Locator;
  readonly searchInput: Locator;
  readonly sortSelect: Locator;
  readonly nextBtn: Locator;
  readonly applyFiltersBtn: Locator;
  readonly clearFiltersBtn: Locator;
  readonly productCountText: Locator;
  readonly noProducts: Locator;

  constructor(page: Page) {
    super(page);
    this.container        = page.locator('.products-main-container');
    this.cards            = page.locator('.product-card');
    this.searchInput      = page.locator('#searchinput');
    this.sortSelect       = page.locator('#sort-select');
    this.nextBtn          = page.locator('#next-btn');
    this.applyFiltersBtn  = page.locator('#apply-filters');
    this.clearFiltersBtn  = page.locator('#clear-filters');
    this.productCountText = page.locator('#product-count-text');
    this.noProducts       = page.locator('.no-products');
  }

  async navigate(): Promise<void> {
    await this.page.getByRole('link', { name: 'Products' }).click();
    await expect(this.container).toBeVisible({ timeout: 10_000 });
  }

  card(index: number): Locator {
    return this.cards.nth(index);
  }

  async cardName(index: number): Promise<string> {
    return (await this.card(index).locator('h3.product-title').textContent())?.trim() ?? '';
  }

  async cardPrice(index: number): Promise<string> {
    return (await this.card(index).locator('.product-price-final').textContent())?.trim() ?? '';
  }

  async cardImageSrc(index: number): Promise<string | null> {
    return this.card(index).locator('.product-image-container img').first().getAttribute('src');
  }

  async clickHeart(index: number): Promise<void> {
    const heart = this.card(index).locator('.btn-favorite');
    await heart.scrollIntoViewIfNeeded();
    await heart.click();
  }

  async isWishlisted(index: number): Promise<boolean> {
    const cls = (await this.card(index).locator('.btn-favorite').getAttribute('class')) ?? '';
    return cls.split(/\s+/).includes('active');
  }

  async addToCart(index: number): Promise<void> {
    const btn = this.card(index).locator('.btn-add-to-cart');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async selectFilter(filterLocator: string): Promise<void> {
    await this.page.locator(filterLocator).click();
    await this.page.waitForTimeout(500);
  }

  async applyFilters(): Promise<void> {
    await this.applyFiltersBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersBtn.click();
    await this.page.waitForTimeout(2000);
  }

  /** Collect values from a locator across all paginated pages. */
  async collectAcrossPages<T>(selector: string, extract: (text: string) => T): Promise<T[]> {
    const results: T[] = [];
    while (true) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        const text = ((await elements.nth(i).textContent()) ?? '').trim();
        results.push(extract(text));
      }
      const firstTitle = ((await this.page.locator('.product-title').first().textContent()) ?? '').trim();
      const disabled   = await this.nextBtn.getAttribute('disabled');
      const classes    = (await this.nextBtn.getAttribute('class')) ?? '';
      if (disabled !== null || classes.includes('disabled')) break;
      await this.nextBtn.click();
      await this.page.waitForFunction(
        (prev: string) => {
          const el = document.querySelector('.product-title');
          return el !== null && el.textContent?.trim() !== prev;
        },
        firstTitle
      );
    }
    return results;
  }

  /** Add up to `limit` non-wishlisted products across pages. Pass 0 for all. */
  async addProductsToWishlist(limit: number): Promise<number> {
    let counter = 0;
    while (true) {
      const count = await this.cards.count();
      for (let i = 0; i < count; i++) {
        if (limit > 0 && counter >= limit) return counter;
        const heart = this.card(i).locator('.btn-favorite');
        const classes = (await heart.getAttribute('class')) ?? '';
        if (!classes.includes('active')) {
          await heart.scrollIntoViewIfNeeded();
          // Use force:true so a toast overlay does not block the click
          await heart.click({ force: true });
          counter++;
        }
      }
      if ((await this.nextBtn.count()) === 0 || (await this.nextBtn.isDisabled())) break;
      await this.nextBtn.click();
    }
    return counter;
  }

  async search(term: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.clear();
    await this.searchInput.fill(term);
  }
}
