// ---------------------------------------------------------------------------
// Util bersama (aman dipakai di client & server components)
// ---------------------------------------------------------------------------

export function rupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export const WA_NUMBER_FALLBACK = "6281234567890";

export function waLink(message: string, number?: string): string {
  const n =
    (number || WA_NUMBER_FALLBACK).replace(/\D/g, "") || WA_NUMBER_FALLBACK;
  // Menggunakan api.whatsapp.com karena wa.me sering diblokir ISP di Indonesia
  return `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(message)}`;
}

export function waAppUrl(message: string, number?: string): string {
  const n =
    (number || WA_NUMBER_FALLBACK).replace(/\D/g, "") || WA_NUMBER_FALLBACK;
  // whatsapp:// protocol untuk langsung memicu aplikasi di mobile
  return `whatsapp://send?phone=${n}&text=${encodeURIComponent(message)}`;
}

export function discountPct(price: number, originalPrice: number | null) {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// ---------------------------------------------------------------------------
// Metode pengiriman — ongkir & pembayaran dikonfirmasi admin via WhatsApp
// ---------------------------------------------------------------------------
export const DELIVERY_METHODS = [
  {
    id: "instan",
    label: "Antar Instan",
    desc: "Gojek / Shopee · ongkir tanya admin",
  },
  {
    id: "pickup",
    label: "Ambil di Gudang",
    desc: "Ambil sendiri di gudang GBI",
  },
] as const;

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]["id"];

export function deliveryLabel(id: string): string {
  return id === "pickup" ? "Ambil di Gudang GBI" : "Antar Instan (Gojek/Shopee)";
}

// ---------------------------------------------------------------------------
// Pengaturan situs (default bila belum diubah di admin panel)
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS = {
  brandName: "GBIFRESH",
  logo: "/logo-gbifresh.svg",
  siteTitle: "GBIFRESH — Buah Segar Lokal & Impor Jogja",
  siteDescription:
    "Belanja buah lokal & impor segar online area Yogyakarta. Pesan mudah langsung via WhatsApp, pengiriman instan Gojek/Shopee atau ambil di tempat.",
  siteKeywords:
    "buah jogja, toko buah online, buah lokal, buah impor, gbifresh, buah segar yogyakarta",
  waNumber: WA_NUMBER_FALLBACK,
  openHours: "Setiap hari 07.00–21.00 WIB",
  storeAddress: "Jl. Kaliurang KM 9 No. 99, Sleman, Yogyakarta",
} as const;

export type SiteSettings = {
  [K in keyof typeof DEFAULT_SETTINGS]: string;
};
