/* ============================================================================
   ÖZEL BAĞLANTILAR KASASI — kendine ait yayın bağlantıları için kilitli bölme
   Kenan Kuzucu · ÜSTAD DÜNYA MONİTÖR          (DİĞER sekmesi → IPTV kutusunun içinde)

   İKİ KAPI:
     1. kapı = panelin kendi giriş perdesi (giris.js)
     2. kapı = bu kasa; şifre girilmeden İÇİNDEKİLER HİÇ GÖRÜNMEZ (adı bile)

   İÇİNDE TAM BİR IPTV PANELİ VAR (dışarı hiçbir şey taşmaz):
     kendi oynatıcısı · kayıt tablosu · kategori çipleri · arama · çal/durdur
     ▶ oynat · 📋 bağlantıyı kopyala · ✕ sil

   Kripto (tarayıcıda, WebCrypto):
     AES-256-GCM · anahtar PBKDF2-HMAC-SHA256 ile 200.000 turda türetilir
     rastgele 16 baytlık tuz, her yazmada taze 12 baytlık IV
   Şifre hiçbir yere yazılmaz. Unutulursa içerik geri getirilemez (arka kapı yok).
   Depo: localStorage.ustad_iptv_kasa = {tuz, iv, veri}   (hepsi base64)
   Otomatik kilit: 5 dakika işlem yapılmazsa. Kilitlenince liste DOM'dan da silinir.
   ============================================================================ */
var KASA = {
  anahtar: null, tuz: null, liste: [], acik: false, zaman: null, duzenle: -1,
  hls: null, oynUrl: '', oynAd: '', kategori: 'hepsi', ara: '',
  hlsYedek: null, hlsYedekDenendi: false
};
var KASA_DEPO = 'ustad_iptv_kasa';
var KASA_TUR = 200000;
var KASA_BEKLEME = 5 * 60 * 1000;   /* 5 dk */

function kasaB64(buf) {
  var u = new Uint8Array(buf), s = '';
  for (var i = 0; i < u.length; i++) { s += String.fromCharCode(u[i]); }
  return btoa(s);
}
function kasaBayt(b64) {
  var s = atob(b64), u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) { u[i] = s.charCodeAt(i); }
  return u;
}
function kasaEsc(s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
function kasaVar() { try { return !!localStorage.getItem(KASA_DEPO); } catch (e) { return false; } }
function kasaOku() { try { return JSON.parse(localStorage.getItem(KASA_DEPO) || 'null'); } catch (e) { return null; } }

function kasaAnahtarYap(sifre, tuz) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(sifre), 'PBKDF2', false, ['deriveKey'])
    .then(function (km) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: tuz, iterations: KASA_TUR, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
}

function kasaYaz() {
  if (!KASA.anahtar || !KASA.tuz) { return Promise.reject(new Error('kasa kilitli')); }
  var enc = new TextEncoder();
  var veri = enc.encode(JSON.stringify(KASA.liste));
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, KASA.anahtar, veri).then(function (sifreli) {
    localStorage.setItem(KASA_DEPO, JSON.stringify({
      tuz: kasaB64(KASA.tuz), iv: kasaB64(iv), veri: kasaB64(sifreli), surum: 1
    }));
  });
}

function kasaKur(sifre) {
  KASA.tuz = crypto.getRandomValues(new Uint8Array(16));
  KASA.liste = [];
  return kasaAnahtarYap(sifre, KASA.tuz).then(function (a) {
    KASA.anahtar = a; KASA.acik = true;
    return kasaYaz().then(function () { kasaCiz(); });
  });
}

function kasaAc(sifre) {
  var k = kasaOku();
  if (!k || !k.tuz || !k.iv || !k.veri) { return Promise.reject(new Error('kasa bulunamadı')); }
  var tuz = kasaBayt(k.tuz), iv = kasaBayt(k.iv), sifreli = kasaBayt(k.veri);
  return kasaAnahtarYap(sifre, tuz).then(function (a) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, a, sifreli).then(function (acik) {
      KASA.anahtar = a; KASA.tuz = tuz;
      KASA.liste = JSON.parse(new TextDecoder().decode(acik)) || [];
      KASA.acik = true;
      return KASA.liste.length;
    });
  });
}

function kasaKapat() {
  KASA.anahtar = null; KASA.tuz = null; KASA.liste = []; KASA.acik = false;
  KASA.duzenle = -1; KASA.kategori = 'hepsi'; KASA.ara = '';
  if (KASA.zaman) { clearTimeout(KASA.zaman); KASA.zaman = null; }
  kasaOynDurdur();
  /* kilitleyince sesi normale döndür: açtığında sessiz kalmasın */
  var vv = document.getElementById('kasaVideo');
  if (vv) { vv.muted = false; }
  var sb = document.getElementById('kasaSesBtn');
  if (sb) { sb.innerHTML = '&#128266; SES AÇIK'; }
  /* ÖNEMLİ: kilitleyince liste DOM'dan da SİLİNİR. Sadece gizlemek yetmez —
     F12 / kaynak görüntüle ile bağlantılar okunabilirdi. */
  var k = document.getElementById('kasaListe');
  if (k) { k.innerHTML = ''; }
  var f = document.getElementById('kasaForm');
  if (f) { f.style.display = 'none'; }
  var r = document.getElementById('kasaKatlar');
  if (r) { r.innerHTML = ''; }
  kasaCiz();
}

