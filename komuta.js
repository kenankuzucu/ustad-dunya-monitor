/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — KOMUTA MERKEZİ (v5.2)
   Ctrl+K komut paleti · Türkçe sesli komut · klavye kısayolları ·
   sağ tık menüsü · yer arama · yer imleri · sinematik kamera turu ·
   HUD · kalite modu · ekran görüntüsü · duvar (kiosk) modu · paylaş
   ============================================================ */
var YERIMLERI=[
  {ad:'GAZİANTEP', lat:37.066, lng:37.383, alt:0.55},
  {ad:'İSTANBUL',  lat:41.01,  lng:28.97,  alt:0.55},
  {ad:'ANKARA',    lat:39.93,  lng:32.86,  alt:0.55},
  {ad:'İZMİR',     lat:38.42,  lng:27.14,  alt:0.55},
  {ad:'İST. BOĞAZI', lat:41.12, lng:29.05, alt:0.25},
  {ad:'HÜRMÜZ',    lat:26.57,  lng:56.25,  alt:0.8},
  {ad:'SÜVEYŞ',    lat:30.45,  lng:32.35,  alt:0.8},
  {ad:'MALAKKA',   lat:2.5,    lng:101.5,  alt:0.9},
  {ad:'PANAMA',    lat:9.1,    lng:-79.7,  alt:0.7},
  {ad:'TAYVAN',    lat:24.0,   lng:120.5,  alt:0.8},
  {ad:'K. KORE',   lat:38.3,   lng:127.5,  alt:0.8},
  {ad:'UKRAYNA',   lat:49.0,   lng:32.0,   alt:1.1},
  {ad:'ORTADOĞU',  lat:32.0,   lng:36.0,   alt:1.2},
  {ad:'DÜNYA',     lat:20,     lng:10,     alt:2.4}
];
var HUD_AC=true, KALITE='normal', KIOSK=false, KIOSK_TICK=null, TUR_TICK=null;
var KFT=0, KFP=0, KFP_SON=Date.now(), IP_BILGI=null, SES_ACIK=false;
var TUR_LISTE=['DÜNYA','ORTADOĞU','UKRAYNA','TAYVAN','K.KORE','SÜVEYŞ','HÜRMÜZ','PANAMA','İST. BOĞAZI','GAZİANTEP'];

/* ---------------- 1) YARDIMCI ---------------- */
function komutaHazirMi(){ return (typeof KURE!=='undefined' && KURE) || (typeof HARITA!=='undefined' && HARITA); }
function uc(lat,lng,alt,ms){
  ms=ms||1400;
  if(typeof KURE!=='undefined' && KURE && typeof MOD!=='undefined' && MOD!=='2d'){
    try{ KURE.controls().autoRotate=false; setTimeout(function(){ try{ if(KURE) KURE.controls().autoRotate=true; }catch(e){} }, ms+3500); }catch(e){}
    try{ KURE.pointOfView({lat:lat,lng:lng,altitude:(alt||0.6)}, ms); }catch(e){}
  }
  if(typeof HARITA!=='undefined' && HARITA){ try{ HARITA.flyTo([lat,lng], (alt&&alt<0.4)?9:(alt&&alt<0.9?6:4), {duration:1.2}); }catch(e){} }
}
function yerimineGit(ad){
  for(var i=0;i<YERIMLERI.length;i++){ if(YERIMLERI[i].ad===ad){ uc(YERIMLERI[i].lat, YERIMLERI[i].lng, YERIMLERI[i].alt, 1500); return ad; } }
  return null;
}
function yerAra(q){
  if(!q) return;
  durum('harita','yer aranıyor: '+q);
  fetchJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&language=tr&name='+encodeURIComponent(q), 12000).then(function(d){
    if(d && d.results && d.results.length){
      var r=d.results[0];
      uc(r.latitude, r.longitude, 0.5, 1300);
      durum('harita','✔ '+r.name+(r.admin1?' / '+r.admin1:'')+(r.country?' · '+r.country:''));
    } else { durum('harita','✘ yer bulunamadı: '+q); }
  }).catch(function(e){ durum('harita','✘ yer arama hatası: '+e.message); });
}

