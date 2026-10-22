import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const list = await db.select().from(products).orderBy(asc(products.id));
  return <HomeClient products={list} />;
}
