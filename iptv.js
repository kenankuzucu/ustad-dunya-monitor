/* ============================================================================
   IPTV · KANAL MERKEZİ  —  yapıştır / listele / oynat / durdur / ekle / kaldır
   Kenan Kuzucu · ÜSTAD DÜNYA MONİTÖR          (DİĞER sekmesi — ön panelde GÖRÜNMEZ)

   · m3u8 / HLS yayını            → hls.js ile oynar (ustadtv.js'deki hlsYukle())
   · mp4 / doğrudan yayın         → <video src>
   · IPTV çalma listesi (.m3u)    → #EXTINF'leri çözer, KATEGORİ (group-title) ile tabloya dizer
   · tek kanal elle ekleme        → ad + bağlantı + kategori
   · tablo: # · KANAL · KATEGORİ · ▶ oynat · ✕ kaldır
   · kategori çipleriyle süzme · çal / durdur · kayıtlılar localStorage'da
   ============================================================================ */
var IPTV = {
  hls: null, url: '', ad: '', kanal: [], kaynak: [], kategori: 'hepsi',
  zaman: null, deneme: 0, tvSure: null, hlsYedek: null, hlsYedekDenendi: false
};

var IPTV_DEPO = { kanal: 'ustad_iptv_kanal', kaynak: 'ustad_iptv_kaynak', son: 'ustad_iptv_son' };

