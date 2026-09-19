import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultCategories, products as initialProducts, type Product } from "@/lib/catalog";

type CatalogContextValue = {
  products: Product[];
  categories: string[];
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  addCategory: (name: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => boolean;
  resetCatalog: () => void;
  importCatalog: (data: unknown) => boolean;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);
const STORAGE_KEY = "agua-limpa-catalog-v1";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { products?: Product[]; categories?: string[] };
        if (Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
          setCatalogProducts(parsed.products);
          setCategories(parsed.categories);
        }
      }
    } catch {
      setCatalogProducts(initialProducts);
      setCategories(defaultCategories);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: catalogProducts, categories }));
  }, [catalogProducts, categories, ready]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products: catalogProducts,
      categories,
      saveProduct: (product) =>
        setCatalogProducts((old) =>
          old.some((item) => item.id === product.id)
            ? old.map((item) => (item.id === product.id ? product : item))
            : [product, ...old],
        ),
      deleteProduct: (id) => setCatalogProducts((old) => old.filter((item) => item.id !== id)),
      duplicateProduct: (id) =>
        setCatalogProducts((old) => {
          const source = old.find((item) => item.id === id);
          if (!source) return old;
          const stamp = Date.now().toString();
          return [
            {
              ...source,
              id: stamp,
              slug: `${source.slug}-copia-${stamp.slice(-4)}`,
              name: `${source.name} — cópia`,
              featured: false,
            },
            ...old,
          ];
        }),
      addCategory: (name) => {
        const clean = name.trim();
        if (!clean || categories.some((category) => category.toLowerCase() === clean.toLowerCase()))
          return false;
        setCategories((old) => [...old, clean]);
        return true;
      },
      renameCategory: (oldName, newName) => {
        const clean = newName.trim();
        if (
          !clean ||
          categories.some(
            (category) => category !== oldName && category.toLowerCase() === clean.toLowerCase(),
          )
        )
          return false;
        setCategories((old) => old.map((category) => (category === oldName ? clean : category)));
        setCatalogProducts((old) =>
          old.map((product) =>
            product.category === oldName ? { ...product, category: clean } : product,
          ),
        );
        return true;
      },
      deleteCategory: (name) => {
        if (catalogProducts.some((product) => product.category === name)) return false;
        setCategories((old) => old.filter((category) => category !== name));
        return true;
      },
      resetCatalog: () => {
        setCatalogProducts(initialProducts);
        setCategories(defaultCategories);
      },
      importCatalog: (data) => {
        if (!data || typeof data !== "object") return false;
        const parsed = data as { products?: Product[]; categories?: string[] };
        if (!Array.isArray(parsed.products) || !Array.isArray(parsed.categories)) return false;
        const valid = parsed.products.every(
          (product) =>
            product.id &&
            product.name &&
            product.slug &&
            product.category &&
            typeof product.price === "number",
        );
        if (!valid) return false;
        setCatalogProducts(parsed.products);
        setCategories(parsed.categories);
        return true;
      },
    }),
    [catalogProducts, categories],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("CatalogProvider ausente");
  return value;
}
