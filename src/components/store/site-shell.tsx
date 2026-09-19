import { Link } from "@tanstack/react-router";
import { Instagram, Menu, Search, Settings, ShoppingBag, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "./brand-logo";
import { useStore } from "./store-context";
import { useCatalog } from "./catalog-context";
const nav = [
  ["/", "Início"],
  ["/colecao", "Coleção"],
  ["/biquinis", "Biquínis"],
  ["/maios", "Maiôs"],
  ["/saidas", "Saídas"],
  ["/acessorios", "Acessórios"],
  ["/historia", "Nossa história"],
] as const;
export function SiteShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const { count } = useStore();
  const { products } = useCatalog();
  const found = products.filter((p) =>
    `${p.name} ${p.category} ${p.color}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 py-2.5 text-center text-[10px] font-semibold uppercase text-primary-foreground sm:text-xs">
        Frete grátis acima de R$ 499 · Checkout interno preparado · Troca fácil em 30 dias
      </div>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-18 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-5 lg:gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            aria-controls="mobile-navigation"
          >
            {menu ? <X /> : <Menu />}
          </Button>
          <Link to="/" className="min-w-0 justify-self-center lg:justify-self-start">
            <BrandLogo className="h-auto w-36 max-w-full sm:w-44 md:h-auto" />
          </Link>
          <nav
            aria-label="Navegação principal"
            className="hidden min-w-0 flex-nowrap items-center justify-center gap-4 lg:flex xl:gap-6"
          >
            {nav.map(([to, label]) => (
              <Link key={to} to={to} className="nav-link">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex justify-self-end gap-0 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch(!search)}
              aria-label="Buscar"
            >
              <Search />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild>
              <Link to="/admin" aria-label="Painel administrativo">
                <Settings />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/sacola" aria-label={`Sacola com ${count} itens`} className="relative">
                <ShoppingBag />
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] text-accent-foreground">
                  {count}
                </span>
              </Link>
            </Button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-navigation"
            aria-label="Navegação mobile"
            className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-card px-5 pb-7 pt-3 lg:hidden"
          >
            {nav.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenu(false)}
                className="flex min-h-12 items-center justify-between border-b border-border font-serif text-xl"
              >
                {label}
                <span className="text-primary">→</span>
              </Link>
            ))}
            <Link
              to="/admin"
              onClick={() => setMenu(false)}
              className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
            >
              <Settings className="h-4 w-4" /> Administrar loja
            </Link>
          </nav>
        )}
        {search && (
          <div className="border-t border-border bg-card px-5 py-5">
            <div className="mx-auto max-w-xl">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque por produto, categoria ou cor..."
                aria-label="Buscar produtos"
              />
              {query && (
                <div className="mt-3 grid gap-1">
                  {found.length ? (
                    found.slice(0, 5).map((p) => (
                      <Link
                        key={p.id}
                        to="/produto/$slug"
                        params={{ slug: p.slug }}
                        onClick={() => setSearch(false)}
                        className="flex items-center gap-3 border-b border-border py-2.5 text-sm"
                      >
                        <img src={p.image} alt="" className="h-12 w-10 object-cover" />
                        <span className="flex-1">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.category}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="py-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      {children}
      <Footer />
    </div>
  );
}
function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="section-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Moda praia feita para viver o sol, sentir o mar e escolher a liberdade.
          </p>
        </div>
        <div>
          <h3 className="footer-title">Navegue</h3>
          <Link to="/colecao">Coleção</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/historia">Nossa história</Link>
          <Link to="/admin">Painel da loja</Link>
        </div>
        <div>
          <h3 className="footer-title">Atendimento</h3>
          <a href="mailto:oi@agualimpa.com.br">Fale conosco</a>
          <span>Trocas e devoluções</span>
          <span>Envios e prazos</span>
        </div>
        <div>
          <h3 className="footer-title">Siga a maré</h3>
          <span className="flex items-center gap-2">
            <Instagram className="h-4 w-4" /> Instagram
          </span>
          <span>Pinterest</span>
        </div>
      </div>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        © 2026 ÁGUA LIMPA BEACHWEAR · SOL • MAR • LIBERDADE
      </div>
    </footer>
  );
}
