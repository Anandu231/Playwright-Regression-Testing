// TC03_Wishlist.test.ts
// Converted from TC03_Wishlist.java (Selenium/TestNG → Playwright/TypeScript)
// Reference: PLAYWRIGHT_CONVERSION.md
//
// Groups:
//   TC-W01 – TC-W04  Add to Wishlist
//   TC-W05 – TC-W06  Remove from Wishlist
//   TC-W07 – TC-W10  Wishlist Display & UI
//   TC-W11          Wishlist <-> Cart Interaction
//   TC-W13 – TC-W15  Persistence & State
//   TC-W17 – TC-W18  Navigation & Filtering
//   TC-W19 – TC-W21  Boundary / Rapid Actions (Edge Cases)

import { test, expect, Page, Locator } from '@playwright/test';

// ── Locators ───────────────────────────────────────────────────────────────

const PRODUCT_PAGE              = 'li a[href="products.html"]';
const WISHLIST_PAGE_NAV         = 'li a[href="favorites.html"]';
const WISHLIST_BADGE            = '#fav-count';
const CART_BADGE                = '#cart-counter';
const VALIDATOR_PRODUCT_PAGE    = '.products-main-container';
const PRODUCT_CARDS             = '.product-card';
const PRODUCT_NAME              = 'h3.product-title';
const PRODUCT_PRICE             = '.product-price-final';
const PRODUCT_IMAGE             = '.product-image-container';
const HEART_BTN                 = '.btn-favorite';
const NEXT_BTN                  = '#next-btn';
const CART_BTN                  = '.btn-add-to-cart, button[class*="cart"]';
const VALIDATOR_WISHLIST_PAGE   = '.favorites-main';
const WISHLIST_ITEMS            = '.product-card';
const EMPTY_STATE               = '.empty-favorites';
const START_SHOPPING            = '.shop-btn';
const ITEM_NAME                 = 'div.product-title';
const ITEM_PRICE                = '.product-price-final, .product-card-price, [class*="price"]';
const ITEM_IMAGE                = '.product-image, img';
const APPLY_FILTER_BTN          = '#apply-filters';
const CLEAR_FILTER              = '#clear-filters';
const FILTER_CATEGORY           = 'input[type="checkbox"]';
const SINGLE_PRODUCT_PAGE_INFO  = '.product-page-info';
const TOGGLE_TEXT               = '.toast.show';

// ── Helpers ────────────────────────────────────────────────────────────────

async function goToProductSite(page: Page): Promise<void> {
  await page.locator(PRODUCT_PAGE).click();
  await expect(page.locator(VALIDATOR_PRODUCT_PAGE)).toBeVisible();
}

async function wishlistBadgeCount(page: Page): Promise<number> {
  try {
    const text = await page.locator(WISHLIST_BADGE).textContent();
    const digits = (text ?? '').replace(/[^0-9]/g, '');
    return digits === '' ? 0 : parseInt(digits, 10);
  } catch {
    return 0;
  }
}

function getProductCards(page: Page): Locator {
  return page.locator(PRODUCT_CARDS);
}

async function clickHeartOnCard(page: Page, index: number): Promise<void> {
  const heart = getProductCards(page).nth(index).locator(HEART_BTN);
  await heart.waitFor({ state: 'visible' });
  await heart.click();
}

async function isWishlisted(page: Page, index: number): Promise<boolean> {
  const heart = getProductCards(page).nth(index).locator(HEART_BTN);
  const cls = await heart.getAttribute('class') ?? '';
  return cls.trim().split(/\s+/).includes('active');
}

async function openWishlistPage(page: Page): Promise<void> {
  await page.locator(WISHLIST_PAGE_NAV).click();
  await page.locator(WISHLIST_ITEMS).or(page.locator(EMPTY_STATE)).first().waitFor();
  await expect(page.locator(VALIDATOR_WISHLIST_PAGE)).toBeVisible();
}

function getWishlistItems(page: Page): Locator {
  return page.locator(WISHLIST_ITEMS);
}

async function cardName(page: Page, index: number): Promise<string> {
  return (await getProductCards(page).nth(index).locator(PRODUCT_NAME).textContent() ?? '').trim();
}

async function cardPrice(page: Page, index: number): Promise<string> {
  return (await getProductCards(page).nth(index).locator(PRODUCT_PRICE).textContent() ?? '').trim();
}

async function cardImage(page: Page, index: number): Promise<string> {
  return (await getProductCards(page).nth(index).locator(PRODUCT_IMAGE).textContent() ?? '').trim();
}