/* ---------------- 2) ARAÇ ÇUBUĞU (yer arama + yer imleri + ses) ---------------- */
function aracCubuguDoldur(){
  var el=$('aracCubugu'); if(!el || el.getAttribute('dolu')==='1') return;
  var h='<div class="aracSatir">';
  h+='<button class="aracBtn" id="tvBtn" onclick="tvDegis()" title="ÜSTAD TV panelini aç/kapat (sol taraf)">📺 ÜSTAD TV: AÇIK</button>';
  h+='<input class="aracAra" id="yerAra" placeholder="🔎 yer ara → uç (ör. Gaziantep, Tokyo)" onkeydown="if(event.key===\'Enter\'){yerAra(this.value);}">';
  h+='<button class="aracBtn" id="sesBtn" onclick="sesKomut()" title="Türkçe sesli komut">🎙️ SES</button>';
  h+='<button class="aracBtn" onclick="komutPaletAc()" title="Ctrl+K">⌨️ KOMUT</button>';
  h+='<button class="aracBtn" onclick="hudAcKapat()" title="bilgi katmanı">📊 HUD</button>';
  h+='</div>';
  h+='<div class="aracSatir">';
  for(var i=0;i<YERIMLERI.length;i++){ h+='<button class="yerim" onclick="yerimineGit(\''+YERIMLERI[i].ad+'\')">'+esc(YERIMLERI[i].ad)+'</button>'; }
  h+='</div>';
  h+='<div class="aracSatir">';
  h+='<button class="aracBtn" onclick="kameraTuru()" id="turBtn" title="sinematik tur">🎬 TUR</button>';
  h+='<button class="aracBtn" onclick="ekranAl()" title="Ctrl+S">📷 EKRAN</button>';
  h+='<button class="aracBtn" onclick="duvarModu()" title="Ctrl+D">🖥️ DUVAR</button>';
  h+='<button class="aracBtn" onclick="paylasDurum()" title="özet kopyala">📤 PAYLAŞ</button>';
  h+='<button class="aracBtn" onclick="kaliteDegis()" id="kalBtn">⚙️ KALİTE: NORMAL</button>';
  h+='<button class="aracBtn" onclick="yardimAc()" title="F1">❔ YARDIM</button>';
  h+='</div>';
  el.innerHTML=h; el.setAttribute('dolu','1');
  if(typeof tvAcKapatUygula==='function') tvAcKapatUygula();
}
setInterval(function(){ if(typeof AKTIF!=='undefined' && AKTIF==='harita'){ var el=$('aracCubugu'); if(el && el.getAttribute('dolu')!=='1') aracCubuguDoldur(); } }, 1200);

/* ---------------- 3) KOMUT PALETİ (Ctrl+K) ---------------- */
var KOMUTLAR=[
  {ad:'AFET modunu aç', fn:function(){ modSetiUygula(1); return 'AFET modu'; }},
  {ad:'UÇUŞ modunu aç', fn:function(){ modSetiUygula(2); return 'UÇUŞ modu'; }},
  {ad:'SİBER modunu aç', fn:function(){ modSetiUygula(3); return 'SİBER modu'; }},
  {ad:'UZAY modunu aç', fn:function(){ modSetiUygula(4); return 'UZAY modu'; }},
  {ad:'TÜRKİYE modunu aç', fn:function(){ modSetiUygula(5); return 'TÜRKİYE modu'; }},
  {ad:'GENEL moda dön', fn:function(){ modSetiUygula(0); return 'GENEL mod'; }},
  {ad:'tüm katmanları kapat', fn:function(){ modSetiUygula(7); return 'katmanlar kapatıldı'; }},
  {ad:'3D küre', fn:function(){ modSec('3d'); return '3D küre'; }},
  {ad:'2D harita', fn:function(){ modSec('2d'); return '2D harita'; }},
  {ad:'4D sinema', fn:function(){ modSec('4d'); return '4D sinema'; }},
  {ad:'deprem paneli', fn:function(){ git('deprem'); return 'deprem paneli'; }},
  {ad:'siber tehdit paneli', fn:function(){ git('tehdit'); return 'tehdit paneli'; }},
  {ad:'uzay paneli', fn:function(){ git('uzay'); return 'uzay paneli'; }},
  {ad:'alarm paneli', fn:function(){ git('alarm'); return 'alarm paneli'; }},
  {ad:'ayarlar paneli', fn:function(){ git('ayarlar'); return 'ayarlar paneli'; }},
  {ad:'kaynaklar', fn:function(){ git('kaynaklar'); return 'kaynaklar'; }},
  {ad:'günlük word bülteni üret', fn:function(){ gunlukBulten(); return 'bülten indirildi'; }},
  {ad:'sesli özet oku', fn:function(){ sesliOzet(); return 'sesli özet'; }},
  {ad:'deprem csv indir', fn:function(){ depremCsv(); return 'deprem csv'; }},
  {ad:'tehdit csv indir', fn:function(){ tehditCsv(); return 'tehdit csv'; }},
  {ad:'ekran görüntüsü al', fn:function(){ ekranAl(); return 'ekran görüntüsü'; }},
  {ad:'duvar modu', fn:function(){ duvarModu(); return 'duvar modu'; }},
  {ad:'sinematik tur başlat', fn:function(){ kameraTuru(); return 'kamera turu'; }},
  {ad:'uydudan yakınlaş (ISS)', fn:function(){ if(CANLI.iss && CANLI.iss[0]) uc(CANLI.iss[0].lat, CANLI.iss[0].lng, 0.35, 1500); return 'ISS'; }},
  {ad:'Gaziantep yakınlık modu', fn:function(){ KATMAN.yakinlik=1; kureCiz(); haritaSenkron(true); return 'Gaziantep çevresi'; }},
  {ad:'gece nöbeti modu', fn:function(){ return geceNobetiDegis(); }},
  {ad:'tema değiştir', fn:function(){ return temaSirada(); }},
  {ad:'kaynakları yenile (tümü)', fn:function(){ canliHepsiBaslat(); return 'tüm kaynaklar yenileniyor'; }},
  {ad:'kendi IP ve ağ bilgim', fn:function(){ ipKontrol(); return 'IP kontrolü — HUD penceresine bak'; }},
  {ad:'yardım', fn:function(){ yardimAc(); return 'yardım'; }},
  {ad:'ayarları yedekle (JSON)', fn:function(){ ayarYedekle(); return 'yedek indirildi'; }},
  {ad:'çevrimdışı önbelleği tazele', fn:function(){ onbellekKaydet(); return 'önbellek tazelendi'; }},
  {ad:'açılış teşhisi', fn:function(){ git('ayarlar'); teshisYaz(); return 'teşhis'; }}
];
function komutPaletAc(){
  var p=$('komutPalet');
  if(!p){
    p=document.createElement('div'); p.id='komutPalet'; p.className='paletZemin';
    p.onclick=function(e){ if(e.target===p) komutPaletKapat(); };
    document.body.appendChild(p);
  }
  var h='<div class="paletKutu"><div class="paletUst">⌨️ KOMUT PALETİ <span class="soluk">(Esc kapat · ↑↓ seç · Enter çalıştır)</span></div>'
    +'<input id="paletGirdi" class="paletGirdi" placeholder="komut yaz… (ör. afet, siber, ekran, bülten)" autocomplete="off">'
    +'<div id="paletListe" class="paletListe"></div></div>';
  p.innerHTML=h; p.style.display='block';
  var g=$('paletGirdi'); g.value=''; paletListele('');
  g.oninput=function(){ paletListele(this.value); };
  g.onkeydown=function(e){
    if(e.key==='Escape') komutPaletKapat();
    else if(e.key==='ArrowDown'){ PALET_SEC=Math.min(PALET_SEC+1, PALET_SONUC.length-1); paletListele(g.value); e.preventDefault(); }
    else if(e.key==='ArrowUp'){ PALET_SEC=Math.max(0, PALET_SEC-1); paletListele(g.value); e.preventDefault(); }
    else if(e.key==='Enter'){ if(PALET_SONUC[PALET_SEC]) komutCalistir(PALET_SONUC[PALET_SEC]); }
  };
  setTimeout(function(){ try{ g.focus(); }catch(e){} }, 60);
}
var PALET_SEC=0, PALET_SONUC=[];
function paletListele(q){
  q=(q||'').toLocaleLowerCase('tr');
  PALET_SONUC=[];
  for(var i=0;i<KOMUTLAR.length;i++){
    if(!q || KOMUTLAR[i].ad.toLocaleLowerCase('tr').indexOf(q)>=0) PALET_SONUC.push(KOMUTLAR[i]);
  }
  if(q){ /* yer arama önerisi */
    PALET_SONUC.push({ad:'🗺️ "'+q+'" yerine uç', fn:(function(x){ return function(){ yerAra(x); return x+' konumuna uçuldu'; }; })(q)});
  }
  PALET_SONUC=PALET_SONUC.slice(0,14);
  if(PALET_SEC>=PALET_SONUC.length) PALET_SEC=0;
  var h='';
  for(var j=0;j<PALET_SONUC.length;j++){
    h+='<div class="paletSat'+(j===PALET_SEC?' sec':'')+'" onclick="komutCalistir(KOMUTLAR['+KOMUTLAR.indexOf(PALET_SONUC[j])+'])||paletTikla('+j+')">'+esc(PALET_SONUC[j].ad)+'</div>';
  }
  var el=$('paletListe'); if(el) el.innerHTML=h;
}
function paletTikla(j){ if(PALET_SONUC[j]) komutCalistir(PALET_SONUC[j]); }
function komutCalistir(k){
  if(!k) return;
  var sonuc='';
  try{ sonuc=k.fn()||k.ad; }catch(e){ sonuc='HATA: '+e.message; }
  komutPaletKapat();
  if(typeof durum==='function') durum('harita','⌨️ '+sonuc);
  if(typeof alarmSeritGoster==='function') alarmSeritGoster('KOMUT', sonuc);
}
function komutPaletKapat(){ var p=$('komutPalet'); if(p) p.style.display='none'; }

