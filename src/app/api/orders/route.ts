import { NextResponse } from "next/server";
import { isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { normalizeOrder } from "@/lib/order-normalize";
import { sendOrderNotificationEmailServer } from "@/lib/order-email-server";
import { createOrderInFirestore } from "@/lib/orders-server";
import type { Order } from "@/lib/store-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isServerFirestoreConfigured()) {
      return NextResponse.json(
        {
          error:
            "Order storage is not configured on the server. Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel environment variables.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { order?: Partial<Order> };
    const order = normalizeOrder(body.order ?? {});

    if (!order.customerName || !order.customerEmail || !order.customerPhone) {
      return NextResponse.json({ error: "Customer details are required." }, { status: 400 });
    }

    if (!order.orderNumber || order.items.length === 0 || order.total <= 0) {
      return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
    }

    const savedOrder = await createOrderInFirestore(order);

    try {
      await sendOrderNotificationEmailServer(savedOrder);
    } catch (emailError) {
      console.error("Order notification email failed:", emailError);
    }

    return NextResponse.json({ order: savedOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
