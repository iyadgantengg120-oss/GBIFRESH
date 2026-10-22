import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, siteSettings } from "@/db/schema";
import { notFound } from "next/navigation";
import { rupiah, DEFAULT_SETTINGS } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getSettings() {
  try {
    const rows = await db.select().from(siteSettings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...map };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Struk ${code} — GBIFRESH`,
    description: `Struk digital pesanan ${code}`,
  };
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const settings = await getSettings();

  const tanggal = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const jam = new Date(order.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  const totalItem = items.reduce((s, i) => s + i.qty, 0);

  const STATUS_MAP: Record<string, string> = {
    baru: "MENUNGGU KONFIRMASI",
    diproses: "SEDANG DIPROSES",
    dikirim: "DALAM PENGIRIMAN",
    selesai: "SELESAI",
    batal: "DIBATALKAN",
  };

  // Menggunakan inline styles agar struk terlihat konsisten di semua browser/HP
  // dan tidak bergantung pada Tailwind yang mungkin tidak di-load di context WA in-app browser
  return (
    <div style={{ minHeight: "100vh", background: "#d4d4d4", padding: "20px 12px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: "370px", background: "#fff", fontFamily: "'Courier New', Courier, monospace", color: "#111", fontSize: "12px", lineHeight: 1.5 }}>

        {/* === HEADER === */}
        <div style={{ padding: "28px 24px 20px", textAlign: "center", borderBottom: "3px double #111" }}>
          <div style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-1px" }}>{settings.brandName}</div>
          <div style={{ fontSize: "9px", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "3px" }}>Toko Buah Segar Jogja</div>
          <div style={{ fontSize: "9px", color: "#999", marginTop: "6px", lineHeight: 1.6 }}>
            {settings.storeAddress}<br />
            WA: {settings.waNumber} &bull; {settings.openHours}
          </div>
        </div>

        {/* === INFO TRANSAKSI === */}
        <div style={{ padding: "16px 24px", borderBottom: "1px dashed #ccc" }}>
          <table style={{ width: "100%", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ color: "#888", padding: "3px 0", width: "90px" }}>No. Resi</td>
                <td style={{ padding: "3px 0" }}>: <b style={{ fontSize: "13px", letterSpacing: "1px" }}>{order.code}</b></td>
              </tr>
              <tr>
                <td style={{ color: "#888", padding: "3px 0" }}>Tanggal</td>
                <td style={{ padding: "3px 0" }}>: {tanggal}</td>
              </tr>
              <tr>
                <td style={{ color: "#888", padding: "3px 0" }}>Jam</td>
                <td style={{ padding: "3px 0" }}>: {jam} WIB</td>
              </tr>
              <tr>
                <td style={{ color: "#888", padding: "3px 0" }}>Status</td>
                <td style={{ padding: "3px 0" }}>: <b>{STATUS_MAP[order.status] ?? order.status.toUpperCase()}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* === DAFTAR ITEM === */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>Daftar Pesanan</div>

          {items.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: "12px", paddingBottom: idx < items.length - 1 ? "12px" : "0", borderBottom: idx < items.length - 1 ? "1px dotted #ddd" : "none" }}>
              <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: "2px" }}>{item.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#555" }}>
                <span>{item.qty} {item.unit} × {rupiah(item.price)}</span>
                <span style={{ fontWeight: 800, color: "#111" }}>{rupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* === TOTAL === */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ borderTop: "2px solid #111", paddingTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginBottom: "4px" }}>
              <span>Subtotal ({totalItem} item)</span>
              <span>{rupiah(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999", marginBottom: "10px" }}>
              <span>Ongkir</span>
              <span style={{ fontStyle: "italic" }}>Konfirmasi Admin</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: 900, borderTop: "2px dashed #bbb", paddingTop: "10px" }}>
              <span>TOTAL</span>
              <span>{rupiah(order.total)}</span>
            </div>
          </div>
        </div>

        {/* === DATA PEMESAN === */}
        <div style={{ padding: "16px 24px", borderTop: "3px double #111" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>Data Pemesan</div>

          <table style={{ width: "100%", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ color: "#888", padding: "3px 0", verticalAlign: "top", width: "80px" }}>Nama</td>
                <td style={{ padding: "3px 0", fontWeight: 700 }}>: {order.customerName}</td>
              </tr>
              <tr>
                <td style={{ color: "#888", padding: "3px 0", verticalAlign: "top" }}>HP / WA</td>
                <td style={{ padding: "3px 0", fontWeight: 700 }}>: {order.phone}</td>
              </tr>
              <tr>
                <td style={{ color: "#888", padding: "3px 0", verticalAlign: "top" }}>Pengiriman</td>
                <td style={{ padding: "3px 0" }}>: {order.deliveryMethod === "instan" ? "Antar Instan (Gojek/Shopee)" : "Ambil di Gudang GBI"}</td>
              </tr>
              {order.address && order.address !== "-" && (
                <tr>
                  <td style={{ color: "#888", padding: "3px 0", verticalAlign: "top" }}>Alamat</td>
                  <td style={{ padding: "3px 0", lineHeight: 1.5 }}>: {order.address}</td>
                </tr>
              )}
              {order.note && (
                <tr>
                  <td style={{ color: "#888", padding: "3px 0", verticalAlign: "top" }}>Catatan</td>
                  <td style={{ padding: "3px 0", fontStyle: "italic", color: "#666" }}>: {order.note}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* === FOOTER === */}
        <div style={{ padding: "20px 24px 28px", borderTop: "2px dashed #ccc", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 900, letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Terima Kasih</div>
          <div style={{ fontSize: "9px", color: "#aaa", lineHeight: 1.8 }}>
            Barang yang sudah dibeli tidak bisa ditukar<br />
            kecuali rusak/busuk (garansi 1×24 jam)<br /><br />
            Struk ini sah sebagai bukti pesanan<br />
            © {new Date().getFullYear()} {settings.brandName}
          </div>
        </div>
      </div>
    </div>
  );
}
