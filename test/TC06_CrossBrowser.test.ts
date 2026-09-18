// TC06_CrossBrowser.test.ts
// Converted from TC06_CrossBrowser.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md
//
// Cross-browser strategy:
//   In Playwright, cross-browser is handled by the projects config in playwright.config.ts:
//
//     projects: [
//       { name: 'chromium', use: { browserName: 'chromium' } },
//       { name: 'firefox',  use: { browserName: 'firefox'  } },
//       { name: 'webkit',   use: { browserName: 'webkit'   } },
//     ]
//
//   Every test in this file runs automatically against all three browsers.
//   No manual ChromeDriver / EdgeDriver / FirefoxDriver setup is needed.
//
//   Note: WebKit (Safari) replaces Edge for cross-browser coverage in Playwright.
//   Console log checking (verifyESModuleLoading) uses page.on('console') — Playwright
//   captures console messages natively on all browsers.

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL     = 'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/';
const CHECKOUT_URL = 'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/checkout.html';
const PRODUCTS_URL = 'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/products.html';

const CART_STORAGE_KEY       = 'miniMartCart';
const CART_LOCALSTORAGE_JSON = '[{"id":1,"title":"Mascara","price":9.99,"discountPercentage":0,"quantity":2}]';

// ─── Locators ────────────────────────────────────────────────────────────────

const FIELD_FULL_NAME = '#full-name';
const FIELD_EMAIL     = '#email';
const FIELD_ADDRESS   = '#address';
const FIELD_CITY      = '#city';
const FIELD_ZIP       = '#zip-code';
const ORDER_SUMMARY   = '.order-summary-checkout';
const SUBMIT_BUTTON   = '#btn-place-order';
const CART_COUNTER    = '#cart-counter';
const ORDER_ITEMS     = '#order-items';
const PRODUCTS_CONTAINER = '#products-container';
const PRODUCT_CARDS   = '#products-container .product-card';
const PRODUCT_IMAGES  = '#products-container .product-image';
const PLACE_ORDER_BTN = SUBMIT_BUTTON;
const BACK_TO_CART_BTN = '.btn-back-cart';
const FORM_INPUTS     = '.checkout-form .form-group input';

const PRODUCTS_PER_PAGE = 12;

// ─── Helper: verify checkout form elements ────────────────────────────────────

async function verifyCheckoutFormElements(page: Page, browserName: string): Promise<void> {
  await expect(page.locator(FIELD_FULL_NAME)).toBeVisible();
  await expect(page.locator(FIELD_EMAIL)).toBeVisible();
  await expect(page.locator(FIELD_ADDRESS)).toBeVisible();
  await expect(page.locator(FIELD_CITY)).toBeVisible();
  await expect(page.locator(FIELD_ZIP)).toBeVisible();
  await expect(page.locator(ORDER_SUMMARY)).toBeVisible();
  await expect(page.locator(SUBMIT_BUTTON)).toBeVisible();

  console.log(`[${browserName}] Checkout form verified successfully.`);
}

// ─── Helper: seed cart and verify ES modules ─────────────────────────────────

async function seedCartAndVerifyModules(page: Page, browserName: string): Promise<void> {
  const jsErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text().toLowerCase();
      const isModuleError =
        text.includes('syntaxerror') ||
        text.includes('import') ||
        text.includes('export') ||
        text.includes('cors') ||
        text.includes('failed to fetch') ||
        text.includes('cannot use import');
      if (isModuleError) jsErrors.push(msg.text());
    }
  });

  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [CART_STORAGE_KEY, CART_LOCALSTORAGE_JSON]
  );

  const written = await page.evaluate((key: string) => localStorage.getItem(key), CART_STORAGE_KEY);
  expect(written, `[${browserName}] Failed to seed cart data into localStorage`).not.toBeNull();

  await page.goto(CHECKOUT_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.waitForFunction(() => {
    const el = document.getElementById('order-items');
    if (!el) return false;
    const text = el.textContent ?? '';
    return !text.includes('Your cart is empty') && text.trim() !== '';
  });

  expect(
    jsErrors,
    `[${browserName}] JS module errors found in console: ${jsErrors.join('; ')}`
  ).toHaveLength(0);

  await expect(page.locator(CART_COUNTER)).toBeVisible();

  const orderItemsText = (await page.locator(ORDER_ITEMS).textContent()) ?? '';
  expect(
    orderItemsText,
    `[${browserName}] Order summary still shows 'Your cart is empty'`
  ).not.toContain('Your cart is empty');

  console.log(
    `[${browserName}] ES module loading verified successfully. Order items: ${orderItemsText.trim()}`
  );
}

