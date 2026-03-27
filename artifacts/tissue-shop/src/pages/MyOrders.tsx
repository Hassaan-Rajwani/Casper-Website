import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PackageSearch, ShoppingBag } from "lucide-react";
import {
  getDefaultOrderContact,
  useListCustomerOrders,
} from "@/lib/firebase-hooks";
import { Spinner } from "@/components/ui/spinner";

export default function MyOrders() {
  const defaultContact = useMemo(() => getDefaultOrderContact(), []);
  const filters = useMemo(
    () => ({
      email: defaultContact?.email ?? "",
      phone: defaultContact?.phone ?? "",
    }),
    [defaultContact],
  );

  const hasSavedContact = Boolean(filters.email || filters.phone);
  const { data: orders = [], isLoading, isFetching } = useListCustomerOrders(filters);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col gap-3 mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">
          Your recently placed orders are displayed here.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-10 flex items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="w-5 h-5" />
          Loading your orders...
        </div>
      ) : !hasSavedContact ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <PackageSearch className="w-12 h-12 text-primary/70 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No order history yet</h2>
          <p className="text-muted-foreground">
            Once you place your first order, its details will appear here automatically.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <ShoppingBag className="w-12 h-12 text-primary/70 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No orders found</h2>
          <p className="text-muted-foreground mb-6">
            No orders were found for your most recently used contact details.
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
              {orders.length} order{orders.length === 1 ? "" : "s"} found
            </p>
            {isFetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="w-4 h-4" />
                Refreshing
              </div>
            ) : null}
          </div>

          {orders.map((order) => (
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
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full capitalize">
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
          ))}
        </div>
      )}
    </motion.div>
  );
}
