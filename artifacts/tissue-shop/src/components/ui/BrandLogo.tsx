import { cn } from "@/lib/utils";

export const BRAND_LOGO_SRC = `${import.meta.env.BASE_URL}images/logo.png`;

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  alt = "Casper logo",
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex shrink-0", className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt={alt}
        className={cn("h-12 w-auto object-contain", imageClassName)}
      />
    </div>
  );
}
