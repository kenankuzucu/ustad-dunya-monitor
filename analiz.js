/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — ANALİZ MODÜLÜ (v5.2)
   Nokta bilgi kartı · olay hikâyesi · geçen yıl karşılaştırma ·
   katman grafikleri · ısı haritası · etiket toplama (kümeleme) ·
   zaman çizelgesi oynatıcı · çevrimdışı önbellek · açılış teşhisi
   ============================================================ */
var ISI=false, KUMELE=false, OYNAT=null, ONBELLEK_SAAT=null;

/* ---------------- 1) NOKTA BİLGİ KARTI ---------------- */
function mesafeKmYakinYer(lat,lng){
  /* çevredeki tüm katman ögeleri */
  var liste=[], kaynak=[];
  try{ kaynak=(typeof kureTumNoktalar==='function')?kureTumNoktalar():[]; }catch(e){}
  try{ for(var t in CANLI){ var d=CANLI[t]; if(d&&d.length) for(var i=0;i<d.length;i++) kaynak.push(d[i]); } }catch(e){}
  for(var k=0;k<kaynak.length;k++){
    var p=kaynak[k];
    if(p.lat==null||p.lng==null) continue;
    if(Math.abs(p.lat-lat)>12 || Math.abs(p.lng-lng)>12) continue;
    var d=mesafeKm(lat,lng,p.lat,p.lng);
    if(d<=YK||d<=400) liste.push({d:d, ad:p.ad||'-', tur:p.tur||'-'});
  }
  var gorulen={}, tek=[];
  for(var j=0;j<liste.length;j++){
    var a=liste[j];
    if(gorulen[a.tur+a.ad]) continue;
    gorulen[a.tur+a.ad]=1; tek.push(a);
  }
  tek.sort(function(x,y){ return x.d-y.d; });
  return tek;
}
var YK=1500;
function noktaKartAc(lat,lng){
  var el=$('noktaKart');
  if(!el){
    el=document.createElement('div'); el.id='noktaKart'; el.className='noktaKart';
    el.onclick=function(e){ if(e.target===el) el.style.display='none'; };
    document.body.appendChild(el);
  }
  el.innerHTML='<div class="nkKutu"><div class="nkUst">📍 NOKTA BİLGİ KARTI <span class="soluk">'+lat.toFixed(4)+' , '+lng.toFixed(4)+'</span>'
    +'<button class="nkKapat" onclick="document.getElementById(\'noktaKart\').style.display=\'none\'">✕</button></div>'
    +'<div id="nkGovde" class="nkGovde"><div class="soluk">bilgi toplanıyor…</div></div></div>';
  el.style.display='block';
  var h='';
  /* mesafe bilgileri (yerel, anında) */
  var gz=mesafeKm(lat,lng,37.066,37.383);
  h+='<div class="nkSatir"><span class="nkEt">Gaziantep\'e uzaklık</span><b>'+Math.round(gz)+' km</b>'+
     '<button class="nkMini" onclick="uc('+lat+','+lng+',0.4,1200)">🎯 odaklan</button>'+
     '<button class="nkMini" onclick="olcumBasla('+lat+','+lng+')">📏 ölç</button></div>';
  try{
    if(typeof fayYollari==='function'){
      var enYakin=null;
      var faylar=fayYollari();
      for(var f=0;f<faylar.length;f++){
        var noktalar=faylar[f].noktalar||faylar[f].yol||faylar[f].path||[];
        for(var p=0;p<noktalar.length;p++){
          var q=noktalar[p];
          var qlat=(q.lat!=null?q.lat:(q[0]!=null?q[0]:null)), qlng=(q.lng!=null?q.lng:(q[1]!=null?q[1]:null));
          if(qlat==null) continue;
          var dd=mesafeKm(lat,lng,qlat,qlng);
          if(!enYakin||dd<enYakin.d) enYakin={d:dd, ad:faylar[f].ad||'fay hattı'};
        }
      }
      if(enYakin) h+='<div class="nkSatir"><span class="nkEt">en yakın fay hattı</span><b>'+Math.round(enYakin.d)+' km</b><span class="soluk">'+esc(enYakin.ad)+'</span></div>';
    }
  }catch(e){}
  /* çevre katmanlar */
  var yakinlar=mesafeKmYakinYer(lat,lng);
  var sayac={};
  for(var i=0;i<yakinlar.length;i++){ sayac[yakinlar[i].tur]=(sayac[yakinlar[i].tur]||0)+1; }
  var ozet=[];
  for(var t in sayac) ozet.push(t+': '+sayac[t]);
  h+='<div class="nkSatir"><span class="nkEt">çevrede (400 km)</span><b>'+(ozet.length?esc(ozet.join(' · ')):'veri yok')+'</b></div>';
  var enYakinlar=yakinlar.slice(0,8), hs='';
  for(var j=0;j<enYakinlar.length;j++) hs+='<div class="nkOge"><span class="soluk">'+Math.round(enYakinlar[j].d)+' km</span> · '+esc(enYakinlar[j].ad)+'</div>';
  if(hs) h+='<div class="nkListe">'+hs+'</div>';
  $('nkGovde').innerHTML=h;

  /* uzak servisler: hava + ters geokod */
  fetchJSON('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lng+'&current=temperature_2m,wind_speed_10m,weather_code', 12000).then(function(w){
    if(!w||!w.current) return;
    var c=w.current;
    var ek='<div class="nkSatir"><span class="nkEt">hava (şu an)</span><b>'+c.temperature_2m+'°C</b><span class="soluk">rüzgâr '+c.wind_speed_10m+' km/s · kod '+c.weather_code+'</span></div>';
    var g=$('nkGovde'); if(g) g.insertAdjacentHTML('afterbegin', ek);
  }).catch(function(){});
  fetchJSON('https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat='+lat+'&lon='+lng, 12000).then(function(r){
    if(!r||!r.display_name) return;
    var g=$('nkGovde'); if(g) g.insertAdjacentHTML('afterbegin','<div class="nkYer">🏙️ '+esc(r.display_name.split(',').slice(0,3).join(', '))+'</div>');
  }).catch(function(){});
}

