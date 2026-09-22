/* ============================================================================
   ÜSTAD RADYO — üst şeritteki 24 saat canlı radyo kutusu
   Kenan Kuzucu · ÜSTAD DÜNYA MONİTÖR

   Yayınların HEPSİ 19.09.2026 tarihinde gerçek oynatma ile doğrulandı
   (headless Chrome <audio>: 'playing' olayı + currentTime ilerlemesi).
   HTTP 200 yeterli değildir; URL'ler zamanla ölür. Yeniden doğrulamak için:
       python %LOCALAPPDATA%\Temp\radyo-calinma.py
   ============================================================================ */
(function () {
  'use strict';

  /* KANAL LİSTESİ — hepsi HTTPS, progressive MP3/AAC (HLS DEĞİL), 7/24 canlı.
     8 kanal şeride sığmadı (2'si kesiliyordu) → 6 kanal, hepsi tam görünür. */
  var KANALLAR = [
    ['TRT FM',     'https://trt.radyotvonline.net/trtfm'],
    ['Slow Türk',  'https://radyo.duhnet.tv/ak_dtvh_slowturk'],
    ['JoyTürk',    'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_SC?/'],
    ['Metro FM',   'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM_SC?/'],
    ['Alem FM',    'https://turkmedya.radyotvonline.net/alemfmaac'],
    ['Power Love', 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio']
  ];

  var ANAHTAR = 'ustad_radyo_';
  var kutu = document.getElementById('ustadRadyo');
  if (!kutu) { return; }

  /* ---------- durum ---------- */
  var secili = 0, acik = false, hazirMi = false;

  try {
    var kKayit = parseInt(localStorage.getItem(ANAHTAR + 'kanal'), 10);
    if (!isNaN(kKayit) && kKayit >= 0 && kKayit < KANALLAR.length) { secili = kKayit; }
    acik = localStorage.getItem(ANAHTAR + 'acik') === '1';
  } catch (e) {}

  var sesSeviye = 55;
  try {
    var sKayit = parseInt(localStorage.getItem(ANAHTAR + 'ses'), 10);
    if (!isNaN(sKayit) && sKayit >= 0 && sKayit <= 100) { sesSeviye = sKayit; }
  } catch (e) {}

  /* ---------- iskelet ---------- */
  var sesEl = new Audio();
  sesEl.preload = 'none';
  sesEl.volume = sesSeviye / 100;
  /* DİKKAT: sesEl.crossOrigin ATANMAZ. null atamak tarayıcıda "null" string'ine
     dönüşüp CORS zorunluluğu doğuruyor ve CORS başlığı olmayan yayınlar
     hiç yüklenmiyor (readyState 0'da kalıyor). 19.09.2026'da ölçüldü. */

  var kanalSar = '', i;
  for (i = 0; i < KANALLAR.length; i++) {
    kanalSar += '<button class="urChip" data-kanal="' + i + '" type="button">' + KANALLAR[i][0] + '</button>';
  }

  kutu.innerHTML =
    '<span class="urMarka">' +
      '<span class="urNota">&#9835;</span>' +
      '<span class="urAd">ÜSTAD RADYO <small>7/24</small></span>' +
      '<span class="urDalgacik"><i></i><i></i><i></i></span>' +
    '</span>' +
    '<span class="urAra"></span>' +
    '<span class="urKanallar" id="urKanallar">' + kanalSar + '</span>' +
    '<span class="urDugme" id="urOynat" role="button" tabindex="0" title="Çal / Durdur">&#9654;</span>' +
    '<span class="urSesSar"><span>&#128266;</span>' +
      '<input class="urSes" id="urSes" type="range" min="0" max="100" value="' + sesSeviye + '" title="Ses">' +
    '</span>' +
    '<span class="urDurum" id="urDurum">hazır</span>' +
    '<span class="urSaat" id="urSaat">--:--:--</span>';

  var elKanallar = document.getElementById('urKanallar');
  var elOynat = document.getElementById('urOynat');
  var elSes = document.getElementById('urSes');
  var elDurum = document.getElementById('urDurum');
  var elSaat = document.getElementById('urSaat');

  /* ---------- yardımcılar ---------- */
  function durum(s) { if (elDurum) { elDurum.textContent = s; } }

  function cizgiGuncelle() {
    if (!elKanallar) { return; }
    var b = elKanallar.querySelectorAll('.urChip');
    for (var j = 0; j < b.length; j++) {
      b[j].className = 'urChip' + (parseInt(b[j].getAttribute('data-kanal'), 10) === secili ? ' aktif' : '');
    }
  }

  function dugmeGuncelle() {
    if (!elOynat) { return; }
    elOynat.innerHTML = acik ? '&#10074;&#10074;' : '&#9654;';
    elOynat.className = 'urDugme' + (acik && hazirMi ? ' caliyor' : '');
    kutu.className = 'ustadRadyo' + (acik && hazirMi ? ' caliyor' : '');
  }

  function kaydet() {
    try {
      localStorage.setItem(ANAHTAR + 'kanal', String(secili));
      localStorage.setItem(ANAHTAR + 'acik', acik ? '1' : '0');
      localStorage.setItem(ANAHTAR + 'ses', String(Math.round(sesEl.volume * 100)));
    } catch (e) {}
  }

  /* ---------- oynatma ---------- */
  function baslat(ilkAcilis) {
    var k = KANALLAR[secili];
    hazirMi = false;
    durum('bağlanıyor…');
    try { sesEl.src = k[1]; } catch (e) { durum('kanal yüklenemedi'); return; }
    var p = sesEl.play();
    if (p && p.catch) {
      p.catch(function () {
        /* tarayıcı otomatik sesi engelledi (panel .bat ile açılmadıysa) */
        hazirMi = false; acik = false; dugmeGuncelle();
        durum('▶ ile başlat');
        kaydet();
        if (!ilkAcilis) { /* kullanıcı tıkladıysa tekrar denemeyi bırakma */ }
      });
    }
  }

  function durdur() {
    try { sesEl.pause(); } catch (e) {}
    hazirMi = false;
    durum('duraklatıldı');
    dugmeGuncelle();
  }

  function degistir(yeni) {
    secili = yeni;
    cizgiGuncelle();
    acik = true;
    kaydet();
    baslat(false);
  }

  /* ---------- olaylar ---------- */
  sesEl.addEventListener('playing', function () {
    hazirMi = true; acik = true;
    durum('çalıyor · ' + KANALLAR[secili][0]);
    dugmeGuncelle(); kaydet();
  });
  sesEl.addEventListener('waiting', function () { durum('tampon…'); });
  sesEl.addEventListener('pause', function () {
    if (acik) { return; }
    hazirMi = false; durum('duraklatıldı'); dugmeGuncelle();
  });
  sesEl.addEventListener('error', function () {
    hazirMi = false; acik = false;
    durum('kanal açılamadı — başkasını dene');
    dugmeGuncelle(); kaydet();
  });
  sesEl.addEventListener('stalled', function () { durum('yayın gecikiyor…'); });

  if (elOynat) {
    elOynat.addEventListener('click', function () {
      if (acik) { acik = false; durdur(); kaydet(); }
      else { acik = true; baslat(false); }
    });
    elOynat.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elOynat.click(); }
    });
  }

  if (elKanallar) {
    elKanallar.addEventListener('click', function (ev) {
      var h = ev.target;
      while (h && h !== elKanallar && !h.getAttribute('data-kanal')) { h = h.parentNode; }
      if (h && h.getAttribute && h.getAttribute('data-kanal') !== null && h.getAttribute('data-kanal') !== undefined) {
        var n = parseInt(h.getAttribute('data-kanal'), 10);
        if (!isNaN(n)) { degistir(n); }
      }
    });
  }

  if (elSes) {
    elSes.addEventListener('input', function () {
      sesEl.volume = parseInt(elSes.value, 10) / 100;
      kaydet();
    });
  }

  /* ---------- canlı saat ---------- */
  function saat() {
    if (!elSaat) { return; }
    try {
      elSaat.textContent = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    } catch (e) {
      elSaat.textContent = '--:--:--';
    }
  }

  /* ---------- kur ---------- */
  cizgiGuncelle();
  dugmeGuncelle();
  saat();
  setInterval(saat, 1000);

  if (acik) {
    baslat(true);
  } else {
    durum('hazır — ▶ ile çal');
  }

  /* dışarıdan erişim (test/ölçüm için) */
  window.UR = {
    kanal: function () { return KANALLAR[secili][0]; },
    caliyor: function () { return hazirMi && !sesEl.paused; },
    sure: function () { return +(sesEl.currentTime || 0).toFixed(2); },
    ac: function (n) { if (typeof n === 'number') { degistir(n); } },
    oynat: function () { if (!acik) { acik = true; baslat(false); } },
    durdur: function () { acik = false; durdur(); kaydet(); },
    ham: function () {
      return { hazir: sesEl.readyState, ag: sesEl.networkState,
               hata: sesEl.error ? sesEl.error.code : null, duraklatildi: sesEl.paused,
               kaynak: String(sesEl.currentSrc || sesEl.src || '').slice(0, 70) };
    },
    liste: function () { return KANALLAR.map(function (x) { return x[0]; }); }
  };
})();