/* ---------------- 4) TÜRKÇE SESLİ KOMUT ---------------- */
function sesKomut(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    alert('Bu tarayıcı sesli komutu desteklemiyor.\n(Chrome/Edge gerekir)');
    return;
  }
  if(location.protocol==='file:'){
    alert('Sesli komut için panelin YEREL SUNUCU modunda açılması gerekir\n'
      +'(tarayıcı mikrofonu file:// için kapatır).\n\n'
      +'Çözüm: klasördeki "USTAD-MONITOR-YEREL.bat" dosyasını çalıştır —\n'
      +'panel http://localhost:8878 adresinden açılır, mikrofon da çalışır.');
    return;
  }
  var r=new SR();
  r.lang='tr-TR'; r.continuous=false; r.interimResults=false; r.maxAlternatives=1;
  var b=$('sesBtn'); if(b){ b.className='aracBtn sesAcik'; b.textContent='🎙️ DİNLİYOR…'; }
  durum('harita','🎙️ dinliyorum… (konuş: "Gaziantep", "afet modu", "ekran görüntüsü")');
  r.onresult=function(e){
    var metin=e.results[0][0].transcript||'';
    durum('harita','🎙️ duydum: "'+metin+'"');
    sesKomutYorumla(metin);
  };
  r.onerror=function(e){ durum('harita','✘ ses hatası: '+(e.error||'')); };
  r.onend=function(){ var bb=$('sesBtn'); if(bb){ bb.className='aracBtn'; bb.textContent='🎙️ SES'; } };
  try{ r.start(); }catch(e){ durum('harita','✘ ses başlatılamadı: '+e.message); }
}
function sesKomutYorumla(metin){
  var m=(metin||'').toLocaleLowerCase('tr');
  /* 1) bilinen yer imleri */
  for(var i=0;i<YERIMLERI.length;i++){
    var k=YERIMLERI[i].ad.toLocaleLowerCase('tr');
    if(m.indexOf(k)>=0 || (k==='gazi̇antep' && m.indexOf('antep')>=0)){ yerimineGit(YERIMLERI[i].ad); return; }
  }
  if(m.indexOf('istanbul')>=0 || m.indexOf('i̇stanbul')>=0){ yerimineGit('İSTANBUL'); return; }
  var kurallar=[
    [['afet'],'afet mod'], [['uçuş','ucus'],'uçuş mod'], [['siber'],'siber mod'], [['uzay'],'uzay mod'],
    [['türkiye','turkiye'],'türkiye mod'], [['genel'],'genel mod'], [['temizle','kapat'],'tüm katmanları kapat'],
    [['iki boyut','2 boyut','harita görünümü'],'2d'], [['üç boyut','küre görünümü'],'3d'],
    [['ekran','ekran görüntüsü','fotoğraf'],'ekran'],
    [['bülten','rapor','word'],'bülten'],
    [['sesli özet','oku'],'sesli özet'],
    [['duvar'],'duvar'],
    [['tur','sinema','gezinti'],'tur'],
    [['deprem paneli','depremler'],'deprem paneli'],
    [['tehdit','siber tehdit'],'siber tehdit paneli'],
    [['alarm'],'alarm paneli'],
    [['ayar','teşhis','teshis'],'ayarlar paneli'],
    [['yenile','güncelle'],'yenile'],
    [['yardım','komutlar'],'yardım'],
    [['gece nöbeti','gece modu'],'gece nöbeti']
  ];
  for(var c=0;c<kurallar.length;c++){
    for(var s=0;s<kurallar[c][0].length;s++){
      if(m.indexOf(kurallar[c][0][s])>=0){ sesKomutCalistir(kurallar[c][1]); return; }
    }
  }
  /* 2) yer adı → geocode */
  var temiz=metin.replace(/('[e'a]|'[a'e]| git| uç| git\.| git!|'a git|'e git)/gi,'').trim();
  if(temiz.length>2){ yerAra(temiz); return; }
  durum('harita','✘ komut anlaşılmadı: "'+metin+'"');
}
function sesKomutCalistir(kod){
  for(var i=0;i<KOMUTLAR.length;i++){
    var a=KOMUTLAR[i].ad.toLocaleLowerCase('tr');
    if(a===kod || a.indexOf(kod)===0){ komutCalistir(KOMUTLAR[i]); return; }
  }
  if(kod==='yenile'){ canliHepsiBaslat(); durum('harita','⌨️ tüm kaynaklar yenileniyor'); }
}

