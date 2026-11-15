# Google Analytics ve Arama Takip Rehberi

Bu rehber, site trafiğini hızlıca kontrol etmek içindir. Analytics yalnızca ziyaretçi analitiğe izin verdiyse ölçüm yapar; bu nedenle reddeden veya henüz seçim yapmayan ziyaretçiler rapora girmez.

## Hızlı bağlantılar

- [Analytics raporları](https://analytics.google.com/analytics/web/#/p561793762/reports/intelligenthome)
- [Gerçek zamanlı ziyaretçiler](https://analytics.google.com/analytics/web/#/p561793762/reports/realtime)
- [Search Console performans raporu](https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fkolayivar.github.io%2F)
- [Search Console site haritaları](https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fkolayivar.github.io%2F)

## Günlük 2 dakikalık kontrol

1. **Şu an sitede kim var?** Gerçek zamanlı rapora bak. Son 30 dakikadaki aktif kullanıcıları ve hangi sayfaları açtıklarını gösterir. Buradaki sayı anlık nabızdır; günlük kullanıcı sayısı değildir.
2. **Son 7 veya 28 günde kaç kişi geldi?** Analytics > Raporlar anlık görüntüsü içindeki Aktif kullanıcılar ve Görüntülemeler kartlarına bak. Tarih aralığını sağ üstten seç.
3. **Bizi nereden buldular?** Raporlar > Edinme > Trafik edinme bölümünde “Oturumun varsayılan kanal grubu” tablosuna bak. `Organic Search` Google/Bing gibi ücretsiz arama sonuçlarını; `Direct` ise doğrudan yazılan, yer imine alınan ya da kaynağı belirlenemeyen ziyaretleri kapsar. Google aramasını görmek için tabloda `google / organic` ara.
4. **Google’da görünürlük artıyor mu?** Search Console > Performans > Arama sonuçları bölümünde tıklamalar, gösterimler, ortalama konum ve sorgulara bak. Gösterim aramada çıktığımızı, tıklama ise ziyaret geldiğini anlatır.
5. **Hangi sayfa işe yarıyor?** Search Console Performans raporunda Sayfalar sekmesini; Analytics’te Etkileşim > Açılış sayfası raporunu incele. İyi gösterim ama az tıklama alan sayfanın başlık/açıklaması iyileştirilebilir.

## Raporları doğru yorumla

- Analytics ve Search Console aynı sayıyı vermez: ölçüm yöntemleri ve raporlama gecikmeleri farklıdır.
- Kullanıcı, oturum ve görüntüleme farklı ölçülerdir. “Etkinlik sayısı” ziyaretçi sayısı değildir.
- Direct oranı yüksekse bu tek başına SEO başarısızlığı demek değildir; paylaşım bağlantıları, yer imleri, test ziyaretleri ve izni reddedenler etkileyebilir.
- Siteyi kendin test ederken sonuçları not et; mümkünse testleri Analytics iznini vermeden yap. Raporlar kısa süreli gecikmeli olabilir.
- Başarıyı tek güne göre değil, haftalık/aylık eğilim ve organik tıklama üzerinden değerlendir.

## Bugünkü başlangıç notu

16 Kasım 2026'da görünen son 28 günlük GA4 anlık görüntüsünde 27 aktif kullanıcı, 139 etkinlik ve 14 saniye ortalama etkileşim vardı; oturum edinmede 1 `google / organic` oturumu görünüyordu. Örneklem çok küçük ve test/önizleme trafiği içerebilir; karar almadan önce tarih aralığını yenileyip Search Console tıklamalarıyla karşılaştır.

## Search Console site haritası

Gönderilen `/sitemap.xml` kaydı şu an “Getirilemedi” ve 0 keşfedilen sayfa gösteriyor. Dosya tarayıcıda XML olarak açılıyor; bu, Googlebot'un başarıyla okuduğu anlamına gelmiyor. Yeni yayımlanan dosya/önbellek için zaman tanı, sonra Search Console > Site Haritaları'ndaki hata ayrıntısını aç. Canlı dosya `/sitemap.xml` adresinde 200 durum kodu ve XML içerik döndürmeli. Sitede `robots.txt` sitemap adresini bildiriyor.
