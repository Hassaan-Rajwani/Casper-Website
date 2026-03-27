import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  addToCart,
  clearCart,
  createOrder,
  getSavedOrderContact,
  getCart,
  getOrderByNumber,
  getProduct,
  listCustomerOrders,
  listCategories,
  listProducts,
  removeFromCart,
  updateCartItem,
} from "@/lib/firebase-store";
import type {
  Cart,
  Category,
  CheckoutForm,
  Order,
  Product,
} from "@/lib/store-types";

export type { Cart, Category, CheckoutForm, Order, Product } from "@/lib/store-types";

const queryKeys = {
  categories: ["categories"] as const,
  products: (filters?: { category?: string; search?: string }) =>
    ["products", filters?.category ?? "", filters?.search ?? ""] as const,
  product: (productId: number) => ["product", productId] as const,
  order: (orderNumber: string) => ["order", orderNumber] as const,
  cart: ["cart"] as const,
  customerOrders: (filters?: { email?: string; phone?: string }) =>
    ["customer-orders", filters?.email ?? "", filters?.phone ?? ""] as const,
};

type MutationConfig<TData, TVariables> = {
  mutation?: UseMutationOptions<TData, Error, TVariables>;
};

export const getGetCartQueryKey = () => queryKeys.cart;
export const getCustomerOrdersQueryKey = (filters?: { email?: string; phone?: string }) =>
  queryKeys.customerOrders(filters);

export function useListCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => listCategories(),
  });
}

export function useListProducts(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => listProducts(filters),
  });
}

export function useGetProduct(productId: number) {
  return useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => getProduct(productId),
    enabled: productId > 0,
  });
}

export function useGetOrder(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.order(orderNumber),
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: orderNumber.trim().length > 0,
  });
}

export function useGetCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => getCart(),
    placeholderData: {
      items: [],
      total: 0,
      itemCount: 0,
    },
  });
}

export function useListCustomerOrders(filters?: { email?: string; phone?: string }) {
  return useQuery({
    queryKey: queryKeys.customerOrders(filters),
    queryFn: () => listCustomerOrders(filters),
  });
}

export function useAddToCart(
  options?: MutationConfig<Cart, { data: { productId: number; quantity: number } }>,
) {
  return useMutation({
    mutationFn: ({ data }) => addToCart(data.productId, data.quantity),
    ...options?.mutation,
  });
}

export function useUpdateCartItem(
  options?: MutationConfig<Cart, { productId: number; data: { quantity: number } }>,
) {
  return useMutation({
    mutationFn: ({ productId, data }) => updateCartItem(productId, data.quantity),
    ...options?.mutation,
  });
}

export function useRemoveFromCart(
  options?: MutationConfig<Cart, { productId: number }>,
) {
  return useMutation({
    mutationFn: ({ productId }) => removeFromCart(productId),
    ...options?.mutation,
  });
}

export function useClearCart(options?: MutationConfig<Cart, void>) {
  return useMutation({
    mutationFn: () => clearCart(),
    ...options?.mutation,
  });
}

export function useCreateOrder(
  options?: MutationConfig<Order, { data: CheckoutForm }>,
) {
  return useMutation({
    mutationFn: ({ data }) => createOrder(data),
    ...options?.mutation,
  });
}

export function getDefaultOrderContact() {
  return getSavedOrderContact();
}
