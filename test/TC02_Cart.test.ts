// TC02_Cart.test.ts
// Converted from TC02_Cart.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md

import { test, expect, Page } from '@playwright/test';

async function navigateToProducts(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Products' }).click();
}

async function navigateToCart(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Cart' }).click();
}

test('addSingleProductToCart', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  console.log('Add to cart buttons: ' + (await addButtons.count()));

  await addButtons.first().click();
  await page.waitForTimeout(1000);

  console.log('Current URL: ' + page.url());

  const counter = page.locator('#cart-counter');
  await expect(counter).toBeVisible();
  await expect(counter).toHaveText('1');
});

test('addingMultipleProduct', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  console.log('Add to cart buttons: ' + (await addButtons.count()));

  await addButtons.nth(0).click();
  await addButtons.nth(7).click();
  await addButtons.nth(2).click();
  await addButtons.nth(3).click();
  await addButtons.nth(1).click();

  const counter = page.locator('#cart-counter');
  await expect(counter).toBeVisible();

  const text = await counter.textContent();
  console.log(text);
  expect(parseInt(text ?? '0', 10)).toBeGreaterThan(1);
});

test('addSameProducttwice', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  console.log('Add to cart buttons: ' + (await addButtons.count()));

  await addButtons.first().click();

  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(2000);

  await page.locator('.quantity-btn.increase').click();
  await page.waitForTimeout(2000);

  const counter = page.locator('#cart-counter');
  await expect(counter).toHaveText('2');
});

test('verifyCartAfterRefreshing', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  await addButtons.first().click();

  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: 'Cart' }).click();

  const cartDetail = page.locator('.cart-item-details');
  const cartItemDetail = await cartDetail.textContent();
  console.log(cartItemDetail);

  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForTimeout(1000);

  await expect(page.locator('.cart-item-details')).toHaveText(cartItemDetail ?? '');
});

test('increaseAndDecreaseProdQuality', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  console.log('Add to cart buttons: ' + (await addButtons.count()));

  await addButtons.first().click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(2000);

  const increase = page.locator('.quantity-btn.increase');
  const counter = page.locator('#cart-counter');

  await increase.click();
  await page.waitForTimeout(1000);

  const afterIncrease = parseInt((await counter.textContent()) ?? '0', 10);
  expect(afterIncrease).toBeGreaterThan(1);

  await page.locator('.quantity-btn.decrease').click();
  await page.waitForTimeout(1000);

  const afterDecrease = parseInt((await counter.textContent()) ?? '0', 10);
  expect(afterDecrease).toBe(1);
});

test('verifyCartTotal', async ({ page }) => {
  await navigateToProducts(page);

  const addButtons = page.locator('.btn-add-to-cart');
  await addButtons.nth(0).click();
  await addButtons.nth(1).click();

  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(1000);

  const priceEls = page.locator('.cart-item-price');
  const price1Text = await priceEls.nth(0).textContent();
  const price2Text = await priceEls.nth(1).textContent();

  console.log(price1Text);

  const price1 = parseFloat((price1Text ?? '').replace('$', ''));
  const price2 = parseFloat((price2Text ?? '').replace('$', ''));

  const increaseButtons = page.locator('.quantity-btn.increase');
  await increaseButtons.nth(0).click();
  await page.waitForTimeout(1000);

  const expectedSubtotal = (price1 * 2) + price2;
  const actualSubtotalText = await page.locator('#total').textContent();
  const actualSubtotal = parseFloat((actualSubtotalText ?? '').replace('$', ''));
  expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);

  const taxText = await page.locator('#tax').textContent();
  const shippingText = await page.locator('#shipping').textContent();

  const tax = parseFloat((taxText ?? '').replace('$', ''));
  const shipping = parseFloat((shippingText ?? '').replace('$', ''));

  const expectedTotal = expectedSubtotal + tax + shipping;
  const actualTotalText = await page.locator('#total-cost').textContent();
  const actualTotal = parseFloat((actualTotalText ?? '').replace('$', ''));

  expect(actualTotal).toBeCloseTo(expectedTotal, 2);
});

test('verifyEmptyCartState', async ({ page }) => {
  await navigateToCart(page);

  await page.evaluate(() => localStorage.removeItem('miniMartCart'));
  await page.reload();

  const soft = expect.configure({ soft: true });
  await soft(page.locator('#cart-item-counter')).toHaveText('0 items');
  await soft(page.locator('#total')).toHaveText('$0.00');
  await soft(page.locator('#shipping')).toHaveText('$0.00');
  await soft(page.locator('#tax')).toHaveText('$0.00');
  await soft(page.locator('#total-cost')).toHaveText('$0.00');
  await soft(page.locator('#btn-checkout')).toBeDisabled();
});

test('verifyProductCanBeAddedToCart', async ({ page }) => {
  await navigateToProducts(page);
  const button = page.locator('.btn-add-to-cart').first();
  await expect(button).toBeVisible();
  await button.click();
});

test('verifyContinueShoppingNavigation', async ({ page }) => {
  await navigateToCart(page);
  await page.getByRole('link', { name: 'Continue Shopping' }).click();
  expect(page.url()).toContain('products.html');
});

test('VerifyStartShoppingNavigationFromEmptyCart', async ({ page }) => {
  await navigateToCart(page);
  await page.evaluate(() => localStorage.removeItem('minMartCart'));
  await page.reload();
  // Original test had no assertion; reload just verifies no crash
});

test('VerifyCheckoutwithProductsinCart', async ({ page }) => {
  await navigateToProducts(page);

  const button = page.locator('.btn-add-to-cart').first();
  await expect(button).toBeVisible();
  await button.click();

  await navigateToCart(page);

  const checkout = page.locator('#btn-checkout');
  await expect(checkout).toBeEnabled();
  await checkout.click();

  expect(page.url()).toContain('checkout.html');
});

// Commented out in original: VerifyOrderSummaryCalculation
// test.skip('VerifyOrderSummaryCalculation', async ({ page }) => { ... });

test('VerifyDiscountedProductPriceIsDisplayedCorrectly', async ({ page }) => {
  await navigateToProducts(page);

  const productCard = page.locator('.product-card').first();
  await expect(productCard).toBeVisible();

  const discountText = await productCard.locator('.product-card-discount').textContent() ?? '';
  const originalText = await productCard.locator('.product-card-previous-price').textContent() ?? '';
  const finalPriceText = await productCard.locator('.product-price-final').textContent() ?? '';

  const discount = parseFloat(discountText.replace('%', '').replace('-', '').trim());
  const originalPrice = parseFloat(originalText.replace('$', '').trim());
  const actualFinalPrice = parseFloat(finalPriceText.replace('$', '').trim());

  const expectedFinalPrice = originalPrice * (1 - discount / 100.0);

  expect(actualFinalPrice).toBeCloseTo(expectedFinalPrice, 2);
});
