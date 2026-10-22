"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2 } from "lucide-react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  qty: number;
};

type Toast = { id: number; text: string };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const STORAGE_KEY = "gbifresh-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* abaikan */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* abaikan */
    }
  }, [items, loaded]);

  const pushToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      2200,
    );
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const found = prev.find((i) => i.slug === item.slug);
        if (found) {
          return prev.map((i) =>
            i.slug === item.slug ? { ...i, qty: Math.min(99, i.qty + qty) } : i,
          );
        }
        return [...prev, { ...item, qty }];
      });
      pushToast(`${item.name} masuk keranjang`);
    },
    [pushToast],
  );

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty: Math.min(99, qty) } : i)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    return {
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, add, setQty, remove, clear }}
    >
      {children}
      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in flex items-center gap-2 rounded-full bg-zinc-900/95 py-2.5 pl-3 pr-4 text-xs font-medium text-white shadow-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="line-clamp-1">{t.text}</span>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