/* ---------------- 5) KISAYOLLAR + YARDIM ---------------- */
function temaSirada(){
  var btn=document.querySelectorAll('.renkBtn[data-r]');
  if(!btn.length) return 'tema yok';
  var suan=null;
  for(var i=0;i<btn.length;i++){ if(btn[i].className.indexOf('aktif')>=0) suan=i; }
  var yeni=btn[((suan==null?0:suan)+1)%btn.length];
  var r=yeni.getAttribute('data-r');
  renkUygula(r);
  return 'tema: '+yeni.textContent;
}
function yardimAc(){
  var p=$('yardimKutu');
  if(!p){
    p=document.createElement('div'); p.id='yardimKutu'; p.className='paletZemin';
    p.onclick=function(e){ if(e.target===p) p.style.display='none'; };
    document.body.appendChild(p);
  }
  var sat=[
    ['Ctrl + K','komut paleti'],
    ['F1','bu yardım ekranı'],
    ['Ctrl + S','ekran görüntüsü (PNG)'],
    ['Ctrl + D','duvar / kiosk modu'],
    ['Ctrl + T','sıradaki tema'],
    ['Ctrl + N','gece nöbeti modu'],
    ['Ctrl + M','matrix yağmuru'],
    ['Ctrl + 1…7','hazır mod setleri (GENEL/AFET/UÇUŞ/SİBER/UZAY/TÜRKİYE/DENİZ)'],
    ['Ctrl + B','günlük Word bülteni'],
    ['Ctrl + Q','sesli özet (Türkçe)'],
    ['1 / 2 / 3','3D küre · 4D sinema · 2D harita'],
    ['Shift + tık (küre)','iki nokta arası mesafe ölç'],
    ['Sağ tık (harita)','buraya odaklan · mesafe · koordinat kopyala'],
    ['Esc','açık pencereleri kapat']
  ];
  var h='<div class="paletKutu" style="max-width:560px"><div class="paletUst">❔ ÜSTAD MONİTÖR — KISAYOLLAR</div><table class="tbl">';
  for(var i=0;i<sat.length;i++) h+='<tr><td class="k" style="font-family:monospace">'+esc(sat[i][0])+'</td><td class="v">'+esc(sat[i][1])+'</td></tr>';
  h+='</table><div class="paletAlt"><span class="soluk">Sesli komut: 🎙️ SES düğmesi (yerel sunucu modunda) · Komut: Ctrl+K</span></div></div>';
  p.innerHTML=h; p.style.display='block';
}
document.addEventListener('keydown', function(e){
  var tag=(e.target && e.target.tagName || '').toLowerCase();
  var yaziyor=(tag==='input'||tag==='textarea'||tag==='select');
  if(e.key==='Escape'){
    komutPaletKapat();
    var y=$('yardimKutu'); if(y) y.style.display='none';
    var m=$('menuKutu'); if(m) m.style.display='none';
    var k=$('noktaKart'); if(k) k.style.display='none';
    return;
  }
  if(e.ctrlKey && (e.key==='k'||e.key==='K')){ e.preventDefault(); komutPaletAc(); return; }
  if(e.ctrlKey && (e.key==='s'||e.key==='S')){ e.preventDefault(); ekranAl(); return; }
  if(e.ctrlKey && (e.key==='d'||e.key==='D')){ e.preventDefault(); duvarModu(); return; }
  if(e.ctrlKey && (e.key==='t'||e.key==='T')){ e.preventDefault(); temaSirada(); return; }
  if(e.ctrlKey && (e.key==='n'||e.key==='N')){ e.preventDefault(); geceNobetiDegis(); return; }
  if(e.ctrlKey && (e.key==='b'||e.key==='B')){ e.preventDefault(); gunlukBulten(); return; }
  if(e.ctrlKey && (e.key==='q'||e.key==='Q')){ e.preventDefault(); sesliOzet(); return; }
  if(e.ctrlKey && e.key>= '1' && e.key<='7'){ e.preventDefault(); modSetiUygula(parseInt(e.key,10)-1); return; }
  if(e.key==='F1'){ e.preventDefault(); yardimAc(); return; }
  if(yaziyor) return;
  if(e.key==='1'){ modSec('3d'); }
  else if(e.key==='2'){ modSec('4d'); }
  else if(e.key==='3'){ modSec('2d'); }
});

