// TC05_Sort.test.ts
// Converted from TC05_Sort.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md

import { test, expect, Page } from '@playwright/test';

async function navigateToProducts(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Products' }).click();
  await expect(page.locator('#sort-select')).toBeVisible();
}

// ── Collect prices from ALL pages ─────────────────────────────────────────

async function getAllPrices(page: Page): Promise<number[]> {
  const allPrices: number[] = [];

  while (true) {
    const priceElements = page.locator('.product-price-final');
    const count = await priceElements.count();
    for (let i = 0; i < count; i++) {
      const priceText = ((await priceElements.nth(i).textContent()) ?? '')
        .replace('$', '')
        .trim();
      allPrices.push(parseFloat(priceText));
    }

    const firstProduct = ((await page.locator('.product-title').first().textContent()) ?? '').trim();
    const nextButton = page.locator('#next-btn');
    const disabled = await nextButton.getAttribute('disabled');
    const classes = await nextButton.getAttribute('class') ?? '';

    if (disabled !== null || classes.includes('disabled')) break;

    await nextButton.click();
    await page.waitForFunction(
      (prev: string) => {
        const el = document.querySelector('.product-title');
        return el !== null && el.textContent?.trim() !== prev;
      },
      firstProduct
    );
  }

  return allPrices;
}

// ── Collect names from ALL pages ──────────────────────────────────────────

async function getAllNames(page: Page): Promise<string[]> {
  const allNames: string[] = [];

  while (true) {
    const nameElements = page.locator('.product-title');
    const count = await nameElements.count();
    for (let i = 0; i < count; i++) {
      allNames.push(((await nameElements.nth(i).textContent()) ?? '').trim());
    }

    const firstProduct = ((await page.locator('.product-title').first().textContent()) ?? '').trim();
    const nextButton = page.locator('#next-btn');
    const disabled = await nextButton.getAttribute('disabled');
    const classes = await nextButton.getAttribute('class') ?? '';

    if (disabled !== null || classes.includes('disabled')) break;

    await nextButton.click();
    await page.waitForFunction(
      (prev: string) => {
        const el = document.querySelector('.product-title');
        return el !== null && el.textContent?.trim() !== prev;
      },
      firstProduct
    );
  }

  return allNames;
}

// ── Collect ratings from ALL pages ────────────────────────────────────────

async function getAllRatings(page: Page): Promise<number[]> {
  const allRatings: number[] = [];

  while (true) {
    const ratingElements = page.locator('.rating-value');
    const count = await ratingElements.count();
    for (let i = 0; i < count; i++) {
      const ratingText = ((await ratingElements.nth(i).textContent()) ?? '').trim();
      const numericRating = ratingText.replace(/[^0-9.]/g, '');
      allRatings.push(parseFloat(numericRating));
    }

    const firstProduct = ((await page.locator('.product-title').first().textContent()) ?? '').trim();
    const nextButton = page.locator('#next-btn');
    const disabled = await nextButton.getAttribute('disabled');
    const classes = await nextButton.getAttribute('class') ?? '';

    if (disabled !== null || classes.includes('disabled')) break;

    await nextButton.click();
    await page.waitForFunction(
      (prev: string) => {
        const el = document.querySelector('.product-title');
        return el !== null && el.textContent?.trim() !== prev;
      },
      firstProduct
    );
  }

  return allRatings;
}

// ── 1. Price: Low to High ─────────────────────────────────────────────────

test('sortByPriceLowToHigh', async ({ page }) => {
  await navigateToProducts(page);

  await page.locator('#sort-select').selectOption({ value: 'price-low-high' });

  const actualPrices = await getAllPrices(page);
  const expectedPrices = [...actualPrices].sort((a, b) => a - b);

  expect(actualPrices).toEqual(expectedPrices);
});

// ── 2. Price: High to Low (commented out in original) ────────────────────

// test.skip('sortByPriceHighToLow', async ({ page }) => {
//   await navigateToProducts(page);
//   await page.locator('#sort-select').selectOption({ value: 'price-high-low' });
//   const actualPrices = await getAllPrices(page);
//   const expectedPrices = [...actualPrices].sort((a, b) => b - a);
//   expect(actualPrices).toEqual(expectedPrices);
// });

// ── 3. Name: A to Z ──────────────────────────────────────────────────────

test('sortByNameAToZ', async ({ page }) => {
  await navigateToProducts(page);

  await page.locator('#sort-select').selectOption({ value: 'name-a-z' });

  const actualNames = await getAllNames(page);
  const expectedNames = [...actualNames].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  expect(actualNames).toEqual(expectedNames);
});

// ── 4. Name: Z to A (commented out in original) ──────────────────────────

// test.skip('sortByNameZToA', async ({ page }) => {
//   await navigateToProducts(page);
//   await page.locator('#sort-select').selectOption({ value: 'name-z-a' });
//   const actualNames = await getAllNames(page);
//   const expectedNames = [...actualNames].sort((a, b) =>
//     b.toLowerCase().localeCompare(a.toLowerCase())
//   );
//   expect(actualNames).toEqual(expectedNames);
// });

// ── 5. Rating: High to Low ───────────────────────────────────────────────

test('sortByRatingHighToLow', async ({ page }) => {
  await navigateToProducts(page);

  await page.locator('#sort-select').selectOption({ value: 'rating-high-low' });

  const actualRatings = await getAllRatings(page);
  const expectedRatings = [...actualRatings].sort((a, b) => b - a);

  expect(actualRatings).toEqual(expectedRatings);
});