/* ---------------- 2) OLAY HİKÂYESİ ---------------- */
function olayHikayesi(lat,lng){
  var liste=mesafeKmYakinYer(lat,lng);
  var gruplar={};
  for(var i=0;i<liste.length;i++){ var g=liste[i].tur; if(!gruplar[g]) gruplar[g]=[]; if(gruplar[g].length<6) gruplar[g].push(liste[i]); }
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🧩 OLAY HİKÂYESİ · '+lat.toFixed(3)+' , '+lng.toFixed(3)+'</h3>';
  h+='<div class="uyari">Bu noktanın çevresindeki (400 km) tüm katmanlar tek listede toplandı. Kaynak: panelde o an açık olan canlı katmanlar.</div>';
  var var_mi=false;
  for(var g2 in gruplar){
    var_mi=true;
    h+='<table class="tbl"><tr><td class="k" style="width:130px"><b>'+esc(g2)+'</b></td><td class="v">';
    for(var j=0;j<gruplar[g2].length;j++) h+='<div>• '+esc(gruplar[g2][j].ad)+' <span class="soluk">('+Math.round(gruplar[g2][j].d)+' km)</span></div>';
    h+='</td></tr></table>';
  }
  if(!var_mi) h+='<div class="hata">Bu nokta çevresinde kayıtlı olay bulunamadı.</div>';
  var metin='ÜSTAD MONİTÖR · OLAY HİKÂYESİ\nKoordinat: '+lat.toFixed(4)+', '+lng.toFixed(4)+' ('+new Date().toLocaleString('tr-TR')+')\n';
  for(var g3 in gruplar){ metin+='\n['+g3+']\n'; for(var m=0;m<gruplar[g3].length;m++) metin+=' - '+gruplar[g3][m].ad+' ('+Math.round(gruplar[g3][m].d)+' km)\n'; }
  try{
    var w=window.open('', '_blank');
    if(w){ w.document.write('<meta charset="utf-8"><title>Olay Hikâyesi</title><body style="background:#04120a;color:#c9ffd8;font-family:monospace;padding:18px"><pre>'+esc(metin)+'</pre></body>'); w.document.close(); }
  }catch(e){}
  var p=$('yardimKutu');
  if(!p){ p=document.createElement('div'); p.id='yardimKutu'; p.className='paletZemin'; document.body.appendChild(p); }
  p.innerHTML='<div class="paletKutu" style="max-width:620px">'+h+'<div class="paletAlt"><button class="aracBtn" onclick="document.getElementById(\'yardimKutu\').style.display=\'none\'">KAPAT</button></div></div>';
  p.style.display='block';
}

