"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

function canOptimizeRemoteImage(src: string) {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    const hostname = new URL(src).hostname;
    return (
      hostname.includes("firebasestorage") ||
      hostname.includes("storage.googleapis.com")
    );
  } catch {
    return false;
  }
}

export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px",
}: ProductImageProps) {
  if (!canOptimizeRemoteImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full object-cover object-center", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cn("object-cover object-center", className)}
    />
  );
}
