import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { PetStoreOrder } from '../types';

/**
 * PetStoreClient wraps all HTTP interactions with the Petstore API.
 * Tests never call axios directly; they go through this client so
 * transport details are fully decoupled from test assertions.
 */
export class PetStoreClient {
  private readonly http: AxiosInstance;

  constructor(baseURL = 'https://petstore.swagger.io/v2') {
    this.http = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
      // Don't throw on non-2xx so tests can assert on error responses
      validateStatus: () => true,
      proxy:false
    });
  }

  // ── Store / Order endpoints ───────────────────────────────────────────────

  async getInventory(): Promise<AxiosResponse<Record<string, number>>> {
    return this.http.get('/store/inventory');
  }

  async createOrder(order: PetStoreOrder): Promise<AxiosResponse<PetStoreOrder>> {
    return this.http.post('/store/order', order);
  }

  async getOrderById(orderId: number): Promise<AxiosResponse<PetStoreOrder>> {
    return this.http.get(`/store/order/${orderId}`);
  }

  async deleteOrder(orderId: number): Promise<AxiosResponse<{ code: number; message: string }>> {
    return this.http.delete(`/store/order/${orderId}`);
  }

  // ── Convenience builders ──────────────────────────────────────────────────

  buildOrder(overrides: Partial<PetStoreOrder> = {}): PetStoreOrder {
    return {
      id: Math.floor(Math.random() * 90_000) + 10_000,
      petId: 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false,
      ...overrides,
    };
  }
}
