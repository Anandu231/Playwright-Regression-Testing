import { test, expect } from '@playwright/test';
import { ProductsPage } from '../framework/pages/ProductsPage';
import { WishlistPage } from '../framework/pages/WishlistPage';
import { CartPage } from '../framework/pages/CartPage';

test.beforeEach(async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 1 — Add to Wishlist
// ══════════════════════════════════════════════════════════════════════════

test('TC-W01: Add a single product to the wishlist', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  expect(await wishlist.badgeCount()).toBe(0);

  await products.clickHeart(0);

  expect(await products.isWishlisted(0)).toBeTruthy();
  expect(await wishlist.badgeCount()).toBe(1);

  await wishlist.navigate();
  await expect(wishlist.items).toHaveCount(1);
});

test('TC-W02: Add multiple different products to the wishlist', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();

  const expectedProducts = await Promise.all(
    [0, 1, 2].map(async i => ({
      name:     await products.cardName(i),
      price:    await products.cardPrice(i),
      imageSrc: await products.cardImageSrc(i),
    }))
  );

  await products.clickHeart(0);
  await products.clickHeart(1);
  await products.clickHeart(2);

  expect(await wishlist.badgeCount()).toBe(3);

  await wishlist.navigate();
  await expect(wishlist.items).toHaveCount(3);

  for (let i = 0; i < 3; i++) {
    expect(await wishlist.itemName(i)).toBe(expectedProducts[i].name);
    expect(await wishlist.itemPrice(i)).toBe(expectedProducts[i].price);
    expect(await wishlist.itemImageSrc(i)).toBe(expectedProducts[i].imageSrc);
  }
});

test('TC-W03 [EDGE]: Add same product twice — no duplicate', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();

  await products.clickHeart(0);
  const countAfterFirst = await wishlist.badgeCount();

  await products.clickHeart(0);

  const toast = page.locator('.toast.show');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  const message = (await toast.textContent())?.trim() ?? '';

  expect(await products.isWishlisted(0)).toBeFalsy();

  await wishlist.navigate();
  expect(await wishlist.items.count()).toBeLessThanOrEqual(1);
  expect(await wishlist.badgeCount()).toBeLessThanOrEqual(countAfterFirst);
  expect(message.includes('Removed') || message.includes('Already')).toBeTruthy();
});

test('TC-W04: Add product to wishlist from product detail page', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.card(0).click();

  const badgeBefore = await wishlist.badgeCount();
  const title       = page.locator('h2.product-page-title');
  await expect(title).toBeVisible();
  const productName = (await title.textContent())?.trim() ?? '';

  const heartBtn = page.locator('.btn-favorite');
  await heartBtn.click();

  expect(await wishlist.badgeCount()).toBe(badgeBefore + 1);
  await expect(heartBtn).toHaveClass(/active/);

  await wishlist.navigate();
  expect(await wishlist.containsProduct(productName)).toBeTruthy();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 2 — Remove from Wishlist
// ══════════════════════════════════════════════════════════════════════════

test('TC-W05: Remove a single product from the wishlist', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);

  await wishlist.navigate();
  await expect(wishlist.items).toHaveCount(1);

  await wishlist.removeItem(0);

  await expect(wishlist.items).toHaveCount(0);
  expect(await wishlist.badgeCount()).toBe(0);

  await products.navigate();
  expect(await products.isWishlisted(0)).toBeFalsy();
});

test('TC-W06 [EDGE]: Remove last item shows empty state', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);

  await wishlist.navigate();
  await wishlist.removeItem(0);

  await expect(wishlist.emptyState).toBeVisible();
  expect(await wishlist.badgeCount()).toBe(0);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 3 — Wishlist Display & UI
// ══════════════════════════════════════════════════════════════════════════

test('TC-W07: Wishlist displays correct product details', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  const expectedName  = await products.cardName(0);
  const expectedPrice = await products.cardPrice(0);

  await products.clickHeart(0);
  await wishlist.navigate();

  expect(await wishlist.itemName(0)).toBe(expectedName);
  expect(await wishlist.itemPrice(0)).toBe(expectedPrice);
  expect(Boolean((await wishlist.itemImageSrc(0))?.trim())).toBeTruthy();
});

test('TC-W08: Wishlist badge stays accurate after add and remove', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);
  await products.clickHeart(1);
  expect(await wishlist.badgeCount()).toBe(2);

  await products.clickHeart(2);
  expect(await wishlist.badgeCount()).toBe(3);

  await wishlist.navigate();
  await wishlist.removeItem(0);

  await expect.poll(() => wishlist.badgeCount()).toBe(2);
});

test('TC-W09 [EDGE]: Badge does not overflow with many items', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  // Add everything on the first page — enough to verify the badge does not go NaN
  const addedItems = await products.addProductsToWishlist(12);
  const badgeCount = await wishlist.badgeCount();

  expect(badgeCount).toBeGreaterThan(0);
  expect(badgeCount).toBe(addedItems);
  expect(await page.content()).not.toContain('NaN');
});

