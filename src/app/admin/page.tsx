"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Banknote,
  ChevronLeft,
  ClipboardList,
  Eye,
  EyeOff,
  HelpCircle,
  ImagePlus,
  Images,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MapPin,
  Minus,
  MousePointerClick,
  Package,
  Pencil,
  Phone,
  Plus,
  Save,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
  Zap,
  Settings2,
  Globe,
  ExternalLink,
  BarChart3,
  Box,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/home-client";
import type { Banner, Faq, Order, OrderItem, Product } from "@/db/schema";
import {
  DEFAULT_SETTINGS,
  deliveryLabel,
  rupiah,
  type SiteSettings,
} from "@/lib/format";

// ------------------------------------------------------------------ types
type OrderWithItems = Order & { items?: OrderItem[] };
type Stats = {
  today: { visitors: number; pageviews: number };
  all: { visitors: number; pageviews: number };
  series: { label: string; count: number }[];
  orders: { total: number; baru: number; omzet: number };
  recentOrders: Order[];
  wa: {
    today: number;
    all: number;
    bySource: Record<string, number>;
    series: { label: string; count: number }[];
  };
  products: { total: number; totalStock: number; outOfStock: number };
  settings: SiteSettings;
};
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pesanan", label: "Pesanan", icon: ClipboardList },
  { id: "produk", label: "Produk", icon: Package },
  { id: "banner", label: "Banner", icon: Images },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "pengaturan", label: "Pengaturan", icon: Settings2 },
] as const;
type TabId = (typeof TABS)[number]["id"];

const STATUS_LIST = ["baru", "diproses", "dikirim", "selesai", "batal"];
const STATUS_STYLE: Record<string, string> = {
  baru: "bg-amber-100 text-amber-700",
  diproses: "bg-sky-100 text-sky-700",
  dikirim: "bg-violet-100 text-violet-700",
  selesai: "bg-emerald-100 text-emerald-700",
  batal: "bg-rose-100 text-rose-700",
};

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12.5px] outline-none transition focus:border-emerald-400 focus:bg-white";

// ------------------------------------------------------------------ helper
function resizeImage(
  file: File,
  max: number,
  cb: (dataUrl: string | null) => void,
) {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    cb(canvas.toDataURL("image/jpeg", 0.85));
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => cb(null);
  img.src = URL.createObjectURL(file);
}

// ------------------------------------------------------------------ upload
function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(file: File) {
    setBusy(true);
    resizeImage(file, 1000, (dataUrl) => {
      setBusy(false);
      if (dataUrl) onChange(dataUrl);
    });
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="aspect-[16/9] w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="grid size-8 place-items-center rounded-lg bg-white/95 text-zinc-600 shadow"
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid size-8 place-items-center rounded-lg bg-white/95 text-rose-500 shadow"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-5 text-zinc-400 transition active:scale-[0.99]"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          <span className="text-[11px] font-bold">
            {busy ? "Memproses..." : "Klik untuk upload gambar"}
          </span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <input
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…atau tempel URL gambar"
        className={`${inputCls} mt-1.5 text-[11px]`}
      />
    </div>
  );
}

// ------------------------------------------------------------------ modal
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-black text-zinc-800">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 py-10 text-center text-[12px] font-semibold text-zinc-400">
      {label}
    </div>
  );
}

