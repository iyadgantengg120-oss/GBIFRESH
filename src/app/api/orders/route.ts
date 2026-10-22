import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, siteSettings } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import {
  DEFAULT_SETTINGS,
  deliveryLabel,
  rupiah,
  waLink,
} from "@/lib/format";
import { isAdminAuthorizedFromCookieHeader } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/orders?code=GBI-XXXX&phone=08xx  → lacak pesanan
// GET /api/orders                          → daftar pesanan terbaru (admin)
export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const phone = searchParams.get("phone")?.trim();

    if (code) {
      const conds = [eq(orders.code, code)];
      if (phone) conds.push(eq(orders.phone, phone));
      const [order] = await db
        .select()
        .from(orders)
        .where(and(...conds))
        .limit(1);
      if (!order) {
        return NextResponse.json(
          { error: "Pesanan tidak ditemukan. Cek kembali kode & no. HP." },
          { status: 404 },
        );
      }
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return NextResponse.json({ order, items });
    }

    if (!isAdminAuthorizedFromCookieHeader(req.headers.get("cookie"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(50);
    if (rows.length === 0) return NextResponse.json([]);
    const items = await db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map((r) => r.id),
        ),
      );
    return NextResponse.json(
      rows.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })),
    );
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json(
      { error: "Gagal memuat pesanan" },
      { status: 500 },
    );
  }
}

type IncomingItem = { slug?: string; qty?: number };

// POST /api/orders — buat pesanan (validasi & potong stok), kembalikan link WhatsApp
export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").replace(/\D/g, "");
    const deliveryMethod = String(body.deliveryMethod ?? "instan");
    const address = String(body.address ?? "").trim();
    const note = String(body.note ?? "").trim();
    const items: IncomingItem[] = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2)
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    if (phone.length < 9 || phone.length > 15)
      return NextResponse.json(
        { error: "No. HP/WA tidak valid" },
        { status: 400 },
      );
    if (deliveryMethod !== "instan" && deliveryMethod !== "pickup")
      return NextResponse.json(
        { error: "Metode pengiriman tidak valid" },
        { status: 400 },
      );
    if (deliveryMethod === "instan" && address.length < 8)
      return NextResponse.json(
        { error: "Alamat lengkap wajib diisi untuk pengiriman instan" },
        { status: 400 },
      );
    if (items.length === 0)
      return NextResponse.json(
        { error: "Keranjang masih kosong" },
        { status: 400 },
      );

    const slugs = items.map((i) => String(i.slug ?? "")).filter(Boolean);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.slug, slugs));
    const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));

    const lines: {
      productName: string;
      unit: string;
      price: number;
      qty: number;
      productId: number;
    }[] = [];
    for (const item of items) {
      const p = bySlug.get(String(item.slug ?? ""));
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 0)));
      if (!p) {
        return NextResponse.json(
          { error: "Ada produk yang tidak tersedia lagi" },
          { status: 400 },
        );
      }
      if (p.stock <= 0) {
        return NextResponse.json(
          { error: `Stok ${p.name} sedang habis` },
          { status: 400 },
        );
      }
      if (p.stock < qty) {
        return NextResponse.json(
          { error: `Stok ${p.name} tersisa ${p.stock}` },
          { status: 400 },
        );
      }
      lines.push({
        productName: p.name,
        unit: p.unit,
        price: p.price,
        qty,
        productId: p.id,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const total = subtotal;
    const code = `GBI-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(
      Math.random() * 36 ** 2,
    )
      .toString(36)
      .toUpperCase()
      .padStart(2, "0")}`;

    const [order] = await db
      .insert(orders)
      .values({
        code,
        customerName,
        phone,
        address: address || "-",
        deliveryMethod,
        note: note || null,
        subtotal,
        total,
        status: "baru",
      })
      .returning();

    await db.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        name: l.productName,
        price: l.price,
        qty: l.qty,
        unit: l.unit,
        subtotal: l.price * l.qty,
      })),
    );

    // potong stok & tambah jumlah terjual
    for (const l of lines) {
      await db
        .update(products)
        .set({
          stock: sql`GREATEST(${products.stock} - ${l.qty}, 0)`,
          sold: sql`${products.sold} + ${l.qty}`,
        })
        .where(eq(products.id, l.productId));
    }

    // Nomor WA admin dari pengaturan situs
    let waNumber: string = DEFAULT_SETTINGS.waNumber;
    try {
      const [row] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, "waNumber"))
        .limit(1);
      if (row?.value) waNumber = row.value;
    } catch {
      /* pakai default */
    }

    const tgl = new Date(order.createdAt).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const jam = new Date(order.createdAt).toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    });

    const host = req.headers.get("host") || "gbifresh.com";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const receiptUrl = `${protocol}://${host}/resi/${code}`;

    const totalItems = lines.reduce((s, l) => s + l.qty, 0);

    // Ambil alamat gudang dari settings
    let storeAddress: string = DEFAULT_SETTINGS.storeAddress;
    try {
      const [addrRow] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, "storeAddress"))
        .limit(1);
      if (addrRow?.value) storeAddress = addrRow.value;
    } catch { /* default */ }

    const msg: string[] = [];

    msg.push("🧾 *PESANAN BARU MASUK*");
    msg.push("━━━━━━━━━━━━━━━━━━━━━");
    msg.push("");
    msg.push(`📌 *Kode* : ${code}`);
    msg.push(`📅 *Tanggal* : ${tgl}`);
    msg.push(`🕐 *Jam* : ${jam} WIB`);
    msg.push("");

    msg.push("🛒 *PESANAN :*");
    msg.push("");
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      msg.push(`  ${i + 1}. *${l.productName}*`);
      msg.push(`     ${l.qty} ${l.unit} × ${rupiah(l.price)} = *${rupiah(l.price * l.qty)}*`);
    }
    msg.push("");

    msg.push("━━━━━━━━━━━━━━━━━━━━━");
    msg.push(`💰 *Total (${totalItems} item) : ${rupiah(total)}*`);
    msg.push(`🚚 Ongkir : _Konfirmasi admin_`);
    msg.push("━━━━━━━━━━━━━━━━━━━━━");
    msg.push("");

    msg.push("👤 *DATA PEMESAN :*");
    msg.push(`  Nama : ${customerName}`);
    msg.push(`  HP : ${phone}`);
    if (deliveryMethod === "instan") {
      msg.push(`  Kirim : Antar Instan`);
      msg.push(`  Alamat : ${address}`);
    } else {
      msg.push(`  Kirim : Ambil di Gudang GBI`);
      msg.push(`  Lokasi : ${storeAddress}`);
    }
    if (note) {
      msg.push(`  Catatan : _${note}_`);
    }
    msg.push("");

    msg.push(`📄 *Struk :* ${receiptUrl}`);
    msg.push("");
    msg.push("Mohon konfirmasi ongkir & pembayarannya 🙏");

    const message = msg.join("\n");

    return NextResponse.json({ code, waUrl: waLink(message, waNumber), total });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      { error: "Gagal membuat pesanan" },
      { status: 500 },
    );
  }
}
