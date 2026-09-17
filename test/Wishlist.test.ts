import { test, expect, Page, Locator } from '@playwright/test';

const BASE_URL = 'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/';

// ── Locators ──────────────────────────────────────────────────────────────

// Header / Navigation
const PRODUCT_PAGE = 'li a[href="products.html"]';
const WISHLIST_PAGE = 'li a[href="favorites.html"]';
const WISHLIST_BADGE = '#fav-count';
const CART_BADGE = '#cart-counter';

// Product listing page
const VALIDATOR_PRODUCT_PAGE = '.products-main-container';
const PRODUCT_CARDS = '.product-card';
const PRODUCT_NAME = 'h3.product-title';
const PRODUCT_PRICE = '.product-price-final';
const PRODUCT_IMAGE = '.product-image-container img';
const HEART_BTN = '.btn-favorite';
const NEXT_BTN = '#next-btn';
const CART_BTN = '.btn-add-to-cart';

// Wishlist page
const VALIDATOR_WISHLIST_PAGE = '.favorites-main';
const WISHLIST_ITEMS = '.product-card';
const EMPTY_STATE = '.empty-favorites';
const START_SHOPPING = '.shop-btn';
const ITEM_REMOVE_BTN = '.btn-favorite';
const ITEM_ADD_TO_CART_BTN = '.btn-add-to-cart';
const ITEM_NAME = 'div.product-title, h3.product-title';
const ITEM_PRICE = '.product-price-final';
const ITEM_IMAGE = '.product-image-container img';

// Filter
const APPLY_FILTER_BTN = '#apply-filters';
const CLEAR_FILTER = '#clear-filters';
const FILTER_CATEGORY = 'input[type="checkbox"]';

// Single product detail page
const SINGLE_PRODUCT_PAGE_INFO = '.product-page-info';
const DETAIL_PRODUCT_TITLE = 'h2.product-page-title';

// Toast popup
const TOAST = '.toast.show';

// ── Helper Functions ──────────────────────────────────────────────────────

async function goToProductSite(page: Page): Promise<void> {
    await page.locator(PRODUCT_PAGE).click();

    await expect(page.locator(VALIDATOR_PRODUCT_PAGE)).toBeVisible({
        timeout: 10_000,
    });
}

async function wishlistBadgeCount(page: Page): Promise<number> {
    try {
        const text = await page.locator(WISHLIST_BADGE).textContent();
        const digits = (text ?? '').trim().replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : 0;
    } catch {
        return 0;
    }
}

async function cartBadgeCount(page: Page): Promise<number> {
    try {
        const text = await page.locator(CART_BADGE).textContent();
        const digits = (text ?? '').trim().replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : 0;
    } catch {
        return 0;
    }
}

function productCards(page: Page): Locator {
    return page.locator(PRODUCT_CARDS);
}

function productCard(page: Page, index: number): Locator {
    return productCards(page).nth(index);
}

function wishlistItems(page: Page): Locator {
    return page.locator(WISHLIST_ITEMS);
}

function wishlistItem(page: Page, index: number): Locator {
    return wishlistItems(page).nth(index);
}

async function clickHeartOnCard(page: Page, index: number): Promise<void> {
    const heart = productCard(page, index).locator(HEART_BTN);
    await heart.scrollIntoViewIfNeeded();
    await heart.click();
}

async function isWishlisted(page: Page, index: number): Promise<boolean> {
    const className =
        (await productCard(page, index).locator(HEART_BTN).getAttribute('class')) ??
        '';

    return className.split(/\s+/).includes('active');
}

async function openWishlistPage(page: Page): Promise<void> {
    await page.locator(WISHLIST_PAGE).getByText("Favorites").click();

    await expect(page.locator(VALIDATOR_WISHLIST_PAGE)).toBeVisible({
        timeout: 10_000,
    });

    await expect
        .poll(
            async () => {
                const itemCount = await wishlistItems(page).count();
                const emptyCount = await page.locator(EMPTY_STATE).count();
                return itemCount > 0 || emptyCount > 0;
            },
            { timeout: 10_000 }
        )
        .toBe(true);
}

