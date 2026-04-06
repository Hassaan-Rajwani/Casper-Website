import {
  firebaseAuthUrl,
  firestoreBaseUrl,
  isFirebaseConfigured,
} from "@/lib/firebase-config";
import {
  type AdminStats,
  type Cart,
  type Category,
  type CheckoutForm,
  type Order,
  type OrderItem,
  type Product,
} from "@/lib/store-types";

type CartRecord = { productId: number; quantity: number };
type ProductInput = Omit<Product, "id">;
type FirebaseSession = {
  email: string;
  idToken: string;
  localId: string;
  refreshToken: string;
};

const CART_SESSION_KEY = "softtouch_cart_session";
const FALLBACK_CART_KEY = "softtouch_cart_items";
const FALLBACK_ORDERS_KEY = "softtouch_orders";
const FALLBACK_PRODUCTS_KEY = "softtouch_products";
const FALLBACK_CATEGORIES_KEY = "softtouch_categories";
const FALLBACK_DELETED_CATEGORY_IDS_KEY = "softtouch_deleted_category_ids";
const LAST_ORDER_CONTACT_KEY = "softtouch_last_order_contact";
const ADMIN_SESSION_KEY = "softtouch_firebase_admin_session";
const FALLBACK_ADMIN_EMAIL = "admin@casper.com";
const FALLBACK_ADMIN_PASSWORD = "Password@1";
let firestoreUnavailable = false;

const DEFAULT_CATEGORIES: Category[] = [
  { id: "facial", name: "Facial Tissue", icon: "leaf" },
  { id: "kitchen", name: "Kitchen Rolls", icon: "leaf" },
  { id: "toilet", name: "Toilet Paper", icon: "leaf" },
  { id: "napkins", name: "Table Napkins", icon: "leaf" },
  { id: "pocket", name: "Pocket Tissue", icon: "leaf" },
];

type CartProductSnapshot = Pick<
  Product,
  | "id"
  | "name"
  | "description"
  | "price"
  | "originalPrice"
  | "imageUrl"
  | "category"
  | "stock"
  | "rating"
  | "reviewCount"
  | "isNew"
  | "isBestseller"
>;

type StoredCartRecord = CartRecord & {
  product?: CartProductSnapshot;
};

class CartError extends Error {
  code: "ALREADY_IN_CART";

  constructor(message: string) {
    super(message);
    this.name = "CartError";
    this.code = "ALREADY_IN_CART";
  }
}

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

function normalizeOrder(order: Partial<Order> & { id?: string }): Order {
  return {
    id: order.id?.trim() || `${Date.now()}`,
    orderNumber: order.orderNumber?.trim() || "N/A",
    customerName: order.customerName?.trim() || "Unknown customer",
    customerEmail: order.customerEmail?.trim() || "",
    customerPhone: order.customerPhone?.trim() || "",
    address: order.address?.trim() || "",
    city: order.city?.trim() || "",
    postalCode: order.postalCode?.trim() || "",
    paymentMethod: order.paymentMethod?.trim() || "cod",
    total: toSafeNumber(order.total),
    status: normalizeOrderStatus(order.status),
    createdAt: order.createdAt?.trim() || new Date(0).toISOString(),
    items: Array.isArray(order.items) ? order.items.map((item) => normalizeOrderItem(item)) : [],
  };
}

function isPlaceholderOrder(order: Order) {
  return (
    order.orderNumber === "N/A" &&
    order.customerName === "Unknown customer" &&
    order.total === 0 &&
    order.items.length === 0
  );
}

