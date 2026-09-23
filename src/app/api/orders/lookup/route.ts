import { NextResponse } from "next/server";
import { isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { getOrderByNumberFromFirestore } from "@/lib/orders-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required." }, { status: 400 });
    }

    if (!isServerFirestoreConfigured()) {
      return NextResponse.json({ error: "Order lookup is unavailable." }, { status: 503 });
    }

    const order = await getOrderByNumberFromFirestore(orderNumber);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