// ─── Checkout form layout tests ───────────────────────────────────────────────

test('verifyCheckoutForm', async ({ page, browserName }) => {
  await page.goto(CHECKOUT_URL);
  await verifyCheckoutFormElements(page, browserName);
});

// ─── ES module loading tests ──────────────────────────────────────────────────

test('verifyESModuleLoading', async ({ page, browserName }) => {
  await seedCartAndVerifyModules(page, browserName);
});

// ─── Responsive grid layout tests ────────────────────────────────────────────

async function countColumns(page: Page): Promise<number> {
  const gridTemplateColumns: string = await page.evaluate(() => {
    const container = document.getElementById('products-container');
    if (!container) return '0';
    return window.getComputedStyle(container).gridTemplateColumns;
  });

  if (!gridTemplateColumns || gridTemplateColumns === 'none' || gridTemplateColumns === '0') {
    return 0;
  }

  return gridTemplateColumns.trim().split(/\s+/).length;
}

async function assertNoStretchedImages(page: Page, browserName: string, viewport: string): Promise<void> {
  const images = page.locator(PRODUCT_IMAGES);
  const count = await images.count();
  expect(count, `[${browserName}][${viewport}] No product images found on page`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    const naturalWidth: number = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
    expect(naturalWidth, `[${browserName}][${viewport}] Broken image detected (naturalWidth=0)`).toBeGreaterThan(0);

    const renderedWidth: number = await img.evaluate(el => el.getBoundingClientRect().width);
    const containerWidth: number = await img.evaluate(el => el.parentElement!.getBoundingClientRect().width);
    expect(
      renderedWidth <= containerWidth + 2,
      `[${browserName}][${viewport}] Image is wider than its container: ${renderedWidth}px > ${containerWidth}px`
    ).toBeTruthy();
  }
}

async function assertNoCardOverflow(page: Page, browserName: string, viewport: string): Promise<void> {
  const containerRight: number = await page.locator(PRODUCTS_CONTAINER).evaluate(
    el => el.getBoundingClientRect().right
  );

  const cards = page.locator(PRODUCT_CARDS);
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const cardRight: number = await cards.nth(i).evaluate(el => el.getBoundingClientRect().right);
    expect(
      cardRight <= containerRight + 2,
      `[${browserName}][${viewport}] Card overflows container: card right=${cardRight}px, container right=${containerRight}px`
    ).toBeTruthy();
  }
}

test('verifyResponsiveGrid', async ({ page, browserName }) => {
  // ── DESKTOP 1366×768 ──────────────────────────────────────────────────
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(PRODUCTS_URL);
  await page.waitForFunction(
    (n: number) => document.querySelectorAll('.product-card').length >= n,
    PRODUCTS_PER_PAGE
  );
  await page.waitForTimeout(500);

  const desktopCols = await countColumns(page);
  console.log(`[${browserName}] Desktop (1366px) columns: ${desktopCols}`);
  expect(desktopCols >= 3 && desktopCols <= 5,
    `[${browserName}] Desktop: expected 3–5 columns but got ${desktopCols}`).toBeTruthy();
  await assertNoStretchedImages(page, browserName, 'Desktop');

  // ── TABLET 768×1024 ───────────────────────────────────────────────────
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  await page.waitForFunction(
    (n: number) => document.querySelectorAll('.product-card').length >= n,
    PRODUCTS_PER_PAGE
  );
  await page.waitForTimeout(500);

  const tabletCols = await countColumns(page);
  console.log(`[${browserName}] Tablet (768px) columns: ${tabletCols}`);
  expect(tabletCols >= 2 && tabletCols <= 3,
    `[${browserName}] Tablet: expected 2–3 columns but got ${tabletCols}`).toBeTruthy();
  await assertNoStretchedImages(page, browserName, 'Tablet');
  await assertNoCardOverflow(page, browserName, 'Tablet');

  // ── MOBILE L 425×812 ──────────────────────────────────────────────────
  await page.setViewportSize({ width: 425, height: 812 });
  await page.reload();
  await page.waitForFunction(
    (n: number) => document.querySelectorAll('.product-card').length >= n,
    PRODUCTS_PER_PAGE
  );
  await page.waitForTimeout(500);

  const mobileCols = await countColumns(page);
  console.log(`[${browserName}] Mobile (425px) columns: ${mobileCols}`);
  expect(mobileCols >= 1 && mobileCols <= 2,
    `[${browserName}] Mobile: expected 1–2 columns but got ${mobileCols}`).toBeTruthy();
  await assertNoStretchedImages(page, browserName, 'Mobile');

  console.log(`[${browserName}] Responsive grid layout verified at all viewports.`);
});

