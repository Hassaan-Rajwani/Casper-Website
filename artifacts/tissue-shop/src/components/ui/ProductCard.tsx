import { Link } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { type Product, useAddToCart, getGetCartQueryKey } from "@/lib/firebase-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";

export function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: (nextCart) => {
        queryClient.setQueryData(getGetCartQueryKey(), nextCart);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        setIsAdding(false);
      },
      onError: (error) => {
        toast({ 
          title: "Error", 
          description: error.message || "Could not add to cart. Please try again.",
          variant: "destructive"
        });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        setIsAdding(false);
      }
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
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
        {product.isNew && (
          <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
            NEW
          </span>
        )}
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
            SALE
          </span>
        )}
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" 
        />
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2 text-amber-400">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>
        
        <Link href={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground mt-1 mb-4">{product.category}</p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="min-w-24 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn flex items-center justify-center gap-2"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-5 h-5 group-active/btn:scale-90 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
