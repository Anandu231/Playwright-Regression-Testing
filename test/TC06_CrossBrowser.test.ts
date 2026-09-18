import { test, expect } from '@playwright/test';
import { BASE_URL } from '../framework/pages/BasePage';
import { ProductsPage } from '../framework/pages/ProductsPage';
import { CheckoutPage } from '../framework/pages/CheckoutPage';

const CHECKOUT_URL = `${BASE_URL}checkout.html`;
const PRODUCTS_URL = `${BASE_URL}products.html`;

const CART_STORAGE_KEY       = 'miniMartCart';
const CART_LOCALSTORAGE_JSON = '[{"id":1,"title":"Mascara","price":9.99,"discountPercentage":0,"quantity":2}]';

const PRODUCTS_PER_PAGE = 12;

test('verifyCheckoutForm', async ({ page, browserName }) => {
  await page.goto(CHECKOUT_URL);
  const checkout = new CheckoutPage(page);

  await expect(checkout.fullName).toBeVisible();
  await expect(checkout.email).toBeVisible();
  await expect(checkout.address).toBeVisible();
  await expect(checkout.city).toBeVisible();
  await expect(checkout.zipCode).toBeVisible();
  await expect(checkout.orderSummary).toBeVisible();
  await expect(checkout.placeOrderBtn).toBeVisible();

  console.log(`[${browserName}] Checkout form verified.`);
});

test('verifyESModuleLoading', async ({ page, browserName }) => {
  const jsErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text().toLowerCase();
      if (
        text.includes('syntaxerror') || text.includes('import') || text.includes('export') ||
        text.includes('cors') || text.includes('failed to fetch') || text.includes('cannot use import')
      ) {
        jsErrors.push(msg.text());
      }
    }
  });

  await page.goto(BASE_URL);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CART_STORAGE_KEY, CART_LOCALSTORAGE_JSON]);

  const written = await page.evaluate((key: string) => localStorage.getItem(key), CART_STORAGE_KEY);
  expect(written, `[${browserName}] Failed to seed cart`).not.toBeNull();

  await page.goto(CHECKOUT_URL);
  await page.waitForFunction(() => {
    const el = document.getElementById('order-items');
    if (!el) return false;
    const text = el.textContent ?? '';
    return !text.includes('Your cart is empty') && text.trim() !== '';
  });

  expect(jsErrors, `[${browserName}] JS module errors: ${jsErrors.join('; ')}`).toHaveLength(0);

  const checkout = new CheckoutPage(page);
  await expect(checkout.orderItems).not.toContainText('Your cart is empty');

  console.log(`[${browserName}] ES module loading verified.`);
});

test('verifyResponsiveGrid', async ({ page, browserName }) => {
  const viewports = [
    { label: 'Desktop', width: 1366, height: 768,  minCols: 3, maxCols: 5 },
    { label: 'Tablet',  width: 768,  height: 1024, minCols: 2, maxCols: 3 },
    { label: 'Mobile',  width: 425,  height: 812,  minCols: 1, maxCols: 2 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(PRODUCTS_URL);
    await page.waitForFunction((n: number) => document.querySelectorAll('.product-card').length >= n, PRODUCTS_PER_PAGE);
    await page.waitForTimeout(500);

    const gridTemplateColumns: string = await page.evaluate(() => {
      const container = document.getElementById('products-container');
      return container ? window.getComputedStyle(container).gridTemplateColumns : '0';
    });
    const cols = gridTemplateColumns && gridTemplateColumns !== 'none' && gridTemplateColumns !== '0'
      ? gridTemplateColumns.trim().split(/\s+/).length
      : 0;

    console.log(`[${browserName}] ${vp.label} (${vp.width}px) columns: ${cols}`);
    expect(cols >= vp.minCols && cols <= vp.maxCols, `[${browserName}] ${vp.label}: expected ${vp.minCols}–${vp.maxCols} cols, got ${cols}`).toBeTruthy();

    // verify images not stretched
    const images = page.locator('#products-container .product-image');
    const imageCount = await images.count();
    expect(imageCount, `[${browserName}][${vp.label}] No product images`).toBeGreaterThan(0);
    for (let i = 0; i < imageCount; i++) {
      const naturalWidth: number = await images.nth(i).evaluate(el => (el as HTMLImageElement).naturalWidth);
      expect(naturalWidth, `[${browserName}][${vp.label}] Broken image`).toBeGreaterThan(0);
      const rendered:  number = await images.nth(i).evaluate(el => el.getBoundingClientRect().width);
      const container: number = await images.nth(i).evaluate(el => el.parentElement!.getBoundingClientRect().width);
      expect(rendered <= container + 2, `[${browserName}][${vp.label}] Image wider than container`).toBeTruthy();
    }
  }

  console.log(`[${browserName}] Responsive grid verified at all viewports.`);
});

test('verifyMobileCheckoutLayout', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CART_STORAGE_KEY, CART_LOCALSTORAGE_JSON]);
  await page.goto(CHECKOUT_URL);

  const checkout = new CheckoutPage(page);
  await expect(checkout.fullName).toBeVisible();

  const flexDirection = await page.evaluate(() =>
    window.getComputedStyle(document.querySelector('.checkout-container')!).flexDirection
  );
  expect(flexDirection).toBe('column');

  const formBottom: number = await page.evaluate(() => document.querySelector('.checkout-left-side')!.getBoundingClientRect().bottom);
  const summaryTop:  number = await page.evaluate(() => document.querySelector('.checkout-right-side')!.getBoundingClientRect().top);
  expect(summaryTop >= formBottom - 2, `[${browserName}] Summary should appear below form`).toBeTruthy();

  const viewportWidth: number = await page.evaluate(() => window.innerWidth);
  const inputs = page.locator('.checkout-form .form-group input');
  const inputCount = await inputs.count();
  expect(inputCount).toBeGreaterThan(0);
  for (let i = 0; i < inputCount; i++) {
    const w: number = await inputs.nth(i).evaluate(el => el.getBoundingClientRect().width);
    expect(w <= viewportWidth + 2, `[${browserName}] Input wider than viewport`).toBeTruthy();
  }

  const scrollWidth: number = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth <= viewportWidth + 2, `[${browserName}] Horizontal overflow detected`).toBeTruthy();

  await checkout.placeOrderBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const btnLeft:  number = await page.evaluate(() => document.getElementById('btn-place-order')!.getBoundingClientRect().left);
  const btnRight: number = await page.evaluate(() => document.getElementById('btn-place-order')!.getBoundingClientRect().right);
  expect(btnLeft >= 0, `[${browserName}] Place Order button cut off on left`).toBeTruthy();
  expect(btnRight <= viewportWidth + 2, `[${browserName}] Place Order button overflows right`).toBeTruthy();

  await checkout.backToCartBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const backLeft:  number = await page.evaluate(() => document.querySelector('.btn-back-cart')!.getBoundingClientRect().left);
  const backRight: number = await page.evaluate(() => document.querySelector('.btn-back-cart')!.getBoundingClientRect().right);
  expect(backLeft >= 0, `[${browserName}] Back to Cart cut off on left`).toBeTruthy();
  expect(backRight <= viewportWidth + 2, `[${browserName}] Back to Cart overflows right`).toBeTruthy();

  console.log(`[${browserName}] Mobile checkout layout verified.`);
});
