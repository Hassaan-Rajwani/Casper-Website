import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo imageClassName="h-14" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pakistan's trusted tissue paper brand, delivering soft, durable, and eco-friendly products to households nationwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "All Products" },
                { href: `${import.meta.env.BASE_URL}policies`, label: "Policies & Terms", native: true },
                { href: "/products?category=facial", label: "Facial Tissue" },
                { href: "/products?category=kitchen", label: "Kitchen Roll" },
                { href: "/cart", label: "My Cart" },
              ].map(link => (
                <li key={link.href}>
                  {"native" in link && link.native ? (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Categories</h3>
            <ul className="space-y-2">
              {[
                { href: `${import.meta.env.BASE_URL}policies#privacy`, label: "Privacy Policy" },
                { href: `${import.meta.env.BASE_URL}policies#returns`, label: "Return & Refund" },
                { href: `${import.meta.env.BASE_URL}policies#shipping`, label: "Shipping & Service" },
                { href: `${import.meta.env.BASE_URL}policies#terms`, label: "Terms & Conditions" },
                { href: "/products", label: "Product Catalog" },
              ].map(link => (
                <li key={link.href}>
                  {link.href.startsWith(`${import.meta.env.BASE_URL}policies#`) ? (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>03128513901<br/>Mon-Sat: 9:00 AM - 6:00 PM</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>caspertissue@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Gulshan-e-Iqbal Block 3, Karachi, Pakistan, near Patel Hospital</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Casper. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={`${import.meta.env.BASE_URL}policies#privacy`} className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href={`${import.meta.env.BASE_URL}policies#returns`} className="text-xs text-muted-foreground hover:text-primary transition-colors">Refund Policy</a>
            <a href={`${import.meta.env.BASE_URL}policies#shipping`} className="text-xs text-muted-foreground hover:text-primary transition-colors">Shipping Policy</a>
            <a href={`${import.meta.env.BASE_URL}policies#terms`} className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