function kasaDokun() {
  if (!KASA.acik) { return; }
  if (KASA.zaman) { clearTimeout(KASA.zaman); }
  KASA.zaman = setTimeout(function () {
    kasaKapat();
    kasaYaz2('kasa 5 dakika işlem olmadığı için kendini kilitledi');
  }, KASA_BEKLEME);
}

function kasaYaz2(s) { var e = document.getElementById('kasaDurum'); if (e) { e.textContent = s; } }
function kasaOynYaz(s) { var e = document.getElementById('kasaOynDurum'); if (e) { e.textContent = s; } }

/* =============================== HTML =============================== */
function kasaHTML() {
  return ''
  + '<div class="kasaKutu" id="kasaKutu">'
  +   '<div class="kasaBas">'
  +     '<span class="kasaAd">&#128279; ÖZEL BAĞLANTILAR KASASI</span>'
  +     '<span class="kasaRozet" id="kasaRozet">KİLİTLİ</span>'
  +   '</div>'

  +   '<div id="kasaGiris" class="kasaGiris">'
  +     '<input class="iptvInput" id="kasaSifre" type="password" autocomplete="new-password" placeholder="kasa şifresi">'
  +     '<input class="iptvInput" id="kasaSifre2" type="password" autocomplete="new-password" placeholder="şifre (tekrar)" style="display:none">'
  +     '<button class="buton" id="kasaAcBtn" type="button">&#128275; AÇ</button>'
  +     '<span class="kasaNot" id="kasaNot"></span>'
  +   '</div>'

  +   '<div id="kasaIci" style="display:none">'
  +     '<div class="kasaLinkSar">'
  +       '<input class="iptvInput" id="kasaLink" type="text" spellcheck="false" '
  +         'placeholder="yayın bağlantısı (.m3u8 / mp3 / mp4)  ya da  liste (.m3u)">'
  +       '<button class="buton" id="kasaCalistirBtn" type="button">&#9654; ÇALIŞTIR</button>'
  +       '<button class="buton ikincil" id="kasaDurdurBtn" type="button">&#9632; DURDUR</button>'
  +       '<button class="buton ikincil" id="kasaKontrolBtn" type="button">&#128269; KONTROL</button>'
  +       '<button class="buton ikincil" id="kasaDosyaBtn" type="button">&#128194; DOSYADAN YÜKLE</button>'
  +       '<input type="file" id="kasaDosya" accept=".m3u,.m3u8,.txt,audio/x-mpegurl,application/vnd.apple.mpegurl" style="display:none">'
  +     '</div>'

  +     '<div class="kasaArac">'
  +       '<button class="buton" id="kasaEkleBtn" type="button">&#43; KANAL EKLE</button>'
  +       '<button class="buton ikincil" id="kasaSesBtn" type="button">&#128266; SES AÇIK</button>'
  +       '<button class="buton ikincil" id="kasaHepsiBtn" type="button">HEPSİNİ KALDIR</button>'
  +       '<button class="buton ikincil" id="kasaKapatBtn" type="button">&#128274; KİLİTLE</button>'
  +       '<span class="kasaDurum" id="kasaDurum"></span>'
  +     '</div>'

  +     '<div class="kasaForm" id="kasaForm" style="display:none">'
  +       '<input class="iptvInput" id="kasaAd" type="text" placeholder="ad (ör. Yayın 1)">'
  +       '<input class="iptvInput" id="kasaUrl" type="text" spellcheck="false" placeholder="bağlantı (.m3u8 / mp3 / mp4)">'
  +       '<input class="iptvInput kucuk" id="kasaGrup" type="text" placeholder="kategori">'
  +       '<button class="buton" id="kasaKaydetBtn" type="button">KAYDET</button>'
  +       '<button class="buton ikincil" id="kasaIptalBtn" type="button">İPTAL</button>'
  +     '</div>'

  +     '<div class="kasaDuzen">'
  +       '<div class="kasaSol">'
  +         '<div class="kasaSahne">'
  +           '<video id="kasaVideo" controls playsinline preload="none"></video>'
  +           '<div class="iptvBos" id="kasaBos">kayıttan seç &rarr; &#9654;<br><small>çift tıkla &rarr; tam ekran</small></div>'
  +         '</div>'
  +         '<div class="kasaOynSatir">'
  +           '<span class="kasaOynDurum" id="kasaOynDurum">hazır</span>'
  +         '</div>'
  +       '</div>'
  +       '<div class="kasaSag">'
  +         '<div class="kasaBolumBas"><span>KAYITLAR</span>'
  +           '<span class="soluk" id="kasaSayac"></span>'
  +           '<input class="iptvInput kucuk" id="kasaAra" type="text" placeholder="ara">'
  +         '</div>'
  +         '<div class="kasaKatSar" id="kasaKatlar"></div>'
  +         '<div class="kasaListe" id="kasaListe"></div>'
  +       '</div>'
  +     '</div>'
  +   '</div>'

  +   '</div>'
  + '</div>';
}

