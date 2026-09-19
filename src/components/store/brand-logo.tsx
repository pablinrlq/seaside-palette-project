import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  seal?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, seal = false, className = "" }: BrandLogoProps) {
  const src = seal
    ? "/brand/logo-seal.png"
    : compact
      ? "/brand/logo-monogram.png"
      : "/brand/logo-horizontal.png";
  const size = seal ? "h-24 w-24" : compact ? "h-10 w-10" : "h-12 w-auto md:h-14";

  return (
    <img
      src={src}
      alt="Água Limpa Beachwear"
      className={cn(size, "object-contain", className)}
      decoding="async"
    />
  );
}
