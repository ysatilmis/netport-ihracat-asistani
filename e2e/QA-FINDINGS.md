# Netport İhracat Asistanı — QA Bulgu Raporu

**Tarih:** 2026-06-02  
**Test Kullanıcısı:** umutsahinkaya1@gmail.com  
**Ortam:** Yerel dev — http://localhost:3000  
**Playwright:** v1.60.0 / Chromium  
**Test Raporu:** Ürün: organik zeytinyağı → Hedef pazar: Almanya

---

## Özet

| Kategori | Sonuç |
|----------|-------|
| Toplam test | 21 |
| Passed | 20 ✅ |
| Skipped (beklenen) | 1 (lead zaten üretilmiş) |
| Failed | 0 |

---

## Test Kapsamı & Sonuçlar

### 1. Auth Akışları (`auth.spec.ts`) — 5 test, 5 ✅
- Login sayfası render (form alanları, başlık, kayıt linki)
- Geçersiz şifre → hata kutusu (server-action error)
- Geçerli kimlik → `/dashboard`'a yönlendirme
- Oturumsuz kullanıcı → `/login`'e redirect (middleware çalışıyor)
- Logout → `/login`'e dönüş (Supabase signOut çalışıyor)

### 2. Navigasyon (`navigation.spec.ts`) — 4 test, 4 ✅
- Dashboard hero render (exhausted state'de "Rapor Paketi Satın Al" CTA görünüyor)
- `/results` (Raporlarım) sayfası yükleniyor
- `/pricing` sayfası yükleniyor
- Üst nav linkleri çalışıyor (Footer strict mode sorunu çözüldü)

### 3. Admin Panel (`admin.spec.ts`) — 4 test, 4 ✅
- `/admin` Genel Bakış sayfası
- `/admin/reports` Tüm Raporlar
- `/admin/users` Kullanıcılar
- `/admin/payments` Ödemeler

### 4. Sağlık Kontrolü (`smoke-health.spec.ts`) — 3 test, 3 ✅
- `/dashboard`, `/results`, `/pricing` — sıfır uncaught JS hatası

### 5. Tam AI Rapor Üretimi (`dashboard-report.spec.ts`) — 1 test, 1 ✅ (2.1 dakika)
- Ürün girişi → ülke önerisi (Almanya/ABD/Japonya)
- Almanya seçimi → SSE deep-dive stream → 11 bölüm tamamlandı
- Rapor otomatik kaydedildi → `/results/[id]`'de görünüyor
- **İster 4 doğrulandı:** Kota dolunca form yerine "Rapor Paketi Satın Al" CTA ✅

### 6. Sonuçlar & Rapor Detay (`results.spec.ts`) — 2 test, 2 ✅ / 1 ⏭️ SKIP
- Raporlar listesi mevcut (10 rapor var)
- Rapor detay sayfası: başlık, TOC (4 kategori, 11 anchor link), leads paneli
- Lead üretimi: skip (zaten üretilmiş — "Yeniden çalıştır" butonu, "Alıcı listesi üret" yok)

---

## Manuel İnceleme Bulguları

### ✅ Çalışan Akışlar
- **AI rapor üretimi:** organik zeytinyağı → Almanya → 11 bölüm, her biri kaynaklı ve detaylı
- **Lead üretimi:** 20 Alman B2B alıcı firması bulundu (Bio Company, Alnatura, Rapunzel, Dennree, vb.) — gerçek URL'lerle
- **TokenMeter:** "3 / 5 rapor (60%) · 2 hakkın kaldı" doğru hesaplandı
- **LinkedIn linki:** footer'da `netport-digital-agency` düzeltildi ✅
- **Free tier 1 rapor:** register sayfasında "1 rapor / ay" metni ✅
- **WhatsApp numarası:** +90 555 989 12 45 hem URL hem görünen metinde ✅
- **"Netport" yerine "Yüksel Hanım":** tüm örnekler temizlendi ✅
- **Admin limit güncelleme:** upsert düzeltmesiyle çalışıyor ✅

### ⚠️ Bulgular (Düzeltme Önerilisi)

#### BUG-1: PDF sayfasında `<div class="page-break"></div>` raw HTML olarak görünüyor
- **Konum:** `/results/[id]/pdf` — Müzakere Hazırlığı bölümü arasında ve 2 yerde daha
- **Etki:** PDF çıktısında görsel gürültü oluyor
- **Kök neden:** `pdf/page.tsx:109` — page-break div'i Markdown içine string olarak ekleniyor ama `<ReactMarkdown>` bunu HTML render etmiyor, düz metin olarak gösteriyor
- **Çözüm önerisi:** `dangerouslySetInnerHTML` yerine `rehype-raw` plugin veya page-break'i React component olarak sections aralarına ekle

#### BUG-2: PDF'te kesik markdown — `**Zaman algıs`
- **Konum:** `/results/[id]/pdf` — Müzakere Hazırlığı → Müzakere Tarzı listesi
- **Etki:** Liste maddesinin başı `**Zaman algıs` olarak görünüyor (kapanmamış bold)
- **Kök neden:** AI stream'den gelen markdown metni çift `**` kapanmadan kesiliyor
- **Çözüm önerisi:** Stream tamamlandıktan sonra markdown'daki çift `**` sayısını kontrol eden bir sanitizer

#### BUG-3: Yönetim Özeti aksiyon planı tablosunda `---` satırları görünüyor
- **Konum:** `/results/[id]` — Yönetim Özeti → 8 Haftalık Aksiyon Planı
- **Etki:** Tablo bölümleyici olarak kullanılan `---` satırları HTML tablosuna dönüşünce görsel gürültü yaratıyor
- **Kök neden:** AI markdown tablosunda ayırıcı `---` satırı, HTML `<tr>` olarak render ediliyor

#### BUG-4: PDF sayfasında 5 console error
- **Konum:** `/results/[id]/pdf` — sayfa yüklenirken
- **Not:** Görsel etki yok, ancak prodüksiyonda hata loglarını kirleteceği için incelenmeli

#### BUG-5: Admin "Limit Güncelle" form submit — `monthly_limit_tokens=80000` (legacy) olan kullanıcı
- **Durum:** Upsert fix çalışıyor, ancak legacy 80000 değeri olan kullanıcıda form submit DB'ye yazılıyordu ama sayfada hemen yansımıyordu (revalidatePath gecikmesi). Node.js script ile manuel 5 yazıldı.
- **Not:** Yeni kullanıcılarda sorun yok (subscription satırı yokken insert çalışıyor).

---

## Düzeltilmiş İsterler (Bu Oturumda Yapıldı)

| İster | Dosya | Durum |
|-------|-------|-------|
| Free tier 1 rapor | `src/lib/stripe.ts`, `pricing/page.tsx`, `register/page.tsx` | ✅ |
| WhatsApp numarası `905559891245` | `pricing/page.tsx` | ✅ |
| "Yüksel Hanım" → "Netport" | `pricing/page.tsx` | ✅ |
| LinkedIn linki düzeltmesi | `layout.tsx` | ✅ |
| Dashboard exhausted CTA | `dashboard/page.tsx`, `dashboard-client.tsx` | ✅ |
| Admin upsert fix | `actions/admin.ts` | ✅ |

---

## 🚨 KRİTİK BULGU — 50 Kişilik Kayıt Senaryosu

**Test:** `load-register.spec.ts` — 50 eş zamanlı `signUp` isteği  
**Sonuç:** **2/50 başarılı (%4) — 48/50 `email rate limit exceeded` (429)**

### Kök Neden
Supabase free tier email gönderme limiti: **saatte 4 email**.  
50 kayıt = 50 confirm email talebi = anında rate limit aşımı.

### Risk
50 kişiyi aynı gün kayıt ettirmeye çalışırsan, **kayıt işlemi başarısız** görünür —  
kullanıcılar "hata" alır, kayıt olamaz, platforma giremiyor olur.

### Çözüm: Resend SMTP (1-2 saat iş)
Resend ücretsiz planda **100 email/gün**, yüksek planlarda 100K+/gün.  
**50 kişilik tanıtımdan ÖNCE bu kurulumu tamamla.**

Adımlar (aşağıda detaylı):

---

## İster 1: Supabase SMTP / Confirm Mail (KOD DEĞİŞİKLİĞİ YOK) — ⚠️ 50 kişi sunumu öncesi zorunlu

Umut'un yapacakları:
1. [Resend.com](https://resend.com) — kayıt ol (ücretsiz 3K/ay)
2. `netportai.com` domain'ini doğrula (SPF/DKIM DNS)
3. Supabase Dashboard → Project Settings → Auth → SMTP Settings:
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: `re_xxxx`
   - From: `noreply@netportai.com`, Sender: `Netport İhracat`
4. Auth → Email Templates → "Confirm signup" → HTML özelleştir
5. Test email gönder

---

## Load Test Sonuçları

| Test | Sonuç | Açıklama |
|------|-------|---------|
| 50 eş zamanlı signup (Supabase anon) | ❌ 2/50 başarılı | Email rate limit (429) |
| 50 eş zamanlı signup (Resend SMTP ile) | Henüz test edilmedi | Resend kurulduktan sonra çalıştır |
| 50 eş zamanlı GET /register | ✅ 50/50 | Next.js server yük kaldırıyor |

**Aksiyon:** Resend SMTP kurulduktan sonra `npx playwright test --project=load` ile tekrar çalıştır.  
Başarı kriteri: ≥45/50 (%90+) kayıt başarılı.

---

## Tekrar Çalıştırma

```bash
# Tüm testler (tam suite — ~3 dakika, AI token harcar)
npm run test:e2e

# Sadece ucuz testler (~40 saniye)
npm run test:e2e -- --grep-invert "@expensive"

# Sadece AI akış testleri (token harcar)
npm run test:e2e -- --grep "@expensive"

# Load test — 50 eş zamanlı kayıt (Resend kurulduktan sonra)
npx playwright test --project=load

# HTML rapor aç (trace, screenshot, video)
npm run test:e2e:report
```

---

## PDF Çıktısı
- **Dosya:** `e2e/QA-report-organik-zeytinyagi-almanya.pdf` (144 KB)
- **İçerik:** 11 bölüm, tablolar, listeler tam render
- **Bulgular:** BUG-1 (page-break raw HTML), BUG-2 (kesik markdown) — yukarıda detaylı