function iptvSakla() {
  try {
    localStorage.setItem(IPTV_DEPO.kanal, JSON.stringify(IPTV.kanal.slice(0, 600)));
    localStorage.setItem(IPTV_DEPO.kaynak, JSON.stringify(IPTV.kaynak.slice(0, 12)));
    localStorage.setItem(IPTV_DEPO.son, IPTV.url || '');
  } catch (e) {}
}
function iptvOku() {
  try {
    var k = JSON.parse(localStorage.getItem(IPTV_DEPO.kanal) || '[]');
    if (k && k.length) { IPTV.kanal = k; }
    var s = JSON.parse(localStorage.getItem(IPTV_DEPO.kaynak) || '[]');
    if (s && s.length) { IPTV.kaynak = s; }
    IPTV.url = localStorage.getItem(IPTV_DEPO.son) || '';
  } catch (e) {}
}
function iptvEsc(s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
function iptvYaz(s) { var e = document.getElementById('iptvDurum'); if (e) { e.textContent = s; } }
function iptvKisa(u) {
  u = String(u || '');
  try {
    var p = u.replace(/^https?:\/\//, '').split('/');
    var son = p.length > 1 ? p[p.length - 1].split('?')[0] : '';
    return (p[0] + (son ? ' · ' + son.slice(0, 20) : '')).slice(0, 44);
  } catch (e) { return u.slice(0, 44); }
}

/* =============================== HTML =============================== */
function iptvHTML() {
  iptvOku();
  return ''
  + '<div class="iptvKutu" id="iptvKutu">'
  +   '<div class="iptvBas">'
  +     '<span class="iptvAd">&#128225; IPTV &middot; KANAL MERKEZİ</span>'
  +     '<span class="iptvAlt">m3u8 / HLS &middot; IPTV listesi &middot; kategori &middot; tablo</span>'
  +   '</div>'

  +   '<div class="iptvGiris">'
  +     '<input class="iptvInput" id="iptvUrl" type="text" spellcheck="false" '
  +       'placeholder="yayın bağlantısı (.m3u8)  ya da  IPTV çalma listesi (.m3u)">'
  +     '<button class="buton" id="iptvGit" type="button">&#9654; ÇALIŞTIR</button>'
  +     '<button class="buton ikincil" id="iptvStop" type="button">&#9632; DURDUR</button>'
  +     '<button class="buton ikincil" id="iptvKontrolBtn" type="button">&#128269; KONTROL</button>'
  +     '<button class="buton ikincil" id="iptvDosyaBtn" type="button">&#128194; DOSYADAN YÜKLE</button>'
  +     '<button class="buton ikincil" id="iptvAcKapa" type="button">&#43; KANAL EKLE</button>'
  +     '<button class="buton ikincil" id="iptvSes" type="button">&#128266; SES AÇIK</button>'
  +     '<input type="file" id="iptvDosya" accept=".m3u,.m3u8,.txt,audio/x-mpegurl,application/vnd.apple.mpegurl,application/x-mpegurl" style="display:none">'
  +   '</div>'

  +   '<div class="iptvEkle" id="iptvEkle" style="display:none">'
  +     '<input class="iptvInput" id="iptvEAd" type="text" placeholder="kanal adı (TRT 1)">'
  +     '<input class="iptvInput" id="iptvEUrl" type="text" spellcheck="false" placeholder="yayın bağlantısı (.m3u8)">'
  +     '<input class="iptvInput kucuk" id="iptvEGrup" type="text" placeholder="kategori (Haber)">'
  +     '<button class="buton" id="iptvEKaydet" type="button">KAYDET</button>'
  +     '<button class="buton ikincil" id="iptvEIptal" type="button">İPTAL</button>'
  +   '</div>'

  +   '<div class="iptvCipSar" id="iptvCipSar"><span class="soluk">kayıtlı listeler:</span>'
  +     '<span id="iptvKaynaklar"></span></div>'

  +   '<div class="iptvDuzen">'
  +     '<div class="iptvSol">'
  +       '<div class="iptvSahne">'
  +         '<video id="iptvVideo" controls playsinline preload="none"></video>'
  +         '<div class="iptvBos" id="iptvBos">yayın bekleniyor&hellip;<br><small>yukarıya bağlantı yapıştır ya da sağdaki listeden kanal seç<br>çift tıkla &rarr; tam ekran</small></div>'
  +       '</div>'
  +       '<div class="iptvDizi">'
  +         '<div class="iptvDiziBas">&#127916; DİZİ &amp; FİLM <span class="soluk">yeni sekmede açılır</span></div>'
  +         '<div class="iptvDiziIzgara" id="iptvDiziIzgara"></div>'
  +       '</div>'
  +       '<div class="iptvSatir2">'
  +         '<span class="iptvDurum" id="iptvDurum">hazır</span>'
  +         '<span class="iptvSimdiki" id="iptvSimdiki"></span>'
  +       '</div>'
  +     '</div>'

  +     '<div class="iptvSag">'
  +       '<div class="iptvBolumBas"><span>KANALLAR</span>'
  +         '<span class="soluk" id="iptvSayac"></span>'
  +         '<button class="iptvMini" id="iptvKaydet" type="button">&#128190; LİSTEYİ KAYDET</button>'
  +         '<button class="iptvMini" id="iptvHepsi" type="button">HEPSİNİ KALDIR</button></div>'
  +       '<div class="iptvKatSar" id="iptvKatlar"></div>'
  +       '<div class="iptvTabloSar"><table class="iptvTablo"><thead><tr>'
  +         '<th>#</th><th>KANAL</th><th>KATEGORİ</th><th>İŞLEM</th>'
  +       '</tr></thead><tbody id="iptvGovde"></tbody></table></div>'
  +     '</div>'
  +   '</div>'

  +   '<div class="iptvUyari">&#9432; m3u8 / HLS ve IPTV listeleri oynatılır. '
  +     'Kanal açılmazsa yayıncı CORS izni vermiyordur; <b>USTAD-MONITOR-UCAKLI</b> başlatıcısıyla aç '
  +     '(koruma kapalı modda bu engel kalkar).</div>'

  +   (typeof kasaHTML === 'function' ? kasaHTML() : '')
  + '</div>';
}

/* Dizi/film kısayolları — adresler 19.09.2026'da tek tek açılarak doğrulandı.
   BluTV kapanmış (404), TRT İzle artık tabii.com'a yönleniyor. */
var IPTV_DIZI = [
  ['tabii',      'https://www.tabii.com/',              'ücretsiz · TRT yerli dizi'],
  ['Exxen',      'https://www.exxen.com/',              'ücretsiz bölüm + abonelik'],
  ['Gain',       'https://www.gain.tv/',                'abonelik'],
  ['MUBI',       'https://mubi.com/tr',                 'sinema · abonelik'],
  ['Netflix',    'https://www.netflix.com/tr/',         'abonelik'],
  ['Disney+',    'https://www.disneyplus.com/tr-tr',    'abonelik'],
  ['Prime Video','https://www.primevideo.com/',         'abonelik'],
  ['YouTube',    'https://www.youtube.com/',            'ücretsiz']
];

function iptvDiziYaz() {
  var k = document.getElementById('iptvDiziIzgara');
  if (!k) { return; }
  var h = '';
  for (var i = 0; i < IPTV_DIZI.length; i++) {
    h += '<a class="iptvDiziKart" target="_blank" rel="noopener" href="' + iptvEsc(IPTV_DIZI[i][1]) + '">'
       +   '<b>' + iptvEsc(IPTV_DIZI[i][0]) + '</b>'
       +   '<span>' + iptvEsc(IPTV_DIZI[i][2]) + '</span></a>';
  }
  k.innerHTML = h;
}

/* ============================ tablo + kategori ============================ */
function iptvKategoriler() {
  var s = {}, i;
  for (i = 0; i < IPTV.kanal.length; i++) {
    var g = (IPTV.kanal[i].grup || '').trim() || 'Genel';
    s[g] = (s[g] || 0) + 1;
  }
  var c = [];
  for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) { c.push([k, s[k]]); } }
  c.sort(function (a, b) { return b[1] - a[1]; });
  return c;
}

function iptvKategoriYaz() {
  var k = document.getElementById('iptvKatlar');
  if (!k) { return; }
  var kat = iptvKategoriler();
  if (!kat.length) { k.innerHTML = '<span class="soluk iptvNot">kategori yok — liste yükle ya da kanal ekle</span>'; return; }
  var h = '<span class="iptvKat' + (IPTV.kategori === 'hepsi' ? ' sec' : '') + '" data-g="hepsi">HEPSİ <b>' + IPTV.kanal.length + '</b></span>';
  for (var i = 0; i < kat.length; i++) {
    h += '<span class="iptvKat' + (IPTV.kategori === kat[i][0] ? ' sec' : '') + '" data-g="' + iptvEsc(kat[i][0]) + '">'
       + iptvEsc(kat[i][0]) + ' <b>' + kat[i][1] + '</b></span>';
  }
  k.innerHTML = h;
}

