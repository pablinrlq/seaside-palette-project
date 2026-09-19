import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Menu, Search, ShoppingBag, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandLogo } from "./brand-logo";
import { useStore } from "./store-context";
import { useCatalog } from "./catalog-context";
import { money } from "@/lib/catalog";

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.startsWith("/admin") ? children : <PublicShell>{children}</PublicShell>;
}
function PublicShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const { count } = useStore();
  const { products } = useCatalog();
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const found = products
    .filter((p) =>
      normalize(p.name + " " + p.category + " " + p.color).includes(normalize(query.trim())),
    )
    .slice(0, 6);
  return (
    <div className="storefront">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <div className="announcement">
        <span>Sol, mar & liberdade</span>
        <p>
          <Sun size={13} /> Frete grátis a partir de R$ 499
        </p>
        <Link to="/colecao">
          Seu próximo verão começa aqui <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <div className="section-shell header-row">
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu-button"
                aria-label="Abrir menu"
                title="Menu"
              >
                <Menu strokeWidth={1.5} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(90vw,380px)] overflow-y-auto">
              <SheetTitle>
                <BrandLogo className="h-auto w-40 md:h-auto" />
              </SheetTitle>
              <SheetDescription className="mt-5 text-xs">Sol, mar & liberdade.</SheetDescription>
              <nav aria-label="Navegação mobile" className="mobile-navigation">
                {nav.map(([to, label]) => (
                  <Link key={to} to={to} onClick={() => setMenu(false)}>
                    {label}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ))}
              </nav>
              <a href="mailto:oi@agualimpa.com.br" className="text-link mt-10">
                Fale com a Água Limpa <ArrowRight size={16} />
              </a>
            </SheetContent>
          </Sheet>
          <Link to="/" className="header-logo" aria-label="Água Limpa, início">
            <BrandLogo className="h-auto w-full md:h-auto" />
          </Link>
          <nav aria-label="Navegação principal" className="desktop-navigation">
            {nav.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="nav-link"
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "nav-link is-active" }}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch(true)}
              aria-label="Buscar"
              title="Buscar peças"
            >
              <Search strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/sacola"
                aria-label={"Sacola com " + count + " itens"}
                title="Sua sacola"
                className="bag-button"
              >
                <ShoppingBag strokeWidth={1.5} />
                <span className="bag-count">{count}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <Dialog open={search} onOpenChange={setSearch}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="font-serif text-3xl font-normal">O que vai com você?</DialogTitle>
          <DialogDescription>Encontre sua peça por nome, cor ou categoria.</DialogDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Biquíni, maiô, turquesa..."
              aria-label="Buscar produtos"
              className="h-12 pl-11 pr-11"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                <X />
              </Button>
            )}
          </div>
          <p className="eyebrow mt-2">{query ? "Peças encontradas" : "Para se apaixonar"}</p>
          <div className="search-results">
            {found.map((p) => (
              <Link
                key={p.id}
                to="/produto/$slug"
                params={{ slug: p.slug }}
                onClick={() => setSearch(false)}
                className="search-result"
              >
                <img src={p.image} alt={p.name} width={64} height={80} />
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.category} · {p.color}
                  </small>
                </span>
                <span>{money(p.price)}</span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
            {!found.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Não encontramos essa peça. Experimente outra palavra.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {children}
      <Footer />
    </div>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-compact">
        <div className="footer-brand">
          <BrandLogo className="h-auto w-36 md:h-auto brightness-0 invert" />
        </div>
        <nav aria-label="Informações da loja">
          <Link to="/historia">Nossa história</Link>
          <a href="mailto:oi@agualimpa.com.br">
            Fale conosco <ArrowUpRight size={13} />
          </a>
        </nav>
      </div>
      <div className="section-shell footer-bottom">
        <p>© {new Date().getFullYear()} Água Limpa Beachwear</p>
        <Link to="/admin">
          Área administrativa <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
