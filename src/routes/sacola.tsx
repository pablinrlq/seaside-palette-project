import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { money } from "@/lib/catalog";
import { useStore } from "@/components/store/store-context";
export const Route = createFileRoute("/sacola")({
  head: () => ({
    meta: [
      { title: "Sua sacola | Água Limpa Beachwear" },
      {
        name: "description",
        content: "Seus favoritos estão aqui. Revise suas escolhas e continue para a compra.",
      },
    ],
  }),
  component: Cart,
});
function Cart() {
  const { items, remove, setQuantity, subtotal, count } = useStore();
  const missing = Math.max(0, 499 - subtotal);
  if (!items.length)
    return (
      <main id="conteudo" className="section-shell empty-state">
        <ShoppingBag />
        <p className="eyebrow">Um novo verão espera por você</p>
        <h1>Sua sacola está leve.</h1>
        <p>Encontre aquela peça que faz você querer marcar a próxima ida à praia.</p>
        <Link to="/colecao" className="shop-button">
          Encontrar meu favorito <ArrowRight size={16} />
        </Link>
      </main>
    );
  return (
    <main id="conteudo" className="section-shell py-9 md:py-14">
      <Link to="/colecao" className="page-kicker">
        <ArrowLeft size={13} /> Continuar escolhendo
      </Link>
      <div className="mb-9 flex items-baseline gap-4">
        <h1 className="page-title">Sua sacola.</h1>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "peça" : "peças"}
        </span>
      </div>
      <div className="purchase-layout">
        <div>
          <div className="shipping-progress">
            <p>
              <Truck size={16} />
              {missing
                ? "Faltam " + money(missing) + " para ganhar frete grátis."
                : "Seu pedido ganhou frete grátis."}
            </p>
            <progress
              max={499}
              value={Math.min(subtotal, 499)}
              aria-label="Progresso para frete grátis"
            />
          </div>
          <div className="cart-items">
            {items.map((x) => {
              const allOfProduct = items
                .filter((item) => item.product.id === x.product.id)
                .reduce((sum, item) => sum + item.quantity, 0);
              return (
                <article key={x.product.id + ":" + x.size} className="cart-item">
                  <Link to="/produto/$slug" params={{ slug: x.product.slug }}>
                    <img src={x.product.image} alt={x.product.name} width={120} height={150} />
                  </Link>
                  <div className="cart-item-details">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to="/produto/$slug"
                          params={{ slug: x.product.slug }}
                          className="cart-item-name"
                        >
                          {x.product.name}
                        </Link>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {x.product.color} · Tamanho {x.size}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="cart-remove"
                        aria-label={"Remover " + x.product.name + " tamanho " + x.size}
                        title="Remover peça"
                        onClick={() => remove(x.product.id, x.size)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={x.quantity <= 1}
                          aria-label={"Diminuir quantidade de " + x.product.name + " " + x.size}
                          onClick={() => setQuantity(x.product.id, x.size, x.quantity - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <output aria-label={"Quantidade de " + x.product.name + " " + x.size}>
                          {x.quantity}
                        </output>
                        <button
                          type="button"
                          disabled={allOfProduct >= x.product.stock}
                          aria-label={"Aumentar quantidade de " + x.product.name + " " + x.size}
                          onClick={() => setQuantity(x.product.id, x.size, x.quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <p>{money(x.product.price * x.quantity)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <aside className="order-summary">
          <p className="eyebrow mb-2">Suas escolhas</p>
          <h2>Um pouco de verão.</h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Entrega</span>
            <span>{missing ? "A calcular" : "Grátis"}</span>
          </div>
          <div className="summary-line summary-total">
            <span>{missing ? "Total dos produtos" : "Total"}</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <Link to="/checkout" className="shop-button mt-7 w-full">
            Continuar para compra <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">
            Você pode revisar suas escolhas antes de finalizar.
          </p>
          <a
            href="mailto:oi@agualimpa.com.br"
            className="mt-7 block text-center text-[10px] underline underline-offset-4"
          >
            Precisa de ajuda com seu pedido?
          </a>
        </aside>
      </div>
    </main>
  );
}
