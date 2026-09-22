/* ============================================================================
   KASA ÇEKİRDEĞİ + BELGE KASASI + ŞİFRE KASASI
   Kenan Kuzucu · ÜSTAD DÜNYA MONİTÖR        (DİĞER sekmesi, IPTV kutusunun altında)

   MİMARİ (doğru kasa mantığı — LUKS/Bitwarden ile aynı):
     İçerik anahtarı (DEK) = 32 rastgele bayt. Asla değişmez.
     Şifreden anahtar (KEK) = PBKDF2-SHA256, 600.000 tur, rastgele 16 bayt tuz.
     DEK, KEK ile SARILIR (AES-256-GCM) → depoda sadece sarmal durur.
     Şifre doğru mu? Sarmalı açmayı deneyince GCM etiketi söyler. Şifre kaydedilmez.
     Kurtarma kodu varsa: DEK ayrıca koddan türeyen anahtarla da sarılır.
       Kod 25 karakter (5 grup) — 128 bit, kaba kuvvetle imkânsız.
     Her dosya kendi taze IV'siyle DEK ile şifrelenir (AES-256-GCM).
     Kilitlenince DEK ve liste bellekten silinir; DOM'dan da temizlenir.

   DEPO: IndexedDB  'ustad_kasa_v1'
     kasa   : {id, ad, tuz, sarmal{iv,veri}, kod{tuz,iv,veri}|null, ipucu, kur}
     icerik : {id, iv, veri}            → şifreli JSON (dosya listesi, kayıtlar, eğitim)
     dosya  : {id, iv, veri:Blob}       → şifreli dosya gövdesi
   ============================================================================ */
var KASA_DB_AD = 'ustad_kasa_v1';
var KASA_DEVIR = 600000;                 /* PBKDF2 turu (OWASP üstü) */
var KASA_BEKLEME = 5 * 60 * 1000;        /* otomatik kilit: 5 dk */
var KASA_EN_BUYUK = 200 * 1024 * 1024;   /* tek dosya üst sınırı 200 MB */

var KAPILAR = {};   /* id → {acik, anahtar, zaman, veri, degisti} */
var KDB = null;
var KASA_LOG = [];  /* teşhis günlüğü: ne zaman açıldı/kapandı */
function kLog(s) { try { KASA_LOG.push(Date.now() + ' ' + s); if (KASA_LOG.length > 60) { KASA_LOG.shift(); } } catch (e) {} }

/* ============================== yardımcılar ============================== */
function kEsc(s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
function kB64(b) {
  var u = (b instanceof Uint8Array) ? b : new Uint8Array(b), s = '';
  for (var i = 0; i < u.length; i++) { s += String.fromCharCode(u[i]); }
  return btoa(s);
}
function kBayt(s) {
  var t = atob(s), u = new Uint8Array(t.length);
  for (var i = 0; i < t.length; i++) { u[i] = t.charCodeAt(i); }
  return u;
}
function kRast(n) { return crypto.getRandomValues(new Uint8Array(n)); }
function kBoyut(b) {
  if (b == null) { return '-'; }
  if (b < 1024) { return b + ' B'; }
  if (b < 1048576) { return (b / 1024).toFixed(1) + ' KB'; }
  if (b < 1073741824) { return (b / 1048576).toFixed(1) + ' MB'; }
  return (b / 1073741824).toFixed(2) + ' GB';
}
function kTarih(ts) {
  try {
    var d = new Date(ts);
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  } catch (e) { return '-'; }
}

/* ------------------------------ kripto ------------------------------ */
function kKekYap(sifre, tuz) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(sifre), 'PBKDF2', false, ['deriveKey'])
    .then(function (km) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: tuz, iterations: KASA_DEVIR, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
}
function kSarmala(anahtar, ham) {
  var iv = kRast(12);
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, anahtar, ham)
    .then(function (sifreli) { return { iv: kB64(iv), veri: kB64(sifreli) }; });
}
function kCoz(anahtar, ivB64, veriB64) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: kBayt(ivB64) }, anahtar, kBayt(veriB64));
}
function kDekAnahtar(dekBayt) {
  return crypto.subtle.importKey('raw', dekBayt, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
function kKodUret() {
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   /* karışan harfler yok (I,O,0,1) */
  var h = kRast(25), s = '';
  for (var i = 0; i < 25; i++) { s += A.charAt(h[i] % A.length); }
  return s.slice(0, 5) + '-' + s.slice(5, 10) + '-' + s.slice(10, 15) + '-' + s.slice(15, 20) + '-' + s.slice(20, 25);
}
function kSifreUret(uzunluk, tur) {
  var kucuk = 'abcdefghijkmnopqrstuvwxyz', buyuk = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  var rakam = '23456789', isaret = '!@#$%&*+-=?_.:;';
  var havuz = kucuk + buyuk + rakam + (tur === 'kolay' ? '' : isaret);
  var h = kRast(uzunluk || 20), s = '';
  for (var i = 0; i < (uzunluk || 20); i++) { s += havuz.charAt(h[i] % havuz.length); }
  return s;
}

/* ------------------------------ IndexedDB ------------------------------ */
function kIdb() {
  return new Promise(function (res, rej) {
    var r;
    try { r = indexedDB.open(KASA_DB_AD, 1); }
    catch (e) { rej(e); return; }
    r.onupgradeneeded = function (e) {
      var d = e.target.result;
      if (!d.objectStoreNames.contains('kasa')) { d.createObjectStore('kasa', { keyPath: 'id' }); }
      if (!d.objectStoreNames.contains('icerik')) { d.createObjectStore('icerik', { keyPath: 'id' }); }
      if (!d.objectStoreNames.contains('dosya')) { d.createObjectStore('dosya', { keyPath: 'id' }); }
    };
    r.onsuccess = function (e) { res(e.target.result); };
    r.onerror = function (e) { rej((e.target && e.target.error) || new Error('depo açılamadı')); };
    setTimeout(function () { rej(new Error('depo zaman aşımı')); }, 12000);
  });
}
function kDb() { if (KDB) { return Promise.resolve(KDB); } return kIdb().then(function (d) { KDB = d; return d; }); }
function kDepo(depo, mod) {
  return kDb().then(function (d) { return d.transaction(depo, mod).objectStore(depo); });
}
function kIstek(istek) {
  return new Promise(function (res, rej) {
    istek.onsuccess = function (e) { res(e.target.result); };
    istek.onerror = function (e) { rej((e.target && e.target.error) || new Error('depo hatası')); };
  });
}
function kGet(depo, id) { return kDepo(depo, 'readonly').then(function (s) { return kIstek(s.get(id)); }); }
function kPut(depo, kayit) { return kDepo(depo, 'readwrite').then(function (s) { return kIstek(s.put(kayit)); }); }
function kSil(depo, id) { return kDepo(depo, 'readwrite').then(function (s) { return kIstek(s.delete(id)); }); }
function kHepsi(depo) { return kDepo(depo, 'readonly').then(function (s) { return kIstek(s.getAll()); }); }

/* ============================== KAPI (kapı) ============================== */
function kapiDurum(id) { return !!(KAPILAR[id] && KAPILAR[id].acik); }
function kapiZaman(id) {
  var k = KAPILAR[id];
  if (!k || !k.acik) { return; }
  if (k.zaman) { clearTimeout(k.zaman); }
  k.zaman = setTimeout(function () {
    kLog('OTOMATIK-KILIT:' + id);
    kapiKapat(id);
    kasaYaz3(id, 'kasa 5 dakika işlem olmadığı için kendini kilitledi');
  }, KASA_BEKLEME);
}
function kapiDokun(id) { if (kapiDurum(id)) { kapiZaman(id); } }

function kapiVarMi(id) { return kGet('kasa', id).then(function (k) { return !!k; }); }

function kapiOlustur(id, ad, sifre, kodIste, ipucu) {
  var dek = kRast(32), tuz = kRast(16), uretilenKod = null;
  var kayit = { id: id, ad: ad, tuz: kB64(tuz), sarmal: null, kod: null, ipucu: ipucu || '', kur: Date.now(), surum: 1 };
  return kKekYap(sifre, tuz).then(function (kek) {
    return kSarmala(kek, dek).then(function (s) {
      kayit.sarmal = s;
      if (!kodIste) { return null; }
      uretilenKod = kKodUret();
      var ktuz = kRast(16);
      return kKekYap(uretilenKod, ktuz).then(function (kek2) {
        return kSarmala(kek2, dek).then(function (s2) {
          kayit.kod = { tuz: kB64(ktuz), iv: s2.iv, veri: s2.veri };
        });
      });
    }).then(function () {
      return kPut('kasa', kayit).then(function () {
        return kDekAnahtar(dek).then(function (a) {
          KAPILAR[id] = { acik: true, anahtar: a, dek: dek, zaman: null, veri: (id === 'belge' ? [] : {}), degisti: false };
          kLog('OLUSTUR:' + id);
          kapiZaman(id);
          return { kod: uretilenKod };
        });
      });
    });
  });
}

function kapiAc(id, sifre) {
  return kGet('kasa', id).then(function (k) {
    if (!k || !k.sarmal) { throw new Error('kasa bulunamadı'); }
    return kKekYap(sifre, kBayt(k.tuz)).then(function (kek) {
      return kCoz(kek, k.sarmal.iv, k.sarmal.veri).then(function (dek) {
        var bayt = new Uint8Array(dek);
        return kDekAnahtar(bayt).then(function (a) {
          KAPILAR[id] = { acik: true, anahtar: a, dek: bayt, zaman: null, veri: (id === 'belge' ? [] : {}), degisti: false };
          kapiZaman(id);
          return true;
        });
      });
    });
  });
}

/* kurtarma kodu ile açma */
function kapiKodlaAc(id, kod) {
  return kGet('kasa', id).then(function (k) {
    if (!k || !k.kod) { throw new Error('bu kasada kurtarma kodu yok'); }
    var temiz = String(kod || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var gruplu = temiz.length === 25 ? temiz.slice(0, 5) + '-' + temiz.slice(5, 10) + '-' + temiz.slice(10, 15) + '-' + temiz.slice(15, 20) + '-' + temiz.slice(20, 25) : String(kod || '').toUpperCase();
    return kKekYap(gruplu, kBayt(k.kod.tuz)).then(function (kek2) {
      return kCoz(kek2, k.kod.iv, k.kod.veri).then(function (dek) {
        var bayt = new Uint8Array(dek);
        return kDekAnahtar(bayt).then(function (a) {
          KAPILAR[id] = { acik: true, anahtar: a, dek: bayt, zaman: null, veri: (id === 'belge' ? [] : {}), degisti: false };
          kapiZaman(id);
          return true;
        });
      });
    });
  });
}

function kapiKapat(id) {
  kLog('KAPAT-CAGRISI:' + id + ' (cagri yigini: ' + (new Error().stack || '').split('\n').slice(1, 4).join(' | ') + ')');
  var k = KAPILAR[id];
  if (k && k.zaman) { clearTimeout(k.zaman); }
  KAPILAR[id] = null;
  delete KAPILAR[id];
  kasaKilitTemizle(id);
}

/* kilitlenince hangi kasanın ekranı temizlenecek */
function kasaKilitTemizle(id) {
  if (id === 'belge') { belgeKapat(id); }
  else if (id === 'egitim') { ekKapat(); }
}

/* şifre değiştir — sadece DEK yeniden sarılır (içerik yeniden şifrelenmez) */
function kapiSifreDegistir(id, yeniSifre) {
  var k = KAPILAR[id];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa açık değil')); }
  return kGet('kasa', id).then(function (kayit) {
    var tuz = kRast(16);
    return kKekYap(yeniSifre, tuz).then(function (kek) {
      return kSarmala(kek, k.dek).then(function (s) {
        kayit.tuz = kB64(tuz); kayit.sarmal = s;
        return kPut('kasa', kayit);
      });
    });
  });
}

/* ------------------- şifreli içerik kaydı -------------------
   DİKKAT: kIcerikYaz(kasaId, veri) kayıt kimliğini kasa kimliğiyle AYNI kabul eder.
   Aynı kasanın altında İKİNCİ bir kayıt (ör. çalışma ilerlemesi) gerektiğinde
   aşağıdaki _Kayit sürümlerini kullan — yoksa "kasa kilitli" hatası alırsın. */
function kIcerikYazKayit(kasaId, kayitId, veri) {
  var k = KAPILAR[kasaId];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa kilitli')); }
  var ham = new TextEncoder().encode(JSON.stringify(veri));
  var iv = kRast(12);
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k.anahtar, ham).then(function (sifreli) {
    return kPut('icerik', { id: kayitId, kasa: kasaId, iv: kB64(iv), veri: kB64(sifreli), guncelleme: Date.now() });
  });
}
function kIcerikOkuKayit(kasaId, kayitId, varsayilan) {
  var k = KAPILAR[kasaId];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa kilitli')); }
  return kGet('icerik', kayitId).then(function (r) {
    if (!r) { return varsayilan; }
    return kCoz(k.anahtar, r.iv, r.veri).then(function (ham) {
      try { return JSON.parse(new TextDecoder().decode(ham)); } catch (e) { return varsayilan; }
    });
  });
}

function kIcerikYaz(id, veri) {
  var k = KAPILAR[id];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa kilitli')); }
  var ham = new TextEncoder().encode(JSON.stringify(veri));
  var iv = kRast(12);
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k.anahtar, ham).then(function (sifreli) {
    return kPut('icerik', { id: id, iv: kB64(iv), veri: kB64(sifreli), guncelleme: Date.now() });
  });
}
function kIcerikOku(id, varsayilan) {
  var k = KAPILAR[id];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa kilitli')); }
  return kGet('icerik', id).then(function (r) {
    if (!r) { return varsayilan; }
    return kCoz(k.anahtar, r.iv, r.veri).then(function (ham) {
      try { return JSON.parse(new TextDecoder().decode(ham)); } catch (e) { return varsayilan; }
    });
  });
}

/* ------------------------- şifreli dosya gövdesi -------------------------
   kasaId = hangi kasanın anahtarı kullanılacak, dosyaId = dosyanın depo anahtarı.
   (Bu ikisi bir kez karıştırıldı: tüm dosyalar tek anahtara yazıldı.) */
function kDosyaYaz(kasaId, dosyaId, hamBayt) {
  var k = KAPILAR[kasaId];
  if (!k || !k.acik) { return Promise.reject(new Error('kasa kilitli')); }
  var iv = kRast(12);
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k.anahtar, hamBayt).then(function (sifreli) {
    return kPut('dosya', {
      id: dosyaId, kasa: kasaId, iv: kB64(iv),
      veri: new Blob([sifreli], { type: 'application/octet-stream' }), boyut: sifreli.byteLength
    });
  });
}
function kDosyaOku(id, anahtar, ivB64) {
  return kGet('dosya', id).then(function (r) {
    if (!r) { throw new Error('dosya bulunamadı'); }
    return r.veri.arrayBuffer().then(function (ham) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: kBayt(ivB64 || r.iv) }, anahtar, ham);
    });
  });
}

