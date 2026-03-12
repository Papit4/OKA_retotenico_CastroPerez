import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartTable: Locator;
  private readonly placeOrderBtn: Locator;
  private readonly totalPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.cartTable    = page.locator('#tbodyid');
    this.placeOrderBtn = page.locator('button', { hasText: 'Place Order' });
    this.totalPrice   = page.locator('#totalp');
  }

  async open(): Promise<void> {
    await this.navigateTo('/cart.html');
    await this.page.waitForLoadState('domcontentloaded');
    await this.cartTable.waitFor({ state: 'attached', timeout: 10_000 });
  }

  async getProductNames(expectedCount = 1): Promise<string[]> {
      await this.page.waitForFunction(
          (count) => document.querySelectorAll('#tbodyid tr td:nth-child(2)').length >= count,
          expectedCount,
          { timeout: 10_000 }
      );
      return this.cartTable.locator('tr td:nth-child(2)').allInnerTexts();
  }

  async getItemCount(): Promise<number> {
    // Carrito puede estar vacío — no forzar que haya filas
    return this.cartTable.locator('tr').count();
  }

  async getTotalPrice(): Promise<number> {
    // Esperar que el XHR llene el total
    await this.totalPrice.waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.waitForFunction(
      () => document.querySelector('#totalp')?.textContent?.trim() !== '',
      { timeout: 10_000 }
    );
    const text = await this.totalPrice.innerText();
    return parseFloat(text.trim()) || 0;
  }

  async deleteProduct(productName: string): Promise<void> {
    const row = this.cartTable.locator('tr', { hasText: productName }).first();
    await row.locator('a', { hasText: 'Delete' }).click();
    await row.waitFor({ state: 'detached', timeout: 10_000 });
  }

  async clickPlaceOrder(): Promise<void> {
    await this.placeOrderBtn.click();
  }

  async isProductVisible(productName: string): Promise<boolean> {
    try {
      await this.cartTable
        .locator('tr td:nth-child(2)', { hasText: productName })
        .waitFor({ state: 'visible', timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }
}