// ==================================================================
export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersL, setOrdersL] = useState<OrderWithItems[]>([]);
  const [productsL, setProductsL] = useState<Product[]>([]);
  const [bannersL, setBannersL] = useState<Banner[]>([]);
  const [faqsL, setFaqsL] = useState<Faq[]>([]);
  const [settings, setSettings] = useState<SiteSettings & { adminUsername?: string; adminPassword?: string }>({ ...DEFAULT_SETTINGS });
  const [savedSettings, setSavedSettings] = useState<SiteSettings & { adminUsername?: string; adminPassword?: string }>({ ...DEFAULT_SETTINGS });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const settingsChanged = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // modal: produk / banner / faq
  const [editProduct, setEditProduct] = useState<Product | "new" | null>(null);
  const [editBanner, setEditBanner] = useState<Banner | "new" | null>(null);
  const [editFaq, setEditFaq] = useState<Faq | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // ---- Cek akses admin: kalau belum login, lempar ke /admin/login
  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setAuthReady(true);
        else window.location.href = "/admin/login";
      })
      .catch(() => {
        window.location.href = "/admin/login";
      });
  }, []);

  const loadStats = useCallback(() => {
    fetch("/api/cms/stats")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((d: Stats) => {
        setStats(d);
        if (d.settings) {
          const merged = { ...DEFAULT_SETTINGS, ...d.settings };
          setSettings(merged);
          setSavedSettings(merged);
        }
      })
      .catch(() => {});
  }, []);
  const loadOrders = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrdersL(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  const loadProducts = useCallback(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProductsL(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  const loadBanners = useCallback(() => {
    fetch("/api/cms/banners")
      .then((r) => r.json())
      .then((d) => setBannersL(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  const loadFaqs = useCallback(() => {
    fetch("/api/cms/faqs")
      .then((r) => r.json())
      .then((d) => setFaqsL(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadStats();
    fetch("/api/cms/settings")
      .then((r) => r.json())
      .then((d) => setSettings((s) => ({ ...s, ...d })))
      .catch(() => {});
  }, [loadStats, authReady]);

  // polling realtime statistik
  useEffect(() => {
    if (tab !== "dashboard" || !authReady) return;
    loadStats();
    const id = setInterval(loadStats, 5000);
    return () => clearInterval(id);
  }, [tab, loadStats, authReady]);

  useEffect(() => {
    if (!authReady) return;
    if (tab === "pesanan") loadOrders();
    if (tab === "produk") loadProducts();
    if (tab === "banner") loadBanners();
    if (tab === "faq") loadFaqs();
  }, [tab, loadOrders, loadProducts, loadBanners, loadFaqs, authReady]);

  async function setOrderStatus(id: number, status: string) {
    setBusyId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setBusyId(null);
    loadOrders();
    loadStats();
  }

  async function toggleActive(resource: string, id: number, active: boolean) {
    setBusyId(id);
    await fetch(`/api/cms/${resource}?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).catch(() => {});
    setBusyId(null);
    if (resource === "banners") loadBanners();
    else loadFaqs();
  }

  async function quickStock(id: number, stock: number) {
    setBusyId(id);
    await fetch(`/api/cms/products?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: Math.max(0, stock) }),
    }).catch(() => {});
    setBusyId(null);
    loadProducts();
  }

  async function removeItem(resource: string, id: number, reload: () => void) {
    if (!window.confirm("Yakin mau menghapus?")) return;
    setBusyId(id);
    await fetch(`/api/cms/${resource}?id=${id}`, { method: "DELETE" }).catch(() => {});
    setBusyId(null);
    reload();
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSavedOk(false);
    await fetch("/api/cms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/admin/login";
          throw new Error("unauthorized");
        }
        return r.json();
      })
      .then((d) => {
        const merged = { ...DEFAULT_SETTINGS, ...d };
        setSettings(merged);
        setSavedSettings(merged);
      })
      .catch(() => {});
    setSavingSettings(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  // Upload logo — tersimpan OTOMATIS ke database begitu gambar dipilih
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function saveLogo(dataUrl: string) {
    setSettings((s) => ({ ...s, logo: dataUrl }));
    setLogoSaving(true);
    setLogoSaved(false);
    try {
      const res = await fetch("/api/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: dataUrl }),
      });
      if (res.ok) {
        const d = await res.json();
        setSettings((s) => ({ ...s, ...d }));
      }
    } catch {
      /* abaikan */
    }
    setLogoSaving(false);
    setLogoSaved(true);
    setTimeout(() => setLogoSaved(false), 2500);
  }

  function pickLogoFile(file: File) {
    setLogoSaving(true);
    resizeImage(file, 500, (dataUrl) => {
      if (dataUrl) void saveLogo(dataUrl);
      else setLogoSaving(false);
    });
  }

  const maxSeries = Math.max(1, ...(stats?.series?.map((s) => s.count) ?? [1]));

  if (!authReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#f0fdf4_0%,#dcfce7_100%)]">
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(22,101,52,0.1)]">
            <Loader2 size={24} className="animate-spin text-green-600" />
          </div>
          <p className="text-[13px] font-bold text-green-700">Memeriksa akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#edf1e8] text-zinc-800 md:fixed md:inset-0 md:z-50 md:flex md:overflow-hidden">
      {/* ============ SIDEBAR (desktop, pojok kiri) ============ */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/5 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-black/5 p-4">
          <button
            onClick={() => logoInputRef.current?.click()}
            title="Klik untuk ganti logo (tersimpan otomatis)"
            className="group relative flex h-9 shrink-0 items-center justify-center overflow-visible transition active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo || "/logo-gbifresh.svg"}
              alt="logo"
              className="h-full w-auto object-contain"
            />
            <span className="absolute inset-0 hidden place-items-center rounded-xl bg-black/45 group-hover:grid">
              {logoSaving ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <Pencil size={12} className="text-white" />
              )}
            </span>
          </button>
          {/* input file logo — tetap ada di DOM walau sidebar disembunyikan di mobile */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickLogoFile(f);
              e.target.value = "";
            }}
          />
          <div>
            <p className="text-[13px] font-black leading-none">{settings.brandName}</p>
            <p className="mt-1 text-[10px] font-medium text-zinc-400">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition ${
                tab === t.id
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <t.icon size={17} />
              {t.label}
              {t.id === "pesanan" && (stats?.orders?.baru ?? 0) > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                  {stats?.orders?.baru}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="m-3 space-y-2">
          <a
            href="/"
            className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-[12px] font-bold text-zinc-600"
          >
            <ChevronLeft size={15} /> Ke Toko
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] font-bold text-rose-600"
          >
            <LogOut size={15} /> Logout Admin
          </button>
        </div>
      </aside>

      {/* ============ CONTENT ============ */}
      <main className="flex-1 md:overflow-y-auto">
        {/* topbar mobile */}
        <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 px-3 pt-3">
            <a href="/" className="grid size-8 place-items-center rounded-full bg-zinc-100 text-zinc-600">
              <ChevronLeft size={16} />
            </a>
            <p className="text-[13px] font-black">Admin Panel</p>
            <button
              onClick={logout}
              className="ml-auto flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  tab === t.id ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
          {/* ================= DASHBOARD ================= */}
          {tab === "dashboard" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-[17px] font-black">Dashboard</h1>
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-extrabold text-green-700">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  </span>
                  LIVE
                </span>
              </div>

              {/* ---- Stat cards row 1 ---- */}
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {[
                  { icon: Eye, label: "Pengunjung hari ini", value: stats?.today?.visitors ?? 0, c: "bg-green-100 text-green-600" },
                  { icon: MousePointerClick, label: "Pageview hari ini", value: stats?.today?.pageviews ?? 0, c: "bg-sky-100 text-sky-600" },
                  { icon: ShoppingBag, label: "Total pesanan", value: stats?.orders?.total ?? 0, c: "bg-amber-100 text-amber-600" },
                  { icon: Banknote, label: "Omzet", value: rupiah(stats?.orders?.omzet ?? 0), c: "bg-violet-100 text-violet-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                    <span className={`grid size-8 place-items-center rounded-xl ${s.c}`}>
                      <s.icon size={16} />
                    </span>
                    <p className="mt-1.5 text-[16px] font-black leading-none">{s.value}</p>
                    <p className="mt-1 text-[9.5px] font-semibold text-zinc-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ---- Stat cards row 2: WA + Produk ---- */}
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <div className="rounded-2xl border border-black/5 bg-[#25D366]/10 p-3 shadow-sm">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#25D366]/20 text-[#128C7E]">
                    <WhatsAppIcon size={16} />
                  </span>
                  <p className="mt-1.5 text-[16px] font-black leading-none text-[#128C7E]">{stats?.wa?.today ?? 0}</p>
                  <p className="mt-1 text-[9.5px] font-semibold text-[#128C7E]/70">Klik WA hari ini</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#25D366]/10 p-3 shadow-sm">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#25D366]/20 text-[#128C7E]">
                    <BarChart3 size={16} />
                  </span>
                  <p className="mt-1.5 text-[16px] font-black leading-none text-[#128C7E]">{stats?.wa?.all ?? 0}</p>
                  <p className="mt-1 text-[9.5px] font-semibold text-[#128C7E]/70">Total klik WA</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <span className="grid size-8 place-items-center rounded-xl bg-green-100 text-green-600">
                    <Box size={16} />
                  </span>
                  <p className="mt-1.5 text-[16px] font-black leading-none">{stats?.products?.total ?? 0}</p>
                  <p className="mt-1 text-[9.5px] font-semibold text-zinc-400">Jumlah produk</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <span className={`grid size-8 place-items-center rounded-xl ${(stats?.products?.outOfStock ?? 0) > 0 ? "bg-rose-100 text-rose-600" : "bg-green-100 text-green-600"}`}>
                    <AlertTriangle size={16} />
                  </span>
                  <p className={`mt-1.5 text-[16px] font-black leading-none ${(stats?.products?.outOfStock ?? 0) > 0 ? "text-rose-600" : ""}`}>{stats?.products?.outOfStock ?? 0}</p>
                  <p className="mt-1 text-[9.5px] font-semibold text-zinc-400">Stok habis</p>
                </div>
              </div>

              {/* ---- WA Klik per sumber hari ini ---- */}
              {stats?.wa && (stats.wa.today > 0 || stats.wa.all > 0) && (
                <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <p className="flex items-center gap-2 text-[13px] font-extrabold">
                    <WhatsAppIcon size={15} className="text-[#25D366]" /> Klik WhatsApp Per Sumber
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                    {[
                      { key: "header", label: "Header" },
                      { key: "footer", label: "Footer" },
                      { key: "checkout", label: "Checkout" },
                      { key: "product", label: "Detail Produk" },
                      { key: "bantuan", label: "Nav Bantuan" },
                    ].map((s) => (
                      <div key={s.key} className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                        <span className="text-[14px] font-black text-[#128C7E]">{stats.wa.bySource?.[s.key] ?? 0}</span>
                        <span className="text-[10px] font-semibold text-zinc-500">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Grafik kunjungan + WA 7 hari ---- */}
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-[13px] font-extrabold">
                    <Activity size={15} className="text-green-600" /> Kunjungan &amp; WA 7 Hari
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Total: {stats?.all?.visitors ?? 0} visitor · {stats?.all?.pageviews ?? 0} view
                  </p>
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {(stats?.series ?? []).map((s, i) => {
                    const waCount = stats?.wa?.series?.[i]?.count ?? 0;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[8px] font-bold text-zinc-500">{s.count}</span>
                        <div className="flex w-full items-end gap-0.5">
                          <div
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-green-600 to-lime-400 transition-all"
                            style={{ height: `${Math.max(6, (s.count / maxSeries) * 72)}px` }}
                            title={`${s.count} pageview`}
                          />
                          <div
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-[#128C7E] to-[#25D366] transition-all"
                            style={{ height: `${Math.max(4, maxSeries > 0 ? (waCount / maxSeries) * 72 : 4)}px` }}
                            title={`${waCount} klik WA`}
                          />
                        </div>
                        <span className="text-[8px] font-semibold uppercase text-zinc-400">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-4 text-[9px] font-bold text-zinc-400">
                  <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-green-500" /> Pageview</span>
                  <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-[#25D366]" /> Klik WA</span>
                </div>
              </div>

              {/* ---- Quick settings (logo, WA, alamat, SEO) ---- */}
              <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-4 shadow-sm">
                <p className="flex items-center gap-2 text-[13px] font-extrabold text-green-800">
                  <Settings2 size={15} /> Pengaturan Cepat
                </p>
                <p className="mt-0.5 text-[10px] text-green-700/70">Ubah langsung dari sini — otomatis tersimpan ke database</p>

                <div className="mt-3 space-y-2.5">
                  {/* Logo */}
                  <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="group relative flex h-12 shrink-0 items-center justify-center overflow-visible transition active:scale-95"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.logo || "/logo-gbifresh.svg"} alt="logo" className="h-full w-auto object-contain" />
                      <span className="absolute inset-0 hidden place-items-center rounded-xl bg-black/40 group-hover:grid">
                        <Pencil size={13} className="text-white" />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-zinc-700">Logo Toko</p>
                      <p className="text-[9.5px] text-zinc-400">Klik untuk ganti — tersimpan otomatis</p>
                    </div>
                    {logoSaving && <Loader2 size={14} className="animate-spin text-green-600" />}
                    {logoSaved && <span className="text-[10px] font-bold text-green-600">✓</span>}
                  </div>

                  {/* Brand name */}
                  <div className="rounded-xl bg-white p-3">
                    <label className="flex items-center gap-2">
                      <Globe size={14} className="shrink-0 text-green-600" />
                      <span className="w-20 shrink-0 text-[10.5px] font-bold text-zinc-500">Nama Web</span>
                      <input
                        value={settings.brandName}
                        onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11.5px] font-bold outline-none focus:border-green-400 focus:bg-white"
                      />
                    </label>
                  </div>

                  {/* WA number */}
                  <div className="rounded-xl bg-white p-3">
                    <label className="flex items-center gap-2">
                      <WhatsAppIcon size={14} className="shrink-0 text-[#25D366]" />
                      <span className="w-20 shrink-0 text-[10.5px] font-bold text-zinc-500">No. WA</span>
                      <input
                        value={settings.waNumber}
                        onChange={(e) => setSettings({ ...settings, waNumber: e.target.value.replace(/\D/g, "") })}
                        placeholder="628xxx"
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-[11.5px] font-bold outline-none focus:border-green-400 focus:bg-white"
                      />
                    </label>
                  </div>

                  {/* Alamat */}
                  <div className="rounded-xl bg-white p-3">
                    <label className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0 text-green-600" />
                      <span className="w-20 shrink-0 text-[10.5px] font-bold text-zinc-500">Alamat</span>
                      <input
                        value={settings.storeAddress}
                        onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11.5px] outline-none focus:border-green-400 focus:bg-white"
                      />
                    </label>
                  </div>

                  {/* SEO Title */}
                  <div className="rounded-xl bg-white p-3">
                    <label className="flex items-center gap-2">
                      <Globe size={14} className="shrink-0 text-green-600" />
                      <span className="w-20 shrink-0 text-[10.5px] font-bold text-zinc-500">SEO Title</span>
                      <input
                        value={settings.siteTitle}
                        onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11.5px] outline-none focus:border-green-400 focus:bg-white"
                      />
                    </label>
                  </div>

                  {/* Jam & Keywords */}
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl bg-white p-3">
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500">Jam Buka</span>
                        <input
                          value={settings.openHours}
                          onChange={(e) => setSettings({ ...settings, openHours: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] outline-none focus:border-green-400 focus:bg-white"
                        />
                      </label>
                    </div>
                    <div className="flex-1 rounded-xl bg-white p-3">
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500">Keywords</span>
                        <input
                          value={settings.siteKeywords}
                          onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] outline-none focus:border-green-400 focus:bg-white"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Keamanan Admin */}
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                    <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-700">
                      <LockKeyhole size={13} /> Login Admin
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase text-rose-400">Username Admin</span>
                        <input
                          value={settings.adminUsername || ""}
                          onChange={(e) => setSettings({ ...settings, adminUsername: e.target.value })}
                          placeholder="admin"
                          className="mt-1 w-full rounded-lg border border-rose-100 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 outline-none focus:border-rose-400"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase text-rose-400">Ganti Password</span>
                        <input
                          type="password"
                          value={settings.adminPassword || ""}
                          onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                          placeholder="Kosongkan jika tak diubah"
                          className="mt-1 w-full rounded-lg border border-rose-100 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-rose-400"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ---- TOMBOL SIMPAN muncul saat ada perubahan ---- */}
                  <div className={`overflow-hidden transition-all duration-300 ${settingsChanged ? "max-h-20" : "max-h-0"}`}>
                    <button
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 py-3 text-[13px] font-extrabold text-white shadow-[0_6px_20px_rgba(22,163,74,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                    >
                      {savingSettings
                        ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                        : <><Save size={15} /> Simpan Perubahan</>}
                    </button>
                  </div>
                  {savedOk && (
                    <p className="flex items-center justify-center gap-1 text-center text-[11px] font-bold text-green-600">
                      ✓ Perubahan berhasil disimpan!
                    </p>
                  )}
                </div>
              </div>

              {/* ---- Pesanan terbaru ---- */}
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-extrabold">Pesanan Terbaru</p>
                  <button onClick={() => setTab("pesanan")} className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                    Lihat semua <ExternalLink size={10} />
                  </button>
                </div>
                {(stats?.recentOrders ?? []).length === 0 && (
                  <p className="py-6 text-center text-[11.5px] text-zinc-400">Belum ada pesanan masuk</p>
                )}
                <div className="mt-2 divide-y divide-zinc-100">
                  {(stats?.recentOrders ?? []).map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-mono text-[12px] font-black text-green-600">{o.code}</p>
                        <p className="text-[10.5px] text-zinc-400">{o.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-extrabold">{rupiah(o.total)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${STATUS_STYLE[o.status]}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PESANAN ================= */}
          {tab === "pesanan" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[17px] font-black">Pesanan ({ordersL.length})</h1>
                <button onClick={loadOrders} className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-emerald-600 shadow-sm">
                  Muat Ulang
                </button>
              </div>
              {ordersL.length === 0 && <Empty label="Belum ada pesanan masuk" />}
              {ordersL.map((o) => (
                <div key={o.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[12.5px] font-black tracking-wider text-emerald-600">{o.code}</p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(o.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 rounded-xl bg-zinc-50 p-3">
                    {(o.items ?? []).map((i) => (
                      <div key={i.id} className="flex justify-between text-[11.5px]">
                        <span className="text-zinc-600">
                          {i.name} <span className="text-zinc-400">× {i.qty} {i.unit}</span>
                        </span>
                        <span className="font-semibold">{rupiah(i.subtotal)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-dashed border-zinc-200 pt-1.5 text-[12px] font-black">
                      <span>Total Belanja</span>
                      <span className="text-emerald-600">{rupiah(o.total)}</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-500">
                    <p className="flex items-center gap-1.5 font-bold text-zinc-800">
                      {o.customerName}
                      <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[9.5px] font-bold text-zinc-500">
                        {o.deliveryMethod === "pickup" ? <Store size={9} /> : <Zap size={9} />}
                        {deliveryLabel(o.deliveryMethod)}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5"><Phone size={10} /> {o.phone}</p>
                    {o.deliveryMethod === "instan" && (
                      <p className="flex items-start gap-1.5"><MapPin size={10} className="mt-0.5 shrink-0" /> {o.address}</p>
                    )}
                    {o.note && (
                      <p className="rounded-lg bg-amber-50 px-2 py-1 text-[10.5px] font-medium text-amber-700">Catatan: {o.note}</p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Truck size={13} className="text-zinc-400" />
                    <select
                      value={o.status}
                      disabled={busyId === o.id}
                      onChange={(e) => setOrderStatus(o.id, e.target.value)}
                      className="flex-1 appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11.5px] font-bold capitalize outline-none disabled:opacity-60"
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {busyId === o.id && <Loader2 size={15} className="animate-spin text-emerald-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= PRODUK ================= */}
          {tab === "produk" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[17px] font-black">Produk ({productsL.length})</h1>
                <button
                  onClick={() => setEditProduct("new")}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11.5px] font-extrabold text-white shadow"
                >
                  <Plus size={14} /> Tambah Produk
                </button>
              </div>
              {productsL.length === 0 && <Empty label="Belum ada produk" />}
              <div className="grid gap-2.5 md:grid-cols-2">
                {productsL.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="size-16 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[12.5px] font-bold">{p.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        <span className="mr-1 rounded bg-zinc-100 px-1 py-px text-[8.5px] font-extrabold text-zinc-600">
                          {p.category}
                        </span>
                        terjual {p.sold}
                      </p>
                      <p className="mt-0.5 text-[12.5px] font-extrabold text-emerald-600">
                        {rupiah(p.price)}
                        <span className="ml-1 text-[10px] font-medium text-zinc-400">/{p.unit}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400">Stok</span>
                        <button
                          onClick={() => quickStock(p.id, p.stock - 1)}
                          disabled={busyId === p.id || p.stock <= 0}
                          aria-label="Kurangi stok"
                          className="grid size-6 place-items-center rounded-md bg-zinc-100 text-zinc-600 transition active:scale-90 disabled:opacity-40"
                        >
                          <Minus size={11} />
                        </button>
                        <span
                          className={`min-w-7 text-center text-[12px] font-extrabold ${
                            p.stock <= 0
                              ? "text-rose-500"
                              : p.stock <= 5
                                ? "text-orange-500"
                                : "text-zinc-700"
                          }`}
                        >
                          {busyId === p.id ? "…" : p.stock}
                        </span>
                        <button
                          onClick={() => quickStock(p.id, p.stock + 1)}
                          disabled={busyId === p.id}
                          aria-label="Tambah stok"
                          className="grid size-6 place-items-center rounded-md bg-emerald-100 text-emerald-600 transition active:scale-90 disabled:opacity-40"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => setEditProduct(p)} className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-600 transition active:scale-90">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => removeItem("products", p.id, loadProducts)}
                        disabled={busyId === p.id}
                        className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition active:scale-90 disabled:opacity-50"
                      >
                        {busyId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= BANNER ================= */}
          {tab === "banner" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[17px] font-black">Banner Beranda ({bannersL.length})</h1>
                <button onClick={() => setEditBanner("new")} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11.5px] font-extrabold text-white shadow">
                  <Plus size={14} /> Tambah Banner
                </button>
              </div>
              {bannersL.length === 0 && <Empty label="Belum ada banner — beranda memakai banner bawaan" />}
              {bannersL.map((b) => (
                <div key={b.id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt={b.title} className="h-24 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[12.5px] font-bold">{b.title}</p>
                      <p className="line-clamp-1 text-[10.5px] text-zinc-400">{b.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => toggleActive("banners", b.id, !b.active)}
                        disabled={busyId === b.id}
                        className={`grid size-8 place-items-center rounded-lg transition active:scale-90 ${b.active ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}
                        title={b.active ? "Sembunyikan" : "Tampilkan"}
                      >
                        {b.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => setEditBanner(b)} className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-600 transition active:scale-90">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("banners", b.id, loadBanners)}
                        disabled={busyId === b.id}
                        className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition active:scale-90 disabled:opacity-50"
                      >
                        {busyId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= FAQ ================= */}
          {tab === "faq" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-[17px] font-black">FAQ ({faqsL.length})</h1>
                <button onClick={() => setEditFaq("new")} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11.5px] font-extrabold text-white shadow">
                  <Plus size={14} /> Tambah FAQ
                </button>
              </div>
              {faqsL.length === 0 && <Empty label="Belum ada FAQ — beranda memakai FAQ bawaan" />}
              {faqsL.map((f) => (
                <div key={f.id} className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold">{f.question}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">{f.answer}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => toggleActive("faqs", f.id, !f.active)}
                        disabled={busyId === f.id}
                        className={`grid size-8 place-items-center rounded-lg transition active:scale-90 ${f.active ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}
                      >
                        {f.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => setEditFaq(f)} className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-600 transition active:scale-90">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("faqs", f.id, loadFaqs)}
                        disabled={busyId === f.id}
                        className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition active:scale-90 disabled:opacity-50"
                      >
                        {busyId === f.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= PENGATURAN ================= */}
          {tab === "pengaturan" && (
            <div className="space-y-4">
              <h1 className="text-[17px] font-black">Pengaturan Website</h1>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-extrabold">Logo Toko</p>
                    <p className="text-[10.5px] text-zinc-400">
                      Upload logo — tersimpan otomatis ke database
                    </p>
                  </div>
                  {logoSaving ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-600">
                      <Loader2 size={11} className="animate-spin" /> Menyimpan...
                    </span>
                  ) : logoSaved ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                      <Save size={11} /> Tersimpan ✓
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    title="Klik untuk ganti logo"
                    className="group relative flex h-14 shrink-0 items-center justify-center overflow-visible transition active:scale-95"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logo || "/logo-gbifresh.svg"}
                      alt="logo"
                      className="h-full w-auto object-contain"
                    />
                    <span className="absolute inset-0 hidden place-items-center rounded-xl bg-black/45 group-hover:grid">
                      {logoSaving ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : (
                        <Pencil size={15} className="text-white" />
                      )}
                    </span>
                  </button>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-200 bg-green-50 px-3 py-3 text-[11px] font-bold text-green-700 transition active:scale-[0.99]"
                    >
                      {logoSaving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {logoSaving ? "Menyimpan logo..." : "Upload logo PNG transparan"}
                    </button>
                    <input
                      value={settings.logo.startsWith("data:") ? "" : settings.logo}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      onBlur={() => void saveLogo(settings.logo)}
                      placeholder="Atau tempel URL logo"
                      className={`${inputCls} text-[11px]`}
                    />
                  </div>
                </div>
                <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[9.5px] font-medium leading-relaxed text-emerald-700">
                  Logo tampil apa adanya sesuai file transparan yang diupload — tanpa kotak,
                  tanpa background tambahan, tanpa dibungkus frame putih.
                </p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-2.5 text-[13px] font-extrabold">Informasi Toko</p>
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Nama brand</span>
                    <input value={settings.brandName} onChange={(e) => setSettings({ ...settings, brandName: e.target.value })} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Nomor WhatsApp Admin (format: 628xxx)</span>
                    <input value={settings.waNumber} onChange={(e) => setSettings({ ...settings, waNumber: e.target.value.replace(/\D/g, "") })} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Alamat toko (ambil di tempat)</span>
                    <input value={settings.storeAddress} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Jam operasional</span>
                    <input value={settings.openHours} onChange={(e) => setSettings({ ...settings, openHours: e.target.value })} className={inputCls} />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-2.5 text-[13px] font-extrabold">SEO Website</p>
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Judul situs (title)</span>
                    <input value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Deskripsi (meta description)</span>
                    <textarea rows={2} value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className={`${inputCls} resize-none`} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] font-bold text-zinc-500">Kata kunci (keywords)</span>
                    <textarea rows={2} value={settings.siteKeywords} onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })} className={`${inputCls} resize-none`} />
                  </label>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={savingSettings || !settingsChanged}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60 ${
                  settingsChanged
                    ? "bg-gradient-to-r from-green-500 to-green-600 shadow-[0_8px_20px_rgba(22,163,74,0.4)]"
                    : "bg-zinc-300 shadow-none"
                }`}
              >
                {savingSettings ? <Loader2 size={17} className="animate-spin" /> : <Save size={16} />}
                {savingSettings ? "Menyimpan ke database..." : savedOk ? "✓ Tersimpan ke Database!" : settingsChanged ? "Simpan Perubahan" : "Tidak ada perubahan"}
              </button>
              {savedOk && (
                <p className="mt-2 text-center text-[11px] font-bold text-green-600">
                  ✓ Semua perubahan (termasuk nomor WA) sudah tersimpan ke database dan aktif di seluruh website
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ============ MODAL PRODUK ============ */}
      {editProduct && (
        <ProductForm
          initial={editProduct === "new" ? null : editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={() => {
            setEditProduct(null);
            loadProducts();
          }}
        />
      )}
      {/* ============ MODAL BANNER ============ */}
      {editBanner && (
        <BannerForm
          initial={editBanner === "new" ? null : editBanner}
          onClose={() => setEditBanner(null)}
          onSaved={() => {
            setEditBanner(null);
            loadBanners();
          }}
        />
      )}
      {/* ============ MODAL FAQ ============ */}
      {editFaq && (
        <FaqForm
          initial={editFaq === "new" ? null : editFaq}
          onClose={() => setEditFaq(null)}
          onSaved={() => {
            setEditFaq(null);
            loadFaqs();
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ forms
function useSave(onSaved: () => void, loadStats?: () => void) {
  const [saving, setSaving] = useState(false);
  const save = async (resource: string, id: number | null, payload: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/cms/${resource}${id ? `?id=${id}` : ""}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setSaving(false);
    loadStats?.();
    onSaved();
  };
  return { saving, save };
}

function SaveBtn({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-[12.5px] font-extrabold text-white shadow transition active:scale-[0.98] disabled:opacity-60"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
      {saving ? "Menyimpan..." : "Simpan"}
    </button>
  );
}

function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "buah-fresh",
    origin: initial?.origin ?? "",
    price: initial?.price ?? 0,
    originalPrice: initial?.originalPrice ?? 0,
    unit: initial?.unit ?? "kg",
    stock: initial?.stock ?? 20,
    description: initial?.description ?? "",
    image: initial?.image ?? "",
  });
  const { saving, save } = useSave(onSaved);

  return (
    <Modal title={initial ? "Edit Produk" : "Tambah Produk"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save("products", initial?.id ?? null, f);
        }}
        className="space-y-2.5"
      >
        <ImageUpload value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        <input required placeholder="Nama buah *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={inputCls}>
            <option value="buah-fresh">🍇 Buah Fresh</option>
            <option value="buah-frozen">🧊 Buah Frozen</option>
            <option value="sayuran">🥬 Sayuran</option>
            <option value="daging">🥩 Daging</option>
            <option value="seafood">🦐 Seafood</option>
            <option value="sembako">🍚 Sembako</option>
            <option value="protein">🥚 Protein</option>
            <option value="makanan-instan">🍜 Makanan Instan</option>
            <option value="bumbu">🧄 Bahan Masak & Bumbu</option>
            <option value="frozen-food">❄️ Frozen Food</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold text-zinc-400">Harga jual (Rp)</span>
            <input required type="number" min={1} value={f.price || ""} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold text-zinc-400">Harga coret (promo, opsional)</span>
            <input type="number" min={0} value={f.originalPrice || ""} onChange={(e) => setF({ ...f, originalPrice: Number(e.target.value) })} className={inputCls} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Satuan (kg/pack/buah)" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} className={inputCls} />
          <input type="number" min={0} placeholder="Stok" value={f.stock || ""} onChange={(e) => setF({ ...f, stock: Number(e.target.value) })} className={inputCls} />
        </div>
        <textarea rows={3} placeholder="Deskripsi buah" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${inputCls} resize-none`} />
        <SaveBtn saving={saving} />
      </form>
    </Modal>
  );
}

function BannerForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    badge: initial?.badge ?? "",
    image: initial?.image ?? "",
    ctaText: initial?.ctaText ?? "Belanja Sekarang",
    ctaLink: initial?.ctaLink ?? "#katalog",
    sort: initial?.sort ?? 0,
  });
  const { saving, save } = useSave(onSaved);

  return (
    <Modal title={initial ? "Edit Banner" : "Tambah Banner"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save("banners", initial?.id ?? null, f);
        }}
        className="space-y-2.5"
      >
        <ImageUpload value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        <input required placeholder="Judul banner *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} />
        <input placeholder="Sub judul" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Badge (mis. Panen Harian)" value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Urutan" value={f.sort} onChange={(e) => setF({ ...f, sort: Number(e.target.value) })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Teks tombol" value={f.ctaText} onChange={(e) => setF({ ...f, ctaText: e.target.value })} className={inputCls} />
          <input placeholder="Link tombol" value={f.ctaLink} onChange={(e) => setF({ ...f, ctaLink: e.target.value })} className={inputCls} />
        </div>
        <SaveBtn saving={saving} />
      </form>
    </Modal>
  );
}

function FaqForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Faq | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    sort: initial?.sort ?? 0,
  });
  const { saving, save } = useSave(onSaved);

  return (
    <Modal title={initial ? "Edit FAQ" : "Tambah FAQ"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save("faqs", initial?.id ?? null, f);
        }}
        className="space-y-2.5"
      >
        <input required placeholder="Pertanyaan *" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} className={inputCls} />
        <textarea rows={4} placeholder="Jawaban" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} className={`${inputCls} resize-none`} />
        <input type="number" placeholder="Urutan" value={f.sort} onChange={(e) => setF({ ...f, sort: Number(e.target.value) })} className={inputCls} />
        <SaveBtn saving={saving} />
      </form>
    </Modal>
  );
}