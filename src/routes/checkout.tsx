import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/store/store-context";
import { money } from "@/lib/catalog";
import { BrandLogo } from "@/components/store/brand-logo";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Água Limpa Beachwear" },
      {
        name: "description",
        content: "Finalize seu pedido Água Limpa em uma página interna preparada para Stripe.",
      },
      { property: "og:title", content: "Checkout — Água Limpa Beachwear" },
      {
        property: "og:description",
        content: "Checkout interno Água Limpa, com área visual pronta para Stripe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const shipping = 0;
const Field = ({
  label,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) => (
  <label className="text-xs font-semibold uppercase text-foreground">
    {label}
    <Input
      className="mt-2 h-11 bg-card"
      placeholder={placeholder}
      type={type}
      required={required}
    />
  </label>
);

function Checkout() {
  const { items, subtotal } = useStore();
  const [payment, setPayment] = useState("Cartão");
  const [complete, setComplete] = useState(false);
  const total = subtotal + shipping;
  const methods = [
    { name: "Cartão", text: "Pronto para Stripe", icon: <CreditCard /> },
    { name: "Pix", text: "Confirmação manual", icon: <QrCode /> },
    { name: "Boleto", text: "Ativar depois", icon: <Landmark /> },
  ];
  if (complete)
    return (
      <main className="section-shell flex min-h-[65vh] items-center justify-center py-16">
        <div className="w-full max-w-xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <BrandLogo className="mx-auto mt-6" />
          <p className="eyebrow mt-8">Pedido recebido</p>
          <h1 className="mt-3 text-5xl">Obrigada por escolher a Água Limpa</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Seu pedido foi registrado nesta experiência local. Quando a chave Stripe entrar, este
            mesmo espaço pode receber o checkout seguro embutido.
          </p>
          <Button asChild className="mt-8">
            <Link to="/colecao">Continuar navegando</Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="bg-muted/40">
      <section className="section-shell py-8 md:py-12">
        <div className="grid gap-5 border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="eyebrow">Checkout Água Limpa</p>
            <h1 className="mt-2 text-4xl md:text-6xl">Finalizar compra</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Página interna pronta para receber Stripe Embedded Checkout ou Payment Element,
              mantendo a compra dentro do site.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Ambiente preparado para pagamento seguro</span>
          </div>
        </div>
      </section>
      <section className="section-shell grid gap-8 pb-16 lg:grid-cols-[1fr_400px]">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (items.length) setComplete(true);
          }}
        >
          <section className="border border-border bg-card p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              <h2 className="text-3xl">Identificação</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" placeholder="Seu nome" />
              <Field label="E-mail" placeholder="voce@email.com" type="email" />
              <Field label="CPF" placeholder="000.000.000-00" />
              <Field label="Celular" placeholder="(00) 00000-0000" />
            </div>
          </section>
          <section className="border border-border bg-card p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
                2
              </span>
              <h2 className="text-3xl">Entrega</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP" placeholder="00000-000" />
              <Field label="Rua e bairro" placeholder="Rua, avenida, bairro" />
              <Field label="Número" placeholder="123" />
              <Field label="Cidade / UF" placeholder="Cidade — UF" />
            </div>
            <div className="mt-5 flex items-center justify-between border border-primary/35 bg-secondary p-4 text-sm">
              <span>Entrega padrão · 4 a 7 dias úteis</span>
              <strong>Grátis</strong>
            </div>
          </section>
          <section className="border border-border bg-card p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
                3
              </span>
              <h2 className="text-3xl">Pagamento</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {methods.map((item) => (
                <label
                  key={item.name}
                  className={`flex min-h-20 cursor-pointer flex-col justify-between border p-4 text-sm transition ${payment === item.name ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/60"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === item.name}
                    onChange={() => setPayment(item.name)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <span className="text-primary [&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                    {item.name}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">{item.text}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 border border-dashed border-primary/55 bg-background p-5">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Área reservada para Stripe dentro do site</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Quando `STRIPE_SECRET_KEY` e a rota de sessão forem conectadas, o formulário
                    seguro do Stripe entra aqui sem mandar a cliente para fora da loja.
                  </p>
                </div>
              </div>
            </div>
            <Button size="lg" className="mt-6 w-full" disabled={!items.length}>
              Finalizar pedido <ArrowRight />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Nesta reconstrução local, nenhuma cobrança real é realizada.
            </p>
          </section>
        </form>
        <aside className="order-first h-fit border border-border bg-card p-5 shadow-sm lg:order-none lg:sticky lg:top-36">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl">Seu pedido</h2>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          {items.length ? (
            items.map((x) => (
              <div key={x.product.id + x.size} className="flex gap-3 border-b border-border py-4">
                <img src={x.product.image} alt="" className="h-24 w-20 object-cover" />
                <div className="flex-1 text-sm">
                  <strong>{x.product.name}</strong>
                  <p className="mt-1 text-muted-foreground">
                    {x.size} · {x.quantity} un.
                  </p>
                  <p className="mt-2 font-semibold">{money(x.product.price * x.quantity)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-7">
              <p className="text-sm text-muted-foreground">
                Sua sacola está vazia. Adicione uma peça antes de continuar.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/colecao">Ver coleção</Link>
              </Button>
            </div>
          )}
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Entrega</span>
              <strong>{shipping ? money(shipping) : "Grátis"}</strong>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-secondary p-4 text-xs leading-5 text-muted-foreground">
            Compra visualmente preparada para cartão, Pix e boleto. A ativação real depende das
            chaves e webhook do provedor de pagamento.
          </div>
        </aside>
      </section>
    </main>
  );
}
