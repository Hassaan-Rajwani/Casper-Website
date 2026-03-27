import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ShoppingBag, CreditCard, Banknote, ChevronRight } from "lucide-react";
import {
  useGetCart,
  useCreateOrder,
  getGetCartQueryKey,
  getCustomerOrdersQueryKey,
} from "@/lib/firebase-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: "cod" | "card";
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { paymentMethod: "cod" }
  });

  const paymentMethod = watch("paymentMethod");

  const createOrderMutation = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        queryClient.setQueryData(getGetCartQueryKey(), {
          items: [],
          total: 0,
          itemCount: 0,
        });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        queryClient.invalidateQueries({
          queryKey: getCustomerOrdersQueryKey({
            email: order.customerEmail,
            phone: order.customerPhone,
          }),
        });
        setLocation(`/order-confirmation/${order.orderNumber}`);
      },
      onError: () => {
        toast({ title: "Order Failed", description: "Could not place order. Please try again.", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    createOrderMutation.mutate({ data });
  };

  const isSubmitting = createOrderMutation.isPending;

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some products before checking out.</p>
        <a href="/products" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
          Shop Now
        </a>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-5">Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input 
                  {...register("customerName", { required: "Name is required" })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Muhammad Ali"
                />
                {errors.customerName && <p className="text-destructive text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
                <input 
                  {...register("customerEmail", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                  type="email"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="ali@example.com"
                />
                {errors.customerEmail && <p className="text-destructive text-xs mt-1">{errors.customerEmail.message}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                <input 
                  {...register("customerPhone", { required: "Phone is required" })}
                  type="tel"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="0300-1234567"
                />
                {errors.customerPhone && <p className="text-destructive text-xs mt-1">{errors.customerPhone.message}</p>}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-5">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                <input 
                  {...register("address", { required: "Address is required" })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="House 12, Street 5, Block A"
                />
                {errors.address && <p className="text-destructive text-xs mt-1">{errors.address.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                <input 
                  {...register("city", { required: "City is required" })}
                  disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Lahore"
                  />
                  {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Postal Code *</label>
                <input 
                  {...register("postalCode", { required: "Postal code is required" })}
                  disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="54000"
                  />
                  {errors.postalCode && <p className="text-destructive text-xs mt-1">{errors.postalCode.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-5">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <input type="radio" value="cod" {...register("paymentMethod")} className="hidden" disabled={isSubmitting} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"}`}>
                  {paymentMethod === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when delivered</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <input type="radio" value="card" {...register("paymentMethod")} className="hidden" disabled={isSubmitting} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "card" ? "border-primary" : "border-muted-foreground"}`}>
                  {paymentMethod === "card" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Credit / Debit Card</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-card rounded-2xl border border-border p-6 space-y-4 relative overflow-hidden">
            <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex gap-3 py-2">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-primary">Rs. {(item.product.price * item.quantity).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>Rs. {cart.total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 flex justify-between font-bold text-lg text-foreground">
              <span>Total</span>
              <span>Rs. {cart.total.toFixed(0)}</span>
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Placing Order...
                </>
              ) : (
                <>Place Order <ChevronRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              By placing order, you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
