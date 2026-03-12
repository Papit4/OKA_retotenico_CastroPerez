import { Page, Locator,expect } from '@playwright/test';


/**
 * BasePage encapsulates low-level Playwright interactions.
 * All Page Objects extend this class so test code stays at the
 * business-domain level and never calls raw Playwright APIs directly.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigateTo(path = ''): Promise<void> {
    await this.page.goto(path || '/');
  }

 protected async clickAndWaitForAlert(locator: Locator): Promise<string> {
     const dialogPromise = new Promise<string>(resolve => {
         this.page.once('dialog', async (dialog) => {
             const message = dialog.message();
             await dialog.accept();
             resolve(message);
         });
     });

     await locator.click({ force: true });
     return dialogPromise;
 }


 protected async fillField(locator: Locator, value: string): Promise<void> {
     await locator.clear();
     await locator.fill(value);
 }

  protected async waitForVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }
}
