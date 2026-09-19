import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CreditCard, LockKeyhole, QrCode, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/store/store-context";
import { money } from "@/lib/catalog";
export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar compra | Água Limpa Beachwear" },
      {
        name: "description",
        content: "Revise suas escolhas e seus dados para a compra na Água Limpa.",
      },
    ],
  }),
  component: Checkout,
});
function Field({
  label,
  name,
  placeholder,
  autoComplete,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <Input
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        type={type}
        required={required}
        className="mt-2 h-12"
      />
    </label>
  );
}
function Checkout() {
  const { items, subtotal, count } = useStore();
  if (!items.length)
    return (
      <main id="conteudo" className="section-shell empty-state">
        <ShoppingBag />
        <h1>Primeiro, seu favorito.</h1>
        <p>Escolha as peças que vão acompanhar você. Depois, encontre seu pedido por aqui.</p>
        <Link to="/colecao" className="shop-button">
          Explorar coleção <ArrowRight size={16} />
        </Link>
      </main>
    );
  return (
    <main id="conteudo" className="section-shell py-9 md:py-14">
      <Link to="/sacola" className="page-kicker">
        <ArrowLeft size={13} /> Voltar à sacola
      </Link>
      <div className="mb-10">
        <p className="eyebrow mb-3">Seus próximos dias de sol</p>
        <h1 className="page-title">Quase na sua mala.</h1>
        <p className="mt-4 text-xs text-muted-foreground">
          Suas escolhas, seus dados e tudo pronto para o próximo passo.
        </p>
      </div>
      <div className="purchase-layout">
        <form onSubmit={(e) => e.preventDefault()}>
          <section className="checkout-step">
            <h2>
              <span>01</span> Sobre você
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nome completo"
                name="name"
                placeholder="Como podemos chamar você?"
                autoComplete="name"
              />
              <Field
                label="E-mail"
                name="email"
                placeholder="voce@email.com"
                type="email"
                autoComplete="email"
              />
              <Field
                label="Celular"
                name="phone"
                placeholder="(00) 00000-0000"
                type="tel"
                autoComplete="tel"
              />
            </div>
          </section>
          <section className="checkout-step">
            <h2>
              <span>02</span> Seu endereço
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="CEP"
                name="postalCode"
                placeholder="00000-000"
                autoComplete="postal-code"
              />
              <Field
                label="Rua / avenida"
                name="street"
                placeholder="Nome da rua"
                autoComplete="address-line1"
              />
              <Field label="Número" name="number" placeholder="Número" />
              <Field
                label="Complemento"
                name="complement"
                placeholder="Apartamento, bloco..."
                autoComplete="address-line2"
                required={false}
              />
              <Field label="Bairro" name="neighborhood" placeholder="Seu bairro" />
              <Field
                label="Cidade"
                name="city"
                placeholder="Sua cidade"
                autoComplete="address-level2"
              />
              <Field label="Estado" name="state" placeholder="UF" autoComplete="address-level1" />
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">
              {subtotal >= 499
                ? "Este pedido atingiu o valor para frete grátis."
                : "O frete será informado antes do pagamento."}
            </p>
          </section>
          <section className="checkout-step border-b-0">
            <h2>
              <span>03</span> Pagamento
            </h2>
            <div
              className="flex gap-5 border-b border-border pb-5 text-xs text-muted-foreground"
              aria-label="Pagamento ainda indisponível"
            >
              <span className="flex items-center gap-2">
                <CreditCard size={18} /> Cartão
              </span>
              <span className="flex items-center gap-2">
                <QrCode size={18} /> Pix
              </span>
            </div>
            <div role="status" className="flex items-start gap-3 py-6">
              <LockKeyhole className="mt-1 h-5 w-5 shrink-0" strokeWidth={1.3} />
              <div>
                <p className="text-sm font-medium">Estamos preparando seu próximo verão.</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  O pagamento online ainda não está disponível. Nenhum pedido ou cobrança será
                  realizado por enquanto. Suas peças continuam na sacola.
                </p>
              </div>
            </div>
            <Button disabled className="h-12 w-full rounded-none text-xs">
              <LockKeyhole /> Pagamento disponível em breve
            </Button>
            <a href="mailto:oi@agualimpa.com.br" className="text-link mt-5">
              Fale com a loja <ArrowRight size={15} />
            </a>
          </section>
        </form>
        <aside className="order-summary lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-3">
            <h2>Seu pedido.</h2>
            <span className="text-[10px]">
              {count} {count === 1 ? "peça" : "peças"}
            </span>
          </div>
          <div className="mt-3">
            {items.map((x) => (
              <div
                key={x.product.id + ":" + x.size}
                className="flex gap-4 border-b border-border py-5"
              >
                <img
                  src={x.product.image}
                  alt={x.product.name}
                  width={64}
                  height={80}
                  className="h-20 w-16 object-cover"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p>{x.product.name}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {x.size} · {x.quantity} un. · {x.product.color}
                  </p>
                  <p className="mt-3">{money(x.product.price * x.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Entrega</span>
            <span>{subtotal >= 499 ? "Grátis" : "A calcular"}</span>
          </div>
          <div className="summary-line summary-total">
            <span>{subtotal >= 499 ? "Total" : "Total dos produtos"}</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <Link to="/sacola" className="text-link mt-7 text-[10px]">
            Editar minhas escolhas <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
