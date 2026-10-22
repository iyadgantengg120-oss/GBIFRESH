import { NextResponse } from "next/server";
import { and, asc, eq, ilike, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

// GET /api/products?category=lokal|impor&promo=1&q=mangga
export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const promo = searchParams.get("promo");
    const q = searchParams.get("q");

    const validCategories = ["buah-fresh", "buah-frozen", "sayuran", "daging", "seafood", "sembako", "protein", "makanan-instan", "bumbu", "frozen-food"];
    const conds = [];
    if (category && validCategories.includes(category)) {
      conds.push(eq(products.category, category));
    }
    if (promo === "1" || promo === "true") {
      conds.push(isNotNull(products.originalPrice));
    }
    if (q && q.trim()) {
      conds.push(ilike(products.name, `%${q.trim()}%`));
    }

    const rows = await db
      .select()
      .from(products)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(products.id));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Gagal memuat produk" },
      { status: 500 },
    );
  }
}
