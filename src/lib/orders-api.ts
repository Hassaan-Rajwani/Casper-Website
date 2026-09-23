import type { Order } from "@/lib/store-types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}

export async function saveOrderToServer(order: Order) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  return parseJsonResponse<{ order: Order }>(response);
}

export async function fetchAdminOrdersFromServer(idToken: string) {
  const response = await fetch("/api/admin/orders", {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  return parseJsonResponse<{ orders: Order[] }>(response);
}

export async function updateAdminOrderOnServer(
  idToken: string,
  id: string,
  payload: { status?: Order["status"]; data?: Partial<Order> },
) {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{ order: Order }>(response);
}

export async function fetchOrderByNumberFromServer(orderNumber: string) {
  const response = await fetch(
    `/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}`,
  );

  return parseJsonResponse<{ order: Order }>(response);
}

export async function fetchCustomerOrdersFromServer(filters: { email?: string; phone?: string }) {
  const params = new URLSearchParams();
  if (filters.email) {
    params.set("email", filters.email);
  }
  if (filters.phone) {
    params.set("phone", filters.phone);
  }

  const response = await fetch(`/api/orders/customer?${params.toString()}`);
  return parseJsonResponse<{ orders: Order[] }>(response);
}
