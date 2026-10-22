import { NextResponse } from "next/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

// GET /api/products/:slug — detail produk + rekomendasi terkait
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await ensureSeeded();
    const { slug } = await params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    const related = await db
      .select()
      .from(products)
      .where(
        and(eq(products.category, product.category), ne(products.id, product.id)),
      )
      .orderBy(asc(products.id))
      .limit(4);

    return NextResponse.json({ product, related });
  } catch (err) {
    console.error("GET /api/products/[slug] error:", err);
    return NextResponse.json(
      { error: "Gagal memuat detail produk" },
      { status: 500 },
    );
  }
}
