import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./product-card";
import { useCatalog } from "./catalog-context";
import { Button } from "@/components/ui/button";
export function CatalogPage({
  category,
  title,
  intro,
}: {
  category?: string;
  title: string;
  intro: string;
}) {
  const { products } = useCatalog();
  const [size, setSize] = useState("Todos");
  const [color, setColor] = useState("Todas");
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState(false);
  const list = useMemo(() => {
    const r = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (size === "Todos" || p.sizes.includes(size)) &&
        (color === "Todas" || p.color === color),
    );
    return [...r].sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : Number(b.featured) - Number(a.featured),
    );
  }, [products, category, size, color, sort]);
  return (
    <main>
      <section className="catalog-banner border-b border-border bg-card py-14 text-center md:py-20">
        <p className="eyebrow">Água Limpa</p>
        <h1 className="mt-3 font-serif text-5xl md:text-7xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl px-5 text-sm leading-6 text-muted-foreground">
          {intro}
        </p>
      </section>
      <section className="section-shell py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-5">
          <Button variant="outline" onClick={() => setFilters(!filters)}>
            <SlidersHorizontal /> Filtrar
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {list.length} peças encontradas
          </p>
          <select
            aria-label="Ordenar produtos"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 max-w-40 border border-border bg-card px-3 text-sm"
          >
            <option value="featured">Destaques</option>
            <option value="low">Menor preço</option>
            <option value="high">Maior preço</option>
          </select>
        </div>
        {filters && (
          <div className="mb-8 grid gap-5 border border-border bg-card p-5 sm:grid-cols-2">
            <label className="text-xs uppercase">
              Tamanho
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-2 block h-11 w-full border border-border bg-background px-3"
              >
                <option>Todos</option>
                {["P", "M", "G", "GG", "P/M", "G/GG", "Único"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase">
              Cor
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-2 block h-11 w-full border border-border bg-background px-3"
              >
                <option>Todas</option>
                {[...new Set(products.map((p) => p.color))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {list.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <h2 className="text-3xl">Nenhuma peça por aqui</h2>
            <p className="mt-2 text-muted-foreground">Experimente alterar os filtros.</p>
          </div>
        )}
      </section>
    </main>
  );
}
