"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/format";

const SettingsContext = createContext<SiteSettings>({ ...DEFAULT_SETTINGS });

export function SettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: ReactNode;
}) {
  // Mulai dengan server-rendered value, lalu fetch terbaru dari database
  const [settings, setSettings] = useState<SiteSettings>({
    ...DEFAULT_SETTINGS,
    ...value,
  });

  useEffect(() => {
    // Fetch settings terbaru dari database agar nomor WA dll selalu up-to-date
    fetch("/api/cms/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object" && !d.error) {
          setSettings((s) => ({ ...s, ...d }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext);
}

// ---------------------------------------------------------------------------
// Visitor ID helper
// ---------------------------------------------------------------------------
function getVisitorId(): string {
  try {
    let visitor = localStorage.getItem("gbi-visitor") || "";
    if (!visitor) {
      visitor =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v${Date.now()}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("gbi-visitor", visitor);
    }
    return visitor;
  } catch {
    return "anon";
  }
}

// ---------------------------------------------------------------------------
// Tracking pengunjung — kirim 1x per halaman per sesi ke /api/cms/track
// ---------------------------------------------------------------------------
export function TrackView() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try {
      const key = `gbi-pv:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      fetch("/api/cms/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, visitor: getVisitorId() }),
      }).catch(() => {});
    } catch {
      /* abaikan */
    }
  }, [pathname]);

  return null;
}

// ---------------------------------------------------------------------------
// Track klik WhatsApp — panggil setiap user klik link/tombol WA
// ---------------------------------------------------------------------------
export function trackWaClick(source: string) {
  try {
    fetch("/api/cms/wa-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, visitor: getVisitorId() }),
    }).catch(() => {});
  } catch {
    /* abaikan */
  }
}
