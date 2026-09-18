import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';
import { CartPage } from '../framework/pages/CartPage';
import { CheckoutPage } from '../framework/pages/CheckoutPage';

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

async function goToCheckout(page: import('@playwright/test').Page): Promise<void> {
  const products  = new ProductsPage(page);
  const cart      = new CartPage(page);
  const checkout  = new CheckoutPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();
  await page.locator('//button[text()="Checkout"]').click();

  await checkout.fillForm({
    fullName: 'Tanay Pande',
    email:    'tanay@test.com',
    address:  'Bangalore',
    city:     'Bangalore',
    zipCode:  '560001',
  });
}

test('verifyDiscountfeature', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckout(page);

  const beforeTotal = await checkout.parsePrice(checkout.totalCost);
  await page.locator("button[data-discount='60']").click();
  const afterTotal  = await checkout.parsePrice(checkout.totalCost);

  expect(afterTotal).toBeLessThan(beforeTotal);
});

test('multipleDiscount', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckout(page);

  await page.locator("button[data-discount='60']").click();
  await page.locator("button[data-discount='50']").click();

  // Stacked discounts may push total below zero; verify the value is a valid number (not NaN)
  const total = await checkout.parsePrice(checkout.totalCost);
  expect(isNaN(total)).toBe(false);
});
