# Migrasi GBIFRESH dari Next.js ke PHP Laravel

Dokumen ini memetakan aplikasi GBIFRESH saat ini ke arsitektur Laravel agar bisa dipindahkan penuh di server PHP/Laravel.

---

## Catatan Penting

Project sandbox saat ini dibangun di runtime Next.js/Node dan tervalidasi oleh pipeline yang mengharuskan:
- `npx next typegen`
- `tsc`
- `npm run build`
- `build_and_start`

Karena itu, **switch framework langsung di sandbox ini ke Laravel tidak bisa dijalankan sebagai aplikasi final** tanpa mematahkan sistem build. Namun seluruh spesifikasi migrasi di bawah ini sudah disiapkan agar implementasi Laravel bisa dilakukan di environment PHP terpisah.

---

# 1. Stack Laravel yang Direkomendasikan

## Opsi paling dekat dengan UX sekarang
- **Laravel 12**
- **Blade + Alpine.js** untuk storefront mobile
- **Filament Admin** atau **custom admin Blade**
- **MySQL / MariaDB**
- **Intervention Image** untuk upload logo/banner/produk
- **Laravel Storage** untuk file gambar
- **Laravel Queue** opsional untuk generate receipt image

## Jika ingin SPA modern
- Laravel + Inertia + Vue/React
- tapi untuk kebutuhan toko + admin, Blade sudah cukup dan lebih cepat

---

# 2. Struktur Laravel yang Disarankan

```bash
app/
  Http/
    Controllers/
      Store/
        HomeController.php
        ProductController.php
        CartController.php
        CheckoutController.php
        TrackingController.php
        ReceiptController.php
      Admin/
        DashboardController.php
        ProductController.php
        BannerController.php
        FaqController.php
        SettingsController.php
        OrderController.php
  Models/
    Product.php
    Order.php
    OrderItem.php
    Banner.php
    Faq.php
    SiteSetting.php
    Pageview.php
    WaClick.php
database/
  migrations/
resources/
  views/
    store/
    admin/
routes/
  web.php
  api.php
```

---

# 3. Tabel Database Laravel / MySQL

## products
Kolom:
- id
- slug (unique)
- name
- category (`fresh`, `frozen`, `kupas`, `potong`)
- origin
- description
- price
- original_price nullable
- unit
- image
- stock
- rating
- sold
- created_at
- updated_at

## orders
- id
- code (unique)
- customer_name
- phone
- address
- delivery_method (`instan`, `pickup`)
- note nullable
- subtotal
- total
- status (`baru`, `diproses`, `dikirim`, `selesai`, `batal`)
- created_at
- updated_at

## order_items
- id
- order_id
- product_id nullable
- name
- price
- qty
- unit
- subtotal
- created_at
- updated_at

## banners
- id
- title
- subtitle
- badge
- image
- cta_text
- cta_link
- sort
- active
- created_at
- updated_at

## faqs
- id
- question
- answer
- sort
- active
- created_at
- updated_at

## site_settings
- key (primary)
- value (longText / text)
- created_at
- updated_at

## pageviews
- id
- path
- visitor
- created_at
- updated_at

## wa_clicks
- id
- source
- visitor
- created_at
- updated_at

---

# 4. Contoh Migration Laravel

