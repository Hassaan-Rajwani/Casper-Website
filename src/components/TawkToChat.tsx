"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

export function TawkToChat() {
  const pathname = usePathname();

  if (!propertyId || !widgetId || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Script
      id="tawk-to-widget"
      src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