/* ---------------- 6) SAĞ TIK MENÜSÜ + MESAFE ÖLÇÜM ---------------- */
var OLC_NOKTA=null;
function menuGoster(x,y,lat,lng){
  var p=$('menuKutu');
  if(!p){
    p=document.createElement('div'); p.id='menuKutu'; p.className='menuKutu';
    document.body.appendChild(p);
    document.addEventListener('click', function(ev){ if(p.style.display==='block' && ev.target!==p && !p.contains(ev.target)) p.style.display='none'; });
  }
  var h='<div class="menuSat" onclick="uc('+lat+','+lng+',0.4,1200);menuKapat();">🎯 buraya odaklan</div>'
    +'<div class="menuSat" onclick="olcumBasla('+lat+','+lng+');menuKapat();">📏 buradan mesafe ölç</div>'
    +'<div class="menuSat" onclick="noktaKartAc('+lat+','+lng+');menuKapat();">ℹ️ nokta bilgi kartı</div>'
    +'<div class="menuSat" onclick="koordKopyala('+lat+','+lng+');menuKapat();">📋 koordinat kopyala</div>'
    +'<div class="menuSat" onclick="olayHikayesi('+lat+','+lng+');menuKapat();">🧩 olay hikâyesi (çevre katmanları)</div>';
  p.innerHTML=h;
  p.style.left=Math.min(x, window.innerWidth-250)+'px';
  p.style.top=Math.min(y, window.innerHeight-190)+'px';
  p.style.display='block';
}
function menuKapat(){ var p=$('menuKutu'); if(p) p.style.display='none'; }
function olcumBasla(lat,lng){
  OLC_NOKTA={lat:lat,lng:lng};
  if(typeof haritaSenkron==='function'){ /* görsel işaret 2D'de */
    try{ if(HARITA){ if(HARITA_OLC) HARITA.removeLayer(HARITA_OLC); HARITA_OLC=L.circleMarker([lat,lng],{radius:5,color:'#00ff41'}).addTo(HARITA); } }catch(e){}
  }
  durum('harita','📏 ölçüm başladı — şimdi hedefe sağ tıkla ("mesafeyi bitir")');
  var p=$('menuKutu'); if(p){ p.innerHTML='<div class="menuSat" onclick="olcumBitir('+lat+','+lng+')">📏 mesafeyi bitir (buraya)</div><div class="menuSat" onclick="menuKapat()">iptal</div>'; }
}
function olcumBitir(lat,lng){
  if(!OLC_NOKTA){ return; }
  var d=mesafeKm(OLC_NOKTA.lat, OLC_NOKTA.lng, lat, lng);
  var nm=(d/1.852), mi=(d*0.621371);
  durum('harita','📏 mesafe: '+Math.round(d)+' km · '+nm.toFixed(0)+' deniz mili · '+Math.round(mi)+' mil');
  if(typeof alarmSeritGoster==='function') alarmSeritGoster('ÖLÇÜM', Math.round(d)+' km ('+nm.toFixed(0)+' dm)');
  try{
    if(typeof HARITA!=='undefined' && HARITA && typeof L!=='undefined'){
      if(HARITA_OLC){ HARITA.removeLayer(HARITA_OLC); }
      HARITA_OLC=L.layerGroup([
        L.circleMarker([OLC_NOKTA.lat,OLC_NOKTA.lng],{radius:5,color:'#00ff41'}).addTo(HARITA),
        L.circleMarker([lat,lng],{radius:5,color:'#ff2d2d'}).addTo(HARITA),
        L.polyline([[OLC_NOKTA.lat,OLC_NOKTA.lng],[lat,lng]],{color:'#00ff41',dashArray:'6 6',weight:2}).addTo(HARITA)
      ]).addTo(HARITA);
      var gc=new L.LayerGroup;
    }
  }catch(e){}
  OLC_NOKTA=null;
}
function koordKopyala(lat,lng){
  var t=lat.toFixed(4)+', '+lng.toFixed(4);
  try{ navigator.clipboard.writeText(t); durum('harita','📋 kopyalandı: '+t); }
  catch(e){ alert('Koordinat: '+t); }
}
/* küreye sağ tık */
document.addEventListener('contextmenu', function(e){
  var k=$('kure');
  if(k && k.contains(e.target) && typeof KURE!=='undefined' && KURE){
    e.preventDefault();
    /* globe.gl: tıklanan noktayı piksellerden al */
    var p=KURE.toGeoCoords ? null : null;
    var latlng=kurePikseldenGeo(e.clientX, e.clientY);
    if(latlng) menuGoster(e.clientX, e.clientY, latlng.lat, latlng.lng);
  }
});
function kurePikseldenGeo(x,y){
  try{
    if(!KURE || !KURE.camera || !KURE.scene) return null;
    var el=$('kure'), r=el.getBoundingClientRect();
    var ndc={x:((x-r.left)/r.width)*2-1, y:-((y-r.top)/r.height)*2+1};
    var ray=new THREE.Raycaster();
    ray.setFromCamera(ndc, KURE.camera());
    var kure=(KURE.scene().children||[]).filter(function(o){ return o.type==='Mesh' && o.geometry && o.geometry.type==='SphereGeometry'; })[0];
    if(!kure) return null;
    var kes=ray.intersectObject(kure, true);
    if(!kes || !kes.length) return null;
    var pt=kes[0].point;
    /* üç boyutlu nokta -> enlem/boylam (globe.gl earth-night dokusuna göre) */
    var lat=90-(Math.acos(pt.y/pt.length())*180/Math.PI);
    var theta=Math.atan2(pt.z, pt.x);
    var lng=((theta*180/Math.PI)-90);
    while(lng<-180) lng+=360; while(lng>180) lng-=360;
    var kuzey=lat>=0;
    return {lat:(kuzey?lat:-Math.abs(lat)), lng:lng};
  }catch(e){ return null; }
}
/* 2D haritaya sağ tık bağla */
setInterval(function(){
  if(typeof HARITA!=='undefined' && HARITA && !HARITA.__sagTik){
    HARITA.__sagTik=true;
    HARITA.on('contextmenu', function(ev){
      if(OLC_NOKTA){ olcumBitir(ev.latlng.lat, ev.latlng.lng); return; }
      menuGoster(ev.originalEvent.clientX, ev.originalEvent.clientY, ev.latlng.lat, ev.latlng.lng);
    });
  }
}, 1500);