/* ============================== BELGE KASASI ============================== */
var BK_TEMEL = [
  { id: 'RESIMLER', ad: 'RESİMLER', simge: '&#128247;' },
  { id: 'VIDEOLAR', ad: 'VİDEOLAR', simge: '&#127909;' },
  { id: 'BELGELER', ad: 'BELGELER', simge: '&#128196;' },
  { id: 'MUZIK', ad: 'MÜZİK', simge: '&#127925;' },
  { id: 'DIGER', ad: 'DİĞER', simge: '&#128230;' }
];
var BK = {
  id: 'belge', ad: 'BELGE KASASI',
  dosyalar: [], ekKlasorler: [], klasor: 'TUMU', ara: '', goruntuleyen: null,
  klasorler: BK_TEMEL.slice()
};
var BK_UZANTI = {
  RESIMLER: 'jpg jpeg png gif webp bmp svg avif ico tif tiff heic jfif',
  VIDEOLAR: 'mp4 mkv avi mov webm m4v flv wmv mpg mpeg mpeg4 3gp ts ogv',
  BELGELER: 'pdf doc docx xls xlsx ppt pptx txt md csv json xml rtf odt ods odp html htm epub mobi',
  MUZIK: 'mp3 wav ogg oga m4a aac flac wma opus mid midi'
};
var BK_METIN = 'txt md csv json xml log ini cfg yml yaml html htm js css py sh bat ps1 sql';

function bkKlasorBul(ad) {
  var e = String(ad || '').toLowerCase().split('.').pop();
  for (var g in BK_UZANTI) {
    if (Object.prototype.hasOwnProperty.call(BK_UZANTI, g) && BK_UZANTI[g].indexOf(e) >= 0) { return g; }
  }
  return 'DIGER';
}
function bkGorunum(ad) {
  var e = String(ad || '').toLowerCase().split('.').pop();
  if (BK_UZANTI.RESIMLER.indexOf(e) >= 0) { return 'resim'; }
  if (e === 'pdf') { return 'pdf'; }
  if (BK_UZANTI.VIDEOLAR.indexOf(e) >= 0) { return 'video'; }
  if (BK_UZANTI.MUZIK.indexOf(e) >= 0) { return 'ses'; }
  if (BK_METIN.indexOf(e) >= 0) { return 'metin'; }
  if (e === 'docx') { return 'docx'; }
  return 'yok';
}
function bkTur(ad, mime) {
  var g = bkKlasorBul(ad);
  if (g === 'RESIMLER') { return mime && mime.indexOf('image/') === 0 ? mime : 'image/*'; }
  if (g === 'VIDEOLAR') { return mime && mime.indexOf('video/') === 0 ? mime : 'video/*'; }
  if (g === 'MUZIK') { return mime && mime.indexOf('audio/') === 0 ? mime : 'audio/*'; }
  if (g === 'BELGELER') { return mime || 'application/octet-stream'; }
  return mime || 'application/octet-stream';
}
function bkSimge(ad) {
  var g = bkKlasorBul(ad);
  for (var i = 0; i < BK.klasorler.length; i++) { if (BK.klasorler[i].id === g) { return BK.klasorler[i].simge; } }
  return '&#128230;';
}

/* kasa meta verisi: dosya listesi + kendi açtığın klasörler (şifreli saklanır) */
function bkMetaYaz() {
  return kIcerikYaz(BK.id, { dosyalar: BK.dosyalar, ekKlasorler: BK.ekKlasorler || [] });
}
function bkMetaOku() {
  return kIcerikOku(BK.id, { dosyalar: [], ekKlasorler: [] }).then(function (m) {
    if (Array.isArray(m)) { m = { dosyalar: m, ekKlasorler: [] }; }   /* eski biçim */
    BK.dosyalar = m.dosyalar || [];
    BK.ekKlasorler = m.ekKlasorler || [];
    BK.klasorler = BK_TEMEL.slice().concat(BK.ekKlasorler);
    return m;
  });
}

function bkYaz(s) { var e = document.getElementById('bkDurum'); if (e) { e.textContent = s; } }
function bkSayac() {
  var t = 0;
  for (var i = 0; i < BK.dosyalar.length; i++) { t += (BK.dosyalar[i].boyut || 0); }
  return t;
}

function belgeHTML() {
  var k = '';
  for (var i = 0; i < BK.klasorler.length; i++) {
    k += '<span class="bkKlasor" data-bk-klasor="' + BK.klasorler[i].id + '">'
      + BK.klasorler[i].simge + ' ' + BK.klasorler[i].ad + ' <b data-bk-sayi="' + BK.klasorler[i].id + '">0</b></span>';
  }
  return ''
  + '<div class="bkKutu" id="bkKutu">'
  +   '<div class="bkBas">'
  +     '<span class="bkAd">&#128274; BELGE KASASI</span>'
  +     '<span class="bkRozet" id="bkRozet">KİLİTLİ</span>'
  +   '</div>'

  +   '<div id="bkGiris" class="bkGiris">'
  +     '<input class="iptvInput" id="bkSifre" type="password" autocomplete="new-password" placeholder="kasa şifresi">'
  +     '<input class="iptvInput" id="bkSifre2" type="password" autocomplete="new-password" placeholder="şifre (tekrar)" style="display:none">'
  +     '<label class="bkOnay" id="bkKodOnayKutu"><input type="checkbox" id="bkKodOnay"> kurtarma kodu oluştur</label>'
  +     '<button class="buton" id="bkAcBtn" type="button">&#128275; AÇ</button>'
  +     '<span class="bkNot" id="bkNot"></span>'
  +   '</div>'

  +   '<div id="bkKodGiris" class="bkGiris" style="display:none">'
  +     '<span class="bkNot">kurtarma kodunu yaz (5 grup, 25 karakter):</span>'
  +     '<input class="iptvInput" id="bkKod" type="text" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX">'
  +     '<button class="buton" id="bkKodBtn" type="button">&#128273; KODLA AÇ</button>'
  +     '<button class="buton ikincil" id="bkGeriBtn" type="button">GERİ</button>'
  +     '<span class="bkNot" id="bkKodNot"></span>'
  +   '</div>'

  +   '<div id="bkIci" style="display:none">'
  +     '<div class="bkArac">'
  +       '<button class="buton" id="bkEkleBtn" type="button">&#43; DOSYA EKLE</button>'
  +       '<button class="buton ikincil" id="bkYeniBtn" type="button">&#128193; YENİ KLASÖR</button>'
  +       '<input class="iptvInput kucuk" id="bkAra" type="text" placeholder="ara">'
  +       '<button class="buton ikincil" id="bkKilitBtn" type="button">&#128274; KİLİTLE</button>'
  +       '<span class="bkDurum" id="bkDurum"></span>'
  +     '</div>'
  +     '<input type="file" id="bkGiris2" multiple style="display:none">'
  +     '<div class="bkKlasorSar" id="bkKlasorler">' + k + '</div>'
  +     '<div class="bkHedef" id="bkHedef">seçili klasör: <b>TÜMÜ</b> — dosyalar türüne göre kendi klasörüne gider</div>'
  +     '<div class="bkIzgara" id="bkIzgara"></div>'
  +     '<div class="bkAlt2"><span class="soluk" id="bkOzet"></span>'
  +     '<button class="iptvMini" id="bkIpucuBtn" type="button">&#128161; ipucu / şifre değiştir</button></div>'
  +     '<div class="bkIpucuKutu" id="bkIpucuKutu" style="display:none">'
  +       '<input class="iptvInput kucuk" id="bkIpucu" type="text" placeholder="şifre ipucu (şifrenin kendisini yazma!)">'
  +       '<input class="iptvInput kucuk" id="bkYeniSifre" type="password" placeholder="yeni şifre">'
  +       '<button class="buton" id="bkIpucuKaydet" type="button">KAYDET</button>'
  +       '<span class="bkNot" id="bkIpucuNot"></span>'
  +     '</div>'
  +   '</div>'

  +   '</div>'
  + '</div>'

  + '<div class="bkBak" id="bkBak" style="display:none">'
  +   '<div class="bkBakIc">'
  +     '<div class="bkBakBas"><span id="bkBakAd">—</span>'
  +       '<span class="soluk" id="bkBakBilgi"></span>'
  +       '<button class="iptvMini" id="bkBakIndir" type="button">&#11015; İNDİR</button>'
  +       '<button class="iptvMini" id="bkBakKapat" type="button">&times; KAPAT</button></div>'
  +     '<div class="bkBakGovde" id="bkBakGovde"></div>'
  +   '</div>'
  + '</div>';
}

