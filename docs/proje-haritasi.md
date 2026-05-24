# Netport İhracat AI — Proje Haritası

> Son güncelleme: 2026-05-24

## Mimari Özet

```
netport-ihracat-asistani/
├── Next.js 16.2.6 (App Router + Turbopack)
├── Supabase (auth + DB + storage)
├── OpenRouter (Perplexity/OpenAI/Claude)
├── Iyzico (ödeme — kısmi entegrasyon)
├── Vercel (deploy + cron)
└── shadcn/ui + Tailwind CSS 4
```

## Sayfa Haritası

| Route | Tip | Açıklama | Durum |
|-------|-----|----------|-------|
| `/` | — | Root → `/login` redirect | OK |
| `/login` | Static | Kullanıcı girişi | OK |
| `/register` | Static | Kullanıcı kaydı → confirm mail | ✅ Yeni |
| `/dashboard` | Dynamic | Ana sayfa — rapor oluşturma akışı | OK |
| `/results` | Dynamic | Kullanıcının tüm raporları | OK |
| `/results/[id]` | Dynamic | Tek rapor görüntüleme | OK |
| `/results/[id]/pdf` | Dynamic | PDF çıktısı | OK |
| `/pricing` | Dynamic | Fiyatlandırma (2 paket) | ✅ Yeni |
| `/positioning/[reportId]` | Dynamic | Faz B — konumlandırma paketi | OK |
| `/leads/[reportId]` | Dynamic | Lead bulucu | OK |
| `/pdf/[id]` | Dynamic | PDF render | OK |
| `/admin/login` | Static | Admin giriş sayfası | ✅ Yeni |
| `/admin` | Dynamic | Admin dashboard (KPI'lar) | OK |
| `/admin/users` | Dynamic | Kullanıcı yönetimi | OK |
| `/admin/reports` | Dynamic | Rapor yönetimi | OK |
| `/admin/payments` | Dynamic | Ödeme takibi | OK |
| `/auth/callback` | Dynamic | Supabase auth callback | OK |

## Veritabanı Şeması (Supabase)

| Tablo | Amaç | Kritik Kolonlar |
|-------|------|----------------|
| `users` | Kullanıcı hesapları | id, email, full_name, role ('user'\|'admin') |
| `subscriptions` | Plan + kontenjan | user_id, plan, monthly_limit_tokens, extra_tokens, period dates |
| `reports` | Üretilen raporlar | user_id, phase, input_json, output_text, is_full_report |
| `token_usage` | Kullanım log'u | user_id, phase, tokens_used, model |
| `prompt_templates` | Prompt şablonları | phase, key, title, template_text |
| `report_signals` | Pazar sinyalleri | (cron job çıktısı) |
| `quality_checks` | Rapor kalite kontrol | (Claude Haiku analizi) |
| `report_leads` | Lead bulguları | (Perplexity lead finder) |
| `positioning_packages` | Faz B çıktıları | USP, persona, ürün açıklaması |
| `iyzico_pending_payments` | Ödeme kayıtları | conversation_id, status, price_try, report_count |

## Rapor Akışı (4 Faz, 10 Bölüm)

```
Kullanıcı → Ürün adı gir
  → Faz 1: Perplexity → 3 hedef ülke (SSE stream)
  → Kullanıcı ülke seçer
  → Faz 1 devam: Pazar büyüklüğü (Perplexity) + Tüketici profili (OpenAI) + Yasal/gümrük (OpenAI)
  → Faz 2: USP/konumlandırma (OpenAI) + Fiyat stratejisi (OpenAI) + Çok dilli içerik (OpenAI)
  → Faz 3: Alıcı listesi (Claude) + Outreach email (Claude) + Müzakere hazırlığı (Claude)
  → Faz 4: Yönetici özeti (OpenAI)
  → Kaydet + PDF + Faz B'ye geçiş
```

## API Rotaları

| Route | Method | Amaç |
|-------|--------|------|
| `/api/report/countries` | POST | SSE — 3 hedef ülke önerisi |
| `/api/report` | POST | SSE — 10 bölüm deep dive rapor |
| `/api/positioning` | POST | SSE — Faz B konumlandırma |
| `/api/leads/[reportId]` | GET/POST | Lead bulma ve listeleme |
| `/api/quality-check/[reportId]` | POST | Rapor kalite kontrolü |
| `/api/cron/market-signals` | GET/POST | Haftalık pazar sinyali (Pzt 09:00) |
| `/api/webhooks/iyzico` | POST | Iyzico ödeme callback |
| `/api/webhooks/stripe` | POST | Stripe webhook (donduruldu) |
| `/api/debug` | GET | Sistem durum kontrolü |

## Ödeme Akışı (Manuel — WhatsApp + Iyzico)

```
Kullanıcı → Pricing sayfası → WhatsApp ile Yüksel Hanım'a mesaj
  → Yüksel Hanım email'e Iyzico ödeme linki gönderir
  → Kullanıcı kredi kartıyla öder
  → Iyzico callback → Webhook → extra_tokens += report_count
  → Admin panelinden manuel rapor hakkı eklenebilir
```

## Rapor Hakkı Sistemi

- **Free plan:** 2 rapor/ay
- **Ek paket 3'lü:** ₺499 (normalde ₺999) — 3 ek rapor
- **Ek paket 10'lu:** ₺1.299 (normalde ₺2.499) — 10 ek rapor
- **Starter plan:** 10 rapor/ay (henüz aktif değil)
- **Pro plan:** Sınırsız (iptal edildi — sürdürülemez)
- Ek paketler `subscriptions.extra_tokens` kolonunda birikir
- Kalan hak = (aylık limit + extra_tokens) - kullanılan
- Limit aşımı → `/pricing` sayfasına yönlendirme

## Admin Paneli

- **Giriş:** `/admin/login` — sadece ADMIN_EMAIL'deki hesaplar girebilir
- **Dashboard:** KPI kartları (kullanıcı, rapor, ödeme sayıları)
- **Kullanıcılar:** Liste, plan, ek paket, rapor sayısı, limit güncelleme
- **Raporlar:** Tüm raporlar, PDF link, silme
- **Ödemeler:** Iyzico işlem geçmişi, durum takibi

## Ortam Değişkenleri (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://uvhtsnwwaouzqbqndjbl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=umutsahinkaya1@gmail.com,ysatilmis321@gmail.com
NEXT_PUBLIC_SITE_URL=https://netportai.com
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS=true
# Iyzico (canlıya geçince doldurulacak)
# IYZICO_API_KEY=
# IYZICO_SECRET_KEY=
# IYZICO_BASE_URL=https://api.iyzico.com
```

## Bilinen Sorunlar / Yapılacaklar

| # | Konu | Öncelik | Durum |
|---|------|---------|-------|
| 1 | Custom SMTP (info@netportai.com) — confirm mailleri | P0 | 📋 Planlandı |
| 2 | Iyzico canlıya alma (env var'ları doldur) | P1 | 📋 Bekliyor |
| 3 | Starter plan aktif etme | P2 | 📋 Bekliyor |
| 4 | Admin panel — rapor detay sayfası | P2 | 📋 Öneri |
| 5 | Admin panel — toplu email gönderimi | P3 | 📋 Öneri |
| 6 | Kullanıcı dashboard — kalan gün sayacı | P3 | 📋 Öneri |
| 7 | Rate limiting (API route'lar) | P2 | 📋 Öneri |
| 8 | Test coverage artırma | P3 | 📋 Öneri |

## Deploy Bilgisi

- **Platform:** Vercel
- **Proje:** `netport-ihracat-asistani` (Yüksel Hanım'ın hesabı)
- **Domain:** netportai.com
- **GitHub:** `https://github.com/ysatilmis/netport-ihracat-asistani.git`
- **Cron:** Pazartesi 09:00 UTC — market signals

## 2026-05-24 Değişiklikleri

1. **Pricing sayfası:** Strikethrough fiyat (999→499, 2499→1299), "kısa süreliğine" indirim, 2 paket
2. **WhatsApp:** Numara Yüksel Hanım'a güncellendi (+90 532 137 71 58), dinamik mesaj (email'li)
3. **10 raporluk paket:** ₺1.299 — eklendi
4. **Sınırsız Pro:** Kaldırıldı (placeholder silindi)
5. **Register:** Confirm mail bilgilendirme sayfası eklendi
6. **Duplicate email:** Kayıtlı email ile tekrar kayıt engellendi, "giriş yap" linki
7. **Admin login:** `/admin/login` sayfası — ayrı giriş ekranı
8. **Dashboard font:** Küçük punto yazılar büyütüldü (xs→sm, 10px→11px)
9. **Middleware:** Admin login route'u serbest bırakıldı
