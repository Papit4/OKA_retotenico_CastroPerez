// ─── UI Domain ───────────────────────────────────────────────────────────────

export interface User {
  username: string;
  password: string;
}

export interface Product {
  name: string;
  category: 'Phones' | 'Laptops' | 'Monitors';
}

export interface CheckoutForm {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

// ─── API Domain ───────────────────────────────────────────────────────────────

export interface PetStoreOrder {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: 'placed' | 'approved' | 'delivered';
  complete: boolean;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}