## create_products_table.php
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->string('category');
    $table->string('origin')->default('GBI');
    $table->text('description');
    $table->integer('price');
    $table->integer('original_price')->nullable();
    $table->string('unit')->default('kg');
    $table->longText('image');
    $table->integer('stock')->default(50);
    $table->integer('rating')->default(48);
    $table->integer('sold')->default(0);
    $table->timestamps();
});
```

## create_orders_table.php
```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();
    $table->string('customer_name');
    $table->string('phone');
    $table->text('address')->default('-');
    $table->string('delivery_method')->default('instan');
    $table->text('note')->nullable();
    $table->integer('subtotal');
    $table->integer('total');
    $table->string('status')->default('baru');
    $table->timestamps();
});
```

## create_order_items_table.php
```php
Schema::create('order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
    $table->string('name');
    $table->integer('price');
    $table->integer('qty');
    $table->string('unit');
    $table->integer('subtotal');
    $table->timestamps();
});
```

---

# 5. Model Relationship Laravel

## Product.php
```php
class Product extends Model
{
    protected $guarded = [];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
```

## Order.php
```php
class Order extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
```

## OrderItem.php
```php
class OrderItem extends Model
{
    protected $guarded = [];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
```

---

# 6. Route Mapping Laravel

## routes/web.php
```php
use App\Http\Controllers\Store\HomeController;
use App\Http\Controllers\Store\ProductController;
use App\Http\Controllers\Store\CheckoutController;
use App\Http\Controllers\Store\TrackingController;
use App\Http\Controllers\Store\ReceiptController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\SettingsController;

Route::get('/', [HomeController::class, 'index']);
Route::get('/produk/{slug}', [ProductController::class, 'show']);
Route::get('/keranjang', [CheckoutController::class, 'index']);
Route::post('/checkout', [CheckoutController::class, 'store']);
Route::get('/lacak', [TrackingController::class, 'index']);
Route::get('/resi/{code}', [ReceiptController::class, 'show']);

Route::prefix('admin')->group(function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::resource('products', AdminProductController::class);
    Route::resource('banners', BannerController::class);
    Route::resource('faqs', FaqController::class);
    Route::get('orders', [AdminOrderController::class, 'index']);
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    Route::get('settings', [SettingsController::class, 'index']);
    Route::post('settings', [SettingsController::class, 'store']);
});
```

---

# 7. Fitur Checkout WhatsApp di Laravel

## Alur backend
1. Validasi request checkout
2. Ambil produk dari DB
3. Cek stok server-side
4. Simpan order + order_items
5. Kurangi stok produk
6. Ambil nomor WA dari `site_settings`
7. Generate pesan WhatsApp rapi
8. Redirect ke:
   - `whatsapp://send?...` di frontend mobile
   - fallback `https://api.whatsapp.com/send?...`

## Contoh Controller Checkout Laravel
```php
public function store(Request $request)
{
    $data = $request->validate([
        'customer_name' => 'required|string|min:2',
        'phone' => 'required|string|min:9',
        'address' => 'nullable|string',
        'delivery_method' => 'required|in:instan,pickup',
        'note' => 'nullable|string',
        'items' => 'required|array|min:1',
    ]);

    DB::transaction(function () use ($data, &$order, &$waUrl) {
        // ambil produk, cek stok, simpan pesanan, kurangi stok
    });

    return response()->json([
        'code' => $order->code,
        'waUrl' => $waUrl,
        'total' => $order->total,
    ]);
}
```

---

# 8. Format Pesan WhatsApp Laravel

Gunakan format yang sekarang sudah dipakai di app ini:
- ringkas
- list rapi
- tanpa kotak ASCII yang pecah di HP
- sertakan link struk

Contoh:
```text
🧾 PESANAN BARU MASUK
━━━━━━━━━━━━━━━━━━━━━

📌 Kode : GBI-XXXXXX
📅 Tanggal : 05 Oktober 2026
🕐 Jam : 21.17 WIB

🛒 PESANAN :

  1. Pisang Cavendish
     2 sisir × Rp22.000 = Rp44.000
  2. Alpukat Mentega
     1 kg × Rp29.000 = Rp29.000

━━━━━━━━━━━━━━━━━━━━━
💰 Total (3 item) : Rp73.000
🚚 Ongkir : Konfirmasi admin
━━━━━━━━━━━━━━━━━━━━━

👤 DATA PEMESAN :
  Nama : Budi
  HP : 081234567890
  Kirim : Antar Instan
  Alamat : Jl. Kaliurang KM 7 No. 14, Sleman

📄 Struk : https://domainmu.com/resi/GBI-XXXXXX

Mohon konfirmasi ongkir & pembayarannya 🙏
```

---

# 9. Halaman Struk Digital Laravel

Di Laravel, struk digital paling mudah dibuat di:
- `resources/views/store/receipt.blade.php`

Tampilannya:
- hitam putih
- mirip struk thermal
- responsive mobile
- bisa screenshot

Gunakan data:
- kode pesanan
- tanggal
- jam
- status
- daftar item
- subtotal
- ongkir: konfirmasi admin
- total
- nama
- HP
- metode pengiriman
- alamat / gudang GBI
- catatan

---

# 10. Dashboard Admin Laravel

## Fitur yang perlu dipindah
- Statistik visitor realtime-ish
- Statistik click WhatsApp
- CRUD produk
- CRUD banner
- CRUD FAQ
- Ubah logo
- Ubah nama web
- Ubah nomor WA
- Ubah alamat gudang GBI
- SEO title / description / keywords
- Update status order

## Rekomendasi tercepat
Pakai **Filament Admin**:
```bash
composer require filament/filament
php artisan filament:install --panels
```

Lalu buat resources:
```bash
php artisan make:filament-resource Product
php artisan make:filament-resource Banner
php artisan make:filament-resource Faq
php artisan make:filament-resource Order
```

Untuk settings global:
- gunakan table `site_settings`
- buat page custom Filament atau form settings biasa

---

# 11. Upload Logo / Banner / Produk di Laravel

## Simpan ke storage
Gunakan:
- `storage/app/public/`
- `php artisan storage:link`

Contoh simpan file:
```php
$path = $request->file('image')->store('products', 'public');
$url = Storage::url($path);
```

Untuk logo:
```php
$path = $request->file('logo')->store('settings', 'public');
$setting->value = Storage::url($path);
```

Kalau ingin tetap base64 juga bisa, tapi file storage lebih ringan.

---

# 12. Statistik Visitor & Klik WA di Laravel

## pageviews
Simpan saat halaman dibuka (AJAX/fetch dari frontend)

## wa_clicks
Simpan saat user klik WA

## Dashboard query
- visitor hari ini
- pageviews hari ini
- klik WA hari ini
- total klik WA
- klik WA per sumber
- total order
- omzet
- produk habis

---

# 13. SEO di Laravel

Di Blade:
```php
<title>{{ $settings['siteTitle'] ?? 'GBIFRESH' }}</title>
<meta name="description" content="{{ $settings['siteDescription'] ?? '' }}">
<meta name="keywords" content="{{ $settings['siteKeywords'] ?? '' }}">
```

---

# 14. Step-by-step Eksekusi Migrasi Nyata

## Tahap 1 — bootstrap Laravel
```bash
composer create-project laravel/laravel gbifresh-laravel
cd gbifresh-laravel
php artisan serve
```

## Tahap 2 — setup DB MySQL
`.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gbifresh
DB_USERNAME=root
DB_PASSWORD=
```

## Tahap 3 — buat migration
```bash
php artisan make:migration create_products_table
php artisan make:migration create_orders_table
php artisan make:migration create_order_items_table
php artisan make:migration create_banners_table
php artisan make:migration create_faqs_table
php artisan make:migration create_site_settings_table
php artisan make:migration create_pageviews_table
php artisan make:migration create_wa_clicks_table
```

## Tahap 4 — migrate
```bash
php artisan migrate
```

## Tahap 5 — seed data
Buat seeder untuk 20 produk kategori:
- fresh
- frozen
- kupas
- potong

## Tahap 6 — bangun storefront
Prioritas:
1. beranda
2. katalog
3. detail produk
4. checkout WA
5. lacak pesanan
6. struk digital

## Tahap 7 — bangun admin panel
Prioritas:
1. settings global
2. CRUD produk
3. order dashboard
4. statistik visitor/WA
5. banner & FAQ

---

# 15. Kesimpulan

Secara teknis, aplikasi GBIFRESH ini **sangat bisa dipindahkan ke Laravel** dengan fitur penuh, termasuk:
- storefront mobile
- checkout direct to WhatsApp
- admin CMS lengkap
- statistik pengunjung & WA
- struk digital
- SEO settings
- gudang GBI tunggal

Kalau migrasi dilakukan di server PHP/Laravel terpisah, struktur dan flow pada dokumen ini sudah cukup untuk membangun versi Laravel 1:1 dari aplikasi saat ini.
