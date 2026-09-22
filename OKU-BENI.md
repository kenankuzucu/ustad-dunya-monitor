ÜSTAD DÜNYA MONİTÖRÜ — v5.6  ★ ÜSTAD TV
======================================

ÜSTAD TV — 18 Eyl 2026 DÜZELTMESİ (v5.6)
----------------------------------------
 · GÖRÜNÜŞ GERİ ALINDI: TV kutusu yine SAYFA AKIŞINDA, harita/kürenin hemen
   solunda duran kibar kart (sabit kenar/dock kaldırıldı). Üst menüyle çakışma
   YOK; kutu harita ile AYNI hizada (ikisi de 560 px, aynı üst çizgi).
 · DÜZELTİLEN KUSUR: HARİTA'dan başka sekmeye geçip geri dönünce TV kutusu
   BOŞ geliyordu — artık sekme her açılışta yeniden kurulur, kanallar dolu gelir.
 · KANALLAR SADECE TRT (12 kanal · hepsi TRT resmî HLS yayını):
   7/24 SABİT: TRT 1 + TRT HABER (açılışta TRT 1 kendiliğinden başlar)
   DÜĞMELER: TRT 2 · TRT SPOR · TRT SPOR 2 · TRT BELGESEL · TRT ÇOCUK ·
             TRT MÜZİK · TRT TÜRK · TRT AVAZ · TRT ARABİ · TRT WORLD
   Özel kanallar (Show/Kanal D/TV8/NOW), YouTube kanalları ve dünya kanalları
   televizyondan ÇIKARILDI → DIŞARI sekmesi.
 · Rozet artık dürüst: yayın gerçekten oynarken kırmızı "CANLI · kanal adı".
 · Doğrulama (gerçek Chrome): yerleşim çakışması yok · 2 sabit kart + 10 TRT
   düğmesi · açılışta TRT 1 oynadı (2K/1080p) · sekme dönüşünde yayın geri geldi
   (CANLI · TRT 1) · 0 JavaScript hatası. Yedek: _yedek-2026-09-18\

GİRİŞ ANİMASYONU — NÖBETTEYİZ SATIRI (v5.5)
------------------------------------------
Animasyonun hemen başında (0,2 sn) en üstte ◈ ÜSTAD KENAN KUZUCU ◈ yazısı belirir.
Hemen ardından (0,55 sn) tek satır hâlinde şunlar gelir:

   [DALGALANAN TÜRK BAYRAĞI]   NÖBETTEYİZ   [DALGALANAN TÜRK BAYRAĞI]   [BEYAZ ŞAPKALI HACKER]

 · Bayraklar kod ile çizilir (hilal + beş köşeli yıldız, 30x20 resmî oran) ve
   sütun sütun dalga + ışık/gölge ile gerçekten dalgalanır (filigransız, net)
 · NÖBETTEYİZ: koyu cam kapsül içinde beyaz yazı, üstünde kırmızı-beyaz-kırmızı
   şerit, ışık süpürmesi ve nefes alan hale — okunaklı
 · Beyaz şapkalı hacker logosu HER İKİ YANDA (sağ ve sol, biri aynalı): kapüşonlu siluet, neon gözler, BEYAZ ŞAPKA
   (siperlik + kubbe + parlama), nabız atan halka (kod ile çizilir)
 · Mevcut animasyon (isim şeridi, küre, MONİTÖR DÜNYASINA, HOŞ GELDİNİZ,
   açılış kaydı) hiç bozulmadı; yeni satır en üstte, çakışma 0 piksel
 · Animasyonu tekrar görmek için: AYARLAR ▸ 🎬 AÇILIŞ ANİMASYONU ▸ ▶ ŞİMDİ OYNAT
   ya da adresin sonuna #giris ekle (index.html#giris)
 · Önizleme resimleri: onizleme\BAYRAK-ONIZLEME.png · onizleme\HACKER-LOGO-ONIZLEME.png

ÜSTAD TV (sol taraf, harita/küre yanında)
-----------------------------------------
Kibar bir televizyon kutusu: çerçeveli 16:9 ekran, üstte madalyonlu "ÜSTAD TV"
başlığı ve canlı yayın lambası, altta kumanda. Kanal kimlikleri 17 Eyl 2026'da
canlı test edildi — uydurma kanal yok.

🇹🇷 SADECE TRT KANALLARI (12 kanal · hepsi TRT resmî HLS yayını · v5.6)
  7/24 SABİT İKİ KANAL: TRT 1 + TRT HABER (açılışta TRT 1 kendiliğinden başlar)
  NOT: Dünya kanalları (DW, Al Jazeera, France 24, Sky News, Bloomberg, NASA ISS,
       AP, AFP, Euronews, Reuters, BBC radyo) televizyondan KALDIRILDI ve
       DIŞARI sekmesindeki "CANLI KAMERALAR & DÜNYA KANALLARI" bölümüne taşındı.
       Orada durur; kanal kimliği verilenler YouTube'un o anki canlısını bulur.
       Ayrıca DIŞARI'da "kendi kanalını yapıştır" alanı var: YouTube bağlantısı
       yapıştır → aynı pencerede oynar.
  Doğrulama: TRT 1 bağlandı, oynadı, kalite 1080p → 1440p (2K) yükseldi.

ESKİ NOT — 🇹🇷 TÜRKİYE KANALLARI (hepsi tek tek test edildi · 24 kanal)
  HLS ile DOĞRUDAN oynayanlar (CORS açık · normal modda da çalışır · HD/2K):
    TRT 1 · TRT 2 · TRT HABER · TRT SPOR · TRT SPOR 2 · TRT BELGESEL ·
    TRT ÇOCUK · TRT MÜZİK · TRT TÜRK · TRT AVAZ · TRT ARABİ · TRT WORLD
    → TRT 1 yayını 5 kalitede: 360p / 480p / 720p / 1080p FULL HD / 1440p (2K)
  HLS · özel mod isteyenler (daioncdn CORS kapalı): SHOW TV · KANAL D · TV8 · NOW TV
  Resmî YouTube canlısı (her modda): CNN TÜRK · 24 TV · TV100 · SÖZCÜ TV ·
    ÜLKE TV · A HABER · BLOOMBERG HT · TVNET · NTV · TRT WORLD