function iptvTabloYaz() {
  var g = document.getElementById('iptvGovde');
  if (!g) { return; }
  var hepsi = IPTV.kategori === 'hepsi';
  var n = 0;
  var h = '';
  for (var i = 0; i < IPTV.kanal.length; i++) {
    var c = IPTV.kanal[i];
    var gr = (c.grup || '').trim() || 'Genel';
    if (!hepsi && gr !== IPTV.kategori) { continue; }
    n++;
    var aktif = (IPTV.url && c.url === IPTV.url);
    h += '<tr class="' + (aktif ? 'iptvAktif' : '') + '">'
       +   '<td class="iptvSira">' + n + '</td>'
       +   '<td class="iptvCAd">' + iptvEsc(c.ad || 'kanal') + '</td>'
       +   '<td class="iptvCGrup">' + iptvEsc(gr) + '</td>'
       +   '<td class="iptvCIslem">'
       +     '<button class="iptvIkon" data-oyna="' + i + '" title="Oynat">&#9654;</button>'
       +     '<button class="iptvIkon sil" data-sil="' + i + '" title="Kaldır">&times;</button>'
       +   '</td></tr>';
  }
  if (!n) {
    h = '<tr><td colspan="4" class="iptvBosSatir">kanal yok — yukarıya bir .m3u listesi yapıştır ya da “+ KANAL EKLE”</td></tr>';
  }
  g.innerHTML = h;
  var sc = document.getElementById('iptvSayac');
  if (sc) {
    sc.textContent = (hepsi ? n + ' kanal' : n + ' / ' + IPTV.kanal.length + ' kanal')
      + (IPTV.kategori !== 'hepsi' ? ' · ' + IPTV.kategori : '');
  }
  iptvKategoriYaz();
}

function iptvKaynakYaz() {
  var k = document.getElementById('iptvKaynaklar');
  if (!k) { return; }
  if (!IPTV.kaynak.length) { k.innerHTML = '<span class="soluk">yok</span>'; return; }
  var h = '';
  for (var i = 0; i < IPTV.kaynak.length; i++) {
    h += '<span class="iptvCip" data-l="' + i + '" title="' + iptvEsc(IPTV.kaynak[i]) + '">'
       +   '<b>' + iptvEsc(iptvKisa(IPTV.kaynak[i])) + '</b>'
       +   '<i data-lsil="' + i + '" title="kaynaktan çıkar">&times;</i></span>';
  }
  k.innerHTML = h;
}

function iptvSimdikiYaz() {
  var e = document.getElementById('iptvSimdiki');
  if (e) { e.textContent = IPTV.url ? ('şimdi: ' + (IPTV.ad || iptvKisa(IPTV.url))) : ''; }
}

/* ============================== oynatıcı ============================== */
function iptvBitir() {
  if (IPTV.zaman) { clearTimeout(IPTV.zaman); IPTV.zaman = null; }
  IPTV.hlsYedek = null; IPTV.hlsYedekDenendi = false;
  if (IPTV.hls) { try { IPTV.hls.destroy(); } catch (e) {} IPTV.hls = null; }
  var v = document.getElementById('iptvVideo');
  if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
}

function iptvKalite() {
  if (!IPTV.hls || !IPTV.hls.levels || !IPTV.hls.levels.length) { return ''; }
  var i = IPTV.hls.currentLevel;
  if (i < 0) { return 'otomatik'; }
  var h = IPTV.hls.levels[i] && IPTV.hls.levels[i].height;
  return h ? (h + 'p') : 'otomatik';
}

