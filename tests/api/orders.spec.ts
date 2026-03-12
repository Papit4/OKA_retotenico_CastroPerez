import { test, expect } from '@playwright/test';
import { PetStoreClient } from '../../src/api/PetStoreClient';
import { PetStoreOrder } from '../../src/types';

/**
 * Petstore API – Order endpoints
 * Covers: inventory (GET 200), create order (POST 200), delete + verify non-existence (404).
 */
test.describe('Petstore API – Orders', () => {
  let client: PetStoreClient;

  test.beforeEach(() => {
    client = new PetStoreClient();
  });

  // ── GET inventory ─────────────────────────────────────────────────────────

  test.describe('GET /store/inventory', () => {
    test('should return HTTP 200 and a non-empty inventory map', async () => {
      const response = await client.getInventory();

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
      expect(Object.keys(response.data).length).toBeGreaterThan(0);
    });

    test('inventory values should all be non-negative numbers', async () => {
      const { data } = await client.getInventory();

      for (const [status, count] of Object.entries(data)) {
        expect(typeof count, `status "${status}" should be a number`).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── POST + GET order ──────────────────────────────────────────────────────

  test.describe('POST /store/order', () => {
    test('should create an order and return HTTP 200 with the created order', async () => {
      const payload = client.buildOrder();
      const response = await client.createOrder(payload);

      expect(response.status).toBe(200);

      const order: PetStoreOrder = response.data;
      expect(order.id).toBe(payload.id);
      expect(order.petId).toBe(payload.petId);
      expect(order.quantity).toBe(payload.quantity);
      expect(order.status).toBe(payload.status);
      expect(typeof order.complete).toBe('boolean');
    });

    test('should retrieve the created order by id (GET 200)', async () => {
      // 1 – Create
      const payload = client.buildOrder();
      await client.createOrder(payload);

      // 2 – Fetch
      const response = await client.getOrderById(payload.id);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(payload.id);
      expect(response.data.status).toBe('placed');
    });

    test('should return 404 for an order id that does not exist', async () => {
      const response = await client.getOrderById(999_999_999);

      expect(response.status).toBe(404);
    });
  });

  // ── DELETE order ──────────────────────────────────────────────────────────

  test.describe('DELETE /store/order/{orderId}', () => {
    test('should delete an existing order and confirm it no longer exists', async () => {
      // 1 – Create
      const payload = client.buildOrder();
      const created = await client.createOrder(payload);
      expect(created.status).toBe(200);

      // 2 – Delete
      const deleted = await client.deleteOrder(payload.id);
      expect(deleted.status).toBe(200);

      // 3 – Verify absence
      const fetched = await client.getOrderById(payload.id);
      expect(fetched.status).toBe(404);
    });

    test('should return 404 when deleting a non-existent order', async () => {
      const response = await client.deleteOrder(999_999_998);

      expect(response.status).toBe(404);
    });
  });

  // ── Response schema validation ─────────────────────────────────────────────

  test.describe('Response schema', () => {
    test('created order response should contain all required fields', async () => {
      const payload = client.buildOrder();
      const { data } = await client.createOrder(payload);

      const requiredFields: (keyof PetStoreOrder)[] = [
        'id', 'petId', 'quantity', 'shipDate', 'status', 'complete',
      ];
      for (const field of requiredFields) {
        expect(data, `field "${field}" should exist`).toHaveProperty(field);
      }
    });

    test('status should be one of the valid enum values', async () => {
      const payload = client.buildOrder();
      const { data } = await client.createOrder(payload);

      expect(['placed', 'approved', 'delivered']).toContain(data.status);
    });
  });
});
