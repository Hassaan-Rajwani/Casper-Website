import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { PackageSearch, Search, ShoppingBag, ShieldCheck } from "lucide-react";
import {
  getDefaultOrderContact,
  useGetOrder,
  useListCustomerOrders,
} from "@/lib/firebase-hooks";
import type { Order } from "@/lib/firebase-hooks";
import { Spinner } from "@/components/ui/spinner";

function getOrderStatusBadgeClass(status: string) {
  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  if (status === "delivered") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "confirmed") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function renderOrderCard(order: Order) {
  return (
    <div key={order.id} className="bg-card rounded-2xl border border-border p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Order Number</p>
          <h2 className="text-lg font-semibold text-foreground">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getOrderStatusBadgeClass(order.status)}`}>
            {order.status}
          </span>
          <p className="text-lg font-bold text-foreground">Rs. {order.total.toFixed(0)}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        {order.items.map((item) => (
          <div
            key={`${order.id}-${item.productId}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/40 border border-border shrink-0">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-muted-foreground">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="font-semibold text-foreground">
              Rs. {(item.price * item.quantity).toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const searchString = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const requestedOrderNumber = searchParams.get("orderNumber")?.trim() ?? "";
  const defaultContact = useMemo(() => getDefaultOrderContact(), []);
  const recentFilters = useMemo(
    () => ({
      email: defaultContact?.email ?? "",
      phone: defaultContact?.phone ?? "",
    }),
    [defaultContact],
  );

  const [orderNumberInput, setOrderNumberInput] = useState(requestedOrderNumber);
  const [contactInput, setContactInput] = useState(defaultContact?.phone || defaultContact?.email || "");
  const [submittedTracking, setSubmittedTracking] = useState<{
    orderNumber: string;
    contact: string;
  } | null>(
    requestedOrderNumber
      ? {
        orderNumber: requestedOrderNumber,
        contact: defaultContact?.phone || defaultContact?.email || "",
      }
      : null,
  );

  useEffect(() => {
    if (!requestedOrderNumber) {
      return;
    }

    setOrderNumberInput(requestedOrderNumber);
    setSubmittedTracking((current) =>
      current?.orderNumber === requestedOrderNumber
        ? current
        : {
          orderNumber: requestedOrderNumber,
          contact: current?.contact || defaultContact?.phone || defaultContact?.email || "",
        },
    );
  }, [defaultContact?.email, defaultContact?.phone, requestedOrderNumber]);

  const trackingOrderNumber = submittedTracking?.orderNumber ?? "";
  const trackingContact = submittedTracking?.contact ?? "";
  const { data: trackedOrder, isLoading: isTrackingOrder } = useGetOrder(trackingOrderNumber);
  const { data: recentOrders = [], isLoading: isLoadingRecentOrders, isFetching: isRefreshingRecentOrders } =
    useListCustomerOrders(recentFilters);

  const trackingMatchedOrder = useMemo(() => {
    if (!trackedOrder || !trackingContact) {
      return null;
    }

    const normalizedContact = normalizeValue(trackingContact);
    const matchesEmail = normalizeValue(trackedOrder.customerEmail) === normalizedContact;
    const matchesPhone = normalizeValue(trackedOrder.customerPhone) === normalizedContact;

    return matchesEmail || matchesPhone ? trackedOrder : null;
  }, [trackedOrder, trackingContact]);

  const trackingError = useMemo(() => {
    if (!submittedTracking) {
      return "";
    }

    if (!trackingContact) {
      return "Please enter the same phone number or email used at checkout.";
    }

    if (!trackedOrder) {
      return isTrackingOrder ? "" : "No order was found with that Order ID.";
    }

    if (!trackingMatchedOrder) {
      return "Order found, but the phone number or email does not match this order.";
    }

    return "";
  }, [isTrackingOrder, submittedTracking, trackedOrder, trackingContact, trackingMatchedOrder]);

  const hasSavedContact = Boolean(recentFilters.email || recentFilters.phone);

  const handleTrackOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedTracking({
      orderNumber: orderNumberInput.trim(),
      contact: contactInput.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col gap-3 mb-8">
        <h1 className="text-3xl font-bold text-foreground">Track My Order</h1>
        <p className="text-muted-foreground">
          Enter your order ID with the same phone number or email you used at checkout.
        </p>
      </div>

      <div className="grid gap-6">
        <section className="bg-card rounded-2xl border border-border p-6 md:p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Track by Order ID</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This works without login. Use the exact order number from your confirmation page or message.
              </p>
            </div>
          </div>

          <form onSubmit={handleTrackOrder} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Order ID</label>
              <input
                value={orderNumberInput}
                onChange={(event) => setOrderNumberInput(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="ST-ABC123-XY9Z"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number or Email</label>
              <input
                value={contactInput}
                onChange={(event) => setContactInput(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="03128513901 or name@example.com"
              />
            </div>

            <button
              type="submit"
              className="md:self-end px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Track Order
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              For privacy, order details are shown only when the order ID matches the same phone number or email used during checkout.
            </span>
          </div>

          <div className="mt-6">
            {isTrackingOrder ? (
              <div className="rounded-2xl border border-border bg-muted/20 p-8 flex items-center justify-center gap-3 text-muted-foreground">
                <Spinner className="w-5 h-5" />
                Looking up your order...
              </div>
            ) : trackingMatchedOrder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">1 matching order found</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getOrderStatusBadgeClass(trackingMatchedOrder.status)}`}>
                    {trackingMatchedOrder.status}
                  </span>
                </div>
                {renderOrderCard(trackingMatchedOrder)}
              </div>
            ) : submittedTracking ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <PackageSearch className="w-12 h-12 text-primary/70 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Unable to verify this order</h3>
                <p className="text-muted-foreground max-w-xl mx-auto">{trackingError}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border p-6 md:p-7">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Orders on This Device</h2>
            <p className="text-sm text-muted-foreground">
              If you recently placed an order from this browser, we can also show it automatically using your saved checkout contact.
            </p>
          </div>

          {isLoadingRecentOrders ? (
            <div className="rounded-2xl border border-border p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="w-5 h-5" />
              Loading your recent orders...
            </div>
          ) : !hasSavedContact ? (
            <div className="rounded-2xl border border-border p-10 text-center">
              <PackageSearch className="w-12 h-12 text-primary/70 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No recent order history yet</h3>
              <p className="text-muted-foreground">
                Place an order once and this browser will remember your last checkout contact for quick tracking.
              </p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-border p-10 text-center">
              <ShoppingBag className="w-12 h-12 text-primary/70 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-6">
                No orders were found for your most recently used phone number or email on this device.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {recentOrders.length} order{recentOrders.length === 1 ? "" : "s"} found
                </p>
                {isRefreshingRecentOrders ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="w-4 h-4" />
                    Refreshing
                  </div>
                ) : null}
              </div>

              {recentOrders.map((order) => renderOrderCard(order))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
