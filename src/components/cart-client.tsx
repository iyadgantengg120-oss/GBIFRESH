"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShoppingBasket,
  Store,
  Trash2,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { DELIVERY_METHODS, deliveryLabel, rupiah } from "@/lib/format";
import { useCart } from "./cart-provider";
import { useSettings, trackWaClick } from "./site-ctx";
import { WhatsAppIcon } from "./home-client";

const CUSTOMER_KEY = "gbifresh-customer";

type SuccessOrder = { code: string; total: number; waUrl: string };

export function CartClient() {
  const router = useRouter();
  const settings = useSettings();
  const { items, subtotal, setQty, remove, clear } = useCart();

  // Ref untuk hidden anchor agar tidak diblok popup blocker
  const waAnchorRef = useRef<HTMLAnchorElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("instan");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessOrder | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c.name) setName(c.name);
        if (c.phone) setPhone(c.phone);
        if (c.address) setAddress(c.address);
        if (c.deliveryMethod === "instan" || c.deliveryMethod === "pickup")
          setDeliveryMethod(c.deliveryMethod);
      }
    } catch { /* abaikan */ }
  }, []);

  const total = subtotal;

  const canSubmit = useMemo(
    () =>
      items.length > 0 &&
      name.trim().length >= 2 &&
      phone.replace(/\D/g, "").length >= 9 &&
      (deliveryMethod === "pickup" || address.trim().length >= 5),
    [items.length, name, phone, address, deliveryMethod],
  );

  async function submit() {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.replace(/\D/g, ""),
          address: address.trim(),
          deliveryMethod,
          note: note.trim(),
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal membuat pesanan, coba lagi.");
        setSubmitting(false);
        return;
      }

      try {
        localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({ name: name.trim(), phone, address: address.trim(), deliveryMethod }),
        );
      } catch { /* abaikan */ }

      clear();

      const orderResult: SuccessOrder = {
        code: data.code,
        total: data.total,
        waUrl: data.waUrl,
      };
      setSuccess(orderResult);
      trackWaClick("checkout");

      // ================================================================
      // DIRECT TO WHATSAPP
      // 1) Coba buka aplikasi WhatsApp via whatsapp://
      // 2) Jika gagal / tidak terpasang, fallback ke wa.me
      //    Ini lebih reliable dibanding window.open() async.
      // ================================================================
      try {
        const webUrl = new URL(data.waUrl);
        const phoneNumber = webUrl.searchParams.get("phone") || webUrl.pathname.replace(/^\//, "");
        const text = webUrl.searchParams.get("text") ?? "";
        // api.whatsapp.com sering tidak terblokir dibanding wa.me di beberapa provider
        const apiWaUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${text}`;
        const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${text}`;

        // Coba buka aplikasi native WhatsApp dulu
        window.location.href = appUrl;

        // Jika dalam 1.2 detik halaman masih terbuka (artinya gagal buka aplikasi),
        // fallback ke api.whatsapp.com yang lebih reliable
        window.setTimeout(() => {
          if (document.visibilityState === "visible") {
            window.location.href = apiWaUrl;
          }
        }, 1200);
      } catch {
        // Fallback terakhir
        window.location.href = data.waUrl.replace("wa.me/", "api.whatsapp.com/send?phone=");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Koneksi bermasalah, coba lagi ya.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------- SUKSES
  if (success) {
    // Membangun URL aplikasi whatsapp:// dari url api.whatsapp.com yang dikembalikan
    const waUrlApp = success.waUrl
      .replace("https://api.whatsapp.com/send", "whatsapp://send")
      .replace("https://wa.me/", "whatsapp://send?phone=");

    return (
      <div className="flex min-h-dvh flex-col bg-[#f7fdf7]">
        {/* Hidden anchor tetap ada di DOM untuk di-trigger click */}
        <a ref={waAnchorRef} href={success.waUrl} target="_blank" rel="noreferrer" className="hidden" aria-hidden="true" />

        <div className="flex flex-1 flex-col items-center justify-center px-5 pb-4 pt-[max(env(safe-area-inset-top),2rem)] text-center">
          <div className="relative">
            <div className="grid size-24 place-items-center rounded-full bg-green-100">
              <CheckCircle2 size={52} className="text-green-500" />
            </div>
            <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg border-2 border-white">
              <WhatsAppIcon size={16} />
            </span>
          </div>

          <h1 className="mt-5 text-[22px] font-black tracking-tight text-zinc-900 leading-tight">
            Pesanan Berhasil <br/> Dibuat! 🎉
          </h1>
          <p className="mt-3 max-w-[18rem] text-[13px] leading-relaxed text-zinc-500">
            Pesananmu <b>{success.code}</b> sudah masuk dan kamu sedang
            diarahkan ke WhatsApp admin untuk konfirmasi.
          </p>

          <div className="mt-6 w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-100">Kode Pesanan</p>
              <p className="font-mono text-[24px] font-black tracking-[0.1em] text-white">{success.code}</p>
            </div>
            <div className="px-5 py-4 text-left space-y-1">
              <p className="text-[12px] text-zinc-500">Total belanja: <span className="font-black text-green-600">{rupiah(success.total)}</span></p>
              <p className="text-[10.5px] text-zinc-400 font-medium italic">*Admin akan mengkonfirmasi ongkos kirim</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <a
            href={waUrlApp}
            onClick={() => trackWaClick("checkout-success-app")}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-4 text-[15px] font-extrabold text-white shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition active:scale-[0.98]"
          >
            <WhatsAppIcon size={22} />
            Buka Aplikasi WhatsApp
          </a>

          <a
            href={success.waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackWaClick("checkout-success-web")}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#25D366] py-3.5 text-[14px] font-extrabold text-[#128C7E] transition active:scale-[0.98]"
          >
            <WhatsAppIcon size={20} />
            Kirim via WhatsApp Web
          </a>

          <div className="pt-2 flex gap-3">
            <Link
              href={`/lacak?code=${success.code}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3.5 text-[12.5px] font-bold text-zinc-600 transition active:scale-[0.97]"
            >
              <Truck size={17} /> Lacak
            </Link>
            <button
              onClick={() => router.push("/")}
              className="flex flex-1 items-center justify-center rounded-2xl border-2 border-zinc-200 py-3.5 text-[12.5px] font-bold text-zinc-400 transition active:scale-[0.97]"
            >
              Belanja Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- KOSONG
  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-green-50">
          <ShoppingBasket size={44} className="text-green-300" />
        </span>
        <h1 className="mt-5 text-[18px] font-black tracking-tight text-zinc-800">
          Keranjangmu masih kosong
        </h1>
        <p className="mt-2 max-w-64 text-[12px] text-zinc-400">
          Yuk pilih buah segar GBI, dikirim langsung hari ini ke seluruh Jogja.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_20px_rgba(22,163,74,0.4)] transition active:scale-95"
        >
          Mulai Belanja
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- FORM
  return (
    <div className="pb-36">
      {/* Hidden anchor WA */}
      <a ref={waAnchorRef} href="#" target="_blank" rel="noreferrer" className="hidden" aria-hidden="true" />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition active:scale-90"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[16px] font-black tracking-tight text-zinc-900">
          Checkout Pesanan
        </h1>
        <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
          {items.reduce((s, i) => s + i.qty, 0)} item
        </span>
      </header>

      <section className="mt-3 space-y-2.5 px-4">
        {items.map((i) => (
          <div key={i.slug} className="flex gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
            <img src={i.image} alt={i.name} className="size-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => router.push(`/produk/${i.slug}`)} className="line-clamp-1 text-left text-[13px] font-bold text-zinc-800">
                  {i.name}
                </button>
                <button aria-label={`Hapus ${i.name}`} onClick={() => remove(i.slug)} className="shrink-0 text-rose-400 transition active:scale-90">
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="mt-0.5 text-[10.5px] text-zinc-400">{rupiah(i.price)} / {i.unit}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 p-0.5">
                  <button onClick={() => setQty(i.slug, i.qty - 1)} className="grid size-7 place-items-center rounded-full bg-white text-zinc-600 shadow-sm transition active:scale-90">
                    <Minus size={13} />
                  </button>
                  <span className="min-w-6 text-center text-[12px] font-extrabold text-zinc-800">{i.qty}</span>
                  <button onClick={() => setQty(i.slug, i.qty + 1)} className="grid size-7 place-items-center rounded-full bg-green-500 text-white shadow-sm transition active:scale-90">
                    <Plus size={13} />
                  </button>
                </div>
                <p className="text-[13px] font-extrabold text-green-600">{rupiah(i.price * i.qty)}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-4 mt-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-zinc-800">
          <User size={15} className="text-green-600" /> Data Pemesan
        </p>
        <div className="space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap *" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-green-400 focus:bg-white" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="No. HP / WhatsApp *" inputMode="tel" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-green-400 focus:bg-white" />
        </div>

        <p className="mb-2 mt-4 flex items-center gap-2 text-[13px] font-extrabold text-zinc-800">
          <Truck size={15} className="text-green-600" /> Pengiriman
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DELIVERY_METHODS.map((m) => {
            const Icon = m.id === "instan" ? Zap : Store;
            const active = deliveryMethod === m.id;
            return (
              <button key={m.id} type="button" onClick={() => setDeliveryMethod(m.id)} className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition active:scale-95 ${active ? "border-green-500 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                <Icon size={18} />
                <span className="text-[11px] font-extrabold">{m.label}</span>
                <span className="text-[8.5px] font-medium leading-tight opacity-80">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {deliveryMethod === "instan" ? (
          <div className="relative mt-2.5">
            <MapPin size={15} className="pointer-events-none absolute left-3 top-3 text-green-600" />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap (jalan, no. rumah, RT/RW, patokan) *" rows={2} className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3.5 text-[13px] outline-none transition focus:border-green-400 focus:bg-white" />
          </div>
        ) : (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-[10.5px] font-medium leading-relaxed text-green-700">
            <Store size={14} className="mt-0.5 shrink-0" />
            <span>Ambil di Gudang GBI: <span className="font-bold">{settings.storeAddress}</span>{" · "}{settings.openHours}</span>
          </div>
        )}

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk admin (opsional)" className="mt-2.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-green-400 focus:bg-white" />
      </section>

      <section className="mx-4 mt-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</span>
            <span className="font-semibold text-zinc-700">{rupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Pengiriman</span>
            <span className="font-medium text-zinc-600">{deliveryLabel(deliveryMethod)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Ongkir</span>
            <span className="font-semibold text-amber-600">Konfirmasi admin WA</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-zinc-200 pt-2 text-[14px] font-black text-zinc-900">
            <span>Total Belanja</span>
            <span className="text-green-600">{rupiah(total)}</span>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#25D366]/10 p-2.5">
          <WhatsAppIcon size={14} className="shrink-0 text-[#128C7E]" />
          <p className="text-[9.5px] font-medium leading-relaxed text-[#128C7E]">Ongkir &amp; pembayaran dikonfirmasi admin via WhatsApp setelah pesanan dibuat</p>
        </div>
      </section>

      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 p-3.5">
          <span className="text-[11.5px] font-bold text-rose-600">{error}</span>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-[min(28rem,100%)] border-t border-black/5 bg-white/95 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.9rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-4 text-[14px] font-extrabold text-white shadow-[0_8px_20px_rgba(37,211,102,0.5)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <WhatsAppIcon size={21} />}
            {submitting ? "Memproses pesanan..." : `Pesan via WhatsApp · ${rupiah(total)}`}
          </button>
          {!canSubmit && (
            <p className="mt-1.5 text-center text-[10px] font-medium text-zinc-400">
              {items.length === 0 ? "Keranjang kosong" : deliveryMethod === "instan" && address.trim().length < 5 ? "Lengkapi nama, no. HP, dan alamat" : "Lengkapi nama & no. HP"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