async function cardName(page: Page, index: number): Promise<string> {
    return (await productCard(page, index).locator(PRODUCT_NAME).textContent())?.trim() ?? '';
}

async function cardPrice(page: Page, index: number): Promise<string> {
    return (
        (await productCard(page, index).locator(PRODUCT_PRICE).textContent())?.trim() ??
        ''
    );
}

async function cardImageSrc(page: Page, index: number): Promise<string | null> {
    return productCard(page, index).locator(PRODUCT_IMAGE).first().getAttribute('src');
}

async function wishlistItemName(page: Page, index: number): Promise<string> {
    return (
        (await wishlistItem(page, index).locator(ITEM_NAME).first().textContent())?.trim() ??
        ''
    );
}

async function wishlistItemPrice(page: Page, index: number): Promise<string> {
    return (
        (await wishlistItem(page, index).locator(ITEM_PRICE).first().textContent())?.trim() ??
        ''
    );
}

async function wishlistItemImageSrc(
    page: Page,
    index: number
): Promise<string | null> {
    return wishlistItem(page, index).locator(ITEM_IMAGE).first().getAttribute('src');
}

async function imageLoaded(page: Page, index: number): Promise<boolean> {
    const src = await wishlistItemImageSrc(page, index);
    return Boolean(src?.trim());
}

async function tooltipMessage(page: Page): Promise<string> {
    const toast = page.locator(TOAST);
    await expect(toast).toBeVisible({ timeout: 5_000 });
    return (await toast.textContent())?.trim() ?? '';
}

async function wishlistNameChecker(
    page: Page,
    productName: string
): Promise<boolean> {
    await page.reload()
    await page.waitForLoadState("networkidle")
    const count = await wishlistItems(page).count();
    for (let i = 0; i < count; i++) {
        const name = await wishlistItemName(page, i);
        console.log(name)
        console.log(productName)
        console.log("================================")
        if (name.toLowerCase() === productName.toLowerCase()) {
            return true;
        }
    }

    return false;
}

async function removeWishlistItem(page: Page, index: number): Promise<void> {
    const button = wishlistItem(page, index).locator(ITEM_REMOVE_BTN);
    await button.scrollIntoViewIfNeeded();
    await button.click();
}

async function addToCartFromWishlist(
    page: Page,
    index: number
): Promise<void> {
    const button = wishlistItem(page, index).locator(ITEM_ADD_TO_CART_BTN);
    await button.scrollIntoViewIfNeeded();
    await button.click();
}

async function addProductToCart(page: Page, index: number): Promise<void> {
    const cartButton = productCard(page, index).locator(CART_BTN);
    await cartButton.scrollIntoViewIfNeeded();
    await cartButton.click();
}

async function clearStorageAndReload(page: Page): Promise<void> {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
}

async function selectApplyFilterToProduct(
    page: Page,
    index: number
): Promise<void> {
    const category = page.locator(FILTER_CATEGORY).nth(index);

    await category.check();
    await expect(category).toBeChecked();

    await page.locator(APPLY_FILTER_BTN).click();
}

async function clearFilterOfProduct(page: Page): Promise<void> {
    await page.locator(CLEAR_FILTER).click();
}

async function addProductToWishlist(
    page: Page,
    number: number
): Promise<number> {
    let counter = 0;

    while (true) {
        const cardCount = await productCards(page).count();

        for (let i = 0; i < cardCount; i++) {
            if (number > 0 && counter >= number) {
                return counter;
            }

            const heart = productCard(page, i).locator(HEART_BTN);
            const classes = (await heart.getAttribute('class')) ?? '';

            // Avoid removing an item which is already wishlisted.
            if (!classes.includes('active')) {
                await heart.click();
                counter++;
            }
        }

        const nextButton = page.locator(NEXT_BTN);

        if ((await nextButton.count()) === 0 || (await nextButton.isDisabled())) {
            break;
        }

        await nextButton.click();
    }

    return counter;
}