/* ---------------- 3) GEÇEN YIL KARŞILAŞTIRMA ---------------- */
function karsilastir(baslik, alan){
  var hedef=$('cmpKutu');
  var simdi=new Date();
  var buHafta=new Date(simdi.getTime()-7*86400000);
  var gecenYilBit=new Date(simdi.getTime()-365*86400000);
  var gecenYilBas=new Date(gecenYilBit.getTime()-7*86400000);
  var fmt=function(d){ return d.toISOString().slice(0,10); };
  if(hedef) hedef.innerHTML='<div class="soluk">karşılaştırma çekiliyor…</div>';
  var u1='https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&minmagnitude=4.5&starttime='+fmt(buHafta)+'&endtime='+fmt(simdi);
  var u2='https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&minmagnitude=4.5&starttime='+fmt(gecenYilBas)+'&endtime='+fmt(gecenYilBit);
  Promise.all([fetchJSON(u1,20000).catch(function(){return null;}), fetchJSON(u2,20000).catch(function(){return null;})]).then(function(r){
    var a=(r[0]&&r[0].count)||0, b=(r[1]&&r[1].count)||0;
    var fark=a-b, yuzde=b?Math.round((fark/b)*100):0;
    var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">📊 GEÇEN YIL İLE KARŞILAŞTIRMA (M4.5+)</h3>';
    h+='<table class="tbl">';
    h+='<tr><td class="k">son 7 gün</td><td class="v"><b>'+a+'</b> deprem</td></tr>';
    h+='<tr><td class="k">geçen yıl aynı hafta</td><td class="v"><b>'+b+'</b> deprem</td></tr>';
    h+='<tr><td class="k">fark</td><td class="v" style="color:'+(fark>=0?'var(--hata)':'var(--vurgu)')+'"><b>'+(fark>=0?'+':'')+fark+'</b> ('+(yuzde>=0?'+':'')+yuzde+'%)</td></tr>';
    h+='<tr><td class="k">kaynak</td><td class="v">USGS FDSN count API (gerçek zamanlı)</td></tr>';
    h+='</table>';
    if(hedef) hedef.innerHTML=h;
  }).catch(function(e){ if(hedef) hedef.innerHTML='<div class="hata">karşılaştırma alınamadı: '+esc(e.message)+'</div>'; });
}

