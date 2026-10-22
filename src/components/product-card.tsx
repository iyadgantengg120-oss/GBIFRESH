"use client";

import { useRouter } from "next/navigation";
import { Plus, Star } from "lucide-react";
import type { Product } from "@/db/schema";
import { discountPct, rupiah } from "@/lib/format";
import { useCart } from "./cart-provider";

// Palet warna dan ikon per kategori
const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  "buah-fresh": { label: "🍇 Buah Fresh", bg: "bg-green-500/90", text: "text-white" },
  "buah-frozen": { label: "🧊 Buah Frozen", bg: "bg-sky-500/90", text: "text-white" },
  sayuran: { label: "🥬 Sayuran", bg: "bg-emerald-500/90", text: "text-white" },
  daging: { label: "🥩 Daging", bg: "bg-red-500/90", text: "text-white" },
  seafood: { label: "🦐 Seafood", bg: "bg-cyan-600/90", text: "text-white" },
  sembako: { label: "🍚 Sembako", bg: "bg-amber-600/90", text: "text-white" },
  protein: { label: "🥚 Protein", bg: "bg-yellow-500/90", text: "text-white" },
  "makanan-instan": { label: "🍜 Instan", bg: "bg-orange-500/90", text: "text-white" },
  bumbu: { label: "🧄 Bumbu", bg: "bg-rose-500/90", text: "text-white" },
  "frozen-food": { label: "❄️ Frozen Food", bg: "bg-indigo-500/90", text: "text-white" },
};

function getCat(cat: string) {
  return (
    CATEGORY_CONFIG[cat] ?? {
      label: cat,
      bg: "bg-zinc-500/90",
      text: "text-white",
    }
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const cfg = getCat(category);
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

export function StockLabel({
  stock,
  className = "",
}: {
  stock: number;
  className?: string;
}) {
  if (stock <= 0)
    return <span className={`font-bold text-rose-500 ${className}`}>Stok habis</span>;
  if (stock <= 5)
    return (
      <span className={`font-bold text-orange-500 ${className}`}>Sisa {stock}!</span>
    );
  return <span className={className}>Stok {stock}</span>;
}

export function ProductCard({
  product: p,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();
  const disc = discountPct(p.price, p.originalPrice);
  const soldOut = p.stock <= 0;

  return (
    <div
      onClick={() => router.push(`/produk/${p.slug}`)}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition active:scale-[0.97] ${
        compact ? "w-40 shrink-0 snap-start" : "w-full"
      }`}
    >
      {/* Gambar */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-300 group-active:scale-105 ${
            soldOut ? "opacity-60 grayscale" : ""
          }`}
        />
        {/* Badge kategori kiri atas */}
        <div className="absolute left-2 top-2">
          <CategoryBadge category={p.category} />
        </div>
        {/* Badge diskon kanan atas */}
        {disc && !soldOut && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow">
            -{disc}%
          </span>
        )}
        {/* Overlay stok habis */}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-black/30">
            <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-lg">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Konten */}
      <div className="flex flex-col gap-1 p-3 pb-2.5">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-snug text-zinc-800">
          {p.name}
        </h3>

        {/* Rating + stok */}
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold text-zinc-600">
            {(p.rating / 10).toFixed(1)}
          </span>
          <span aria-hidden>·</span>
          <StockLabel stock={p.stock} />
        </div>

        {/* Harga + tombol tambah */}
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold leading-tight text-green-600">
              {rupiah(p.price)}
            </p>
            <p className="truncate text-[10px] text-zinc-400">
              {p.originalPrice && (
                <span className="mr-1 line-through">{rupiah(p.originalPrice)}</span>
              )}
              /{p.unit}
            </p>
          </div>
          <button
            aria-label={`Tambah ${p.name} ke keranjang`}
            disabled={soldOut}
            onClick={(e) => {
              e.stopPropagation();
              add({
                slug: p.slug,
                name: p.name,
                price: p.price,
                unit: p.unit,
                image: p.image,
              });
            }}
            className={`grid size-8 shrink-0 place-items-center rounded-full text-white transition active:scale-90 ${
              soldOut
                ? "cursor-not-allowed bg-zinc-300"
                : "bg-green-500 shadow-[0_4px_10px_rgba(22,163,74,0.4)]"
            }`}
          >
            <Plus size={16} strokeWidth={2.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
