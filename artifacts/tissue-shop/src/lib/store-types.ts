export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestseller: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: "cod" | "card";
}

export interface OrderItem {
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}
