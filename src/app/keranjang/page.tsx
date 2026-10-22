import type { Metadata } from "next";
import { CartClient } from "@/components/cart-client";

export const metadata: Metadata = {
  title: "Keranjang & Checkout — GBIFRESH",
  description: "Checkout pesanan buah segar kamu, langsung terkonfirmasi via WhatsApp.",
};

export default function CartPage() {
  return <CartClient />;
}
