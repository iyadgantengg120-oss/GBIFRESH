import { count } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  origin: string;
  description: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  stock: number;
  rating: number;
  sold: number;
};

const img = (id: number, ext = "jpeg") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&fit=crop&h=800&w=800`;

export const PRODUCT_SEED: SeedProduct[] = [
  // ═══════════════════ BUAH FRESH ═══════════════════
  { slug: "pisang-cavendish", name: "Pisang Cavendish", category: "buah-fresh", origin: "GBI", description: "Pisang cavendish super manis, matang pohon dan dipanen tiap pagi.", price: 22000, unit: "sisir (±1 kg)", image: img(4399936), stock: 40, rating: 48, sold: 0 },
  { slug: "mangga-harum-manis", name: "Mangga Harum Manis", category: "buah-fresh", origin: "GBI", description: "Mangga harum manis grade A. Daging tebal, minim serat, aroma harum khas.", price: 28000, unit: "kg", image: img(28939331), stock: 35, rating: 49, sold: 0 },
  { slug: "alpukat-mentega", name: "Alpukat Mentega", category: "buah-fresh", origin: "GBI", description: "Alpukat mentega daging kuning creamy. Cocok untuk toast dan jus.", price: 29000, originalPrice: 34000, unit: "kg", image: img(19808829), stock: 30, rating: 49, sold: 0 },
  { slug: "salak-pondoh", name: "Salak Pondoh", category: "buah-fresh", origin: "GBI", description: "Salak pondoh asli Turi, Sleman — manis tanpa kesat!", price: 16000, unit: "kg", image: img(38953036), stock: 45, rating: 48, sold: 0 },
  { slug: "apel-fuji", name: "Apel Fuji Import", category: "buah-fresh", origin: "GBI", description: "Apel fuji impor renyah dan juicy, manis segar dari cold storage.", price: 33000, originalPrice: 38000, unit: "kg", image: img(31558767), stock: 55, rating: 48, sold: 0 },
  { slug: "anggur-merah", name: "Anggur Merah Seedless", category: "buah-fresh", origin: "GBI", description: "Anggur merah tanpa biji, butiran besar, kulit tipis, manis segar.", price: 59000, originalPrice: 65000, unit: "kg", image: "https://images.pexels.com/photos/23042/pexels-photo.jpg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=800", stock: 32, rating: 49, sold: 0 },
  { slug: "semangka-merah", name: "Semangka Merah", category: "buah-fresh", origin: "GBI", description: "Semangka merah non-biji, manis renyah, kandungan air melimpah.", price: 15000, unit: "kg", image: img(3513238), stock: 60, rating: 48, sold: 0 },
  { slug: "buah-naga-merah", name: "Buah Naga Merah", category: "buah-fresh", origin: "GBI", description: "Buah naga merah daging pekat dan manis. Kaya antioksidan.", price: 24000, unit: "kg", image: img(3698450), stock: 28, rating: 48, sold: 0 },

  // ═══════════════════ BUAH FROZEN ═══════════════════
  { slug: "blueberry-frozen", name: "Blueberry Frozen", category: "buah-frozen", origin: "GBI", description: "Blueberry IQF siap pakai. Cocok untuk topping yoghurt dan smoothie.", price: 55000, unit: "pack 250 g", image: img(30964376), stock: 25, rating: 49, sold: 0 },
  { slug: "mangga-frozen", name: "Mangga Frozen", category: "buah-frozen", origin: "GBI", description: "Potongan mangga di-blast freeze. Langsung bisa diolah jadi jus atau es krim.", price: 32000, originalPrice: 38000, unit: "pack 500 g", image: img(7543212), stock: 30, rating: 47, sold: 0 },
  { slug: "stroberi-frozen", name: "Stroberi Frozen", category: "buah-frozen", origin: "GBI", description: "Stroberi IQF tanpa gula, asam segar alami. Untuk dessert dan selai.", price: 48000, unit: "pack 300 g", image: img(3698450), stock: 20, rating: 48, sold: 0 },

  // ═══════════════════ SAYURAN ═══════════════════
  { slug: "bayam-segar", name: "Bayam Segar", category: "sayuran", origin: "GBI", description: "Bayam hijau segar panen pagi. Cocok untuk sayur bening atau tumis.", price: 5000, unit: "ikat", image: img(12298301), stock: 50, rating: 47, sold: 0 },
  { slug: "brokoli-segar", name: "Brokoli Segar", category: "sayuran", origin: "GBI", description: "Brokoli hijau segar, kuntum rapat dan padat. Kaya vitamin C.", price: 15000, unit: "bonggol (±300 g)", image: img(12298301), stock: 30, rating: 48, sold: 0 },
  { slug: "wortel-segar", name: "Wortel Segar", category: "sayuran", origin: "GBI", description: "Wortel manis segar, renyah dan berwarna cerah. Untuk sup, jus, atau salad.", price: 10000, unit: "kg", image: img(12436198), stock: 40, rating: 47, sold: 0 },

  // ═══════════════════ DAGING ═══════════════════
  { slug: "daging-sapi-has-dalam", name: "Daging Sapi Has Dalam", category: "daging", origin: "GBI", description: "Daging sapi has dalam (tenderloin) grade A. Empuk dan minim lemak.", price: 135000, unit: "kg", image: img(5643415), stock: 15, rating: 49, sold: 0 },
  { slug: "ayam-paha-fillet", name: "Ayam Paha Fillet", category: "daging", origin: "GBI", description: "Paha ayam kampung fillet tanpa tulang. Segar dan siap masak.", price: 38000, unit: "500 g", image: img(13279395), stock: 30, rating: 48, sold: 0 },
  { slug: "daging-sapi-giling", name: "Daging Sapi Giling", category: "daging", origin: "GBI", description: "Daging sapi giling segar, cocok untuk bakso, burger, atau bolognese.", price: 65000, unit: "500 g", image: img(20051271), stock: 20, rating: 48, sold: 0 },

  // ═══════════════════ SEAFOOD ═══════════════════
  { slug: "udang-vaname", name: "Udang Vaname Segar", category: "seafood", origin: "GBI", description: "Udang vaname segar ukuran sedang (41-50). Dibersihkan dan di-pack higienis.", price: 55000, unit: "500 g", image: img(29239563), stock: 20, rating: 49, sold: 0 },
  { slug: "ikan-salmon-fillet", name: "Salmon Fillet Import", category: "seafood", origin: "GBI", description: "Fillet salmon import Norwegia tanpa tulang. Fresh dan siap masak.", price: 95000, originalPrice: 110000, unit: "200 g", image: img(29239565), stock: 12, rating: 49, sold: 0 },
  { slug: "cumi-segar", name: "Cumi Segar", category: "seafood", origin: "GBI", description: "Cumi-cumi segar ukuran medium. Sudah dibersihkan tinggal masak.", price: 45000, unit: "500 g", image: img(17711102), stock: 18, rating: 48, sold: 0 },

  // ═══════════════════ SEMBAKO ═══════════════════
  { slug: "beras-premium", name: "Beras Premium 5 kg", category: "sembako", origin: "GBI", description: "Beras putih premium kualitas terbaik. Pulen dan wangi.", price: 65000, unit: "5 kg", image: img(343871), stock: 50, rating: 48, sold: 0 },
  { slug: "minyak-goreng", name: "Minyak Goreng 2 liter", category: "sembako", origin: "GBI", description: "Minyak goreng sawit premium, jernih dan tidak mudah berbusa.", price: 30000, unit: "2 liter", image: img(16620746), stock: 40, rating: 47, sold: 0 },
  { slug: "gula-pasir", name: "Gula Pasir 1 kg", category: "sembako", origin: "GBI", description: "Gula pasir putih kristal halus. Untuk masak dan minuman sehari-hari.", price: 14000, unit: "1 kg", image: img(11912788), stock: 60, rating: 47, sold: 0 },

  // ═══════════════════ PROTEIN ═══════════════════
  { slug: "telur-ayam", name: "Telur Ayam 1 kg", category: "protein", origin: "GBI", description: "Telur ayam kampung segar, kuning pekat dan berkualitas tinggi.", price: 28000, unit: "1 kg (±16 butir)", image: img(7094745), stock: 40, rating: 48, sold: 0 },
  { slug: "tahu-putih", name: "Tahu Putih", category: "protein", origin: "GBI", description: "Tahu putih lembut dan padat, segar tanpa pengawet. Siap goreng atau bacem.", price: 5000, unit: "papan", image: img(4394258), stock: 30, rating: 47, sold: 0 },
  { slug: "tempe-segar", name: "Tempe Segar", category: "protein", origin: "GBI", description: "Tempe kedelai segar buatan lokal, fermentasi sempurna dan protein tinggi.", price: 4000, unit: "bungkus", image: img(32986480), stock: 35, rating: 47, sold: 0 },

  // ═══════════════════ MAKANAN INSTAN ═══════════════════
  { slug: "indomie-goreng", name: "Indomie Mi Goreng", category: "makanan-instan", origin: "GBI", description: "Mi instan goreng legendaris Indonesia. Stok 5 bungkus.", price: 15000, unit: "5 pcs", image: img(15823266), stock: 100, rating: 49, sold: 0 },
  { slug: "pop-mie-cup", name: "Pop Mie Cup Ayam", category: "makanan-instan", origin: "GBI", description: "Mi instan cup siap seduh. Praktis dan enak untuk camilan cepat.", price: 5000, unit: "cup", image: img(38802734), stock: 80, rating: 47, sold: 0 },

  // ═══════════════════ BAHAN MASAK & BUMBU ═══════════════════
  { slug: "bawang-merah", name: "Bawang Merah", category: "bumbu", origin: "GBI", description: "Bawang merah Brebes segar, aroma kuat dan rasa sedap untuk bumbu dasar.", price: 35000, unit: "kg", image: img(29463558), stock: 40, rating: 48, sold: 0 },
  { slug: "kecap-manis", name: "Kecap Manis ABC", category: "bumbu", origin: "GBI", description: "Kecap manis ABC botol 600 ml. Kecap favorit keluarga Indonesia.", price: 22000, unit: "600 ml", image: img(35156983), stock: 50, rating: 48, sold: 0 },
  { slug: "cabai-merah", name: "Cabai Merah Keriting", category: "bumbu", origin: "GBI", description: "Cabai merah keriting segar, pedas merata. Untuk sambal dan masakan.", price: 40000, unit: "kg", image: img(35156984), stock: 25, rating: 47, sold: 0 },

  // ═══════════════════ FROZEN FOOD ═══════════════════
  { slug: "nugget-ayam", name: "Nugget Ayam 500g", category: "frozen-food", origin: "GBI", description: "Nugget ayam crispy siap goreng. Favorit anak-anak dan keluarga.", price: 35000, unit: "500 g", image: img(16716143), stock: 40, rating: 48, sold: 0 },
  { slug: "sosis-sapi", name: "Sosis Sapi 10 pcs", category: "frozen-food", origin: "GBI", description: "Sosis sapi premium tanpa MSG. Cocok untuk BBQ atau bekal sekolah.", price: 28000, unit: "10 pcs", image: img(19846423), stock: 35, rating: 48, sold: 0 },
  { slug: "bakso-sapi-frozen", name: "Bakso Sapi Frozen", category: "frozen-food", origin: "GBI", description: "Bakso sapi urat kenyal dan gurih. Isi 25 butir, tinggal rebus.", price: 45000, originalPrice: 52000, unit: "pack 25 pcs", image: img(31701975), stock: 25, rating: 49, sold: 0 },
];

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  const [{ value }] = await db.select({ value: count() }).from(products);
  if (Number(value) === 0) {
    await db.insert(products).values(PRODUCT_SEED);
  }
  seeded = true;
}
