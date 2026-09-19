import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultCategories, products as initialProducts, type Product } from "@/lib/catalog";

const CatalogContext = createContext<{ products: Product[]; categories: string[] } | undefined>(
  undefined,
);
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState({
    products: initialProducts,
    categories: defaultCategories,
  });
  useEffect(() => {
    let active = true;
    const refresh = () =>
      fetch("/api/catalog")
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json();
          if (active && Array.isArray(data.products) && Array.isArray(data.categories))
            setCatalog(data);
        })
        .catch(() => undefined);
    void refresh();
    window.addEventListener("catalog-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("catalog-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}
export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("CatalogProvider ausente");
  return value;
}