function getFirebaseAuthErrorMessage(code?: string) {
  switch (code) {
    case "EMAIL_NOT_FOUND":
      return "No admin account was found for this email address.";
    case "INVALID_PASSWORD":
      return "The password you entered is incorrect.";
    case "INVALID_LOGIN_CREDENTIALS":
      return "The email address or password is incorrect.";
    case "USER_DISABLED":
      return "This admin account has been disabled.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many failed login attempts. Please try again later.";
    default:
      return "Unable to sign in. Please verify your credentials and try again.";
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isMissingFirestoreDatabaseError(error: unknown) {
  const message = getErrorMessage(error);
  return (
    message.includes("The database (default) does not exist") ||
    message.includes('"status":"NOT_FOUND"')
  );
}

function shouldUseLocalFallback(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    isMissingFirestoreDatabaseError(error) ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes('"status":"unavailable"') ||
    message.includes('"status":"permission_denied"') ||
    message.includes("permission_denied") ||
    message.includes("deadline_exceeded") ||
    message.includes("firebase request failed")
  );
}

function shouldMarkFirestoreUnavailable(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    isMissingFirestoreDatabaseError(error) ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes('"status":"unavailable"') ||
    message.includes("deadline_exceeded") ||
    message.includes("firebase request failed")
  );
}

function canUseFirestore() {
  return isFirebaseConfigured && !firestoreUnavailable;
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getBrowserStorage();
  if (!storage) {
    return fallback;
  }

  const raw = storage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string) {
  getBrowserStorage()?.removeItem(key);
}

function getCartSessionId() {
  const storage = getBrowserStorage();
  if (!storage) {
    return "server-session";
  }

  const existing = storage.getItem(CART_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  storage.setItem(CART_SESSION_KEY, created);
  return created;
}

function getFallbackProducts() {
  return readJson<Product[]>(FALLBACK_PRODUCTS_KEY, []);
}

function saveFallbackProducts(products: Product[]) {
  writeJson(FALLBACK_PRODUCTS_KEY, products);
}

function normalizeCategoryRecord(category: Partial<Category> | null | undefined): Category | null {
  const id = String(category?.id ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!id) {
    return null;
  }

  return {
    id,
    name: String(category?.name ?? id).trim() || id,
    icon: String(category?.icon ?? "leaf").trim() || "leaf",
  };
}

function mergeCategories(...categorySets: Category[][]): Category[] {
  const merged = new Map<string, Category>();

  for (const categorySet of categorySets) {
    for (const category of categorySet) {
      const normalized = normalizeCategoryRecord(category);
      if (!normalized) {
        continue;
      }

      merged.set(normalized.id, normalized);
    }
  }

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function getDeletedCategoryIds() {
  return Array.from(
    new Set(
      readJson<string[]>(FALLBACK_DELETED_CATEGORY_IDS_KEY, [])
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function saveDeletedCategoryIds(ids: string[]) {
  writeJson(
    FALLBACK_DELETED_CATEGORY_IDS_KEY,
    Array.from(new Set(ids.map((item) => String(item).trim().toLowerCase()).filter(Boolean))),
  );
}

function filterVisibleCategories(categories: Category[]) {
  const deletedIds = new Set(getDeletedCategoryIds());
  return categories.filter((category) => !deletedIds.has(category.id));
}

function getFallbackCategories() {
  return filterVisibleCategories(
    mergeCategories(DEFAULT_CATEGORIES, readJson<Category[]>(FALLBACK_CATEGORIES_KEY, [])),
  );
}

function saveFallbackCategories(categories: Category[]) {
  writeJson(FALLBACK_CATEGORIES_KEY, mergeCategories(categories));
}

function getFallbackOrders() {
  return readJson<Order[]>(FALLBACK_ORDERS_KEY, []).map((order) => normalizeOrder(order));
}

function getMeaningfulFallbackOrders() {
  return getFallbackOrders().filter((order) => !isPlaceholderOrder(order));
}

function saveFallbackOrders(orders: Order[]) {
  writeJson(
    FALLBACK_ORDERS_KEY,
    orders.map((order) => normalizeOrder(order)),
  );
}

function saveOrderToFallback(order: Order) {
  const orders = getFallbackOrders();
  const normalizedOrder = normalizeOrder(order);
  const nextOrders = [
    normalizedOrder,
    ...orders.filter((existing) => existing.id !== normalizedOrder.id),
  ];
  saveFallbackOrders(sortOrdersDescending(nextOrders));
}

function getLastOrderContact() {
  return readJson<{ email: string; phone: string } | null>(LAST_ORDER_CONTACT_KEY, null);
}

function setLastOrderContact(email: string, phone: string) {
  writeJson(LAST_ORDER_CONTACT_KEY, {
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
  });
}

function getAdminSession() {
  return readJson<FirebaseSession | null>(ADMIN_SESSION_KEY, null);
}

function setAdminSession(session: FirebaseSession) {
  writeJson(ADMIN_SESSION_KEY, session);
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }

  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "number":
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    case "boolean":
      return { booleanValue: value };
    case "object":
      return {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, inner]) => [
              key,
              toFirestoreValue(inner),
            ]),
          ),
        },
      };
    default:
      return { stringValue: String(value) };
  }
}

