// TC01_Product.test.ts
// Converted from TC01_Product.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md

import { test, expect, Page } from '@playwright/test';

async function searchProduct(page: Page, productName: string): Promise<void> {
  await page.getByRole('link', { name: 'Products' }).click();

  const searchBox = page.locator('#searchinput');
  await expect(searchBox).toBeVisible();

  await searchBox.clear();
  await searchBox.fill(productName);

  const productTitles = await page.locator('div.product-card h3.product-title').allTextContents();

  const found = productTitles.some(title =>
    title.toLowerCase().includes(productName.toLowerCase())
  );

  expect(found, `${productName} product was not found`).toBeTruthy();
}

test('SearchPartialKeyword', async ({ page }) => {
  await searchProduct(page, 'Eye');
});

test('SearchFullKeyword', async ({ page }) => {
  await searchProduct(page, 'Mascara');
});

// Commented out in original:
// test.skip('dummy', async ({ page }) => {
//   expect(false).toBeTruthy();
// });