/* ---------------- 4) KATMAN GRAFİĞİ (sparkline) ---------------- */
var GRAFIK_GECMIS={};
function grafikOrnek(topla){
  var t=new Date().toISOString().slice(0,13);
  var son=GRAFIK_GECMIS[t]||{};
  for(var k in topla){ if(typeof topla[k]==='number') son[k]=topla[k]; }
  GRAFIK_GECMIS[t]=son;
  try{
    var anahtarlar=Object.keys(GRAFIK_GECMIS).sort();
    if(anahtarlar.length>72){ for(var i=0;i<anahtarlar.length-72;i++) delete GRAFIK_GECMIS[anahtarlar[i]]; }
    localStorage.setItem('ustad_grafik', JSON.stringify(GRAFIK_GECMIS));
  }catch(e){}
}
function grafikCiz(id, anahtar, baslik, renk){
  var anahtarlar=Object.keys(GRAFIK_GECMIS).sort();
  var deger=[];
  for(var i=0;i<anahtarlar.length;i++){ var v=GRAFIK_GECMIS[anahtarlar[i]][anahtar]; if(typeof v==='number') deger.push(v); }
  if(deger.length<2) return '<div class="soluk" style="font-size:10px">'+esc(baslik)+': henüz yeterli örnek yok (panel açık kaldıkça dolar)</div>';
  var enBuyuk=Math.max.apply(null, deger)||1;
  var w=260, h2=38, adim=w/Math.max(1,(deger.length-1));
  var yol='';
  for(var j=0;j<deger.length;j++){
    var x=Math.round(j*adim), y=Math.round(h2-(deger[j]/enBuyuk)*(h2-4))-2;
    yol+=(j?' L':'M')+x+','+y;
  }
  return '<div class="grafikKutu"><div class="grafikBaslik"><span>'+esc(baslik)+'</span><b style="color:'+renk+'">'+deger[deger.length-1]+'</b>'
    +'<span class="soluk">en yüksek '+enBuyuk+' · '+deger.length+' örnek</span></div>'
    +'<svg width="100%" height="'+h2+'" viewBox="0 0 '+w+' '+h2+'" preserveAspectRatio="none">'
    +'<path d="'+yol+'" fill="none" stroke="'+renk+'" stroke-width="1.6"/></svg></div>';
}

/* ---------------- 5) KAYNAK SAĞLIĞI / KATALOG ---------------- */
var KAYNAK_KATALOG=[
  ['deprem','USGS Deprem (M4.5+)','kamu malı (ABD hükümeti)','1 dk'],
  ['gdacs','GDACS Afet Uyarıları','BM/EC JRC — açık','5 dk'],
  ['yangin','NASA EONET','NASA — açık','10 dk'],
  ['hava','Open-Meteo','CC BY 4.0 (anahtarsız)','10 dk'],
  ['gemi','Digitraffic AIS (Finlandiya/Baltık)','CC BY 4.0','1 dk'],
  ['ucak','OpenSky / adsb.lol','ODbL / açık','10 sn'],
  ['askeri','adsb.lol askerî','açık','15 sn'],
  ['iss','N2YO / CelesTrak TLE','açık','60 sn'],
  ['uyduc','CelesTrak TLE (uydu)','açık','30 dk'],
  ['aurora','NOAA SWPC OVATION','kamu malı','10 dk'],
  ['uzay','NOAA SWPC (Kp, güneş rüzgârı)','kamu malı','5 dk'],
  ['depremuyari','USGS PAGER + tsunami bayrağı','kamu malı','5 dk'],
  ['meteor','NASA CNEOS ateş topu','kamu malı','1 sa'],
  ['feodo','abuse.ch Feodo / CINS Army','abuse.ch kısıtlı · CINS açık','10 dk'],
  ['ransom','ransomware.live (ransomwatch)','açık','10 dk'],
  ['tor','Tor Project Onionoo','açık (CC0)','30 dk'],
  ['saldiri','SANS ISC saldırı kaynakları','açık','10 dk'],
  ['openphish','OpenPhish (GitHub aynası)','açık','5 dk'],
  ['urlhaus','URLhaus genel liste','abuse.ch','10 dk'],
  ['cisa','CISA KEV kataloğu','kamu malı','1 gün'],
  ['spamhaus','Spamhaus ASN-DROP','ücretsiz','1 gün'],
  ['circl','CIRCL MISP OSINT','açık','1 sa'],
  ['nvd','NIST NVD (CVE)','kamu malı','10 dk'],
  ['exploitdb','Exploit-DB RSS','açık','1 sa'],
  ['volkan','USGS/Smithsonian volkan uyarıları','kamu malı','1 sa'],
  ['tsunami','NOAA Tsunami','kamu malı','5 dk'],
  ['kasirga','NOAA NHC (Atlantik)','kamu malı','30 dk'],
  ['piyasa','CoinGecko + Frankfurter','ücretsiz','5 dk'],
  ['firlatma','Launch Library 2','açık','1 sa']
];
function kaynakSaglikHTML(){
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🔌 KAYNAK SAĞLIĞI ('+KAYNAK_KATALOG.length+' besleme)</h3>';
  h+='<table class="tbl"><tr><td class="k">Katman</td><td class="v">Kaynak / lisans</td><td class="v">Aralık</td><td class="v">Son veri</td><td class="v">Durum</td></tr>';
  var ayakta=0;
  for(var i=0;i<KAYNAK_KATALOG.length;i++){
    var id=KAYNAK_KATALOG[i][0];
    var t=null; try{ t=CANLI_SAAT[id]; }catch(e){}
    var yas=t?Math.round((Date.now()-t)/60000):null;
    var durumTxt='✘ veri yok', renk='var(--hata)';
    if(yas!=null){
      if(yas<=45){ durumTxt='✔ canlı'; renk='var(--vurgu)'; ayakta++; }
      else { durumTxt='⚠ '+yas+' dk eski'; renk='#f59e0b'; }
    }
    h+='<tr><td class="k">'+esc(id)+'</td><td class="v">'+esc(KAYNAK_KATALOG[i][1])+'<br><span class="soluk">'+esc(KAYNAK_KATALOG[i][2])+'</span></td>'
      +'<td class="v">'+esc(KAYNAK_KATALOG[i][3])+'</td>'
      +'<td class="v">'+(t? new Date(t).toLocaleTimeString('tr-TR') : '-')+'</td>'
      +'<td class="v" style="color:'+renk+'">'+durumTxt+'</td></tr>';
  }
  h+='</table>';
  h+='<div class="uyari">'+ayakta+'/'+KAYNAK_KATALOG.length+' besleme son 45 dakikada veri verdi. Tümü halka açık, hesapsız kaynaklardır; anahtar gerektirenler (abuse.ch API, AlienVault OTX, NASA FIRMS) yalnızca sen anahtarını girdiğinde canlanır.</div>';
  return h;
}

