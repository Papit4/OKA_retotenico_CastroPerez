import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // ── Nav ──────────────────────────────────────────────────────────────────
  private readonly navSignup: Locator;
  private readonly navLogin: Locator;
  private readonly navLogout: Locator;
  private readonly navCart: Locator;
  private readonly welcomeUser: Locator;

  // ── Sign-up modal ─────────────────────────────────────────────────────────
  private readonly signupModal: Locator;
  private readonly signupUsername: Locator;
  private readonly signupPassword: Locator;
  private readonly signupBtn: Locator;

  // ── Login modal ───────────────────────────────────────────────────────────
  private readonly loginModal: Locator;
  private readonly loginUsername: Locator;
  private readonly loginPassword: Locator;
  private readonly loginBtn: Locator;

  // ── Product grid ──────────────────────────────────────────────────────────
  private readonly categoryPhones: Locator;
  private readonly categoryLaptops: Locator;
  private readonly categoryMonitors: Locator;

  constructor(page: Page) {
    super(page);
    this.navSignup   = page.locator('#signin2');
    this.navLogin    = page.locator('#login2');
    this.navLogout   = page.locator('#logout2');
    this.navCart     = page.locator('#cartur');
    this.welcomeUser = page.locator('#nameofuser');

    this.signupModal    = page.locator('#signInModal');
    this.signupUsername = page.locator('#sign-username');
    this.signupPassword = page.locator('#sign-password');
    this.signupBtn      = page.locator('#signInModal .btn-primary');

    this.loginModal    = page.locator('#logInModal');
    this.loginUsername = page.locator('#loginusername');
    this.loginPassword = page.locator('#loginpassword');
    this.loginBtn      = page.locator('#logInModal .btn-primary');

    this.categoryPhones   = page.locator('a', { hasText: 'Phones' });
    this.categoryLaptops  = page.locator('a', { hasText: 'Laptops' });
    this.categoryMonitors = page.locator('a', { hasText: 'Monitors' });
  }

 async open(): Promise<void> {
     await this.navigateTo('/index.html');
     await this.page.waitForLoadState('domcontentloaded');
     await this.page.locator('#tbodyid').waitFor({ state: 'visible', timeout: 15_000 });
 }
  // ── Auth helpers ──────────────────────────────────────────────────────────

async openSignupModal(): Promise<void> {
    await this.navSignup.click();
    await this.signupUsername.waitFor({ state: 'visible', timeout: 15_000 });
}

  async signupAndGetAlert(username: string, password: string): Promise<string> {
    await this.fillField(this.signupUsername, username);
    await this.fillField(this.signupPassword, password);
    return this.clickAndWaitForAlert(this.signupBtn);
  }

async closeSignupModal(): Promise<void> {
    const closeBtn = this.page.locator('#signInModal .btn-secondary');
    await closeBtn.click();
    await this.page.waitForTimeout(800);
}


async openLoginModal(): Promise<void> {
    await this.navLogin.click();
    await this.loginUsername.waitFor({ state: 'visible', timeout: 15_000 });
}


  async loginAndGetAlert(username: string, password: string): Promise<string> {
    await this.fillField(this.loginUsername, username);
    await this.fillField(this.loginPassword, password);
    return this.clickAndWaitForAlert(this.loginBtn);
  }

  async login(username: string, password: string): Promise<void> {
      for (let attempt = 0; attempt < 3; attempt++) {
          try {
              await this.openLoginModal();
              await this.fillField(this.loginUsername, username);
              await this.fillField(this.loginPassword, password);
              await this.loginBtn.click({ force: true });
              await this.welcomeUser.waitFor({ state: 'visible', timeout: 10_000 });
              return; // éxito, salir del loop
          } catch {
              await this.open(); // resetear estado y reintentar
          }
      }
      throw new Error(`Login failed after 3 attempts for user: ${username}`);
  }

  async logout(): Promise<void> {
    await this.navLogout.click();
    await this.navLogin.waitFor({ state: 'visible' });
  }

  async isLoggedIn(): Promise<boolean> {
    return this.welcomeUser.isVisible();
  }

  async getWelcomeText(): Promise<string> {
    return this.welcomeUser.innerText();
  }

  async goToCart(): Promise<void> {
    await this.navCart.click();
    await this.page.waitForURL('**/cart.html');
  }

  // ── Category & product navigation ─────────────────────────────────────────

async selectCategory(category: 'Phones' | 'Laptops' | 'Monitors'): Promise<void> {
    const map = {
        Phones:   this.categoryPhones,
        Laptops:  this.categoryLaptops,
        Monitors: this.categoryMonitors,
    };
    await map[category].click();
    // Esperar que los productos de la categoría se carguen en el grid
    await this.page.locator('#tbodyid .card-title a').first()
        .waitFor({ state: 'visible', timeout: 10_000 });
}

 async selectProduct(name: string): Promise<void> {
     await this.page.locator('.card-title a', { hasText: name }).click();
     // Esperar que navegue a la página del producto
     await this.page.waitForURL('**/prod.html**', { timeout: 10_000 });
     await this.page.waitForLoadState('domcontentloaded');
 }

  async addCurrentProductToCart(): Promise<string> {
    const addBtn = this.page.locator('.btn-success', { hasText: 'Add to cart' });
    return this.clickAndWaitForAlert(addBtn);
  }

  /** Convenience: navigate to a product and add it to the cart. */
  async addProductToCart(
    category: 'Phones' | 'Laptops' | 'Monitors',
    productName: string,
  ): Promise<void> {
    await this.open();
    await this.selectCategory(category);
    await this.selectProduct(productName);
    const alert = await this.addCurrentProductToCart();
    expect(alert).toBe('Product added.');
  }

  async searchUserInSignupForm(username: string): Promise<boolean> {
    // demoblaze has no search UI – we verify via signup response
    await this.openSignupModal();
    const alert = await this.signupAndGetAlert(username, 'anyPassword');
    return alert.includes('This user already exist');
  }
}