/* ---------------- 7) HUD ---------------- */
function hudKur(){
  var d=document.createElement('div'); d.id='hud'; d.className='hud';
  d.innerHTML='<div id="hudSatir1">HUD hazırlanıyor…</div><div id="hudSatir2" class="soluk"></div>';
  document.body.appendChild(d);
  setInterval(hudYaz, 1000);
}
function hudYaz(){
  var d=$('hud'); if(!d) return;
  d.style.display=HUD_AC?'block':'none';
  if(!HUD_AC) return;
  var fps=Math.round(KFP/((Date.now()-KFP_SON)/1000)||0);
  KFP=0; KFP_SON=Date.now();
  var aktif=0, toplam=0;
  if(typeof KATMAN!=='undefined' && typeof KATMANLAR!=='undefined'){
    for(var i=0;i<KATMANLAR.length;i++){ var k=KATMANLAR[i]; if(typeof k==='string') continue; toplam++; if(KATMAN[k[0]]) aktif++; }
  }
  var nokta=0;
  try{ nokta=(typeof kureTumNoktalar==='function'? kureTumNoktalar().length : 0); }catch(e){}
  var yas='-';
  try{
    var enYeni=0;
    for(var kk in CANLI_SAAT){ if(CANLI_SAAT[kk] && CANLI_SAAT[kk]>enYeni) enYeni=CANLI_SAAT[kk]; }
    if(enYeni) yas=Math.round((Date.now()-enYeni)/60000)+' dk önce';
  }catch(e){}
  var s1=$('hudSatir1'); if(s1) s1.innerHTML='<b style="color:var(--ana2)">'+fps+' FPS</b> · '+aktif+'/'+toplam+' katman · '+nokta+' nokta · veri: '+yas
    +' · '+(typeof MOD!=='undefined'?MOD.toUpperCase():'-');
  var s2=$('hudSatir2'); if(s2) s2.textContent='ÜSTAD KENAN KUZUCU · ÜSTAD MONİTÖR · v5.2 · IP: '+((IP_BILGI&&IP_BILGI.ip)||'…')+((IP_BILGI&&IP_BILGI.tor)?' · TOR AKTİF':'');
}
function hudAcKapat(){ HUD_AC=!HUD_AC; try{ localStorage.setItem('ustad_hud', HUD_AC?'1':'0'); }catch(e){} }
(function(){ KFP_SON=Date.now();
  requestAnimationFrame(function say(){ KFP++; requestAnimationFrame(say); });
})();

