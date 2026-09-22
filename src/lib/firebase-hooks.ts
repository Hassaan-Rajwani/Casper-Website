import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  addToCart,
  clearCart,
  createOrder,
  createProductReview,
  getSavedOrderContact,
  getCart,
  getOrderByNumber,
  getProduct,
  listCustomerOrders,
  listCategories,
  listProducts,
  listProductReviews,
  removeFromCart,
  updateCartItem,
} from "@/lib/firebase-store";
import type {
  Cart,
  Category,
  CheckoutForm,
  Order,
  Product,
  Review,
} from "@/lib/store-types";
import {
  cartQueryOptions,
  catalogQueryOptions,
  ordersQueryOptions,
  reviewsQueryOptions,
} from "@/lib/query-client";

export type { Cart, Category, CheckoutForm, Order, Product, Review } from "@/lib/store-types";

export const queryKeys = {
  categories: ["categories"] as const,
  products: (filters?: { category?: string; search?: string }) =>
    ["products", filters?.category ?? "", filters?.search ?? ""] as const,
  product: (productId: number) => ["product", productId] as const,
  order: (orderNumber: string) => ["order", orderNumber] as const,
  cart: ["cart"] as const,
  customerOrders: (filters?: { email?: string; phone?: string }) =>
    ["customer-orders", filters?.email ?? "", filters?.phone ?? ""] as const,
  productReviews: (productId: number) => ["product-reviews", productId] as const,
};

type MutationConfig<TData, TVariables> = {
  mutation?: UseMutationOptions<TData, Error, TVariables>;
};

export const getGetCartQueryKey = () => queryKeys.cart;
export const getCustomerOrdersQueryKey = (filters?: { email?: string; phone?: string }) =>
  queryKeys.customerOrders(filters);
export const getProductsQueryKey = (filters?: { category?: string; search?: string }) =>
  queryKeys.products(filters);
export const getProductQueryKey = (productId: number) => queryKeys.product(productId);

function getCachedProductFromList(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: number,
) {
  const cachedList = queryClient.getQueryData<Product[]>(queryKeys.products());
  return cachedList?.find((product) => product.id === productId);
}

export function prefetchCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
    ...catalogQueryOptions,
  });

  void queryClient.prefetchQuery({
    queryKey: queryKeys.products(),
    queryFn: () => listProducts(),
    ...catalogQueryOptions,
  });
}

export function useListCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
    ...catalogQueryOptions,
  });
}

export function useListProducts(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => listProducts(filters),
    ...catalogQueryOptions,
  });
}

export function useGetProduct(productId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => getProduct(productId),
    enabled: productId > 0,
    ...catalogQueryOptions,
    placeholderData: () => getCachedProductFromList(queryClient, productId),
  });
}

export function useGetOrder(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.order(orderNumber),
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: orderNumber.trim().length > 0,
    ...ordersQueryOptions,
  });
}

export function useGetCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: getCart,
    ...cartQueryOptions,
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
    enabled: Boolean(filters?.email?.trim() || filters?.phone?.trim()),
    ...ordersQueryOptions,
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

export function useListProductReviews(productId: number) {
  return useQuery({
    queryKey: queryKeys.productReviews(productId),
    queryFn: () => listProductReviews(productId),
    enabled: productId > 0,
    ...reviewsQueryOptions,
  });
}

export function getProductReviewsQueryKey(productId: number) {
  return queryKeys.productReviews(productId);
}

export function useCreateProductReview(
  options?: MutationConfig<
    Review,
    { data: { productId: number; orderNumber: string; contact: string; rating: number; comment: string } }
  >,
) {
  return useMutation({
    mutationFn: ({ data }) => createProductReview(data),
    ...options?.mutation,
  });
}