async function cartBadgeCount(page: Page): Promise<number> {
  try {
    const text = await page.locator(CART_BADGE).textContent();
    const digits = (text ?? '').replace(/[^0-9]/g, '');
    return digits === '' ? 0 : parseInt(digits, 10);
  } catch {
    return 0;
  }
}

async function wishlistItemName(page: Page, index: number): Promise<string> {
  return (await getWishlistItems(page).nth(index).locator(ITEM_NAME).textContent() ?? '').trim();
}

async function wishlistItemPrice(page: Page, index: number): Promise<string> {
  return (await getWishlistItems(page).nth(index).locator(ITEM_PRICE).first().textContent() ?? '').trim();
}

async function wishlistItemImage(page: Page, index: number): Promise<string> {
  return (await getWishlistItems(page).nth(index).locator(ITEM_IMAGE).first().textContent() ?? '').trim();
}

async function tooltipMessage(page: Page): Promise<string> {
  return (await page.locator(TOGGLE_TEXT).textContent() ?? '').trim();
}

async function wishlistNameChecker(page: Page, productName: string): Promise<boolean> {
  const items = getWishlistItems(page);
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const name = (await items.nth(i).locator(ITEM_NAME).textContent() ?? '').trim();
    if (name.toLowerCase() === productName.toLowerCase()) return true;
  }
  return false;
}

async function removeWishlistItem(page: Page, index: number): Promise<void> {
  const btn = getWishlistItems(page).nth(index).locator(HEART_BTN);
  await btn.waitFor({ state: 'visible' });
  await btn.click();
}

async function imageLoaded(page: Page, index: number): Promise<boolean> {
  const src = await getWishlistItems(page).nth(index).locator(ITEM_IMAGE).first().getAttribute('src');
  return src !== null && src !== '';
}

/** Adds products to wishlist; pass 0 to add all. Returns count added. */
async function addProductToWishlist(page: Page, number: number): Promise<number> {
  let counter = 0;
  while (true) {
    const cards = getProductCards(page);
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      if (number > 0 && counter >= number) return counter;
      const heart = cards.nth(i).locator(HEART_BTN);
      await heart.click();
      counter++;
    }

    const nextBtn = page.locator(NEXT_BTN);
    const disabled = await nextBtn.getAttribute('disabled');
    if (disabled !== null) break;
    await nextBtn.click();
  }
  return counter;
}

async function addToCartFromWishlist(page: Page, index: number): Promise<void> {
  const btn = getWishlistItems(page).nth(index).locator(CART_BTN).first();
  await btn.waitFor({ state: 'visible' });
  await btn.click();
}

async function addProductToCart(page: Page, index: number): Promise<void> {
  const cart = getProductCards(page).nth(index).locator(CART_BTN).first();
  await cart.waitFor({ state: 'visible' });
  await cart.click();
}

async function clearStorageAndReload(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

function returnFilterCategoryElements(page: Page): Locator {
  return page.locator(FILTER_CATEGORY);
}

async function selectApplyFilterToProduct(page: Page, index: number): Promise<void> {
  const category = returnFilterCategoryElements(page).nth(index);
  await category.click();
  await expect(category).toBeChecked();
  await page.locator(APPLY_FILTER_BTN).click();
}

async function clearFilterOfProduct(page: Page): Promise<void> {
  await page.locator(CLEAR_FILTER).click();
}

async function addOneProductFromEachCategory(page: Page, number: number): Promise<void> {
  const productsToAdd = number === 0 ? 1 : number;
  const count = await returnFilterCategoryElements(page).count();
  for (let i = 0; i < count; i++) {
    await selectApplyFilterToProduct(page, i);
    await addProductToWishlist(page, productsToAdd);
    await clearFilterOfProduct(page);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// GROUP 1 — Add to Wishlist (TC-W01 to TC-W04)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W01: Add a single product to the wishlist', async ({ page }) => {
  await goToProductSite(page);
  const initialCounter = await wishlistBadgeCount(page);
  expect(initialCounter).toBe(0);

  await clickHeartOnCard(page, 0);

  expect(await isWishlisted(page, 0)).toBeTruthy();
  expect(await wishlistBadgeCount(page)).toBe(initialCounter + 1);

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBe(1);
});

test('TC-W02: Add multiple different products to the wishlist', async ({ page }) => {
  await goToProductSite(page);

  const name0  = await cardName(page, 0);
  const price0 = await cardPrice(page, 0);
  const image0 = await cardImage(page, 0);
  const name1  = await cardName(page, 1);
  const price1 = await cardPrice(page, 1);
  const image1 = await cardImage(page, 1);
  const name2  = await cardName(page, 2);
  const price2 = await cardPrice(page, 2);
  const image2 = await cardImage(page, 2);

  await clickHeartOnCard(page, 0);
  await clickHeartOnCard(page, 1);
  await clickHeartOnCard(page, 2);

  expect(await wishlistBadgeCount(page)).toBe(3);

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBe(3);

  expect(await wishlistItemName(page, 0)).toBe(name0);
  expect(await wishlistItemName(page, 1)).toBe(name1);
  expect(await wishlistItemName(page, 2)).toBe(name2);
  expect(await wishlistItemPrice(page, 0)).toBe(price0);
  expect(await wishlistItemPrice(page, 1)).toBe(price1);
  expect(await wishlistItemPrice(page, 2)).toBe(price2);
  expect(await wishlistItemImage(page, 0)).toBe(image0);
  expect(await wishlistItemImage(page, 1)).toBe(image1);
  expect(await wishlistItemImage(page, 2)).toBe(image2);
});

test('TC-W03 [EDGE]: Add same product twice — no duplicate', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  const countAfterFirst = await wishlistBadgeCount(page);

  await clickHeartOnCard(page, 0);
  const tooltipMsg = await tooltipMessage(page);

  expect(await isWishlisted(page, 0)).toBeFalsy();

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBeLessThanOrEqual(1);
  expect(await wishlistBadgeCount(page)).not.toBeGreaterThan(countAfterFirst);
  expect(
    tooltipMsg.includes('Removed') || tooltipMsg.includes('Already')
  ).toBeTruthy();
});

