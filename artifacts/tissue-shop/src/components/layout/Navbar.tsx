import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, Search, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCart } from "@/lib/firebase-hooks";

export function Navbar() {
  const [location] = useLocation();
  const { data: cart } = useGetCart();
  const itemCount = cart?.itemCount || 0;

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Droplet className="w-6 h-6 text-primary fill-primary/20" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">Casper</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/products") ? "text-primary" : "text-muted-foreground"}`}
            >
              Shop Collection
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
            <Search className="w-5 h-5" />
          </Button>
          
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
