"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Wrapper yang menyembunyikan kontainer mobile untuk halaman resi
export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isReceipt = pathname.startsWith("/resi/");

  if (isReceipt) {
    // Halaman resi: render tanpa wrapper toko (full width, no green bg)
    return <>{children}</>;
  }

  // Halaman normal toko: wrapper mobile centered
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#f7fdf7] shadow-[0_0_60px_rgba(22,101,52,0.15)]">
      {children}
    </div>
  );
}