/* ---------------- 6) ISI HARİTASI + KÜMELEME ---------------- */
function isiDegis(){
  ISI=!ISI;
  if(ISI){
    KATMAN.ucakyogunluk=1; KATMAN.gemiyogunluk=1; KATMAN.yakinlik=1;
    KATMAN.catisma=0;
    durum('harita','🔥 ISI HARİTASI açık — uçak/gemi yoğunluğu + Gaziantep çevresi vurgusu');
  } else {
    durum('harita','ısı haritası kapandı');
  }
  if(typeof kureCiz==='function') kureCiz();
  if(typeof haritaSenkron==='function') haritaSenkron(true);
  if(typeof katPanelOlustur==='function') katPanelOlustur();
  return ISI?'ısı haritası AÇIK':'ısı haritası kapalı';
}
function kumeleDegis(){
  KUMELE=!KUMELE;
  if(typeof kureCiz==='function') kureCiz();
  durum('harita', KUMELE?'🧩 etiket toplama AÇIK (yakın noktalar tek simgede birleşir)':'etiket toplama kapalı');
  return KUMELE?'kümeleme AÇIK':'kümeleme kapalı';
}
function kumeleUygula(liste){
  if(!KUMELE || !liste || liste.length<40) return liste;
  var boy=6, hucre={}, out=[];
  for(var i=0;i<liste.length;i++){
    var p=liste[i];
    if(p.tur==='termin'){ out.push(p); continue; }
    var k=Math.round(p.lat/boy)+'_'+Math.round(p.lng/boy);
    if(!hucre[k]) hucre[k]={lat:0,lng:0,n:0,tur:p.tur,renk:p.renk,enBuyuk:0};
    var h=hucre[k];
    h.lat+=p.lat; h.lng+=p.lng; h.n++;
    if((p.cap||0)>h.enBuyuk){ h.enBuyuk=p.cap||0; h.renk=p.renk||h.renk; }
  }
  var azami=0; for(var kk in hucre) if(hucre[kk].n>azami) azami=hucre[kk].n;
  for(var k2 in hucre){
    var h2=hucre[k2];
    if(h2.n===1){ out.push({lat:h2.lat, lng:h2.lng, renk:h2.renk, cap:h2.enBuyuk, yuk:0.01, tur:h2.tur, ad:h2.tur}); continue; }
    out.push({lat:h2.lat/h2.n, lng:h2.lng/h2.n, renk:h2.renk, cap:Math.min(1.4, (h2.enBuyuk||0.4)+Math.sqrt(h2.n)*0.16),
      yuk:0.03, tur:'kume', ad:'🧩 '+h2.n+' kayıt ('+h2.tur+')'});
  }
  return out;
}

