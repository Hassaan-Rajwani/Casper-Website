"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { type Product, useAddToCart, getGetCartQueryKey } from "@/lib/firebase-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ProductImage } from "@/components/ui/ProductImage";

function ProductCardComponent({ product }: { product: Product }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: (nextCart) => {
        queryClient.setQueryData(getGetCartQueryKey(), nextCart);
        setIsAdding(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Could not add to cart. Please try again.",
          variant: "destructive",
        });
        setIsAdding(false);
      },
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdding || product.stock === 0) {
      return;
    }

    const currentCart = queryClient.getQueryData(getGetCartQueryKey()) as
      | { items?: Array<{ product: { id: number } }> }
      | undefined;
    const alreadyInCart = currentCart?.items?.some((item) => item.product.id === product.id);

    if (alreadyInCart) {
      toast({
        title: "Already added",
        description: "This product is already in your cart.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    addToCartMutation.mutate({ data: { productId: product.id, quantity: 1 } });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
    >
      <Link href={`/products/${product.id}`} className="relative block overflow-hidden aspect-square bg-muted/30">
        <div className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 z-10 rounded-lg sm:rounded-xl bg-background/95 p-1 sm:p-1.5 shadow-md">
          <BrandLogo imageClassName="h-5 sm:h-8" />
        </div>
        {product.isNew && (
          <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full z-10 shadow-sm">
            NEW
          </span>
        )}
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full z-10 shadow-sm">
            SALE
          </span>
        )}
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
        />
      </Link>

      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1.5 sm:mb-2 text-amber-400">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
          <span className="text-xs sm:text-sm font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span className="text-[11px] sm:text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-sm sm:text-lg text-foreground hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-2 sm:mb-4">{product.category}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base sm:text-xl text-foreground truncate">
              Rs. {product.price.toFixed(0)}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] sm:text-xs text-muted-foreground line-through truncate">
                Rs. {product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="shrink-0 sm:min-w-24 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground px-2.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn flex items-center justify-center gap-2"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 group-active/btn:scale-90 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const ProductCard = memo(ProductCardComponent);
