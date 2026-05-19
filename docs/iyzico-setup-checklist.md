# Iyzico Entegrasyon — Yüksel Hanım'dan İstenecek Bilgiler

> **Tarih:** 2026-05-19
> **Amaç:** Netport sitesinde "3 Ek Rapor — ₺499" paketinin kart ödemesini Iyzico üzerinden almak.
> **Hesap:** Netport şirketinin Iyzico merchant hesabı (Yüksel Hanım'ın firma kayıtlı).
>
> Kod tarafı hazır — env vars + Iyzico panel ayarları gelince entegrasyon canlıya geçer.

---

## 1️⃣ Yüksel Hanım'dan istenecek 4 ana kalem

### A. Iyzico API Key + Secret Key

Iyzico merchant panelinde:
1. Giriş: https://merchant.iyzipay.com/login
2. **Sol menü** → **Ayarlar** → **API anahtarları** (English: "API keys")
3. İki değer kopyalanır:
   - **API anahtarı** → şuna benzer: `sandbox-XXXXXXXXXXXXXXXX` (sandbox) veya `prod-XXXXXX` (prod)
   - **Secret anahtar** → uzun random string

> ⚠ **Önce sandbox key'leri** istemek önemli (test edip onayladıktan sonra production'a geçilir).

**Yüksel Hanım'a soracaklar:**
- [ ] Sandbox API key (panelde "Test ortamı" sekmesinden)
- [ ] Sandbox Secret key
- [ ] Production API key (sandbox testi tamamlandıktan sonra)
- [ ] Production Secret key

### B. Iyzico panelinde "Callback URL" whitelist

Iyzico, ödeme tamamlandıktan sonra Netport sitesine geri çağrı (callback) yapar. Bu URL'i Yüksel'in Iyzico panelinde **kaydetmesi şart**, yoksa Iyzico ödeme onayı iletemez.

**Yüksel Hanım'a soracaklar:**
- [ ] Iyzico panelinden "Ayarlar > Geri Dönüş URL'i" veya "Webhook URL" bölümüne şu adresi ekle:
  ```
  https://netport-ihracat-asistani.vercel.app/api/webhooks/iyzico
  ```
- [ ] **Hem sandbox hem production için** ayrı ayrı eklenmeli (Iyzico iki ortamı ayrı yönetir).

### C. Merchant hesap onayı + KYC durumu

Iyzico para çekmek için hesabın **onaylı** olması lazım. Yeni bir Iyzico hesabı açıldıysa onay süreci 5-15 iş günü.

**Yüksel Hanım'a soracaklar:**
- [ ] Iyzico merchant hesabı **onaylı mı?** (panelde "Onaylanmış Merchant" badge varsa ✓)
- [ ] Bireysel mi yoksa **şirket** olarak mı kayıtlı? (Netport şirketse fatura ile uyumlu olur — bireyselden geçirmek ek 1 ay alır)
- [ ] Vergi levhası, ticaret sicil kaydı vs. Iyzico'ya yüklenmiş mi?

### D. Banka hesabı + para çekme

Iyzico'dan gelen ödemeler **3-7 iş günü** sonra Yüksel'in banka hesabına yatar.

**Yüksel Hanım'a soracaklar:**
- [ ] Iyzico panelinde **IBAN tanımlı mı?** (Ayarlar > Banka Hesabı)
- [ ] Otomatik para çekme açık mı yoksa manuel mi? (Otomatik önerilir — her gün/hafta auto-transfer)
- [ ] Hangi banka? (TEB, Garanti, Akbank vs. — şu an sadece bilgi olarak, kod değişmez)

---

## 2️⃣ Kod tarafı hazır (Yüksel'i beklerken yapıldı)

| Dosya | Durum |
|-------|-------|
| `src/lib/iyzico.ts` | ✅ Hazır — `initializeCheckoutForm` + `retrieveCheckoutForm` |
| `src/actions/iyzico.ts` | ✅ Hazır — `createReportPackCheckout()` server action |
| `src/app/api/webhooks/iyzico/route.ts` | ✅ Hazır — callback handler + idempotency |
| `supabase/migrations/015_iyzico_pending_payments.sql` | ✅ Yazıldı (DB'ye uygulanması gerek) |
| `package.json` | ✅ `iyzipay@^2.0.67` eklendi |

**Env vars hazır mı kontrol:** `.env.example` dosyasında 3 değişken eklendi — sandbox key'ler gelince Vercel'e + `.env.local`'e eklenecek.

---

## 3️⃣ Ne zaman ne olur — akış zaman çizelgesi

### Hemen (bugün/yarın)
- [ ] Yüksel Hanım Iyzico paneline giriş yapar → API key + Secret key'i WhatsApp ile gönderir
- [ ] Yüksel Iyzico panelden callback URL'i whitelist eder
- [ ] Umut: `.env.local` + Vercel'e sandbox key'leri ekler
- [ ] Umut: Migration 015'i Supabase Dashboard'tan çalıştırır (`iyzico_pending_payments` tablosu)

### Sonra (sandbox test, ~30 dk)
- [ ] Umut: pricing page'de "WhatsApp ile İletişim" butonunu **"Kartla Öde — ₺499"** butonuyla değiştirir (Iyzico checkout'a yönlendirir)
- [ ] Umut: Iyzico sandbox kartı ile test eder:
  - Kart no: `5526080000000006`
  - Son kullanma: `12/30`
  - CVV: `100`
  - 3D Secure: SMS kodu yerine "test"
