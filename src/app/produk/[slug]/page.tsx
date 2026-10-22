import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { DetailClient } from "@/components/detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await ensureSeeded();
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!p) return { title: "Produk tidak ditemukan — GBIFRESH" };
  return {
    title: `${p.name} — GBIFRESH`,
    description: p.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await ensureSeeded();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product) notFound();

  const related = await db
    .select()
    .from(products)
    .where(
      and(eq(products.category, product.category), ne(products.id, product.id)),
    )
    .orderBy(asc(products.id))
    .limit(4);

  return <DetailClient product={product} related={related} />;
}
