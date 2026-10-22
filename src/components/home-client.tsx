"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Flame,
  LayoutGrid,
  MapPin,
  PackageSearch,
  Percent,
  Search,
  ShieldCheck,
  Leaf,
  Star,
  Store,
  Truck,
  X,
  Zap,
} from "lucide-react";
import type { Banner, Faq, Product } from "@/db/schema";
import { waLink } from "@/lib/format";
import { ProductCard } from "./product-card";
import { useSettings, trackWaClick } from "./site-ctx";

// ------------------------------------------------------------ ikon WA asli
export function WhatsAppIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
export { WhatsAppIcon as WAIcon };

const FALLBACK_BANNERS: Banner[] = [
  {
    id: -1,
    title: "Buah Segar,\nDiantar Hari Ini",
    subtitle: "Lokal & impor, panen harian",
    badge: "Panen Harian",
    image:
      "https://images.pexels.com/photos/5971857/pexels-photo-5971857.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ctaText: "Belanja Sekarang",
    ctaLink: "#katalog",
    sort: 0,
    active: true,
  },
  {
    id: -2,
    title: "Pengiriman Fleksibel",
    subtitle: "Instan Gojek/Shopee · ambil di tempat",
    badge: "Area Jogja",
    image:
      "https://images.pexels.com/photos/5965670/pexels-photo-5965670.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ctaText: "Lihat Katalog",
    ctaLink: "#katalog",
    sort: 1,
    active: true,
  },
];

const FALLBACK_FAQS: { id: number; q: string; a: string }[] = [
  {
    id: -1,
    q: "Bagaimana cara memesan?",
    a: "Pilih buah favoritmu, masukkan keranjang, lalu checkout. Pesanan otomatis diteruskan ke WhatsApp admin GBIFRESH untuk dikonfirmasi.",
  },
  {
    id: -2,
    q: "Berapa ongkos kirimnya?",
    a: "Ongkir menyesuaikan lokasimu dan diinfokan admin saat konfirmasi. Pengiriman bisa instan via Gojek/Shopee, atau ambil sendiri di toko tanpa ongkir.",
  },
  {
    id: -3,
    q: "Bagaimana cara bayarnya?",
    a: "Pembayaran diatur admin via WhatsApp — bisa COD, transfer bank, atau QRIS. Pilih yang paling nyaman buat kamu.",
  },
  {
    id: -4,
    q: "Kalau buahnya busuk/rusak gimana?",
    a: "Tenang, ada garansi tukar! Kirim foto bukti ke admin maksimal 1×24 jam, buah diganti baru atau uang kembali.",
  },
];

