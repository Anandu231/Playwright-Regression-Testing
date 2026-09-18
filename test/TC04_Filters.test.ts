// TC04_Filters.test.ts
// Converted from TC04_Filters.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md
//
// Note: The Java FilterReportListener (custom HTML reporter) is NOT ported.
// Use the built-in Playwright HTML reporter instead:
//   reporter: [['html', { outputFolder: 'playwright-report' }]]
// in playwright.config.ts.

import { test, expect, Page } from '@playwright/test';

// ─── Locators ────────────────────────────────────────────────────────────────

const PRODUCTS_NAV_LINK   = 'text=Products';
const CATEGORY_BEAUTY     = "input[name='category'][value='beauty']";
const CATEGORY_ELECTRONICS = "input[name='category'][value='electronics']";
const PRICE_0_50          = "input[name='price'][value='0-50']";
const PRICE_50_100        = "input[name='price'][value='50-100']";
const PRICE_1600_3200     = "input[name='price'][value='1600-3200']";
const RATING_4_AND_ABOVE  = "input[name='rating'][value='4-5']";
const APPLY_BUTTON        = '#apply-filters';
const CLEAR_BUTTON        = '#clear-filters';
const PRODUCT_CARDS       = 'div.product-card';
const PRODUCT_CATEGORY    = 'p.product-category';
const PRODUCT_PRICE_FINAL = 'span.product-price-final';
const RATING_VALUE        = 'span.rating-value';
const PRODUCT_COUNT_TEXT  = '#product-count-text';
const NO_PRODUCTS         = '.no-products';

const UI_SELECTION_DELAY_MS = 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function selectFilter(page: Page, filterLocator: string): Promise<void> {
  await page.locator(filterLocator).click();
  await page.waitForTimeout(UI_SELECTION_DELAY_MS);
}

async function goToProductsPage(page: Page): Promise<void> {
  await page.locator(PRODUCTS_NAV_LINK).click();
  await page
    .locator(PRODUCT_CARDS)
    .or(page.locator(NO_PRODUCTS))
    .first()
    .waitFor();
}

async function applyFilters(page: Page): Promise<void> {
  await page.locator(APPLY_BUTTON).click();
  await page.waitForTimeout(2000);
}

function parsePrice(priceText: string): number {
  return parseFloat(priceText.replace('$', '').trim());
}

function parseRating(ratingText: string): number {
  return parseFloat(ratingText.replace('(', '').replace(')', '').trim());
}

// ─── TC04_TC1: Filter by Category (Beauty) ───────────────────────────────────

test('filterByCategory', async ({ page }) => {
  await goToProductsPage(page);

  const initialCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();

  await selectFilter(page, CATEGORY_BEAUTY);
  await applyFilters(page);

  const cards = page.locator(PRODUCT_CARDS);
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);

  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const category = ((await cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    const isBeautyRelated =
      category.includes('beauty') ||
      category.includes('fragrances') ||
      category.includes('skincare');
    expect(isBeautyRelated, `Non-beauty product found after filter: ${category}`).toBeTruthy();
  }

  const filteredCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();
  expect(filteredCountText).not.toBe(initialCountText);
});

// ─── TC04_TC2: Filter by Price Range ($50–$100) ───────────────────────────────

test('filterByPriceRange', async ({ page }) => {
  await goToProductsPage(page);

  const initialCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();

  await selectFilter(page, PRICE_50_100);
  await applyFilters(page);

  const cards = page.locator(PRODUCT_CARDS);
  expect(await cards.count()).toBeGreaterThan(0);

  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const priceText = await cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '';
    const price = parsePrice(priceText);
    expect(price >= 50 && price <= 100, `Product price $${price} is outside the $50-$100 range.`).toBeTruthy();
  }

  const filteredCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();
  expect(filteredCountText).not.toBe(initialCountText);
});

// ─── TC04_TC3: Filter by Rating (4 Stars & Above) ────────────────────────────

test('filterByRating', async ({ page }) => {
  await goToProductsPage(page);

  const initialCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();

  await selectFilter(page, RATING_4_AND_ABOVE);
  await applyFilters(page);

  const cards = page.locator(PRODUCT_CARDS);
  expect(await cards.count()).toBeGreaterThan(0);

  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const ratingText = await cards.nth(i).locator(RATING_VALUE).textContent() ?? '';
    const rating = parseRating(ratingText);
    expect(rating >= 4.0, `Product with rating ${rating} shown after 4 Stars & Above filter.`).toBeTruthy();
  }

  const filteredCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();
  expect(filteredCountText).not.toBe(initialCountText);
});

// ─── TC04_TC4: Apply Multiple Filters Simultaneously ─────────────────────────

