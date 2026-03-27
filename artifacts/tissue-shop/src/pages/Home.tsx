import { Link } from "wouter";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Truck, Droplets, ArrowRight } from "lucide-react";
import { useListProducts, useListCategories } from "@/lib/firebase-hooks";
import { ProductCard } from "@/components/ui/ProductCard";

export default function Home() {
  const { data: products } = useListProducts();
  useListCategories();

  // Mock featured products if API fails or is empty, else take first 4 bestsellers
  const featuredProducts = products?.filter(p => p.isBestseller).slice(0, 4) || products?.slice(0, 4) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden bg-background shadow-xl shadow-primary/5 border border-border/50 min-h-[600px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10 w-2/3" />
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            className="absolute inset-0 w-full h-full object-cover object-right" 
            alt="Premium Tissue Paper Background" 
          />
          
          <div className="relative z-20 p-8 md:p-16 lg:p-24 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wide mb-6">
                Premium Collection 2025
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground leading-[1.1] tracking-tight">
                Experience the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Softest</span> Touch.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Elevate your everyday moments with our ultra-soft, 3-ply facial tissues. Crafted for gentle care and ultimate comfort.
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/products" className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                  Shop Now
                </Link>
                <Link href="/products" className="px-8 py-4 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2">
                  Browse Collection <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Leaf, title: "100% Virgin Pulp", desc: "Made from sustainably sourced materials" },
              { icon: Droplets, title: "Ultra Soft & Thick", desc: "Premium 3-ply thickness for extra care" },
              { icon: ShieldCheck, title: "Hypoallergenic", desc: "Dermatologically tested for sensitive skin" },
              { icon: Truck, title: "Fast Delivery", desc: "Free shipping on orders over $50" },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-6 bg-card rounded-2xl shadow-sm border border-border/50"
              >
                <div className="bg-primary/10 p-3 rounded-xl">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground mt-2">Discover our most loved tissue collections</p>
          </div>
          <Link href="/products" className="hidden sm:flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {featuredProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <h3 className="text-lg font-semibold text-foreground">No products found.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                New products will appear here as soon as they are added to the catalog.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link href="/products" className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Quality Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl overflow-hidden relative bg-foreground text-background flex flex-col md:flex-row items-center">
          <div className="p-10 md:p-16 lg:p-20 md:w-1/2 relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">The Difference is in the Details.</h2>
            <p className="text-background/80 text-lg leading-relaxed mb-8">
              Every Casper tissue goes through a rigorous quality check to ensure you get the plush, lint-free experience you deserve. Because your skin shouldn't settle for less.
            </p>
            <Link href="/products" className="inline-block px-8 py-4 rounded-xl font-semibold bg-background text-foreground hover:bg-background/90 transition-colors">
              Discover Quality
            </Link>
          </div>
          <div className="md:w-1/2 w-full h-64 md:h-auto absolute right-0 inset-y-0 opacity-40 md:opacity-100 mix-blend-overlay md:mix-blend-normal">
            <img 
              src={`${import.meta.env.BASE_URL}images/quality-texture.png`} 
              alt="Tissue Texture" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground to-transparent hidden md:block"></div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
