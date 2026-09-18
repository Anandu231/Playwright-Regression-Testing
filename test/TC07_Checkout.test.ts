// TC07_Checkout.test.ts
// Converted from TC07_Checkout.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md

import { test, expect, Page } from '@playwright/test';

const INPUT_SELECTORS = [
  "input[id='full-name']",
  "input[id='email']",
  "input[id='address']",
  "input[id='city']",
  "input[id='zip-code']",
];

const VALID_INFORMATION = [
  'Rahul Sharma',
  'rahul.sharma@example.com',
  '42 MG Road, Indiranagar',
  'Bengaluru',
  '56003',
];

async function preCondition(page: Page): Promise<void> {
  await page.locator('.product-card .btn-add-to-cart').first().click();
  await page.locator(".icons li a[href='cart.html']").click();
  await page.locator('.btn-checkout').click();
}

async function clickOrderButton(page: Page): Promise<void> {
  await page.locator('.btn-place-order').click();
}

test('checkoutPageLoadsCorrectly', async ({ page }) => {
  await page.locator('.product-card .btn-add-to-cart').first().click();
  await page.locator(".icons li a[href='cart.html']").click();
  await page.locator('.btn-checkout').click();

  await expect(page).toHaveURL(
    'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/checkout.html'
  );

  const elementSelectors = [
    '.checkout-left-side',
    '.checkout-right-side',
    '.btn-place-order',
    '.btn-back-cart',
    "input[id='full-name']",
    "input[id='email']",
    "input[id='address']",
    "input[id='city']",
    "input[id='zip-code']",
  ];

  for (const selector of elementSelectors) {
    await expect(page.locator(selector)).toBeVisible();
  }
});

test('acceptsValidInformation', async ({ page }) => {
  await preCondition(page);

  for (let i = 0; i < INPUT_SELECTORS.length; i++) {
    await page.locator(INPUT_SELECTORS[i]).fill(VALID_INFORMATION[i]);
  }

  await clickOrderButton(page);

  const successSection = page.locator('#success-message');
  await expect(successSection).toBeVisible();
  await expect(successSection.locator('h2')).toHaveText('Order Placed Successfully!');

  const cls = await successSection.getAttribute('class') ?? '';
  expect(cls).toContain('show');

  await expect(page.locator('.btn-continue-shopping')).toBeVisible();
});

test('navigateBackToCart', async ({ page }) => {
  await preCondition(page);

  await page.locator('.btn-back-cart').click();

  await page.waitForURL(
    'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/cart.html'
  );

  await expect(page).toHaveURL(
    'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/cart.html'
  );
});

test('emailValidation', async ({ page }) => {
  await preCondition(page);

  for (let i = 0; i < INPUT_SELECTORS.length; i++) {
    const value = VALID_INFORMATION[i] === 'rahul.sharma@example.com'
      ? 'rahul.sharmaexamplecom'
      : VALID_INFORMATION[i];
    await page.locator(INPUT_SELECTORS[i]).fill(value);
  }

  await clickOrderButton(page);

  const emailError = page.locator('#email-error');
  const cls = await emailError.getAttribute('class') ?? '';
  expect(cls).toContain('show');
});

test('requiredFieldValidation', async ({ page }) => {
  await preCondition(page);

  const validationErrorSelectors = [
    '#name-error',
    '#email-error',
    '#address-error',
    '#city-error',
    '#zip-error',
  ];

  await clickOrderButton(page);

  for (const selector of validationErrorSelectors) {
    await expect(page.locator(selector)).toBeVisible();
  }
});

test('costCalculationCheck', async ({ page }) => {
  await preCondition(page);

  const subtotalText   = await page.locator('#subtotal').textContent() ?? '';
  const shippingText   = await page.locator('#shipping').textContent() ?? '';
  const taxText        = await page.locator('#tax').textContent() ?? '';
  const totalCostText  = await page.locator('#total-cost').textContent() ?? '';

  const fetchedSubTotal  = parseFloat(subtotalText.substring(1));
  const fetchedShipping  = parseFloat(shippingText.substring(1));
  const fetchedTax       = parseFloat(taxText.substring(1));
  const fetchedTotalCost = parseFloat(totalCostText.substring(1));

  const shipping = 10.0;
  const tax      = 0.14 * fetchedSubTotal;
  const totalCost = shipping + tax + fetchedSubTotal;

  expect(fetchedShipping).toBeCloseTo(shipping, 2);
  expect(fetchedTax).toBeCloseTo(tax, 2);
  expect(fetchedTotalCost).toBeCloseTo(totalCost, 2);
});

test('verifyPositiveTotalCost', async ({ page }) => {
  await preCondition(page);

  const totalCostText = await page.locator('#total-cost').textContent() ?? '';
  const fetchedTotalCost = parseFloat(totalCostText.substring(1));

  expect(fetchedTotalCost).toBeGreaterThan(0);
});
