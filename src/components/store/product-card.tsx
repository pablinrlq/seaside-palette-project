import { Link } from "@tanstack/react-router";
import { Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, type Product } from "@/lib/catalog";
import { useStore } from "./store-context";
export function ProductCard({ product }: { product: Product }) {
  const { add } = useStore();
  const defaultSize = product.sizes[0] ?? "Único";
  const soldOut = product.stock <= 0;
  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden bg-card">
        <Link to="/produto/$slug" params={{ slug: product.slug }} className="block">
          <img
            src={product.image}
            alt={product.name}
            width={960}
            height={1200}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </Link>
        {product.badge && (
          <span className="absolute left-3 top-3 bg-card px-3 py-1.5 text-[10px] font-semibold uppercase text-foreground shadow-sm">
            {product.badge}
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
          <Button asChild variant="outline" className="flex-1 bg-card">
            <Link to="/produto/$slug" params={{ slug: product.slug }}>
              <Eye /> Ver detalhes
            </Link>
          </Button>
          <Button
            size="icon"
            disabled={soldOut}
            aria-label={`Adicionar ${product.name} à sacola`}
            onClick={() => add(product, defaultSize)}
          >
            <ShoppingBag />
          </Button>
        </div>
      </div>
      <div className="flex items-start justify-between gap-2 pt-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase text-primary">
            {product.category}
          </p>
          <Link
            to="/produto/$slug"
            params={{ slug: product.slug }}
            className="block truncate font-serif text-xl text-foreground transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-sm font-medium">{money(product.price)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {soldOut
              ? "Esgotado"
              : product.stock <= 5
                ? `Só ${product.stock} em estoque`
                : "6x sem juros"}
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="shrink-0 sm:hidden"
          disabled={soldOut}
          aria-label={`Adicionar ${product.name} à sacola`}
          onClick={() => add(product, defaultSize)}
        >
          <ShoppingBag />
        </Button>
      </div>
    </article>
  );
}
