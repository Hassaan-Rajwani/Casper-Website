import { NextResponse } from "next/server";
import { isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { listOrdersFromFirestore } from "@/lib/orders-server";
import { verifyAdminRequest } from "@/lib/verify-admin-request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);

    if (!isServerFirestoreConfigured()) {
      return NextResponse.json(
        {
          error:
            "Order storage is not configured on the server. Set FIREBASE_SERVICE_ACCOUNT_JSON in Netlify.",
        },
        { status: 503 },
      );
    }

    const orders = await listOrdersFromFirestore();
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    const status = message.includes("authentication") || message.includes("session") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