/* --------------------------- belge: çizim --------------------------- */
function bkKlasorSay() {
  var s = { TUMU: BK.dosyalar.length };
  for (var i = 0; i < BK.klasorler.length; i++) { s[BK.klasorler[i].id] = 0; }
  for (var j = 0; j < BK.dosyalar.length; j++) {
    var g = BK.dosyalar[j].klasor || 'DIGER';
    s[g] = (s[g] || 0) + 1;
  }
  return s;
}
function bkKlasorCiz() {
  var sar = document.getElementById('bkKlasorler');
  if (!sar) { return; }
  var s = bkKlasorSay();
  var h = '<span class="bkKlasor' + (BK.klasor === 'TUMU' ? ' sec' : '') + '" data-bk-klasor="TUMU">'
    + '&#128451; TÜMÜ <b>' + s.TUMU + '</b></span>';
  for (var i = 0; i < BK.klasorler.length; i++) {
    var k = BK.klasorler[i];
    h += '<span class="bkKlasor' + (BK.klasor === k.id ? ' sec' : '') + '" data-bk-klasor="' + k.id + '">'
      + k.simge + ' ' + k.ad + ' <b>' + (s[k.id] || 0) + '</b></span>';
  }
  sar.innerHTML = h;
  var hd = document.getElementById('bkHedef');
  if (hd) {
    var ad = 'TÜMÜ';
    for (var m = 0; m < BK.klasorler.length; m++) { if (BK.klasorler[m].id === BK.klasor) { ad = BK.klasorler[m].ad; } }
    hd.innerHTML = BK.klasor === 'TUMU'
      ? 'seçili klasör: <b>TÜMÜ</b> — eklediğin dosyalar türüne göre kendi klasörüne gider (resim→RESİMLER, video→VİDEOLAR…)'
      : 'seçili klasör: <b>' + kEsc(ad) + '</b> — “+ DOSYA EKLE” ile buraya atarsın (sürükle-bırak da olur)';
  }
}
function bkDosyaCiz() {
  var iz = document.getElementById('bkIzgara');
  if (!iz) { return; }
  var ara = (BK.ara || '').toLowerCase(), n = 0, h = '';
  for (var i = 0; i < BK.dosyalar.length; i++) {
    var d = BK.dosyalar[i];
    if (BK.klasor !== 'TUMU' && (d.klasor || 'DIGER') !== BK.klasor) { continue; }
    if (ara && String(d.ad || '').toLowerCase().indexOf(ara) < 0) { continue; }
    n++;
    h += '<div class="bkKart" data-bk-id="' + kEsc(d.id) + '">'
      +   '<div class="bkKartSimge">' + bkSimge(d.ad) + '</div>'
      +   '<div class="bkKartAd" title="' + kEsc(d.ad) + '">' + kEsc(d.ad) + '</div>'
      +   '<div class="bkKartAlt"><span>' + kBoyut(d.boyut) + '</span><span>' + kTarih(d.eklenme) + '</span></div>'
      +   '<div class="bkKartIslem">'
      +     '<button class="iptvIkon" data-bk-bak="' + kEsc(d.id) + '" title="Aç">&#128269;</button>'
      +     '<button class="iptvIkon" data-bk-indir="' + kEsc(d.id) + '" title="İndir">&#11015;</button>'
      +     '<button class="iptvIkon sil" data-bk-sil="' + kEsc(d.id) + '" title="Sil">&times;</button>'
      +   '</div></div>';
  }
  iz.innerHTML = h || '<div class="soluk bkBosluk">' + (BK.dosyalar.length ? 'bu görünümde dosya yok' : 'kasa boş — “+ DOSYA EKLE” ile başla') + '</div>';
  var oz = document.getElementById('bkOzet');
  if (oz) {
    oz.textContent = BK.dosyalar.length + ' dosya · ' + kBoyut(bkSayac())
      + (BK.klasor !== 'TUMU' ? ' · görünen: ' + n : '');
  }
  bkKlasorCiz();
}
function bkCiz() {
  var g = document.getElementById('bkGiris'), i = document.getElementById('bkIci'), r = document.getElementById('bkRozet');
  if (!g || !i) { return; }
  if (kapiDurum(BK.id)) {
    g.style.display = 'none'; i.style.display = 'block';
    if (r) { r.textContent = 'AÇIK'; r.className = 'bkRozet acik'; }
    bkKlasorCiz(); bkDosyaCiz(); kapiDokun(BK.id);
  } else {
    g.style.display = 'flex'; i.style.display = 'none';
    if (r) { r.textContent = 'KİLİTLİ'; r.className = 'bkRozet'; }
    document.getElementById('bkKodGiris').style.display = 'none';
    kapiVarMi(BK.id).then(function (varMi) {
      var b = document.getElementById('bkAcBtn'), s2 = document.getElementById('bkSifre2');
      var ko = document.getElementById('bkKodOnayKutu'), nt = document.getElementById('bkNot');
      if (b) { b.innerHTML = varMi ? '&#128275; AÇ' : '&#128273; OLUŞTUR'; }
      if (s2) { s2.style.display = varMi ? 'none' : 'inline-block'; }
      if (ko) { ko.style.display = varMi ? 'none' : 'inline-flex'; }
      if (nt && varMi) { nt.innerHTML = 'şifreni mi unuttun? <a href="#" id="bkKodLink" style="color:var(--ana2)">kurtarma kodu ile aç</a>'; }
      else if (nt) { nt.textContent = 'ilk kullanım: güçlü bir şifre belirle'; }
      var bag = document.getElementById('bkKodLink');
      if (bag) {
        bag.onclick = function (e) {
          e.preventDefault();
          document.getElementById('bkGiris').style.display = 'none';
          document.getElementById('bkKodGiris').style.display = 'flex';
        };
      }
    });
  }
}

function belgeKapat(id) {
  if (id !== BK.id) { return; }
  BK.dosyalar = []; BK.klasor = 'TUMU'; BK.ara = ''; BK.goruntuleyen = null;
  BK.ekKlasorler = []; BK.klasorler = BK_TEMEL.slice();
  bkBakKapat();
  var iz = document.getElementById('bkIzgara'); if (iz) { iz.innerHTML = ''; }
  var kl = document.getElementById('bkKlasorler'); if (kl) { kl.innerHTML = ''; }
  var oz = document.getElementById('bkOzet'); if (oz) { oz.textContent = ''; }
}

/* --------------------------- belge: işlemler --------------------------- */
function bkYukle(varsayilanKlasor) {
  var g = document.getElementById('bkGiris2');
  if (!g) { return; }
  g.value = '';
  g.click();
}
function bkDosyalariAl(liste) {
  var k = KAPILAR[BK.id];
  if (!k || !k.acik) { bkYaz('⚠ kasa kilitli'); return Promise.resolve(); }
  var isler = [], alinan = 0, atlanan = 0;
  for (var i = 0; i < liste.length; i++) {
    (function (f) {
      if (f.size > KASA_EN_BUYUK) { atlanan++; return; }
      var hedef = (BK.klasor === 'TUMU' || !BK.klasor) ? bkKlasorBul(f.name) : BK.klasor;
      var uid = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      isler.push(f.arrayBuffer().then(function (ham) {
        return kDosyaYaz(BK.id, uid, ham).then(function () {
          BK.dosyalar.push({
            id: uid, kasa: BK.id, klasor: hedef, ad: f.name,
            tur: bkTur(f.name, f.type), boyut: f.size, eklenme: Date.now()
          });
          alinan++;
        });
      }));
    })(liste[i]);
  }
  if (!isler.length) {
    bkYaz(atlanan ? '⚠ ' + atlanan + ' dosya 200 MB sınırını aştı, alınmadı' : '⚠ dosya seçilmedi');
    return Promise.resolve();
  }
  bkYaz('şifreleniyor… ' + isler.length + ' dosya');
  return Promise.all(isler).then(function () {
    return bkMetaYaz();
  }).then(function () {
    bkDosyaCiz();
    bkYaz('✔ ' + alinan + ' dosya şifrelendi ve kasaya kondu' + (atlanan ? ' · ' + atlanan + ' dosya çok büyüktü' : ''));
  }).catch(function (e) { bkYaz('✘ yüklenemedi: ' + (e && e.message ? e.message : e)); });
}

function bkSil(uid) {
  var i, yeni = [];
  for (i = 0; i < BK.dosyalar.length; i++) { if (BK.dosyalar[i].id !== uid) { yeni.push(BK.dosyalar[i]); } }
  if (yeni.length === BK.dosyalar.length) { return; }
  BK.dosyalar = yeni;
  if (BK.goruntuleyen === uid) { bkBakKapat(); }
  kSil('dosya', uid).then(function () { return bkMetaYaz(); })
    .then(function () { bkDosyaCiz(); bkYaz('dosya silindi'); });
}

function bkBul(uid) {
  for (var i = 0; i < BK.dosyalar.length; i++) { if (BK.dosyalar[i].id === uid) { return BK.dosyalar[i]; } }
  return null;
}

