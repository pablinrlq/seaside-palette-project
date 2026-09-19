import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/store/catalog-page";
export const Route = createFileRoute("/acessorios")({
  head: () => ({
    meta: [
      { title: "Acessórios — Água Limpa Beachwear" },
      { name: "description", content: "Os detalhes naturais que completam os dias de verão." },
      { property: "og:title", content: "Acessórios — Água Limpa Beachwear" },
      {
        property: "og:description",
        content: "Os detalhes naturais que completam os dias de verão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CatalogPage
      title="Acessórios"
      intro="Os detalhes naturais que completam os dias de verão."
      category="Acessórios"
    />
  ),
});
