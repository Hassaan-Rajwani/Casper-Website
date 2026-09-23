import { NextResponse } from "next/server";
import { isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { listCustomerOrdersFromFirestore } from "@/lib/orders-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") ?? undefined;
    const phone = searchParams.get("phone") ?? undefined;

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
    }

    if (!isServerFirestoreConfigured()) {
      return NextResponse.json({ error: "Order lookup is unavailable." }, { status: 503 });
    }

    const orders = await listCustomerOrdersFromFirestore({ email, phone });
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
