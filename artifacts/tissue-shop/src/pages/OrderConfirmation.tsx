import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Package, Phone, Mail, ArrowRight } from "lucide-react";
import { useGetOrder } from "@/lib/firebase-hooks";
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

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const orderNumber = params?.orderNumber || "";
  const { data: order, isLoading } = useGetOrder(orderNumber);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-14 h-14 text-green-600" />
      </motion.div>
      
      <h1 className="text-3xl font-bold text-foreground mb-3">Order Confirmed!</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Thank you for your order. Your order has been received successfully.
      </p>
      
      <div className="bg-card rounded-2xl border border-border p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
        </div>

        {isLoading ? (
          <div className="py-6 flex items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="w-5 h-5" />
            Loading order details...
          </div>
        ) : (
          <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Order Number</span>
            <span className="font-bold text-foreground text-primary">{orderNumber || "Unavailable"}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Status</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getOrderStatusBadgeClass(order?.status ?? "pending")}`}>
              {order?.status ?? "pending"}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Delivery Time</span>
            <span className="font-medium text-foreground">2-4 Business Days</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Payment</span>
            <span className="font-medium text-foreground">
              {order?.paymentMethod === "card" ? "Card" : "Cash on Delivery"}
            </span>
          </div>

          {order ? (
            <>
              <div className="py-2 border-b border-border/50">
                <p className="text-muted-foreground text-sm mb-2">Customer</p>
                <p className="font-medium text-foreground">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>

              <div className="py-2 border-b border-border/50">
                <p className="text-muted-foreground text-sm mb-2">Delivery Address</p>
                <p className="font-medium text-foreground">{order.address}</p>
                <p className="text-sm text-muted-foreground">
                  {order.city}
                  {order.postalCode ? `, ${order.postalCode}` : ""}
                </p>
              </div>

              <div className="py-2 border-b border-border/50">
                <p className="text-muted-foreground text-sm mb-3">Items</p>
                <div className="space-y-3">
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
                        <div>
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

              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="font-bold text-foreground">Rs. {order.total.toFixed(0)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              We could not load the order details at the moment, but your order has been received successfully.
            </p>
          )}
        </div>
        )}
      </div>

      <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 mb-8 text-left">
        <h3 className="font-semibold text-foreground mb-3">Need Help?</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 text-primary flex-shrink-0" />
            <span>03128513901 (Mon-Sat, 9am-6pm)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 text-primary flex-shrink-0" />
            <span>caspertissue@gmail.com</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href={`/my-orders?orderNumber=${encodeURIComponent(orderNumber)}`}>
          <a className="flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted/80 transition-colors">
            Track This Order
          </a>
        </Link>
        <Link href="/products">
          <a className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </motion.div>
  );
}
