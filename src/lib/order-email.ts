import type { Order } from "@/lib/store-types";
import { CONTACT_EMAIL } from "@/lib/site-contact";

function getSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
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

export async function sendOrderNotificationEmail(order: Order) {
  if (!CONTACT_EMAIL) {
    return;
  }

  const itemsText = formatOrderItems(order);

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `New Casper Order #${order.orderNumber}`,
        _template: "table",
        _captcha: "false",
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        delivery_address: `${order.address}, ${order.city} ${order.postalCode}`,
        payment_method: order.paymentMethod.toUpperCase(),
        total: `Rs. ${order.total.toFixed(0)}`,
        order_status: order.status,
        order_items: itemsText,
        message: [
          "A new order was placed on the Casper website.",
          "",
          `Order Number: ${order.orderNumber}`,
          `Customer: ${order.customerName}`,
          `Phone: ${order.customerPhone}`,
          `Email: ${order.customerEmail}`,
          `Address: ${order.address}, ${order.city} ${order.postalCode}`,
          `Payment: ${order.paymentMethod.toUpperCase()}`,
          "",
          "Items:",
          itemsText,
          "",
          `Total: Rs. ${order.total.toFixed(0)}`,
        ].join("\n"),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Order notification email could not be sent.");
  }
}

export async function sendOrderStatusUpdateEmail(order: Order) {
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

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(customerEmail)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `${copy.subject} (#${order.orderNumber})`,
        _template: "table",
        _captcha: "false",
        ...(CONTACT_EMAIL ? { _replyto: CONTACT_EMAIL } : {}),
        order_number: order.orderNumber,
        customer_name: order.customerName,
        order_status: order.status,
        total: `Rs. ${order.total.toFixed(0)}`,
        order_items: itemsText,
        track_order_url: trackOrderUrl || "Visit the Casper website and open My Orders",
        message: [
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
        ].join("\n"),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Order status email could not be sent to the customer.");
  }
}
