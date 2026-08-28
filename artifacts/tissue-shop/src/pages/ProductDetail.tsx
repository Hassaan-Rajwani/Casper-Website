import { useState, type FormEvent } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Star, Truck, Shield, Minus, Plus, ShoppingCart, ShieldCheck } from "lucide-react";
import {
  useGetProduct,
  useAddToCart,
  useListProductReviews,
  useCreateProductReview,
  getGetCartQueryKey,
  getProductReviewsQueryKey,
  getDefaultOrderContact,
} from "@/lib/firebase-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const productId = match ? Number(params?.id) : 0;

  const { data: product, isLoading, isFetching } = useGetProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isAdding, setIsAdding] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultContact = getDefaultOrderContact();
  const { data: reviews = [], isLoading: isLoadingReviews } = useListProductReviews(productId);
  const [reviewOrderNumber, setReviewOrderNumber] = useState("");
  const [reviewContact, setReviewContact] = useState(
    defaultContact?.phone || defaultContact?.email || "",
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const createReviewMutation = useCreateProductReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getProductReviewsQueryKey(productId) });
        toast({
          title: "Review submitted",
          description: "Thanks for sharing your feedback!",
        });
        setReviewOrderNumber("");
        setReviewComment("");
        setReviewRating(5);
      },
      onError: (error) => {
        toast({
          title: "Could not submit review",
          description: error.message || "Please check your details and try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewOrderNumber.trim() || !reviewContact.trim() || !reviewComment.trim()) {
      toast({
        title: "Missing details",
        description: "Please fill in your order ID, contact, and review.",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      data: {
        productId,
        orderNumber: reviewOrderNumber,
        contact: reviewContact,
        rating: reviewRating,
        comment: reviewComment,
      },
    });
  };

  const displayRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : product?.rating ?? 0;
  const displayReviewCount = reviews.length > 0 ? reviews.length : product?.reviewCount ?? 0;
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
          description: error.message || "Could not add to cart.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        setIsAdding(false);
      }
    }
  });

  if (!product && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-12 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-3xl bg-muted/50 border border-border" />
          <div className="space-y-4">
            <div className="h-6 w-24 rounded-full bg-muted/50" />
            <div className="h-14 w-3/4 rounded-2xl bg-muted/50" />
            <div className="h-8 w-40 rounded-xl bg-muted/50" />
            <div className="h-28 w-full rounded-2xl bg-muted/50" />
            <div className="h-14 w-full rounded-2xl bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xl text-muted-foreground">Product not found.</div>;
  }

  const handleAddToCart = () => {
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
    addToCartMutation.mutate({ data: { productId: product.id, quantity } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Images */}
        <div className="w-full lg:w-1/2">
          <div className="bg-muted/30 rounded-3xl overflow-hidden aspect-square border border-border relative">
            {product.isNew && (
              <span className="absolute top-6 left-6 bg-accent text-accent-foreground text-sm font-bold px-4 py-1.5 rounded-full z-10 shadow-sm">
                NEW
              </span>
            )}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center mix-blend-multiply"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              {product.category}
            </span>
            {isFetching ? <Spinner className="w-4 h-4 text-muted-foreground ml-auto" /> : null}
            <div className="flex items-center gap-1 text-amber-400 ml-2">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium text-foreground">{displayRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground underline decoration-dotted">({displayReviewCount} reviews)</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-end gap-4 mb-6 pb-6 border-b border-border/50">
            <span className="text-4xl font-bold text-foreground">
              Rs. {product.price.toFixed(0)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xl text-muted-foreground line-through mb-1">
                  Rs. {product.originalPrice.toFixed(0)}
                </span>
                <span className="text-sm font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md mb-1.5">
                  Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          <div className="mb-8">
            <p className="font-medium text-foreground mb-3">Quantity</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-muted/50 rounded-xl border border-border p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-foreground disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-foreground disabled:opacity-50"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.stock > 0 ? `${product.stock} items available` : <span className="text-destructive font-medium">Out of stock</span>}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className="flex-1 py-4 px-8 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-6 h-6" />
              Add to Cart
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <Truck className="w-6 h-6 text-primary" />
              <div className="text-sm font-medium text-foreground">Free Delivery <br /><span className="text-muted-foreground font-normal">On all orders</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <Shield className="w-6 h-6 text-primary" />
              <div className="text-sm font-medium text-foreground">Premium Quality <br /><span className="text-muted-foreground font-normal">Guaranteed</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-20">
        <div className="flex overflow-x-auto border-b border-border gap-4 sm:gap-8">
          {['description', 'specifications', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 pb-4 font-semibold text-sm sm:text-lg transition-colors capitalize ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="py-8 prose max-w-none text-muted-foreground">
          {activeTab === 'description' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>{product.description}</p>
              <p className="mt-4">Casper tissues are designed to provide the ultimate comfort for your everyday needs. Crafted from 100% virgin pulp, our products are thick, highly absorbent, and exceptionally soft against the skin.</p>
            </motion.div>
          )}
          {activeTab === 'specifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ul className="space-y-3 list-none pl-0">
                <li className="flex border-b border-border/50 pb-3"><span className="w-48 font-medium text-foreground">Material</span> <span>100% Virgin Wood Pulp</span></li>
                <li className="flex border-b border-border/50 pb-3"><span className="w-48 font-medium text-foreground">Ply</span> <span>3-Ply</span></li>
                <li className="flex border-b border-border/50 pb-3"><span className="w-48 font-medium text-foreground">Scent</span> <span>Unscented / Hypoallergenic</span></li>
                <li className="flex pb-3"><span className="w-48 font-medium text-foreground">Category</span> <span className="capitalize">{product.category}</span></li>
              </ul>
            </motion.div>
          )}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="text-5xl font-display font-bold text-foreground">{displayRating.toFixed(1)}</div>
                <div>
                  <div className="flex text-amber-400 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(displayRating) ? 'fill-current' : 'fill-muted text-muted'}`} />)}
                  </div>
                  <div className="text-sm text-muted-foreground">Based on {displayReviewCount} reviews</div>
                </div>
              </div>

              {isLoadingReviews ? (
                <div className="flex items-center gap-3 text-muted-foreground py-4">
                  <Spinner className="w-4 h-4" />
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this product once your order is delivered!
                </p>
              ) : (
                <div className="space-y-6 mb-10">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border/50 pb-6 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'fill-muted text-muted'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground not-italic">{review.customerName}</span>
                        <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="not-italic">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="not-italic bg-muted/30 border border-border/50 rounded-2xl p-6 max-w-xl">
                <h3 className="text-lg font-semibold text-foreground mb-1">Write a Review</h3>
                <p className="text-sm text-muted-foreground mb-5 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Reviews can only be submitted for orders that have already been delivered, using the same
                  order ID and phone/email from checkout.
                </p>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Order ID</label>
                    <input
                      value={reviewOrderNumber}
                      onChange={(event) => setReviewOrderNumber(event.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="ST-ABC123-XY9Z"
                      disabled={createReviewMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number or Email</label>
                    <input
                      value={reviewContact}
                      onChange={(event) => setReviewContact(event.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="03128513901 or name@example.com"
                      disabled={createReviewMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Your Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          disabled={createReviewMutation.isPending}
                          className="p-1"
                        >
                          <Star className={`w-6 h-6 ${value <= reviewRating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/50'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Your Review</label>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                      placeholder="Share your experience with this product..."
                      disabled={createReviewMutation.isPending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {createReviewMutation.isPending ? <Spinner className="w-4 h-4" /> : null}
                    Submit Review
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
