// TC010_Discount.test.ts
// Converted from TC010_Discount.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md

import { test, expect, Page } from '@playwright/test';

async function goToCheckout(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Products' }).click();

  await page.locator('.btn-add-to-cart').first().click();
  await page.locator("a[href='cart.html']").click();
  await page.locator('//button[text()="Checkout"]').click();

  await page.locator('#full-name').fill('Tanay Pande');
  await page.locator('#email').fill('tanay@test.com');
  await page.locator('#address').fill('Bangalore');
  await page.locator('#city').fill('Bangalore');
  await page.locator('#zip-code').fill('560001');
}

test('verifyDiscountfeature', async ({ page }) => {
  await goToCheckout(page);

  const beforeTotalText = await page.locator('#total-cost').textContent() ?? '';
  const beforeTotal = parseFloat(beforeTotalText.replace('$', ''));

  await page.locator("button[data-discount='60']").click();

  const afterTotalText = await page.locator('#total-cost').textContent() ?? '';
  const afterTotal = parseFloat(afterTotalText.replace('$', ''));

  expect(afterTotal).toBeLessThan(beforeTotal);
});

test('multipleDiscount', async ({ page }) => {
  await goToCheckout(page);

  await page.locator("button[data-discount='60']").click();
  await page.locator("button[data-discount='50']").click();

  const afterTotalText = await page.locator('#total-cost').textContent() ?? '';
  const afterTotal = parseFloat(afterTotalText.replace('$', ''));

  expect(afterTotal).toBeGreaterThan(0);
});
