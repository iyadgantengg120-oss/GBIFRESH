"use client";

import { useEffect, useState } from "react";
import {
  ChefHat,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  PackageCheck,
  PackageSearch,
  Search,
  Store,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Order, OrderItem } from "@/db/schema";
import { deliveryLabel, rupiah, waLink } from "@/lib/format";
import { useSettings, trackWaClick } from "./site-ctx";
import { WhatsAppIcon } from "./home-client";

const STEPS = [
  { id: "baru", label: "Pesanan masuk", icon: PackageSearch },
  { id: "diproses", label: "Sedang dikemas", icon: ChefHat },
  { id: "dikirim", label: "Dalam pengiriman", icon: Truck },
  { id: "selesai", label: "Sampai tujuan", icon: PackageCheck },
];

function stepIndex(status: string) {
  const i = STEPS.findIndex((s) => s.id === status);
  return i === -1 ? 0 : i;
}

export function LacakClient({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const settings = useSettings();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    order: Order;
    items: OrderItem[];
  } | null>(null);

  async function search(c = code, p = phone) {
    if (c.trim().length < 4) {
      setError("Masukkan kode pesanan (contoh: GBI-AB12CD)");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({ code: c.trim() });
      if (p.trim()) params.set("phone", p.trim());
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pesanan tidak ditemukan");
        return;
      }
      setResult(data);
    } catch {
      setError("Koneksi bermasalah, coba lagi ya");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) void search(initialCode, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const order = result?.order;
  const cancelled = order?.status === "batal";
  const activeIdx = order ? stepIndex(order.status) : 0;

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition active:scale-90"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[16px] font-black tracking-tight text-zinc-900">
          Lacak Pesanan
        </h1>
      </header>

      {/* Form pencarian */}
      <div className="mx-4 mt-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 focus-within:border-emerald-400 focus-within:bg-white">
            <PackageSearch size={16} className="shrink-0 text-emerald-600" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Kode pesanan (GBI-XXXXXX)"
              className="w-full bg-transparent py-2.5 font-mono text-[13px] font-bold uppercase tracking-wider text-zinc-800 outline-none placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400"
            />
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="No. HP saat pesan (opsional)"
            inputMode="tel"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </div>
        <button
          onClick={() => search()}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition active:scale-[0.98] disabled:from-zinc-300 disabled:to-zinc-300 disabled:shadow-none"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={16} />}
          {loading ? "Mencari..." : "Lacak Sekarang"}
        </button>
        {error && (
          <p className="mt-2.5 rounded-xl bg-rose-50 p-2.5 text-center text-[11px] font-bold text-rose-600">
            {error}
          </p>
        )}
      </div>

      {/* Hasil */}
      {order && (
        <div className="mt-4 px-4">
          <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[15px] font-black tracking-widest text-emerald-600">
                  {order.code}
                </p>
                <p className="mt-0.5 text-[10.5px] text-zinc-400">
                  {new Date(order.createdAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                  cancelled
                    ? "bg-rose-100 text-rose-600"
                    : order.status === "selesai"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                }`}
              >
                {order.status}
              </span>
            </div>

            <div
              className={`mt-2.5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold ${
                order.deliveryMethod === "pickup"
                  ? "bg-lime-50 text-lime-700"
                  : "bg-sky-50 text-sky-700"
              }`}
            >
              {order.deliveryMethod === "pickup" ? <Store size={13} /> : <Zap size={13} />}
              {deliveryLabel(order.deliveryMethod)}
              {order.deliveryMethod === "pickup" && (
                <span className="ml-auto text-[9px] font-medium opacity-75">
                  {settings.storeAddress}
                </span>
              )}
            </div>

            {/* Timeline */}
            {cancelled ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-[11.5px] font-bold text-rose-600">
                <XCircle size={16} /> Pesanan dibatalkan. Hubungi admin untuk info.
              </div>
            ) : (
              <div className="mt-5">
                {STEPS.map((s, idx) => {
                  const done = idx <= activeIdx;
                  const last = idx === STEPS.length - 1;
                  return (
                    <div key={s.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`grid size-8 place-items-center rounded-full ${
                            done
                              ? "bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.4)]"
                              : "bg-zinc-100 text-zinc-300"
                          }`}
                        >
                          {done && idx < activeIdx ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <s.icon size={15} />
                          )}
                        </span>
                        {!last && (
                          <span
                            className={`my-1 h-6 w-0.5 rounded-full ${
                              idx < activeIdx ? "bg-emerald-400" : "bg-zinc-100"
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`pt-1.5 text-[12px] ${
                          done ? "font-bold text-zinc-800" : "font-medium text-zinc-400"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Item */}
            <div className="mt-4 border-t border-dashed border-zinc-200 pt-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                Rincian Pesanan
              </p>
              <div className="mt-2 space-y-1.5">
                {result!.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-[12px]">
                    <span className="text-zinc-600">
                      {i.name}{" "}
                      <span className="text-zinc-400">× {i.qty} {i.unit}</span>
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {rupiah(i.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-dashed border-zinc-200 pt-2 text-[13px] font-black">
                  <span>Total Belanja</span>
                  <span className="text-emerald-600">{rupiah(order.total)}</span>
                </div>
                <p className="text-right text-[9.5px] text-zinc-400">
                  *belum termasuk ongkir (info admin)
                </p>
              </div>
            </div>

            <a
              href={waLink(
                `Halo GBIFRESH, saya ${order.customerName} mau tanya soal pesanan ${order.code}.`,
                settings.waNumber,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-[12.5px] font-extrabold text-white shadow transition active:scale-[0.98]"
            >
              <WhatsAppIcon size={17} /> Tanya Admin soal Pesanan Ini
            </a>
            {/* tracking handled via onClick on the anchor */}
          </div>
        </div>
      )}
    </div>
  );
}
