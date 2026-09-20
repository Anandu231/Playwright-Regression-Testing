import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

test('sortByPriceLowToHigh', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();
  await products.sortSelect.selectOption({ value: 'price-low-high' });

  const actualPrices = await products.collectAcrossPages(
    '.product-price-final',
    text => parseFloat(text.replace('$', ''))
  );
  expect(actualPrices).toEqual([...actualPrices].sort((a, b) => a - b));
});

test('sortByNameAToZ', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();
  await products.sortSelect.selectOption({ value: 'name-a-z' });

  const actualNames = await products.collectAcrossPages('.product-title', t => t);
  expect(actualNames).toEqual(
    [...actualNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  );
});

test('sortByRatingHighToLow', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.navigate();
  await products.sortSelect.selectOption({ value: 'rating-high-low' });

  const actualRatings = await products.collectAcrossPages(
    '.rating-value',
    text => parseFloat(text.replace(/[^0-9.]/g, ''))
  );
  expect(actualRatings).toEqual([...actualRatings].sort((a, b) => b - a));
});
