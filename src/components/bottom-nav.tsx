"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Home, ShoppingBasket, Truck } from "lucide-react";
import { waLink } from "@/lib/format";
import { useCart } from "./cart-provider";
import { useSettings, trackWaClick } from "./site-ctx";
import { WhatsAppIcon } from "./home-client";

function NavItem({
  href,
  label,
  active,
  external = false,
  children,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  external?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const cls = `flex w-14 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold transition ${
    active ? "text-emerald-600" : "text-zinc-400"
  }`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} onClick={onClick}>
        {children}
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {label}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const settings = useSettings();
  const { count } = useCart();

  // Sembunyikan nav bawah di halaman dengan CTA bar sendiri / dashboard admin
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/keranjang") ||
    pathname.startsWith("/produk/") ||
    pathname.startsWith("/resi/")
  ) {
    return null;
  }

  const homeActive = pathname === "/";
  const lacakActive = pathname.startsWith("/lacak");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <nav className="pointer-events-auto relative mx-auto grid h-[4.25rem] w-[min(26rem,calc(100%-1.25rem))] grid-cols-5 items-center rounded-[1.4rem] border border-black/5 bg-white/95 px-1.5 shadow-[0_12px_36px_rgba(5,46,22,0.16)] backdrop-blur">
        <NavItem href="/" label="Beranda" active={homeActive}>
          <Home size={21} strokeWidth={homeActive ? 2.5 : 2} />
        </NavItem>
        <NavItem href="/#katalog" label="Produk" active={pathname.startsWith("/produk")}>
          <Apple size={21} strokeWidth={pathname.startsWith("/produk") ? 2.5 : 2} />
        </NavItem>

        {/* Tombol keranjang di tengah */}
        <div className="relative flex justify-center">
          <Link
            href="/keranjang"
            aria-label="Keranjang belanja"
            className="absolute -top-9 grid size-14 place-items-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-[0_10px_24px_rgba(22,163,74,0.5)] ring-4 ring-[#f7fdf7] transition active:scale-95"
          >
            <ShoppingBasket size={24} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-orange-500 px-1 py-0.5 text-[10px] font-extrabold text-white shadow ring-2 ring-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
          <span className="pt-8 text-[10px] font-semibold text-zinc-400">Keranjang</span>
        </div>

        <NavItem href="/lacak" label="Lacak" active={lacakActive}>
          <Truck size={21} strokeWidth={lacakActive ? 2.5 : 2} />
        </NavItem>
        <NavItem
          href={waLink("Halo GBIFRESH, saya mau tanya-tanya dulu soal buahnya.", settings.waNumber)}
          label="Bantuan"
          active={false}
          external
          onClick={() => trackWaClick("bantuan")}
        >
          <WhatsAppIcon size={21} />
        </NavItem>
      </nav>
    </div>
  );
}