/* ---------------- 8) KALİTE MODU ---------------- */
function kaliteDegis(){
  KALITE = (KALITE==='normal') ? 'dusuk' : (KALITE==='dusuk' ? 'yuksek' : 'normal');
  kaliteUygula();
  return 'kalite: '+KALITE.toUpperCase();
}
function kaliteUygula(){
  try{ localStorage.setItem('ustad_kalite', KALITE); }catch(e){}
  var b=$('kalBtn'); if(b) b.textContent='⚙️ KALİTE: '+KALITE.toLocaleUpperCase('tr');
  try{
    if(KURE){
      if(KALITE==='dusuk'){ KURE.showAtmosphere(false); if(KURE.backgroundImageUrl) KURE.backgroundImageUrl(null); KURE.controls().autoRotateSpeed=0.3; }
      else { KURE.showAtmosphere(true); if(KURE.backgroundImageUrl) KURE.backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png'); KURE.controls().autoRotateSpeed=0.55; }
    }
  }catch(e){}
  if(typeof HARITA_SINIR!=='undefined'){ HARITA_SINIR = KALITE==='dusuk'?140:(KALITE==='yuksek'?600:350); }
  var yari=window.HARITA_KARO_KALITE;
  try{
    if(HARITA && typeof L!=='undefined'){
      HARITA.eachLayer(function(l){
        if(l instanceof L.TileLayer){ l.setOpacity(KALITE==='dusuk'?0.75:1); }
      });
    }
  }catch(e){}
  if(KALITE==='dusuk'){ matrisAcKapat(false); }
  return KALITE;
}
(function(){ var k='normal'; try{ k=localStorage.getItem('ustad_kalite')||'normal'; }catch(e){} KALITE=k; setTimeout(kaliteUygula, 2600); })();

/* ---------------- 9) EKRAN GÖRÜNTÜSÜ ---------------- */
function ekranAl(){
  try{
    var src=null;
    if(typeof MOD!=='undefined' && MOD==='2d'){ /* 2D'de küre canvas'ı yok → tüm sayfa yerine harita kutusu */
      src=null;
    }
    var kanvaslar=document.querySelectorAll('canvas');
    var enBuyuk=null, enAlan=0;
    for(var i=0;i<kanvaslar.length;i++){
      var c=kanvaslar[i], alan=(c.width||0)*(c.height||0);
      if(alan>enAlan && c.width>200){ enAlan=alan; enBuyuk=c; }
    }
    if(!enBuyuk){ durum('harita','✘ ekran görüntüsü için tuval bulunamadı'); return; }
    var yeni=document.createElement('canvas');
    yeni.width=enBuyuk.width; yeni.height=enBuyuk.height;
    var ctx=yeni.getContext('2d');
    ctx.fillStyle='#000'; ctx.fillRect(0,0,yeni.width,yeni.height);
    ctx.drawImage(enBuyuk,0,0);
    /* alt bilgi şeridi */
    var serit=Math.max(46, Math.round(yeni.height*0.045));
    ctx.fillStyle='rgba(0,0,0,.78)'; ctx.fillRect(0, yeni.height-serit, yeni.width, serit);
    ctx.fillStyle='#22c55e'; ctx.font='bold '+Math.round(serit*0.36)+'px monospace';
    var aktif=0; for(var k in KATMAN){ if(KATMAN[k]) aktif++; }
    ctx.fillText('ÜSTAD DÜNYA MONİTÖRÜ · '+aktif+' katman · '+new Date().toLocaleString('tr-TR'), 14, yeni.height-serit*0.34);
    ctx.fillStyle='#7bffa1'; ctx.font=Math.round(serit*0.3)+'px monospace';
    ctx.fillText('ÜSTAD KENAN KUZUCU · GAZİANTEP', 14, yeni.height-serit*0.09);
    var veri=yeni.toDataURL('image/png');
    dosyaIndirBlob(veri, 'ustad-monitor-'+tarihDamga()+'.png');
    durum('harita','📷 ekran görüntüsü kaydedildi');
  }catch(e){ durum('harita','✘ ekran görüntüsü hatası: '+e.message); }
}
function tarihDamga(){
  var d=new Date(), p=function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());
}
function dosyaIndirBlob(veriUrl, ad){
  try{
    var a=document.createElement('a'); a.href=veriUrl; a.download=ad;
    document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 800);
  }catch(e){}
}

/* ---------------- 10) DUVAR / KIOSK MODU ---------------- */
function duvarModu(){
  KIOSK=!KIOSK;
  document.body.classList.toggle('kiosk', KIOSK);
  var b=$('turBtn');
  if(KIOSK){
    try{ if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }catch(e){}
    var b3=$('hud'); if(b3) b3.classList.add('hudBuyuk');
    var dizi=['deprem','afet','tehdit','uzay','piyasa','hava'];
    var i=0;
    KIOSK_TICK=setInterval(function(){
      if(!KIOSK) return;
      git(dizi[i%dizi.length]); i++;
    }, 25000);
    durum('harita','🖥️ DUVAR MODU açık — 25 sn\'de sekme değişir (Esc/Ctrl+D kapatır). İmleç gizli.');
  } else {
    if(KIOSK_TICK){ clearInterval(KIOSK_TICK); KIOSK_TICK=null; }
    try{ if(document.exitFullscreen) document.exitFullscreen(); }catch(e){}
    git('harita');
    durum('harita','duvar modu kapandı');
  }
  return KIOSK?'duvar modu AÇIK':'duvar modu kapalı';
}
/* Esc kiosk kapatma */
document.addEventListener('keydown', function(e){
  if(e.key==='Escape' && KIOSK){ KIOSK=false; document.body.classList.remove('kiosk');
    if(KIOSK_TICK){ clearInterval(KIOSK_TICK); KIOSK_TICK=null; }
    try{ if(document.exitFullscreen) document.exitFullscreen(); }catch(e){} }
});

