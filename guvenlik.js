/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — GÜVENLİK & DAYANIKLILIK (v5.4)
   · PIN kilidi (5 hata → 60 sn kilit, SHA-256 özet)
   · ŞİFRELİ KASA (WebCrypto AES-GCM · anahtarlar cihazda kalır)
   · Günlük otomatik yedek (JSON) + son yedek hatırlatması
   · KENDİNİ TEST EDEN PAKET (katmanlar + beslemeler + arayüz)
   · GİZLİ MOD (istenen sekmeleri kilitler)
   · GİT SÜRÜM KONTROLÜ yardımcısı (.bat)
   ============================================================ */
var PIN={ ozet:'', kilit:0, deneme:0, acik:false };
var GIZLI={ sekmeler:[], acik:false };

/* ---------------- yardımcı: SHA-256 ---------------- */
function sha256(metin){
  try{
    var kod=new TextEncoder().encode(metin);
    return crypto.subtle.digest('SHA-256', kod).then(function(buf){
      var b=new Uint8Array(buf), h='';
      for(var i=0;i<b.length;i++) h+=(b[i]<16?'0':'')+b[i].toString(16);
      return h;
    });
  }catch(e){ return Promise.resolve('yok'); }
}

/* ---------------- 1) PIN KİLİDİ ---------------- */
function pinOku(){
  try{
    PIN.ozet=localStorage.getItem('ustad_pin')||'';
    PIN.kilit=parseInt(localStorage.getItem('ustad_pin_kilit')||'0',10)||0;
    PIN.deneme=parseInt(localStorage.getItem('ustad_pin_deneme')||'0',10)||0;
  }catch(e){}
}
function pinKur(){
  if(PIN.ozet){
    var eski=prompt('Mevcut PIN\'i gir (kaldırmak/silmek için):','');
    if(eski===null) return;
    sha256('ustad|'+eski).then(function(h){
      if(h!==PIN.ozet){ alert('PIN yanlış.'); return; }
      localStorage.removeItem('ustad_pin'); PIN.ozet='';
      durum('guvenlik','✔ PIN kilidi kaldırıldı');
      guvenlikPanelYaz();
    });
    return;
  }
  var p1=prompt('Yeni PIN (4-8 hane):','');
  if(!p1) return;
  if(p1.length<4){ alert('PIN en az 4 hane olmalı.'); return; }
  var p2=prompt('PIN tekrar:','');
  if(p1!==p2){ alert('PIN\'ler uyuşmuyor.'); return; }
  sha256('ustad|'+p1).then(function(h){
    try{ localStorage.setItem('ustad_pin', h); }catch(e){}
    PIN.ozet=h;
    durum('guvenlik','✔ PIN kilidi kuruldu — panel açılışında sorulacak');
    guvenlikPanelYaz();
  });
}
function pinSor(){
  pinOku();
  if(!PIN.ozet) return;
  if(Date.now()<PIN.kilit){
    var kalan=Math.ceil((PIN.kilit-Date.now())/1000);
    alert('Kilitli. Kalan süre: '+kalan+' saniye.');
    return;
  }
  var p=prompt('🔒 ÜSTAD MONİTÖR — PIN gir:','');
  if(p===null) return;
  sha256('ustad|'+p).then(function(h){
    if(h===PIN.ozet){
      PIN.deneme=0; try{ localStorage.setItem('ustad_pin_deneme','0'); }catch(e){}
      PIN.acik=true;
      durum('guvenlik','✔ PIN doğru — panel açık');
    } else {
      PIN.deneme++;
      try{ localStorage.setItem('ustad_pin_deneme', String(PIN.deneme)); }catch(e){}
      if(PIN.deneme>=5){
        PIN.kilit=Date.now()+60000;
        try{ localStorage.setItem('ustad_pin_kilit', String(PIN.kilit)); }catch(e){}
        PIN.deneme=0;
        alert('5 hatalı deneme — 60 saniye kilitlendi.');
      } else {
        alert('PIN yanlış. Kalan hak: '+(5-PIN.deneme));
      }
    }
    guvenlikPanelYaz();
  });
}
function pinKapisi(){
  pinOku();
  if(!PIN.ozet) return;
  var kap=document.createElement('div');
  kap.id='pinKapi';
  kap.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:#000;z-index:99998;display:flex;align-items:center;justify-content:center;font-family:Consolas,monospace';
  kap.innerHTML='<div style="text-align:center;border:1px solid #22c55e;padding:26px 34px;border-radius:8px;box-shadow:0 0 34px #22c55e">'
    +'<div style="color:#7bffa1;letter-spacing:3px;margin-bottom:14px">🔒 ÜSTAD DÜNYA MONİTÖRÜ</div>'
    +'<input id="pinGirdi" type="password" maxlength="8" placeholder="PIN" style="background:#04120a;border:1px solid #22c55e;color:#c9ffd8;font-family:inherit;font-size:18px;padding:8px 12px;border-radius:4px;text-align:center;letter-spacing:6px">'
    +'<div style="margin-top:12px"><button id="pinGonder" style="background:#04120a;border:1px solid #22c55e;color:#7bffa1;font-family:inherit;padding:7px 18px;border-radius:4px;cursor:pointer">GİRİŞ</button></div>'
    +'<div id="pinDurum" style="color:#4fd97a;font-size:11px;margin-top:10px">5 hatalı denemede 60 sn kilit</div></div>';
  document.body.appendChild(kap);
  var g=document.getElementById('pinGirdi');
  function dene(){
    var p=g.value;
    if(Date.now()<PIN.kilit){
      document.getElementById('pinDurum').textContent='Kilitli: '+Math.ceil((PIN.kilit-Date.now())/1000)+' sn';
      return;
    }
    sha256('ustad|'+p).then(function(h){
      if(h===PIN.ozet){
        PIN.deneme=0; try{ localStorage.setItem('ustad_pin_deneme','0'); }catch(e){}
        kap.remove(); PIN.acik=true;
      } else {
        PIN.deneme++;
        try{ localStorage.setItem('ustad_pin_deneme', String(PIN.deneme)); }catch(e){}
        if(PIN.deneme>=5){
          PIN.kilit=Date.now()+60000;
          try{ localStorage.setItem('ustad_pin_kilit', String(PIN.kilit)); }catch(e){}
          PIN.deneme=0;
          document.getElementById('pinDurum').textContent='60 saniye kilitlendi.';
        } else {
          document.getElementById('pinDurum').textContent='PIN yanlış. Kalan hak: '+(5-PIN.deneme);
        }
        g.value='';
      }
    });
  }
  document.getElementById('pinGonder').onclick=dene;
  g.addEventListener('keydown', function(e){ if(e.key==='Enter') dene(); });
  setTimeout(function(){ try{ g.focus(); }catch(e){} }, 200);
}

