export type DeliveryType = 'delivery' | 'pickup' | 'proba';
export type DeliverySpeed = 'today' | 'tomorrow' | 'scheduled';
export type PaymentMethod = 'click' | 'payme' | 'visa' | 'mastercard' | 'humo' | 'uzcard';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'proba_scheduled'
  | 'returned'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  sellerBrand: string;
  color: string;
  colorHex: string;
  size: string;
  priceUsd: number;
  quantity: number;
  availableColors: Array<{ color: string; colorHex: string; variantId: string }>;
  availableSizes: Array<{ size: string; variantId: string; inStock: boolean }>;
}

export interface Cart {
  items: CartItem[];
  subtotalUsd: number;
  itemCount: number;
}

export interface DeliveryAddress {
  id: string;
  city: string;
  district: string;
  street: string;
  building: string;
  apartment?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryOption {
  type: DeliveryType;
  speed?: DeliverySpeed;
  feeUsd: number;
  estimatedTime?: string;
}

export interface CheckoutRequest {
  items: Array<{ variantId: string; quantity: number }>;
  deliveryType: DeliveryType;
  deliverySpeed?: DeliverySpeed;
  scheduledAt?: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  comment?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  deliveryType: DeliveryType;
  deliverySpeed?: DeliverySpeed;
  scheduledAt?: string;
  address: DeliveryAddress;
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  comment?: string;
}
