import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/admin/dashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Gestão | Água Limpa Beachwear" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});