test('TC-W10: Empty wishlist displays empty state and shopping CTA', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await wishlist.navigate();

  await expect(wishlist.emptyState).toBeVisible();
  await expect(wishlist.items).toHaveCount(0);
  await expect(wishlist.startShoppingBtn).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 4 — Wishlist <-> Cart Interaction
// ══════════════════════════════════════════════════════════════════════════

test('TC-W11: Add to cart from wishlist', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);
  const cart      = new CartPage(page);

  await products.navigate();
  await products.clickHeart(0);

  await wishlist.navigate();
  await wishlist.addToCartFromItem(0);

  expect(await wishlist.badgeCount()).toBe(1);
  expect(await cart.badgeCount()).toBe(1);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 5 — Persistence & State
// ══════════════════════════════════════════════════════════════════════════

test('TC-W13: Wishlist persists after page refresh', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);
  await products.clickHeart(1);
  expect(await wishlist.badgeCount()).toBe(2);

  await page.reload();

  expect(await wishlist.badgeCount()).toBe(2);
  expect(await products.isWishlisted(0)).toBeTruthy();
  expect(await products.isWishlisted(1)).toBeTruthy();

  await wishlist.navigate();
  await expect(wishlist.items).toHaveCount(2);
});

test('TC-W14 [EDGE]: Wishlist handles cleared localStorage gracefully', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  expect(await wishlist.badgeCount()).toBe(0);
  expect(await products.isWishlisted(0)).toBeFalsy();

  await wishlist.navigate();
  await expect(wishlist.emptyState).toBeVisible();
});

test('TC-W15: Wishlist icon stays consistent between listing and detail pages', async ({ page }) => {
  const products  = new ProductsPage(page);

  await products.navigate();
  await products.clickHeart(0);
  expect(await products.isWishlisted(0)).toBeTruthy();

  await products.card(0).click();

  const productInfo = page.locator('.product-page-info');
  await expect(productInfo).toBeVisible();
  await expect(productInfo.locator('.btn-favorite')).toHaveClass(/active/);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 6 — Navigation & Filtering
// ══════════════════════════════════════════════════════════════════════════

test('TC-W17: Category filter does not affect wishlist counter', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();

  // Add one product from each category using filters
  const categoryCount = await page.locator('input[type="checkbox"]').count();
  for (let i = 0; i < categoryCount; i++) {
    const checkbox = page.locator('input[type="checkbox"]').nth(i);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await products.applyFiltersBtn.click();
    await page.waitForTimeout(500);
    if ((await products.cards.count()) > 0) {
      await products.addProductsToWishlist(1);
    }
    await products.clearFiltersBtn.click();
    await page.waitForTimeout(500);
  }

  const countBefore = await wishlist.badgeCount();
  expect(countBefore).toBeGreaterThan(0);

  await products.navigate();

  const firstCheckbox = page.locator('input[type="checkbox"]').nth(0);
  await firstCheckbox.check();
  await products.applyFiltersBtn.click();
  await page.waitForTimeout(500);

  expect(await products.isWishlisted(0)).toBeTruthy();
  expect(await wishlist.badgeCount()).toBe(countBefore);

  await products.clearFiltersBtn.click();
  expect(await products.isWishlisted(0)).toBeTruthy();
});

test('TC-W18 [EDGE]: Browser back preserves wishlist state', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);
  await wishlist.navigate();

  await page.goBack();

  await expect(products.container).toBeVisible();
  expect(await products.isWishlisted(0)).toBeTruthy();
  expect(await wishlist.badgeCount()).toBe(1);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 7 — Boundary / Rapid Actions
// ══════════════════════════════════════════════════════════════════════════

test('TC-W19 [EDGE]: Rapid heart clicks produce consistent state', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();

  for (let i = 0; i < 5; i++) {
    await products.clickHeart(0);
  }

  const badge = await wishlist.badgeCount();
  expect(badge).toBeGreaterThanOrEqual(0);
  expect(badge).toBeLessThanOrEqual(1);

  if (await products.isWishlisted(0)) {
    expect(badge).toBe(1);
  } else {
    expect(badge).toBe(0);
  }

  await wishlist.navigate();
  expect(await wishlist.items.count()).toBeLessThanOrEqual(1);
});

test('TC-W20 [EDGE]: Remove button is reachable on wishlist', async ({ page }) => {
  const products  = new ProductsPage(page);
  const wishlist  = new WishlistPage(page);

  await products.navigate();
  await products.clickHeart(0);
  await wishlist.navigate();

  await expect(wishlist.items).not.toHaveCount(0);
  await wishlist.removeItem(0);
  await expect(wishlist.items).toHaveCount(0);
});

test.describe('TC-W21: Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Wishlist is functional on mobile viewport', async ({ page }) => {
    const products  = new ProductsPage(page);
    const wishlist  = new WishlistPage(page);

    await products.goto();
    await products.navigate();
    await products.clickHeart(0);

    expect(await wishlist.badgeCount()).toBe(1);
    expect(await products.isWishlisted(0)).toBeTruthy();

    await wishlist.navigate();
    await expect(wishlist.items).toHaveCount(1);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(500);
  });
});