/* ============================ kasa oynatıcısı ============================ */
function kasaOynDurdur() {
  if (KASA.hls) { try { KASA.hls.destroy(); } catch (e) {} KASA.hls = null; }
  KASA.hlsYedek = null; KASA.hlsYedekDenendi = false;
  var v = document.getElementById('kasaVideo');
  if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
  var b = document.getElementById('kasaBos');
  if (b) { b.style.display = 'flex'; }
  KASA.oynUrl = ''; KASA.oynAd = '';
  kasaOynYaz('hazır');
}

function kasaKalite() {
  if (!KASA.hls || !KASA.hls.levels || !KASA.hls.levels.length) { return ''; }
  var i = KASA.hls.currentLevel;
  if (i < 0) { return 'otomatik'; }
  var h = KASA.hls.levels[i] && KASA.hls.levels[i].height;
  return h ? (h + 'p') : 'otomatik';
}

/* Listedeki kaydı oynatır */
function kasaOynat(i) {
  var c = KASA.liste[i];
  if (!c) { return; }
  kasaOynatUrl(c.url, c.ad || '');
}

function kasaHlsBaslat(u) {
  var v = document.getElementById('kasaVideo');
  if (!v) { return; }
  if (typeof hlsYukle !== 'function') { v.src = u; var pd = v.play(); if (pd && pd.catch) { pd.catch(function () {}); } return; }
  hlsYukle().then(function (Hls) {
    if (!Hls || !Hls.isSupported()) {
      if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = u; var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
      else { kasaOynYaz('bu tarayıcı m3u8 oynatamıyor'); }
      return;
    }
    var h = new Hls({ enableWorker: true, maxBufferLength: 30 });
    KASA.hls = h;
    h.loadSource(u);
    h.attachMedia(v);
    h.on(Hls.Events.MANIFEST_PARSED, function () { var pp = v.play(); if (pp && pp.catch) { pp.catch(function () {}); } });
    h.on(Hls.Events.ERROR, function (ev, d) {
      if (!d || !d.fatal) { return; }
      if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
        kasaOynYaz('açılamadı — yayın kapalı ya da CORS izni yok (UÇAKLI başlatıcıyı dene)');
        kasaOynDurdur();
      } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
        try { h.recoverMediaError(); kasaOynYaz('görüntü hatası — kurtarılıyor…'); } catch (e) { kasaOynYaz('görüntü açılamadı'); }
      } else { kasaOynYaz('açılamadı'); kasaOynDurdur(); }
    });
  }).catch(function () { kasaOynYaz('oynatıcı yüklenemedi'); });
}

/* ========================= kategori + liste ========================= */
function kasaKategoriler() {
  var s = {}, i;
  for (i = 0; i < KASA.liste.length; i++) {
    var g = (KASA.liste[i].grup || '').trim() || 'Genel';
    s[g] = (s[g] || 0) + 1;
  }
  var c = [];
  for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) { c.push([k, s[k]]); } }
  c.sort(function (a, b) { return b[1] - a[1]; });
  return c;
}

function kasaKategoriCiz() {
  var k = document.getElementById('kasaKatlar');
  if (!k) { return; }
  if (!KASA.liste.length) { k.innerHTML = ''; return; }
  var kat = kasaKategoriler();
  var h = '<span class="iptvKat' + (KASA.kategori === 'hepsi' ? ' sec' : '') + '" data-kg="hepsi">HEPSİ <b>' + KASA.liste.length + '</b></span>';
  for (var i = 0; i < kat.length; i++) {
    h += '<span class="iptvKat' + (KASA.kategori === kat[i][0] ? ' sec' : '') + '" data-kg="' + kasaEsc(kat[i][0]) + '">'
       + kasaEsc(kat[i][0]) + ' <b>' + kat[i][1] + '</b></span>';
  }
  k.innerHTML = h;
}

function kasaListeCiz() {
  var k = document.getElementById('kasaListe');
  if (!k) { return; }
  if (!KASA.liste.length) {
    k.innerHTML = '<div class="soluk kasaBos">kasa boş — “+ YENİ BAĞLANTI” ile ekle</div>';
    var sc0 = document.getElementById('kasaSayac'); if (sc0) { sc0.textContent = ''; }
    kasaKategoriCiz();
    return;
  }
  var ara = (KASA.ara || '').toLowerCase();
  var n = 0;
  var h = '<table class="iptvTablo"><thead><tr><th>#</th><th>AD</th><th>KATEGORİ</th><th>İŞLEM</th></tr></thead><tbody>';
  for (var i = 0; i < KASA.liste.length; i++) {
    var c = KASA.liste[i];
    var gr = (c.grup || '').trim() || 'Genel';
    if (KASA.kategori !== 'hepsi' && gr !== KASA.kategori) { continue; }
    if (ara && ((c.ad || '') + ' ' + gr).toLowerCase().indexOf(ara) < 0) { continue; }
    n++;
    var aktif = (KASA.oynUrl && c.url === KASA.oynUrl);
    h += '<tr class="' + (aktif ? 'iptvAktif' : '') + '">'
      +   '<td class="iptvSira">' + n + '</td>'
      +   '<td class="iptvCAd">' + kasaEsc(c.ad || 'kayıt') + '</td>'
      +   '<td class="iptvCGrup">' + kasaEsc(gr) + '</td>'
      +   '<td class="iptvCIslem">'
      +     '<button class="iptvIkon" data-koyna="' + i + '" title="Oynat">&#9654;</button>'
      +     '<button class="iptvIkon" data-kkopya="' + i + '" title="Bağlantıyı kopyala">&#128203;</button>'
      +     '<button class="iptvIkon sil" data-ksil="' + i + '" title="Kaldır">&times;</button>'
      +   '</td></tr>';
  }
  h += '</tbody></table>';
  k.innerHTML = h;
  var sc = document.getElementById('kasaSayac');
  if (sc) {
    sc.textContent = (KASA.kategori === 'hepsi' ? n + ' kayıt' : n + ' / ' + KASA.liste.length + ' kayıt')
      + (KASA.kategori !== 'hepsi' ? ' · ' + KASA.kategori : '');
  }
  kasaKategoriCiz();
}