function bkBak(uid) {
  var d = bkBul(uid);
  var k = KAPILAR[BK.id];
  if (!d || !k || !k.acik) { return; }
  var bak = document.getElementById('bkBak');
  var gov = document.getElementById('bkBakGovde');
  if (!bak || !gov) { return; }
  bkYaz('dosya açılıyor…');
  kDosyaOku(uid, k.anahtar).then(function (ham) {
    var blob = new Blob([ham], { type: d.tur || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var gor = bkGorunum(d.ad);
    bkUrlBirak();
    BK.goruntuleyen = uid;
    BK.goruntuleyenUrl = url;
    document.getElementById('bkBakAd').textContent = d.ad;
    document.getElementById('bkBakBilgi').textContent = kBoyut(d.boyut) + ' · ' + kTarih(d.eklenme) + ' · ' + (d.klasor || '');
    var g = '';
    if (gor === 'resim') { g = '<img src="' + url + '" alt="">'; }
    else if (gor === 'pdf') { g = '<iframe src="' + url + '"></iframe>'; }
    else if (gor === 'video') { g = '<video src="' + url + '" controls playsinline autoplay></video>'; }
    else if (gor === 'ses') { g = '<audio src="' + url + '" controls autoplay></audio>'; }
    else if (gor === 'metin') {
      g = '<pre class="bkMetin">' + kEsc(new TextDecoder('utf-8').decode(ham)) + '</pre>';
    } else if (gor === 'docx') {
      g = '<div class="bkNot2" id="bkNot2">Word metni çıkarılıyor…</div>';
    } else {
      g = '<div class="bkNot2">bu biçim tarayıcıda açılamaz — <b>İNDİR</b> ile kaydet.</div>';
    }
    gov.innerHTML = g;
    bak.style.display = 'flex';
    bkYaz('açık: ' + d.ad);
    if (gor === 'docx') { bkDocxMetin(ham).then(function (m) {
      var yer = document.getElementById('bkNot2');
      if (yer) { yer.outerHTML = '<pre class="bkMetin">' + kEsc(m || '(metin bulunamadı)') + '</pre>'; }
    }); }
  }).catch(function (e) { bkYaz('✘ açılamadı: ' + (e && e.message ? e.message : e)); });
}
function bkUrlBirak() {
  if (BK.goruntuleyenUrl) { try { URL.revokeObjectURL(BK.goruntuleyenUrl); } catch (e) {} BK.goruntuleyenUrl = null; }
}
function bkBakKapat() {
  var bak = document.getElementById('bkBak');
  if (bak) { bak.style.display = 'none'; }
  var gov = document.getElementById('bkBakGovde');
  if (gov) { gov.innerHTML = ''; }
  bkUrlBirak();
  BK.goruntuleyen = null;
}
function bkIndir(uid) {
  var d = bkBul(uid), k = KAPILAR[BK.id];
  if (!d || !k || !k.acik) { return; }
  kDosyaOku(uid, k.anahtar).then(function (ham) {
    var url = URL.createObjectURL(new Blob([ham], { type: d.tur || 'application/octet-stream' }));
    var a = document.createElement('a');
    a.href = url; a.download = d.ad || 'dosya';
    document.body.appendChild(a); a.click();
    setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 4000);
    bkYaz('indiriliyor: ' + d.ad);
  }).catch(function () { bkYaz('✘ indirilemedi'); });
}

/* Word (.docx) metnini çıkar — zip açıp word/document.xml okur */
function bkDocxMetin(buf) {
  return new Promise(function (res) {
    try {
      var u = new Uint8Array(buf), i = 0, n = u.length;
      while (i < n - 30) {
        if (u[i] === 0x50 && u[i + 1] === 0x4B && u[i + 2] === 0x03 && u[i + 3] === 0x04) {
          var yontem = u[i + 8] | (u[i + 9] << 8);
          var boy = u[i + 18] | (u[i + 19] << 8) | (u[i + 20] << 16) | (u[i + 21] << 24);
          var adUz = u[i + 26] | (u[i + 27] << 8);
          var ekUz = u[i + 28] | (u[i + 29] << 8);
          var ad = '';
          for (var j = 0; j < adUz; j++) { ad += String.fromCharCode(u[i + 30 + j]); }
          var bas = i + 30 + adUz + ekUz;
          if (ad === 'word/document.xml' && boy > 0) {
            var veri = u.slice(bas, bas + boy);
            var akis = (yontem === 8)
              ? new Blob([veri]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
              : new Blob([veri]).stream();
            return new Response(akis).text().then(function (xml) {
              var m = xml.replace(/<w:p[ >]/g, '\n<w:p ')
                .replace(/<w:tab\/>/g, '\t')
                .replace(/<w:br\/>/g, '\n');
              var parcalar = m.split('\n').map(function (p) {
                var t = p.replace(/<[^>]+>/g, '');
                return t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
              });
              res(parcalar.join('\n').replace(/\n{3,}/g, '\n\n').trim());
            });
          }
          i = bas + boy;
        } else { i++; }
      }
      res('');
    } catch (e) { res(''); }
  });
}

/* ============================== ŞİFRE KASASI ============================== */
var SK = { id: 'sifre', ad: 'ŞİFRE KASASI', kayitlar: [], ara: '', duzenle: -1, goster: {} };

function sifreHTML() {
  return ''
  + '<div class="bkKutu" id="skKutu">'
  +   '<div class="bkBas">'
  +     '<span class="bkAd">&#128273; ŞİFRE KASASI</span>'
  +     '<span class="bkRozet" id="skRozet">KİLİTLİ</span>'
  +   '</div>'
  +   '<div id="skGiris" class="bkGiris">'
  +     '<input class="iptvInput" id="skSifre" type="password" autocomplete="new-password" placeholder="kasa şifresi">'
  +     '<input class="iptvInput" id="skSifre2" type="password" autocomplete="new-password" placeholder="şifre (tekrar)" style="display:none">'
  +     '<label class="bkOnay" id="skKodOnayKutu"><input type="checkbox" id="skKodOnay"> kurtarma kodu oluştur</label>'
  +     '<button class="buton" id="skAcBtn" type="button">&#128275; AÇ</button>'
  +     '<span class="bkNot" id="skNot"></span>'
  +   '</div>'
  +   '<div id="skKodGiris" class="bkGiris" style="display:none">'
  +     '<span class="bkNot">kurtarma kodunu yaz:</span>'
  +     '<input class="iptvInput" id="skKod" type="text" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX">'
  +     '<button class="buton" id="skKodBtn" type="button">&#128273; KODLA AÇ</button>'
  +     '<button class="buton ikincil" id="skGeriBtn" type="button">GERİ</button>'
  +     '<span class="bkNot" id="skKodNot"></span>'
  +   '</div>'
  +   '<div id="skIci" style="display:none">'
  +     '<div class="bkArac">'
  +       '<button class="buton" id="skEkleBtn" type="button">&#43; HESAP EKLE</button>'
  +       '<input class="iptvInput kucuk" id="skAra" type="text" placeholder="ara">'
  +       '<button class="buton ikincil" id="skKilitBtn" type="button">&#128274; KİLİTLE</button>'
  +       '<span class="bkDurum" id="skDurum"></span>'
  +     '</div>'
  +     '<div class="bkForm" id="skForm" style="display:none">'
  +       '<input class="iptvInput" id="skSite" type="text" placeholder="site / uygulama (ör. Instagram)">'
  +       '<input class="iptvInput kucuk" id="skKullanici" type="text" spellcheck="false" placeholder="kullanıcı adı / e-posta">'
  +       '<input class="iptvInput kucuk" id="skParola" type="text" spellcheck="false" placeholder="şifre">'
  +       '<button class="buton ikincil" id="skUretBtn" type="button">&#127922; ÜRET</button>'
  +       '<input class="iptvInput" id="skNot2" type="text" placeholder="not (opsiyonel)">'
  +       '<button class="buton" id="skKaydetBtn" type="button">KAYDET</button>'
  +       '<button class="buton ikincil" id="skIptalBtn" type="button">İPTAL</button>'
  +     '</div>'
  +     '<div class="bkTabloSar"><table class="iptvTablo"><thead><tr>'
  +       '<th>#</th><th>SİTE</th><th>KULLANICI</th><th>ŞİFRE</th><th>İŞLEM</th>'
  +     '</tr></thead><tbody id="skGovde"></tbody></table></div>'
  +     '<div class="bkAlt2"><span class="soluk" id="skOzet"></span></div>'
  +   '</div>'
  + '</div>';
}

function skYaz(s) { var e = document.getElementById('skDurum'); if (e) { e.textContent = s; } }

function skCiz() {
  var g = document.getElementById('skGiris'), i = document.getElementById('skIci'), r = document.getElementById('skRozet');
  if (!g || !i) { return; }
  if (kapiDurum(SK.id)) {
    g.style.display = 'none'; i.style.display = 'block';
    if (r) { r.textContent = 'AÇIK'; r.className = 'bkRozet acik'; }
    skTabloCiz(); kapiDokun(SK.id);
  } else {
    g.style.display = 'flex'; i.style.display = 'none';
    if (r) { r.textContent = 'KİLİTLİ'; r.className = 'bkRozet'; }
    document.getElementById('skKodGiris').style.display = 'none';
    kapiVarMi(SK.id).then(function (varMi) {
      var b = document.getElementById('skAcBtn'), s2 = document.getElementById('skSifre2');
      var ko = document.getElementById('skKodOnayKutu'), nt = document.getElementById('skNot');
      if (b) { b.innerHTML = varMi ? '&#128275; AÇ' : '&#128273; OLUŞTUR'; }
      if (s2) { s2.style.display = varMi ? 'none' : 'inline-block'; }
      if (ko) { ko.style.display = varMi ? 'none' : 'inline-flex'; }
      if (nt && varMi) { nt.innerHTML = 'şifreni mi unuttun? <a href="#" id="skKodLink" style="color:var(--ana2)">kurtarma kodu ile aç</a>'; }
      else if (nt) { nt.textContent = 'ilk kullanım: güçlü bir şifre belirle'; }
      var bag = document.getElementById('skKodLink');
      if (bag) {
        bag.onclick = function (e) {
          e.preventDefault();
          document.getElementById('skGiris').style.display = 'none';
          document.getElementById('skKodGiris').style.display = 'flex';
        };
      }
    });
  }
}

function skTabloCiz() {
  var g = document.getElementById('skGovde');
  if (!g) { return; }
  var ara = (SK.ara || '').toLowerCase(), n = 0, h = '';
  for (var i = 0; i < SK.kayitlar.length; i++) {
    var k = SK.kayitlar[i];
    if (ara && ((k.site || '') + ' ' + (k.kullanici || '') + ' ' + (k.not || '')).toLowerCase().indexOf(ara) < 0) { continue; }
    n++;
    var acik = !!SK.goster[k.id];
    h += '<tr><td class="iptvSira">' + n + '</td>'
      + '<td class="iptvCAd">' + kEsc(k.site || '-') + (k.not ? ' <span class="soluk">(' + kEsc(k.not) + ')</span>' : '') + '</td>'
      + '<td class="iptvCGrup">' + kEsc(k.kullanici || '-') + '</td>'
      + '<td class="iptvCGrup"><span class="skParola">' + (acik ? kEsc(k.parola) : '••••••••') + '</span></td>'
      + '<td class="iptvCIslem">'
      +   '<button class="iptvIkon" data-sk-goz="' + k.id + '" title="Göster/gizle">' + (acik ? '&#128584;' : '&#128065;') + '</button>'
      +   '<button class="iptvIkon" data-sk-kopya="' + k.id + '" title="Şifreyi kopyala">&#128203;</button>'
      +   '<button class="iptvIkon" data-sk-kul="' + k.id + '" title="Kullanıcı adını kopyala">&#128100;</button>'
      +   '<button class="iptvIkon sil" data-sk-sil="' + k.id + '" title="Sil">&times;</button>'
      + '</td></tr>';
  }
  g.innerHTML = h || '<tr><td colspan="5" class="soluk" style="padding:14px;text-align:center">kayıt yok — “+ HESAP EKLE” ile başla</td></tr>';
  var oz = document.getElementById('skOzet');
  if (oz) { oz.textContent = SK.kayitlar.length + ' hesap' + (ara ? ' · görünen: ' + n : ''); }
}

function skYukle() { return kIcerikOku(SK.id, []).then(function (l) { SK.kayitlar = l || []; skTabloCiz(); }); }

function skKaydet() {
  var s = document.getElementById('skSite'), ku = document.getElementById('skKullanici');
  var p = document.getElementById('skParola'), n = document.getElementById('skNot2');
  var site = s ? s.value.trim() : '', kul = ku ? ku.value.trim() : '';
  var par = p ? p.value : '', not = n ? n.value.trim() : '';
  if (!site) { skYaz('⚠ site adı boş'); return; }
  if (!par) { skYaz('⚠ şifre boş'); return; }
  if (SK.duzenle >= 0) {
    for (var i = 0; i < SK.kayitlar.length; i++) {
      if (SK.kayitlar[i].id === SK.duzenle) {
        SK.kayitlar[i].site = site; SK.kayitlar[i].kullanici = kul;
        SK.kayitlar[i].parola = par; SK.kayitlar[i].not = not;
      }
    }
  } else {
    SK.kayitlar.push({ id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), site: site, kullanici: kul, parola: par, not: not, eklenme: Date.now() });
  }
  SK.duzenle = -1;
  if (s) { s.value = ''; } if (ku) { ku.value = ''; } if (p) { p.value = ''; } if (n) { n.value = ''; }
  kIcerikYaz(SK.id, SK.kayitlar).then(function () {
    skTabloCiz();
    var f = document.getElementById('skForm'); if (f) { f.style.display = 'none'; }
    skYaz('✔ kaydedildi ve şifrelendi');
  }).catch(function (e) { skYaz('✘ kaydedilemedi: ' + e); });
}

function skKopya(id, ne) {
  var k = null;
  for (var i = 0; i < SK.kayitlar.length; i++) { if (SK.kayitlar[i].id === id) { k = SK.kayitlar[i]; } }
  if (!k) { return; }
  var metin = (ne === 'kul') ? (k.kullanici || '') : (k.parola || '');
  if (!metin) { skYaz('bu alan boş'); return; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(metin).then(function () { skYaz(ne === 'kul' ? 'kullanıcı adı kopyalandı' : 'şifre kopyalandı (30 sn sonra panodan silmeye çalış)'); },
        function () { skYaz('kopyalanamadı'); });
    } else { skYaz('tarayıcı pano izni vermedi'); }
  } catch (e) { skYaz('kopyalanamadı'); }
}

/* ============================== kurulum ============================== */
function kasaYaz3(id, s) {
  if (id === BK.id) { bkYaz(s); } else if (id === SK.id) { skYaz(s); }
}