function iptvOynat(u, ad) {
  var v = document.getElementById('iptvVideo');
  if (!v) { return; }
  iptvBitir();
  IPTV.url = u; IPTV.ad = ad || ''; IPTV.deneme = 0;
  var bos = document.getElementById('iptvBos');
  if (bos) { bos.style.display = 'none'; }
  iptvSimdikiYaz();
  iptvTabloYaz();
  iptvSakla();
  iptvYaz('bağlanıyor… ' + (ad || ''));
  IPTV.tvSure = setTimeout(function () {
    var vv = document.getElementById('iptvVideo');
    if (vv && vv.readyState < 2) { iptvYaz('yayına ulaşılamadı — bağlantıyı ya da CORS’u kontrol et'); }
  }, 20000);

  /* --- tarayıcının hiç oynatamadığı biçimler --- */
  if (/^(rtsp|rtmpe|rtmp|mms):/i.test(u)) {
    iptvYaz('✘ rtsp / rtmp bağlantısını tarayıcı oynatamaz — sağlayıcıdan .m3u8 bağlantısı iste');
    return;
  }

  /* --- düz medya dosyası (mp4/mp3…) → doğrudan oynat --- */
  var duzMedya = /\.(mp4|m4v|webm|ogv|ogg|mp3|m4a|aac|mov)(\?|#|$)/i.test(u);
  if (duzMedya) {
    v.src = u;
    var p0 = v.play(); if (p0 && p0.catch) { p0.catch(function () {}); }
    return;
  }
  /* --- uzantısız yayın (ör. .../8032/stream) → çoğu düz MP3/AAC akışıdır.
         Doğrudan dene; açılmazsa hata yakalayıcı HLS'e düşürür. --- */
  var uzantisiz = !/\.[a-z0-9]{2,4}(\?|#|$)/i.test(u);
  if (uzantisiz && !/\.ts(\?|#|$)/i.test(u)) {
    IPTV.hlsYedek = u; IPTV.hlsYedekDenendi = false;
    v.src = u;
    var pu = v.play(); if (pu && pu.catch) { pu.catch(function () {}); }
    return;
  }
  /* .ts yayını: tarayıcı çıplak TS oynatmaz ama sunucu HLS sunuyor olabilir → dene */
  if (/\.ts(\?|#|$)/i.test(u)) { iptvYaz('⚠ .ts yayını — tarayıcı çıplak TS oynatmaz; HLS olarak deneniyor…'); }

  iptvHlsBaslat(u);
}

/* hls.js ile oynat — .m3u8 ve HLS sunan uzantısız yayınlar için */
function iptvHlsBaslat(u) {
  var v = document.getElementById('iptvVideo');
  if (!v) { return; }
  if (typeof hlsYukle !== 'function') {
    v.src = u;
    var pd = v.play(); if (pd && pd.catch) { pd.catch(function () {}); }
    return;
  }
  hlsYukle().then(function (Hls) {
    if (!Hls) { iptvYaz('oynatıcı yüklenemedi'); return; }
    if (!Hls.isSupported()) {
      if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = u; var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
      else { iptvYaz('bu tarayıcı m3u8 oynatamıyor'); }
      return;
    }
    var h = new Hls({ enableWorker: true, maxBufferLength: 30 });
    IPTV.hls = h;
    h.loadSource(u);
    h.attachMedia(v);
    h.on(Hls.Events.MANIFEST_PARSED, function () { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } });
    h.on(Hls.Events.LEVEL_SWITCHED, function () {
      if (IPTV.tvSure) { clearTimeout(IPTV.tvSure); IPTV.tvSure = null; }
      iptvYaz('çalıyor' + (IPTV.ad ? ' · ' + IPTV.ad : '') + (iptvKalite() ? ' · ' + iptvKalite() : ''));
    });
    h.on(Hls.Events.ERROR, function (ev, d) {
      if (!d || !d.fatal) { return; }
      if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
        IPTV.deneme++;
        if (IPTV.deneme <= 2) { iptvYaz('ağ hatası — yeniden deneniyor (' + IPTV.deneme + '/2)'); try { h.startLoad(); } catch (e) {} return; }
        /* .m3u8 değilse belki düz dosyadır → doğrudan oynatmayı dene */
        if (!/\.m3u8(\?|#|$)/i.test(IPTV.url)) {
          try { h.destroy(); } catch (e) {}
          IPTV.hls = null;
          iptvYaz('HLS değilmiş — doğrudan oynatma deneniyor…');
          var vv2 = document.getElementById('iptvVideo');
          if (vv2) { vv2.src = IPTV.url; var pp = vv2.play(); if (pp && pp.catch) { pp.catch(function () {}); } }
          return;
        }
        iptvYaz('açılamadı — yayın kapalı ya da CORS izni yok. UÇAKLI başlatıcıyı dene.');
        iptvBitir();
      } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
        try { h.recoverMediaError(); iptvYaz('görüntü hatası — kurtarılıyor…'); } catch (e) { iptvYaz('görüntü açılamadı'); }
      } else {
        iptvYaz('açılamadı (' + (d.type || 'hata') + ')'); iptvBitir();
      }
    });
  }).catch(function (e) { iptvYaz('oynatıcı yüklenemedi: ' + (e && e.message ? e.message : e)); });
}

function iptvDurdur() {
  iptvBitir();
  IPTV.url = ''; IPTV.ad = ''; IPTV.tvSure = null;
  var b = document.getElementById('iptvBos'); if (b) { b.style.display = 'flex'; }
  iptvYaz('durduruldu');
  iptvSimdikiYaz();
  iptvTabloYaz();
  iptvSakla();
}

/* ========================= IPTV çalma listesi ========================= */
function iptvListeCoz(metin, temelUrl) {
  var satirlar = metin.split(/\r?\n/);
  var cikan = [], ad = '', grup = '', bekleyen = null;
  function ekle(u) {
    var tam = u;
    if (!/^https?:/i.test(tam)) {
      try { tam = new URL(u, temelUrl || 'https://x/').href; } catch (e) { return; }
    }
    cikan.push({ ad: ad || ('kanal ' + (cikan.length + 1)), url: tam, grup: grup || 'Genel' });
    ad = ''; grup = ''; bekleyen = null;
  }
  for (var i = 0; i < satirlar.length; i++) {
    var s = satirlar[i].trim();
    if (!s) { continue; }
    if (s.indexOf('#EXTINF') === 0) {
      var son = s.split(',');
      ad = (son.length > 1 ? son[son.length - 1] : '').trim();
      var g = /group-title="([^"]*)"/i.exec(s);
      grup = g ? g[1] : '';
      var m = /\s+(https?:\/\/\S+)\s*$/i.exec(ad);       /* adres aynı satırda olabilir */
      if (m) { ad = ad.slice(0, m.index).trim(); bekleyen = m[1]; }
      if (!ad) { ad = 'kanal ' + (cikan.length + 1); }
      if (bekleyen) { ekle(bekleyen); }
    } else if (s.charAt(0) !== '#') {
      ekle(s);
    }
  }
  return cikan;
}

function iptvKanallariKat(yeni) {
  var var_olan = {}, i;
  for (i = 0; i < IPTV.kanal.length; i++) { var_olan[IPTV.kanal[i].url] = 1; }
  var eklendi = 0;
  for (i = 0; i < yeni.length; i++) {
    if (var_olan[yeni[i].url]) { continue; }
    if (IPTV.kanal.length >= 600) { break; }
    IPTV.kanal.push(yeni[i]); var_olan[yeni[i].url] = 1; eklendi++;
  }
  return eklendi;
}

function iptvListeYukle(u) {
  iptvYaz('liste indiriliyor…');
  fetch(u, { cache: 'no-store' }).then(function (c) { return c.text(); }).then(function (m) {
    if (m.indexOf('#EXTINF') < 0) { iptvYaz('liste değil — yayın olarak deneniyor'); iptvOynat(u); return; }
    var l = iptvListeCoz(m, u);
    if (!l.length) { iptvOynat(u); return; }
    var yeni = iptvKanallariKat(l);
    IPTV.kategori = 'hepsi';
    iptvSakla(); iptvTabloYaz();
    iptvYaz(l.length + ' kanal bulundu · ' + yeni + ' yeni eklendi · tablodan seç');
  }).catch(function () {
    iptvYaz('liste indirilemedi (CORS) — doğrudan yayın olarak deneniyor');
    iptvOynat(u);
  });
}

/* ==================== DOSYADAN YÜKLE (.m3u / .m3u8 / .txt) ==================== */
/* Dosyadan yükleme CORS'a hiç takılmaz: sağlayıcı listeyi indirmene izin
   vermese bile, elindeki dosyayı tarayıcı doğrudan okur. */
function iptvMetniYukle(metin, kaynakAd) {
  var m = String(metin || '');
  if (m.indexOf('#EXTINF') < 0) {
    iptvYaz('✘ ' + (kaynakAd || 'dosya') + ' içinde kanal bulunamadı (#EXTINF yok)');
    return 0;
  }
  var l = iptvListeCoz(m, '');
  var yeni = iptvKanallariKat(l);
  IPTV.kategori = 'hepsi';
  iptvSakla();
  iptvTabloYaz();
  iptvYaz('📂 ' + (kaynakAd || 'dosya') + ' · ' + l.length + ' kanal bulundu, ' + yeni + ' yeni eklendi');
  return yeni;
}

function iptvDosyaOku(dosya) {
  if (!dosya) { return; }
  iptvYaz('dosya okunuyor: ' + dosya.name + ' (' + Math.round(dosya.size / 1024) + ' KB)');
  var ok = new FileReader();
  ok.onload = function (ev) {
    var buf = ev.target.result;
    var metin = '';
    try { metin = new TextDecoder('utf-8').decode(buf); } catch (e) { metin = ''; }
    /* Türkçe listeler çoğu zaman windows-1254; bozuk karakter çıkarsa onu dene */
    if (!metin || metin.indexOf('\uFFFD') >= 0) {
      try {
        var alt = new TextDecoder('windows-1254').decode(buf);
        if (alt && alt.indexOf('\uFFFD') < 0) { metin = alt; }
      } catch (e2) {}
    }
    iptvMetniYukle(metin, dosya.name);
  };
  ok.onerror = function () { iptvYaz('✘ dosya okunamadı'); };
  ok.readAsArrayBuffer(dosya);
}

function iptvDosyaSec() {
  var g = document.getElementById('iptvDosya');
  if (!g) { iptvYaz('dosya seçici bulunamadı'); return; }
  g.value = '';
  g.click();
}

/* ============================ KONTROL (test) ============================ */
/* Bağlantı canlı mı, yayın dosyası mı, kaç kalite, tarayıcı erişebiliyor mu? */
function iptvKontrol() {
  var i = document.getElementById('iptvUrl');
  var u = i ? String(i.value || '').trim() : '';
  if (!u) { iptvYaz('⚠ önce bir bağlantı yapıştır'); return; }
  if (/^(rtsp|rtmp|rtmpe|mms):/i.test(u)) {
    iptvYaz('✘ rtsp/rtmp bağlantısı tarayıcıda oynatılamaz — sağlayıcıdan .m3u8 iste'); return;
  }
  if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; if (i) { i.value = u; } }
  iptvYaz('🔍 kontrol ediliyor…');
  var t0 = Date.now();
  /* CORS engelli sunucular fetch'i dakikalarca asılı bırakıyor (ölçüldü: 74 sn).
     8 saniyede kesiyoruz ki hem hızlı cevap gelsin hem bağlantı havuzu tıkanmasın. */
  var kont = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var zaman = setTimeout(function () { if (kont) { try { kont.abort(); } catch (e) {} } }, 8000);
  var sec = kont ? { cache: 'no-store', signal: kont.signal } : { cache: 'no-store' };
  fetch(u, sec).then(function (c) {
    clearTimeout(zaman);
    var ms = Date.now() - t0;
    return c.text().then(function (m) {
      var hls = (m.indexOf('#EXTM3U') >= 0);
      var liste = (m.indexOf('#EXTINF') >= 0);
      var kalite = (m.match(/#EXT-X-STREAM-INF/g) || []).length;
      var s;
      if (hls || liste) {
        s = '✔ erişildi (' + ms + ' ms) · ' + (liste ? 'IPTV çalma listesi' : 'HLS yayını')
          + (kalite ? ' · ' + kalite + ' kalite' : '') + ' · tarayıcı erişebiliyor → ÇALIŞTIR ile oynar';
      } else {
        s = '⚠ erişildi (' + ms + ' ms) ama yayın dosyası değil (HTML sayfası olabilir) · HTTP ' + c.status;
      }
      iptvYaz(s);
    });
  }).catch(function () {
    clearTimeout(zaman);
    var ms = Date.now() - t0;
    /* fetch engellendiyse (CORS) oynatıcıyla yokla: CORS video etiketini engellemez */
    iptvYaz('🔍 izin yok (' + ms + ' ms) — oynatıcıyla deneniyor…');
    medyaDenetle(u, 9000).then(function (s) {
      if (s === 'oynar') {
        iptvYaz('✔ yayın VAR ve oynuyor · yayıncı sayfa erişimine izin vermiyor (CORS) — '
          + 'listede görünmez ama ÇALIŞTIR ile oynar. UÇAKLI başlatıcı tam çözüm.');
      } else if (s === 'hata') {
        iptvYaz('✘ yayın yok — bağlantı ölü ya da biçim desteklenmiyor');
      } else {
        iptvYaz('⚠ cevap gelmedi (zaman aşımı) — yayın yavaş ya da kapalı');
      }
    });
  });
}

/* ================= LİSTEYİ DIŞA AKTAR (.m3u dosyası indirir) =================
   Tarayıcı, farklı başlatıcıları AYRI hafızada tutar:
     USTAD-MONITOR-UCAKLI  → file:///...     (kendi hafızası)
     USTAD-MONITOR-YEREL   → http://localhost:8878  (ayrı hafıza)
   Bu yüzden bir modda kurduğun kanal listesi öbüründe boş görünür.
   Çözüm: burada .m3u olarak kaydet, öbür modda 📂 DOSYADAN YÜKLE ile al. */
function iptvM3UMetni() {
  var s = '#EXTM3U\n';
  for (var i = 0; i < IPTV.kanal.length; i++) {
    var c = IPTV.kanal[i];
    s += '#EXTINF:-1 group-title="' + String(c.grup || 'Genel').replace(/"/g, '') + '",'
       + String(c.ad || ('kanal ' + (i + 1))).replace(/\n/g, ' ') + '\n' + c.url + '\n';
  }
  return s;
}

function iptvDisariAktar() {
  if (!IPTV.kanal.length) { iptvYaz('⚠ tablo boş — kaydedilecek kanal yok'); return; }
  var t = new Date();
  var ad = 'ustad-kanallar-'
    + t.getFullYear() + ('0' + (t.getMonth() + 1)).slice(-2) + ('0' + t.getDate()).slice(-2)
    + '-' + ('0' + t.getHours()).slice(-2) + ('0' + t.getMinutes()).slice(-2) + '.m3u';
  try {
    var b = new Blob([iptvM3UMetni()], { type: 'audio/x-mpegurl' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u; a.download = ad;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(u); } catch (e) {} }, 1500);
    iptvYaz('💾 ' + IPTV.kanal.length + ' kanal kaydedildi: ' + ad + ' (İndirilenler klasörüne bakar)');
  } catch (e) {
    iptvYaz('✘ kaydedilemedi: ' + e);
  }
}

/* =============================== olaylar =============================== */
function iptvCalistir() {
  var i = document.getElementById('iptvUrl');
  var u = i ? String(i.value || '').trim() : '';
  if (!u) { iptvYaz('⚠ önce bir bağlantı yapıştır'); return; }
  if (/youtube\.com|youtu\.be|youtube-nocookie/i.test(u)) {
    iptvYaz('YouTube bağlantısı → DIŞARI sekmesindeki "kendi kanalını yapıştır" alanını kullan'); return;
  }
  /* tarayıcının oynatamadığı şemalar — https:// eklemeden ÖNCE yakalanmalı */
  if (/^(rtsp|rtmpe|rtmp|rtmps|mms):/i.test(u)) {
    iptvYaz('✘ rtsp / rtmp bağlantısını tarayıcı oynatamaz — sağlayıcıdan .m3u8 bağlantısı iste'); return;
  }
  if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; if (i) { i.value = u; } }

  if (/\.m3u(\?|#|$)/i.test(u) && !/\.m3u8/i.test(u)) {
    if (IPTV.kaynak.indexOf(u) < 0) { IPTV.kaynak.unshift(u); iptvKaynakYaz(); }
    iptvListeYukle(u);
    return;
  }
  if (IPTV.kaynak.indexOf(u) < 0) { IPTV.kaynak.unshift(u); iptvKaynakYaz(); }
  var yeni = iptvKanallariKat([{ ad: iptvKisa(u), url: u, grup: 'Yayınlar' }]);
  iptvTabloYaz();
  if (yeni) { iptvYaz('kanal tablosuna eklendi · yayın açılıyor…'); }
  iptvOynat(u, iptvKisa(u));
}

function iptvKanalEkle() {
  var a = document.getElementById('iptvEAd'), b = document.getElementById('iptvEUrl'), c = document.getElementById('iptvEGrup');
  var ad = a ? String(a.value || '').trim() : '';
  var u = b ? String(b.value || '').trim() : '';
  var gr = c ? String(c.value || '').trim() : '';
  if (!u) { iptvYaz('⚠ kanal bağlantısı boş'); return; }
  if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; }
  if (!ad) { ad = iptvKisa(u); }
  var n = iptvKanallariKat([{ ad: ad, url: u, grup: gr || 'Elle eklenen' }]);
  if (a) { a.value = ''; } if (b) { b.value = ''; } if (c) { c.value = ''; }
  iptvSakla(); iptvTabloYaz();
  iptvYaz(n ? ('kanal eklendi · ' + ad) : 'bu bağlantı zaten tabloda');
}

function iptvKur() {
  var git = document.getElementById('iptvGit'), stop = document.getElementById('iptvStop');
  var inp = document.getElementById('iptvUrl'), ac = document.getElementById('iptvAcKapa');
  var ekle = document.getElementById('iptvEkle'), ekaydet = document.getElementById('iptvEKaydet'), eiptal = document.getElementById('iptvEIptal');
  var kaynak = document.getElementById('iptvKaynaklar'), katlar = document.getElementById('iptvKatlar');
  var govde = document.getElementById('iptvGovde'), hepsi = document.getElementById('iptvHepsi');
  var knt = document.getElementById('iptvKontrolBtn'), dsy = document.getElementById('iptvDosyaBtn');
  var dsyg = document.getElementById('iptvDosya'), kaydet = document.getElementById('iptvKaydet');
  var v = document.getElementById('iptvVideo');
  if (!git) { return; }

  iptvKaynakYaz(); iptvTabloYaz(); iptvSimdikiYaz(); iptvDiziYaz();
  if (typeof kasaKur2Dugmeler === 'function') { kasaKur2Dugmeler(); }
  if (IPTV.url && inp) { inp.value = IPTV.url; }

  git.onclick = function () { iptvCalistir(); };
  stop.onclick = function () { iptvDurdur(); };
  if (knt) { knt.onclick = function () { iptvKontrol(); }; }
  if (kaydet) { kaydet.onclick = function () { iptvDisariAktar(); }; }
  if (dsy) { dsy.onclick = function () { iptvDosyaSec(); }; }
  if (dsyg) {
    dsyg.onchange = function () {
      var d = dsyg.files && dsyg.files[0];
      if (d) { iptvDosyaOku(d); }
    };
  }
  inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); iptvCalistir(); } };
  ac.onclick = function () {
    var g = (ekle.style.display === 'none' || !ekle.style.display);
    ekle.style.display = g ? 'flex' : 'none';
  };
  var ses = document.getElementById('iptvSes');
  if (ses) {
    ses.onclick = function () {
      if (!v) { return; }
      v.muted = !v.muted;
      ses.innerHTML = v.muted ? '&#128263; SES KAPALI' : '&#128266; SES AÇIK';
      iptvYaz(v.muted ? 'ses kapatıldı' : 'ses açıldı');
    };
  }
  ekaydet.onclick = function () { iptvKanalEkle(); };
  eiptal.onclick = function () { ekle.style.display = 'none'; };

  kaynak.onclick = function (e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-lsil') !== null && t.getAttribute('data-lsil') !== undefined) {
      var s = parseInt(t.getAttribute('data-lsil'), 10);
      if (!isNaN(s)) { IPTV.kaynak.splice(s, 1); iptvSakla(); iptvKaynakYaz(); }
      return;
    }
    while (t && t !== kaynak && !t.getAttribute('data-l')) { t = t.parentNode; }
    if (t && t.getAttribute && t.getAttribute('data-l') !== null) {
      var k = parseInt(t.getAttribute('data-l'), 10);
      if (!isNaN(k) && IPTV.kaynak[k]) {
        if (inp) { inp.value = IPTV.kaynak[k]; }
        if (/\.m3u(\?|#|$)/i.test(IPTV.kaynak[k]) && !/\.m3u8/i.test(IPTV.kaynak[k])) { iptvListeYukle(IPTV.kaynak[k]); }
        else { iptvOynat(IPTV.kaynak[k]); }
      }
    }
  };

  katlar.onclick = function (e) {
    var t = e.target;
    while (t && t !== katlar && !t.getAttribute('data-g')) { t = t.parentNode; }
    if (t && t.getAttribute && t.getAttribute('data-g') !== null) {
      IPTV.kategori = t.getAttribute('data-g');
      iptvTabloYaz();
    }
  };

  govde.onclick = function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) { return; }
    if (t.getAttribute('data-oyna') !== null) {
      var i = parseInt(t.getAttribute('data-oyna'), 10);
      if (!isNaN(i) && IPTV.kanal[i]) { iptvOynat(IPTV.kanal[i].url, IPTV.kanal[i].ad); }
      return;
    }
    if (t.getAttribute('data-sil') !== null) {
      var s = parseInt(t.getAttribute('data-sil'), 10);
      if (!isNaN(s)) {
        var c = IPTV.kanal[s];
        if (c && c.url === IPTV.url) { iptvDurdur(); }
        IPTV.kanal.splice(s, 1);
        iptvSakla(); iptvTabloYaz();
        iptvYaz('kanal kaldırıldı');
      }
    }
  };

  hepsi.onclick = function () {
    if (!IPTV.kanal.length) { iptvYaz('tablo zaten boş'); return; }
    if (!confirm('Tablodaki ' + IPTV.kanal.length + ' kanalın hepsi kaldırılsın mı?')) { return; }
    iptvDurdur();
    IPTV.kanal = []; IPTV.kategori = 'hepsi';
    iptvSakla(); iptvTabloYaz();
    iptvYaz('tablo temizlendi');
  };

  if (v) {
    v.onplaying = function () {
      if (IPTV.tvSure) { clearTimeout(IPTV.tvSure); IPTV.tvSure = null; }
      iptvYaz('çalıyor' + (IPTV.ad ? ' · ' + IPTV.ad : '') + (iptvKalite() ? ' · ' + iptvKalite() : ''));
    };
    v.onwaiting = function () { iptvYaz('tampon…'); };
    v.onerror = function () {
      /* uzantısız yayın doğrudan açılmadıysa HLS olarak BİR KEZ dene */
      if (IPTV.hlsYedek && !IPTV.hlsYedekDenendi) {
        IPTV.hlsYedekDenendi = true;
        iptvYaz('düz yayın değilmiş — HLS olarak deneniyor…');
        iptvHlsBaslat(IPTV.hlsYedek);
        return;
      }
      if (!IPTV.hls) { iptvYaz('açılamadı — yayın kapalı ya da CORS izni yok. UÇAKLI başlatıcıyı dene.'); }
    };
    /* çift tıkla → tam ekran (Kenan'ın beklediği davranış) */
    v.ondblclick = function (ev) {
      ev.preventDefault();
      if (document.fullscreenElement) { if (document.exitFullscreen) { document.exitFullscreen(); } return; }
      if (v.requestFullscreen) { v.requestFullscreen(); }
      else if (v.webkitRequestFullscreen) { v.webkitRequestFullscreen(); }
      else if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); }
    };
  }
}

