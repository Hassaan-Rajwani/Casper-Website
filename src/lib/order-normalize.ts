import type { Order, OrderItem } from "@/lib/store-types";

function toSafeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeOrderItem(item: Partial<OrderItem> | null | undefined): OrderItem {
  return {
    productId: toSafeNumber(item?.productId),
    productName: item?.productName?.trim() || "Unnamed product",
    productImageUrl: item?.productImageUrl?.trim() || undefined,
    quantity: Math.max(1, Math.floor(toSafeNumber(item?.quantity, 1))),
    price: toSafeNumber(item?.price),
  };
}

function normalizeOrderStatus(status: unknown) {
  const normalized = String(status ?? "pending").trim().toLowerCase();

  if (normalized === "canceled") {
    return "cancelled";
  }

  if (["pending", "confirmed", "delivered", "cancelled"].includes(normalized)) {
    return normalized;
  }

  return "pending";
}

export function normalizeOrder(order: Partial<Order> & { id?: string }): Order {
  return {
    id: order.id?.trim() || `${Date.now()}`,
    orderNumber: order.orderNumber?.trim() || "",
    customerName: order.customerName?.trim() || "",
    customerEmail: order.customerEmail?.trim() || "",
    customerPhone: order.customerPhone?.trim() || "",
    address: order.address?.trim() || "",
    city: order.city?.trim() || "",
    postalCode: order.postalCode?.trim() || "",
    paymentMethod: order.paymentMethod?.trim() || "cod",
    total: toSafeNumber(order.total),
    status: normalizeOrderStatus(order.status),
    createdAt: order.createdAt?.trim() || new Date().toISOString(),
    items: Array.isArray(order.items) ? order.items.map((item) => normalizeOrderItem(item)) : [],
  };
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ST-${timestamp}-${random}`;
}

export function sortOrdersDescending(orders: Order[]) {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
