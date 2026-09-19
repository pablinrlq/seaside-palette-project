import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./product-card";
import { useCatalog } from "./catalog-context";
import { Button } from "@/components/ui/button";
const categories = [
  ["/colecao", "Toda a coleção"],
  ["/biquinis", "Biquínis"],
  ["/maios", "Maiôs"],
  ["/saidas", "Saídas"],
  ["/acessorios", "Acessórios"],
] as const;

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
  const available = products.filter((p) => !category || p.category === category);
  const list = useMemo(() => {
    const result = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (size === "Todos" || p.sizes.includes(size)) &&
        (color === "Todas" || p.color === color),
    );
    return result.sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : Number(b.featured) - Number(a.featured),
    );
  }, [products, category, size, color, sort]);
  const reset = () => {
    setSize("Todos");
    setColor("Todas");
  };
  const active = Number(size !== "Todos") + Number(color !== "Todas");
  return (
    <main id="conteudo" className="section-shell pb-20">
      <section className="catalog-intro">
        <p className="eyebrow">Sol, mar & liberdade</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <nav className="collection-tabs mb-0" aria-label="Categorias da coleção">
        {categories.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": "page" }}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="catalog-toolbar">
        <Button
          variant="ghost"
          className="h-10 rounded-none px-0 text-xs hover:bg-transparent"
          onClick={() => setFilters(!filters)}
          aria-expanded={filters}
          aria-controls="catalog-filters"
        >
          <SlidersHorizontal size={16} /> Filtrar {active ? "(" + active + ")" : ""}
        </Button>
        <p aria-live="polite">{list.length} peças para o seu verão</p>
        <select
          aria-label="Ordenar produtos"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="featured">Destaques</option>
          <option value="low">Menor preço</option>
          <option value="high">Maior preço</option>
        </select>
      </div>
      {filters && (
        <div id="catalog-filters" className="catalog-filters">
          <label>
            Tamanho
            <select aria-label="Tamanho" value={size} onChange={(e) => setSize(e.target.value)}>
              <option>Todos</option>
              {[...new Set(available.flatMap((p) => p.sizes))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Cor
            <select aria-label="Cor" value={color} onChange={(e) => setColor(e.target.value)}>
              <option>Todas</option>
              {[...new Set(available.map((p) => p.color))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Button variant="ghost" onClick={reset} disabled={!active} className="text-xs">
            <X /> Limpar filtros
          </Button>
        </div>
      )}
      {list.length ? (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="text-4xl">Um novo jeito de procurar.</h2>
          <p className="my-5 text-sm text-muted-foreground">
            Não encontramos peças com essa combinação.
          </p>
          <Button variant="outline" onClick={reset}>
            Limpar filtros
          </Button>
        </div>
      )}
    </main>
  );
}