/* ---------------- 2) ŞİFRELİ KASA (AES-GCM) ---------------- */
function kasaAnahtar(pin, tuz){
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey'])
    .then(function(ana){
      return crypto.subtle.deriveKey({name:'PBKDF2', salt:tuz, iterations:120000, hash:'SHA-256'},
        ana, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
    });
}
function kasaKaydet(){
  var pin=prompt('Kasa PIN\'i (anahtarları şifrelemek için):','');
  if(!pin || pin.length<4){ alert('En az 4 hane.'); return; }
  var veri={};
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k && (k.indexOf('ustad_anahtar')===0 || k.indexOf('ustad_telegram')===0 || k.indexOf('ustad_pin')===0)) veri[k]=localStorage.getItem(k);
    }
  }catch(e){}
  var tuz=crypto.getRandomValues(new Uint8Array(16));
  kasaAnahtar(pin, tuz).then(function(ana){
    var iv=crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, ana, new TextEncoder().encode(JSON.stringify(veri)))
      .then(function(sifreli){
        var baytlar=new Uint8Array(sifreli), b64=btoa(String.fromCharCode.apply(null, baytlar));
        var paket={ surum:1, tuz:Array.from(tuz), iv:Array.from(iv), veri:b64 };
        localStorage.setItem('ustad_kasa', JSON.stringify(paket));
        /* şifrelenen ham kayıtları sil (kasada duruyor) */
        for(var k in veri){ try{ localStorage.removeItem(k); }catch(e){} }
        durum('guvenlik','✔ kasa oluşturuldu — '+Object.keys(veri).length+' kayıt şifrelendi (ham kopyalar silindi)');
        guvenlikPanelYaz();
      });
  }).catch(function(e){ durum('guvenlik','✘ kasa hatası: '+e.message); });
}
function kasaAc(){
  var t=null; try{ t=localStorage.getItem('ustad_kasa'); }catch(e){}
  if(!t){ durum('guvenlik','✘ önce kasa oluştur'); return; }
  var pin=prompt('Kasa PIN\'i:',''); if(!pin) return;
  var paket=JSON.parse(t);
  kasaAnahtar(pin, new Uint8Array(paket.tuz)).then(function(ana){
    var iv=new Uint8Array(paket.iv);
    var ham=Uint8Array.from(atob(paket.veri), function(c){ return c.charCodeAt(0); });
    return crypto.subtle.decrypt({name:'AES-GCM', iv:iv}, ana, ham);
  }).then(function(duz){
    var veri=JSON.parse(new TextDecoder().decode(duz));
    for(var k in veri){ try{ localStorage.setItem(k, veri[k]); }catch(e){} }
    durum('guvenlik','✔ kasa açıldı — '+Object.keys(veri).length+' kayıt geri yüklendi');
    guvenlikPanelYaz();
  }).catch(function(){ durum('guvenlik','✘ kasa açılamadı (PIN yanlış veya veri bozuk)'); });
}
function kasaDurum(){
  var t=null; try{ t=localStorage.getItem('ustad_kasa'); }catch(e){}
  if(!t) return 'yok';
  try{ var p=JSON.parse(t); return 'var ('+new Date().toLocaleDateString('tr-TR')+')'; }catch(e){ return 'var'; }
}