test('TC-W04: Add product to wishlist from product detail page', async ({ page }) => {
  await goToProductSite(page);
  await getProductCards(page).first().click();

  const badgeBefore = await wishlistBadgeCount(page);

  const wishBtn = page.locator(HEART_BTN);
  const productName = (await page.locator('h2.product-page-title').textContent() ?? '').trim();
  await wishBtn.click();

  expect(await wishlistBadgeCount(page)).toBe(badgeBefore + 1);

  const cls = await wishBtn.getAttribute('class') ?? '';
  expect(cls).toContain('active');

  await openWishlistPage(page);
  expect(await wishlistNameChecker(page, productName)).toBeTruthy();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 2 — Remove from Wishlist (TC-W05 to TC-W06)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W05: Remove a single product from the wishlist', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBe(1);

  await removeWishlistItem(page, 0);

  expect(await getWishlistItems(page).count()).toBe(0);
  expect(await wishlistBadgeCount(page)).toBe(0);
  await goToProductSite(page);
  expect(await isWishlisted(page, 0)).toBeFalsy();
});

test('TC-W06 [EDGE]: Remove last item — empty state is shown', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await openWishlistPage(page);

  await removeWishlistItem(page, 0);

  expect(await page.locator(EMPTY_STATE).count()).toBeGreaterThan(0);
  expect(await wishlistBadgeCount(page)).toBe(0);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 3 — Wishlist Display & UI (TC-W07 to TC-W10)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W07: Wishlist displays correct product name, price, and image', async ({ page }) => {
  await goToProductSite(page);
  const expectedName  = await cardName(page, 0);
  const expectedPrice = await cardPrice(page, 0);
  await clickHeartOnCard(page, 0);

  await openWishlistPage(page);

  expect(await wishlistItemName(page, 0)).toBe(expectedName);
  expect(await wishlistItemPrice(page, 0)).toBe(expectedPrice);
  expect(await imageLoaded(page, 0)).toBeTruthy();
});

test('TC-W08: Wishlist badge stays accurate after add and remove', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await clickHeartOnCard(page, 1);
  expect(await wishlistBadgeCount(page)).toBe(2);

  await clickHeartOnCard(page, 2);
  expect(await wishlistBadgeCount(page)).toBe(3);

  await openWishlistPage(page);
  await removeWishlistItem(page, 0);

  expect(await wishlistBadgeCount(page)).toBe(2);
});

test('TC-W09 [EDGE]: Badge does not overflow with large item count', async ({ page }) => {
  await goToProductSite(page);
  const available = await addProductToWishlist(page, 0);

  const badge = await wishlistBadgeCount(page);
  expect(badge).toBeGreaterThan(0);
  expect(badge).toBe(available);
  expect(await page.content()).not.toContain('NaN');
});

test('TC-W10: Empty wishlist shows empty state and Continue Shopping CTA', async ({ page }) => {
  await goToProductSite(page);
  await openWishlistPage(page);

  expect(await page.locator(EMPTY_STATE).count()).toBeGreaterThan(0);
  expect(await getWishlistItems(page).count()).toBe(0);
  expect(await page.locator(START_SHOPPING).count()).toBeGreaterThan(0);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 4 — Wishlist <-> Cart Interaction (TC-W11)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W11: Add to cart from wishlist', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await openWishlistPage(page);

  await addToCartFromWishlist(page, 0);

  expect(await wishlistBadgeCount(page)).toBe(1);
  expect(await cartBadgeCount(page)).toBe(1);
});