/* ============================ ölçüm/test ============================ */
window.IPTV_API = {
  calistir: function (u) { var i = document.getElementById('iptvUrl'); if (i) { i.value = u; } iptvCalistir(); },
  kanalEkle: function (ad, u, g) { var a = document.getElementById('iptvEAd'), b = document.getElementById('iptvEUrl'), c = document.getElementById('iptvEGrup');
    if (a) { a.value = ad || ''; } if (b) { b.value = u || ''; } if (c) { c.value = g || ''; } iptvKanalEkle(); },
  kategoriSec: function (g) { IPTV.kategori = g; iptvTabloYaz(); },
  durdur: function () { iptvDurdur(); },
  hepsiSil: function () { IPTV.kanal = []; IPTV.kategori = 'hepsi'; iptvSakla(); iptvTabloYaz(); },
  durum: function () { var e = document.getElementById('iptvDurum'); return e ? e.textContent : null; },
  kanalSayisi: function () { return IPTV.kanal.length; },
  satirSayisi: function () { return document.querySelectorAll('#iptvGovde tr').length; },
  kategoriSayisi: function () { return iptvKategoriler().length; },
  kategoriListe: function () { return iptvKategoriler(); },
  kaynaklar: function () { return IPTV.kaynak.slice(); },
  ilkKanal: function () { return IPTV.kanal[0] || null; },
  video: function () { var v = document.getElementById('iptvVideo'); return v ? { readyState: v.readyState, hata: v.error ? v.error.code : null, duraklatildi: v.paused, sure: +(v.currentTime || 0).toFixed(2) } : null; },
  hlsVar: function () { return !!IPTV.hls; },
  coz: function (m, t) { return iptvListeCoz(m, t); },
  kontrol: function (u) { var i = document.getElementById('iptvUrl'); if (i) { i.value = u; } iptvKontrol(); },
  dosyaMetni: function (m, ad) { return iptvMetniYukle(m, ad || 'test.m3u'); },
  kontrolVar: function () { return !!document.getElementById('iptvKontrolBtn'); },
  dosyaBtnVar: function () { return !!document.getElementById('iptvDosyaBtn'); },
  dosyaGirisVar: function () { var g = document.getElementById('iptvDosya'); return !!(g && g.type === 'file'); },
  kaydetVar: function () { return !!document.getElementById('iptvKaydet'); },
  m3uMetni: function () { return iptvM3UMetni(); },
  disariAktar: function () { iptvDisariAktar(); }
};