function kasaKur3() {
  /* ---- BELGE KASASI ---- */
  var bAc = document.getElementById('bkAcBtn');
  if (bAc && !bAc.dataset.kuruldu) {
    bAc.dataset.kuruldu = '1';
    bAc.onclick = function () {
      var s1 = document.getElementById('bkSifre'), s2 = document.getElementById('bkSifre2');
      var a = s1 ? s1.value : '', b = s2 ? s2.value : '';
      var kod = document.getElementById('bkKodOnay') && document.getElementById('bkKodOnay').checked;
      kapiVarMi(BK.id).then(function (varMi) {
        if (!varMi) {
          if (a.length < 8) { bkYaz('⚠ şifre en az 8 karakter olsun'); return; }
          if (a !== b) { bkYaz('⚠ iki şifre aynı değil'); return; }
          bkYaz('kasa oluşturuluyor… (600.000 tur, birkaç saniye sürebilir)');
          kapiOlustur(BK.id, BK.ad, a, kod, '').then(function (sonuc) {
            if (s1) { s1.value = ''; } if (s2) { s2.value = ''; }
            return kIcerikYaz(BK.id, { dosyalar: [], ekKlasorler: [] }).then(function () {
              BK.dosyalar = []; BK.ekKlasorler = []; BK.klasorler = BK_TEMEL.slice();
              bkCiz();
              bkYaz('✔ kasa oluşturuldu');
              if (sonuc && sonuc.kod) { kKodGoster(sonuc.kod); }
            });
          }).catch(function (e) { bkYaz('✘ oluşturulamadı: ' + e); });
        } else {
          if (!a) { bkYaz('⚠ şifre gir'); return; }
          bkYaz('açılıyor… (600.000 tur)');
          kapiAc(BK.id, a).then(function () {
            if (s1) { s1.value = ''; }
            return bkMetaOku().then(function () { bkCiz(); bkYaz('kasa açıldı · ' + BK.dosyalar.length + ' dosya'); });
          }).catch(function () { if (s1) { s1.value = ''; } bkYaz('✘ şifre yanlış'); });
        }
      });
    };
    var bk1 = document.getElementById('bkSifre');
    if (bk1) { bk1.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); bAc.click(); } }; }
    var bKod = document.getElementById('bkKodBtn');
    if (bKod) {
      bKod.onclick = function () {
        var v = document.getElementById('bkKod');
        var kod = v ? v.value : '';
        document.getElementById('bkKodNot').textContent = 'kontrol ediliyor…';
        kapiKodlaAc(BK.id, kod).then(function () {
          if (v) { v.value = ''; }
          return bkMetaOku().then(function () { bkCiz(); bkYaz('✔ kurtarma koduyla açıldı'); });
        }).catch(function () { document.getElementById('bkKodNot').textContent = '✘ kod yanlış'; });
      };
    }
    var bGeri = document.getElementById('bkGeriBtn');
    if (bGeri) { bGeri.onclick = function () { document.getElementById('bkKodGiris').style.display = 'none'; document.getElementById('bkGiris').style.display = 'flex'; }; }

    var bEkle = document.getElementById('bkEkleBtn');
    if (bEkle) { bEkle.onclick = function () { bkYukle(); kapiDokun(BK.id); }; }
    var bGir2 = document.getElementById('bkGiris2');
    if (bGir2) { bGir2.onchange = function () { bkDosyalariAl(bGir2.files || []); }; }
    var bAra = document.getElementById('bkAra');
    if (bAra) { bAra.oninput = function () { BK.ara = bAra.value || ''; bkDosyaCiz(); }; }
    var bKilit = document.getElementById('bkKilitBtn');
    if (bKilit) {
      bKilit.onclick = function () {
        kapiKapat(BK.id);
        bkCiz();
        bkYaz('kasa kilitlendi — dosyalar bellekten de silindi');
      };
    }
    var kl = document.getElementById('bkKlasorler');
    if (kl) {
      kl.onclick = function (e) {
        var t = e.target;
        while (t && t !== kl && !t.getAttribute('data-bk-klasor')) { t = t.parentNode; }
        if (t && t.getAttribute && t.getAttribute('data-bk-klasor')) {
          BK.klasor = t.getAttribute('data-bk-klasor');
          bkKlasorCiz(); bkDosyaCiz(); kapiDokun(BK.id);
        }
      };
    }
    var izg = document.getElementById('bkIzgara');
    if (izg) {
      izg.onclick = function (e) {
        var t = e.target;
        if (!t || !t.getAttribute) { return; }
        if (t.getAttribute('data-bk-bak')) { bkBak(t.getAttribute('data-bk-bak')); return; }
        if (t.getAttribute('data-bk-indir')) { bkIndir(t.getAttribute('data-bk-indir')); return; }
        if (t.getAttribute('data-bk-sil')) { bkSil(t.getAttribute('data-bk-sil')); return; }
      };
    }
    var bYeni = document.getElementById('bkYeniBtn');
    if (bYeni) {
      bYeni.onclick = function () {
        var ad = prompt('Yeni klasör adı:');
        if (!ad) { return; }
        var id = String(ad).toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, '');
        if (!id) { bkYaz('⚠ klasör adı geçersiz'); return; }
        var yeniK = { id: id, ad: String(ad).toUpperCase(), simge: '&#128193;' };
        BK.ekKlasorler.push(yeniK);
        BK.klasorler = BK_TEMEL.slice().concat(BK.ekKlasorler);
        BK.klasor = id;
        bkKlasorCiz(); bkDosyaCiz();
        bkMetaYaz().then(function () { bkYaz('✔ klasör eklendi ve şifrelendi: ' + ad); })
          .catch(function () { bkYaz('⚠ klasör açıldı ama kaydedilemedi'); });
      };
    }
    /* sürükle-bırak */
    var kutu = document.getElementById('bkKutu');
    if (kutu) {
      kutu.addEventListener('dragover', function (e) { if (kapiDurum(BK.id)) { e.preventDefault(); kutu.classList.add('bkUzerinde'); } });
      kutu.addEventListener('dragleave', function () { kutu.classList.remove('bkUzerinde'); });
      kutu.addEventListener('drop', function (e) {
        if (!kapiDurum(BK.id)) { return; }
        e.preventDefault();
        kutu.classList.remove('bkUzerinde');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { bkDosyalariAl(e.dataTransfer.files); }
      });
      kutu.addEventListener('click', function () { kapiDokun(BK.id); });
    }
    var bBakKapat = document.getElementById('bkBakKapat');
    if (bBakKapat) { bBakKapat.onclick = function () { bkBakKapat(); }; }
    var bBakIndir = document.getElementById('bkBakIndir');
    if (bBakIndir) { bBakIndir.onclick = function () { if (BK.goruntuleyen) { bkIndir(BK.goruntuleyen); } }; }
    var bakKat = document.getElementById('bkBak');
    if (bakKat) { bakKat.onclick = function (e) { if (e.target === bakKat) { bkBakKapat(); } }; }
    var bIpucu = document.getElementById('bkIpucuBtn');
    if (bIpucu) {
      bIpucu.onclick = function () {
        var kt = document.getElementById('bkIpucuKutu');
        kt.style.display = (kt.style.display === 'none' || !kt.style.display) ? 'flex' : 'none';
      };
    }
    var bIpK = document.getElementById('bkIpucuKaydet');
    if (bIpK) {
      bIpK.onclick = function () {
        var ip = document.getElementById('bkIpucu'), ys = document.getElementById('bkYeniSifre');
        var yeni = ys ? ys.value : '';
        kGet('kasa', BK.id).then(function (kayit) {
          if (!kayit) { return; }
          if (ip) { kayit.ipucu = ip.value; }
          var s = kPut('kasa', kayit);
          if (!yeni) { return s; }
          if (yeni.length < 8) { document.getElementById('bkIpucuNot').textContent = '⚠ yeni şifre en az 8 karakter'; return; }
          return s.then(function () { return kapiSifreDegistir(BK.id, yeni); });
        }).then(function () {
          if (ys) { ys.value = ''; }
          document.getElementById('bkIpucuNot').textContent = '✔ kaydedildi';
        });
      };
    }
  }

  /* ---- ŞİFRE KASASI ---- */
  var sAc = document.getElementById('skAcBtn');
  if (sAc && !sAc.dataset.kuruldu) {
    sAc.dataset.kuruldu = '1';
    sAc.onclick = function () {
      var s1 = document.getElementById('skSifre'), s2 = document.getElementById('skSifre2');
      var a = s1 ? s1.value : '', b = s2 ? s2.value : '';
      var kod = document.getElementById('skKodOnay') && document.getElementById('skKodOnay').checked;
      kapiVarMi(SK.id).then(function (varMi) {
        if (!varMi) {
          if (a.length < 8) { skYaz('⚠ şifre en az 8 karakter olsun'); return; }
          if (a !== b) { skYaz('⚠ iki şifre aynı değil'); return; }
          skYaz('kasa oluşturuluyor… (600.000 tur)');
          kapiOlustur(SK.id, SK.ad, a, kod, '').then(function (sonuc) {
            if (s1) { s1.value = ''; } if (s2) { s2.value = ''; }
            return kIcerikYaz(SK.id, []).then(function () {
              SK.kayitlar = []; skCiz(); skYaz('✔ kasa oluşturuldu');
              if (sonuc && sonuc.kod) { kKodGoster(sonuc.kod); }
            });
          }).catch(function (e) { skYaz('✘ oluşturulamadı: ' + e); });
        } else {
          if (!a) { skYaz('⚠ şifre gir'); return; }
          skYaz('açılıyor… (600.000 tur)');
          kapiAc(SK.id, a).then(function () {
            if (s1) { s1.value = ''; }
            return skYukle().then(function () { skCiz(); skYaz('kasa açıldı · ' + SK.kayitlar.length + ' hesap'); });
          }).catch(function () { if (s1) { s1.value = ''; } skYaz('✘ şifre yanlış'); });
        }
      });
    };
    var sk1 = document.getElementById('skSifre');
    if (sk1) { sk1.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); sAc.click(); } }; }
    var sKod = document.getElementById('skKodBtn');
    if (sKod) {
      sKod.onclick = function () {
        var v = document.getElementById('skKod');
        document.getElementById('skKodNot').textContent = 'kontrol ediliyor…';
        kapiKodlaAc(SK.id, v ? v.value : '').then(function () {
          if (v) { v.value = ''; }
          return skYukle().then(function () { skCiz(); skYaz('✔ kurtarma koduyla açıldı'); });
        }).catch(function () { document.getElementById('skKodNot').textContent = '✘ kod yanlış'; });
      };
    }
    var sGeri = document.getElementById('skGeriBtn');
    if (sGeri) { sGeri.onclick = function () { document.getElementById('skKodGiris').style.display = 'none'; document.getElementById('skGiris').style.display = 'flex'; }; }

    var sEkle = document.getElementById('skEkleBtn');
    if (sEkle) {
      sEkle.onclick = function () {
        var f = document.getElementById('skForm');
        f.style.display = (f.style.display === 'none' || !f.style.display) ? 'flex' : 'none';
        SK.duzenle = -1;
      };
    }
    var sUret = document.getElementById('skUretBtn');
    if (sUret) {
      sUret.onclick = function () {
        var p = document.getElementById('skParola');
        p.value = kSifreUret(20);
        skYaz('güçlü şifre üretildi — kaydetmeyi unutma');
      };
    }
    var sKay = document.getElementById('skKaydetBtn');
    if (sKay) { sKay.onclick = function () { skKaydet(); }; }
    var sIpt = document.getElementById('skIptalBtn');
    if (sIpt) { sIpt.onclick = function () { document.getElementById('skForm').style.display = 'none'; }; }
    var sKilit = document.getElementById('skKilitBtn');
    if (sKilit) { sKilit.onclick = function () { kapiKapat(SK.id); skCiz(); skYaz('kasa kilitlendi'); }; }
    var sAra = document.getElementById('skAra');
    if (sAra) { sAra.oninput = function () { SK.ara = sAra.value || ''; skTabloCiz(); }; }
    var sG = document.getElementById('skGovde');
    if (sG) {
      sG.onclick = function (e) {
        var t = e.target;
        if (!t || !t.getAttribute) { return; }
        if (t.getAttribute('data-sk-goz')) { var id1 = t.getAttribute('data-sk-goz'); SK.goster[id1] = !SK.goster[id1]; skTabloCiz(); return; }
        if (t.getAttribute('data-sk-kopya')) { skKopya(t.getAttribute('data-sk-kopya'), 'parola'); return; }
        if (t.getAttribute('data-sk-kul')) { skKopya(t.getAttribute('data-sk-kul'), 'kul'); return; }
        if (t.getAttribute('data-sk-sil')) {
          var id2 = t.getAttribute('data-sk-sil'), yeni = [];
          for (var i = 0; i < SK.kayitlar.length; i++) { if (SK.kayitlar[i].id !== id2) { yeni.push(SK.kayitlar[i]); } }
          SK.kayitlar = yeni;
          kIcerikYaz(SK.id, SK.kayitlar).then(function () { skTabloCiz(); skYaz('kayıt silindi'); });
          return;
        }
      };
    }
  }

  /* ---- EĞİTİM KASASI ---- */
  var eAc = document.getElementById('ekAcBtn');
  if (eAc && !eAc.dataset.kuruldu) {
    eAc.dataset.kuruldu = '1';
    eAc.onclick = function () {
      var s1 = document.getElementById('ekSifre'), s2 = document.getElementById('ekSifre2');
      var a = s1 ? s1.value : '', b = s2 ? s2.value : '';
      var kod = document.getElementById('ekKodOnay') && document.getElementById('ekKodOnay').checked;
      kapiVarMi(EK.id).then(function (varMi) {
        if (!varMi) {
          if (a.length < 8) { ekYaz('⚠ şifre en az 8 karakter olsun'); return; }
          if (a !== b) { ekYaz('⚠ iki şifre aynı değil'); return; }
          ekYaz('kasa oluşturuluyor… (600.000 tur)');
          kapiOlustur(EK.id, EK.ad, a, kod, '').then(function (sonuc) {
            if (s1) { s1.value = ''; } if (s2) { s2.value = ''; }
            ekCiz();
            ekYaz('✔ kasa oluşturuldu');
            if (sonuc && sonuc.kod) { kKodGoster(sonuc.kod); }
            return ekOtoYukle();
          }).catch(function (e) { ekYaz('✘ oluşturulamadı: ' + e); });
        } else {
          if (!a) { ekYaz('⚠ şifre gir'); return; }
          ekYaz('açılıyor… (600.000 tur)');
          kapiAc(EK.id, a).then(function () {
            if (s1) { s1.value = ''; }
            return kIcerikOku(EK.id, null).then(function (v) {
              EK.veri = v;
              EK.bolum = (v && v.bolumler && v.bolumler.length) ? v.bolumler[0].id : '';
              return ekIlerlemeYukle().then(function () {
                ekKonumaDon();
                var ok = ekOkunanToplam();
                ekYaz(ekVarMi()
                  ? ('kasa açıldı · ' + EK.veri.bolumler.length + ' bölüm · ' + ekToplam() + ' kayıt' + (ok ? ' · okunan ' + ok : ''))
                  : 'kasa açıldı · içerik yok');
                return ekOtoYukle();
              });
            });
          }).catch(function () { if (s1) { s1.value = ''; } ekYaz('✘ şifre yanlış'); });
        }
      });
    };
    var ek1 = document.getElementById('ekSifre');
    if (ek1) { ek1.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); eAc.click(); } }; }
    var eKod = document.getElementById('ekKodBtn');
    if (eKod) {
      eKod.onclick = function () {
        var v = document.getElementById('ekKod');
        document.getElementById('ekKodNot').textContent = 'kontrol ediliyor…';
        kapiKodlaAc(EK.id, v ? v.value : '').then(function () {
          if (v) { v.value = ''; }
          return kIcerikOku(EK.id, null).then(function (veri) {
            EK.veri = veri;
            EK.bolum = (veri && veri.bolumler && veri.bolumler.length) ? veri.bolumler[0].id : '';
            return ekIlerlemeYukle().then(function () {
              ekKonumaDon();
              ekYaz('✔ kurtarma koduyla açıldı');
            });
          });
        }).catch(function () { document.getElementById('ekKodNot').textContent = '✘ kod yanlış'; });
      };
    }
    var eGeri = document.getElementById('ekGeriBtn');
    if (eGeri) { eGeri.onclick = function () { document.getElementById('ekKodGiris').style.display = 'none'; document.getElementById('ekGiris').style.display = 'flex'; }; }

    var eYukle = document.getElementById('ekYukleBtn');
    if (eYukle) { eYukle.onclick = function () { ekDosyaSec(); kapiDokun(EK.id); }; }
    var eDosya = document.getElementById('ekDosya');
    if (eDosya) { eDosya.onchange = function () { ekDosyaOku(eDosya.files && eDosya.files[0]); }; }
    var eKilit = document.getElementById('ekKilitBtn');
    if (eKilit) { eKilit.onclick = function () { kapiKapat(EK.id); ekCiz(); ekYaz('kasa kilitlendi'); }; }
    var eAra = document.getElementById('ekAra');
    if (eAra) {
      eAra.oninput = function () {
        EK.ara = eAra.value || '';
        EK.grup = '';
        ekListeCiz();
        kapiDokun(EK.id);
      };
    }
    var eMenu = document.getElementById('ekMenu');
    if (eMenu) {
      eMenu.onclick = function (e) {
        var t = e.target;
        while (t && t !== eMenu && !t.getAttribute('data-ek-bolum')) { t = t.parentNode; }
        if (t && t.getAttribute && t.getAttribute('data-ek-bolum')) {
          EK.bolum = t.getAttribute('data-ek-bolum');
          EK.ara = '';
          EK.grup = '';
          EK.sinir = 150;
          var a2 = document.getElementById('ekAra'); if (a2) { a2.value = ''; }
          ekMenuCiz(); ekListeCiz();
          kapiDokun(EK.id);
        }
      };
    }
    var eGrup = document.getElementById('ekGrupSar');
    if (eGrup) {
      eGrup.onclick = function (e) {
        var t = e.target;
        while (t && t !== eGrup && t.getAttribute('data-ek-grup') === null) { t = t.parentNode; }
        if (t && t.getAttribute && t.getAttribute('data-ek-grup') !== null) {
          EK.grup = t.getAttribute('data-ek-grup') || '';
          EK.sinir = 150;
          ekListeCiz();
          kapiDokun(EK.id);
        }
      };
    }
    var eListe = document.getElementById('ekListe');
    if (eListe) {
      eListe.onclick = function (e) {
        var t = e.target;
        if (!t) { return; }
        /* TÜMÜNÜ GÖSTER */
        var du = t;
        while (du && du.id !== 'ekDahaBtn') { du = du.parentNode; }
        if (du && du.id === 'ekDahaBtn') { EK.sinir = 5000; ekListeCiz(); return; }
        if (!t.getAttribute) { return; }
        /* OKUDUM işareti */
        var okAn = t.getAttribute('data-ek-oku');
        if (okAn) {
          if (EK.okunan[okAn]) { delete EK.okunan[okAn]; }
          else { EK.okunan[okAn] = 1; }
          var par = String(okAn).split(':');
          if (par.length === 2) {
            EK.sonBolum = par[0];
            EK.sonKayit = parseInt(par[1], 10);
            if (isNaN(EK.sonKayit)) { EK.sonKayit = -1; }
          }
          ekIlerlemeKaydet();
          ekListeCiz();
          ekMenuCiz();
          ekYaz(EK.okunan[okAn] ? '✔ okundu olarak işaretlendi' : 'işaret kaldırıldı');
          return;
        }
        /* test şıkkı */
        var gs = t.getAttribute('data-ek-sec');
        if (gs !== null && gs !== undefined) {
          var ii = parseInt(t.getAttribute('data-ek-i'), 10);
          EK.cevap[gs] = ii;
          ekListeCiz();
          return;
        }
        /* komut kopyala */
        var ad = t.getAttribute('data-ek-kopya');
        if (!ad) { return; }
        var kart = t.parentNode;
        while (kart && kart.className !== 'ekKart') { kart = kart.parentNode; }
        var metin = '';
        if (kart) {
          var p = kart.querySelector('.ekKod pre');
          if (p) { metin = p.textContent; }
        }
        if (!metin) { ekYaz('kopyalanacak komut bulunamadı'); return; }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(metin).then(function () { ekYaz('kopyalandı: ' + ad); }, function () { ekYaz('kopyalanamadı'); });
          } else { ekYaz('tarayıcı pano izni vermedi'); }
        } catch (er) { ekYaz('kopyalanamadı'); }
      };
    }
    var eKutu = document.getElementById('ekKutu');
    if (eKutu) { eKutu.addEventListener('click', function () { kapiDokun(EK.id); }); }
  }

  bkCiz(); skCiz(); ekCiz();
}

