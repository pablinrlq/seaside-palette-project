import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
export type CartItem = { product: Product; size: string; quantity: number };
type Store = {
  items: CartItem[];
  add: (product: Product, size: string, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, q: number) => void;
  count: number;
  subtotal: number;
};
const StoreContext = createContext<Store | undefined>(undefined);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agua-limpa-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("agua-limpa-cart", JSON.stringify(items));
  }, [items]);
  const value = useMemo<Store>(
    () => ({
      items,
      add: (product, size, quantity = 1) =>
        setItems((old) => {
          const found = old.find((x) => x.product.id === product.id && x.size === size);
          return found
            ? old.map((x) => (x === found ? { ...x, quantity: x.quantity + quantity } : x))
            : [...old, { product, size, quantity }];
        }),
      remove: (id) => setItems((old) => old.filter((x) => x.product.id !== id)),
      setQuantity: (id, q) =>
        setItems((old) =>
          old.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, q) } : x)),
        ),
      count: items.reduce((a, x) => a + x.quantity, 0),
      subtotal: items.reduce((a, x) => a + x.product.price * x.quantity, 0),
    }),
    [items],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider ausente");
  return value;
}
