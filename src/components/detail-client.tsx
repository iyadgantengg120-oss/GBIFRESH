"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  Minus,
  Plus,
  RefreshCcw,
  ShoppingBasket,
  Star,
  Store,
  Zap,
} from "lucide-react";
import type { Product } from "@/db/schema";
import { discountPct, rupiah, waLink } from "@/lib/format";
import { useCart } from "./cart-provider";
import { useSettings, trackWaClick } from "./site-ctx";
import { CategoryBadge, ProductCard } from "./product-card";
import { WhatsAppIcon } from "./home-client";

export function DetailClient({
  product: p,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const router = useRouter();
  const settings = useSettings();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const disc = discountPct(p.price, p.originalPrice);

  const cartItem = {
    slug: p.slug,
    name: p.name,
    price: p.price,
    unit: p.unit,
    image: p.image,
  };

  return (
    <div className="pb-28">
      {/* Foto produk */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="absolute left-3.5 top-[max(env(safe-area-inset-top),0.9rem)] grid size-10 place-items-center rounded-full bg-white/90 text-zinc-700 shadow-lg backdrop-blur transition active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="absolute left-3.5 bottom-8 flex gap-1.5">
          <CategoryBadge category={p.category} />
          {disc && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
              Hemat {disc}%
            </span>
          )}
        </div>
      </div>

      {/* Konten */}
      <div className="-mt-6 relative rounded-t-[1.75rem] bg-[#f7fdf7] px-4 pt-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />

        <h1 className="text-[19px] font-black leading-tight tracking-tight text-zinc-900">
          {p.name}
        </h1>

        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-600">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {(p.rating / 10).toFixed(1)}
          </span>
          <span
            className={`rounded-full px-2 py-1 font-semibold ${
              p.stock <= 0
                ? "bg-rose-50 text-rose-600"
                : p.stock <= 5
                  ? "bg-orange-50 text-orange-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {p.stock <= 0
              ? "Stok habis"
              : p.stock <= 5
                ? `Sisa ${p.stock}`
                : `Stok ${p.stock}`}
          </span>
        </div>

        <div className="mt-3.5 rounded-2xl border border-black/5 bg-white p-3.5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Harga per {p.unit}
              </p>
              <p className="mt-0.5 text-[24px] font-black leading-none text-emerald-600">
                {rupiah(p.price)}
              </p>
              {p.originalPrice && (
                <p className="mt-1 text-[11px] text-zinc-400 line-through">
                  {rupiah(p.originalPrice)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-full bg-zinc-100 p-1">
              <button
                aria-label="Kurangi"
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="grid size-8 place-items-center rounded-full bg-white text-zinc-600 shadow-sm transition active:scale-90"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-6 text-center text-[14px] font-extrabold text-zinc-800">
                {qty}
              </span>
              <button
                aria-label="Tambah"
                disabled={p.stock <= 0 || qty >= p.stock}
                onClick={() => setQty((v) => Math.min(p.stock, v + 1))}
                className="grid size-8 place-items-center rounded-full bg-emerald-500 text-white shadow-sm transition active:scale-90 disabled:bg-zinc-300"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Layanan */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: Zap, label: "Instan Gojek / Shopee" },
            { icon: Store, label: "Ambil di Gudang GBI" },
            { icon: RefreshCcw, label: "Garansi tukar" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/5 bg-white px-1 py-3"
            >
              <f.icon size={17} className="text-emerald-600" />
              <span className="text-center text-[9.5px] font-semibold leading-tight text-zinc-500">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* Deskripsi */}
        <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-zinc-400">
            <BadgeCheck size={13} className="text-emerald-600" /> Deskripsi
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {p.description}
          </p>
        </div>

        {/* Rekomendasi */}
        {related.length > 0 && (
          <div className="mt-5">
            <h2 className="text-[15px] font-black tracking-tight text-zinc-800">
              Buah Serupa Lainnya
            </h2>
            <div className="mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((r) => (
                <ProductCard key={r.id} product={r} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA bawah */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto flex w-[min(28rem,100%)] items-center gap-2 border-t border-black/5 bg-white/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <a
            href={waLink(
              `Halo GBIFRESH, saya mau tanya stok ${p.name} (${rupiah(p.price)}/${p.unit}).`,
              settings.waNumber,
            )}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat admin tentang produk ini"
            onClick={() => trackWaClick("product")}
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#25D366]/15 text-[#128C7E] transition active:scale-95"
          >
            <WhatsAppIcon size={22} />
          </a>
          {p.stock <= 0 ? (
            <div className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-zinc-200 text-[13px] font-extrabold text-zinc-400">
              Stok Habis — coba lagi nanti ya
            </div>
          ) : (
            <>
              <button
                onClick={() => add(cartItem, qty)}
                className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-500 px-3.5 text-[12.5px] font-extrabold text-emerald-600 transition active:scale-[0.97]"
              >
                <ShoppingBasket size={17} /> + Keranjang
              </button>
              <button
                onClick={() => {
                  add(cartItem, qty);
                  router.push("/keranjang");
                }}
                className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-[13px] font-extrabold text-white shadow-[0_8px_20px_rgba(16,185,129,0.4)] transition active:scale-[0.97]"
              >
                Beli Sekarang · {rupiah(p.price * qty)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
