import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero-beach.jpg";
import selo from "@/assets/agua-limpa-selo.png.asset.json";
import monograma from "@/assets/agua-limpa-monograma.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "Nossa história — Água Limpa Beachwear" },
      { name: "description", content: "Conheça a essência da Água Limpa: sol, mar e liberdade." },
      { property: "og:title", content: "Nossa história — Água Limpa Beachwear" },
      {
        property: "og:description",
        content: "Conheça a essência da Água Limpa: sol, mar e liberdade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historia,
});

function Historia() {
  return (
    <main>
      <section className="section-shell grid min-h-[70vh] items-center gap-10 py-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="eyebrow">Nossa essência</p>
          <h1 className="mt-4 text-6xl leading-none md:text-7xl">O mar sempre nos traz de volta</h1>
          <p className="mt-7 max-w-lg leading-8 text-muted-foreground">
            A Água Limpa nasceu do desejo de transformar a sensação de liberdade à beira-mar em
            peças que respeitam o corpo, o tempo e a natureza. Criamos moda praia feminina com
            delicadeza, conforto e beleza duradoura.
          </p>
          <Button asChild className="mt-8">
            <Link to="/colecao">Conheça a coleção</Link>
          </Button>
        </div>
        <img
          src={hero}
          alt="Praia que inspira a Água Limpa"
          width={1440}
          height={1200}
          className="order-1 aspect-[4/5] w-full object-cover md:order-2"
        />
      </section>
      <section className="bg-accent py-20">
        <div className="section-shell grid items-center gap-12 md:grid-cols-[.8fr_1.2fr]">
          <img
            src={selo.url}
            alt="Selo circular Água Limpa Beachwear"
            className="mx-auto w-64 mix-blend-multiply"
          />
          <div>
            <p className="eyebrow">Sol • Mar • Liberdade</p>
            <h2 className="mt-4 text-5xl">Leveza que se veste</h2>
            <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
              Cada forma, cor e textura é escolhida para celebrar dias claros e movimentos naturais.
              Nosso turquesa vem do encontro da água com a luz; nossos tons de areia, da calma de
              caminhar descalça.
            </p>
          </div>
        </div>
      </section>
      <section className="section-shell grid items-center gap-12 py-20 md:grid-cols-2">
        <div className="bg-card p-10 text-center">
          <img src={monograma.url} alt="Monograma Á" className="mx-auto w-52" />
        </div>
        <div>
          <p className="eyebrow">Nossa assinatura</p>
          <h2 className="mt-4 text-5xl">Uma onda atravessa o Á</h2>
          <p className="mt-5 leading-8 text-muted-foreground">
            O monograma reúne o nome da marca e o movimento contínuo do oceano: uma lembrança de que
            liberdade é seguir o próprio fluxo.
          </p>
        </div>
      </section>
    </main>
  );
}
