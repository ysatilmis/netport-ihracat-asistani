insert into public.prompt_templates (phase, key, title, template_text, model, display_order) values
(1, 'market_selection', 'Hedef Pazar Seçimi',
'[ürün] için en uygun 3 ihracat pazarını belirle. Her pazar için şunları ver: yıllık ithalat hacmi (USD), büyüme trendi (2022-2024), Türkiye''nin mevcut pazar payı, gümrük avantajı (AB Gümrük Birliği veya STA durumu), lojistik mesafe değerlendirmesi. Her ülke için 1-10 puan ver ve tabloyla sun. En uygun 3 pazarı öner ve gerekçeli açıkla. Hedef ülke: [ülke] (yoksa en uygun ülkeleri kendin seç).',
'perplexity', 1),

(1, 'competitor_analysis', 'Rakip Analizi',
'[ülke] pazarında [ürün] kategorisinde en güçlü 5-10 rakibi listele. Her rakip için: marka adı, web sitesi, fiyat aralığı (EUR/USD), hedef segment (premium/orta/ekonomik), en güçlü 3 özelliği, müşteri yorumlarındaki en sık şikayet. Tablo halinde sun. Sonunda Türkiye''den ihraç eden bir KOBİ için bu pazardaki en büyük rekabet boşluğunu 3 maddede özetle.',
'perplexity', 2),

(1, 'customer_profile', 'Müşteri Profili',
'[ülke]''de [ürün] satın alan ideal B2B alıcı profilini ve son kullanıcı profilini ayrı ayrı tanımla. B2B alıcı için: şirket tipi (distribütör/perakende/e-ticaret), karar verici pozisyonu, minimum sipariş miktarı beklentisi, iletişim kanalı tercihi. Son kullanıcı için: yaş aralığı, gelir düzeyi, satın alma motivasyonları (ilk 5), en sık kullandıkları kanal. Ardından bu müşterilere nasıl ulaşılabileceğini (dijital + offline) öncelik sırasıyla listele.',
'perplexity', 3),

(1, 'customs_compliance', 'Gümrük & Uyum',
'Türkiye''den [ülke]''ye [ürün] ihraç etmek için gerekli bilgileri ver: (1) GTİP kodu önerisi ve açıklaması, (2) AB Gümrük Birliği veya STA kapsamında gümrük tarifesi (ATR.1 belgesiyle), (3) zorunlu sertifikalar (CE, organik, gıda güvenlik vb.) ve tahmini maliyetleri EUR, (4) etiketleme gereksinimleri, (5) yaygın gümrük hataları ve nasıl önlenir. Kaynak: TARIC veya USITC verilerine dayan.',
'perplexity', 4);
