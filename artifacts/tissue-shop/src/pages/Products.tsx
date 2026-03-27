import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useListProducts, useListCategories } from "@/lib/firebase-hooks";
import { ProductCard } from "@/components/ui/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption =
  | "featured"
  | "price-low-high"
  | "price-high-low"
  | "rating-high-low"
  | "name-a-z"
  | "newest";

export default function Products() {
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const initialCategory = params.get("category") || "";
  const initialSearch = params.get("search") || "";
  const initialSort = (params.get("sort") as SortOption | null) || "featured";

  const [category, setCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  useEffect(() => {
    setCategory(initialCategory);
    setSearchTerm(initialSearch);
    setSortBy(initialSort);
  }, [initialCategory, initialSearch, initialSort]);

  const { data: allProducts = [], isLoading: loadingProducts, isFetching } = useListProducts();
  
  const { data: categories } = useListCategories();

  const availableCategoryIds = useMemo(() => {
    const categoryIds = new Set((categories ?? []).map((cat) => cat.id));
    for (const product of allProducts) {
      if (product.category) {
        categoryIds.add(product.category);
      }
    }
    return categoryIds;
  }, [allProducts, categories]);

  const effectiveCategory =
    category && availableCategoryIds.size > 0 && !availableCategoryIds.has(category) ? "" : category;

  const products = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredProducts = allProducts.filter((product) => {
      if (effectiveCategory && product.category !== effectiveCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch)
      );
    });

    return [...filteredProducts].sort((left, right) => {
      switch (sortBy) {
        case "price-low-high":
          return left.price - right.price;
        case "price-high-low":
          return right.price - left.price;
        case "rating-high-low":
          return right.rating - left.rating || right.reviewCount - left.reviewCount;
        case "name-a-z":
          return left.name.localeCompare(right.name);
        case "newest":
          return Number(right.isNew) - Number(left.isNew) || right.id - left.id;
        case "featured":
        default:
          return (
            Number(right.isBestseller) - Number(left.isBestseller) ||
            Number(right.isNew) - Number(left.isNew) ||
            right.rating - left.rating ||
            right.reviewCount - left.reviewCount ||
            left.name.localeCompare(right.name)
          );
      }
    });
  }, [allProducts, effectiveCategory, searchTerm, sortBy]);

  const handleCategorySelect = (id: string) => {
    setCategory(category === id ? "" : id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-28 space-y-8">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-4">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Find tissues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-foreground mb-4">Categories</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setCategory("")}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${!effectiveCategory ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                >
                  All Products
                </button>
                {categories?.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${effectiveCategory === cat.id ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Promotional Banner in Sidebar */}
            <div className="bg-gradient-to-br from-primary/10 to-blue-400/10 border border-primary/20 rounded-2xl p-6 text-center">
              <h4 className="font-display font-bold text-primary text-lg mb-2">Free Shipping</h4>
              <p className="text-sm text-muted-foreground mb-4">On all orders over $50!</p>
              <Link href="/products" className="inline-block text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg w-full">
                Shop Collection
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {effectiveCategory ? categories?.find(c => c.id === effectiveCategory)?.name || 'Products' : 'All Products'}
            </h1>
            <div className="flex items-center gap-3">
              {isFetching && !loadingProducts ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Updating products
                </div>
              ) : null}
              <div className="min-w-[190px]">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-11 rounded-xl border-border bg-muted/50 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    <SelectItem value="rating-high-low">Top Rated</SelectItem>
                    <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {category && effectiveCategory !== category ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              The selected category is unavailable, so all products are being displayed instead.
            </div>
          ) : null}

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-2xl aspect-[3/4]"></div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border border-dashed">
              <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
              <button onClick={() => { setCategory(""); setSearchTerm(""); }} className="mt-4 text-primary font-medium hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