/* ---------------- 7) ZAMAN ÇİZELGESİ OYNATICI ---------------- */
function oynatDegis(){
  if(OYNAT){ clearInterval(OYNAT); OYNAT=null; var b=$('oynatBtn'); if(b) b.textContent='▶ OYNAT'; durum('harita','zaman oynatıcı durdu'); return 'oynatıcı durdu'; }
  if(!KATMAN.zamanmakinesi){ KATMAN.zamanmakinesi=1; if(typeof zamanMakinesiAc==='function') zamanMakinesiAc(true); }
  var bas=1;
  var b=$('oynatBtn'); if(b) b.textContent='⏹ DURDUR';
  durum('harita','▶ 30 günlük arşiv oynatılıyor…');
  var hiz=6;   /* her adımda +6 saat */
  ZAMAN_PENCERE=1;
  OYNAT=setInterval(function(){
    ZAMAN_PENCERE+=hiz;
    if(ZAMAN_PENCERE>720){ ZAMAN_PENCERE=720; clearInterval(OYNAT); OYNAT=null; var bb=$('oynatBtn'); if(bb) bb.textContent='▶ OYNAT'; }
    try{
      var sl=$('zamanKaydirici'); if(sl) sl.value=ZAMAN_PENCERE;
      zamanUygula(ZAMAN_PENCERE);
    }catch(e){}
  }, 450);
  return 'oynatıcı başladı';
}

/* ---------------- 8) ÇEVRİMDIŞI ÖNBELLEK ---------------- */
function onbellekKaydet(){
  try{
    var ozet={zaman:Date.now(), saat:{}, sayi:{}};
    for(var k in CANLI_SAAT) ozet.saat[k]=CANLI_SAAT[k];
    for(var k2 in CANLI_HAM){ var v=CANLI_HAM[k2]; if(typeof v==='number') ozet.sayi[k2]=v; else if(v&&v.length) ozet.sayi[k2]=v.length; }
    try{ ozet.uzay=CANLI_HAM.uzay||null; }catch(e){}
    try{ ozet.sonDepremler=(CANLI_HAM.depremUyariListe||[]).slice(0,12); }catch(e){}
    localStorage.setItem('ustad_onbellek', JSON.stringify(ozet));
    ONBELLEK_SAAT=ozet.zaman;
  }catch(e){}
}
function onbellekYukle(){
  try{
    var t=localStorage.getItem('ustad_onbellek');
    if(!t) return null;
    var o=JSON.parse(t);
    ONBELLEK_SAAT=o.zaman;
    return o;
  }catch(e){ return null; }
}
function onbellekSerit(){
  var o=onbellekYukle();
  if(!o) return;
  var yas=Math.round((Date.now()-o.zaman)/60000);
  var b=$('onbellekSerit');
  if(!b){
    b=document.createElement('div'); b.id='onbellekSerit'; b.className='onbellekSerit';
    document.body.appendChild(b);
  }
  b.innerHTML='💾 ÇEVRİMDIŞI ÖNBELLEK · son kayıt '+new Date(o.zaman).toLocaleString('tr-TR')+' ('+yas+' dk önce) · '
    +Object.keys(o.saat||{}).length+' besleme durumu saklı '
    +'<button class="nkMini" onclick="document.getElementById(\'onbellekSerit\').style.display=\'none\'">gizle</button>';
  b.style.display='block';
  setTimeout(function(){ if(b) b.style.display='none'; }, 20000);
}
setInterval(function(){ if(typeof CANLI_SAAT!=='undefined') onbellekKaydet(); }, 300000);

