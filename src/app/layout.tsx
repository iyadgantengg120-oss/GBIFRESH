import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/format";
import { CartProvider } from "@/components/cart-provider";
import { BottomNav } from "@/components/bottom-nav";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { SettingsProvider, TrackView } from "@/components/site-ctx";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

async function readSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(siteSettings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...map };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// SEO dinamis — bisa diubah dari admin panel
export async function generateMetadata(): Promise<Metadata> {
  const s = await readSettings();
  return {
    title: s.siteTitle,
    description: s.siteDescription,
    keywords: s.siteKeywords.split(",").map((k) => k.trim()),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await readSettings();

  return (
    <html lang="id" className={jakarta.variable}>
      <body
        className={`${jakarta.className} bg-[#e8f5e9] bg-[radial-gradient(circle_at_20%_0%,#f0fdf0_0%,transparent_55%),radial-gradient(circle_at_90%_100%,#dcfce7_0%,transparent_50%)] antialiased`}
      >
        <SettingsProvider value={settings}>
          <CartProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <BottomNav />
            <TrackView />
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