// TC-W12 commented out in original:
// test.skip('TC-W12 [EDGE]: Add to cart from wishlist when item already in cart', ...)

// ══════════════════════════════════════════════════════════════════════════
// GROUP 5 — Persistence & State (TC-W13 to TC-W15)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W13: Wishlist persists after page refresh', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await clickHeartOnCard(page, 1);
  expect(await wishlistBadgeCount(page)).toBe(2);

  await page.reload();

  expect(await wishlistBadgeCount(page)).toBe(2);
  expect(await isWishlisted(page, 0)).toBeTruthy();
  expect(await isWishlisted(page, 1)).toBeTruthy();

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBe(2);
});

test('TC-W14 [EDGE]: Wishlist handles cleared localStorage gracefully', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);

  await clearStorageAndReload(page);

  expect(await wishlistBadgeCount(page)).toBe(0);
  expect(await isWishlisted(page, 0)).toBeFalsy();

  await openWishlistPage(page);
  expect(await page.locator(EMPTY_STATE).count()).toBeGreaterThan(0);
});

test('TC-W15: Wishlist icon is consistent across listing and detail pages', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  expect(await isWishlisted(page, 0)).toBeTruthy();

  await getProductCards(page).first().click();

  const productInfo = page.locator(SINGLE_PRODUCT_PAGE_INFO);
  await expect(productInfo).toBeVisible();
  const wishBtnCls = await productInfo.locator(HEART_BTN).getAttribute('class') ?? '';
  expect(wishBtnCls).toContain('active');
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 6 — Navigation & Filtering (TC-W17 to TC-W18)
// ══════════════════════════════════════════════════════════════════════════

// TC-W16 commented out in original:
// test.skip('TC-W16: Clicking a wishlist item navigates to product detail page', ...)

test('TC-W17: Category filter does not change wishlist counter', async ({ page }) => {
  await goToProductSite(page);
  await addOneProductFromEachCategory(page, 1);
  const countBefore = await wishlistBadgeCount(page);
  expect(countBefore).toBe(6); // Automotive has no product

  await goToProductSite(page);
  await selectApplyFilterToProduct(page, 0);

  expect(await isWishlisted(page, 0)).toBeTruthy();
  expect(await wishlistBadgeCount(page)).toBe(countBefore);

  await clearFilterOfProduct(page);
  expect(await isWishlisted(page, 0)).toBeTruthy();
});

test('TC-W18 [EDGE]: Browser back button preserves wishlist heart states', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await openWishlistPage(page);

  await page.goBack();

  expect(await isWishlisted(page, 0)).toBeTruthy();
  expect(await wishlistBadgeCount(page)).toBe(1);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 7 — Boundary / Rapid Actions (TC-W19 to TC-W21)
// ══════════════════════════════════════════════════════════════════════════

test('TC-W19 [EDGE]: Rapid heart clicks produce consistent wishlist state', async ({ page }) => {
  await goToProductSite(page);
  for (let i = 0; i < 5; i++) {
    await clickHeartOnCard(page, 0);
  }

  const badge = await wishlistBadgeCount(page);
  expect(badge).toBeGreaterThanOrEqual(0);
  expect(badge).toBeLessThanOrEqual(1);

  const wishlisted = await isWishlisted(page, 0);
  if (wishlisted) {
    expect(badge).toBe(1);
  } else {
    expect(badge).toBe(0);
  }

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBeLessThanOrEqual(1);
});

test('TC-W20 [EDGE]: Long product name does not break wishlist layout', async ({ page }) => {
  await goToProductSite(page);
  await clickHeartOnCard(page, 0);
  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBeGreaterThan(0);

  try {
    await removeWishlistItem(page, 0);
    expect(await getWishlistItems(page).count()).toBe(0);
  } catch (e) {
    throw new Error('TC-W20: Remove button not reachable — possible layout overflow: ' + String(e));
  }
});

test('TC-W21 [EDGE]: Wishlist is functional on a mobile viewport (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await goToProductSite(page);

  await clickHeartOnCard(page, 0);

  expect(await wishlistBadgeCount(page)).toBe(1);
  expect(await isWishlisted(page, 0)).toBeTruthy();

  await openWishlistPage(page);
  expect(await getWishlistItems(page).count()).toBe(1);

  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(500);
});