/* ---------------- 9) AÇILIŞ TEŞHİSİ ---------------- */
function teshisYaz(){
  var k=$('teshisKutu'); if(!k) return;
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🩺 AÇILIŞ TEŞHİSİ</h3><table class="tbl">';
  var satir=function(a,b,renk){ return '<tr><td class="k">'+esc(a)+'</td><td class="v" style="color:'+(renk||'var(--yazi)')+'">'+b+'</td></tr>'; };
  /* WebGL */
  var webgl='✘ yok', wrenk='var(--hata)';
  try{
    var c=document.createElement('canvas');
    var gl=c.getContext('webgl2')||c.getContext('webgl');
    if(gl){ webgl='✔ var — '+(gl.getParameter(gl.VERSION)||''); wrenk='var(--vurgu)'; }
  }catch(e){}
  h+=satir('WebGL (3D küre)', webgl, wrenk);
  /* katmanlar */
  var aktif=0, toplam=0;
  for(var i=0;i<KATMANLAR.length;i++){ var kk=KATMANLAR[i]; if(typeof kk==='string') continue; toplam++; if(KATMAN[kk[0]]) aktif++; }
  h+=satir('Katman', aktif+' / '+toplam+' açık');
  /* 2D harita */
  h+=satir('2D harita (Leaflet)', (typeof L!=='undefined')? '✔ yüklü'+(HARITA?' · açık':' · kapalı') : '✘ yüklenemedi', (typeof L!=='undefined')?'var(--vurgu)':'var(--hata)');
  /* 3D */
  h+=satir('3D küre (globe.gl)', (typeof Globe!=='undefined')? '✔ yüklü'+(KURE?' · çalışıyor':'') : '✘ CDN yüklenemedi', (typeof Globe!=='undefined')?'var(--vurgu)':'var(--hata)');
  /* uydu motoru */
  h+=satir('Uydu motoru (satellite.js)', (typeof satellite!=='undefined')?'✔ yüklü':'✘ yüklenemedi', (typeof satellite!=='undefined')?'var(--vurgu)':'var(--hata)');
  /* depolama */
  try{
    localStorage.setItem('ustad_test','1'); localStorage.removeItem('ustad_test');
    var doluluk=JSON.stringify(localStorage).length;
    h+=satir('Tarayıcı depolama', '✔ çalışıyor (~'+Math.round(doluluk/1024)+' KB kullanımda)', 'var(--vurgu)');
  }catch(e){ h+=satir('Tarayıcı depolama', '✘ kapalı (ayarlar saklanamaz)', 'var(--hata)'); }
  /* sesli komut */
  h+=satir('Sesli komut', (window.SpeechRecognition||window.webkitSpeechRecognition)? ('✔ destekleniyor'+(location.protocol==='file:'?' · ama file:// modunda mikrofon kapalı (yerel sunucu modunu kullan)':'')) : '✘ desteklenmiyor',
    (window.SpeechRecognition||window.webkitSpeechRecognition)?'var(--vurgu)':'var(--hata)');
  /* bildirim */
  var ni='✘ yok';
  try{ if(window.Notification) ni='✔ '+(Notification.permission==='granted'?'izin verildi':(Notification.permission==='denied'?'izin verilmedi':'izin sorulmadı')); }catch(e){}
  h+=satir('Masaüstü bildirimi', ni);
  /* beslemeler */
  var ayakta=0, sayi=0;
  for(var s=0;s<KAYNAK_KATALOG.length;s++){ sayi++; var t2=CANLI_SAAT[KAYNAK_KATALOG[s][0]]; if(t2 && (Date.now()-t2)<2700000) ayakta++; }
  h+=satir('Canlı beslemeler', ayakta+' / '+sayi+' son 45 dk içinde veri verdi', ayakta>sayi/2?'var(--vurgu)':'#f59e0b');
  /* CORS modu */
  h+=satir('CORS / uçak modu', (location.protocol==='file:'? 'tarayıcı dosya modu — askerî uçaklar için .bat ile aç' : 'sunucu modu (tam CORS serbest)'));
  h+=satir('Sürüm', 'v5.2 · '+new Date().toLocaleString('tr-TR'));
  h+='</table>';
  k.innerHTML=h;
}

