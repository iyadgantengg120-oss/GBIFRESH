import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdminAuthorizedFromCookieHeader } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["baru", "diproses", "dikirim", "selesai", "batal"];

// PATCH /api/orders/:id — update status pesanan (admin)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isAdminAuthorizedFromCookieHeader(req.headers.get("cookie"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const status = String(body?.status ?? "");
    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, Number(id)))
      .returning();
    if (!updated) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal mengubah status" },
      { status: 500 },
    );
  }
}
