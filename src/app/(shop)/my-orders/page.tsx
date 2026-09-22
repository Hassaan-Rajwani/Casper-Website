import { Suspense } from "react";
import MyOrders from "@/views/MyOrders";

export default function MyOrdersPage() {
  return (
    <Suspense fallback={null}>
      <MyOrders />
    </Suspense>
  );
}
