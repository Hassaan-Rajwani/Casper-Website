import type { Order } from "@/lib/store-types";

const ORDER_NOTIFICATION_EMAIL =
  process.env.NEXT_PUBLIC_ORDER_NOTIFICATION_EMAIL ?? "caspertissue@gmail.com";

function formatOrderItems(order: Order) {
  return order.items
    .map(
      (item) =>
        `${item.productName} x${item.quantity} — Rs. ${(item.price * item.quantity).toFixed(0)}`,
    )
    .join("\n");
}

export async function sendOrderNotificationEmail(order: Order) {
  const itemsText = formatOrderItems(order);

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(ORDER_NOTIFICATION_EMAIL)}`,
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