/* kurtarma kodunu bir kez göster — kod parametre olarak gelir, depoda saklanmaz */
function kKodGoster(kod) {
  if (!kod) { return; }
  var kutu = document.createElement('div');
  kutu.className = 'bkKodKutu';
  kutu.id = 'kKodKutu';
  kutu.innerHTML = '<div class="bkKodBas">&#128273; KURTARMA KODUN — BİR KEZ GÖSTERİLİR</div>'
    + '<div class="bkKodNot">Bu kodu <b>şimdi</b> kaydet: kağıda yaz, telefonuna ya da kendi e-postana koy. '
    + 'Bu bilgisayarda saklanmaz — <b>kimse bulamaz, sen de dahil</b>. '
    + 'Şifreni unutursan tek çıkış yolun budur.</div>'
    + '<div class="bkKodYer" style="font-size:19px;letter-spacing:3px;color:#fff;font-weight:700">'
    + kEsc(kod) + '</div>'
    + '<div class="bkKodYer">— kodu güvenli bir yere koyduktan sonra bu pencereyi kapat —</div>'
    + '<button class="buton" type="button" id="kKodKapat">ANLADIM, KAPAT</button>';
  document.body.appendChild(kutu);
  var b = document.getElementById('kKodKapat');
  if (b) { b.onclick = function () { try { document.body.removeChild(kutu); } catch (e) {} }; }
}

/* ============================== EĞİTİM KASASI ==============================
   KALİ REHBERİM içeriğinin tamamı: 28 bölüm / ~2400 kayıt. İçerik şifreli
   saklanır; kasa kilitliyken ne bölüm adı ne kayıt görünür. */
var EK = { id: 'egitim', ad: 'EĞİTİM KASASI', veri: null, bolum: '', ara: '', sinir: 150,
           grup: '', cevap: {}, cevapGoster: false,
           okunan: {}, sonBolum: '', sonKayit: -1, ilerlemeVar: false };
var EK_HARF = 'ABCDEFGH';

/* ------------------- çalışma takibi (şifreli saklanır) ------------------- */
function ekIlerlemeYukle() {
  return kIcerikOkuKayit(EK.id, 'egitim-ilerleme', null).then(function (v) {
    if (v && v.okunan) {
      EK.okunan = v.okunan;
      EK.sonBolum = v.sonBolum || '';
      EK.sonKayit = (v.sonKayit === null || v.sonKayit === undefined) ? -1 : v.sonKayit;
      EK.ilerlemeVar = true;
    }
    return v;
  }).catch(function (e) { kLog('ILERLEME-OKUNAMADI:' + e); return null; });
}
function ekIlerlemeKaydet() {
  if (!kapiDurum(EK.id)) { return Promise.resolve(); }
  return kIcerikYazKayit(EK.id, 'egitim-ilerleme', {
    okunan: EK.okunan, sonBolum: EK.bolum, sonKayit: EK.sonKayit, guncelleme: Date.now()
  }).catch(function (e) { kLog('ILERLEME-YAZILAMADI:' + e); });
}
function ekOkunanToplam() {
  var n = 0;
  for (var k in EK.okunan) { if (Object.prototype.hasOwnProperty.call(EK.okunan, k) && EK.okunan[k]) { n++; } }
  return n;
}
function ekBolumOkunan(bol) {
  if (!ekVarMi()) { return 0; }
  var n = 0;
  for (var i = 0; i < (bol.kayitlar || []).length; i++) {
    if (EK.okunan[bol.id + ':' + i]) { n++; }
  }
  return n;
}
function ekOkuAnahtar(b2, n) { return (b2 && b2.id ? b2.id : '') + ':' + n; }

/* kaldığın yere dön: son işaretlediğin bölüm + kayıt */
function ekBolumGecerli(id) {
  if (!ekVarMi() || !id) { return false; }
  for (var i = 0; i < EK.veri.bolumler.length; i++) {
    if (EK.veri.bolumler[i].id === id) { return true; }
  }
  return false;
}
function ekKonumaDon() {
  if (ekBolumGecerli(EK.sonBolum)) { EK.bolum = EK.sonBolum; }
  ekCiz();
  if (EK.sonKayit >= 0) {
    setTimeout(function () {
      var l = document.getElementById('ekListe');
      if (!l) { return; }
      var kartlar = l.querySelectorAll('.ekKart');
      if (kartlar[EK.sonKayit]) {
        kartlar[EK.sonKayit].scrollIntoView({ block: 'center' });
        kartlar[EK.sonKayit].classList.add('ekVurgu');
        setTimeout(function () {
          try { kartlar[EK.sonKayit].classList.remove('ekVurgu'); } catch (e) {}
        }, 3000);
      }
    }, 450);
  }
}

function ekYaz(s) { var e = document.getElementById('ekDurum'); if (e) { e.textContent = s; } }
function ekVarMi() { return !!(EK.veri && EK.veri.bolumler && EK.veri.bolumler.length); }
function ekToplam() {
  if (!ekVarMi()) { return 0; }
  var t = 0;
  for (var i = 0; i < EK.veri.bolumler.length; i++) { t += (EK.veri.bolumler[i].kayitlar || []).length; }
  return t;
}
function ekTr(s) { return String(s || '').toLocaleLowerCase('tr'); }

function egitimHTML() {
  return ''
  + '<div class="bkKutu" id="ekKutu">'
  +   '<div class="bkBas">'
  +     '<span class="bkAd">&#127891; EĞİTİM KASASI</span>'
  +     '<span class="bkRozet" id="ekRozet">KİLİTLİ</span>'
  +   '</div>'
  +   '<div id="ekGiris" class="bkGiris">'
  +     '<input class="iptvInput" id="ekSifre" type="password" autocomplete="new-password" placeholder="kasa şifresi">'
  +     '<input class="iptvInput" id="ekSifre2" type="password" autocomplete="new-password" placeholder="şifre (tekrar)" style="display:none">'
  +     '<label class="bkOnay" id="ekKodOnayKutu"><input type="checkbox" id="ekKodOnay"> kurtarma kodu oluştur</label>'
  +     '<button class="buton" id="ekAcBtn" type="button">&#128275; AÇ</button>'
  +     '<span class="bkNot" id="ekNot"></span>'
  +   '</div>'
  +   '<div id="ekKodGiris" class="bkGiris" style="display:none">'
  +     '<span class="bkNot">kurtarma kodunu yaz:</span>'
  +     '<input class="iptvInput" id="ekKod" type="text" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX">'
  +     '<button class="buton" id="ekKodBtn" type="button">&#128273; KODLA AÇ</button>'
  +     '<button class="buton ikincil" id="ekGeriBtn" type="button">GERİ</button>'
  +     '<span class="bkNot" id="ekKodNot"></span>'
  +   '</div>'
  +   '<div id="ekIci" style="display:none">'
  +     '<div class="bkArac">'
  +       '<button class="buton" id="ekYukleBtn" type="button">&#128194; İÇERİK YÜKLE</button>'
  +       '<input type="file" id="ekDosya" accept=".json,application/json" style="display:none">'
  +       '<input class="iptvInput kucuk" id="ekAra" type="text" placeholder="her yerde ara (komut, terim, soru…)">'
  +       '<button class="buton ikincil" id="ekKilitBtn" type="button">&#128274; KİLİTLE</button>'
  +       '<span class="bkDurum" id="ekDurum"></span>'
  +     '</div>'
  +     '<div class="ekDuzen">'
  +       '<div class="ekMenu" id="ekMenu"></div>'
  +       '<div class="ekSag">'
  +         '<div class="ekBas"><span id="ekBasAd">BÖLÜM SEÇ</span>'
  +           '<span class="soluk" id="ekBasSayac"></span>'
  +           '<span class="ekIlerleme" id="ekIlerleme"></span></div>'
  +         '<div class="bkKlasorSar" id="ekGrupSar" style="display:none"></div>'
  +         '<div class="ekListe" id="ekListe"></div>'
  +       '</div>'
  +     '</div>'
  +   '</div>'
  + '</div>';
}

function ekMenuCiz() {
  var m = document.getElementById('ekMenu');
  if (!m) { return; }
  if (!ekVarMi()) { m.innerHTML = '<div class="soluk ekBos">içerik yüklenmedi</div>'; return; }
  var h = '';
  for (var i = 0; i < EK.veri.bolumler.length; i++) {
    var b = EK.veri.bolumler[i];
    var n = (b.kayitlar || []).length;
    var ok = ekBolumOkunan(b);
    h += '<div class="ekSatir' + (EK.bolum === b.id ? ' sec' : '') + '" data-ek-bolum="' + kEsc(b.id) + '">'
      + '<span class="ekSimge">' + (b.simge || '&#128196;') + '</span>'
      + '<span class="ekAd">' + kEsc(b.ad) + '</span>'
      + '<span class="ekSayi">' + n + '</span>'
      + (ok ? '<span class="ekOkSayi" title="okudum işaretlediğin">&#10004;' + ok + '</span>' : '')
      + '</div>';
  }
  m.innerHTML = h;
}

