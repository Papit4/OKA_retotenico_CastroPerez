import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutForm } from '../types';

export class CheckoutPage extends BasePage {
  private readonly modal: Locator;
  private readonly nameField: Locator;
  private readonly countryField: Locator;
  private readonly cityField: Locator;
  private readonly cardField: Locator;
  private readonly monthField: Locator;
  private readonly yearField: Locator;
  private readonly purchaseBtn: Locator;
  private readonly confirmationModal: Locator;
  private readonly confirmationText: Locator;
  private readonly okBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.modal             = page.locator('#orderModal');
    this.nameField         = page.locator('#name');
    this.countryField      = page.locator('#country');
    this.cityField         = page.locator('#city');
    this.cardField         = page.locator('#card');
    this.monthField        = page.locator('#month');
    this.yearField         = page.locator('#year');
    this.purchaseBtn       = page.locator('button', { hasText: 'Purchase' });
    this.confirmationModal = page.locator('.sweet-alert');
    this.confirmationText  = page.locator('.sweet-alert p');
    this.okBtn             = page.locator('.sweet-alert .confirm');
  }

  async waitForOrderModal(): Promise<void> {
    await this.waitForVisible(this.modal);
  }

  async fillOrderForm(form: CheckoutForm): Promise<void> {
    await this.fillField(this.nameField, form.name);
    await this.fillField(this.countryField, form.country);
    await this.fillField(this.cityField, form.city);
    await this.fillField(this.cardField, form.card);
    await this.fillField(this.monthField, form.month);
    await this.fillField(this.yearField, form.year);
  }

  async submitPurchase(): Promise<void> {
    await this.purchaseBtn.click();
    await this.waitForVisible(this.confirmationModal, 15_000);
  }

  async getConfirmationDetails(): Promise<string> {
    return this.confirmationText.innerText();
  }

  async isConfirmationVisible(): Promise<boolean> {
    return this.confirmationModal.isVisible();
  }

  async confirmAndClose(): Promise<void> {
      await this.okBtn.click();
      await this.confirmationModal.waitFor({ state: 'hidden', timeout: 5_000 });
  }

}
