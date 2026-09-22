import { Suspense } from "react";
import Products from "@/views/Products";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <Products />
    </Suspense>
  );
}
