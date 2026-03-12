import { User, CheckoutForm } from '../types';

/**
 * Centralises all random / dynamic data generation.
 * Keeping generation here avoids hardcoded values scattered across tests.
 */
export class RandomHelper {
  /** Returns a username that is unique per test run (timestamp-based). */
  static uniqueUsername(prefix = 'qa_user'): string {
    return `${prefix}_${Date.now()}`;
  }

 static randomPassword(length = 10): string {
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
     return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
 }

  static newUser(): User {
    return {
      username: this.uniqueUsername(),
      password: this.randomPassword(),
    };
  }

  static checkoutForm(): CheckoutForm {
    return {
      name: 'Test User',
      country: 'Argentina',
      city: 'Buenos Aires',
      card: '4111111111111111',
      month: '12',
      year: '2026',
    };
  }

  static orderId(): number {
    return Math.floor(Math.random() * 90_000) + 10_000;
  }
}
