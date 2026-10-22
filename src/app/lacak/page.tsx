import type { Metadata } from "next";
import { LacakClient } from "@/components/lacak-client";

export const metadata: Metadata = {
  title: "Lacak Pesanan — GBIFRESH",
  description: "Cek status pesanan buah segar kamu dengan kode pesanan.",
};

export default async function LacakPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <LacakClient initialCode={code ?? ""} />;
}