function ekKayitKart(bol, r, bolumAd, sira, gs, okundu, anahtar) {
  var h = '<div class="ekKart ekT-' + kEsc(r.tip || 'metin') + (okundu ? ' ekOkundu' : '') + '">';
  h += '<div class="ekKartBas">';
  if (sira) { h += '<span class="ekSira">' + sira + '</span>'; }
  h += '<span class="ekKartAd">' + kEsc(r.ad) + '</span>';
  if (r.etiket) { h += '<span class="ekRozetK">' + kEsc(r.etiket) + '</span>'; }
  if (anahtar) {
    h += '<button class="ekOkuBtn' + (okundu ? ' sec' : '') + '" data-ek-oku="' + kEsc(anahtar)
      + '" type="button" title="Okudum olarak işaretle">' + (okundu ? '&#10004; OKUNDU' : '&#9711; OKUDUM') + '</button>';
  }
  h += '</div>';
  if (r.ust) { h += '<div class="ekUst">' + kEsc(r.ust) + '</div>'; }

  /* --- bilgi testi: çözülebilir --- */
  if (r.tip === 'soru' && r.siklar && r.siklar.length) {
    var sec = EK.cevap[gs];
    h += '<div class="ekSiklar">';
    for (var i = 0; i < r.siklar.length; i++) {
      var sinif = 'ekSik';
      if (sec !== undefined) {
        if (i === r.dogru) { sinif += ' dogru'; }
        else if (i === sec) { sinif += ' yanlis'; }
      }
      h += '<button class="' + sinif + '" data-ek-sec="' + gs + '" data-ek-i="' + i + '" type="button">'
        + '<b>' + EK_HARF.charAt(i) + ')</b> ' + kEsc(r.siklar[i]) + '</button>';
    }
    h += '</div>';
    if (sec !== undefined) {
      h += '<div class="ekCevap">'
        + (sec === r.dogru ? '&#10004; <b>DOĞRU</b>' : '&#10008; <b>Yanlış</b> — doğru cevap: ' + EK_HARF.charAt(r.dogru))
        + (r.metin ? '<br>' + kEsc(r.metin) : '') + '</div>';
    } else {
      h += '<div class="ekNot3">bir şık seç → doğru cevabı gösterir</div>';
    }
    return h + '</div>';
  }

  /* --- normal kayıt --- */
  if (r.metin) { h += '<div class="ekMetin">' + kEsc(r.metin) + '</div>'; }
  if (r.ornek) {
    h += '<div class="ekKod"><pre>' + kEsc(r.ornek) + '</pre>'
      + '<button class="iptvMini" data-ek-kopya="' + kEsc(r.ad) + '" type="button">&#128203; KOPYALA</button></div>';
  }
  h += '</div>';
  return h;
}

/* bölüm içindeki gruplar (kategori / araç grubu / zorluk…) */
function ekGruplar(bol) {
  var s = {}, sira = [], i;
  for (i = 0; i < (bol.kayitlar || []).length; i++) {
    var g = String(bol.kayitlar[i].grup || '').trim();
    if (!g) { continue; }
    if (!s[g]) { s[g] = 0; sira.push(g); }
    s[g]++;
  }
  if (sira.length < 2 || sira.length > 40) { return null; }
  var c = [];
  for (i = 0; i < sira.length; i++) { c.push([sira[i], s[sira[i]]]); }
  return c;
}

function ekAktifBolum() {
  if (!ekVarMi() || !EK.bolum) { return null; }
  for (var i = 0; i < EK.veri.bolumler.length; i++) {
    if (EK.veri.bolumler[i].id === EK.bolum) { return EK.veri.bolumler[i]; }
  }
  return null;
}

function ekListeCiz() {
  var l = document.getElementById('ekListe');
  var ba = document.getElementById('ekBasAd');
  var bs = document.getElementById('ekBasSayac');
  var gc = document.getElementById('ekGrupSar');
  if (!l) { return; }
  if (!ekVarMi()) {
    l.innerHTML = '<div class="soluk ekBos">içerik yüklenmedi — <b>İÇERİK YÜKLE</b> ile egitim-veri.json dosyasını seç</div>';
    if (ba) { ba.textContent = 'BÖLÜM SEÇ'; }
    if (bs) { bs.textContent = ''; }
    if (gc) { gc.innerHTML = ''; gc.style.display = 'none'; }
    return;
  }
  var ara = ekTr(EK.ara), gosterilen = 0, toplam = 0, h = '', kesildi = false;
  var oncekiGrup = null;

  if (gc) { gc.style.display = 'none'; gc.innerHTML = ''; }

  if (ara) {
    if (ba) { ba.textContent = 'ARAMA: ' + EK.ara; }
    for (var i = 0; i < EK.veri.bolumler.length && !kesildi; i++) {
      var bol = EK.veri.bolumler[i];
      for (var j = 0; j < (bol.kayitlar || []).length; j++) {
        var r = bol.kayitlar[j];
        if ((ekTr(r.ad) + ' ' + ekTr(r.metin) + ' ' + ekTr(r.ornek) + ' ' + ekTr(r.ust)).indexOf(ara) >= 0) {
          toplam++;
          if (gosterilen < EK.sinir) {
            var an1 = ekOkuAnahtar(bol, j);
            h += ekKayitKart(bol, r, bol.ad, toplam, 'a' + i + '-' + j, !!EK.okunan[an1], an1);
            gosterilen++;
          } else { kesildi = true; break; }
        }
      }
    }
    if (!toplam) { h = '<div class="soluk ekBos">“' + kEsc(EK.ara) + '” için sonuç yok</div>'; }
    if (kesildi) { h += '<div class="soluk ekBos">…' + toplam + ' sonuçtan ilk ' + EK.sinir + ' tanesi. Aramayı daralt ya da “TÜMÜNÜ GÖSTER”.</div>'; }
  } else {
    var b2 = ekAktifBolum();
    if (!b2) {
      h = '<div class="soluk ekBos">soldan bir bölüm seç</div>';
      if (ba) { ba.textContent = 'BÖLÜM SEÇ'; }
    } else {
      if (ba) { ba.textContent = b2.ad; }
      var kat = ekGruplar(b2);
      /* grup süzgeci */
      if (gc && kat && !EK.grup) {
        gc.style.display = 'flex';
        var gs2 = '<span class="bkKlasor sec" data-ek-grup="">TÜMÜ <b>' + (b2.kayitlar || []).length + '</b></span>';
        for (var q = 0; q < kat.length; q++) {
          gs2 += '<span class="bkKlasor" data-ek-grup="' + kEsc(kat[q][0]) + '">' + kEsc(kat[q][0]) + ' <b>' + kat[q][1] + '</b></span>';
        }
        gc.innerHTML = gs2;
      } else if (gc && kat && EK.grup) {
        gc.style.display = 'flex';
        gc.innerHTML = '<span class="bkKlasor" data-ek-grup="">&#8592; TÜM GRUPLAR</span>'
          + '<span class="bkKlasor sec">' + kEsc(EK.grup) + '</span>';
      }
      for (var n = 0; n < (b2.kayitlar || []).length; n++) {
        var rr = b2.kayitlar[n];
        if (EK.grup && String(rr.grup || '') !== EK.grup) { continue; }
        toplam++;
        if (gosterilen >= EK.sinir) { kesildi = true; continue; }
        if (!EK.grup && rr.grup && rr.grup !== oncekiGrup) {
          oncekiGrup = rr.grup;
          h += '<div class="ekGrupBas">' + kEsc(rr.grup) + '</div>';
        }
        var an2 = ekOkuAnahtar(b2, n);
        h += ekKayitKart(b2, rr, '', gosterilen + 1, 'b' + n, !!EK.okunan[an2], an2);
        gosterilen++;
      }
      if (!toplam) { h = '<div class="soluk ekBos">bu grupta kayıt yok</div>'; }
      if (kesildi) {
        h += '<div class="ekDaha"><button class="buton" id="ekDahaBtn" type="button">'
          + '&#9660; TÜMÜNÜ GÖSTER (' + toplam + ' kayıt)</button></div>';
      }
    }
  }
  if (bs) {
    bs.textContent = toplam + ' kayıt'
      + (EK.grup ? ' · ' + EK.grup : '')
      + (EK.ara ? ' (arama)' : '')
      + (gosterilen !== toplam && toplam ? ' · gösterilen ' + gosterilen : '');
  }
  var il = document.getElementById('ekIlerleme');
  if (il) {
    var ot = ekOkunanToplam(), tm = ekToplam();
    il.textContent = ot ? ('&#10004; okunan ' + ot + ' / ' + tm) : '';
    il.innerHTML = ot ? ('&#10004; okunan <b>' + ot + '</b> / ' + tm
      + ' (%' + Math.round(ot * 100 / (tm || 1)) + ')') : '';
  }
  l.innerHTML = h;
}

function ekCiz() {
  var g = document.getElementById('ekGiris'), i = document.getElementById('ekIci'), r = document.getElementById('ekRozet');
  if (!g || !i) { return; }
  if (kapiDurum(EK.id)) {
    g.style.display = 'none'; i.style.display = 'block';
    if (r) { r.textContent = 'AÇIK'; r.className = 'bkRozet acik'; }
    ekMenuCiz(); ekListeCiz(); kapiDokun(EK.id);
  } else {
    g.style.display = 'flex'; i.style.display = 'none';
    if (r) { r.textContent = 'KİLİTLİ'; r.className = 'bkRozet'; }
    document.getElementById('ekKodGiris').style.display = 'none';
    kapiVarMi(EK.id).then(function (varMi) {
      var b = document.getElementById('ekAcBtn'), s2 = document.getElementById('ekSifre2');
      var ko = document.getElementById('ekKodOnayKutu'), nt = document.getElementById('ekNot');
      if (b) { b.innerHTML = varMi ? '&#128275; AÇ' : '&#128273; OLUŞTUR'; }
      if (s2) { s2.style.display = varMi ? 'none' : 'inline-block'; }
      if (ko) { ko.style.display = varMi ? 'none' : 'inline-flex'; }
      if (nt && varMi) { nt.innerHTML = 'şifreni mi unuttun? <a href="#" id="ekKodLink" style="color:var(--ana2)">kurtarma kodu ile aç</a>'; }
      else if (nt) { nt.textContent = 'ilk kullanım: güçlü bir şifre belirle'; }
      var bag = document.getElementById('ekKodLink');
      if (bag) {
        bag.onclick = function (e) {
          e.preventDefault();
          document.getElementById('ekGiris').style.display = 'none';
          document.getElementById('ekKodGiris').style.display = 'flex';
        };
      }
    });
  }
}

function ekKapat() {
  EK.veri = null; EK.bolum = ''; EK.ara = ''; EK.grup = ''; EK.cevap = {}; EK.sinir = 150;
  EK.okunan = {}; EK.sonBolum = ''; EK.sonKayit = -1; EK.ilerlemeVar = false;
  var l = document.getElementById('ekListe'); if (l) { l.innerHTML = ''; }
  var m = document.getElementById('ekMenu'); if (m) { m.innerHTML = ''; }
  var d = document.getElementById('ekDurum'); if (d) { d.textContent = ''; }
  var a = document.getElementById('ekAra'); if (a) { a.value = ''; }
}

function ekIcerikAl(veri) {
  if (!veri || !veri.bolumler || !veri.bolumler.length) { throw new Error('dosyada bölüm yok'); }
  EK.veri = veri;
  EK.bolum = veri.bolumler[0].id;
  EK.ara = ''; EK.grup = ''; EK.cevap = {}; EK.sinir = 150;
  var a = document.getElementById('ekAra'); if (a) { a.value = ''; }
  return kIcerikYaz(EK.id, veri).then(function () {
    ekMenuCiz(); ekListeCiz();
    return ekToplam();
  });
}

/* İçerik yüklenince ayrıca bir daha sorma: İÇERİK YÜKLE düğmesi */
function ekDosyaSec() {
  var g = document.getElementById('ekDosya');
  if (!g) { return; }
  g.value = '';
  g.click();
}

function ekDosyaOku(dosya) {
  if (!dosya) { return Promise.resolve(); }
  ekYaz('okunuyor: ' + dosya.name);
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function (e) {
      try {
        var v = JSON.parse(new TextDecoder('utf-8').decode(e.target.result));
        res(v);
      } catch (err) { rej(new Error('JSON okunamadı: ' + err.message)); }
    };
    fr.onerror = function () { rej(new Error('dosya okunamadı')); };
    fr.readAsArrayBuffer(dosya);
  }).then(function (v) {
    ekYaz('şifreleniyor…');
    return ekIcerikAl(v);
  }).then(function (n) {
    ekYaz('✔ içerik şifrelendi · ' + n + ' kayıt · ' + EK.veri.bolumler.length + ' bölüm');
  }).catch(function (e) { ekYaz('✘ ' + (e && e.message ? e.message : e)); });
}

/* panel klasöründe egitim-veri.json varsa al.
   İçerik zaten varsa SADECE dosyadaki sürüm/toplam farklıysa yeniler
   (yeni KALİ REHBERİM sürümü çıkınca kasa kendini günceller). */
function ekOtoYukle() {
  return fetch('egitim-veri.json', { cache: 'no-store' }).then(function (c) {
    if (!c.ok) { throw new Error('yok'); }
    return c.json();
  }).then(function (v) {
    var yeni = parseInt(v.toplam || 0, 10);
    var eski = parseInt((EK.veri && EK.veri.toplam) || 0, 10);
    if (ekVarMi() && yeni && yeni === eski) {
      ekYaz('içerik güncel · ' + eski + ' kayıt · v' + (EK.veri.surum || '?'));
      return false;
    }
    var guncelleme = ekVarMi();
    return ekIcerikAl(v).then(function (n) {
      ekYaz((guncelleme ? '✔ içerik GÜNCELLENDİ' : '✔ içerik alındı ve şifrelendi')
        + ' · ' + n + ' kayıt · v' + (v.surum || '?'));
      return true;
    });
  }).catch(function () { return false; });
}

