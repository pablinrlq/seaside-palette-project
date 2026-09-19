import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  ZoomIn,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { money, productColor, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProductCard } from "@/components/store/product-card";
import { useStore } from "@/components/store/store-context";
import { useCatalog } from "@/components/store/catalog-context";
export const Route = createFileRoute("/produto/$slug")({
  head: () => ({
    meta: [
      { title: "Sua próxima peça favorita | Água Limpa Beachwear" },
      {
        name: "description",
        content:
          "Conheça os detalhes, escolha seu tamanho e encontre seu próximo favorito Água Limpa.",
      },
    ],
  }),
  component: ProductPage,
});
function ProductPage() {
  const { slug } = Route.useParams();
  const { products } = useCatalog();
  const p = products.find((item) => item.slug === slug);
  if (!p)
    return (
      <main id="conteudo" className="section-shell empty-state">
        <h1>Essa peça saiu da maré.</h1>
        <p>Encontre outras peças para o seu próximo verão.</p>
        <Link to="/colecao" className="shop-button">
          Conhecer a coleção <ArrowRight size={16} />
        </Link>
      </main>
    );
  return (
    <ProductDetails
      key={p.slug}
      product={p}
      related={products.filter((item) => item.id !== p.id).slice(0, 4)}
    />
  );
}
function ProductDetails({ product: p, related }: { product: Product; related: Product[] }) {
  const [size, setSize] = useState(p.sizes.length === 1 ? (p.sizes[0] ?? "") : "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);
  const { add, items } = useStore();
  const inBag = items.filter((x) => x.product.id === p.id).reduce((sum, x) => sum + x.quantity, 0);
  const available = Math.max(0, p.stock - inBag);
  const soldOut = p.stock <= 0;
  return (
    <main id="conteudo" className="section-shell py-7 md:py-10">
      <nav aria-label="Caminho da página" className="page-kicker">
        <Link to="/colecao">Coleção</Link>
        <ChevronRight size={12} />
        <span>{p.name}</span>
      </nav>
      <div className="product-detail-layout">
        <div>
          <button
            type="button"
            className="product-detail-image"
            onClick={() => setZoom(true)}
            aria-label={"Ampliar foto de " + p.name}
          >
            <img
              src={p.image}
              alt={p.name + " na cor " + p.color}
              width={960}
              height={1200}
              fetchPriority="high"
            />
            <span>
              <ZoomIn size={18} />
            </span>
          </button>
          <p className="mt-3 text-[9px] text-muted-foreground">
            {p.name} · {p.color}
          </p>
        </div>
        <div className="product-detail-info">
          <p className="eyebrow">{p.category} / Água Limpa</p>
          <h1>{p.name}</h1>
          <p className="product-detail-price">{money(p.price)}</p>
          <p className="product-description">{p.description}</p>
          <div className="my-7 flex items-center gap-3 text-xs">
            <span className="color-dot" style={{ backgroundColor: productColor(p.color) }} />
            <span>Cor: {p.color}</span>
          </div>
          <div className="mb-3 flex items-center justify-between gap-3 text-xs">
            <span>Escolha seu tamanho</span>
            <a
              href={
                "mailto:oi@agualimpa.com.br?subject=" +
                encodeURIComponent("Ajuda com o tamanho: " + p.name)
              }
              className="underline underline-offset-4 text-muted-foreground"
            >
              Precisa de ajuda?
            </a>
          </div>
          <div className="size-options" role="group" aria-label="Escolha seu tamanho">
            {p.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  setAdded(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="product-purchase">
            <div className="quantity-control">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={qty <= 1}
                onClick={() => setQty(qty - 1)}
              >
                <Minus size={14} />
              </button>
              <output aria-label="Quantidade">{qty}</output>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={qty >= available}
                onClick={() => setQty(qty + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
            <Button
              size="lg"
              className="h-12 flex-1 rounded-none text-xs"
              disabled={soldOut || !available || !size}
              onClick={() => {
                add(p, size, qty);
                setAdded(true);
                setQty(1);
                toast.success("Sua peça está na sacola.", { description: p.name + " · " + size });
              }}
            >
              {added ? <Check /> : <ShoppingBag />}
              {soldOut
                ? "Peça esgotada"
                : !available
                  ? "Estoque já na sacola"
                  : !size
                    ? "Escolha seu tamanho"
                    : "Adicionar à sacola"}
            </Button>
          </div>
          {added && (
            <Link to="/sacola" className="text-link mt-4">
              Ir para minha sacola <ArrowRight size={15} />
            </Link>
          )}
          <p className="mt-4 text-[10px] text-muted-foreground">
            {soldOut
              ? "Novos dias de sol estão por vir."
              : p.stock <= 5
                ? "Restam " + p.stock + " unidades desta peça."
                : "Uma peça para acompanhar seus dias de sol."}
          </p>
          <div className="product-delivery">
            <Truck size={18} strokeWidth={1.3} />
            <div>
              Frete grátis a partir de R$ 499<small>Seu próximo verão, mais perto.</small>
            </div>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>
                A peça <ChevronDown size={15} />
              </summary>
              <p>
                {p.description} Disponível na cor {p.color.toLowerCase()}.
              </p>
            </details>
            <details>
              <summary>
                Cuidados para muitos verões <ChevronDown size={15} />
              </summary>
              <p>
                Siga as instruções da etiqueta da sua peça. Após o uso, evite guardar a peça úmida e
                deixe secar naturalmente à sombra.
              </p>
            </details>
            <details>
              <summary>
                Vamos ajudar você <ChevronDown size={15} />
              </summary>
              <p>
                Dúvidas sobre tamanho ou entrega? Fale com a gente em{" "}
                <a href="mailto:oi@agualimpa.com.br" className="underline">
                  oi@agualimpa.com.br
                </a>
                .
              </p>
            </details>
          </div>
        </div>
      </div>
      <section className="collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Continue se apaixonando</p>
            <h2>
              Vai bem com <em>você.</em>
            </h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((x) => (
            <ProductCard key={x.id} product={x} />
          ))}
        </div>
      </section>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="font-serif text-2xl">{p.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Foto ampliada da peça na cor {p.color}.
          </DialogDescription>
          <img src={p.image} alt={p.name} className="max-h-[75dvh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </main>
  );
}
