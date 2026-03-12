import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { RandomHelper } from '../../src/helpers/RandomHelper';
import usersData from '../../src/data/users.json';

/**
 * Auth test suite
 * Covers: user creation, field validation, error messages, successful / failed login.
 */
test.describe('Authentication', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.open();
  });

  // ── Sign-up ───────────────────────────────────────────────────────────────

  test.describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const newUser = RandomHelper.newUser();
      await home.openSignupModal();
      const alert = await home.signupAndGetAlert(newUser.username, newUser.password);

      expect(alert).toBe('Sign up successful.');
    });

    test('should reject registration of an already-existing user', async () => {
      // Use the pre-existing user from data file
      const existingUser = usersData.validUser;
      await home.openSignupModal();
      const alert = await home.signupAndGetAlert(existingUser.username, existingUser.password);

      expect(alert).toMatch(/this user already exist/i);
    });

    test('should require a username (empty username validation)', async () => {
      await home.openSignupModal();
      const alert = await home.signupAndGetAlert('', 'somePassword');

      expect(alert).toMatch(/please fill out username and password/i);
    });

    test('should require a password (empty password validation)', async () => {
      await home.openSignupModal();
      const alert = await home.signupAndGetAlert('some_username', '');

      expect(alert).toMatch(/please fill out username and password/i);
    });

  test('should verify a newly registered user exists (re-registration check)', async () => {
      const newUser = RandomHelper.newUser();

      // 1 – Registrar
      await home.openSignupModal();
      const signupAlert = await home.signupAndGetAlert(newUser.username, newUser.password);
      expect(signupAlert).toBe('Sign up successful.');

      // 2 – Recargar para resetear estado del modal en todos los browsers
      await home.open();

      // 3 – Verificar que el usuario ya existe
      await home.openSignupModal();
      const duplicateAlert = await home.signupAndGetAlert(newUser.username, newUser.password);
      expect(duplicateAlert).toMatch(/this user already exist/i);
  });
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  test.describe('Login', () => {
    test('should login successfully with valid credentials', async () => {
      const { username, password } = usersData.validUser;
      await home.login(username, password);

      const welcomeText = await home.getWelcomeText();
      expect(welcomeText).toContain(username);
    });

    test('should fail login with a non-existent user', async () => {
      const { username, password } = usersData.invalidUser;
      await home.openLoginModal();
      const alert = await home.loginAndGetAlert(username, password);

      expect(alert).toMatch(/user does not exist/i);
    });

    test('should fail login with wrong password', async () => {
      const { username } = usersData.validUser;
      await home.openLoginModal();
      const alert = await home.loginAndGetAlert(username, 'wrong_password_xyz');

      expect(alert).toMatch(/wrong password/i);
    });

    test('should require username and password fields', async () => {
      await home.openLoginModal();
      const alert = await home.loginAndGetAlert('', '');

      expect(alert).toMatch(/please fill out username and password/i);
    });

    test('should logout successfully after login', async () => {
      const { username, password } = usersData.validUser;
      await home.login(username, password);
      await home.logout();

      expect(await home.isLoggedIn()).toBe(false);
    });
  });
});