- [ ] Test başarılıysa: `subscriptions.extra_tokens` 3 artmalı, dashboard'da meter güncellenmiş olmalı

### Production'a geçiş (sandbox onaylandıktan sonra)
- [ ] Yüksel: Iyzico panelden **production API key + secret** alır
- [ ] Yüksel: Production callback URL'ini de whitelist eder (aynı URL)
- [ ] Umut: Vercel env vars production'a switch eder (`IYZICO_BASE_URL` → `https://api.iyzipay.com`)
- [ ] Umut + Yüksel: ₺1 gerçek kart testi yapar (sonra refund)
- [ ] Production launch

---

## 4️⃣ Yasal/Mali açıklamalar (Yüksel Hanım'la teyit)

> Bu maddeler **henüz onaylı değil** — Yüksel Hanım'la sözlü/yazılı netleştirilmeli.

### Iş ortaklığı
- Netport gelirleri **Yüksel'in Iyzico hesabına** gider
- Yüksel **net kar %50'sini** Umut'a transfer eder (EFT/Wise)
- Aylık settlement: her ayın 5'inde önceki ayın geliri paylaşılır
- Maliyetler (OpenRouter, Vercel, Iyzico komisyonu) **Yüksel'in firması üzerinden** geçer, gelirden düşülür

### Faturalandırma
- Müşteriye fatura **Yüksel'in firması** keser (Iyzico hesabı orada)
- Umut'a yapılan transfer "danışmanlık / yazılım hizmet bedeli" olarak Yüksel firmasından **Umut adına** faturalanır

### KVKK / Kullanıcı Sözleşmesi
- Mevcut sözleşme Netport (Yüksel firması) adına olmalı
- KVKK aydınlatma metninde "kart bilgileri Iyzico'da tutulur, biz görmeyiz" geçer
- Cayma hakkı: kullanılmamış raporlar için 14 gün içinde iade
- Yüksel'in firma kaşesi/imza ile sözleşme template'i hazırlanmalı (sonraki sprint)

---

## 5️⃣ Mevcut durum özeti (Umut için)

✅ **Yapıldı:**
- Pricing page V3 Notion/Stripe tasarım + tek paket "3 Rapor / ₺499"
- TokenMeter "X / 3 rapor" gösterimi (token sayısı yerine)
- Iyzico SDK + 3 skeleton dosya (client / action / webhook)
- Migration 015 yazıldı
- Navbar'a "Fiyatlandırma" link eklendi
- WhatsApp fallback aktif (Iyzico hazır olana kadar manuel sipariş)

⏳ **Bekleniyor (Yüksel'den):**
- 4 ana kalem yukarıda (A/B/C/D)

🔜 **Yüksel'den geldiğinde Umut'un yapacakları:**
1. `.env.local` ve Vercel env vars'a 3 değişken ekle
2. Migration 015'i Supabase Dashboard'tan çalıştır
3. pricing/page.tsx'te WhatsApp butonu → Iyzico checkout button swap
4. Sandbox test (₺1 ile)
5. Production switch + duyuru

---

## 6️⃣ Yüksel Hanım'a iletilecek özet mesaj (WhatsApp şablonu)

> Yüksel Hanım merhaba,
>
> Netport'a kart ödemesi entegrasyonu için Iyzico hesabınızın bilgilerine ihtiyacımız var. Kod tarafı hazır, sadece sizden 4 şey gerekiyor:
>
> 1. **Iyzico Sandbox API anahtarı + Secret anahtarı** (panelde Ayarlar > API anahtarları > Test ortamı)
> 2. **Iyzico panelinde callback URL whitelist** — şu adres eklensin: `https://netport-ihracat-asistani.vercel.app/api/webhooks/iyzico`
> 3. **Hesap onay durumu** — merchant hesap onaylı mı? Şirket olarak mı kayıtlı?
> 4. **IBAN tanımlı mı** (ödemeler için)
>
> Sandbox ile test ettikten sonra (~1 hafta) production'a geçeriz. Bu süreç için aynı bilgilerin "Gerçek ortam" versiyonu da gerekecek.
>
> Detay: [bu döküman]