/* ============================== gizli giriş yolları ==============================
   Kenan: “madalyonun içine kuracaktın” → üstteki FOTOĞRAFA çift tıkla = kasalara git.
   Düğme gibi görünmez, ipucu vermez. Ctrl+Alt+K de aynı işi yapar.
   Açılınca kısa ömürlü bir “KASALAR” şeridi çıkar: hangi kasaya gitmek istersen
   tek tıkla oraya kaydırır (kutular DİĞER'in en altında kalıyordu). */
function kasaGit() {
  try { git('diger'); } catch (e) {}
  setTimeout(function () {
    var ilk = document.getElementById('kasaKutu');
    if (ilk && ilk.scrollIntoView) { ilk.scrollIntoView({ block: 'start' }); }
    kasaSeciciGoster();
  }, 450);
}

function kasaSeciciGoster() {
  var eski = document.getElementById('kasaSecici');
  if (eski && eski.parentNode) { eski.parentNode.removeChild(eski); }
  var liste = [['kasaKutu', '&#128279; BAĞLANTILAR'], ['bkKutu', '&#128274; BELGE'],
               ['skKutu', '&#128273; ŞİFRE'], ['ekKutu', '&#127891; EĞİTİM']];
  var k = document.createElement('div');
  k.id = 'kasaSecici';
  k.className = 'kasaSecici';
  var h = '<span class="ksBas">KASALAR</span>';
  for (var i = 0; i < liste.length; i++) {
    var var_mi = document.getElementById(liste[i][0]) ? '' : ' ksYok';
    h += '<span class="ksBtn' + var_mi + '" data-ks="' + liste[i][0] + '">' + liste[i][1] + '</span>';
  }
  k.innerHTML = h;
  document.body.appendChild(k);
  k.onclick = function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) { return; }
    var id = t.getAttribute('data-ks');
    if (!id) { return; }
    var hedef = document.getElementById(id);
    if (hedef && hedef.scrollIntoView) { hedef.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
  var zaman = setTimeout(function () { try { k.parentNode.removeChild(k); } catch (e) {} }, 15000);
  k.addEventListener('mouseenter', function () { clearTimeout(zaman); });
}

function medalyonKur() {
  var m = document.querySelector('.marka .madalyon');
  if (!m || m.getAttribute('data-gizli-kapi')) { return; }
  m.setAttribute('data-gizli-kapi', '1');
  m.addEventListener('dblclick', function (e) { e.preventDefault(); kasaGit(); });
  if (!window.__kasaKisaYol) {
    window.__kasaKisaYol = 1;
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
        e.preventDefault();
        kasaGit();
      }
    });
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(medalyonKur, 900);
} else {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(medalyonKur, 900); });
}

/* ============================== ölçüm kancaları ============================== */
window.BELGE_API = {
  kur: function (sifre, kod) { return kapiOlustur(BK.id, BK.ad, sifre, !!kod, ''); },
  varMi: function () { return kapiVarMi(BK.id); },
  ac: function (s) { return kapiAc(BK.id, s).then(function () { return bkMetaOku(); }); },
  kapat: function () { kapiKapat(BK.id); },
  acik: function () { return kapiDurum(BK.id); },
  adet: function () { return BK.dosyalar.length; },
  adlar: function () { return BK.dosyalar.map(function (d) { return d.ad; }); },
  klasorler: function () { return BK.dosyalar.map(function (d) { return d.klasor; }); },
  klasorSec: function (g) { BK.klasor = g; bkKlasorCiz(); bkDosyaCiz(); },
  ara: function (s) { BK.ara = s; var e = document.getElementById('bkAra'); if (e) { e.value = s; } bkDosyaCiz(); },
  gorunen: function () { return document.querySelectorAll('#bkIzgara .bkKart').length; },
  ekle: function (dosyalar) { return bkDosyalariAl(dosyalar); },
  icerikOku: function () { return bkMetaOku(); },
  depoDosya: function () { return kHepsi('dosya').then(function (l) { return l.length; }); },
  depoIcerik: function () { return kGet('icerik', BK.id); },
  kasaKaydi: function () { return kGet('kasa', BK.id); },
  duzMetinVarMi: function (aranan) {
    return kHepsi('dosya').then(function (liste) {
      var isler = liste.map(function (r) { return r.veri.text().then(function (t) { return t.indexOf(aranan) >= 0; }); });
      return Promise.all(isler).then(function (s) { return s.indexOf(true) >= 0; });
    });
  },
  bak: function (uid) { bkBak(uid); },
  bakAcik: function () { var e = document.getElementById('bkBak'); return !!(e && e.style.display !== 'none'); },
  bakGovde: function () { var e = document.getElementById('bkBakGovde'); return e ? e.innerHTML.slice(0, 160) : null; },
  bakKapat: function () { bkBakKapat(); },
  sil: function (uid) { bkSil(uid); },
  sifreDegistir: function (y) { return kapiSifreDegistir(BK.id, y); },
  kodlaAc: function (k) { return kapiKodlaAc(BK.id, k).then(function () { return bkMetaOku(); }); },
  sifreUret: function (n) { return kSifreUret(n || 20); },
  docxMetin: function (buf) { return bkDocxMetin(buf); },
  klasorBul: function (ad) { return bkKlasorBul(ad); },
  /* depo dökümü (tanı için) */
  depoKimlikler: function () { return kHepsi('dosya').then(function (l) { return l.map(function (r) { return r.id + ':' + (r.veri ? r.veri.size : 0); }); }); },
  log: function () { return KASA_LOG.slice(); }
};

window.EGITIM_API = {
  varMi: function () { return kapiVarMi('egitim'); },
  kur: function (sifre, kod) { return kapiOlustur('egitim', EK.ad, sifre, !!kod, ''); },
  ac: function (s) {
    return kapiAc('egitim', s).then(function () {
      return kIcerikOku('egitim', null).then(function (v) {
        EK.veri = v;
        EK.bolum = (v && v.bolumler && v.bolumler.length) ? v.bolumler[0].id : '';
        ekCiz();
        return ekVarMi();
      });
    });
  },
  kodlaAc: function (k) {
    return kapiKodlaAc('egitim', k).then(function () {
      return kIcerikOku('egitim', null).then(function (v) { EK.veri = v; ekCiz(); });
    });
  },
  kapat: function () { kapiKapat('egitim'); },
  acik: function () { return kapiDurum('egitim'); },
  icerikVar: function () { return ekVarMi(); },
  toplam: function () { return ekToplam(); },
  bolumler: function () {
    if (!ekVarMi()) { return []; }
    return EK.veri.bolumler.map(function (b) { return b.ad + '|' + (b.kayitlar || []).length; });
  },
  bolumSec: function (id) { EK.bolum = id; EK.ara = ''; ekMenuCiz(); ekListeCiz(); },
  ara: function (s) { EK.ara = s; var e = document.getElementById('ekAra'); if (e) { e.value = s; } ekListeCiz(); },
  gorunen: function () { return document.querySelectorAll('#ekListe .ekKart').length; },
  menuSatir: function () { return document.querySelectorAll('#ekMenu .ekSatir').length; },
  baslik: function () { var e = document.getElementById('ekBasAd'); return e ? e.textContent : null; },
  sayac: function () { var e = document.getElementById('ekBasSayac'); return e ? e.textContent : null; },
  durum: function () { var e = document.getElementById('ekDurum'); return e ? e.textContent : null; },
  ilkKayit: function () { var k = document.querySelector('#ekListe .ekKart'); return k ? k.textContent.replace(/\s+/g, ' ').slice(0, 150) : null; },
  kodVar: function () { var e = document.querySelector('#ekListe .ekKod pre'); return e ? e.textContent.slice(0, 80) : null; },
  yukleMetin: function (m) {
    try { return ekIcerikAl(JSON.parse(m)).then(function (n) { return n; }); }
    catch (e) { return Promise.reject(e); }
  },
  otoYukle: function () { return ekOtoYukle(); },
  depoIcerik: function () { return kGet('icerik', 'egitim'); },
  menuGorunurMu: function () { var e = document.getElementById('ekMenu'); return !!(e && e.innerHTML.length > 40); },
  /* --- yeni: grup süzgeci + test modu --- */
  grupSec: function (g) { EK.grup = g || ''; EK.sinir = 150; ekListeCiz(); },
  grupListesi: function () {
    var b = ekAktifBolum();
    if (!b) { return []; }
    var k = ekGruplar(b);
    return k ? k.map(function (x) { return x[0] + '|' + x[1]; }) : [];
  },
  grupCipVar: function () { return document.querySelectorAll('#ekGrupSar .bkKlasor').length; },
  grupBasligiVar: function () { return document.querySelectorAll('#ekListe .ekGrupBas').length; },
  /* test modu: soruya cevap ver */
  cevapla: function (gs, i) { EK.cevap[gs] = i; ekListeCiz(); },
  sikVar: function () { return document.querySelectorAll('#ekListe .ekSik').length; },
  cevapVar: function () { return document.querySelectorAll('#ekListe .ekCevap').length; },
  dogruIsaretli: function () { return document.querySelectorAll('#ekListe .ekSik.dogru').length; },
  yanlisIsaretli: function () { return document.querySelectorAll('#ekListe .ekSik.yanlis').length; },
  tumunuGoster: function () { EK.sinir = 5000; ekListeCiz(); },
  dahaBtnVar: function () { return !!document.getElementById('ekDahaBtn'); },
  toplamKayit: function () { return EK.veri ? EK.veri.toplam : null; },
  icerikSurum: function () { return EK.veri ? EK.veri.surum : null; },
  sayac: function () { var e = document.getElementById('ekBasSayac'); return e ? e.textContent : null; },
  bolumKayitlar: function (id) {
    if (!ekVarMi()) { return []; }
    for (var i = 0; i < EK.veri.bolumler.length; i++) {
      if (EK.veri.bolumler[i].id === id) { return EK.veri.bolumler[i].kayitlar; }
    }
    return [];
  },
  /* --- çalışma takibi --- */
  okunduSayisi: function () { return ekOkunanToplam(); },
  okuBtnVar: function () { return document.querySelectorAll('#ekListe .ekOkuBtn').length; },
  okunduIsaretli: function () { return document.querySelectorAll('#ekListe .ekOkuBtn.sec').length; },
  okunduKart: function () { return document.querySelectorAll('#ekListe .ekKart.ekOkundu').length; },
  okuToggle: function (key) {
    var e = document.querySelector('#ekListe .ekOkuBtn[data-ek-oku="' + key + '"]');
    if (e) { e.click(); return true; }
    return false;
  },
  ilerlemeYazisi: function () { var e = document.getElementById('ekIlerleme'); return e ? e.textContent : null; },
  menuOkSayisi: function () { return document.querySelectorAll('#ekMenu .ekOkSayi').length; },
  sonBolum: function () { return EK.sonBolum; },
  sonKayit: function () { return EK.sonKayit; },
  ilerlemeKaydi: function () { return kGet('icerik', 'egitim-ilerleme'); },
  konumaDon: function () { ekKonumaDon(); },
  vurguVar: function () { return document.querySelectorAll('#ekListe .ekVurgu').length; },
  okunanSifirla: function () { EK.okunan = {}; EK.sonBolum = ''; EK.sonKayit = -1; return ekIlerlemeKaydet(); }
};

window.SIFRE_API = {
  kur: function (sifre, kod) { return kapiOlustur(SK.id, SK.ad, sifre, !!kod, ''); },
  ac: function (s) { return kapiAc(SK.id, s).then(function () { return skYukle(); }); },
  kapat: function () { kapiKapat(SK.id); },
  acik: function () { return kapiDurum(SK.id); },
  yukle: function () { return skYukle(); },
  ekle: function (site, kul, parola, not) {
    var a = document.getElementById('skSite'), b = document.getElementById('skKullanici');
    var c = document.getElementById('skParola'), d = document.getElementById('skNot2');
    if (a) { a.value = site || ''; } if (b) { b.value = kul || ''; }
    if (c) { c.value = parola || ''; } if (d) { d.value = not || ''; }
    skKaydet();
  },
  adet: function () { return SK.kayitlar.length; },
  siteler: function () { return SK.kayitlar.map(function (k) { return k.site; }); },
  parolalar: function () { return SK.kayitlar.map(function (k) { return k.parola; }); },
  gorunenSatir: function () { return document.querySelectorAll('#skGovde tr').length; },
  kasaKaydi: function () { return kGet('kasa', SK.id); },
  icerikKaydi: function () { return kGet('icerik', SK.id); },
  kodlaAc: function (k) { return kapiKodlaAc(SK.id, k); }
};
