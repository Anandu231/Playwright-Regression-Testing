import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';

const CATEGORY_BEAUTY      = "input[name='category'][value='beauty']";
const CATEGORY_ELECTRONICS = "input[name='category'][value='electronics']";
const PRICE_0_50           = "input[name='price'][value='0-50']";
const PRICE_50_100         = "input[name='price'][value='50-100']";
const PRICE_1600_3200      = "input[name='price'][value='1600-3200']";
const RATING_4_AND_ABOVE   = "input[name='rating'][value='4-5']";
const PRODUCT_CATEGORY     = 'p.product-category';
const PRODUCT_PRICE_FINAL  = 'span.product-price-final';
const RATING_VALUE         = 'span.rating-value';

function parsePrice(text: string): number  { return parseFloat(text.replace('$', '').trim()); }
function parseRating(text: string): number { return parseFloat(text.replace(/[^0-9.]/g, '')); }

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

test('filterByCategory', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const initialCountText = await products.productCountText.textContent();
  await products.selectFilter(CATEGORY_BEAUTY);
  await products.applyFilters();

  await expect(products.cards.first()).toBeVisible();
  expect(await products.cards.count()).toBeGreaterThan(0);

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const cat = ((await products.cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    expect(
      cat.includes('beauty') || cat.includes('fragrances') || cat.includes('skincare'),
      `Non-beauty product: ${cat}`
    ).toBeTruthy();
  }

  expect(await products.productCountText.textContent()).not.toBe(initialCountText);
});

test('filterByPriceRange', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const initialCountText = await products.productCountText.textContent();
  await products.selectFilter(PRICE_50_100);
  await products.applyFilters();

  expect(await products.cards.count()).toBeGreaterThan(0);

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const price = parsePrice(await products.cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '');
    expect(price >= 50 && price <= 100, `Price $${price} outside $50–$100`).toBeTruthy();
  }

  expect(await products.productCountText.textContent()).not.toBe(initialCountText);
});

test('filterByRating', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const initialCountText = await products.productCountText.textContent();
  await products.selectFilter(RATING_4_AND_ABOVE);
  await products.applyFilters();

  expect(await products.cards.count()).toBeGreaterThan(0);

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const rating = parseRating(await products.cards.nth(i).locator(RATING_VALUE).textContent() ?? '');
    expect(rating >= 4.0, `Rating ${rating} below 4.0`).toBeTruthy();
  }

  expect(await products.productCountText.textContent()).not.toBe(initialCountText);
});

test('filterByMultipleCriteria', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  await products.selectFilter(CATEGORY_BEAUTY);
  await products.selectFilter(PRICE_0_50);
  await products.selectFilter(RATING_4_AND_ABOVE);
  await products.applyFilters();

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(PRICE_0_50)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const cat    = ((await products.cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    const price  = parsePrice(await products.cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '');
    const rating = parseRating(await products.cards.nth(i).locator(RATING_VALUE).textContent() ?? '');
    expect(cat.includes('beauty') || cat.includes('fragrances') || cat.includes('skincare'), `Non-beauty: ${cat}`).toBeTruthy();
    expect(price >= 0 && price <= 50, `Price $${price} outside $0–$50`).toBeTruthy();
    expect(rating >= 4.0, `Rating ${rating} below 4.0`).toBeTruthy();
  }

  expect((await products.productCountText.textContent() ?? '')).not.toBe('');
});

test('clearAllFilters', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const fullCountText = await products.productCountText.textContent();

  await products.selectFilter(CATEGORY_BEAUTY);
  await products.selectFilter(PRICE_0_50);
  await products.selectFilter(RATING_4_AND_ABOVE);
  await products.applyFilters();
  await products.clearFilters();

  await expect(page.locator(CATEGORY_BEAUTY)).not.toBeChecked();
  await expect(page.locator(PRICE_0_50)).not.toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).not.toBeChecked();

  expect(await products.cards.count()).toBeGreaterThan(0);
  expect(await products.productCountText.textContent()).toBe(fullCountText);
});

test('productCountUpdatesAfterFilter', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  const initialCountText = await products.productCountText.textContent();

  await products.selectFilter(CATEGORY_BEAUTY);
  await products.applyFilters();

  const filteredCountText = (await products.productCountText.textContent()) ?? '';
  expect(filteredCountText).not.toBe(initialCountText);
  expect(filteredCountText.toLowerCase()).toContain('showing');

  const withoutShowing = filteredCountText.toLowerCase().replace('showing', '').trim();
  const parts  = withoutShowing.split(' of ');
  const range  = parts[0].trim().split('-');
  const from   = parseInt(range[0].trim(), 10);
  const to     = parseInt(range[1].trim(), 10);
  expect(await products.cards.count()).toBe(to - from + 1);
});

test('filterCombinationWithNoResults', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  await products.selectFilter(CATEGORY_BEAUTY);
  await products.selectFilter(PRICE_1600_3200);
  await products.selectFilter(RATING_4_AND_ABOVE);
  await products.applyFilters();

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(PRICE_1600_3200)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();

  expect(await products.cards.count()).toBe(0);
  expect(await products.noProducts.count()).toBeGreaterThan(0);

  expect((await products.productCountText.textContent() ?? '').toLowerCase()).toContain('no product');
});

test('applyFiltersAfterScrolling', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  await products.selectFilter(PRICE_0_50);
  await products.selectFilter(RATING_4_AND_ABOVE);
  await expect(page.locator(PRICE_0_50)).toBeChecked();
  await expect(page.locator(RATING_4_AND_ABOVE)).toBeChecked();
  await products.applyFilters();

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const price  = parsePrice(await products.cards.nth(i).locator(PRODUCT_PRICE_FINAL).textContent() ?? '');
    const rating = parseRating(await products.cards.nth(i).locator(RATING_VALUE).textContent() ?? '');
    expect(price >= 0 && price <= 50, `Price $${price} outside $0–$50`).toBeTruthy();
    expect(rating >= 4.0, `Rating ${rating} below 4.0`).toBeTruthy();
  }
});

test('filterByMultipleCategories', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();

  await products.selectFilter(CATEGORY_BEAUTY);
  await products.selectFilter(CATEGORY_ELECTRONICS);
  await products.applyFilters();

  await expect(page.locator(CATEGORY_BEAUTY)).toBeChecked();
  await expect(page.locator(CATEGORY_ELECTRONICS)).toBeChecked();
  expect(await products.cards.count()).toBeGreaterThan(0);

  const count = await products.cards.count();
  for (let i = 0; i < count; i++) {
    const cat = ((await products.cards.nth(i).locator(PRODUCT_CATEGORY).textContent()) ?? '').toLowerCase();
    const valid =
      cat.includes('beauty') || cat.includes('fragrances') || cat.includes('skincare') ||
      cat.includes('electronics') || cat.includes('smartphones') || cat.includes('laptops') ||
      cat.includes('tablets') || cat.includes('mobile-accessories');
    expect(valid, `Unexpected category: ${cat}`).toBeTruthy();
  }

  expect((await products.productCountText.textContent()) ?? '').not.toBe('');
});
