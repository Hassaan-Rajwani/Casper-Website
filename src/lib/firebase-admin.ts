import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;
let adminAuth: Auth | null = null;

function parseServiceAccountJson() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return JSON.parse(rawJson) as Record<string, unknown>;
  }

  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (rawBase64) {
    const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  }

  return null;
}

export function isServerFirestoreConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim(),
  );
}

async function getFirebaseAdminApp(): Promise<App> {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccount = parseServiceAccountJson();
  if (!serviceAccount) {
    throw new Error(
      "Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON on the server.",
    );
  }

  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return existing;
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return adminApp;
}

export async function getAdminFirestore(): Promise<Firestore> {
  if (adminFirestore) {
    return adminFirestore;
  }

  const { getFirestore } = await import("firebase-admin/firestore");
  adminFirestore = getFirestore(await getFirebaseAdminApp());
  return adminFirestore;
}

export async function getAdminAuth(): Promise<Auth> {
  if (adminAuth) {
    return adminAuth;
  }

  const { getAuth } = await import("firebase-admin/auth");
  adminAuth = getAuth(await getFirebaseAdminApp());
  return adminAuth;
}