/* ============================== çizim ============================== */
function kasaCiz() {
  var g = document.getElementById('kasaGiris'), i = document.getElementById('kasaIci');
  var r = document.getElementById('kasaRozet');
  if (!g || !i) { return; }
  if (KASA.acik) {
    g.style.display = 'none'; i.style.display = 'block';
    if (r) { r.textContent = 'AÇIK'; r.className = 'kasaRozet acik'; }
    kasaListeCiz();
    kasaDokun();
  } else {
    g.style.display = 'flex'; i.style.display = 'none';
    if (r) { r.textContent = 'KİLİTLİ'; r.className = 'kasaRozet'; }
    var s2 = document.getElementById('kasaSifre2');
    if (s2) { s2.style.display = kasaVar() ? 'none' : 'inline-block'; }
    var b = document.getElementById('kasaAcBtn');
    if (b) { b.innerHTML = kasaVar() ? '&#128275; AÇ' : '&#128273; OLUŞTUR'; }
    var n = document.getElementById('kasaNot');
    if (n) { n.textContent = kasaVar() ? '' : 'ilk kullanım: bir şifre belirle'; }
  }
}

/* ============================== işlemler ============================== */
function kasaEkle() {
  var a = document.getElementById('kasaAd'), u = document.getElementById('kasaUrl'), g = document.getElementById('kasaGrup');
  var ad = a ? String(a.value || '').trim() : '';
  var url = u ? String(u.value || '').trim() : '';
  var gr = g ? String(g.value || '').trim() : '';
  if (!url) { kasaYaz2('⚠ bağlantı boş'); return; }
  if (!/^https?:\/\//i.test(url)) { url = 'https://' + url; }
  if (!ad) { ad = 'kayıt ' + (KASA.liste.length + 1); }
  if (KASA.duzenle >= 0 && KASA.duzenle < KASA.liste.length) {
    KASA.liste[KASA.duzenle] = { ad: ad, url: url, grup: gr || 'Genel' };
    KASA.duzenle = -1;
  } else {
    KASA.liste.push({ ad: ad, url: url, grup: gr || 'Genel' });
  }
  if (a) { a.value = ''; } if (u) { u.value = ''; } if (g) { g.value = ''; }
  kasaYaz().then(function () {
    kasaListeCiz();
    kasaYaz2('✔ kaydedildi ve şifrelendi');
    var f = document.getElementById('kasaForm'); if (f) { f.style.display = 'none'; }
  }).catch(function (e) { kasaYaz2('✘ kaydedilemedi: ' + e); });
}

function kasaSil(i) {
  if (i < 0 || i >= KASA.liste.length) { return; }
  var c = KASA.liste[i];
  if (c && KASA.oynUrl && c.url === KASA.oynUrl) { kasaOynDurdur(); }
  KASA.liste.splice(i, 1);
  kasaYaz().then(function () { kasaListeCiz(); kasaYaz2('kayıt silindi'); });
}

function kasaKopyala(i) {
  var c = KASA.liste[i];
  if (!c) { return; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(c.url).then(function () { kasaYaz2('bağlantı panoya kopyalandı'); },
        function () { kasaYaz2('kopyalanamadı'); });
    } else { kasaYaz2('bu tarayıcı pano izni vermedi'); }
  } catch (e) { kasaYaz2('kopyalanamadı'); }
}

/* ============ kasa araçları: çalıştır · kontrol · dosya · ses · hepsi ============ */

/* Yazılan bağlantıyı doğrudan oynatır (kasaya kaydetmez).
   .m3u liste verdiyse indirip kasaya aktarır. */
