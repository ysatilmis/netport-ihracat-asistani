# Yüksel Hanım — DNS Kayıt Ekleme Talimatı
## (netportai.com için Resend SMTP — 50 kişilik kayıt için zorunlu)

**Bu işlem yapılmadan 50 kişi aynı anda kayıt olamaz.**  
Süre: ~10 dakika.

---

## Adım 1 — cPanel'e Giriş

1. Hosting firmanızın cPanel linkine gidin (genellikle: `https://cpanel.hostingfirmaniz.com` veya `https://netportai.com:2083`)
2. Kullanıcı adı ve şifrenizle giriş yapın

---

## Adım 2 — Zone Editor'ı Açın

1. cPanel ana sayfasında **"Zone Editor"** veya **"DNS Zone Editor"** seçeneğini bulun  
   (Arama kutusuna "zone" yazabilirsiniz)
2. `netportai.com` domaininin yanındaki **"Manage"** butonuna tıklayın

---

## Adım 3 — 3 DNS Kaydı Ekleyin

Aşağıdaki 3 kaydı tek tek ekleyeceksiniz.  
Her kayıt için **"Add Record"** butonuna tıklayın.

---

### Kayıt 1 — DKIM (TXT)

| Alan | Değer |
|------|-------|
| **Type** | TXT |
| **Name** | `resend._domainkey.netportai.com` |
| **TTL** | 3600 (veya "Auto") |
| **Value / Content** | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbLovHs9jC9KMccvPXivSu7BYJmM4McCCb+qhL7l9XAQwPYJZhoAFnmcCpjFvZvmuqCi7pqkMy2qXiZDDiMZQD8Pp5rPZey0f87WxPVkQQIfC1U0TqzJOI9TlI7rHL8wQxqmwSghiumheUsyl9H+r+yyOuesfoGJaebOvGugRB/wIDAQAB` |

> **Not:** Value alanına tırnaksız, olduğu gibi yapıştırın.

---

### Kayıt 2 — SPF MX Kaydı (MX)

| Alan | Değer |
|------|-------|
| **Type** | MX |
| **Name** | `send.netportai.com` |
| **TTL** | 60 |
| **Priority** | 10 |
| **Value / Destination** | `feedback-smtp.eu-west-1.amazonses.com` |

---

### Kayıt 3 — SPF (TXT)

| Alan | Değer |
|------|-------|
| **Type** | TXT |
| **Name** | `send.netportai.com` |
| **TTL** | 60 |
| **Value / Content** | `v=spf1 include:amazonses.com ~all` |

---

## Adım 4 — Kayıtları Kaydedin

Her kaydı ekledikten sonra **"Save"** veya **"Add Record"** butonuna tıklayın.  
3 kaydın hepsini ekledikten sonra Umut'a haber verin.

---

## Adım 5 — Umut'a Bildirin

"DNS kayıtlarını ekledim" deyin. Umut kalan her şeyi otomatik yapacak  
(Supabase SMTP ayarı, test emaili, sistem aktivasyonu).

---

## Önemli Notlar

- DNS değişiklikleri **1-30 dakika** içinde yayılır (bazen 24 saat sürebilir ama genelde hızlı)
- Mevcut DNS kayıtlarına dokunmayın, sadece bu 3 yeni kaydı ekleyin
- Bir şey yanlış giderse Umut'a ekran görüntüsü atın

---

*Bu belge: Netport İhracat AI — 2026-06-02 tarihinde hazırlandı*