/* ---------------- 11) SİNEMATİK KAMERA TURU ---------------- */
function kameraTuru(){
  if(TUR_TICK){ clearInterval(TUR_TICK); TUR_TICK=null; var b=$('turBtn'); if(b) b.textContent='🎬 TUR'; durum('harita','kamera turu durdu'); return; }
  var i=0;
  var b=$('turBtn'); if(b) b.textContent='⏹ TUR DURDUR';
  durum('harita','🎬 sinematik tur başladı');
  yerimineGit(TUR_LISTE[0]);
  TUR_TICK=setInterval(function(){
    i++;
    if(i>=TUR_LISTE.length){ i=0; }
    yerimineGit(TUR_LISTE[i]);
  }, 9000);
}

/* ---------------- 12) PAYLAŞ ---------------- */
function paylasDurum(){
  var parcalar=[];
  parcalar.push('ÜSTAD DÜNYA MONİTÖRÜ — '+new Date().toLocaleString('tr-TR'));
  try{
    if(CANLI_HAM.depremUyariSay) parcalar.push('• PAGER uyarılı deprem: '+CANLI_HAM.depremUyariSay);
    if(CANLI.gdacs && CANLI.gdacs.length) parcalar.push('• GDACS afet: '+CANLI.gdacs.length);
    if(CANLI_HAM.uzay) parcalar.push('• Uzay havası: Kp '+CANLI_HAM.uzay.kp+' · X-ışını '+(CANLI_HAM.uzay.xraySinif||'-'));
    if(CANLI_HAM.gemi) parcalar.push('• Gemi: '+CANLI_HAM.gemi+' · Uçak: '+(CANLI_HAM.ucakSay||'-'));
    if(CANLI_HAM.kp) parcalar.push('• Kp: '+CANLI_HAM.kp);
    if(CANLI_HAM.feodo) parcalar.push('• Kötü şöhretli IP: '+CANLI_HAM.feodo.length);
    if(CANLI_HAM.ransom) parcalar.push('• Fidye yazılımı mağduru: '+CANLI_HAM.ransom.length);
    if(CANLI_HAM.tor) parcalar.push('• Tor rölesi: '+CANLI_HAM.tor.reduce(function(a,b){ return a+(b.role||0); },0)+' / '+CANLI_HAM.tor.length+' ülke');
  }catch(e){}
  var metin=parcalar.join('\n');
  try{
    navigator.clipboard.writeText(metin).then(function(){ durum('harita','📤 özet panoya kopyalandı'); })
      .catch(function(){ alert(metin); });
  }catch(e){ alert(metin); }
}

/* ---------------- 13) KENDİ IP / TOR KONTROLÜ ---------------- */
function ipKontrol(){
  fetchJSON('https://api.ipify.org?format=json', 9000).then(function(d){
    IP_BILGI=IP_BILGI||{}; IP_BILGI.ip=(d&&d.ip)||'?';
    durum('harita','IP: '+IP_BILGI.ip);
    /* Tor çıkış listesi ile karşılaştır */
    return fetchJSON('https://check.torproject.org/torbulkexitlist', 20000).catch(function(){
      return proxyMetin('https://check.torproject.org/torbulkexitlist');
    });
  }).then(function(t){
    if(typeof t==='string' && IP_BILGI && IP_BILGI.ip){
      IP_BILGI.tor = (t.split(/\r?\n/).indexOf(IP_BILGI.ip)>=0);
      durum('harita', IP_BILGI.tor? '⚠️ bu IP Tor çıkış düğümü listesinde' : '✔ IP Tor çıkış listesinde değil (normal bağlantı)');
    }
  }).catch(function(e){ durum('harita','✘ IP kontrolü: '+e.message); });
}
function proxyMetin(u){
  return fetch(u, {headers:{'Accept':'text/plain'}}).then(function(r){ return r.text(); });
}

/* ---------------- 14) TIKLAMA: NOKTA KARTI / MESAFE ---------------- */
function kureTikEkle(){
  /* globe.gl onPointClick index.html'de; burada harita tıklamaları */
  if(typeof HARITA!=='undefined' && HARITA && !HARITA.__tikKart){
    HARITA.__tikKart=true;
    HARITA.on('contextmenu', function(){ /* menü yukarıda bağlandı */ });
  }
}
/* Shift+tık ile mesafe (2D) */
document.addEventListener('keydown', function(e){
  if(e.shiftKey){ document.body.classList.add('olcumMod'); } else { document.body.classList.remove('olcumMod'); }
});
document.addEventListener('keyup', function(e){ if(!e.shiftKey) document.body.classList.remove('olcumMod'); });

/* ---------------- başlat ---------------- */
setTimeout(function(){
  try{ hudKur(); }catch(e){}
  var h='1'; try{ h=localStorage.getItem('ustad_hud')||'1'; }catch(e){}
  HUD_AC=(h==='1');
  if(typeof canliHepsiBaslat==='function'){ setTimeout(function(){ ipKontrol(); }, 9000); }
  if(typeof aracCubuguDoldur==='function'){ setTimeout(aracCubuguDoldur, 1200); }
}, 2200);
