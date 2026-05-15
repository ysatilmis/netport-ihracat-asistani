insert into public.prompt_templates (phase, key, title, template_text, model, display_order) values

-- Phase 2: Konumlandırma & İletişim
(2, 'usp_positioning', 'USP & Konumlandırma',
'[ürün] ürünüm için [ülke] pazarına özgü bir USP (Unique Selling Proposition) oluştur. Önce pazardaki rakiplerin ortak zayıf noktalarını (en az 3) listele, sonra Türkiye üretiminin güçlü yönlerini (el işçiliği, maliyet, hammadde kalitesi vb.) bu zayıf noktalara karşı konumlandır. Çıktı olarak: (1) tek cümlelik USP, (2) 3 farklı mesaj varyantı (premium, değer odaklı, hikaye odaklı), (3) USP''yi destekleyen 5 kanıt noktası (sertifika, kapasite, referans tipi vb.). Türkçe ve İngilizce ver.',
'openai', 5),

(2, 'multilingual_content', 'Çok Dilli İçerik',
'[ürün] için [ülke] pazarına yönelik ürün tanıtım içeriği oluştur. Şunları ver: (1) 150 kelimelik ürün açıklaması, (2) 5 maddelik ürün özellikleri listesi, (3) 3 farklı başlık seçeneği (e-ticaret/katalog/fuar için). Dil: hedef ülkenin ana dili ([ülke] için uygun dil seç). Ayrıca İngilizce versiyonunu da ekle. Ton: profesyonel B2B, teknik terimlerden kaçın, fayda odaklı yaz.',
'openai', 6),

(2, 'price_positioning', 'Fiyat Stratejisi',
'[ülke] pazarında [ürün] için fiyat konumlandırma stratejisi oluştur. (1) Mevcut pazar fiyat bantlarını (ekonomik/orta/premium) ve bu banttaki rakip markaları listele, (2) Türkiye çıkışlı ürün için FOB, CIF ve son tüketici fiyatı hesaplama mantığını göster (örnek rakamlarla), (3) hangi fiyat bandına girmek mantıklı ve neden, (4) fiyat avantajını korurken marj artırma için 3 öneri. Gümrük vergileri ve lojistik maliyetleri dahil et.',
'openai', 7),

-- Phase 3: İlk Temas & Satış
(3, 'buyer_list', 'Alıcı Listesi',
'[ülke]''de [ürün] ithal eden veya satabilecek potansiyel alıcıları bul. Şu kategorilerde liste oluştur: (1) büyük distribütörler (3-5 firma, web sitesi ile), (2) e-ticaret satıcıları (3-5 platform/satıcı), (3) perakende zincirleri (ilgili kategori bölümü olan 3-5 zincir), (4) fuar ve ticaret platformları ([ülke] için en önemli 2-3 fuar). Her liste için LinkedIn veya web üzerinden nasıl ulaşılacağını belirt. Hangi alıcı tipiyle başlamak en kolay ve neden?',
'perplexity', 8),

(3, 'outreach_email', 'İlk Temas E-postası',
'[ülke]''deki potansiyel bir distribütör veya alıcıya [ürün] için ilk temas e-postası yaz. E-posta: (1) konuya özgü dikkat çekici konu satırı, (2) 3-4 cümlelik giriş (alıcının pazarına özel bir gözlem ile), (3) ürün ve firmayı 3 maddede tanıt (USP öne çıkar), (4) somut eylem çağrısı (zoom görüşme / numune talebi), (5) kapanış. Maksimum 200 kelime. İngilizce yaz, resmi ama samimi ton. Alternatif olarak [ülke] dilinde kısa bir versiyon da ekle.',
'openai', 9),

(3, 'negotiation_prep', 'Müzakere Hazırlığı',
'[ülke]''li bir alıcıyla [ürün] satışı için müzakere hazırlığı yap. Şunları ver: (1) bu kültürdeki müzakere tarzı ve dikkat edilmesi gerekenler (3-5 madde), (2) en sık gelen 5 itiraz ve her birine hazır cevap, (3) müzakerede vermemem gereken 3 konsesyon ve neden, (4) anlaşmayı hızlandıracak 3 teşvik seçeneği (ödeme vadesi, numune, sertifika vb.), (5) minimum karlı fiyatı korumak için konuşma şablonu. Pratik ve sahaya dönük yaz.',
'openai', 10);
