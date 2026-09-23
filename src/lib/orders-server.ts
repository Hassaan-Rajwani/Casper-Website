import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { Order } from "@/lib/store-types";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { normalizeOrder, sortOrdersDescending } from "@/lib/order-normalize";

const ORDERS_COLLECTION = "orders";

function mapFirestoreOrder(id: string, data: Record<string, unknown> | undefined): Order {
  return normalizeOrder({
    ...(data ?? {}),
    id,
  });
}

export async function createOrderInFirestore(order: Order): Promise<Order> {
  const normalizedOrder = normalizeOrder(order);
  const db = await getAdminFirestore();

  await db.collection(ORDERS_COLLECTION).doc(normalizedOrder.id).set(normalizedOrder);
  return normalizedOrder;
}

export async function listOrdersFromFirestore(): Promise<Order[]> {
  const db = await getAdminFirestore();
  const snapshot = await db.collection(ORDERS_COLLECTION).get();

  const orders = snapshot.docs.map((document: QueryDocumentSnapshot) =>
    mapFirestoreOrder(document.id, document.data() as Record<string, unknown>),
  );

  return sortOrdersDescending(orders);
}

export async function getOrderByNumberFromFirestore(orderNumber: string): Promise<Order | null> {
  const db = await getAdminFirestore();
  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where("orderNumber", "==", orderNumber.trim())
    .limit(1)
    .get();

  const document = snapshot.docs[0];
  if (!document) {
    return null;
  }

  return mapFirestoreOrder(document.id, document.data());
}

export async function listCustomerOrdersFromFirestore(filters: {
  email?: string;
  phone?: string;
}): Promise<Order[]> {
  const orders = await listOrdersFromFirestore();
  const email = filters.email?.trim().toLowerCase();
  const phone = filters.phone?.trim();

  if (!email && !phone) {
    return [];
  }

  return sortOrdersDescending(
    orders.filter(
      (order) =>
        (email ? order.customerEmail.trim().toLowerCase() === email : true) &&
        (phone ? order.customerPhone.trim() === phone : true),
    ),
  );
}

export async function updateOrderStatusInFirestore(
  id: string,
  status: Order["status"],
): Promise<Order> {
  const db = await getAdminFirestore();
  const reference = db.collection(ORDERS_COLLECTION).doc(id);
  const snapshot = await reference.get();

  if (!snapshot.exists) {
    throw new Error("Order not found");
  }

  const updatedOrder = normalizeOrder({
    ...(snapshot.data() as Record<string, unknown>),
    id,
    status,
  });

  await reference.set(updatedOrder);
  return updatedOrder;
}

export async function updateOrderInFirestore(
  id: string,
  data: Partial<Order>,
): Promise<Order> {
  const db = await getAdminFirestore();
  const reference = db.collection(ORDERS_COLLECTION).doc(id);
  const snapshot = await reference.get();

  if (!snapshot.exists) {
    throw new Error("Order not found");
  }

  const updatedOrder = normalizeOrder({
    ...(snapshot.data() as Record<string, unknown>),
    ...data,
    id,
  });

  await reference.set(updatedOrder);
  return updatedOrder;
}