/* ---------------- 3) GÜNLÜK OTOMATİK YEDEK ---------------- */
function otomatikYedek(){
  var son=0; try{ son=parseInt(localStorage.getItem('ustad_yedek_son')||'0',10)||0; }catch(e){}
  if(Date.now()-son < 24*3600000) return 'bugün zaten alındı';
  try{
    var o={surum:'v5.4', tarih:new Date().toISOString(), ayarlar:{}, katman:{}};
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k && k.indexOf('ustad_')===0 && k!=='ustad_kasa') o.ayarlar[k]=localStorage.getItem(k);
    }
    for(var kk in KATMAN) o.katman[kk]=KATMAN[kk]?1:0;
    var metin=JSON.stringify(o);
    try{ localStorage.setItem('ustad_yedek_icerik', metin); }catch(e){}
    localStorage.setItem('ustad_yedek_son', String(Date.now()));
    if(typeof dosyaIndir==='function') dosyaIndir(metin, 'ustad-otomatik-yedek-'+tarihDamga()+'.json');
    return 'yedek alındı';
  }catch(e){ return 'yedek hatası: '+e.message; }
}
setTimeout(function(){ try{ otomatikYedek(); }catch(e){} }, 45000);

/* ---------------- 4) KENDİNİ TEST EDEN PAKET ---------------- */
var TEST_SONUC=null;
function kendiniTest(){
  durum('guvenlik','🧪 testler çalışıyor…');
  var sonuc={ t:Date.now(), katman:{}, beslemeler:{}, arayuz:{}, toplam:0, gecen:0 };
  /* arayüz kontrolleri */
  function kontrol(ad, ok, ek){ sonuc.toplam++; if(ok) sonuc.gecen++; sonuc.arayuz[ad]={ok:!!ok, ek:ek||''}; }
  kontrol('3D küre kütüphanesi', typeof Globe!=='undefined');
  kontrol('2D harita (Leaflet)', typeof L!=='undefined');
  kontrol('uydu motoru (satellite.js)', typeof satellite!=='undefined');
  kontrol('WebGL', (function(){ try{ var c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); }catch(e){ return false; } })());
  kontrol('küre nesnesi', !!KURE);
  kontrol('katman sayısı 60+', (KATMANLAR.filter(function(x){ return typeof x!=='string'; }).length>=60),
    KATMANLAR.filter(function(x){ return typeof x!=='string'; }).length+' katman');
  kontrol('mod setleri (8)', typeof MOD_SETLERI!=='undefined' && MOD_SETLERI.length===8);
  kontrol('komut paleti', typeof komutPaletAc==='function');
  kontrol('alarm motoru', typeof alarmKontrol==='function');
  kontrol('zekâ modülü', typeof durumSkoru==='function');
  kontrol('bülten üreteci', typeof gunlukBulten==='function');
  kontrol('CSV dışa aktarma', typeof depremCsv==='function');
  kontrol('yerel depolama', (function(){ try{ localStorage.setItem('ustad_t','1'); localStorage.removeItem('ustad_t'); return true; }catch(e){ return false; } })());
  /* beslemeler */
  var beslemeler=[['deprem',depremCek],['gdacs',gdacsYukle],['hava',havaYukle],['gemi',gemiYukle],['uyduc',uyducYukle],
                  ['emsc',emscYukle],['mgm',mgmUyariYukle],['kur',kurYukle],['ghsa',ghsaYukle],['swpcUyari',swpcUyariYukle]];
  var isler=beslemeler.map(function(b){
    var t0=Date.now();
    return Promise.resolve().then(b[1]).then(function(m){ sonuc.beslemeler[b[0]]={ok:true, m:String(m||'').slice(0,50), s:((Date.now()-t0)/1000).toFixed(1)}; })
      .catch(function(e){ sonuc.beslemeler[b[0]]={ok:false, m:String(e.message||e).slice(0,50)}; });
  });
  return Promise.all(isler).then(function(){
    for(var b in sonuc.beslemeler){ sonuc.toplam++; if(sonuc.beslemeler[b].ok) sonuc.gecen++; }
    /* katman çizim testi */
    try{
      var n=(typeof kureTumNoktalar==='function')? kureTumNoktalar().length : 0;
      sonuc.katman={ noktaSayisi:n, hatSayisi:(typeof kureTumYollar==='function'? kureTumYollar().length : 0) };
      kontrol('çizim verisi (nokta/hat)', n>200, n+' nokta');
    }catch(e){}
    sonuc.yuzde=Math.round(sonuc.gecen/sonuc.toplam*100);
    TEST_SONUC=sonuc;
    durum('guvenlik','✔ test bitti: '+sonuc.gecen+'/'+sonuc.toplam+' ('+sonuc.yuzde+'%)');
    guvenlikPanelYaz();
    return sonuc;
  });
}

