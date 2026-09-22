import { QueryClient } from "@tanstack/react-query";

export const CACHE = {
  catalogStaleMs: 10 * 60 * 1000,
  cartStaleMs: 2 * 60 * 1000,
  ordersStaleMs: 5 * 60 * 1000,
  reviewsStaleMs: 10 * 60 * 1000,
  gcMs: 30 * 60 * 1000,
} as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: CACHE.catalogStaleMs,
        gcTime: CACHE.gcMs,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
    },
  });
}

export const catalogQueryOptions = {
  staleTime: CACHE.catalogStaleMs,
  gcTime: CACHE.gcMs,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

export const cartQueryOptions = {
  staleTime: CACHE.cartStaleMs,
  gcTime: CACHE.gcMs,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

export const ordersQueryOptions = {
  staleTime: CACHE.ordersStaleMs,
  gcTime: CACHE.gcMs,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

export const reviewsQueryOptions = {
  staleTime: CACHE.reviewsStaleMs,
  gcTime: CACHE.gcMs,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;
