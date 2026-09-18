import { Page } from '@playwright/test';

export const BASE_URL = 'https://surajkumar-ibm.github.io/Selenium-Miniproject-Application/';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = ''): Promise<void> {
    await this.page.goto(BASE_URL + path);
  }
}
