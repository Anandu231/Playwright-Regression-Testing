import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    const searchTerm = 'mascara';

    await page.goto('https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/');
    await page.getByRole('link', { name: 'Products' }).click();
    await page.getByRole('textbox', { name: 'Search....' }).click();
    await page.getByRole('textbox', { name: 'Search....' }).fill(searchTerm);
    await page.getByRole('textbox', { name: 'Search....' }).press('Enter');
    const titles = await page
        .locator('div.product-card h3.product-title')
        .allTextContents();

    for (const title of titles) {
        expect(title.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
});

test('test', async ({ page }) => {
    const searchTerm = 'eye';

    await page.goto('https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/');
    await page.getByRole('link', { name: 'Products' }).click();
    await page.getByRole('textbox', { name: 'Search....' }).click();
    await page.getByRole('textbox', { name: 'Search....' }).fill(searchTerm);
    await page.getByRole('textbox', { name: 'Search....' }).press('Enter');
    const titles = await page
        .locator('div.product-card h3.product-title')
        .allTextContents();

    for (const title of titles) {
        expect(title.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
});