/* ---------------- 5) GİZLİ MOD ---------------- */
function gizliModDegis(){
  GIZLI.acik=!GIZLI.acik;
  try{
    localStorage.setItem('ustad_gizli', JSON.stringify({acik:GIZLI.acik, sekmeler:GIZLI.sekmeler}));
  }catch(e){}
  gizliUygula();
  guvenlikPanelYaz();
  return GIZLI.acik? 'gizli mod AÇIK':'gizli mod kapalı';
}
function gizliSekmeEkle(){
  var s=prompt('Gizlenecek sekme kimliği (ör. tehdit, ayarlar, defter):','');
  if(!s) return;
  GIZLI.sekmeler.push(s.trim());
  try{ localStorage.setItem('ustad_gizli', JSON.stringify({acik:GIZLI.acik, sekmeler:GIZLI.sekmeler})); }catch(e){}
  gizliUygula(); guvenlikPanelYaz();
}
function gizliUygula(){
  try{
    var a=JSON.parse(localStorage.getItem('ustad_gizli')||'null');
    if(a){ GIZLI.acik=!!a.acik; GIZLI.sekmeler=a.sekmeler||[]; }
  }catch(e){}
  var nav=document.querySelectorAll('#ustNav a[data-git]');
  for(var i=0;i<nav.length;i++){
    var id=nav[i].getAttribute('data-git');
    var gizli=GIZLI.acik && GIZLI.sekmeler.indexOf(id)>=0;
    nav[i].style.display=gizli? 'none':'';
  }
  return GIZLI.sekmeler.length+' sekme gizli';
}

/* ---------------- 6) GİT SÜRÜM KONTROLÜ ---------------- */
function gitDurum(){
  var son=null; try{ son=localStorage.getItem('ustad_git_son'); }catch(e){}
  return son? new Date(parseInt(son,10)).toLocaleString('tr-TR') : 'henüz çalıştırılmadı';
}