// ─── Mobile checkout layout tests ────────────────────────────────────────────

test('verifyMobileCheckoutLayout', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [CART_STORAGE_KEY, CART_LOCALSTORAGE_JSON]
  );

  await page.goto(CHECKOUT_URL);
  await expect(page.locator(FIELD_FULL_NAME)).toBeVisible();

  // 1. Form and Order Summary stack vertically (flex-direction: column)
  const flexDirection: string = await page.evaluate(() =>
    window.getComputedStyle(document.querySelector('.checkout-container')!).flexDirection
  );
  expect(flexDirection).toBe('column');

  // 2. Order Summary appears BELOW the form
  const formBottom: number = await page.evaluate(() =>
    document.querySelector('.checkout-left-side')!.getBoundingClientRect().bottom
  );
  const summaryTop: number = await page.evaluate(() =>
    document.querySelector('.checkout-right-side')!.getBoundingClientRect().top
  );
  expect(
    summaryTop >= formBottom - 2,
    `[${browserName}] Order Summary should appear BELOW the form. Form bottom=${formBottom} Summary top=${summaryTop}`
  ).toBeTruthy();
  console.log(`[${browserName}] Form bottom=${formBottom}, Summary top=${summaryTop} — stacking verified.`);

  // 3. All form inputs are within viewport width
  const viewportWidth: number = await page.evaluate(() => window.innerWidth);
  const inputs = page.locator(FORM_INPUTS);
  const inputCount = await inputs.count();
  expect(inputCount, `[${browserName}] No form inputs found on checkout page`).toBeGreaterThan(0);

  for (let i = 0; i < inputCount; i++) {
    const inputWidth: number = await inputs.nth(i).evaluate(el => el.getBoundingClientRect().width);
    expect(
      inputWidth <= viewportWidth + 2,
      `[${browserName}] Form input is wider than viewport: ${inputWidth}px > ${viewportWidth}px`
    ).toBeTruthy();
  }
  console.log(`[${browserName}] All ${inputCount} form inputs are within viewport width (${viewportWidth}px).`);

  // 4. No horizontal scrollbar
  const scrollWidth: number = await page.evaluate(() => document.body.scrollWidth);
  expect(
    scrollWidth <= viewportWidth + 2,
    `[${browserName}] Horizontal overflow detected: scrollWidth=${scrollWidth}px > viewportWidth=${viewportWidth}px`
  ).toBeTruthy();
  console.log(`[${browserName}] No horizontal scroll. scrollWidth=${scrollWidth}`);

  // 5. "Place Order" button is fully visible
  await page.locator(PLACE_ORDER_BTN).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const btnLeft: number = await page.evaluate(
    () => document.getElementById('btn-place-order')!.getBoundingClientRect().left
  );
  const btnRight: number = await page.evaluate(
    () => document.getElementById('btn-place-order')!.getBoundingClientRect().right
  );
  expect(btnLeft >= 0, `[${browserName}] Place Order button is cut off on the left`).toBeTruthy();
  expect(btnRight <= viewportWidth + 2,
    `[${browserName}] Place Order button overflows viewport on the right: ${btnRight}px > ${viewportWidth}px`
  ).toBeTruthy();
  console.log(`[${browserName}] Place Order button visible: left=${btnLeft} right=${btnRight}`);

  // 6. "Back to Cart" link is fully visible
  await page.locator(BACK_TO_CART_BTN).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const backLeft: number = await page.evaluate(
    () => document.querySelector('.btn-back-cart')!.getBoundingClientRect().left
  );
  const backRight: number = await page.evaluate(
    () => document.querySelector('.btn-back-cart')!.getBoundingClientRect().right
  );
  expect(backLeft >= 0, `[${browserName}] Back to Cart button is cut off on the left`).toBeTruthy();
  expect(backRight <= viewportWidth + 2,
    `[${browserName}] Back to Cart button overflows viewport: ${backRight}px > ${viewportWidth}px`
  ).toBeTruthy();
  console.log(`[${browserName}] Back to Cart button visible: left=${backLeft} right=${backRight}`);

  console.log(`[${browserName}] Mobile checkout layout (375px) fully verified.`);
});
