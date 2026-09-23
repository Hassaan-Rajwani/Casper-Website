import { sendMail } from "@/lib/mail-server";
import type { Order } from "@/lib/store-types";

function getStoreEmail() {
  return (
    process.env.ORDER_NOTIFICATION_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_ORDER_NOTIFICATION_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
}

function getStatusUpdateCopy(status: Order["status"]) {
  switch (status) {
    case "confirmed":
      return {
        subject: "Your Casper order is confirmed",
        headline: "Good news — your order is confirmed!",
        body: "We are preparing your items and will update you when your order is on the way.",
      };
    case "delivered":
      return {
        subject: "Your Casper order has been delivered",
        headline: "Your order has been delivered",
        body: "Thank you for shopping with Casper. We hope you enjoy your purchase.",
      };
    case "cancelled":
      return {
        subject: "Your Casper order was cancelled",
        headline: "Your order has been cancelled",
        body: "If this was unexpected or you need help, please contact our support team.",
      };
    case "pending":
      return {
        subject: "Your Casper order status was updated",
        headline: "Your order status is now pending",
        body: "We are reviewing your order and will share another update soon.",
      };
    default:
      return {
        subject: "Your Casper order status was updated",
        headline: `Your order status is now ${status}`,
        body: "Sign in to your orders page anytime to see the latest details.",
      };
  }
}

function formatOrderItems(order: Order) {
  return order.items
    .map(
      (item) =>
        `${item.productName} x${item.quantity} — Rs. ${(item.price * item.quantity).toFixed(0)}`,
    )
    .join("\n");
}

function buildPlainTextEmail(lines: string[]) {
  return lines.filter(Boolean).join("\n");
}

export async function sendOrderNotificationEmailServer(order: Order) {
  const storeEmail = getStoreEmail();
  if (!storeEmail) {
    return;
  }

  const itemsText = formatOrderItems(order);

  await sendMail({
    to: storeEmail,
    subject: `New Casper Order #${order.orderNumber}`,
    text: buildPlainTextEmail([
      "A new order was placed on the Casper website.",
      "",
      `Order Number: ${order.orderNumber}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Email: ${order.customerEmail}`,
      `Address: ${order.address}, ${order.city} ${order.postalCode}`,
      `Payment: ${order.paymentMethod.toUpperCase()}`,
      `Status: ${order.status}`,
      "",
      "Items:",
      itemsText,
      "",
      `Total: Rs. ${order.total.toFixed(0)}`,
    ]),
    replyTo: order.customerEmail,
  });
}

export async function sendOrderStatusUpdateEmailServer(order: Order) {
  const customerEmail = order.customerEmail?.trim();
  if (!customerEmail) {
    return;
  }

  const copy = getStatusUpdateCopy(order.status);
  const siteOrigin = getSiteOrigin();
  const trackOrderUrl = siteOrigin
    ? `${siteOrigin}/my-orders?orderNumber=${encodeURIComponent(order.orderNumber)}`
    : "";
  const itemsText = formatOrderItems(order);
  const storeEmail = getStoreEmail();

  await sendMail({
    to: customerEmail,
    subject: `${copy.subject} (#${order.orderNumber})`,
    text: buildPlainTextEmail([
      `Hi ${order.customerName},`,
      "",
      copy.headline,
      copy.body,
      "",
      `Order Number: ${order.orderNumber}`,
      `Status: ${order.status}`,
      `Total: Rs. ${order.total.toFixed(0)}`,
      "",
      "Items:",
      itemsText,
      "",
      trackOrderUrl
        ? `Track your order: ${trackOrderUrl}`
        : "You can view your order details on the Casper website under My Orders.",
    ]),
    replyTo: storeEmail || undefined,
  });
}
