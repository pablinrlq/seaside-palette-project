import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sun } from "lucide-react";
import campaign from "@/assets/campaign-wide.webp";
import brisa from "@/assets/product-brisa.jpg";
import { BrandLogo } from "@/components/store/brand-logo";
export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "Nossa essência | Água Limpa Beachwear" },
      {
        name: "description",
        content: "Sol, mar e liberdade. Conheça o que move a Água Limpa Beachwear.",
      },
    ],
  }),
  component: Historia,
});
function Historia() {
  return (
    <main id="conteudo">
      <section className="story-hero">
        <img
          src={campaign}
          alt="Água Limpa à beira do mar"
          width={1942}
          height={809}
          fetchPriority="high"
        />
        <div className="section-shell">
          <h1>
            Água Limpa.
            <br />
            <em>Por natureza.</em>
          </h1>
          <p>Sol, mar & liberdade.</p>
        </div>
      </section>
      <section className="section-shell py-16 md:py-24">
        <div className="grid items-start gap-10 md:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="eyebrow">Nossa essência</p>
            <BrandLogo seal className="mt-8 h-32 w-32" />
          </div>
          <div>
            <h2 className="text-5xl leading-none md:text-6xl">
              Tem coisas que
              <br />
              só o mar <em>explica.</em>
            </h2>
            <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground">
              A calma de um mergulho. A liberdade de andar descalça. A sensação de não querer estar
              em nenhum outro lugar. É desse encontro com o mar que nasce a essência da Água Limpa.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
              Peças para acompanhar o seu ritmo e fazer parte das suas lembranças favoritas. Para
              viver o sol com conforto, leveza e o seu jeito de ser.
            </p>
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="editorial-photo">
          <img
            src={brisa}
            alt="Saída Brisa em tecido claro à beira-mar"
            loading="lazy"
            width={960}
            height={1200}
          />
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">Do seu jeito</p>
          <h2>
            Leve no corpo.
            <br />
            <em>Livre na alma.</em>
          </h2>
          <p>
            Das cores que lembram a água às formas que acompanham o movimento. Cada peça é um
            convite para viver mais lá fora.
          </p>
          <Link to="/colecao" className="text-link">
            Encontre a sua <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="summer-note">
        <div className="section-shell">
          <Sun size={30} strokeWidth={1} />
          <p>
            O seu próximo verão
            <br />
            <em>já pode começar.</em>
          </p>
          <Link to="/colecao" className="shop-button">
            Conhecer a coleção <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
