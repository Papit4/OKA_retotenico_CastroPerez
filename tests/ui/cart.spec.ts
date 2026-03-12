import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { RandomHelper } from '../../src/helpers/RandomHelper';
import usersData from '../../src/data/users.json';
import productsData from '../../src/data/products.json';

/**
 * Cart & Checkout test suite
 * Covers: adding products from each category, removing products, and completing a purchase.
 */
test.describe('Cart & Checkout', () => {
  let home: HomePage;
  let cart: CartPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    home     = new HomePage(page);
    cart     = new CartPage(page);
    checkout = new CheckoutPage(page);

    // Ensure we are logged in before each cart test
    const newUser = RandomHelper.newUser();
    await home.open();
    await home.openSignupModal();
    await home.signupAndGetAlert(newUser.username, newUser.password);
     await home.open();
    await home.login(newUser.username, newUser.password);
  });

  // ── Add products ──────────────────────────────────────────────────────────

  test.describe('Adding products', () => {
    test('should add a Phone to the cart', async () => {
      await home.addProductToCart(productsData.phone.category, productsData.phone.name);

      await home.goToCart();
      await cart.open();
      const products = await cart.getProductNames();
      expect(products).toContain(productsData.phone.name);
    });

    test('should add a Laptop to the cart', async () => {
      await home.addProductToCart(productsData.laptop.category, productsData.laptop.name);

      await home.goToCart();
      await cart.open();
      const products = await cart.getProductNames();
      expect(products).toContain(productsData.laptop.name);
    });

    test('should add a Monitor to the cart', async () => {
      await home.addProductToCart(productsData.monitor.category, productsData.monitor.name);

      await home.goToCart();
      await cart.open();
      const products = await cart.getProductNames();
      expect(products).toContain(productsData.monitor.name);
    });

    test('should add products from multiple categories and show them all in cart', async () => {
      for (const p of productsData.cartProducts) {
        await home.addProductToCart(p.category as 'Phones' | 'Laptops', p.name);
      }

      await home.goToCart();
      await cart.open();
      const products = await cart.getProductNames(productsData.cartProducts.length);

      for (const p of productsData.cartProducts) {
        expect(products).toContain(p.name);
      }
      expect(await cart.getItemCount()).toBeGreaterThanOrEqual(productsData.cartProducts.length);
    });

    test('should update total price when product is added', async () => {
      await home.addProductToCart(productsData.phone.category, productsData.phone.name);

      await home.goToCart();
      await cart.open();
      const total = await cart.getTotalPrice();
      expect(total).toBeGreaterThan(0);
    });
  });

  // ── Delete products ───────────────────────────────────────────────────────

  test.describe('Removing products', () => {
   test('should remove a product from the cart', async () => {
       await home.addProductToCart(productsData.phone.category, productsData.phone.name);
       await cart.open();

       // Verificar que el producto está antes de borrarlo
       expect(await cart.isProductVisible(productsData.phone.name)).toBe(true);

       await cart.deleteProduct(productsData.phone.name);

       expect(await cart.isProductVisible(productsData.phone.name)).toBe(false);
   });
  });

  // ── Checkout ──────────────────────────────────────────────────────────────

  test.describe('Completing a purchase', () => {
    test('should complete the full checkout flow', async () => {
      // 1 – Add item
      await home.addProductToCart(productsData.phone.category, productsData.phone.name);

      // 2 – Go to cart
      await home.goToCart();
      await cart.open();

      // 3 – Open order modal
      await cart.clickPlaceOrder();
      await checkout.waitForOrderModal();

      // 4 – Fill form
      const form = RandomHelper.checkoutForm();
      await checkout.fillOrderForm(form);

      // 5 – Submit
      await checkout.submitPurchase();

      // 6 – Assert confirmation
      expect(await checkout.isConfirmationVisible()).toBe(true);
      const details = await checkout.getConfirmationDetails();
      expect(details).toMatch(/amount|id|card/i);

      // 7 – Close and verify redirect to home
      await checkout.confirmAndClose();
    });
  });
});