function kasaCalistir() {
  var i = document.getElementById('kasaLink');
  var u = i ? String(i.value || '').trim() : '';
  if (!u) { kasaYaz2('⚠ önce bir bağlantı yapıştır'); return; }
  if (/^(rtsp|rtmpe|rtmp|rtmps|mms):/i.test(u)) { kasaYaz2('✘ rtsp/rtmp tarayıcıda oynatılamaz'); return; }
  if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; if (i) { i.value = u; } }
  if (/\.m3u(\?|#|$)/i.test(u) && !/\.m3u8/i.test(u)) { kasaListeIndir(u); return; }
  kasaOynatUrl(u, 'elle');
  kasaYaz2('▶ oynatılıyor');
}

function kasaOynatUrl(u, ad) {
  var v = document.getElementById('kasaVideo');
  if (!v) { return; }
  if (/^(rtsp|rtmpe|rtmp|rtmps|mms):/i.test(u)) { kasaOynYaz('✘ rtsp/rtmp tarayıcıda oynatılamaz'); return; }
  var li = document.getElementById('kasaLink');
  if (li) { li.value = u; }
  kasaOynDurdur();
  KASA.oynUrl = u; KASA.oynAd = ad || '';
  var b = document.getElementById('kasaBos'); if (b) { b.style.display = 'none'; }
  kasaOynYaz('bağlanıyor…');
  kasaListeCiz();
  kasaDokun();
  if (/\.(mp4|m4v|webm|ogv|ogg|mp3|m4a|aac|mov)(\?|#|$)/i.test(u)) {
    v.src = u; var p0 = v.play(); if (p0 && p0.catch) { p0.catch(function () {}); } return;
  }
  var uzantisiz = !/\.[a-z0-9]{2,4}(\?|#|$)/i.test(u);
  if (uzantisiz && !/\.ts(\?|#|$)/i.test(u)) {
    KASA.hlsYedek = u;
    v.onerror = function () {
      if (KASA.hlsYedek && !KASA.hlsYedekDenendi) {
        KASA.hlsYedekDenendi = true;
        kasaOynYaz('düz yayın değilmiş — HLS olarak deneniyor…');
        kasaHlsBaslat(KASA.hlsYedek);
        return;
      }
      kasaOynYaz('açılamadı — yayın kapalı ya da CORS izni yok (UÇAKLI başlatıcıyı dene)');
    };
    v.src = u; var pu = v.play(); if (pu && pu.catch) { pu.catch(function () {}); } return;
  }
  kasaHlsBaslat(u);
}

/* Bağlantı canlı mı? (ana kutudaki KONTROL ile aynı iş) */
function kasaKontrol() {
  var i = document.getElementById('kasaLink');
  var u = i ? String(i.value || '').trim() : '';
  if (!u) { kasaYaz2('⚠ önce bir bağlantı yapıştır'); return; }
  if (/^(rtsp|rtmpe|rtmp|rtmps|mms):/i.test(u)) { kasaYaz2('✘ rtsp/rtmp tarayıcıda oynatılamaz'); return; }
  if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; if (i) { i.value = u; } }
  kasaYaz2('🔍 kontrol ediliyor…');
  var t0 = Date.now();
  var kont = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var zaman = setTimeout(function () { if (kont) { try { kont.abort(); } catch (e) {} } }, 8000);
  var sec = kont ? { cache: 'no-store', signal: kont.signal } : { cache: 'no-store' };
  fetch(u, sec).then(function (c) {
    clearTimeout(zaman);
    var ms = Date.now() - t0;
    return c.text().then(function (m) {
      var hls = m.indexOf('#EXTM3U') >= 0, liste = m.indexOf('#EXTINF') >= 0;
      var kalite = (m.match(/#EXT-X-STREAM-INF/g) || []).length;
      if (hls || liste) {
        kasaYaz2('✔ erişildi (' + ms + ' ms) · ' + (liste ? 'IPTV çalma listesi' : 'HLS yayını')
          + (kalite ? ' · ' + kalite + ' kalite' : '') + ' · ÇALIŞTIR ile oynar');
      } else {
        kasaYaz2('⚠ erişildi (' + ms + ' ms) ama yayın dosyası değil · HTTP ' + c.status);
      }
    });
  }).catch(function (e) {
    clearTimeout(zaman);
    var ms1 = Date.now() - t0;
    /* fetch engellendiyse (CORS) oynatıcıyla yokla: CORS video etiketini engellemez */
    kasaYaz2('🔍 izin yok (' + ms1 + ' ms) — oynatıcıyla deneniyor…');
    medyaDenetle(u, 9000).then(function (s) {
      if (s === 'oynar') {
        kasaYaz2('✔ yayın VAR ve oynuyor · yayıncı sayfa erişimine izin vermiyor (CORS) — '
          + 'liste olarak çalışmayabilir, UÇAKLI başlatıcıyı dene');
      } else if (s === 'hata') {
        kasaYaz2('✘ yayın yok — bağlantı ölü ya da biçim desteklenmiyor');
      } else {
        kasaYaz2('⚠ cevap gelmedi (zaman aşımı) — yayın yavaş ya da kapalı');
      }
    });
  });
}

/* Bir bağlantıyı gizli bir <video> ile yoklar. Yayıncının "başka sayfada
   göster" izni (CORS) olmasa bile video etiketi yayını açabildiği için
   gerçek durumu söyler: 'oynar' | 'hata' | 'zaman' */
function medyaDenetle(u, azamiMs) {
  return new Promise(function (res) {
    var v = document.createElement('video');
    v.muted = true; v.preload = 'metadata'; v.setAttribute('playsinline', '');
    v.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;';
    document.body.appendChild(v);
    var bitti = false;
    function temiz(sonuc) {
      if (bitti) { return; }
      bitti = true;
      try { v.removeAttribute('src'); v.load(); } catch (e) {}
      try { v.parentNode.removeChild(v); } catch (e) {}
      res(sonuc);
    }
    var z = setTimeout(function () { temiz('zaman'); }, azamiMs || 9000);
    v.onloadedmetadata = function () { clearTimeout(z); temiz('oynar'); };
    v.oncanplay = function () { clearTimeout(z); temiz('oynar'); };
    v.onerror = function () { clearTimeout(z); temiz('hata'); };
    v.src = u;
    var p = v.play(); if (p && p.catch) { p.catch(function () {}); }
  });
}

/* .m3u dosyasını KASAYA aktarır — kanallar şifrelenerek saklanır */
function kasaMetniAktar(metin, kaynakAd) {
  var m = String(metin || '');
  if (m.indexOf('#EXTINF') < 0) { kasaYaz2('✘ ' + (kaynakAd || 'dosya') + ' içinde kanal bulunamadı'); return 0; }
  var l = (typeof iptvListeCoz === 'function') ? iptvListeCoz(m, '') : [];
  if (!l.length) { kasaYaz2('✘ kanal çıkarılamadı'); return 0; }
  var varOlan = {}, i, yeni = 0;
  for (i = 0; i < KASA.liste.length; i++) { varOlan[KASA.liste[i].url] = 1; }
  for (i = 0; i < l.length && KASA.liste.length < 600; i++) {
    if (varOlan[l[i].url]) { continue; }
    KASA.liste.push({ ad: l[i].ad, url: l[i].url, grup: l[i].grup || 'Genel' });
    varOlan[l[i].url] = 1; yeni++;
  }
  KASA.kategori = 'hepsi';
  kasaYaz().then(function () {
    kasaListeCiz();
    kasaYaz2('📂 ' + (kaynakAd || 'liste') + ' · ' + l.length + ' kanal bulundu, ' + yeni + ' yeni eklendi');
  });
  return yeni;
}

function kasaDosyaSec() {
  var g = document.getElementById('kasaDosya');
  if (!g) { return; }
  g.value = '';
  g.click();
}

function kasaDosyaOku(dosya) {
  if (!dosya) { return; }
  kasaYaz2('dosya okunuyor: ' + dosya.name);
  var ok = new FileReader();
  ok.onload = function (ev) {
    var buf = ev.target.result, metin = '';
    try { metin = new TextDecoder('utf-8').decode(buf); } catch (e) {}
    if (!metin || metin.indexOf('\uFFFD') >= 0) {
      try { var alt = new TextDecoder('windows-1254').decode(buf); if (alt && alt.indexOf('\uFFFD') < 0) { metin = alt; } } catch (e2) {}
    }
    kasaMetniAktar(metin, dosya.name);
  };
  ok.onerror = function () { kasaYaz2('✘ dosya okunamadı'); };
  ok.readAsArrayBuffer(dosya);
}

/* .m3u liste bağlantısını indirip kasaya aktarır */
function kasaListeIndir(u) {
  kasaYaz2('liste indiriliyor…');
  fetch(u, { cache: 'no-store' }).then(function (c) { return c.text(); }).then(function (m) {
    if (m.indexOf('#EXTINF') < 0) { kasaOynatUrl(u, 'liste'); return; }
    kasaMetniAktar(m, 'liste');
  }).catch(function () {
    kasaYaz2('liste indirilemedi (CORS) — doğrudan oynatılıyor');
    kasaOynatUrl(u, 'liste');
  });
}

/* ses aç / kapa */
function kasaSesAcKapa() {
  var v = document.getElementById('kasaVideo');
  if (!v) { return; }
  v.muted = !v.muted;
  var b = document.getElementById('kasaSesBtn');
  if (b) { b.innerHTML = v.muted ? '&#128263; SES KAPALI' : '&#128266; SES AÇIK'; }
  kasaYaz2(v.muted ? 'ses kapatıldı' : 'ses açıldı');
  kasaDokun();
}

/* hepsini kaldır */
function kasaTemizle() {
  kasaOynDurdur();
  KASA.liste = []; KASA.kategori = 'hepsi'; KASA.ara = '';
  var a = document.getElementById('kasaAra'); if (a) { a.value = ''; }
  kasaYaz().then(function () { kasaListeCiz(); kasaYaz2('kasa temizlendi'); });
}

function kasaHepsiSil() {
  if (!KASA.liste.length) { kasaYaz2('kasa zaten boş'); return; }
  if (!confirm('Kasadaki ' + KASA.liste.length + ' kaydın hepsi silinsin mi? Bu geri alınamaz.')) { return; }
  kasaTemizle();
}

function kasaKur2() {
  var s1 = document.getElementById('kasaSifre'), s2 = document.getElementById('kasaSifre2');
  var a = s1 ? String(s1.value || '') : '';
  var b = s2 ? String(s2.value || '') : '';
  if (a.length < 4) { kasaYaz2('⚠ şifre en az 4 karakter olsun'); return; }
  if (a !== b) { kasaYaz2('⚠ iki şifre aynı değil'); return; }
  kasaYaz2('kasa oluşturuluyor…');
  kasaKur(a).then(function () {
    if (s1) { s1.value = ''; } if (s2) { s2.value = ''; }
    kasaCiz();
    kasaYaz2('✔ kasa oluşturuldu — bu şifreyi unutma');
  }).catch(function (e) { kasaYaz2('✘ oluşturulamadı: ' + e); });
}

function kasaAc2() {
  var s1 = document.getElementById('kasaSifre');
  var a = s1 ? String(s1.value || '') : '';
  if (!a) { kasaYaz2('⚠ şifre gir'); return; }
  if (!kasaVar()) { kasaKur2(); return; }
  kasaYaz2('açılıyor…');
  kasaAc(a).then(function (n) {
    if (s1) { s1.value = ''; }
    kasaCiz();
    kasaYaz2('kasa açıldı · ' + n + ' kayıt');
  }).catch(function () {
    if (s1) { s1.value = ''; }
    kasaYaz2('✘ şifre yanlış');
  });
}

function kasaKur2Dugmeler() {
  var ac = document.getElementById('kasaAcBtn');
  var ekle = document.getElementById('kasaEkleBtn');
  var kapat = document.getElementById('kasaKapatBtn');
  var kaydet = document.getElementById('kasaKaydetBtn');
  var iptal = document.getElementById('kasaIptalBtn');
  var s1 = document.getElementById('kasaSifre');
  var liste = document.getElementById('kasaListe');
  var durdur = document.getElementById('kasaDurdurBtn');
  var katlar = document.getElementById('kasaKatlar');
  var ara = document.getElementById('kasaAra');
  var v = document.getElementById('kasaVideo');
  if (!ac) { return; }

  ac.onclick = function () { kasaAc2(); };
  s1.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); kasaAc2(); } };

  /* ---- yeni tam düğme seti ---- */
  var link = document.getElementById('kasaLink');
  var calistir = document.getElementById('kasaCalistirBtn');
  var kontrol = document.getElementById('kasaKontrolBtn');
  var dosyaBtn = document.getElementById('kasaDosyaBtn');
  var dosyaGiz = document.getElementById('kasaDosya');
  var sesBtn = document.getElementById('kasaSesBtn');
  var hepsiBtn = document.getElementById('kasaHepsiBtn');
  if (calistir) { calistir.onclick = function () { kasaCalistir(); }; }
  if (kontrol) { kontrol.onclick = function () { kasaKontrol(); }; }
  if (dosyaBtn) { dosyaBtn.onclick = function () { kasaDosyaSec(); }; }
  if (dosyaGiz) { dosyaGiz.onchange = function () { kasaDosyaOku(dosyaGiz.files && dosyaGiz.files[0]); }; }
  if (sesBtn) { sesBtn.onclick = function () { kasaSesAcKapa(); }; }
  if (hepsiBtn) { hepsiBtn.onclick = function () { kasaHepsiSil(); }; }
  if (link) { link.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); kasaCalistir(); } }; }
  if (link) { link.oninput = function () { kasaDokun(); }; }
  if (ekle) {
    ekle.onclick = function () {
      var f = document.getElementById('kasaForm');
      f.style.display = (f.style.display === 'none' || !f.style.display) ? 'flex' : 'none';
      KASA.duzenle = -1;
    };
  }
  if (kaydet) { kaydet.onclick = function () { kasaEkle(); }; }
  if (iptal) { iptal.onclick = function () { var f = document.getElementById('kasaForm'); if (f) { f.style.display = 'none'; } }; }
  if (kapat) { kapat.onclick = function () { kasaKapat(); kasaYaz2('kasa kilitlendi'); }; }
  if (durdur) { durdur.onclick = function () { kasaOynDurdur(); }; }
  if (ara) { ara.oninput = function () { KASA.ara = String(ara.value || ''); kasaListeCiz(); }; }

  if (katlar) {
    katlar.onclick = function (e) {
      var t = e.target;
      while (t && t !== katlar && !t.getAttribute('data-kg')) { t = t.parentNode; }
      if (t && t.getAttribute && t.getAttribute('data-kg') !== null) {
        KASA.kategori = t.getAttribute('data-kg');
        kasaListeCiz();
      }
    };
  }

  liste.onclick = function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) { return; }
    if (t.getAttribute('data-koyna') !== null) { kasaOynat(parseInt(t.getAttribute('data-koyna'), 10)); return; }
    if (t.getAttribute('data-kkopya') !== null) { kasaKopyala(parseInt(t.getAttribute('data-kkopya'), 10)); return; }
    if (t.getAttribute('data-ksil') !== null) { kasaSil(parseInt(t.getAttribute('data-ksil'), 10)); return; }
  };

  if (v) {
    v.onplaying = function () { kasaOynYaz('çalıyor · ' + (KASA.oynAd || '') + (kasaKalite() ? ' · ' + kasaKalite() : '')); };
    v.onwaiting = function () { kasaOynYaz('tampon…'); };
    v.ondblclick = function (ev) {
      ev.preventDefault();
      if (document.fullscreenElement) { if (document.exitFullscreen) { document.exitFullscreen(); } return; }
      if (v.requestFullscreen) { v.requestFullscreen(); }
      else if (v.webkitRequestFullscreen) { v.webkitRequestFullscreen(); }
    };
  }

  document.getElementById('kasaKutu').addEventListener('click', function () { kasaDokun(); });
  document.getElementById('kasaKutu').addEventListener('keydown', function () { kasaDokun(); });

  kasaCiz();
}