function fromFirestoreValue(value: Record<string, any>): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return String(value.timestampValue);
  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map((item: Record<string, any>) =>
      fromFirestoreValue(item),
    );
  }
  if ("mapValue" in value) {
    const fields = value.mapValue.fields ?? {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, inner]) => [
        key,
        fromFirestoreValue(inner as Record<string, any>),
      ]),
    );
  }
  return null;
}

function encodeDocument(data: Record<string, unknown>) {
  return {
    fields: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]),
    ),
  };
}

function decodeDocument<T>(document: Record<string, any>): T {
  const fields = document.fields ?? {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      fromFirestoreValue(value as Record<string, any>),
    ]),
  ) as T;
}

function getDocumentId(name: string) {
  return name.split("/").pop() ?? name;
}

async function firebaseFetch<T>(
  path: string,
  options?: RequestInit & { authRequired?: boolean },
): Promise<T> {
  if (!firestoreBaseUrl) {
    throw new Error("Firebase is not configured");
  }

  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  if (options?.authRequired) {
    const session = getAdminSession();
    if (!session?.idToken) {
      throw new Error("Admin auth required");
    }
    headers.set("Authorization", `Bearer ${session.idToken}`);
  }

  const response = await fetch(`${firestoreBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 404 && message.includes("The database (default) does not exist")) {
      firestoreUnavailable = true;
    }
    throw new Error(message || "Firebase request failed");
  }

  return (await response.json()) as T;
}

function mapProductRecord(id: string, data: Record<string, unknown>): Product {
  return {
    id: Number(id),
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    originalPrice:
      data.originalPrice === null || data.originalPrice === undefined
        ? null
        : Number(data.originalPrice),
    imageUrl: String(data.imageUrl ?? ""),
    category: String(data.category ?? ""),
    stock: Number(data.stock ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    isNew: Boolean(data.isNew),
    isBestseller: Boolean(data.isBestseller),
  };
}

function createProductSnapshot(product: Product): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    category: product.category,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
  };
}

function mapStoredCartRecord(record: StoredCartRecord): CartRecord {
  return {
    productId: Number(record.productId),
    quantity: Number(record.quantity),
  };
}

function normalizeStoredCartRecords(records: StoredCartRecord[]): StoredCartRecord[] {
  return records
    .map((record) => ({
      productId: Number(record.productId),
      quantity: Math.max(1, Math.floor(Number(record.quantity) || 0)),
      product:
        record.product && typeof record.product === "object"
          ? ({
            ...record.product,
            id: Number(record.product.id ?? record.productId),
            price: Number(record.product.price ?? 0),
            originalPrice:
              record.product.originalPrice === null || record.product.originalPrice === undefined
                ? null
                : Number(record.product.originalPrice),
            stock: Number(record.product.stock ?? 0),
            rating: Number(record.product.rating ?? 0),
            reviewCount: Number(record.product.reviewCount ?? 0),
            isNew: Boolean(record.product.isNew),
            isBestseller: Boolean(record.product.isBestseller),
          } as CartProductSnapshot)
          : undefined,
    }))
    .filter((record) => record.productId > 0 && record.quantity > 0);
}

function getFallbackCartRecords() {
  return normalizeStoredCartRecords(readJson<StoredCartRecord[]>(FALLBACK_CART_KEY, []));
}

function saveFallbackCartRecords(items: StoredCartRecord[]) {
  writeJson(FALLBACK_CART_KEY, normalizeStoredCartRecords(items));
}

function upsertFallbackProduct(product: Product) {
  const products = getFallbackProducts();
  const nextProducts = products.some((item) => item.id === product.id)
    ? products.map((item) => (item.id === product.id ? product : item))
    : [...products, product];
  saveFallbackProducts(nextProducts);
}

function buildCart(items: Array<{ product: Product; quantity: number }>): Cart {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ST-${timestamp}-${random}`;
}

async function listCollection<T>(
  collectionName: string,
  authRequired = false,
): Promise<Array<{ id: string; data: T }>> {
  const response = await firebaseFetch<{ documents?: Record<string, any>[] }>(
    `/${collectionName}`,
    { authRequired },
  );
  return (response.documents ?? []).map((document) => ({
    id: getDocumentId(String(document.name ?? "")),
    data: decodeDocument<T>(document),
  }));
}

async function getCollectionDocument<T>(
  collectionName: string,
  id: string,
  authRequired = false,
): Promise<T | null> {
  try {
    const response = await firebaseFetch<Record<string, any>>(`/${collectionName}/${id}`, {
      authRequired,
    });
    return decodeDocument<T>(response);
  } catch {
    return null;
  }
}

async function upsertCollectionDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  authRequired = false,
) {
  await firebaseFetch(
    `/${collectionName}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(encodeDocument(data)),
      authRequired,
    },
  );
}

async function deleteCollectionDocument(
  collectionName: string,
  id: string,
  authRequired = false,
) {
  await firebaseFetch(`/${collectionName}/${id}`, {
    method: "DELETE",
    authRequired,
  });
}

async function getCartRecords(): Promise<CartRecord[]> {
  const fallbackItems = getFallbackCartRecords().map(mapStoredCartRecord);

  if (!canUseFirestore()) {
    return fallbackItems;
  }

  try {
    const sessionId = getCartSessionId();
    const cart = await getCollectionDocument<{ items?: CartRecord[] }>("carts", sessionId);
    const firestoreItems = cart?.items ?? [];

    if (firestoreItems.length === 0 && fallbackItems.length > 0) {
      await upsertCollectionDocument("carts", sessionId, {
        items: fallbackItems,
        updatedAt: new Date().toISOString(),
      });
      return fallbackItems;
    }

    return firestoreItems;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
      }
      return fallbackItems;
    }

    throw error;
  }
}

async function saveCartRecords(items: CartRecord[]) {
  const existingFallbackRecords = getFallbackCartRecords();
  const fallbackItemsWithSnapshots = items.map((item) => ({
    ...item,
    product:
      existingFallbackRecords.find((record) => record.productId === item.productId)?.product,
  }));

  if (!canUseFirestore()) {
    saveFallbackCartRecords(fallbackItemsWithSnapshots);
    return;
  }

  try {
    await upsertCollectionDocument("carts", getCartSessionId(), {
      items,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
      }
      saveFallbackCartRecords(fallbackItemsWithSnapshots);
      return;
    }

    throw error;
  }
}

export async function listCategories(): Promise<Category[]> {
  if (!canUseFirestore()) {
    return getFallbackCategories();
  }

  try {
    const categories = await listCollection<Category>("categories");
    const mappedCategories = categories.map((item) => ({
      id: item.id,
      name: item.data.name || item.id,
      icon: item.data.icon || "leaf",
    }));
    const mergedCategories = mergeCategories(DEFAULT_CATEGORIES, mappedCategories);
    saveFallbackCategories(mergedCategories);
    return mergedCategories;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
      }
      return getFallbackCategories();
    }

    throw error;
  }
}

export async function listProducts(filters?: {
  category?: string;
  search?: string;
}): Promise<Product[]> {
  const category = filters?.category?.trim();
  const search = filters?.search?.trim().toLowerCase();

  let products: Product[];
  if (!canUseFirestore()) {
    products = getFallbackProducts();
  } else {
    try {
      products = (await listCollection<Record<string, unknown>>("products")).map((item) =>
        mapProductRecord(item.id, item.data),
      );
      saveFallbackProducts(products);
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        if (shouldMarkFirestoreUnavailable(error)) {
          firestoreUnavailable = true;
        }
        products = getFallbackProducts();
      } else {
        throw error;
      }
    }
  }

  return products.filter((product) => {
    if (category && category !== "all" && product.category !== category) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search)
    );
  });
}

export async function getProduct(productId: number): Promise<Product | null> {
  if (!canUseFirestore()) {
    return getFallbackProducts().find((product) => product.id === productId) ?? null;
  }

  try {
    const product = await getCollectionDocument<Record<string, unknown>>(
      "products",
      String(productId),
    );
    if (!product) {
      return getFallbackProducts().find((item) => item.id === productId) ?? null;
    }

    const mappedProduct = mapProductRecord(String(productId), product);
    upsertFallbackProduct(mappedProduct);

    return mappedProduct;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      const fallbackProduct = getFallbackProducts().find((product) => product.id === productId);
      if (fallbackProduct) {
        return fallbackProduct;
      }

      const products = await listProducts();
      const matchedProduct = products.find((product) => product.id === productId) ?? null;
      if (matchedProduct) {
        upsertFallbackProduct(matchedProduct);
        return matchedProduct;
      }

      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
      }
      return null;
    }

    throw error;
  }
}

export async function getCart(): Promise<Cart> {
  const records = await getCartRecords();
  const storedRecords = getFallbackCartRecords();
  const storedRecordsByProductId = new Map(
    storedRecords.map((record) => [record.productId, record]),
  );
  if (records.length === 0) {
    return buildCart([]);
  }

  const items = await Promise.all(
    records.map(async (item) => {
      const product = await getProduct(item.productId);
      if (product) {
        upsertFallbackProduct(product);
        return { product, quantity: item.quantity };
      }

      const fallbackProduct = storedRecordsByProductId.get(item.productId)?.product;
      return fallbackProduct ? { product: fallbackProduct, quantity: item.quantity } : null;
    }),
  );

  return buildCart(
    items.filter((item): item is { product: Product; quantity: number } => Boolean(item)),
  );
}

export async function addToCart(productId: number, quantity: number) {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const product = await getProduct(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const items = await getCartRecords();
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    throw new CartError("This product is already in your cart.");
  }

  items.push({ productId, quantity: Math.min(product.stock, safeQuantity) });

  saveFallbackCartRecords(
    items.map((item) => ({
      ...item,
      product: item.productId === productId ? createProductSnapshot(product) : undefined,
    })),
  );
  upsertFallbackProduct(product);
  await saveCartRecords(items);
  return getCart();
}

export async function updateCartItem(productId: number, quantity: number) {
  const product = await getProduct(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const safeQuantity = Math.max(1, Math.min(product.stock, Math.floor(quantity)));
  const items = await getCartRecords();
  const nextItems = items.map((item) =>
    item.productId === productId ? { ...item, quantity: safeQuantity } : item,
  );
  saveFallbackCartRecords(
    nextItems.map((item) => ({
      ...item,
      product: item.productId === productId ? createProductSnapshot(product) : undefined,
    })),
  );
  upsertFallbackProduct(product);
  await saveCartRecords(nextItems);
  return getCart();
}

export async function removeFromCart(productId: number) {
  const items = await getCartRecords();
  const nextItems = items.filter((item) => item.productId !== productId);
  saveFallbackCartRecords(nextItems);
  await saveCartRecords(nextItems);
  return getCart();
}

export async function clearCart() {
  saveFallbackCartRecords([]);
  await saveCartRecords([]);
  return buildCart([]);
}

export async function createOrder(form: CheckoutForm): Promise<Order> {
  const cart = await getCart();
  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const order: Order = {
    id: `${Date.now()}`,
    orderNumber: generateOrderNumber(),
    customerName: form.customerName,
    customerEmail: form.customerEmail,
    customerPhone: form.customerPhone,
    address: form.address,
    city: form.city,
    postalCode: form.postalCode,
    paymentMethod: form.paymentMethod,
    total: cart.total,
    status: "pending",
    createdAt: new Date().toISOString(),
    items: cart.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImageUrl: item.product.imageUrl,
      quantity: item.quantity,
      price: item.product.price,
    })),
  };
  setLastOrderContact(form.customerEmail, form.customerPhone);
  saveOrderToFallback(order);

  if (!canUseFirestore()) {
    await clearCart();
    return order;
  }

  try {
    await upsertCollectionDocument("orders", order.id, order as unknown as Record<string, unknown>);
    await clearCart();
    return order;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
      }
      await clearCart();
      return order;
    }

    throw error;
  }
}

function sortOrdersDescending(orders: Order[]) {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergeOrders(...orderSets: Order[][]) {
  const merged = new Map<string, Order>();

  for (const orders of orderSets) {
    for (const order of orders) {
      const normalizedOrder = normalizeOrder(order);
      const key =
        normalizedOrder.orderNumber && normalizedOrder.orderNumber !== "N/A"
          ? normalizedOrder.orderNumber
          : normalizedOrder.id;
      const existing = merged.get(key);

      if (!existing || existing.createdAt < normalizedOrder.createdAt) {
        merged.set(key, normalizedOrder);
      }
    }
  }

  return sortOrdersDescending(Array.from(merged.values()));
}

function filterOrdersByContact(
  orders: Order[],
  filters?: { email?: string; phone?: string },
) {
  const email = filters?.email?.trim().toLowerCase();
  const phone = filters?.phone?.trim();

  if (!email && !phone) {
    return sortOrdersDescending(orders);
  }

  return sortOrdersDescending(
    orders.filter(
      (order) =>
        (email ? order.customerEmail.trim().toLowerCase() === email : true) &&
        (phone ? order.customerPhone.trim() === phone : true),
    ),
  );
}

export async function listCustomerOrders(filters?: {
  email?: string;
  phone?: string;
}): Promise<Order[]> {
  if (!canUseFirestore()) {
    return filterOrdersByContact(getFallbackOrders(), filters);
  }

  try {
    const orders = await listCollection<Order>("orders");
    const mappedOrders = orders.map((item) => normalizeOrder({ ...item.data, id: item.id }));
    const mergedOrders = mergeOrders(mappedOrders, getMeaningfulFallbackOrders());
    saveFallbackOrders(mergedOrders);
    return filterOrdersByContact(mergedOrders, filters);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      return filterOrdersByContact(getFallbackOrders(), filters);
    }

    throw error;
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const normalizedOrderNumber = orderNumber.trim();
  if (!normalizedOrderNumber) {
    return null;
  }

  const matchOrder = (orders: Order[]) =>
    orders.find((order) => order.orderNumber === normalizedOrderNumber) ?? null;

  if (!canUseFirestore()) {
    return matchOrder(getFallbackOrders());
  }

  try {
    const orders = await listCollection<Order>("orders");
    const mappedOrders = orders.map((item) => normalizeOrder({ ...item.data, id: item.id }));
    const mergedOrders = mergeOrders(mappedOrders, getMeaningfulFallbackOrders());
    saveFallbackOrders(mergedOrders);
    return matchOrder(mergedOrders);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      return matchOrder(getFallbackOrders());
    }

    throw error;
  }
}

export async function listAdminProducts() {
  if (!canUseFirestore()) {
    return getFallbackProducts();
  }

  try {
    const products = (await listCollection<Record<string, unknown>>("products", true)).map((item) =>
      mapProductRecord(item.id, item.data),
    );
    saveFallbackProducts(products);
    return products;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
        return getFallbackProducts();
      }

      try {
        const products = (await listCollection<Record<string, unknown>>("products")).map((item) =>
          mapProductRecord(item.id, item.data),
        );
        saveFallbackProducts(products);
        return products;
      } catch (fallbackReadError) {
        if (shouldUseLocalFallback(fallbackReadError)) {
          if (shouldMarkFirestoreUnavailable(fallbackReadError)) {
            firestoreUnavailable = true;
          }
          return getFallbackProducts();
        }

        throw fallbackReadError;
      }
    }

    throw error;
  }
}

export async function createAdminCategory(data: Omit<Category, "id"> & { id?: string }) {
  const normalizedCategory = normalizeCategoryRecord({
    id: data.id ?? data.name,
    name: data.name,
    icon: data.icon,
  });

  if (!normalizedCategory) {
    throw new Error("Category name is required");
  }

  const persistFallback = () => {
    saveDeletedCategoryIds(
      getDeletedCategoryIds().filter((categoryId) => categoryId !== normalizedCategory.id),
    );
    const nextCategories = mergeCategories(getFallbackCategories(), [normalizedCategory]);
    saveFallbackCategories(nextCategories);
    return normalizedCategory;
  };

  if (!canUseFirestore()) {
    return persistFallback();
  }

  try {
    await upsertCollectionDocument(
      "categories",
      normalizedCategory.id,
      normalizedCategory as unknown as Record<string, unknown>,
      true,
    );
    persistFallback();
    return normalizedCategory;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      return persistFallback();
    }

    throw error;
  }
}

export async function deleteAdminCategory(id: string) {
  const normalizedId = String(id).trim().toLowerCase();
  if (!normalizedId) {
    throw new Error("Category not found");
  }

  const persistFallback = () => {
    saveFallbackCategories(getFallbackCategories().filter((category) => category.id !== normalizedId));
    saveDeletedCategoryIds([...getDeletedCategoryIds(), normalizedId]);
  };

  if (!canUseFirestore()) {
    persistFallback();
    return;
  }

  try {
    await deleteCollectionDocument("categories", normalizedId, true);
    persistFallback();
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      persistFallback();
      return;
    }

    throw error;
  }
}

export async function listAdminOrders(): Promise<Order[]> {
  if (!canUseFirestore()) {
    return sortOrdersDescending(getFallbackOrders());
  }

  try {
    const orders = await listCollection<Order>("orders", true);
    const mappedOrders = orders.map((item) => normalizeOrder({ ...item.data, id: item.id }));
    const mergedOrders = mergeOrders(mappedOrders, getMeaningfulFallbackOrders());
    saveFallbackOrders(mergedOrders);
    return mergedOrders;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      if (shouldMarkFirestoreUnavailable(error)) {
        firestoreUnavailable = true;
        return sortOrdersDescending(getFallbackOrders());
      }

      try {
        const orders = await listCollection<Order>("orders");
        const mappedOrders = orders.map((item) => normalizeOrder({ ...item.data, id: item.id }));
        const mergedOrders = mergeOrders(mappedOrders, getMeaningfulFallbackOrders());
        saveFallbackOrders(mergedOrders);
        return mergedOrders;
      } catch (fallbackReadError) {
        if (shouldUseLocalFallback(fallbackReadError)) {
          if (shouldMarkFirestoreUnavailable(fallbackReadError)) {
            firestoreUnavailable = true;
          }
          return sortOrdersDescending(getFallbackOrders());
        }

        throw fallbackReadError;
      }
    }

    throw error;
  }
}

export async function updateAdminOrderStatus(id: string, status: Order["status"]) {
  const updateFallbackOrder = () => {
    const orders = getFallbackOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) {
      throw new Error("Order not found");
    }

    const updatedOrder = { ...orders[index], status };
    orders[index] = updatedOrder;
    saveFallbackOrders(sortOrdersDescending(orders));
    return updatedOrder;
  };
  const fallbackOrder = getFallbackOrders().find((order) => order.id === id) ?? null;

  if (!canUseFirestore()) {
    return updateFallbackOrder();
  }

  try {
    const firestoreOrder = await getCollectionDocument<Order>("orders", id, true);
    const baseOrder = normalizeOrder({
      ...(fallbackOrder ?? {}),
      ...(firestoreOrder ?? {}),
      id,
    });
    const updatedOrder = {
      ...baseOrder,
      status,
    };

    await upsertCollectionDocument(
      "orders",
      id,
      updatedOrder as unknown as Record<string, unknown>,
      true,
    );

    saveOrderToFallback(updatedOrder);
    return updatedOrder;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      return updateFallbackOrder();
    }

    throw error;
  }
}

export async function updateAdminOrder(
  id: string,
  data: Partial<
    Pick<
      Order,
      | "orderNumber"
      | "customerName"
      | "customerEmail"
      | "customerPhone"
      | "address"
      | "city"
      | "postalCode"
      | "paymentMethod"
      | "total"
      | "createdAt"
    >
  >,
) {
  const updateFallbackOrder = () => {
    const orders = getFallbackOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) {
      throw new Error("Order not found");
    }

    const updatedOrder = normalizeOrder({
      ...orders[index],
      ...data,
      id,
    });
    orders[index] = updatedOrder;
    saveFallbackOrders(sortOrdersDescending(orders));
    return updatedOrder;
  };
  const fallbackOrder = getFallbackOrders().find((order) => order.id === id) ?? null;

  if (!canUseFirestore()) {
    return updateFallbackOrder();
  }

  try {
    const firestoreOrder = await getCollectionDocument<Order>("orders", id, true);
    const updatedOrder = normalizeOrder({
      ...(fallbackOrder ?? {}),
      ...(firestoreOrder ?? {}),
      ...data,
      id,
    });

    await upsertCollectionDocument(
      "orders",
      id,
      updatedOrder as unknown as Record<string, unknown>,
      true,
    );
    saveOrderToFallback(updatedOrder);
    return updatedOrder;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      return updateFallbackOrder();
    }

    throw error;
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const [products, orders] = await Promise.all([listAdminProducts(), listAdminOrders()]);
  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue:
      Math.round(orders.reduce((sum, order) => sum + toSafeNumber(order.total), 0) * 100) / 100,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
  };
}

export async function createAdminProduct(data: ProductInput) {
  if (!canUseFirestore()) {
    const products = getFallbackProducts();
    const nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
    const product = { id: nextId, ...data };
    products.push(product);
    saveFallbackProducts(products);
    return product;
  }

  try {
    const products = await listAdminProducts();
    const nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
    await upsertCollectionDocument("products", String(nextId), data, true);
    const product = { id: nextId, ...data };
    upsertFallbackProduct(product);
    return product;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      const products = getFallbackProducts();
      const nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
      const product = { id: nextId, ...data };
      products.push(product);
      saveFallbackProducts(products);
      return product;
    }

    throw error;
  }
}

export async function updateAdminProduct(id: number, data: Partial<ProductInput>) {
  if (!canUseFirestore()) {
    const products = getFallbackProducts();
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error("Product not found");
    }

    products[index] = { ...products[index], ...data };
    saveFallbackProducts(products);
    return products[index];
  }

  try {
    await upsertCollectionDocument("products", String(id), data as Record<string, unknown>, true);
    const product = await getCollectionDocument<Record<string, unknown>>("products", String(id), true);
    const mappedProduct = product ? mapProductRecord(String(id), product) : null;
    if (mappedProduct) {
      upsertFallbackProduct(mappedProduct);
    }
    return mappedProduct;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      const products = getFallbackProducts();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }

      products[index] = { ...products[index], ...data };
      saveFallbackProducts(products);
      return products[index];
    }

    throw error;
  }
}

export async function deleteAdminProduct(id: number) {
  if (!canUseFirestore()) {
    saveFallbackProducts(getFallbackProducts().filter((product) => product.id !== id));
    return;
  }

  try {
    await deleteCollectionDocument("products", String(id), true);
    saveFallbackProducts(getFallbackProducts().filter((product) => product.id !== id));
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      firestoreUnavailable = true;
      saveFallbackProducts(getFallbackProducts().filter((product) => product.id !== id));
      return;
    }

    throw error;
  }
}

export async function loginAdmin(email: string, password: string) {
  if (!isFirebaseConfigured || !firebaseAuthUrl) {
    const fallbackEmail = import.meta.env.VITE_ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL;
    const fallbackPassword =
      import.meta.env.VITE_ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD;

    if (email !== fallbackEmail || password !== fallbackPassword) {
      throw new Error("Invalid credentials");
    }

    return;
  }

  const response = await fetch(firebaseAuthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(getFirebaseAuthErrorMessage(errorPayload?.error?.message));
  }

  const data = (await response.json()) as {
    email: string;
    idToken: string;
    localId: string;
    refreshToken: string;
  };
  setAdminSession(data);
}

export async function logoutAdmin() {
  removeKey(ADMIN_SESSION_KEY);
}

export function getCurrentAdminUser() {
  const session = getAdminSession();
  return session ? { email: session.email } : null;
}

export function getSavedOrderContact() {
  return getLastOrderContact();
}
