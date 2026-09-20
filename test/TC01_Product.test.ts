import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

async function searchProduct(page: import('@playwright/test').Page, term: string): Promise<void> {
  const products = new ProductsPage(page);
  await products.navigate();
  await products.search(term);

  const titles = await page.locator('div.product-card h3.product-title').allTextContents();
  expect(titles.length).toBeGreaterThan(0);
  for (const title of titles) {
    expect(title.toLowerCase()).toContain(term.toLowerCase());
  }
}

test('SearchPartialKeyword', async ({ page }) => {
  await searchProduct(page, 'Eye');
});

test('SearchFullKeyword', async ({ page }) => {
  await searchProduct(page, 'Mascara');
});
