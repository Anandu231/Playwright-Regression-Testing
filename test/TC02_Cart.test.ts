import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';
import { CartPage } from '../framework/pages/CartPage';

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

test('addSingleProductToCart', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);

  await expect(cart.counter).toBeVisible();
  await expect(cart.counter).toHaveText('1');
});

test('addingMultipleProduct', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  for (const i of [0, 7, 2, 3, 1]) {
    await products.addToCart(i);
  }

  await expect(cart.counter).toBeVisible();
  expect(parseInt((await cart.counter.textContent()) ?? '0', 10)).toBeGreaterThan(1);
});

test('addSameProducttwice', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();

  await page.locator('.quantity-btn.increase').click();
  await page.waitForTimeout(1000);

  await expect(cart.counter).toHaveText('2');
});

test('verifyCartAfterRefreshing', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();

  const cartItemDetail = await cart.itemDetails.textContent();

  await page.reload();

  await expect(cart.itemDetails).toHaveText(cartItemDetail ?? '');
});

test('increaseAndDecreaseProdQuality', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();

  await cart.increaseBtn.click();
  await page.waitForTimeout(500);
  expect(parseInt((await cart.counter.textContent()) ?? '0', 10)).toBeGreaterThan(1);

  await cart.decreaseBtn.click();
  await page.waitForTimeout(500);
  expect(parseInt((await cart.counter.textContent()) ?? '0', 10)).toBe(1);
});

test('verifyCartTotal', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await products.addToCart(1);
  await cart.navigate();

  await cart.increaseBtn.nth(0).click();
  await page.waitForTimeout(500);

  // Read the displayed subtotal (app rounds it) then verify total = subtotal + tax + shipping
  const subtotal = await cart.parsePrice(cart.subtotal);
  const tax      = await cart.parsePrice(cart.tax);
  const shipping = await cart.parsePrice(cart.shipping);
  expect(await cart.parsePrice(cart.totalCost)).toBeCloseTo(subtotal + tax + shipping, 2);
});

test('verifyEmptyCartState', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.navigate();

  await page.evaluate(() => localStorage.removeItem('miniMartCart'));
  await page.reload();

  const soft = expect.configure({ soft: true });
  await soft(page.locator('#cart-item-counter')).toHaveText('0 items');
  await soft(cart.subtotal).toHaveText('$0.00');
  await soft(cart.shipping).toHaveText('$0.00');
  await soft(cart.tax).toHaveText('$0.00');
  await soft(cart.totalCost).toHaveText('$0.00');
  await soft(cart.checkoutBtn).toBeDisabled();
});

test('verifyProductCanBeAddedToCart', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();
  const btn = products.card(0).locator('.btn-add-to-cart');
  await expect(btn).toBeVisible();
  await btn.click();
});

test('verifyContinueShoppingNavigation', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.navigate();
  await page.getByRole('link', { name: 'Continue Shopping' }).click();
  expect(page.url()).toContain('products.html');
});

test('VerifyStartShoppingNavigationFromEmptyCart', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.navigate();
  await page.evaluate(() => localStorage.removeItem('minMartCart'));
  await page.reload();
});

test('VerifyCheckoutwithProductsinCart', async ({ page }) => {
  const products = new ProductsPage(page);
  const cart     = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();

  await expect(cart.checkoutBtn).toBeEnabled();
  await cart.checkoutBtn.click();

  expect(page.url()).toContain('checkout.html');
});

test('VerifyDiscountedProductPriceIsDisplayedCorrectly', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const card = products.card(0);
  await expect(card).toBeVisible();

  const discountText    = await card.locator('.product-card-discount').textContent() ?? '';
  const originalText    = await card.locator('.product-card-previous-price').textContent() ?? '';
  const finalPriceText  = await card.locator('.product-price-final').textContent() ?? '';

  const discount        = parseFloat(discountText.replace('%', '').replace('-', '').trim());
  const originalPrice   = parseFloat(originalText.replace('$', '').trim());
  const actualFinalPrice = parseFloat(finalPriceText.replace('$', '').trim());

  expect(actualFinalPrice).toBeCloseTo(originalPrice * (1 - discount / 100), 2);
});