async function addOneProductFromEachCategory(
    page: Page,
    number: number
): Promise<void> {
    const productsToAdd = number === 0 ? 1 : number;
    const categoryCount = await page.locator(FILTER_CATEGORY).count();

    for (let i = 0; i < categoryCount; i++) {
        await selectApplyFilterToProduct(page, i);

        if ((await productCards(page).count()) > 0) {
            await addProductToWishlist(page, productsToAdd);
        }

        await clearFilterOfProduct(page);
    }
}

// ── Test Setup ─────────────────────────────────────────────────────────────

// Each Playwright test gets a clean BrowserContext by default.
// This is the equivalent of starting a clean driver session in TestBase.

test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 1 — Add to Wishlist
// ══════════════════════════════════════════════════════════════════════════

test('TC-W01: Add a single product to the wishlist', async ({ page }) => {
    await goToProductSite(page);

    const initialCount = await wishlistBadgeCount(page);
    expect(initialCount).toBe(0);

    await clickHeartOnCard(page, 0);

    expect(await isWishlisted(page, 0)).toBeTruthy();
    expect(await wishlistBadgeCount(page)).toBe(initialCount + 1);

    await openWishlistPage(page);

    await expect(wishlistItems(page)).toHaveCount(1);
});

test('TC-W02: Add multiple different products to the wishlist', async ({
                                                                           page,
                                                                       }) => {
    await goToProductSite(page);

    const expectedProducts = [];

    for (let i = 0; i < 3; i++) {
        expectedProducts.push({
            name: await cardName(page, i),
            price: await cardPrice(page, i),
            imageSrc: await cardImageSrc(page, i),
        });
    }

    await clickHeartOnCard(page, 0);
    await clickHeartOnCard(page, 1);
    await clickHeartOnCard(page, 2);

    expect(await wishlistBadgeCount(page)).toBe(3);

    await openWishlistPage(page);

    await expect(wishlistItems(page)).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
        expect(await wishlistItemName(page, i)).toBe(expectedProducts[i].name);
        expect(await wishlistItemPrice(page, i)).toBe(expectedProducts[i].price);
        expect(await wishlistItemImageSrc(page, i)).toBe(
            expectedProducts[i].imageSrc
        );
    }
});

test('TC-W03 [EDGE]: Add same product twice — no duplicate', async ({
                                                                        page,
                                                                    }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    const countAfterFirst = await wishlistBadgeCount(page);

    await clickHeartOnCard(page, 0);

    const message = await tooltipMessage(page);

    expect(await isWishlisted(page, 0)).toBeFalsy();

    await openWishlistPage(page);

    expect(await wishlistItems(page).count()).toBeLessThanOrEqual(1);
    expect(await wishlistBadgeCount(page)).toBeLessThanOrEqual(countAfterFirst);

    expect(
        message.includes('Removed') || message.includes('Already')
    ).toBeTruthy();
});

