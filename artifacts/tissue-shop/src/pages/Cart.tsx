import { Link, useLocation } from "wouter";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Shield } from "lucide-react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveFromCart,
  getGetCartQueryKey,
} from "@/lib/firebase-hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Cart as CartData } from "@/lib/store-types";

function syncCartCache(queryClient: ReturnType<typeof useQueryClient>, nextCart: CartData) {
  queryClient.setQueryData(getGetCartQueryKey(), nextCart);
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const [syncingItemIds, setSyncingItemIds] = useState<number[]>([]);
  const queuedQuantitiesRef = useRef<Record<number, number | undefined>>({});

  const updateMutation = useUpdateCartItem();
  
  const removeMutation = useRemoveFromCart();

  const setItemSyncing = (productId: number, syncing: boolean) => {
    setSyncingItemIds((current) => {
      if (syncing) {
        return current.includes(productId) ? current : [...current, productId];
      }

      return current.filter((id) => id !== productId);
    });
  };

  const isItemSyncing = (productId: number) => syncingItemIds.includes(productId);

  const syncQueuedQuantity = (productId: number) => {
    const nextQuantity = queuedQuantitiesRef.current[productId];
    if (nextQuantity === undefined) {
      setItemSyncing(productId, false);
      return;
    }

    delete queuedQuantitiesRef.current[productId];
    setItemSyncing(productId, true);

    const handleSettled = (syncedQuantity: number) => (nextCart?: CartData) => {
      if (nextCart) {
        syncCartCache(queryClient, nextCart);
      } else {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      }

      const queuedQuantity = queuedQuantitiesRef.current[productId];
      if (queuedQuantity !== undefined && queuedQuantity !== syncedQuantity) {
        syncQueuedQuantity(productId);
        return;
      }

      delete queuedQuantitiesRef.current[productId];
      setItemSyncing(productId, false);
    };

    if (nextQuantity <= 0) {
      removeMutation.mutate(
        { productId },
        {
          onSuccess: (nextCart) => handleSettled(0)(nextCart),
          onError: () => handleSettled(0)(),
        },
      );
      return;
    }

    updateMutation.mutate(
      { productId, data: { quantity: nextQuantity } },
      {
        onSuccess: (nextCart) => handleSettled(nextQuantity)(nextCart),
        onError: () => handleSettled(nextQuantity)(),
      },
    );
  };

  const handleUpdate = (productId: number, quantity: number) => {
    if (!cart) return;

    const cartItem = cart.items.find((item) => item.product.id === productId);
    if (!cartItem) return;

    if (quantity <= 0) {
      handleRemove(productId);
      return;
    }

    const safeQuantity = Math.max(1, Math.min(cartItem.product.stock, quantity));

    queryClient.setQueryData(getGetCartQueryKey(), (current: CartData | undefined) => {
      if (!current) {
        return current;
      }

      const nextItems = current.items.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        return { ...item, quantity: safeQuantity };
      });

      return {
        ...current,
        items: nextItems,
        itemCount: nextItems.reduce((sum, item) => sum + item.quantity, 0),
        total:
          Math.round(
            nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100,
          ) / 100,
      };
    });

    queuedQuantitiesRef.current[productId] = safeQuantity;
    if (!isItemSyncing(productId)) {
      syncQueuedQuantity(productId);
    }
  };

  const handleRemove = (productId: number) => {
    if (!cart) return;

    queryClient.setQueryData(getGetCartQueryKey(), (current: CartData | undefined) => {
      if (!current) {
        return current;
      }

      const nextItems = current.items.filter((item) => item.product.id !== productId);
      return {
        ...current,
        items: nextItems,
        itemCount: nextItems.reduce((sum, item) => sum + item.quantity, 0),
        total:
          Math.round(
            nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100,
          ) / 100,
      };
    });

    queuedQuantitiesRef.current[productId] = 0;
    if (!isItemSyncing(productId)) {
      syncQueuedQuantity(productId);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-32 text-center"
      >
        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary/40">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-display font-bold text-foreground mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Looks like you haven't added any products to your cart yet. Discover our softest collections today.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          Start Shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex items-center justify-between gap-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Shopping Cart</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-2/3">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-6 border-b border-border/50 bg-muted/10 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/50">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="grid grid-cols-12 gap-4 p-6 items-center"
                >
                  <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                    <Link href={`/products/${item.product.id}`} className="shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-muted/30 border border-border overflow-hidden p-1">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover mix-blend-multiply rounded-lg" />
                      </div>
                    </Link>
                    <div>
                      <Link href={`/products/${item.product.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                        {item.product.name}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">${item.product.price.toFixed(2)}</div>
                      <button 
                        onClick={() => handleRemove(item.product.id)}
                        className="text-sm text-destructive hover:underline mt-2 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3 flex justify-center mt-4 sm:mt-0">
                    <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                      <button 
                        onClick={() => handleUpdate(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-16 text-center font-medium text-sm flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdate(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3 text-right font-bold text-foreground text-lg mt-4 sm:mt-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg shadow-black/5 sticky top-28">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="font-medium text-foreground">${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-foreground">{cart.total > 50 ? 'Free' : '$5.00'}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes</span>
                <span className="font-medium text-foreground">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-base font-bold text-foreground">Estimated Total</span>
              <span className="text-3xl font-bold text-foreground">
                ${(cart.total + (cart.total > 50 ? 0 : 5)).toFixed(2)}
              </span>
            </div>

            <button 
              onClick={() => setLocation("/checkout")}
              disabled={updateMutation.isPending || removeMutation.isPending || syncingItemIds.length > 0}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Proceed to Checkout
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              Secure and encrypted checkout
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
