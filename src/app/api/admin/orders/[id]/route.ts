import { NextResponse } from "next/server";
import { isServerFirestoreConfigured } from "@/lib/firebase-admin";
import { sendOrderStatusUpdateEmailServer } from "@/lib/order-email-server";
import { updateOrderInFirestore, updateOrderStatusInFirestore } from "@/lib/orders-server";
import { verifyAdminRequest } from "@/lib/verify-admin-request";
import type { Order } from "@/lib/store-types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: Order["status"];
      data?: Partial<Order>;
    };

    if (body.status) {
      const order = await updateOrderStatusInFirestore(id, body.status);

      try {
        await sendOrderStatusUpdateEmailServer(order);
      } catch (emailError) {
        console.error("Order status email failed:", emailError);
      }

      return NextResponse.json({ order });
    }

    if (body.data) {
      const order = await updateOrderInFirestore(id, body.data);
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "No update payload provided." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    const status =
      message.includes("authentication") || message.includes("session")
        ? 401
        : message.includes("not found")
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
