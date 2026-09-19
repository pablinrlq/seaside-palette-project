import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Sun, Waves, Truck, MoveUpRight } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/hero-beach.jpg";
import campaign from "@/assets/campaign-wide.webp";
import coral from "@/assets/product-coral.jpg";
import marina from "@/assets/product-marina.jpg";
import brisa from "@/assets/product-brisa.jpg";
import concha from "@/assets/product-concha.jpg";
import { ProductCard } from "@/components/store/product-card";
import { useCatalog } from "@/components/store/catalog-context";
import { BrandLogo } from "@/components/store/brand-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Água Limpa Beachwear | Vista seu próximo verão" },
      {
        name: "description",
        content:
          "Biquínis, maiôs e saídas para dias que você não quer que acabem. Descubra a coleção Água Limpa Beachwear.",
      },
      { property: "og:title", content: "Água Limpa Beachwear | Sol, mar e liberdade" },
      {
        property: "og:description",
        content: "Encontre sua próxima peça favorita. Conheça a coleção Água Limpa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
const categories = [
  { name: "Biquínis", to: "/biquinis", image: coral, caption: "Seu sol, suas regras." },
  { name: "Maiôs", to: "/maios", image: marina, caption: "Do primeiro mergulho ao último raio." },
  { name: "Saídas", to: "/saidas", image: brisa, caption: "Leveza para ir além da praia." },
  { name: "Acessórios", to: "/acessorios", image: concha, caption: "O verão mora nos detalhes." },
] as const;
const selections = ["Destaques", "Biquínis", "Maiôs", "Saídas", "Acessórios"];

function Index() {
  const { products } = useCatalog();
  const [selection, setSelection] = useState("Destaques");
  const highlights = products
    .filter((p) => (selection === "Destaques" ? p.featured : p.category === selection))
    .slice(0, 4);
  return (
    <main id="conteudo">
      <section className="campaign-hero">
        <picture>
          <source media="(min-width: 768px)" srcSet={campaign} />
          <img
            src={hero}
            alt="Moda praia Água Limpa, com maiô verde em uma praia de águas cristalinas"
            width={1440}
            height={1200}
            fetchPriority="high"
            className="campaign-image"
          />
        </picture>
        <div className="section-shell campaign-content">
          <p className="campaign-eyebrow">
            <span /> A estação é sua.
          </p>
          <h1 className="sr-only">Moda praia para o seu próximo verão</h1>
          <p className="campaign-subtitle">Vista a liberdade de ser você.</p>
          <Link to="/colecao" className="shop-button shop-button-light">
            Encontrar meu verão <ArrowUpRight size={18} />
          </Link>
          <a href="#favoritos" className="campaign-scroll">
            <ArrowDown size={14} /> Um novo dia. Sua nova peça favorita.
          </a>
        </div>
        <p className="campaign-side">BEACHWEAR · SOL, MAR & LIBERDADE</p>
        <div className="campaign-caption">
          <span>DIAS DE SOL / ÁGUA LIMPA</span>
          <span>Feita para estar com você.</span>
        </div>
      </section>
      <section className="promise-strip" aria-label="Água Limpa">
        <div className="section-shell">
          <span>
            <Truck /> Frete grátis a partir de R$ 499
          </span>
          <span>
            <Sun /> Para todos os seus dias de sol
          </span>
          <span>
            <Waves /> Leveza em cada movimento
          </span>
        </div>
      </section>
      <section id="favoritos" className="section-shell collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">O sol chama. Você escolhe.</p>
            <h2>
              Seu próximo <em>favorito.</em>
            </h2>
          </div>
          <Link to="/colecao" className="text-link">
            Toda a coleção <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="collection-tabs" role="tablist" aria-label="Seleção de produtos">
          {selections.map((item, index) => (
            <button
              key={item}
              id={"tab-" + item}
              type="button"
              role="tab"
              tabIndex={selection === item ? 0 : -1}
              aria-selected={selection === item}
              aria-controls="featured-products"
              onClick={() => setSelection(item)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % selections.length
                    : event.key === "ArrowLeft"
                      ? (index + selections.length - 1) % selections.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? selections.length - 1
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                setSelection(selections[next] ?? "Destaques");
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>("button")
                  [next]?.focus();
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div
          id="featured-products"
          role="tabpanel"
          aria-labelledby={"tab-" + selection}
          className="product-grid"
        >
          {highlights.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {!highlights.length && (
            <p className="py-10 text-sm text-muted-foreground">Novas peças estão chegando.</p>
          )}
        </div>
      </section>
      <section className="category-section">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Encontre o seu ritmo</p>
              <h2>
                Qual é o seu <em>verão?</em>
              </h2>
            </div>
            <p className="section-note">
              Do mergulho ao encontro depois da praia.
              <br />
              Uma peça para cada momento seu.
            </p>
          </div>
          <div className="category-grid">
            {categories.map((category, i) => (
              <Link to={category.to} key={category.to} className="category-item">
                <div className="category-image">
                  <img
                    src={category.image}
                    alt={category.name + " Água Limpa"}
                    loading="lazy"
                    width={960}
                    height={1200}
                  />
                  <span className="category-index">0{i + 1}</span>
                  <span className="category-arrow">
                    <ArrowUpRight />
                  </span>
                </div>
                <h3>{category.name}</h3>
                <p>{category.caption}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="editorial-photo">
          <img
            src={hero}
            alt="Maiô Água Limpa em um dia de sol à beira-mar"
            loading="lazy"
            width={1440}
            height={1200}
          />
          <span>UM CONVITE A VIVER LÁ FORA.</span>
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">Menos pressa. Mais mar.</p>
          <h2>
            O melhor
            <br />
            do verão é<br />
            <em>sentir.</em>
          </h2>
          <p>
            O sol na pele. O sal no cabelo. A leveza de uma peça que acompanha você. A Água Limpa é
            um convite para colecionar esses momentos.
          </p>
          <Link to="/historia" className="text-link">
            Mergulhe na nossa história <ArrowUpRight size={18} />
          </Link>
          <BrandLogo seal className="editorial-seal" />
        </div>
      </section>
      <section className="section-shell contact-band">
        <div>
          <p className="eyebrow">Vamos conversar?</p>
          <h2>
            Seu verão começa
            <br />
            com uma boa escolha.
          </h2>
        </div>
        <a href="mailto:oi@agualimpa.com.br" className="contact-link">
          <span>
            Fale com a Água Limpa<small>oi@agualimpa.com.br</small>
          </span>
          <MoveUpRight size={25} strokeWidth={1} />
        </a>
      </section>
    </main>
  );
}
