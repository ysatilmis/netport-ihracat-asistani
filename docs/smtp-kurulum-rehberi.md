# Custom SMTP Kurulumu — info@netportai.com

> Amaç: Supabase'in varsayılan mail adresi yerine `info@netportai.com` adresinden confirm maili göndermek.

## Mevcut Durum

- Supabase varsayılan mail servisini kullanıyor (noreply@mail.app.supabase.io gibi)
- Mail güven vermiyor, kullanıcı "bu ne?" deyip tıklamıyor
- Hedef: `info@netportai.com` adresinden profesyonel görünümlü onay maili

## Adım 1 — Domain Email Kurulumu

1. `netportai.com` domain'inin DNS yönetimine gir
2. Email hosting kararı ver:
   - **Seçenek A:** Google Workspace (aylık ~$6/user) — en profesyonel
   - **Seçenek B:** Zoho Mail (ücretsiz 5 user'a kadar) — bütçe dostu
   - **Seçenek C:** Namecheap/GoDaddy email (domain kayıt yeri sağlıyorsa)
   - **Seçenek D:** Supabase'in kendi SMTP'si yerine Resend.com (aylık 100 email ücretsiz)

3. `info@netportai.com` adresini oluştur
4. MX/TXT/SPF/DKIM kayıtlarını DNS'e ekle

### Öneri: Resend.com

- Aylık 100 email ücretsiz, sonrası $20/ay (50K email)
- Supabase ile native entegrasyon
- Dashboard'dan email template düzenleme

## Adım 2 — Supabase SMTP Ayarları

1. [Supabase Dashboard](https://supabase.com/dashboard/project/uvhtsnwwaouzqbqndjbl) → Authentication → Email
2. "Enable Custom SMTP" seçeneğini aktif et
3. SMTP bilgilerini gir:

**Resend kullanılıyorsa:**
```
SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Pass: [Resend API Key]
Sender Name: Netport İhracat AI
Sender Email: info@netportai.com
```

**Google Workspace kullanılıyorsa:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: info@netportai.com
SMTP Pass: [App Password]
Sender Name: Netport İhracat AI
Sender Email: info@netportai.com
```

## Adım 3 — Email Template Düzenleme

Supabase Dashboard → Authentication → Email Templates → Confirm Signup:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #EA580C, #DC2626); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; font-size: 24px; margin: 0;">Netport İhracat AI</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">Hesabını onayla ve ihracata başla</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px; line-height: 1.6;">
                Merhaba,
              </p>
              <p style="font-size: 16px; color: #334155; margin: 0 0 24px; line-height: 1.6;">
                Netport İhracat AI'a hoş geldin! Hesabını aktifleştirmek ve AI destekli ihracat raporlarını kullanmaya başlamak için aşağıdaki butona tıkla.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="display: inline-block; padding: 14px 40px; background: #EA580C; color: white; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Email Adresini Onayla →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0; line-height: 1.5;">
                Bu maili sen talep etmediysen görmezden gelebilirsin. Link 24 saat geçerli.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #f1f5f9; padding: 16px 24px; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                Netport Global A.Ş. · İYTE Teknopark, Urla/İzmir
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Adım 4 — Test

1. Yeni bir kullanıcı kaydı oluştur
2. Onay mailinin `info@netportai.com` adresinden geldiğini kontrol et
3. Mailin spam'e düşmediğini kontrol et
4. Onay linkine tıkla ve giriş yap

## Adım 5 — TXT/SPF/DKIM Kayıtları (Resend)

Resend kullanılıyorsa DNS'e şunları ekle:

```
TXT  @                        v=spf1 include:spf.resend.com ~all
TXT  resend._domainkey         [Resend'ten alınan DKIM değeri]
MX   feedback-smtp.resend.com  10
```

Bu kayıtlar olmadan mailler spam'e düşebilir.
