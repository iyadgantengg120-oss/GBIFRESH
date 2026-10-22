import { NextResponse } from "next/server";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  lt,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  banners,
  faqs,
  orders,
  pageviews,
  products,
  siteSettings,
  waClicks,
} from "@/db/schema";
import { DEFAULT_SETTINGS } from "@/lib/format";
import { isAdminAuthorizedFromCookieHeader, hashPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string }> };

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "produk"}-${Math.random().toString(36).slice(2, 6)}`;
}

async function readSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...map };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { resource } = await params;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";

    if (resource === "settings") {
      return NextResponse.json(await readSettings());
    }

    if (resource === "banners") {
      const rows = await db
        .select()
        .from(banners)
        .where(activeOnly ? eq(banners.active, true) : undefined)
        .orderBy(asc(banners.sort), asc(banners.id));
      return NextResponse.json(rows);
    }

    if (resource === "faqs") {
      const rows = await db
        .select()
        .from(faqs)
        .where(activeOnly ? eq(faqs.active, true) : undefined)
        .orderBy(asc(faqs.sort), asc(faqs.id));
      return NextResponse.json(rows);
    }

    if (resource === "stats") {
      if (!isAdminAuthorizedFromCookieHeader(req.headers.get("cookie"))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);

      const [tp] = await db
        .select({ v: count() })
        .from(pageviews)
        .where(gte(pageviews.createdAt, startToday));
      const [tu] = await db
        .select({ v: countDistinct(pageviews.visitor) })
        .from(pageviews)
        .where(gte(pageviews.createdAt, startToday));
      const [ap] = await db.select({ v: count() }).from(pageviews);
      const [au] = await db
        .select({ v: countDistinct(pageviews.visitor) })
        .from(pageviews);

      // Series 7 hari terakhir
      const series: { label: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const from = new Date(startToday);
        from.setDate(from.getDate() - i);
        const to = new Date(from);
        to.setDate(to.getDate() + 1);
        const [row] = await db
          .select({ v: count() })
          .from(pageviews)
          .where(and(gte(pageviews.createdAt, from), lt(pageviews.createdAt, to)));
        series.push({
          label: from.toLocaleDateString("id-ID", { weekday: "short" }),
          count: num(row?.v),
        });
      }

      const [allOrders] = await db
        .select({
          total: count(),
          omzet: sql<number>`coalesce(sum(${orders.total}),0)`,
        })
        .from(orders);
      const [baru] = await db
        .select({ v: count() })
        .from(orders)
        .where(eq(orders.status, "baru"));
      const recentOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.id))
        .limit(5);

      // WhatsApp click stats
      const [waToday] = await db
        .select({ v: count() })
        .from(waClicks)
        .where(gte(waClicks.createdAt, startToday));
      const [waAll] = await db.select({ v: count() }).from(waClicks);

      // WA clicks per source today
      const waBySource = await db
        .select({
          source: waClicks.source,
          cnt: count(),
        })
        .from(waClicks)
        .where(gte(waClicks.createdAt, startToday))
        .groupBy(waClicks.source);

      // WA series 7 hari
      const waSeries: { label: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const from = new Date(startToday);
        from.setDate(from.getDate() - i);
        const to = new Date(from);
        to.setDate(to.getDate() + 1);
        const [row] = await db
          .select({ v: count() })
          .from(waClicks)
          .where(and(gte(waClicks.createdAt, from), lt(waClicks.createdAt, to)));
        waSeries.push({
          label: from.toLocaleDateString("id-ID", { weekday: "short" }),
          count: num(row?.v),
        });
      }

      // Produk stats
      const [productStats] = await db
        .select({
          total: count(),
          totalStock: sql<number>`coalesce(sum(${products.stock}),0)`,
          outOfStock: sql<number>`coalesce(sum(case when ${products.stock} = 0 then 1 else 0 end),0)`,
        })
        .from(products);

      // Settings
      const settingsData = await readSettings();

      return NextResponse.json({
        today: { visitors: num(tu?.v), pageviews: num(tp?.v) },
        all: { visitors: num(au?.v), pageviews: num(ap?.v) },
        series,
        orders: {
          total: num(allOrders?.total),
          baru: num(baru?.v),
          omzet: num(allOrders?.omzet),
        },
        recentOrders,
        wa: {
          today: num(waToday?.v),
          all: num(waAll?.v),
          bySource: Object.fromEntries(waBySource.map((r) => [r.source, num(r.cnt)])),
          series: waSeries,
        },
        products: {
          total: num(productStats?.total),
          totalStock: num(productStats?.totalStock),
          outOfStock: num(productStats?.outOfStock),
        },
        settings: settingsData,
      });
    }

    return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  } catch (err) {
    console.error("GET /api/cms error:", err);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — tracking pageview & buat konten baru
// ---------------------------------------------------------------------------
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { resource } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    if (resource === "track") {
      const path = String(body.path ?? "/").slice(0, 200);
      const visitor = String(body.visitor ?? "anon").slice(0, 80);
      await db.insert(pageviews).values({ path, visitor });
      return NextResponse.json({ ok: true });
    }

    if (resource === "wa-track") {
      const source = String(body.source ?? "other").slice(0, 40);
      const visitor = String(body.visitor ?? "anon").slice(0, 80);
      await db.insert(waClicks).values({ source, visitor });
      return NextResponse.json({ ok: true });
    }

    if (!isAdminAuthorizedFromCookieHeader(req.headers.get("cookie"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (resource === "banners") {
      const [row] = await db
        .insert(banners)
        .values({
          title: String(body.title ?? "").trim() || "Banner Baru",
          subtitle: String(body.subtitle ?? ""),
          badge: String(body.badge ?? ""),
          image: String(body.image ?? ""),
          ctaText: String(body.ctaText ?? "Belanja Sekarang"),
          ctaLink: String(body.ctaLink ?? "#katalog"),
          sort: num(body.sort),
          active: body.active !== false,
        })
        .returning();
      return NextResponse.json(row);
    }

    if (resource === "faqs") {
      const [row] = await db
        .insert(faqs)
        .values({
          question: String(body.question ?? "").trim() || "Pertanyaan baru",
          answer: String(body.answer ?? ""),
          sort: num(body.sort),
          active: body.active !== false,
        })
        .returning();
      return NextResponse.json(row);
    }

    if (resource === "products") {
      const name = String(body.name ?? "").trim();
      const price = num(body.price);
      const image = String(body.image ?? "");
      if (name.length < 2 || price <= 0 || !image) {
        return NextResponse.json(
          { error: "Nama, harga, dan gambar wajib diisi" },
          { status: 400 },
        );
      }
      const validCats = ["buah-fresh", "buah-frozen", "sayuran", "daging", "seafood", "sembako", "protein", "makanan-instan", "bumbu", "frozen-food"];
      const [row] = await db
        .insert(products)
        .values({
          slug: slugify(name),
          name,
          category: validCats.includes(body.category) ? body.category : "fresh",
          origin: String(body.origin ?? "Yogyakarta"),
          description: String(body.description ?? ""),
          price,
          originalPrice: num(body.originalPrice) > price ? num(body.originalPrice) : null,
          unit: String(body.unit ?? "kg"),
          image,
          stock: num(body.stock) || 20,
          rating: num(body.rating) || 48,
          sold: 0,
        })
        .returning();
      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  } catch (err) {
    console.error("POST /api/cms error:", err);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update konten (?id=) | PUT — simpan pengaturan situs
// ---------------------------------------------------------------------------
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { resource } = await params;
    const { searchParams } = new URL(req.url);
    const id = num(searchParams.get("id"));
    const body = await req.json().catch(() => null);
    if (!id || !body)
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    if (resource === "banners") {
      const set: Partial<typeof banners.$inferInsert> = {};
      for (const k of ["title", "subtitle", "badge", "image", "ctaText", "ctaLink"] as const)
        if (body[k] !== undefined) set[k] = String(body[k]);
      if (body.sort !== undefined) set.sort = num(body.sort);
      if (body.active !== undefined) set.active = !!body.active;
      const [row] = await db.update(banners).set(set).where(eq(banners.id, id)).returning();
      return NextResponse.json(row ?? {});
    }

    if (resource === "faqs") {
      const set: Partial<typeof faqs.$inferInsert> = {};
      if (body.question !== undefined) set.question = String(body.question);
      if (body.answer !== undefined) set.answer = String(body.answer);
      if (body.sort !== undefined) set.sort = num(body.sort);
      if (body.active !== undefined) set.active = !!body.active;
      const [row] = await db.update(faqs).set(set).where(eq(faqs.id, id)).returning();
      return NextResponse.json(row ?? {});
    }

    if (resource === "products") {
      const set: Partial<typeof products.$inferInsert> = {};
      if (body.name !== undefined) set.name = String(body.name);
      const validCatsPatch = ["buah-fresh", "buah-frozen", "sayuran", "daging", "seafood", "sembako", "protein", "makanan-instan", "bumbu", "frozen-food"];
      if (body.category !== undefined)
        set.category = validCatsPatch.includes(body.category) ? body.category : "fresh";
      if (body.origin !== undefined) set.origin = String(body.origin);
      if (body.description !== undefined) set.description = String(body.description);
      if (body.unit !== undefined) set.unit = String(body.unit);
      if (body.image !== undefined) set.image = String(body.image);
      if (body.price !== undefined) set.price = num(body.price);
      if (body.originalPrice !== undefined)
        set.originalPrice = num(body.originalPrice) > 0 ? num(body.originalPrice) : null;
      if (body.stock !== undefined) set.stock = num(body.stock);
      const [row] = await db.update(products).set(set).where(eq(products.id, id)).returning();
      return NextResponse.json(row ?? {});
    }

    return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  } catch (err) {
    console.error("PATCH /api/cms error:", err);
    return NextResponse.json({ error: "Gagal mengubah data" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!isAdminAuthorizedFromCookieHeader(req.headers.get("cookie"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resource } = await params;
    if (resource !== "settings")
      return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const allowed = Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[];
    for (const key of allowed) {
      const v = body[key];
      if (v === undefined) continue;
      await db
        .insert(siteSettings)
        .values({ key, value: String(v) })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(v) },
        });
    }
    return NextResponse.json(await readSettings());
  } catch (err) {
    console.error("PUT /api/cms/settings error:", err);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — hapus konten (?id=)
// ---------------------------------------------------------------------------
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { resource } = await params;
    const { searchParams } = new URL(req.url);
    const id = num(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    if (resource === "banners") await db.delete(banners).where(eq(banners.id, id));
    else if (resource === "faqs") await db.delete(faqs).where(eq(faqs.id, id));
    else if (resource === "products")
      await db.delete(products).where(eq(products.id, id));
    else return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/cms error:", err);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
