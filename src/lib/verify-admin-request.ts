import { getAdminAuth, isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { firebaseApiKey, isFirebaseConfigured } from "@/lib/firebase-config";

export async function verifyAdminRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    throw new Error("Admin authentication required");
  }

  if (isServerFirestoreConfigured()) {
    const decoded = await (await getAdminAuth()).verifyIdToken(token);
    return { email: decoded.email ?? "admin" };
  }

  if (!isFirebaseConfigured || !firebaseApiKey) {
    throw new Error("Firebase admin auth is not configured");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
  );

  if (!response.ok) {
    throw new Error("Invalid admin session");
  }

  const payload = (await response.json()) as {
    users?: Array<{ email?: string }>;
  };

  const email = payload.users?.[0]?.email;
  if (!email) {
    throw new Error("Invalid admin session");
  }

  return { email };
}