test('filterByMultipleCriteria', async ({ page }) => {
  await goToProductsPage(page);

  await selectFilter(page, CATEGORY_BEAUTY);
  await selectFilter(page, PRICE_0_50);
  await selectFilter(page, RATING_4_AND_ABOVE);
  await applyFilters(page);

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(PRICE_0_50)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();

  const cards = page.locator(PRODUCT_CARDS);
  const count = await cards.count();
  // Zero results is valid when no products match all three criteria
  for (let i = 0; i < count; i++) {
    const category = ((await cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    const isBeautyRelated =
      category.includes('beauty') ||
      category.includes('fragrances') ||
      category.includes('skincare');
    expect(isBeautyRelated, `Non-beauty product shown in combined filter: ${category}`).toBeTruthy();

    const priceText = await cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '';
    const price = parsePrice(priceText);
    expect(price >= 0 && price <= 50, `Product price $${price} is outside $0-$50 in combined filter.`).toBeTruthy();

    const ratingText = await cards.nth(i).locator(RATING_VALUE).textContent() ?? '';
    const rating = parseRating(ratingText);
    expect(rating >= 4.0, `Product rating ${rating} is below 4.0 in combined filter.`).toBeTruthy();
  }

  const countText = await page.locator(PRODUCT_COUNT_TEXT).textContent() ?? '';
  expect(countText).not.toBe('');
});

// ─── TC04_TC5: Clear All Filters ─────────────────────────────────────────────

test('clearAllFilters', async ({ page }) => {
  await goToProductsPage(page);

  const fullCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();

  await selectFilter(page, CATEGORY_BEAUTY);
  await selectFilter(page, PRICE_0_50);
  await selectFilter(page, RATING_4_AND_ABOVE);
  await applyFilters(page);

  await page.locator(CLEAR_BUTTON).click();
  await page.waitForTimeout(2000);

  await expect(page.locator(CATEGORY_BEAUTY)).not.toBeChecked();
  await expect(page.locator(PRICE_0_50)).not.toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).not.toBeChecked();

  const cards = page.locator(PRODUCT_CARDS);
  expect(await cards.count()).toBeGreaterThan(0);

  const restoredCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();
  expect(restoredCountText).toBe(fullCountText);
});

// ─── TC04_TC6: Product Count Updates After Filter ─────────────────────────────

test('productCountUpdatesAfterFilter', async ({ page }) => {
  await goToProductsPage(page);

  const initialCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent();

  await selectFilter(page, CATEGORY_BEAUTY);
  await applyFilters(page);

  const filteredCountText = await page.locator(PRODUCT_COUNT_TEXT).textContent() ?? '';

  expect(filteredCountText).not.toBe(initialCountText);
  expect(filteredCountText.toLowerCase()).toContain('showing');

  const cards = page.locator(PRODUCT_CARDS);
  expect(await cards.count()).toBeGreaterThan(0);

  // Parse "showing X-Y of Z products" to verify card count matches window
  const withoutShowing = filteredCountText.toLowerCase().replace('showing', '').trim();
  const parts = withoutShowing.split(' of ');
  const range = parts[0].trim().split('-');
  const displayedFrom = parseInt(range[0].trim(), 10);
  const displayedTo   = parseInt(range[1].trim(), 10);
  const expectedCardCount = displayedTo - displayedFrom + 1;

  expect(await cards.count()).toBe(expectedCardCount);
});

// ─── Additional filter test cases ─────────────────────────────────────────────

test('filterCombinationWithNoResults', async ({ page }) => {
  await goToProductsPage(page);

  await selectFilter(page, CATEGORY_BEAUTY);
  await selectFilter(page, PRICE_1600_3200);
  await selectFilter(page, RATING_4_AND_ABOVE);
  await applyFilters(page);

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(PRICE_1600_3200)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();

  expect(await page.locator(PRODUCT_CARDS).count()).toBe(0);
  expect(await page.locator(NO_PRODUCTS).count()).toBeGreaterThan(0);

  const countText = (await page.locator(PRODUCT_COUNT_TEXT).textContent() ?? '').toLowerCase();
  expect(countText).toContain('no product');
});

test('applyFiltersAfterScrolling', async ({ page }) => {
  await goToProductsPage(page);

  await selectFilter(page, PRICE_0_50);
  await selectFilter(page, RATING_4_AND_ABOVE);

  await expect(page.locator(PRICE_0_50)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();

  await page.locator(APPLY_BUTTON).click();
  await page.waitForTimeout(2000);

  const cards = page.locator(PRODUCT_CARDS);
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const priceText = await cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '';
    const ratingText = await cards.nth(i).locator(RATING_VALUE).textContent() ?? '';
    const price = parsePrice(priceText);
    const rating = parseRating(ratingText);

    expect(price >= 0 && price <= 50, `Product price $${price} is outside the $0-$50 range.`).toBeTruthy();
    expect(rating >= 4.0, `Product rating ${rating} is below 4.0.`).toBeTruthy();
  }
});

test('filterByMultipleCategories', async ({ page }) => {
  await goToProductsPage(page);

  await selectFilter(page, CATEGORY_BEAUTY);
  await selectFilter(page, CATEGORY_ELECTRONICS);
  await applyFilters(page);

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(CATEGORY_ELECTRONICS)).toBeChecked();

  const cards = page.locator(PRODUCT_CARDS);
  expect(await cards.count()).toBeGreaterThan(0);

  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const category = ((await cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    const isSelectedCategory =
      category.includes('beauty') ||
      category.includes('fragrances') ||
      category.includes('skincare') ||
      category.includes('electronics') ||
      category.includes('smartphones') ||
      category.includes('laptops') ||
      category.includes('tablets') ||
      category.includes('mobile-accessories');
    expect(isSelectedCategory, `Product from an unselected category was displayed: ${category}`).toBeTruthy();
  }

  const countText = await page.locator(PRODUCT_COUNT_TEXT).textContent() ?? '';
  expect(countText).not.toBe('');
});
