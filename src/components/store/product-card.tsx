import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { money, productColor, type Product } from "@/lib/catalog";
import { useStore } from "./store-context";

export function ProductCard({ product }: { product: Product }) {
  const { add, items } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const soldOut = product.stock <= 0;
  const available =
    product.stock -
    items
      .filter((item) => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  return (
    <article className="product-card">
      <div className="product-image">
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          aria-label={"Ver " + product.name}
        >
          <img src={product.image} alt={product.name} width={960} height={1200} loading="lazy" />
        </Link>
        {(soldOut || product.badge) && (
          <span className="product-badge">{soldOut ? "Esgotado" : product.badge}</span>
        )}
        <button
          type="button"
          className="quick-shop"
          disabled={soldOut || available <= 0}
          onClick={() => {
            setSize(product.sizes.length === 1 ? (product.sizes[0] ?? "") : "");
            setOpen(true);
          }}
          aria-label={"Escolher tamanho de " + product.name}
        >
          {soldOut ? "Esgotado" : available <= 0 ? "Já está na sacola" : "Escolher minha peça"}
          <Plus size={16} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-info-top">
          <h3>
            <Link to="/produto/$slug" params={{ slug: product.slug }}>
              {product.name}
            </Link>
          </h3>
          <span
            className="color-dot"
            style={{ backgroundColor: productColor(product.color) }}
            title={product.color}
            aria-label={"Cor " + product.color}
          />
        </div>
        <p>{money(product.price)}</p>
        <small>
          {product.color} · {product.sizes.join(" / ")}
        </small>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl sm:p-8">
          <div className="quick-dialog">
            <img src={product.image} alt={product.name} width={320} height={400} />
            <div className="quick-details">
              <div>
                <p className="eyebrow mb-2">{product.category}</p>
                <DialogTitle className="font-serif text-3xl font-normal leading-none">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="mt-3 text-xs">{product.color}</DialogDescription>
                <p className="mt-4 text-sm">{money(product.price)}</p>
              </div>
              <div className="quick-options">
                <p className="mb-3 mt-6 text-xs">Seu tamanho</p>
                <div className="size-options" role="group" aria-label="Escolha seu tamanho">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button
                  className="mt-6 h-12 w-full rounded-none text-xs"
                  disabled={!size || soldOut || available <= 0}
                  onClick={() => {
                    add(product, size);
                    setOpen(false);
                    toast.success("Sua sacola ganhou um pouco de verão.", {
                      description: product.name + " · " + size,
                      action: { label: "Ver sacola", onClick: () => navigate({ to: "/sacola" }) },
                    });
                  }}
                >
                  <ShoppingBag /> {size ? "Adicionar à sacola" : "Selecione um tamanho"}
                </Button>
                <Link
                  to="/produto/$slug"
                  params={{ slug: product.slug }}
                  className="text-link mt-5"
                  onClick={() => setOpen(false)}
                >
                  Todos os detalhes <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
