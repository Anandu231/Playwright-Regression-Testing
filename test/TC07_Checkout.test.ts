import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';
import { CartPage } from '../framework/pages/CartPage';
import { CheckoutPage } from '../framework/pages/CheckoutPage';

const VALID_FORM = {
  fullName: 'Rahul Sharma',
  email:    'rahul.sharma@example.com',
  address:  '42 MG Road, Indiranagar',
  city:     'Bengaluru',
  zipCode:  '56003',
};

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

async function goToCheckoutWithOneItem(page: import('@playwright/test').Page): Promise<void> {
  const products  = new ProductsPage(page);
  const cart      = new CartPage(page);

  await products.navigate();
  await products.addToCart(0);
  await cart.navigate();

  await page.locator('#btn-checkout').click();
}

test('checkoutPageLoadsCorrectly', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);

  await expect(page).toHaveURL(/checkout\.html/);

  for (const locator of [
    page.locator('.checkout-left-side'),
    page.locator('.checkout-right-side'),
    checkout.placeOrderBtn,
    checkout.backToCartBtn,
    checkout.fullName,
    checkout.email,
    checkout.address,
    checkout.city,
    checkout.zipCode,
  ]) {
    await expect(locator).toBeVisible();
  }
});

test('acceptsValidInformation', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);
  await checkout.fillForm(VALID_FORM);
  await checkout.placeOrder();

  await expect(checkout.successMessage).toBeVisible();
  await expect(checkout.successMessage.locator('h2')).toHaveText('Order Placed Successfully!');
  expect(((await checkout.successMessage.getAttribute('class')) ?? '')).toContain('show');
  await expect(checkout.continueShoppingBtn).toBeVisible();
});

test('navigateBackToCart', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);
  await checkout.backToCartBtn.click();
  await expect(page).toHaveURL(/cart\.html/);
});

test('emailValidation', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);

  await checkout.fillForm({ ...VALID_FORM, email: 'rahul.sharmaexamplecom' });
  await checkout.placeOrder();

  expect(((await checkout.emailError.getAttribute('class')) ?? '')).toContain('show');
});

test('requiredFieldValidation', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);
  await checkout.placeOrder();

  // Validation errors — the app shows them via inline display style; check text is non-empty
  for (const err of [checkout.nameError, checkout.emailError, checkout.addressError, checkout.cityError, checkout.zipError]) {
    await expect(err).not.toBeEmpty();
  }
});

test('costCalculationCheck', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);

  // Wait for the order summary to populate (subtotal must be > 0)
  await expect.poll(async () => await checkout.parsePrice(checkout.subtotal), { timeout: 5_000 })
    .toBeGreaterThan(0);

  const subTotal  = await checkout.parsePrice(checkout.subtotal);
  const shipping  = await checkout.parsePrice(checkout.shipping);
  const tax       = await checkout.parsePrice(checkout.tax);
  const totalCost = await checkout.parsePrice(checkout.totalCost);

  expect(shipping).toBeCloseTo(10.0, 2);
  expect(tax).toBeCloseTo(0.14 * subTotal, 2);
  // Compare displayed total vs displayed components (app rounds each independently)
  expect(totalCost).toBeCloseTo(subTotal + tax + shipping, 1);
});

test('verifyPositiveTotalCost', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await goToCheckoutWithOneItem(page);
  // Wait for order summary to load before reading the total
  await expect.poll(async () => await checkout.parsePrice(checkout.totalCost), { timeout: 5_000 })
    .toBeGreaterThan(0);
});
