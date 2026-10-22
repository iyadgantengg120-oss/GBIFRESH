import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Produk buah (lokal & impor)
// ---------------------------------------------------------------------------
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // buah-fresh | buah-frozen | sayuran | daging | seafood | sembako | protein | makanan-instan | bumbu | frozen-food
  origin: text("origin").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  unit: text("unit").notNull().default("kg"),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(50),
  rating: integer("rating").notNull().default(48),
  sold: integer("sold").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Pesanan pelanggan — ongkir & pembayaran diatur admin via WhatsApp
// ---------------------------------------------------------------------------
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull().default(""),
  deliveryMethod: text("delivery_method").notNull().default("instan"), // instan | pickup
  note: text("note"),
  subtotal: integer("subtotal").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("baru"), // baru | diproses | dikirim | selesai | batal
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  qty: integer("qty").notNull(),
  unit: text("unit").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ---------------------------------------------------------------------------
// Konten website yang bisa diatur dari admin panel
// ---------------------------------------------------------------------------
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  badge: text("badge").notNull().default(""),
  image: text("image").notNull(),
  ctaText: text("cta_text").notNull().default("Belanja Sekarang"),
  ctaLink: text("cta_link").notNull().default("#katalog"),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------------------------------------------------------------------------
// Statistik pengunjung (tracking pageview)
// ---------------------------------------------------------------------------
export const pageviews = pgTable("pageviews", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  visitor: text("visitor").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Tracking klik WhatsApp
// ---------------------------------------------------------------------------
export const waClicks = pgTable("wa_clicks", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // header | footer | checkout | product | bantuan
  visitor: text("visitor").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