/* ---------------- 10) YEREL PORTLAR ---------------- */
function portlarHTML(){
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🔎 YEREL MAKİNE — AÇIK PORTLAR</h3>';
  if(!window.YEREL_PORTLAR || !window.YEREL_PORTLAR.length){
    h+='<div class="uyari">Henüz tarama yapılmadı. Proje klasöründeki <b>USTAD-PORT-TARA.bat</b> dosyasını çalıştır — '
     +'kendi bilgisayarındaki dinlenen portları bu listeye yazar (netstat, tamamen yerel, dışarı veri göndermez).</div>';
    return h;
  }
  h+='<table class="tbl"><tr><td class="k">Adres</td><td class="v">Port</td><td class="v">Durum</td></tr>';
  for(var i=0;i<Math.min(window.YEREL_PORTLAR.length,60);i++){
    var p=window.YEREL_PORTLAR[i];
    var tehlikeli=(p.port==='3389'||p.port==='23'||p.port==='21'||p.port==='445'||p.port==='135');
    h+='<tr><td class="k">'+esc(p.adres)+'</td><td class="v">'+esc(p.port)+'</td><td class="v" style="color:'+(tehlikeli?'var(--hata)':'var(--vurgu)')+'">'
      +(tehlikeli?'⚠ dışarıya açık olmamalı':'dinliyor')+'</td></tr>';
  }
  h+='</table><div class="uyari">Tarama zamanı: '+esc(window.YEREL_PORT_TARIH||'-')+' · Yalnızca kendi makinen, yalnızca okuma.</div>';
  return h;
}

/* ---------------- 11) ÇİZİM KANCALARI ---------------- */
(function(){
  if(typeof kureCiz==='function'){
    var eski=kureCiz;
    kureCiz=function(){
      eski();
      try{
        if(KUMELE && KURE && KURE.pointsData){
          var d=KURE.pointsData()||[];
          KURE.pointsData(kumeleUygula(d));
        }
        if(ISI && KURE && KURE.pointsData){
          var d2=KURE.pointsData()||[];
          var yeni=[];
          for(var i=0;i<d2.length;i++){
            var p=d2[i];
            yeni.push({lat:p.lat,lng:p.lng,renk:p.renk,cap:(p.cap||0.4)*1.5,yuk:0.005,tur:p.tur,ad:p.ad});
          }
          KURE.pointsData(yeni);
          if(KURE.pointAltitude) KURE.pointAltitude(function(){ return 0.005; });
        }
      }catch(e){}
    };
  }
  if(typeof onbellekYukle==='function'){ setTimeout(onbellekSerit, 6000); }
  setTimeout(function(){
    try{
      grafikOrnek({
        deprem:(typeof CANLI!=='undefined'&&CANLI.deprem?CANLI.deprem.length:0),
        yangin:(typeof CANLI!=='undefined'&&CANLI.yangin?CANLI.yangin.length:0),
        gemi:(CANLI_HAM.gemi||0),
        ucak:(CANLI_HAM.ucakSay||0),
        feodo:(CANLI_HAM.feodo?CANLI_HAM.feodo.length:0),
        ransom:(CANLI_HAM.ransom?CANLI_HAM.ransom.length:0),
        uydu:(CANLI_HAM.uyducSay||0)
      });
    }catch(e){}
  }, 12000);
})();
try{ var _gz=localStorage.getItem('ustad_grafik'); if(_gz) GRAFIK_GECMIS=JSON.parse(_gz); }catch(e){}