const TABS = [
  { id: "semua", label: "Semua", icon: LayoutGrid, emoji: "" },
  { id: "buah-fresh", label: "Buah Fresh", icon: Leaf, emoji: "🍇" },
  { id: "buah-frozen", label: "Buah Frozen", icon: Leaf, emoji: "🧊" },
  { id: "sayuran", label: "Sayuran", icon: Leaf, emoji: "🥬" },
  { id: "daging", label: "Daging", icon: Leaf, emoji: "🥩" },
  { id: "seafood", label: "Seafood", icon: Leaf, emoji: "🦐" },
  { id: "sembako", label: "Sembako", icon: Leaf, emoji: "🍚" },
  { id: "protein", label: "Protein", icon: Leaf, emoji: "🥚" },
  { id: "makanan-instan", label: "Instan", icon: Leaf, emoji: "🍜" },
  { id: "bumbu", label: "Bumbu", icon: Leaf, emoji: "🧄" },
  { id: "frozen-food", label: "Frozen Food", icon: Leaf, emoji: "❄️" },
  { id: "promo", label: "Promo", icon: Percent, emoji: "🔥" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const TESTIMONIALS = [
  {
    name: "Ratna Dewi",
    area: "Umbulharjo, Kota Jogja",
    text: "Alpukatnya matang pas, langsung bisa dimakan. Pesan pagi, sampai rumah sebelum dzuhur. Langganan tetap!",
  },
  {
    name: "Budi Santoso",
    area: "Depok, Sleman",
    text: "Salak pondohnya manis semua, nggak ada yang zonk. Rasanya kayak milih sendiri langsung di kebun Turi.",
  },
  {
    name: "Michelle Tan",
    area: "Pleret, Bantul",
    text: "Anggur impornya segar banget, packing rapi. Anak-anak di rumah sampai rebutan. Recommended!",
  },
];

function useCountdown() {
  const [label, setLabel] = useState("00:00:00");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLabel([h, m, s].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function HomeClient({ products }: { products: Product[] }) {
  const settings = useSettings();
  const [tab, setTab] = useState<TabId>("semua");
  const [q, setQ] = useState("");
  const countdown = useCountdown();

  // Banner & FAQ dari database (fallback ke bawaan)
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [faqList, setFaqList] = useState(FALLBACK_FAQS.map((f) => f));
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const touchX = useRef(0);

  useEffect(() => {
    fetch("/api/cms/banners?active=1")
      .then((r) => r.json())
      .then((d: Banner[]) => {
        if (Array.isArray(d) && d.length > 0) setBanners(d);
      })
      .catch(() => {});
    fetch("/api/cms/faqs?active=1")
      .then((r) => r.json())
      .then((d: Faq[]) => {
        if (Array.isArray(d) && d.length > 0)
          setFaqList(d.map((f) => ({ id: f.id, q: f.question, a: f.answer })));
      })
      .catch(() => {});
  }, []);

  // slide bergeser otomatis
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % banners.length), 4500);
    return () => clearInterval(id);
  }, [banners.length]);

  const promos = useMemo(
    () => products.filter((p) => p.originalPrice != null),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "semua" && tab !== "promo")
      list = list.filter((p) => p.category === tab);
    if (tab === "promo") list = list.filter((p) => p.originalPrice != null);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(needle));
    }
    return list;
  }, [products, tab, q]);

  const searching = q.trim().length > 0;

  return (
    <div className="pb-32">
      {/* ------------------------------------------------ HEADER */}
       <header className="sticky top-0 z-30 rounded-b-[1.75rem] bg-gradient-to-br from-green-600 via-green-500 to-lime-500 px-4 pb-4 pt-[max(env(safe-area-inset-top),0.9rem)] shadow-[0_8px_24px_rgba(22,101,52,0.3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/20 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo || "/logo-gbifresh.svg"}
                alt={settings.brandName}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-[17px] font-black leading-none tracking-tight text-white">
                {settings.brandName}
              </p>
              <p className="mt-1 text-[10px] font-medium leading-none text-green-50/90">
                Buah Segar Lokal &amp; Impor
              </p>
            </div>
          </div>
          <a
            href={waLink("Halo GBIFRESH, saya mau tanya soal buahnya.", settings.waNumber)}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat admin WhatsApp"
            onClick={() => trackWaClick("header")}
            className="grid size-10 place-items-center rounded-2xl bg-white/25 text-white transition active:scale-95"
          >
            <WhatsAppIcon size={20} />
          </a>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-green-50">
          <MapPin size={12} />
          <span>Diantar ke: Yogyakarta &amp; sekitarnya</span>
        </div>

        <div className="mt-2.5 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <Search size={17} className="shrink-0 text-green-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari mangga, alpukat, anggur..."
            className="w-full bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400"
          />
          {q && (
            <button
              aria-label="Hapus pencarian"
              onClick={() => setQ("")}
              className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------ BANNER AUTO SLIDE */}
      {!searching && (
        <section
          className="mt-4 select-none px-4"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50)
              setSlide((s) =>
                dx < 0
                  ? (s + 1) % banners.length
                  : (s - 1 + banners.length) % banners.length,
              );
          }}
        >
          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {banners.map((b) => (
                <div key={b.id} className="relative h-44 w-full shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-900/45 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-center p-5">
                    {b.badge && (
                      <span className="w-fit rounded-full bg-lime-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-950">
                        {b.badge}
                      </span>
                    )}
                    <h1 className="mt-2 whitespace-pre-line text-[21px] font-black leading-tight text-white">
                      {b.title}
                    </h1>
                    {b.subtitle && (
                      <p className="mt-0.5 text-[11.5px] font-medium text-emerald-50/95">
                        {b.subtitle}
                      </p>
                    )}
                    {b.ctaText && (
                      <a
                        href={b.ctaLink || "#katalog"}
                        className="mt-3 flex w-fit items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[11px] font-bold text-emerald-700 shadow transition active:scale-95"
                      >
                        {b.ctaText} <ChevronRight size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {banners.length > 1 && (
            <div className="mt-2.5 flex justify-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? "w-5 bg-emerald-500" : "w-1.5 bg-zinc-300"
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------ INFO PENGIRIMAN */}
      {!searching && (
        <section className="mx-4 mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Zap, t: "Antar Instan", d: "Gojek / Shopee" },
            { icon: Store, t: "Ambil di Gudang", d: "Tanpa ongkir" },
            { icon: Truck, t: "Ongkir?", d: "Tanya admin WA" },
          ].map((f) => (
            <div
              key={f.t}
              className="flex flex-col items-center gap-1 rounded-2xl border border-black/5 bg-white px-1 py-3 shadow-sm"
            >
              <f.icon size={17} className="text-emerald-600" />
              <p className="text-center text-[10px] font-bold leading-tight text-zinc-700">{f.t}</p>
              <p className="text-center text-[9px] leading-tight text-zinc-400">{f.d}</p>
            </div>
          ))}
        </section>
      )}

      {/* ------------------------------------------------ TAB KATEGORI */}
      <section className="mt-4 px-4">
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const countFor =
              t.id === "promo"
                ? promos.length
                : t.id === "semua"
                  ? products.length
                  : products.filter((p) => p.category === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex min-h-[4.3rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center text-[10px] font-bold leading-tight transition active:scale-[0.97] ${
                  active
                    ? "border-green-600 bg-green-600 text-white shadow-[0_6px_16px_rgba(22,163,74,0.25)]"
                    : "border-zinc-200 bg-white text-zinc-500"
                }`}
              >
                <span className="text-[14px]">{t.emoji ? t.emoji : <Icon size={14} />}</span>
                <span className="line-clamp-2">{t.label}</span>
                <span
                  className={`rounded-full px-1.5 py-px text-[8.5px] font-extrabold ${
                    active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {countFor}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ FLASH SALE */}
      {!searching && tab === "semua" && promos.length > 0 && (
        <section className="mx-4 mt-4 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-3.5 shadow-[0_12px_28px_rgba(249,115,22,0.3)]">
          <div className="flex items-center justify-between px-1 pb-2.5">
            <div className="flex items-center gap-1.5 text-white">
              <Flame size={17} className="fill-amber-200 text-amber-200" />
              <span className="text-[14px] font-black">Flash Sale</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-white/95">
              <span className="font-medium opacity-90">Berakhir dalam</span>
              <span className="rounded-md bg-orange-700/70 px-1.5 py-0.5 font-mono tracking-wider">
                {countdown}
              </span>
            </div>
          </div>
          <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {promos.map((p) => (
              <div key={p.id} className="snap-start">
                <ProductCard product={p} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ KATALOG */}
      <section id="katalog" className="mt-5 scroll-mt-28 px-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[17px] font-black tracking-tight text-zinc-800">
              {searching
                ? "Hasil Pencarian"
                : tab === "promo"
                  ? "Lagi Promo 🔥"
                  : tab === "semua"
                    ? "Semua Produk"
                    : (TABS.find((t) => t.id === tab)?.emoji ?? "") + " " + (TABS.find((t) => t.id === tab)?.label ?? "Produk")}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {searching
                ? `${filtered.length} buah untuk “${q.trim()}”`
                : `${filtered.length} produk siap dikirim hari ini`}
            </p>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-zinc-200 bg-white/60 px-6 py-10 text-center">
            <PackageSearch size={40} className="text-zinc-300" />
            <p className="mt-3 text-[13px] font-bold text-zinc-600">
              Buah yang kamu cari belum ada
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Coba kata kunci lain, atau request ke admin ya.
            </p>
            <a
              href={waLink(`Halo GBIFRESH, saya mau request buah: ${q.trim()}`, settings.waNumber)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-[11px] font-bold text-white shadow transition active:scale-95"
            >
              <WhatsAppIcon size={14} /> Request via WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ KEUNGGULAN */}
      {!searching && (
        <section className="mt-6 px-4">
          <h2 className="text-[17px] font-black tracking-tight text-zinc-800">
            Kenapa {settings.brandName}?
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { icon: Leaf, bg: "bg-green-100 text-green-600", title: "Sortir Harian", desc: "Dipilih satu-satu sebelum dikirim" },
              { icon: Zap, bg: "bg-sky-100 text-sky-600", title: "Kirim Fleksibel", desc: "Instan Gojek/Shopee atau ambil di tempat" },
              { icon: BadgeCheck, bg: "bg-amber-100 text-amber-600", title: "Kualitas Grade A", desc: "Langsung dari petani & importir" },
              { icon: ShieldCheck, bg: "bg-lime-100 text-lime-600", title: "Garansi Tukar", desc: "Busuk atau rusak? Ganti baru" },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border border-black/5 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <span className={`grid size-10 place-items-center rounded-2xl ${f.bg}`}>
                  <f.icon size={19} />
                </span>
                <p className="mt-2.5 text-[12.5px] font-bold text-zinc-800">{f.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ FAQ */}
      {!searching && (
        <section className="mt-6 px-4">
          <h2 className="text-[17px] font-black tracking-tight text-zinc-800">
            Sering Ditanyakan (FAQ)
          </h2>
          <div className="mt-3 space-y-2">
            {faqList.map((f, i) => (
              <div key={f.id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
                >
                  <span className="text-[12.5px] font-bold text-zinc-800">{f.q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-emerald-600 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-3.5 pb-3.5 text-[11.5px] leading-relaxed text-zinc-500">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ TESTIMONI */}
      {!searching && (
        <section className="mt-6">
          <div className="flex items-end justify-between px-4">
            <h2 className="text-[17px] font-black tracking-tight text-zinc-800">Kata Pelanggan</h2>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              4.9/5.0
            </span>
          </div>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="w-[240px] shrink-0 snap-start rounded-3xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-2.5 min-h-[5.4em] text-[11.5px] leading-relaxed text-zinc-600">
                  “{t.text}”
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-[11px] font-extrabold text-emerald-700">
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-[11.5px] font-bold text-zinc-800">{t.name}</p>
                    <p className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <MapPin size={9} /> {t.area}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ FOOTER */}
      <footer className="mx-4 mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-white shadow-[0_12px_28px_rgba(22,101,52,0.35)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/20 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo || "/logo-gbifresh.svg"}
              alt={settings.brandName}
              className="h-full w-full object-contain"
            />
          </span>
          <p className="text-[16px] font-black tracking-tight">
            {settings.brandName}
          </p>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-emerald-50/90">
          Toko buah online Jogja. Buah lokal dari petani sekitar DIY dan buah
          impor pilihan. Pesan via WhatsApp, kirim instan (Gojek/Shopee) atau
          ambil langsung di toko.
        </p>
        <div className="mt-3 space-y-1.5 text-[10.5px] text-emerald-50/90">
          <p className="flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0" /> {settings.storeAddress}
          </p>
          <p className="flex items-center gap-1.5">
            <Store size={11} className="shrink-0" /> {settings.openHours}
          </p>
        </div>
        <a
          href={waLink("Halo GBIFRESH, saya mau pesan buah.", settings.waNumber)}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWaClick("footer")}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-[13px] font-extrabold text-white shadow transition active:scale-[0.98]"
        >
          <WhatsAppIcon size={18} />
          Chat Admin Sekarang
        </a>
        <p className="mt-4 text-center text-[10px] text-emerald-100/70">
          © 2026 {settings.brandName} · Dibuat dengan segar di Jogja
        </p>
      </footer>
    </div>
  );
}