/* Ölçüm/test için */
window.KASA_API = {
  varMi: function () { return kasaVar(); },
  kur: function (s) { return kasaKur(s); },
  ac: function (s) { return kasaAc(s); },
  kapat: function () { kasaKapat(); },
  ekle: function (ad, u, g) {
    var a = document.getElementById('kasaAd'), b = document.getElementById('kasaUrl'), c = document.getElementById('kasaGrup');
    if (a) { a.value = ad || ''; } if (b) { b.value = u || ''; } if (c) { c.value = g || ''; }
    kasaEkle();
  },
  adet: function () { return KASA.liste.length; },
  acik: function () { return KASA.acik; },
  adlar: function () { return KASA.liste.map(function (x) { return x.ad; }); },
  ilkUrl: function () { return KASA.liste[0] ? KASA.liste[0].url : null; },
  oynat: function (i) { kasaOynat(i); },
  durdur: function () { kasaOynDurdur(); },
  kategoriSec: function (g) { KASA.kategori = g; kasaListeCiz(); },
  kategoriListe: function () { return kasaKategoriler(); },
  ara: function (s) { KASA.ara = s; var e = document.getElementById('kasaAra'); if (e) { e.value = s; } kasaListeCiz(); },
  durum: function () { var e = document.getElementById('kasaDurum'); return e ? e.textContent : null; },
  oynDurum: function () { var e = document.getElementById('kasaOynDurum'); return e ? e.textContent : null; },
  ciz: function () { kasaCiz(); },
  rozet: function () { var e = document.getElementById('kasaRozet'); return e ? e.textContent : null; },
  gorunurAdet: function () { return document.querySelectorAll('#kasaListe tbody tr').length; },
  depo: function () { return localStorage.getItem(KASA_DEPO); },
  videoVar: function () { return !!document.getElementById('kasaVideo'); },
  katCipVar: function () { return document.querySelectorAll('#kasaKatlar .iptvKat').length; },
  katmanVar: function () { var e = document.getElementById('kasaKatlar'); return !!e; },
  video: function () {
    var v = document.getElementById('kasaVideo');
    return v ? { readyState: v.readyState, duraklatildi: v.paused, sessiz: v.muted, sure: +(v.currentTime || 0).toFixed(2) } : null;
  },
  /* --- tam düğme seti kancaları --- */
  linkVar: function () { return !!document.getElementById('kasaLink'); },
  calistirVar: function () { return !!document.getElementById('kasaCalistirBtn'); },
  durdurVar: function () { return !!document.getElementById('kasaDurdurBtn'); },
  kontrolVar: function () { return !!document.getElementById('kasaKontrolBtn'); },
  dosyaBtnVar: function () { return !!document.getElementById('kasaDosyaBtn'); },
  dosyaGirisVar: function () { var g = document.getElementById('kasaDosya'); return !!(g && g.type === 'file'); },
  ekleBtnVar: function () { return !!document.getElementById('kasaEkleBtn'); },
  sesBtnVar: function () { return !!document.getElementById('kasaSesBtn'); },
  hepsiBtnVar: function () { return !!document.getElementById('kasaHepsiBtn'); },
  tamEkranVar: function () { var v = document.getElementById('kasaVideo'); return !!(v && v.ondblclick); },
  /* düğme metinleri (Kenan'ın istediği isimlerle) */
  dugmeler: function () {
    var s = ['kasaCalistirBtn', 'kasaDurdurBtn', 'kasaKontrolBtn', 'kasaDosyaBtn',
             'kasaEkleBtn', 'kasaSesBtn', 'kasaHepsiBtn', 'kasaKapatBtn'];
    var o = {};
    for (var i = 0; i < s.length; i++) {
      var e = document.getElementById(s[i]);
      o[s[i]] = e ? String(e.textContent || '').trim() : null;
    }
    return o;
  },
  calistir: function (u) { var i = document.getElementById('kasaLink'); if (i) { i.value = u || ''; } kasaCalistir(); },
  kontrol: function (u) { var i = document.getElementById('kasaLink'); if (i) { i.value = u || ''; } kasaKontrol(); },
  sesAcKapa: function () { kasaSesAcKapa(); return (document.getElementById('kasaVideo') || {}).muted; },
  sesBtnMetni: function () { var b = document.getElementById('kasaSesBtn'); return b ? String(b.textContent || '').trim() : null; },
  dosyaMetni: function (m, ad) { return kasaMetniAktar(m, ad || 'test.m3u'); },
  hepsiSilZorla: function () { kasaTemizle(); },
  linkMetni: function () { var i = document.getElementById('kasaLink'); return i ? i.value : null; },
  denetle: function (u, ms) { return medyaDenetle(u, ms || 9000); },
  butonSayisi: function () { return document.querySelectorAll('#kasaIci .buton').length; }
};