/* ---------------- 7) PANEL ---------------- */
function guvenlikPanelHTML(){
  pinOku();
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🔒 GÜVENLİK</h3>';
  h+='<table class="tbl">'
   +satir('PIN kilidi', PIN.ozet? '<b style="color:var(--vurgu)">KURULU</b>' : '<span class="soluk">kurulmadı</span>')
   +satir('hatalı deneme / kilit', PIN.deneme+' / 5'+(PIN.kilit>Date.now()? ' · <b style="color:var(--hata)">'+Math.ceil((PIN.kilit-Date.now())/1000)+' sn kilit</b>':''))
   +satir('şifreli kasa', kasaDurum())
   +satir('son otomatik yedek', (function(){ try{ var t=localStorage.getItem('ustad_yedek_son'); return t? new Date(parseInt(t,10)).toLocaleString('tr-TR'):'yok'; }catch(e){ return 'yok'; } })())
   +satir('gizli mod', (GIZLI.acik? 'AÇIK ('+GIZLI.sekmeler.length+' sekme)':'kapalı'))
   +'</table>';
  h+='<div class="aracSatir">'
   +'<button class="aracBtn" onclick="pinKur()">'+(PIN.ozet?'🔓 PIN KALDIR':'🔐 PIN KUR')+'</button>'
   +'<button class="aracBtn" onclick="pinSor()">⌨️ PIN SOR</button>'
   +'<button class="aracBtn" onclick="kasaKaydet()">🔐 KASA OLUŞTUR/ŞİFRELE</button>'
   +'<button class="aracBtn" onclick="kasaAc()">🔓 KASAYI AÇ</button>'
   +'<button class="aracBtn" onclick="otomatikYedek()">💾 YEDEK AL (ŞİMDİ)</button>'
   +'<button class="aracBtn" onclick="gizliModDegis()">🕶 GİZLİ MOD: '+(GIZLI.acik?'AÇIK':'KAPALI')+'</button>'
   +'<button class="aracBtn" onclick="gizliSekmeEkle()">➕ GİZLENECEK SEKME</button>'
   +'<button class="aracBtn" onclick="gitDurumYaz()">🗂 GİT SÜRÜM KONTROLÜ</button>'
   +'</div>';
  /* test */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">🧪 KENDİNİ TEST EDEN PAKET</h3>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="kendiniTest()">▶ TÜM TESTLERİ ÇALIŞTIR</button>'
   +'<button class="aracBtn" onclick="teshisYaz()">🩺 AÇILIŞ TEŞHİSİ</button></div>';
  if(TEST_SONUC){
    var s=TEST_SONUC;
    var renk=(s.yuzde>=90?'var(--vurgu)':(s.yuzde>=70?'#facc15':'var(--hata)'));
    h+='<div class="grafikKutu" style="border-color:'+renk+'"><div class="grafikBaslik"><span>SON TEST</span><b style="color:'+renk+';font-size:20px">'+s.gecen+'/'+s.toplam+'</b><span style="color:'+renk+'">%'+s.yuzde+'</span><span class="soluk">'+new Date(s.t).toLocaleTimeString('tr-TR')+'</span></div></div>';
    h+='<table class="tbl">';
    for(var a in s.arayuz) h+='<tr><td class="k">'+esc(a)+'</td><td class="v" style="color:'+(s.arayuz[a].ok?'var(--vurgu)':'var(--hata)')+'">'+(s.arayuz[a].ok?'✔':'✘')+' <span class="soluk">'+esc(s.arayuz[a].ek)+'</span></td></tr>';
    for(var b in s.beslemeler){
      var bs=s.beslemeler[b];
      h+='<tr><td class="k">'+esc(b)+'</td><td class="v" style="color:'+(bs.ok?'var(--vurgu)':'var(--hata)')+'">'+(bs.ok?'✔':'✘')+' <span class="soluk">'+esc(bs.m)+(bs.s? ' · '+bs.s+'s':'')+'</span></td></tr>';
    }
    h+='</table>';
    if(s.katman.noktaSayisi) h+='<div class="uyari">Çizimde '+s.katman.noktaSayisi+' nokta ve '+s.katman.hatSayisi+' hat var.</div>';
  }
  return h;
}
function gitDurumYaz(){
  var k=$('gitKutu');
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">🗂 GİT SÜRÜM KONTROLÜ (bozulursa geri dön)</h3>';
  h+='<div class="uyari">Proje klasöründe <b>USTAD-GIT-KAYDET.bat</b> dosyasını çalıştır: her seferinde tüm dosyaları kaydeder '
   +'(<i>commit</i>). Bir şey bozulursa <b>USTAD-GIT-GERI-DON.bat</b> son kayda döndürür. '
   +'Git deposu yalnızca senin bilgisayarında, hiçbir yere gönderilmez. Son kayıt: '+(localStorage.getItem('ustad_git_son')? new Date(parseInt(localStorage.getItem('ustad_git_son'),10)).toLocaleString('tr-TR') : 'henüz yok')+'.</div>';
  if(k) k.innerHTML=h;
  else {
    var el=$('sonuc_guvenlik');
    if(el) el.insertAdjacentHTML('beforeend','<div id="gitKutu">'+h+'</div>');
  }
}
function guvenlikPanelYaz(){
  var el=$('sonuc_guvenlik');
  if(el) el.innerHTML='<h2 class="panelBaslik">🛡 GÜVENLİK · KASA · YEDEK · TESTLER</h2>'+guvenlikPanelHTML();
  gitDurumYaz();
  durum('guvenlik','✔ güvenlik paneli hazır');
}
function guvenlikPanel(){
  panelHazir('guvenlik');
  try{
    var g=JSON.parse(localStorage.getItem('ustad_gizli')||'null');
    if(g){ GIZLI.acik=!!g.acik; GIZLI.sekmeler=g.sekmeler||[]; }
  }catch(e){}
  guvenlikPanelYaz();
}
/* açılışta pin kapısı + gizli mod */
setTimeout(function(){
  pinOku(); gizliUygula();
  if(PIN.ozet && !PIN.acik) pinKapisi();
}, 2600);
