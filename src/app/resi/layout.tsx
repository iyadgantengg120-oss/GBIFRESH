import type { ReactNode } from "react";

// Layout khusus untuk halaman resi — tanpa wrapper toko, tanpa bottom nav
export default function ResiLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