test('TC-W04: Add product to wishlist from product detail page', async ({
                                                                            page,
                                                                        }) => {
    await goToProductSite(page);
    await productCard(page, 0).click();
    const badgeBefore = await wishlistBadgeCount(page);
    const title = page.locator(DETAIL_PRODUCT_TITLE);
    await expect(title).toBeVisible();

    const productName = (await title.textContent())?.trim() ?? '';

    const wishlistButton = page.locator(HEART_BTN);
    await wishlistButton.click();

    expect(await wishlistBadgeCount(page)).toBe(badgeBefore + 1);
    await expect(wishlistButton).toHaveClass(/active/);

    await openWishlistPage(page);
    expect(await wishlistNameChecker(page, productName)).toBeTruthy();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 2 — Remove from Wishlist
// ══════════════════════════════════════════════════════════════════════════
// 5, 10, 13, 17,
test('TC-W05: Remove a single product from the wishlist', async ({ page }) => {
    await goToProductSite(page);
    await clickHeartOnCard(page, 0);

    await openWishlistPage(page);
    await expect(wishlistItems(page)).toHaveCount(1);

    await removeWishlistItem(page, 0);

    await expect(wishlistItems(page)).toHaveCount(0);
    expect(await wishlistBadgeCount(page)).toBe(0);

    await goToProductSite(page);
    expect(await isWishlisted(page, 0)).toBeFalsy();
});

test('TC-W06 [EDGE]: Remove last item shows empty state', async ({ page }) => {
    await goToProductSite(page);
    await clickHeartOnCard(page, 0);

    await openWishlistPage(page);
    await removeWishlistItem(page, 0);

    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    expect(await wishlistBadgeCount(page)).toBe(0);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 3 — Wishlist Display & UI
// ══════════════════════════════════════════════════════════════════════════

test('TC-W07: Wishlist displays correct product details', async ({ page }) => {
    await goToProductSite(page);

    const expectedName = await cardName(page, 0);
    const expectedPrice = await cardPrice(page, 0);

    await clickHeartOnCard(page, 0);
    await openWishlistPage(page);

    expect(await wishlistItemName(page, 0)).toBe(expectedName);
    expect(await wishlistItemPrice(page, 0)).toBe(expectedPrice);
    expect(await imageLoaded(page, 0)).toBeTruthy();
});

test('TC-W08: Wishlist badge stays accurate after add and remove', async ({
                                                                              page,
                                                                          }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    await clickHeartOnCard(page, 1);

    expect(await wishlistBadgeCount(page)).toBe(2);

    await clickHeartOnCard(page, 2);
    expect(await wishlistBadgeCount(page)).toBe(3);

    await openWishlistPage(page);
    await removeWishlistItem(page, 0);

    await expect
        .poll(() => wishlistBadgeCount(page))
        .toBe(2);
});

test('TC-W09 [EDGE]: Badge does not overflow with many items', async ({
                                                                          page,
                                                                      }) => {
    await goToProductSite(page);

    const addedItems = await addProductToWishlist(page, 101);
    const badgeCount = await wishlistBadgeCount(page);

    expect(badgeCount).toBeGreaterThan(0);
    expect(badgeCount).toBe(addedItems);
    expect(await page.content()).not.toContain('NaN');
});

test('TC-W10: Empty wishlist displays empty state and shopping CTA', async ({
                                                                                page,
                                                                            }) => {
    await goToProductSite(page);
    await openWishlistPage(page);

    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await expect(wishlistItems(page)).toHaveCount(0);
    await expect(page.locator(START_SHOPPING)).toBeVisible();
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 4 — Wishlist <-> Cart Interaction
// ══════════════════════════════════════════════════════════════════════════

test('TC-W11: Add to cart from wishlist', async ({ page }) => {
    await goToProductSite(page);
    await clickHeartOnCard(page, 0);

    await openWishlistPage(page);
    await addToCartFromWishlist(page, 0);

    expect(await wishlistBadgeCount(page)).toBe(1);
    expect(await cartBadgeCount(page)).toBe(1);
});
/*
test('TC-W12 [EDGE]: Add to cart from wishlist when item is already in cart', async ({
                                                                                         page,
                                                                                     }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    await addProductToCart(page, 0);

    expect(await cartBadgeCount(page)).toBe(1);
    expect(await wishlistBadgeCount(page)).toBe(1);

    const countAfterFirstAdd = await cartBadgeCount(page);

    await openWishlistPage(page);
    await addToCartFromWishlist(page, 0);

    expect(await cartBadgeCount(page)).toBeGreaterThanOrEqual(countAfterFirstAdd);
});
*/
// ══════════════════════════════════════════════════════════════════════════
// GROUP 5 — Persistence & State
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
    await expect(wishlistItems(page)).toHaveCount(2);
});

test('TC-W14 [EDGE]: Wishlist handles cleared localStorage gracefully', async ({
                                                                                   page,
                                                                               }) => {
    await goToProductSite(page);
    await clickHeartOnCard(page, 0);

    await clearStorageAndReload(page);

    expect(await wishlistBadgeCount(page)).toBe(0);
    expect(await isWishlisted(page, 0)).toBeFalsy();

    await openWishlistPage(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
});

test('TC-W15: Wishlist icon stays consistent between listing and detail pages', async ({
                                                                                           page,
                                                                                       }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    expect(await isWishlisted(page, 0)).toBeTruthy();

    await productCard(page, 0).click();

    const productInfo = page.locator(SINGLE_PRODUCT_PAGE_INFO);
    await expect(productInfo).toBeVisible();

    await expect(productInfo.locator(HEART_BTN)).toHaveClass(/active/);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 6 — Navigation & Filtering
// ══════════════════════════════════════════════════════════════════════════
/*
test('TC-W16: Clicking wishlist item navigates to product detail page', async ({
                                                                                   page,
                                                                               }) => {
    await goToProductSite(page);
    await clickHeartOnCard(page, 0);

    await openWishlistPage(page);

    const urlBefore = page.url();

    await wishlistItem(page, 0).click();

    await expect
        .poll(async () => {
            return (
                page.url() !== urlBefore ||
                (await page.locator(SINGLE_PRODUCT_PAGE_INFO).count()) > 0
            );
        })
        .toBeTruthy();
});
*/
test('TC-W17: Category filter does not affect wishlist counter', async ({
                                                                            page,
                                                                        }) => {
    await goToProductSite(page);

    await addOneProductFromEachCategory(page, 1);

    const countBefore = await wishlistBadgeCount(page);
    expect(countBefore).toBeGreaterThan(0);

    await goToProductSite(page);
    await selectApplyFilterToProduct(page, 0);

    expect(await isWishlisted(page, 0)).toBeTruthy();
    expect(await wishlistBadgeCount(page)).toBe(countBefore);

    await clearFilterOfProduct(page);

    expect(await isWishlisted(page, 0)).toBeTruthy();
});

test('TC-W18 [EDGE]: Browser back preserves wishlist state', async ({
                                                                        page,
                                                                    }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    await openWishlistPage(page);

    await page.goBack();

    await expect(page.locator(VALIDATOR_PRODUCT_PAGE)).toBeVisible();

    expect(await isWishlisted(page, 0)).toBeTruthy();
    expect(await wishlistBadgeCount(page)).toBe(1);
});

// ══════════════════════════════════════════════════════════════════════════
// GROUP 7 — Boundary / Rapid Actions
// ══════════════════════════════════════════════════════════════════════════

test('TC-W19 [EDGE]: Rapid heart clicks produce consistent state', async ({
                                                                              page,
                                                                          }) => {
    await goToProductSite(page);

    for (let i = 0; i < 5; i++) {
        await clickHeartOnCard(page, 0);
    }

    const badge = await wishlistBadgeCount(page);

    expect(badge).toBeGreaterThanOrEqual(0);
    expect(badge).toBeLessThanOrEqual(1);

    if (await isWishlisted(page, 0)) {
        expect(badge).toBe(1);
    } else {
        expect(badge).toBe(0);
    }

    await openWishlistPage(page);

    expect(await wishlistItems(page).count()).toBeLessThanOrEqual(1);
});

test('TC-W20 [EDGE]: Remove button is reachable on wishlist', async ({
                                                                         page,
                                                                     }) => {
    await goToProductSite(page);

    await clickHeartOnCard(page, 0);
    await openWishlistPage(page);

    await expect(wishlistItems(page)).not.toHaveCount(0);

    await removeWishlistItem(page, 0);

    await expect(wishlistItems(page)).toHaveCount(0);
});

test.describe('TC-W21: Mobile viewport', () => {
    test.use({
        viewport: {
            width: 375,
            height: 812,
        },
    });

    test('Wishlist is functional on mobile viewport', async ({ page }) => {
        await goToProductSite(page);

        await clickHeartOnCard(page, 0);

        expect(await wishlistBadgeCount(page)).toBe(1);
        expect(await isWishlisted(page, 0)).toBeTruthy();

        await openWishlistPage(page);

        await expect(wishlistItems(page)).toHaveCount(1);

        const bodyScrollWidth = await page.evaluate(
            () => document.body.scrollWidth
        );

        expect(bodyScrollWidth).toBeLessThanOrEqual(500);
    });
});