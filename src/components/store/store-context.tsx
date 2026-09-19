import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
export type CartItem = { product: Product; size: string; quantity: number };
type Store = {
  items: CartItem[];
  add: (product: Product, size: string, quantity?: number) => void;
  remove: (id: string, size: string) => void;
  setQuantity: (id: string, size: string, quantity: number) => void;
  count: number;
  subtotal: number;
};
const StoreContext = createContext<Store | undefined>(undefined);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("agua-limpa-cart") ?? "[]");
      if (Array.isArray(saved))
        setItems(
          saved.filter(
            (item: CartItem) =>
              item?.product?.id &&
              typeof item.size === "string" &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              Number.isFinite(item.product.price),
          ),
        );
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("agua-limpa-cart", JSON.stringify(items));
      } catch {
        /* The cart remains usable when storage is unavailable. */
      }
    }
  }, [items, ready]);
  const value = useMemo<Store>(
    () => ({
      items,
      add: (product, size, quantity = 1) =>
        setItems((old) => {
          if (!product.sizes.includes(size) || product.stock <= 0) return old;
          const inBag = old
            .filter((x) => x.product.id === product.id)
            .reduce((sum, x) => sum + x.quantity, 0);
          const amount = Math.min(
            Math.max(1, Math.floor(quantity)),
            Math.max(0, product.stock - inBag),
          );
          if (!amount) return old;
          const found = old.find((x) => x.product.id === product.id && x.size === size);
          return found
            ? old.map((x) => (x === found ? { ...x, product, quantity: x.quantity + amount } : x))
            : [...old, { product, size, quantity: amount }];
        }),
      remove: (id, size) =>
        setItems((old) => old.filter((x) => !(x.product.id === id && x.size === size))),
      setQuantity: (id, size, quantity) =>
        setItems((old) =>
          old.map((x) => {
            if (x.product.id !== id || x.size !== size) return x;
            const others = old
              .filter((item) => item.product.id === id && item.size !== size)
              .reduce((sum, item) => sum + item.quantity, 0);
            return {
              ...x,
              quantity: Math.max(1, Math.min(Math.floor(quantity), x.product.stock - others)),
            };
          }),
        ),
      count: items.reduce((sum, x) => sum + x.quantity, 0),
      subtotal: items.reduce((sum, x) => sum + x.product.price * x.quantity, 0),
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