AÇILIŞTA OTOMATİK: Panel açılırken televizyon kendiliğinden TRT 1 ile başlar
(ses dahil). Ses/tam ekran/kalite düğmeleri TRT kanallarında da çalışır;
TAM EKRANA geçince yayının EN YÜKSEK kalitesi istenir (TRT 1'de 1440p).
Not: yayınlarda 4K yok — yayıncılar en fazla 1440p (2K) veriyor; 4K düğmesi
yayın 4K verirse onu seçer.

7/24 SABİT İKİ KANAL (istediğin gibi hep dolu):
  · DW NEWS (Almanya)          · AL JAZEERA ENGLISH (Katar)

DİĞER KANALLAR (tek tık düğme, hepsi 24/7 ve gömülü oynatılıyor):
  · FRANCE 24 EN · SKY NEWS · TRT WORLD · NTV (Türkçe) · BLOOMBERG TV · NASA ISS

OLAY YAYINLARI + RADYO:
  · AP · AFP · EURONEWS → kanal kimliğinden canlıyı bulur (yayın yoksa söyler)
  · REUTERS → gömülü izin vermediği için yeni sekmede açılır
  · BBC → video gömülemiyor (UNPLAYABLE test sonucu) → BBC World Service
    radyosu olarak panelde çalar

KUMANDA:
  · ⏸ oynat/duraklat · 🔉🔊 ses azalt/artır · kaydırıcı (0-100) · 🔇 sessiz
  · ⛶ tam ekran · KALİTE: AUTO / 1080p / 1440p / 4K · 🔄 yenile · 🔗 yeni sekmede
  · EKRANA ÇİFT TIK → TAM EKRAN (tam ekrana geçerken HD isteği gönderir)
    çıkmak için Esc veya tekrar çift tık
  · Ses seviyesi, sessizlik, kanal ve kalite hatırlanır (bilgisayarında saklanır)
  · Başka sekmeye geçince video duraklar (işlemci dostu)
  · Araç çubuğundaki "📺 ÜSTAD TV: AÇIK/KAPALI" düğmesiyle gizlenir/açılır

DÜRÜST NOTLAR:
  · YouTube oynatıcı bir kanalı gömneyi reddederse panel otomatik olarak kanal
    kimliğinden bağlanır (o durumda ses kontrolü YouTube'un kendi çubuğunda olur)
  · Kalite düğmeleri bir "istek"tir; YouTube gerekirse kendi kalitesini seçer
  · İnternet yokken TV kutusu "kanal seç" ekranında bekler

ÜSTAD DÜNYA MONİTÖRÜ — v5.4  ★ TAM SÜRÜM
=======================================

YENİ SEKMELER
-------------
BÖLGEM · GAZİANTEP & TÜRKİYE
 · Gaziantep namaz vakitleri (Aladhan) · güneş doğuş/batış (sunrisesunset.io)
 · Gaziantep hava durumu (Open-Meteo) · 500 km çevredeki son depremler (USGS)
 · DÖVİZ KURLARI (open.er-api · 160+ birim, USD→TL) — TCMB XML'i tarayıcıdan
   okunamadığı için (CORS kapalı) aynı veri açık kur API'sinden alınır
 · ALTIN ons + gümüş + gram altın (TL) · KORKU & AÇGÖZLÜLÜK endeksi · KRİPTO
 · MGM TÜRKİYE METEOROLOJİ UYARILARI (Türkçe, gerçek zamanlı, 32 bölge)
 · HAVALİMANI METAR (VATSIM servisi, 8 meydan) · NOAA/NWS aktif uyarılar

ZEKÂ · ANORMALLİK · SKOR · SENARYO
 · ANORMALLİK TESPİTİ: hareketsiz gemi (30 dk aynı nokta), hızlı seyir,
   veri akışından çıkan uçak, gemi/kötü-IP yoğunluk değişimi, sismik kümeleşme
 · ÇAPRAZ DOĞRULAMA: USGS ↔ EMSC eşleştirme (25 dk / 250 km tolerans) →
   "iki kaynakta doğrulanan olay" listesi (ölçüm: 18 olay)
 · TARİHSEL MOD: 1900'den bugüne M7+ depremler (300 kayıt) + on yıl grafiği
 · KURAL TABANLI ZEKÂ CÜMLELERİ (anahtarsız, gerçek veriden üretilir)
 · GÜNLÜK DÜNYA DURUM SKORU (0-100, 6 bileşen, ağırlıklı) + saatlik geçmiş grafiği
 · SENARYO MOTORU: 5 hazır senaryo (büyük deprem, güneş fırtınası, siber dalga,
   fırtına/sel, anormallik) → açık olanlar tetiklenince otomatik: o bölgeye uç,
   katman setini uygula, bülten üret, Telegram'a gönder, ses çal
 · İSTİHBARAT DEFTERİ: not ekle/etiketle/ara, konuma bağla, Markdown dışa aktar
 · HEDEF TAKİBİ: gemi/uçak takip listesi + hedef koordinatı verilirse ETA hesabı
 · ZEKÂ RAPORU (Word) + anormallik CSV

GÜVENLİK · KASA · YEDEK · TESTLER
 · PIN KİLİDİ (SHA-256, 5 hatalı deneme → 60 sn kilit, açılış kapısı)
 · ŞİFRELİ KASA (WebCrypto AES-GCM + PBKDF2 120k tur) — anahtarlar/telegram/pin
   şifrelenip ham kopyaları silinir
 · OTOMATİK GÜNLÜK YEDEK (JSON) + son yedek zamanı
 · KENDİNİ TEST EDEN PAKET: 14 arayüz kontrolü + 10 canlı besleme testi → yüzde rapor
 · GİZLİ MOD: istenen sekmeler menüden gizlenir
 · GİT SÜRÜM KONTROLÜ (.bat): USTAD-GIT-KAYDET.bat / USTAD-GIT-GERI-DON.bat

DIŞARI · RADYO · HUE · ÇIKTILAR
 · KML (Google Earth) + GeoJSON dışa aktarma (tüm nokta ve hatlar)
 · A4 YAZDIRMA düzeni (PDF olarak kaydedilebilir)
 · GÜNÜN KARTI (1080×608 PNG: küre + skor + rakamlar + imza)
 · OBS/YAYIN MODU: kayan haber bandı + köşede skor tabelası + temiz görünüm
 · CANLI RADYO: radio-browser API ile ülkeye göre istasyon arama ve panelde çalma
 · CANLI YAYIN penceresi (NASA TV, DW, Al Jazeera, France 24 resmî yayınları)
 · PHILIPS HUE: alarm → ışık kırmızı (yerel sunucu modunda çalışır)
 · RTL-SDR: kendi ADS-B alıcın için betik (donanım yoksa dürüst uyarı verir)

İLERİ GÖRSEL & ERİŞİLEBİLİRLİK
 · 3B SÜTUN modu (deprem büyüklüğü yüksekliğe döner)
 · AKIŞ ÇİZGİLERİ (90 havalimanı rota yayı)
 · ZAMAN-MEKÂN KÜPÜ (enlem × boylam × zaman · fare ile döndürülür)
 · EKRAN KORUYUCU / SALON MODU (3 dk hareketsizlikte saat + skor + son olaylar)
 · BÜYÜK YAZI · RENK KÖRÜ · YÜKSEK KONTRAST modları

YENİ DOSYALAR (toplam 24 dosya + foto)
 · kaynak2.js (17 yeni besleme) · zeka2.js (analiz/skor/senaryo/defter/takip)
 · guvenlik.js (PIN/kasa/yedek/test/gizli) · disari.js (KML/radyo/hue/yayın/kart)
 · gorsel2.js (3B sütun/akış/küp/koruyucu/erişilebilirlik)
 · panel-api.py + USTAD-PANEL-API.bat (yerel API: /durum.json + panel sunucusu)
 · telegram-bot.py + USTAD-TELEGRAM-BOT.bat (telefondan komut)
 · USTAD-GIT-KAYDET.bat / USTAD-GIT-GERI-DON.bat (sürüm kontrolü)
 · USTAD-SITE-YAYINLA.bat (siteye hazır temiz kopya) + USTAD-MONITOR-APK-KILAVUZU.txt
 · USTAD-RTLSDR.bat (kendi alıcın)

KATMAN SAYISI: 58 · SEKMELER: 21 · FONKSİYON: 43 yeni (hepsi doğrulandı)

ÜSTAD DÜNYA MONİTÖRÜ — v5.3
===========================

AÇILIŞ ANİMASYONU (giris.js) — 17 saniye
------------------------------------------
Panel açılırken tam ekran sinematik giriş sahnesi:
 · 3B yıldız alanı (560 yıldız, derinlik/perspektif + parıldama)
 · Tel kafes küre: GERÇEK tesis koordinatlarından (askerî üsler, nükleer,
   ekonomik merkezler, uzay üsleri, havalimanları, limanlar, platformlar)
   + enlem/boylam ızgarası + atmosfer halesi + dönen yörünge halkaları
 · Fotoğraf madalyonu DÖNEN KÜRENİN TAM MERKEZİNDE (161 px, piksel piksel kalibre:
   küre merkezi ile madalyon merkezi aynı nokta) + 3 dönen halka + nabız gibi atan ışık
 · "ÜSTAD KENAN KUZUCU" yuvarlak çizginin 62 px ÜSTÜNDE: kapsamlı şerit (ribbon),
   kenarında dönen ◈ elmaslar, üzerinden geçen ışık süzülmesi, gradyan neon yazı + çift hale,
   şerit nefes alır gibi parlar
 · İsim HARF HARF yazılır ve her harf kendi neon parlamasıyla gelir; arada kırmızı/camgöbeği
   kromatik parlamalar geçer (gerçek neon tabela hissi)
 · İsmin 46 px üstünde süs şeridi: ✦ yıldız (döner + nabız) ve iki yandan uzayan ışık çizgileri
 · Hoş geldin satırının iki yanında nabız atan ❰ ❱ kanatları
 · Canvas: halka üzerinde dönen 3 yay parçası, ters yönde dönen 40 noktalı dış halka,
   ekranda yükselen 46 kor parçacığı, halkada dönen 16 kıvılcım
 · FOTOĞRAFIN ARKASINDAN YAYILAN 26 IŞIK HUZMESİ (yavaşça döner)
 · SONAR DALGALARI: merkezden dışa yayılan 3 halka (radar hissi)
 · ÖLÇEK TİK HALKASI: 72 çizgili kadran (her 6'da biri uzun), yavaş döner
 · KAYAN YILDIZLAR: ekranı çapraz geçen 3 kuyruklu yıldız
 · PARLAK YILDIZLARA ÇAPRAZ IŞIK (flare)
 · EKRAN SÜPÜRMESİ: sahne üzerinden geçen çapraz ışık bandı
 · KENAR SÜSLERİ: dört kenarda ölçek çizgileri + iki yanda nabız atan 28 ekolayzer çubuğu
 · İsmin üzerinde gezinen 8 yıldız kıvılcımı (yanıp söner, döner)

İKİ KADEME DAHA ŞATAFAT (son eklenenler)
----------------------------------------
 · HALKAYI TAKİP EDEN DÖNEN YAZI: "ÜSTAD KENAN KUZUCU · ÜSTAD DÜNYA MONİTÖRÜ ·"
   madalyonun çevresinde harf harf döner, her harf sırayla parlar
 · KÜRE ÜZERİNDE UÇUŞ YAYLARI: 9 veri yayı, üzerlerinde ilerleyen ışık noktaları
 · YILDIZ TOZU DİSKİ: 72 parçacıklı eğik halka, derinlik hissiyle döner
 · ATEŞBÖCEKLERİ: kıvrımlı yollarda gezen 30 nabız atan parıltı
 · AURORA BULUTLARI: 4 büyük renk bulutu yavaşça yer değiştirir (derinlik)
 · HOLOGRAFİK BANTLAR + ince hologram çizgileri ekranı tarar
 · EKRAN DOKUSU: CRT tarama dokusu + yavaş kayan kare ızgara
 · KENARLARDA KAYAN VERİ YAZILARI: sol ve sağ kenarda dikey kayan katman listesi
   (DEPREM · GDACS · UYDU · SİBER · HAVA · AURORA · GEMİ · UÇAK · VOLKAN · TSUNAMİ…)
 · MADALYONDAN YAYILAN NABIZ HALKALARI (2 halka, 4,2 sn'de bir genişler)
 · ŞERİTTE ÇİFT SÜZÜLME: bir yeşil, bir altın ışık bandı ters yönlerde geçer
 · ÜST ÇUBUKTA 7 NABIZ ATAN DURUM LAMBASI
 · KÖŞE SÜSLERİ: her köşede kenarlık + nabız atan elmas nokta
 · 28 EKOLAYZER ÇUBUĞU (iki yanda, 14+14)
 · Akkor ışık çizgisi şeridin hemen altında
 · "MONİTÖR DÜNYASINA" TAM ALT ÇİZGİNİN ALTINDA — ARTIK ÇOK DAHA BELİRGİN:
   30 px KALIN neon yazı, koyu cam kapsül levha içinde (493x50 px), üç katmanlı hale,
   levha nefes alır gibi parlar, üzerinden ışık süzülür; iki yanında ❰ ❱ kanatları
 · "HOŞ GELDİNİZ" altında — 32 px gradyan neon yazı, çift hale
 · Yuvarlak çizgi üzerinde dönen 16 kıvılcım (4'ü büyük ve parlak)
 · Fotoğrafın arkasında dönen radar taraması (conic gradient süpürme)
 · Sol altta CANLI sistem aşamaları (gerçek kontroller):
   WebGL · globe.gl · Leaflet · satellite.js · tesis verisi · katman motoru ·
   siber beslemeler · alarm motoru · arayüz · kimlik → her biri ✔ olur
 · Sağ altta %0→100 yükleme çubuğu (kayan ışık), Gaziantep + canlı saat
 · 10 saniye boyunca küreye yavaş yakınlaşma (dolly-in) — sahne nefes alıyor
 · Sonda "SİSTEM HAZIR" parlaması + 150 parçacıklı patlama
 · Kapanışta tüm sahne büyüyerek (scale 1.14) kararır, panel içine "dalış" hissi
 · Renk: seçtiğin TEMAYA göre otomatik (altın temasında altın, hacker temasında neon yeşil…)
 · Yumuşak 4 notalı açılış tonu (tarayıcı izin verirse)
 · ATLA ▶ düğmesi · boşluk / Esc / tık ile geçme
 · AYARLAR > 🎬 AÇILIŞ ANİMASYONU: HER AÇILIŞTA / GÜNDE BİR / KAPALI +
   açılış sesi aç-kapa + "ŞİMDİ OYNAT"
 ÜSTAD DÜNYA MONİTÖRÜ — v5.2
===========================

YENİ ÖZELLİKLER (v5.2)
----------------------
KOMUTA
 · Ctrl+K komut paleti (36 hazır komut + yazdığın her şey için "şuraya uç")
 · Türkçe sesli komut (🎙️ SES) — "afet modu", "İstanbul", "ekran görüntüsü",
   "bülten", "duvar modu"… (mikrofon için yerel sunucu modu gerekir)
 · Klavye kısayolları: F1 yardım · Ctrl+S ekran · Ctrl+D duvar · Ctrl+T tema ·
   Ctrl+N gece nöbeti · Ctrl+B bülten · Ctrl+Q sesli özet · Ctrl+1…7 mod setleri · 1/2/3 görünüm
 · Sağ tık menüsü: buraya odaklan · mesafe ölç · nokta bilgi kartı ·
   koordinat kopyala · olay hikâyesi
 · Yer arama kutusu (Türkçe: "Gaziantep", "Tokyo" → küre oraya uçar)

GÖRÜNÜM
 · 14 yer imi düğmesi (Gaziantep, İstanbul, Ankara, İzmir, Boğazlar, Hürmüz, Süveyş, Malakka, Panama, Tayvan, Kore, Ukrayna, Ortadoğu, Dünya)
 · Sinematik kamera turu (🎬 TUR) — 10 duraklı otomatik gezinti
 · Zaman çizelgesi OYNATICI (▶ OYNAT) — 30 günlük arşiv baştan sona oynar
 · 🔥 ISI HARİTASI modu · 🧩 ETİKET TOPLAMA (kümeleme)
 · HUD: FPS · açık katman sayısı · nokta sayısı · veri yaşı · IP/Tor durumu
 · ⚙️ KALİTE modu (DÜŞÜK / NORMAL / YÜKSEK — zayıf ekran kartı için)
 · 📷 EKRAN GÖRÜNTÜSÜ (PNG, alt bilgi şeritli, masaüstüne iner)
 · 🖥️ DUVAR/KIOSK modu (tam ekran, imleç gizli, 25 sn'de sekme döngüsü)
 · 📱 TELEFON DÜZENİ (dokunmatik, tek kolon)
 · 📤 PAYLAŞ (o anki durum özeti panoya)

ANALİZ
 · Nokta bilgi kartı: bir yere tıkla → ters geokod (şehir), hava durumu,
   Gaziantep'e uzaklık, en yakın fay hattı, çevredeki tüm katmanlar
 · Olay hikâyesi: seçilen noktanın 400 km çevresindeki bütün katmanlar tek listede
 · Geçen yıl ile karşılaştırma (USGS arşivi, M4.5+ son 7 gün vs geçen yıl)
 · Katman grafikleri (sparkline): deprem · yangın · gemi · uçak · kötü IP · uydu (saatlik örnekler)
 · Kaynak sağlığı tablosu (29 besleme: lisans + yenileme aralığı + canlı/eskimiş/durdu)
 · Çevrimdışı önbellek (internet kesilince son bilinen durum şeridi)
 · Açılış teşhisi (WebGL, globe.gl, Leaflet, uydu motoru, depolama, bildirim, mikrofon, beslemeler)
 · Yerel makine açık portları (USTAD-PORT-TARA.bat ile, tamamen yerel)

KİŞİSELLEŞTİRME (AYARLAR sekmesi)
 · Kendi mod setlerini kaydet/sil/uygula ("Kenan modu")
 · Tema tasarımcısı: 5 renk seç, kendi temanı yarat (ÖZEL düğmesi)
 · Yedekle / geri yükle (JSON) — bilgisayar değişirse ayarlar taşınır
 · Açılış tercihi: hangi sekme + hangi görünüm + hangi tema ile başlasın
 · 🌙 GECE NÖBETİ (gün batımından sonra ekran yumuşar — Gaziantep için gerçek gün batımı saati)
 · 📨 TELEGRAM alarmı (kendi bot token'ın; alarmlar telefonuna düşer)
 · 🔊 Alarm ses kütüphanesi: BİP · SİREN · TERMİNAL · SESSİZ
 · 🛰️ Uydu geçiş hatırlatıcı (ISS 10 dk önce haber verir)
 · 🔳 QR kod + yerel sunucu (.bat) — telefondan bağlanma
 · 📧 GÜNLÜK BÜLTENİ E-POSTA İLE GÖNDERME: USTAD-BULTEN-MAIL.bat
   (mail-ayar.txt dosyasına kendi adresini ve uygulama şifreni yaz; bülten Word eki
   olarak her gün otomatik gidebilir — Görev Zamanlayıcı'ya ekleyebilirsin)

YENİ DOSYALAR
 · komuta.js (komut paleti, ses, yer imleri, HUD, ekran, duvar modu)
 · analiz.js (bilgi kartı, olay hikâyesi, karşılaştırma, grafikler, önbellek, teşhis)
 · kisisel.js (mod setlerim, tema tasarımcısı, yedek, telegram, gece nöbeti)
 · USTAD-MONITOR-YEREL.bat (yerel sunucu: sesli komut + askerî uçak + telefon)
 · USTAD-PORT-TARA.bat + port-tara.ps1 (yalnızca kendi makinenin portları)
 · mail-gonder.py + USTAD-BULTEN-MAIL.bat (günlük bülteni e-posta ile gönderme)

ÜSTAD DÜNYA MONİTÖRÜ — v5.1
===========================

KATMAN SİSTEMİ (55 katman · 4 grup)
-----------------------------------
CANLI (31): Deprem · Yangın/Sel/Fırtına · GDACS Afet · Kasırga · Volkan · Tsunami/Hava ·
  Gemi · Uçak · Askerî Uçak · ISS · Uydular · Starlink · Aurora · Hava · Yağış Tahmini ·
  Rüzgâr · Hava Kalitesi · Dalga · Gece/Gündüz Çizgisi · Deprem Uyarı Seviyesi (PAGER+tsunami) ·
  Ateş Topu/Meteor · Uçak Yoğunluğu · Gemi Yoğunluğu · Aurora Görünürlük Çizgisi ·
  Uzay Çöpü (enkaz) · Gaziantep Yakınlık (1000 km) · Zaman Makinesi (30 gün) ·
  Uydu Yörünge İzleri · Uçak İzleri · Gemi İzleri · Deprem Dalga Animasyonu · Türkiye Hava Sahası
SİBER (4): Kötü şöhretli IP/C2 · Fidye Yazılımı Mağdurları · Tor Röleleri · Saldırı Kaynakları
STATİK (20): Çatışma · Askeri Üsler · Nükleer · Uzay Üsleri · Ekonomik · Mineraller · Ticaret ·
  Rafineri · Boru Hatları · Limanlar · Santral · Veri Merkezi · Çip Fabrikası · Mülteci ·
  Koridor · TÜRKİYE FAY HATLARI · Deniz Platformları · Gaz Sahaları · Havalimanları

YENİ ARAÇLAR
------------
- HAZIR MOD SETLERİ: GENEL · AFET · UÇUŞ · SİBER · UZAY · TÜRKİYE · DENİZ · TEMİZLE
  (tek tıkla katman grubu açılır/kapanır)
- KATMAN ARAMA kutusu (ör. "gemi", "cve", "deprem")
- Her canlı katmanın yanında SON GÜNCELLEME SAATİ + ↻ YENİLE düğmesi
- 2D HARİTA'ya tüm katmanlar taşındı (eskiden sadece deprem/yangın/ISS vardı)
- KÜRE DOKUSU seçici: GECE (varsayılan) · GÜNDÜZ (mavi mermer) · TOPRAK · KARANLIK
- ZAMAN MAKİNESİ: 30 günlük arşiv + kaydırıcı (1 saat – 30 gün arası sar)
- UYDU YÖRÜNGE İZLERİ (gelecek 90 dakika) · UÇAK/GEMİ İZLERİ (son konum kuyruğu)
- DEPREM DALGA ANİMASYONU (son M6+ için P/S dalga halkaları)
- UZAY sekmesinde: ISS CANLI KAMERA (NASA yayını) · GAZİANTEP/İSTANBUL için çıplak gözle
  görülebilir uydu geçişleri (20° üzeri) · HF RADYO PROPAGASYONU tahmini

ALARM SEKMESİ (yeni)
--------------------
- Kurallar: deprem büyüklüğü + Gaziantep'e uzaklık (km) · Kp indeksi eşiği ·
  kırmızı afet · yeni CVE sayısı · sesli uyarı
- Koşul gerçekleşince: masaüstü bildirimi + bip + panel şeridi + ALARM GEÇMİŞİ kaydı
- GÜNLÜK WORD BÜLTENİ: tek tıkla .doc (Word ile açılır) — deprem/afet/uzay/siber özeti
- SESLİ ÖZET (TTS, Türkçe) · CSV DIŞA AKTARMA (depremler · tehdit/IOC)
- 30 GÜNLÜK DEPREM GRAFİĞİ (sparkline)

SİBER TEHDİT PANELİ (genişletildi)
----------------------------------
Canlı: OpenPhish · URLhaus genel liste · CISA KEV · Spamhaus ASN-DROP · CIRCL ·
NVD yeni CVE'ler · Exploit-DB yeni exploit'ler · kötü şöhretli IP/C2 · fidye yazılımı
mağdurları (ransomwatch) · Tor röle dağılımı · SANS ISC saldırı kaynakları.
Anahtar girilirse: abuse.ch (URLhaus API/MalwareBazaar/ThreatFox) + AlienVault OTX.

SİBER TEHDİT SEKMESİ (yeni)
---------------------------
CANLI IOC AKIŞI (anahtar gerekmez):
- OpenPhish ........... aktif kimlik avı (phishing) URL listesi · GitHub aynasından (CORS açık)
- URLhaus ............. aktif zararlı URL'ler · anahtarsız GENEL bloklist (vekil ile)
- CISA KEV ............ ABD'nin "bilinen sömürülen zafiyetler" kataloğu (CVE + ürün + tarih)
- Spamhaus ASN-DROP ... kötü şöhretli ağ blokları
- CIRCL MISP OSINT .... Lüksemburg CERT açık tehdit beslemesi
ANAHTAR GİRİLİRSE CANLI OLUR (ücretsiz anahtarlar):
- abuse.ch Auth-Key → URLhaus · MalwareBazaar · ThreatFox
- AlienVault OTX API anahtarı
Anahtarlar yalnızca bu bilgisayarın tarayıcısında (localStorage) tutulur, hiçbir yere gönderilmez.

KAYNAK KÜTÜPHANESİ — 6 KATEGORİ / 54 KAYNAK (senin listen)
-----------------------------------------------------------
1 · Siber tehdit / IOC (10)      4 · Dezenformasyon (6)
2 · Saldırı araştırması (10)     5 · Haber / olay akışı (10)
3 · Küresel suç (8)              6 · Türkiye kaynakları (10)
Etiketler: CANLI ÇEKİLİYOR · BESLEME (vekil ile) · ANAHTAR GEREKİR · KAYIT GEREKİR · BAĞLANTI
Kütüphane hem SİBER TEHDİT hem KAYNAKLAR sekmesinde görünür.

DÜRÜST SINIRLAR (17 Eyl 2026'da tek tek test edildi)
----------------------------------------------------
- OpenPhish: kendi sitesi tarayıcıdan engelliyor (Failed to fetch) → panelde resmî
  GitHub aynası kullanılıyor (raw.githubusercontent.com, CORS açık, 0,2 sn).
- URLhaus: API Auth-Key şart (401) ama ANAHTARSIZ genel bloklist yayınlıyor →
  panelde o liste canlı akıyor (vekil ile).
- abuse.ch MalwareBazaar + ThreatFox ücretsiz Auth-Key şart → 401 (panelde alan var).
- AlienVault OTX anahtar şart → 403 (panelde alan var).
- USOM: eski JSON API kapatılmış, artık Swagger arayüzü dönüyor → bağlantı.
- AFAD: sunucuya erişilemedi (SSL zaman aşımı) → bağlantı.
- INTERPOL (503), FTC, FATF (403), AFP Fact Check (403), Europol, FBI, UNODC:
  canlı besleme vermiyor → bağlantı olarak duruyor.
- Reuters RSS yayınını kapattı; AP'nin beslemesi yok → bağlantı.
- MISP kendi/kurumsal sunucu ister; CIRCL açık beslemesi canlı.
- Shadowserver raporları başvuru gerektirir.
- Spamhaus: site 403 veriyor, ASN-DROP JSON'u panelde vekil ile çekiliyor.
- Haber kaynakları: BBC · Al Jazeera · DW · France 24 · Euronews · VOA · NPR · Guardian · TRT World
  panelde canlı akıyor (NPR ve DW tarayıcıdan doğrudan, diğerleri vekil ile).

DOĞRULAMA — SİBER TEHDİT MODÜLÜ (17 Eyl 2026 · gerçek veriyle)
----------------------------------------------------------------
siber.js'in KENDİ ayrıştırma kodu canlı kaynaklara karşı çalıştırıldı:
- OpenPhish .......... 300 aktif kimlik avı URL'si (0,2 sn)
- URLhaus genel liste . 14.013 zararlı URL (1,7 sn)
- CISA KEV ........... 1.713 bilinen sömürülen zafiyet · katalog sürümü 2026.09.16
                       son eklenenler: CVE-2026-58704 (Google Pixel),
                       CVE-2026-76460 (Cisco ISE), CVE-2026-87886 (Acronis Backup)
- Spamhaus ASN-DROP .. 435 kötü şöhretli ASN (AS245 PRC-AS · AS2601 RADIOLINK-AS)
- CIRCL MISP OSINT ... 1.680 açık tehdit olayı (4,0 sn)
Kütüphane: 6 kategori / 54 kaynak doğrulandı. Arayüz: panel anında çiziliyor,
veriler geldikçe doluyor (başsız Chrome testi, arayüz hatası 0).

RENK TEMALARI (19) — üstteki RENK düğmeleri
--------------------------------------------
--- KOYU TEMALAR ---
MONİTÖR ... neon yeşil (varsayılan)
HACKER .... matrix yeşili #00ff41 · CRT titremesi + glitch başlık + YAĞMUR otomatik
MATRIX .... #00ff5f · dijital yağmur + CRT + glitch + parlak tarama çizgileri
İSTİHBARAT  haki/altın #c9b458 + amber uyarı rengi · zeytin zemin (askerî istihbarat)
ALARM ..... kriz kırmızısı #ff2d2d · koyu kırmızı zemin (tehdit/afet takibi)
TERMİNAL .. kehribar + camgöbeği vurgu · CRT (Bloomberg tarzı)
AMBER ..... eski terminal kehribarı #ffb000 · CRT
SİBER ..... camgöbeği #22d3ee · derin lacivert zemin
NEON ...... synthwave pembe #ff2fb9 + camgöbeği vurgu
MOR ....... UV moru #a855f7 · koyu mor zemin
ORMAN ..... orman yeşili #3fbf5f
ÇÖL ....... kum rengi #d9a55a
MATBAA .... monokrom beyaz/gri · CRT
ALTIN ..... altın sarısı #d4af37
GECE ...... gece mavisi #38bdf8
--- AÇIK TEMALAR (beyaz değil, yumuşak tonlar · koyu yazı) ---
AÇIK ...... yumuşak yeşil-gri zemin (#eef3f0) · koyu yeşil vurgu #15803d
KAĞIT ..... krem/kâğıt zemin (#f6f1e6) · amber-kahve vurgu #b8862b
BUZ ....... soluk mavi zemin (#edf5fa) · petrol mavisi vurgu #0e7490
LAVANTA ... açık lila zemin (#f2eefb) · mor vurgu #7c3aed
Açık temalarda üst çubuk, kartlar ve harita zemini de açılır; yazı koyuya döner.
Okunabilirlik ölçüldü: metin parlaklığı 27-39 / 255, zemin 239-248 / 255 (tam kontrast).

HACKER PANELİ DONANIMI (MATRIX / HACKER / TERMİNAL / AMBER / MATBAA'da otomatik)
--------------------------------------------------------------------------------
- Dijital yağmur: ekranın arkasında düşen 0/1 ve katakana karakterleri (MATRIX+HACKER'da otomatik)
- "☔ YAĞMUR" düğmesi: istediğin temada yağmuru elle aç/kapat (seçim hatırlanır)
- CRT modu: köşe kararması (vignette), hafif kırpışma, kalın tarama çizgileri
- Glitch başlık: "ÜSTAD DÜNYA MONİTÖRÜ" yazısı ara ara kırılıp renk kaydırıyor
- Küre atmosferi, madalyon çerçevesi ve LIVE rozeti tema rengini takip ediyor
Seçim hatırlanır (localStorage). Tarayıcı sekmesi gizliyken (Ctrl+Tab) çizim durur — işlemci boşa yorulmaz.

ÜSTAD KİMLİĞİ (fotoğraf nerede?)
--------------------------------
- Üstteki çubuğun solunda : yuvarlak MADALYON + "ÜSTAD KENAN KUZUCU · PANEL SAHİBİ"
- Kürenin sol üst köşesinde : cam efektli KİMLİK KARTI (ÜSTAD KENAN KUZUCU · KURUCU · GAZİANTEP)
- Sekme simgesi (favicon)  : favicon_11zon görselinden
- Başlıktaki küçük rozet   : favicon görselinden
- Alt bilgi (footer)       : imza satırı (küçük madalyon + "ÜSTAD KENAN KUZUCU")
Çerçeve rengi temaya uyar: MONİTÖR=yeşil · ALTIN=altın sarısı · GECE=mavi.
Fotoğrafı değiştirmek için: foto/ klasöründeki ustad-kenan.jpg dosyasını değiştir
(veya yeni fotoğrafın yolunu söyle, yeniden kırpıp yerleştiririm).

NE BU?
------
3B DÖNEN KÜRE üzerinde 34 KATMANLI canlı dünya istihbarat panosu.
Google Maps tarzı isim etiketleri. Siyah + neon yeşil tema.
Tüm veriler ücretsiz ve ANAHTARSIZ kaynaklardan canlı çekilir.

DOSYALAR (ana klasör)
---------------------
index.html                 — panelin kendisi
katmanlar.js               — CANLI KATMAN MOTORU (v4.0'da eklendi)
statik-veri.js             — statik katman verileri (v4.0'da eklendi)
kablolar.js                — denizaltı kablo verisi
USTAD-MONITOR-UCAKLI.bat   — tam sürüm başlatıcı (CORS serbest → her şey çalışır)
OKU-BENI.md                — bu dosya

NASIL AÇILIR
------------
1) TAM SÜRÜM (önerilen): "USTAD-MONITOR-UCAKLI.bat"e çift tıkla.
   Sivil + askerî uçaklar ve CORS engelli tüm kaynaklar çalışır.
2) Sade: index.html'e çift tıkla. Canlı katmanların çoğu çalışır
   (CORS'u açık kaynaklar); sivil/askerî uçaklar görünmez.

ÜÇ GÖRÜNÜM MODU (üstteki düğmeler)
----------------------------------
- 3D KÜRE    : dönen küre + yeşil atmosfer + etiketler
- 4D SİNEMA  : mavi atmosfer, hızlı dönüş, yakın kamera, yumuşak süzülme
- 2D HARİTA  : düz harita (etiketli) + UYDU/RADAR KAROLARI paneli

KATMANLAR — 19 CANLI
--------------------
Deprem (USGS · 300 nokta, haftalık M4.5+)
Yangın/Sel/Fırtına (NASA EONET)
GDACS Afet ............... JRC/AB · tüm tipler, yeşil/turuncu/kırmızı seviye
Kasırga/Siklon ........... GDACS TC (100 olaya kadar)
Volkanlar ................ 50 büyük aktif volkan + USGS HANS canlı uyarı seviyesi
Tsunami/Şiddetli Hava .... api.weather.gov (resmî ABD uyarı sistemi)
Gemiler .................. Digitraffic AIS · ⛴ seyir yönüne döner, ad + sefer hedefi
Uçaklar .................. OpenSky · ✈ canlı (≈180 uçak)
Askerî Uçaklar ........... adsb.lol /v2/mil · 500+ askerî uçak (⚠ · .bat şart)
ISS ...................... wheretheiss.at · 8 sn'de bir
Uydular (canlı yörünge) .. CelesTrak TLE + satellite.js · ~98 uydu gerçek yörüngede
Starlink (canlı) ......... CelesTrak starlink grubu (≈300 uydu · 403'te 5 dk geri çekilir)
Kutup Işıkları ........... NOAA SWPC OVATION aurora olasılığı (kutup halkaları)
Hava Durumu .............. Open-Meteo · 94 şehir, sıcaklığa göre renk
Yağış Tahmini (24 saat) .. Open-Meteo · 62 şehir, önümüzdeki 24 saat toplam mm
Rüzgâr ................... Open-Meteo · 15° ızgara, ≈259 yön oku
Hava Kalitesi PM2.5 ...... Open-Meteo Air Quality · 60 şehir
Dalga Yüksekliği ......... Open-Meteo Marine · 41 deniz noktası (dalga+su+seviye)
Gece/Gündüz Çizgisi ...... astronomik hesap + ☀ güneş alt noktası

KATMANLAR — 15 STATİK (bilinen tesisler, elle derlendi)
------------------------------------------------------
Çatışma Bölgeleri · Askeri Üsler · Nükleer Tesisler · Uzay Üsleri ·
Ekonomik Merkezler · Kritik Mineraller · Ticaret Rotaları ·
Petrol Rafinerileri (54) · Boru Hatları (13 hat: TürkAkım, TANAP, BTC, Druzhba…) ·
Büyük Limanlar (53) · Santral/Baraj (40) · Veri Merkezleri (44) ·
Çip Fabrikaları (30) · Mülteci Kampları (26) · Ulaşım Koridorları (9)

2D UYDU / RADAR KAROLARI (sağ panelde aç/kapat)
-----------------------------------------------
Bulut / gündüz görüntüsü .... NASA GIBS MODIS (günlük gerçek uydu görüntüsü)
Bulut oranı ................. NASA GIBS
Yangın / duman .............. NASA GIBS yanlış renk (Bands367)
Aerosol / toz bulutu ........ NASA GIBS
Kar örtüsü .................. NASA GIBS MODIS NDSI
Kara yüzeyi sıcaklığı ....... NASA GIBS MODIS LST
Deniz üretkenliği ........... NASA GIBS klorofil-a
Deniz buzu yoğunluğu ........ NASA GIBS AMSR2 (kutuplar)
Bitki örtüsü (NDVI) ......... NASA GIBS MISR aylık ortalama
Deniz yüzeyi sıcaklığı ...... NASA GIBS GHRSST MUR
Gece ışıkları (şehirler) .... NASA GIBS VIIRS
Kabartma / okyanus tabanı ... NASA Blue Marble
Canlı yağış radarı .......... RainViewer (son kare)
Radar animasyonu ............ RainViewer son 2 saatin 13 karesi (0,8 sn arayla)

SEKMELER
--------
HARİTA · HABER · PİYASA · DEPREM · YANGIN · ISS · FIRLATMA · UYDULAR ·
UZAY (Kp, güneş rüzgârı, parlama, güneş lekeleri, canlı uydular,
      GAZİANTEP/İSTANBUL için ISS geçiş saatleri — yerel hesap) ·
AFET (GDACS + siklon + volkan uyarı seviyeleri) ·
DENİZ (gemi trafiği + dalga + deniz seviyesi + su sıcaklığı) ·
HAVA (94 şehir + PM2.5 + 24 saatlik yağış tahmini) ·
SAĞLIK (WHO + BBC Sağlık) · UYARILAR (tsunami/şiddetli hava) ·
KAYNAKLAR · DİĞER

HABER SEKMELERİ: DÜNYA / TÜRKİYE (TRT·AA·BBC Türkçe·DW Türkçe·Sözcü) / NASA

DÜRÜST SINIRLAR (yapılamayanlar ve nedeni)
------------------------------------------
- Sivil/askerî canlı uçaklar yalnızca .bat ile açıldığında görünür (CORS).
- Dünya geneli gemi AIS'i (MarineTraffic/AISStream) API ANAHTARI ister.
  Panelde canlı gemi katmanı Digitraffic (Finlandiya/Baltık) ile çalışır.
- Gerçek zamanlı borsa endeksleri (S&P, BIST) tarayıcıdan anahtarsız çekilemez.
- ACLED çatışma verisi, Cloudflare Radar kesinti verisi, GPSJam, IODA:
  anahtar/kayıt ister ya da tarayıcı erişimi kapalı (test edildi).
- airplanes.live 403 (ücretli), NDBC şamandıraları CORS kapalı.
- Tsunami: küresel merkezler CORS kapalı → canlı uyarılar api.weather.gov
  (resmî ABD sistemi); küresel bülten başlıkları vekil sunucu ile listelenir.
- Starlink TLE'si CelesTrak tarafından zaman zaman 403 ile kısıtlanır:
  panel önce starlink grubunu, olmazsa "active" listesinden STARLINK
  kayıtlarını dener, yine olmazsa 5 dakika bekler.
- Statik katmanlar elle derlenmiş bilinen tesis listeleridir; canlı değildir.

DOĞRULAMA (17 Eyl 2026 · başsız Chrome ile gerçek ölçüm · v4.1)
--------------------------------------------------------------
Küre: 1577 nokta + 290 hat çizgisi + 250 gemi simgesi · 34 katman açık.
Canlı: GDACS 78 afet · 100 siklon · 62 şehir yağış tahmini · 94 şehir havası ·
60 hava kalitesi · 41 deniz noktası · 259 rüzgâr oku · 250 gemi (921 gemi
adı/hedefi kaydı) · 98 canlı uydu · aurora 33 nokta · güneş lekesi 12 bölge
(AR4507 · 15 leke) · volkan 69 uyarı · WHO 25 haber.
Uzay paneli: Kp 3 · güneş rüzgârı 554 km/sa · X-ışını B3.2 ·
Gaziantep ISS geçişleri: 18:04, 18:35, 19:42, 21:20, 21:51, 22:58 (yerel hesap).
Hava paneli: yağış tahmini Manila 14,7 mm · Auckland 13,4 mm · Ankara 3,4 mm.
2D: 208 karo katmanı (NASA GIBS kar/klorofil/bulut + RainViewer 13 kare animasyon).
Askerî uçak katmanı: kaynak 506 uçak döndürüyor; CORS nedeniyle yalnızca
.bat ile açılan panelde görünür (sade açılışta dürüstçe boş kalır).

SÜRÜM GEÇMİŞİ
-------------
v5.4 — 17 Eyl 2026: "HEPSİNİ FUUL" turu. 17 yeni canlı besleme (EMSC, MGM,
       open.er-api kur, altın/gümüş/korku endeksi, VATSIM METAR, NOAA/NWS uyarılar,
       GitHub Advisory, CISA, Nuclei, güvenlik haberleri, NOAA uzay uyarıları,
       güneş lekesi döngüsü, NASA DONKI, ISS konum, Dünya Bankası, FireHOL IP),
       ZEKÂ modülü (anormallik, çapraz doğrulama, tarihsel mod, skor, senaryo
       motoru, istihbarat defteri, hedef takibi + ETA), GÜVENLİK (PIN, AES-GCM kasa,
       otomatik yedek, kendini test, gizli mod, git), DIŞARI (KML/GeoJSON, A4,
       OBS modu, günün kartı, canlı radyo, canlı yayın, Hue, RTL-SDR),
       İLERİ GÖRSEL (3B sütun, akış çizgileri, zaman-mekân küpü, ekran koruyucu,
       büyük yazı/renk körü/yüksek kontrast) ve giriş animasyonu ekstraları
       (2. halka yazı, ışık konisi, kıvılcım yağmuru, altın varak, 74 kor).
       ip-api http sorunu → geojs.io (HTTPS+CORS) ile değiştirildi; tüm konumlandırma
       artık tarayıcıdan doğrudan çalışıyor. Katman 55 → 58, sekme 19 → 21.
v5.3 — 17 Eyl 2026: AÇILIŞ ANİMASYONU (giris.js). 15 sn sinematik giriş:
       3B yıldız alanı, gerçek tesis koordinatlarından tel kafes küre,
       madalyon, harf harf neon isim, hoş geldin yazısı, canlı sistem aşamaları,
       yükleme çubuğu, final parlaması + parçacık patlaması, panel içine dalış.
       Tema uyumlu renk (19 tema), 4 notalı açılış tonu, ATLA/boşluk/Esc,
       AYARLAR'da mod seçimi (her açılışta / günde bir / kapalı) + ses ayarı.
v5.2 — 17 Eyl 2026: 40 ÖZELLİK işlendi.
       Komuta: Ctrl+K komut paleti (36 komut), Türkçe sesli komut, klavye kısayolları,
       sağ tık menüsü, yer arama (Open-Meteo geocoding), 14 yer imi, kamera turu,
       HUD, kalite modu, PNG ekran görüntüsü, duvar/kiosk modu, paylaş, IP/Tor kontrolü.
       Analiz: nokta bilgi kartı, olay hikâyesi, geçen yıl karşılaştırma, katman grafikleri,
       kaynak sağlığı (29 besleme), ısı haritası, etiket toplama, zaman oynatıcı,
       çevrimdışı önbellek, açılış teşhisi, yerel port listesi.
       Kişiselleştirme: kendi mod setleri, tema tasarımcısı, yedek/geri yükle,
       açılış tercihi, gece nöbeti, Telegram alarmı, alarm ses kütüphanesi,
       uydu geçiş hatırlatıcı, telefon düzeni, QR + yerel sunucu.
       Mod setleri yeni katmanlarla güncellendi (GENEL 14, AFET 14, UÇUŞ 13, SİBER 12,
       UZAY 11, TÜRKİYE 14, DENİZ 10, TEMİZLE 0 katman).
       Yeni dosyalar: komuta.js · analiz.js · kisisel.js · USTAD-MONITOR-YEREL.bat ·
       USTAD-PORT-TARA.bat · port-tara.ps1
v5.1 — 17 Eyl 2026: A+B+C grubu tek tek işlendi.
       B (altyapı): 2D'ye tüm katmanlar (katman2.js), 8 hazır mod seti, katman arama,
       katman yaşı + tek tek yenileme.
       A (yeni katmanlar): deprem PAGER/tsunami, meteor (NASA CNEOS), uçak/gemi yoğunluk,
       aurora görünürlük çizgisi, uzay çöpü, Türkiye fay hatları, deniz platformları,
       gaz sahaları, havalimanları, Gaziantep yakınlık katmanı, zaman makinesi.
       SİBER: Feodo/CINS kötü şöhretli IP, ransomwatch fidye mağdurları, Tor röleleri,
       SANS ISC saldırı kaynakları, NVD CVE, Exploit-DB (ip-api ile konumlandırma).
       GÖRSEL: küre dokusu seçici, uydu yörünge izleri, uçak/gemi izleri,
       deprem dalga animasyonu, Türkiye hava sahası modu, ISS canlı kamera,
       çıplak gözle görülebilir uydu geçişleri, HF propagasyon tahmini.
       ALARM sekmesi: kural motoru + bildirim + bip, günlük Word bülteni, CSV dışa aktarma,
       30 günlük deprem grafiği, Türkçe sesli özet.
       Katman sayısı 34 → 55. Yeni dosyalar: katman2.js · katman3.js · katman4.js ·
       panel-zeka.js · ek-veri.js
v5.0 — 17 Eyl 2026: SİBER TEHDİT modülü (siber.js). 6 kategori / 63 kaynak kütüphanesi
       (kullanıcı listesi), canlı IOC akışı: OpenPhish, CISA KEV, Spamhaus ASN-DROP,
       CIRCL MISP OSINT. abuse.ch + OTX için anahtar alanı (girilince canlı).
       Haber kaynaklarına France 24, Euronews, VOA, NPR eklendi; ölü Reuters beslemesi
       çıkarıldı. KAYNAKLAR sekmesine kütüphane başına eklendi.
v4.6 — 17 Eyl 2026: 4 AÇIK tema eklendi (toplam 19): AÇIK, KAĞIT, BUZ, LAVANTA.
       Panelin üst çubuğu, kartlar, harita zemini ve bilgi kutuları artık değişken
       (açık temalarda açılıyor, yazı koyulaşıyor). Madalyon/glitch gölgeleri açık
       temaya uyum sağlıyor. Kontrast ölçümü: metin 27-39/255, zemin 239-248/255.
v4.5 — 17 Eyl 2026: Hacker paneli donanımı + 5 yeni tema (toplam 15). Dijital yağmur
       (canvas), CRT modu (vignette + kırpışma + tarama), glitch başlık animasyonu,
       "☔ YAĞMUR" düğmesi. Yeni temalar: MATRIX, TERMİNAL, NEON, ÇÖL, ORMAN.
       Başlıktaki ÜSTAD fotoğrafı 36 px → 104 px büyütüldü (mobilde 64 px),
       "ÜSTAD KENAN KUZUCU" yazısı 17 px'e çıkarıldı.
v4.4 — 17 Eyl 2026: Renk teması 3 → 10. Eklenenler: HACKER (matrix yeşili),
       İSTİHBARAT (haki + amber, askerî), ALARM (kriz kırmızısı), SİBER (camgöbeği),
       AMBER (terminal kehribarı), MOR (UV), MATBAA (monokrom). Her temanın kendi
       zemin tonu, tarama çizgisi ve parlaklığı var; küre atmosferi + madalyon
       çerçevesi tema rengini takip ediyor.
v4.3 — 17 Eyl 2026: ÜSTAD kimliği eklendi — başlıkta yuvarlak madalyon, kürenin
       köşesinde kimlik kartı, sekme simgesi (favicon), başlık rozeti, footer imzası.
       foto/ klasörü: ustad-kenan.jpg (madalyon), favicon.png/.ico, rozet.png.
       Fotoğraf: WhatsApp portresi 928×1152 → kare kırpıldı, 512×512'ye küçültüldü.
v4.2 — 17 Eyl 2026 (3. parti): 2D karo sayısı 14'e çıktı — deniz buzu yoğunluğu
       (NASA AMSR2) ve bitki örtüsü NDVI (MISR aylık) eklendi. Kalan 3. parti
       adayı: NASA FIRMS 10 dakikalık yangın sıcak noktaları (ücretsiz anahtar
       gerektirir — kullanıcı kaydı 1 dakika).
v4.1 — 17 Eyl 2026 (2. parti): Askerî uçaklar (adsb.lol), 24 saatlik yağış
       tahmini, gemi adı/sefer hedefi, deniz seviyesi (deniz seviyesi +
       gelgit), güneş lekeleri/aktif bölgeler, Gaziantep+İstanbul ISS geçiş
       saati hesabı, 3 yeni uydu karosu (kar · kara sıcaklığı · klorofil),
       radar animasyonu. Toplam 34 katman.
v4.0 — 17 Eyl 2026: 11 → 32 katman. Canlı: gemi, canlı uydu yörüngesi, Starlink,
       aurora, uzay havası, hava, rüzgâr, hava kalitesi, dalga, GDACS, siklon,
       volkan, tsunami/uyarılar, gece-gündüz çizgisi. Statik: rafineri, boru hattı,
       liman, santral/baraj, veri merkezi, çip fabrikası, mülteci kampı, koridor.
       Yeni sekmeler: UZAY · AFET · DENİZ · HAVA · SAĞLIK · UYARILAR.
       2D'ye NASA GIBS uydu görüntü katmanları + RainViewer yağış radarı.
v3.9 — doku eskiye döndü · 3D/4D/2D · harita etiketleri · 11 katman · uçan uçaklar
