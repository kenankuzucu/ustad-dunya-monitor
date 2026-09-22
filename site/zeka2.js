/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — ZEKÂ MODÜLÜ (v5.4)
   · Anormallik tespiti (hareketsiz gemi, kaybolan uçak/AIS, yoğunluk artışı,
     deprem ve siber artışı) — tamamı yerel, veriye dayalı
   · Çapraz doğrulama: USGS + EMSC eşleştirme → "doğrulanmış olay"
   · Tarihsel mod: 1900'den bugüne M7+ depremler
   · Kural tabanlı zekâ cümleleri (anahtarsız, gerçek veriden)
   · GÜNLÜK DÜNYA DURUM SKORU (0-100) + geçmiş grafik
   · SENARYO MOTORU (kural → aksiyon: uç, katman aç, bülten, Telegram)
   · İSTİHBARAT DEFTERİ (not/etiket/arama/dışa aktarma)
   · HEDEF TAKİBİ (gemi/uçak izleme + ETA)
   ============================================================ */

/* ================= 1) HAREKET GEÇMİŞİ ================= */
var HAREKET={ gemi:{}, ucak:{}, son:0, ORNEK_ARALIK:300000 };
function hareketOrnekle(){
  try{
    var simdiki=simdi().getTime();
    /* gemiler */
    if(typeof HTML_VERI!=='undefined' && HTML_VERI.gemi){
      for(var i=0;i<HTML_VERI.gemi.length;i++){
        var g=HTML_VERI.gemi[i];
        if(g.lat==null) continue;
        var k=g.ad||('g'+i);
        if(!HAREKET.gemi[k]) HAREKET.gemi[k]=[];
        var dizi=HAREKET.gemi[k];
        dizi.push({t:simdiki, lat:g.lat, lng:g.lng});
        if(dizi.length>24) dizi.shift();
      }
    }
    /* uçaklar */
    if(typeof CANLI!=='undefined' && CANLI.ucak){
      for(var j=0;j<CANLI.ucak.length;j++){
        var u=CANLI.ucak[j];
        if(u.lat==null) continue;
        var k2=u.ad||('u'+j);
        if(!HAREKET.ucak[k2]) HAREKET.ucak[k2]=[];
        var d2=HAREKET.ucak[k2];
        d2.push({t:simdiki, lat:u.lat, lng:u.lng});
        if(d2.length>12) d2.shift();
      }
    }
    /* sayı geçmişi (saatlik) */
    var saat=new Date().toISOString().slice(0,13);
    try{
      var sayilar=JSON.parse(localStorage.getItem('ustad_sayilar')||'{}');
      sayilar[saat]={ gemi:(CANLI_HAM.gemi||0), ucak:(CANLI_HAM.ucakSay||0),
        deprem:(CANLI.deprem?CANLI.deprem.length:0), emsc:(CANLI.emsc?CANLI.emsc.length:0),
        kotuip:(CANLI_HAM.kotuip?CANLI_HAM.kotuip.length:0), ransom:(CANLI_HAM.ransom?CANLI_HAM.ransom.length:0),
        gdacs:(CANLI.gdacs?CANLI.gdacs.length:0) };
      var anahtar=Object.keys(sayilar).sort();
      while(anahtar.length>168){ delete sayilar[anahtar.shift()]; }
      localStorage.setItem('ustad_sayilar', JSON.stringify(sayilar));
    }catch(e){}
    HAREKET.son=simdiki;
  }catch(e){}
}
setInterval(hareketOrnekle, HAREKET.ORNEK_ARALIK);
setTimeout(hareketOrnekle, 30000);

/* ================= 2) ANORMALLİK TESPİTİ ================= */
function anormallikler(){
  var out=[];
  function km(a,b,c,d){ return mesafeKm(a,b,c,d); }
  /* hareketsiz gemi: son 30 dakikada 250 m'den az yer değiştirme */
  try{
    for(var ad in HAREKET.gemi){
      var d=HAREKET.gemi[ad];
      if(d.length<4) continue;
      var ilk=d[0], son=d[d.length-1];
      var yer=km(ilk.lat, ilk.lng, son.lat, son.lng);
      var dakika=(son.t-ilk.t)/60000;
      if(dakika>=25 && yer<0.25){
        out.push({tur:'DURAN GEMİ', metin:ad+' · '+Math.round(dakika)+' dk aynı noktada (yer değiştirme '+Math.round(yer*1000)+' m)',
          koord:{lat:son.lat,lng:son.lng}, renk:'#f59e0b'});
      }
      if(dakika>=25 && yer>60){
        out.push({tur:'HIZLI SEYİR', metin:ad+' · 30 dk içinde '+Math.round(yer)+' km yol (takip listesine ekleyebilirsin)',
          koord:{lat:son.lat,lng:son.lng}, renk:'#22d3ee'});
      }
    }
  }catch(e){}
  /* kaybolan uçak (son örnekten 15 dk sonra listede yok) */
  try{
    var simdiki={};
    if(CANLI.ucak) for(var i=0;i<CANLI.ucak.length;i++){ if(CANLI.ucak[i].ad) simdiki[CANLI.ucak[i].ad]=1; }
    for(var ad2 in HAREKET.ucak){
      var dz=HAREKET.ucak[ad2];
      if(!dz.length) continue;
      var sn=dz[dz.length-1];
      if(simdiki[ad2]) continue;
      if((Date.now()-sn.t)<15*60000 || (Date.now()-sn.t)>4*3600000) continue;
      out.push({tur:'UÇUŞ TAKİBİ BİTTİ', metin:ad2+' · son konum '+new Date(sn.t).toLocaleTimeString('tr-TR')+' · veri akışından çıktı (iniş, menzil dışı veya kapsama dışı olabilir — kesin sebep gösterilemez)',
        koord:{lat:sn.lat,lng:sn.lng}, renk:'#94a3b8'});
    }
  }catch(e){}
  /* yoğunluk artışı (saatlik geçmiş) */
  try{
    var say=JSON.parse(localStorage.getItem('ustad_sayilar')||'{}');
    var anahtar=Object.keys(say).sort();
    if(anahtar.length>=2){
      var sonK=say[anahtar[anahtar.length-1]], onceki=null;
      for(var q=anahtar.length-2;q>=0;q--){ if(say[anahtar[q]].gemi){ onceki=say[anahtar[q]]; break; } }
      if(sonK && onceki && onceki.gemi>=30 && sonK.gemi){
        var fark=Math.round(((sonK.gemi-onceki.gemi)/onceki.gemi)*100);
        if(Math.abs(fark)>=25) out.push({tur:'GEMİ YOĞUNLUĞU', metin:'Bölge gemi sayısı '+fark+'% değişti ('+onceki.gemi+' → '+sonK.gemi+')', koord:null, renk:'#2dd4bf'});
      }
      if(sonK && onceki && onceki.kotuip>=10 && sonK.kotuip){
        var f2=Math.round(((sonK.kotuip-onceki.kotuip)/onceki.kotuip)*100);
        if(f2>=40) out.push({tur:'SİBER ARTIŞ', metin:'Kötü şöhretli IP sayısı %'+f2+' arttı ('+onceki.kotuip+' → '+sonK.kotuip+')', koord:null, renk:'#f43f5e'});
      }
    }
  }catch(e){}
  /* deprem artışı: son 1 saat M4.5+ sayısı */
  try{
    if(CANLI_HAM.depremUyariListe){
      var son1s=CANLI_HAM.depremUyariListe.filter(function(x){ return x.ts && (Date.now()-x.ts)<3600000; }).length;
      if(son1s>=5) out.push({tur:'SİSMİK ARTIŞ', metin:'Son 1 saatte '+son1s+' büyük deprem kaydı (M4.5+) — kümeleşme olabilir', koord:null, renk:'#f97316'});
    }
  }catch(e){}
  return out;
}

/* ================= 3) KURAL TABANLI ZEKÂ CÜMLELERİ ================= */
function zekaCumleleri(){
  var c=[];
  try{
    var kp=(CANLI_HAM.uzay&&CANLI_HAM.uzay.kp)||null;
    if(kp!=null){
      if(kp>=5) c.push('Uzay havası hareketli: Kp '+kp+' — kutup ışığı görünürlüğü güneye indi, HF radyo ve GNSS etkilenebilir.');
      else if(kp<=2) c.push('Uzay havası sakin (Kp '+kp+') — uydu ve radyo koşulları normal.');
      else c.push('Uzay havası orta düzeyde (Kp '+kp+').');
    }
    if(CANLI.emsc && CANLI.deprem){
      var oran=(CANLI.emsc.length/Math.max(1,CANLI.deprem.length)).toFixed(2);
      c.push('Avrupa/Akdeniz bölgesi (EMSC) '+CANLI.emsc.length+' kayıt, dünya geneli (USGS) '+CANLI.deprem.length+' kayıt — bölge payı '+oran+'.');
    }
    if(CANLI_HAM.gemi) c.push('Deniz trafiği: '+CANLI_HAM.gemi+' gemi izleniyor'+(CANLI_HAM.gemiAd? ' ('+CANLI_HAM.gemiAd+' gemi kaydı)' : '')+'.');
    if(CANLI_HAM.ucakSay) c.push('Havada '+CANLI_HAM.ucakSay+' uçak, yörüngede '+((CANLI_HAM.uyducSay||0)+(CANLI_HAM.starlinkSay||0))+' uydu.');
    if(CANLI_HAM.kotuip) c.push('Kötü şöhretli IP listelerinde '+((CANLI_HAM.kotuIpToplam&&CANLI_HAM.kotuIpToplam['FireHOL level1'])||0)+'+ ağ var; panelde '+(CANLI_HAM.kotuip.length)+' örnek konumlandı.');
    if(K2 && K2.piyasa && K2.piyasa.altin) c.push('Altın ons $'+Number(K2.piyasa.altin).toFixed(2)+(K2.usdTry? ' · USD/TRY '+K2.usdTry.toFixed(2):'')+'.');
    if(K2 && K2.mgm && K2.mgm.length) c.push('Türkiye için '+K2.mgm.length+' MGM meteoroloji uyarısı aktif.');
    if(K2 && K2.bolgem && K2.bolgem.yakin && K2.bolgem.yakin.length){
      var en=K2.bolgem.yakin[0];
      c.push('Gaziantep\'e en yakın deprem: M'+en.mag+' · '+Math.round(en.mesafe)+' km · '+(en.yer||'').slice(0,40)+'.');
    }
    var an=anormallikler();
    if(an.length) c.push('Panel '+an.length+' anormallik işaretledi ('+an.map(function(x){ return x.tur; }).join(', ')+').');
    if(CANLI.gdacs && CANLI.gdacs.length) c.push('GDACS üzerinde '+CANLI.gdacs.length+' aktif afet kaydı var.');
  }catch(e){}
  return c;
}

/* ================= 4) ÇAPRAZ DOĞRULAMA (USGS ↔ EMSC) ================= */
function caprazDogrulama(){
  var isler=[
    fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', 30000).catch(function(){ return null; }),
    emscYukle().catch(function(){ return null; })
  ];
  return Promise.all(isler).then(function(r){
    var usgs=[]; if(r[0] && r[0].features) for(var i=0;i<r[0].features.length;i++){
      var f=r[0].features[i], p=f.properties||{}, g=f.geometry||{};
      if(!g.coordinates) continue;
      usgs.push({mag:p.mag, zaman:p.time, lat:g.coordinates[1], lng:g.coordinates[0], yer:p.place||''});
    }
    var emsc=(CANLI_HAM.emsc||[]);
    var eslesen=[], tekUsgs=[];
    for(var j=0;j<usgs.length;j++){
      var u=usgs[j], bulundu=null;
      for(var k=0;k<emsc.length;k++){
        var e=emsc[k];
        var zamanFark=Math.abs((new Date(e.zaman).getTime()||0)-(u.zaman||0))/60000;
        if(zamanFark<=25 && mesafeKm(u.lat,u.lng,e.lat,e.lng)<250){ bulundu=e; break; }
      }
      if(bulundu) eslesen.push({mag:u.mag, yer:u.yer, usgs:u, emsc:bulundu});
      else tekUsgs.push(u);
    }
    K2.capraz={eslesen:eslesen, tekUsgs:tekUsgs.slice(0,20), usgsSayi:usgs.length, emscSayi:emsc.length};
    CANLI_SAAT.capraz=simdi();
    return eslesen.length+' olay iki kaynakta doğrulandı (USGS+EMSC)';
  });
}

/* ================= 5) TARİHSEL MOD (1900+) ================= */
function tarihselYukle(){
  return fetchJSON('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=1900-01-01&minmagnitude=7&limit=300&orderby=time-asc', 40000)
    .then(function(d){
      if(!d || !d.features) throw new Error('tarihsel veri yok');
      var nok=[], onyil={};
      for(var i=0;i<d.features.length;i++){
        var f=d.features[i], p=f.properties||{}, g=f.geometry||{};
        if(!g.coordinates) continue;
        var yeni=new Date(p.time||0).getFullYear();
        var on=Math.floor(yeni/10)*10;
        onyil[on]=(onyil[on]||0)+1;
        nok.push({lat:g.coordinates[1], lng:g.coordinates[0], renk:(p.mag>=8.5?'#ff2d2d':'#f59e0b'), cap:(p.mag>=8.5?0.9:0.6),
          yuk:0.02, tur:'tarihsel', ad:'📜 M'+(p.mag||'?')+' · '+yeni+' · '+(p.place||'')});
      }
      CANLI.tarihsel=nok; CANLI_HAM.tarihselOnyil=onyil; CANLI_HAM.tarihselSayi=nok.length;
      CANLI_SAAT.tarihsel=simdi();
      return nok.length+' tarihsel deprem (M7+ · 1900\'dan beri)';
    });
}

/* ================= 6) DÜNYA DURUM SKORU ================= */
function durumSkoru(){
  var p=[], toplam=0, agirlik=0;
  function ekle(ad, puan, agir, aciklama){ p.push({ad:ad, puan:puan, agir:agir, aciklama:aciklama}); toplam+=puan*agir; agirlik+=agir; }
  /* deprem (USGS 24 saat M4.5+) */
  try{
    var son24=[];
    for(var i=0;i<(CANLI.deprem||[]).length;i++){ }
    var dep=(CANLI.deprem||[]).length;
    var p1=Math.min(100, dep*3);
    ekle('DEPREM', p1, 1.3, dep+' canlı deprem kaydı');
  }catch(e){}
  /* afet (GDACS kırmızı/turuncu) */
  try{
    var af=(CANLI.gdacs||[]).length;
    ekle('AFET', Math.min(100, af*4), 1.2, af+' GDACS kaydı');
  }catch(e){}
  /* uzay havası */
  try{
    var kp=(CANLI_HAM.uzay&&CANLI_HAM.uzay.kp)||0;
    ekle('UZAY HAVASI', Math.min(100, kp*11), 0.9, 'Kp '+kp);
  }catch(e){}
  /* siber */
  try{
    var ip=(CANLI_HAM.kotuip?CANLI_HAM.kotuip.length:0), ra=(CANLI_HAM.ransom?CANLI_HAM.ransom.length:0);
    var ip2=(K2.guvenlikHaber?K2.guvenlikHaber.length:0);
    ekle('SİBER', Math.min(100, ip*1.5+ra*0.6+ip2*1.2), 1.1, ip+' kötü IP · '+ra+' fidye kurbanı · '+ip2+' güvenlik haberi');
  }catch(e){}
  /* hava/uyarı */
  try{
    var uy=(K2.nwsUyari?K2.nwsUyari.length:0)+(K2.mgm?K2.mgm.length:0);
    ekle('HAVA/UYARI', Math.min(100, uy*2), 1.0, uy+' aktif uyarı (NWS+MGM)');
  }catch(e){}
  /* trafik yoğunluğu (nötr gösterge) */
  try{
    ekle('TRAFİK', Math.min(100, ((CANLI_HAM.gemi||0)/9)+((CANLI_HAM.ucakSay||0)/9)), 0.5, (CANLI_HAM.gemi||0)+' gemi · '+(CANLI_HAM.ucakSay||0)+' uçak');
  }catch(e){}
  var skor=agirlik? Math.round(toplam/agirlik) : 0;
  /* geçmiş */
  try{
    var g=JSON.parse(localStorage.getItem('ustad_skor')||'[]');
    var saat=new Date().toISOString().slice(0,13);
    if(!g.length || g[g.length-1].saat!==saat) g.push({saat:saat, skor:skor});
    while(g.length>336) g.shift();
    localStorage.setItem('ustad_skor', JSON.stringify(g));
  }catch(e){}
  return {skor:skor, parcalar:p};
}
function skorEtiket(s){
  if(s>=75) return {ad:'ÇOK HAREKETLİ', renk:'#ff2d2d'};
  if(s>=50) return {ad:'HAREKETLİ', renk:'#f97316'};
  if(s>=30) return {ad:'NORMAL', renk:'#facc15'};
  if(s>=15) return {ad:'SAKİN', renk:'#4ade80'};
  return {ad:'DURGUN', renk:'#22c55e'};
}

/* ================= 7) SENARYO MOTORU ================= */
var SENARYOLAR=[
  {ad:'BÜYÜK DEPREM (Gaziantep 500 km · M5+)', acik:true, tetik:function(){
      var liste=(K2.capraz&&K2.capraz.eslesen)||[];
      var usgs=(CANLI_HAM.depremUyariListe||[]);
      var en=null;
      for(var i=0;i<usgs.length;i++){
        var d=usgs[i];
        if(!d.ts || (Date.now()-d.ts)>6*3600000) continue;
        if(d.mag>=5 && mesafeKm(37.066,37.383,d.lat,d.lng)<=500) { en=d; break; }
      }
      return en? 'M'+en.mag+' · Gaziantep\'e '+Math.round(mesafeKm(37.066,37.383,en.lat,en.lng))+' km · '+(en.yer||'') : null;
    }, aksiyonlar:['gaziantepUc','katmanlarAfet','bulten','telegram','ses']},
  {ad:'GÜNEŞ FIRTINASI (Kp 6+)', acik:true, tetik:function(){
      var kp=(CANLI_HAM.uzay&&CANLI_HAM.uzay.kp)||0;
      return kp>=6? 'Kp '+kp+' — jeomanyetik fırtına seviyesi' : null;
    }, aksiyonlar:['uzayUc','katmanlarUzay','telegram','ses']},
  {ad:'SİBER DALGA (kötü IP patlaması)', acik:false, tetik:function(){
      var an=anormallikler();
      for(var i=0;i<an.length;i++) if(an[i].tur==='SİBER ARTIŞ') return an[i].metin;
      return null;
    }, aksiyonlar:['katmanlarSiber','telegram']},
  {ad:'FIRTINA / SEL UYARISI (NWS+MGM)', acik:false, tetik:function(){
      var u=(K2.nwsUyari||[]);
      for(var i=0;i<u.length;i++){ if(u[i].tur && u[i].tur.indexOf('SEL')>=0) return u[i].baslik; }
      if(K2.mgm && K2.mgm.length) return K2.mgm.length+' MGM uyarısı aktif (ilk: '+(K2.mgm[0].bolge||'-')+')';
      return null;
    }, aksiyonlar:['katmanlarAfet','telegram']},
  {ad:'ANORMALLİK (duran gemi / kaybolan uçak)', acik:false, tetik:function(){
      var an=anormallikler();
      for(var i=0;i<an.length;i++){ if(an[i].tur==='DURAN GEMİ'||an[i].tur==='UÇUŞ TAKİBİ BİTTİ') return an[i].metin; }
      return null;
    }, aksiyonlar:['telegram']}
];
var SENARYO_LOG=[];
function senaryoAyarOku(){
  try{
    var a=JSON.parse(localStorage.getItem('ustad_senaryo')||'null');
    if(a) SENARYOLAR.forEach(function(s,i){ if(a[i]!=null) s.acik=!!a[i]; });
    SENARYO_LOG=JSON.parse(localStorage.getItem('ustad_senaryo_log')||'[]');
  }catch(e){}
}
function senaryoAyarYaz(){
  try{ localStorage.setItem('ustad_senaryo', JSON.stringify(SENARYOLAR.map(function(s){ return s.acik?1:0; }))); }catch(e){}
}
function senaryoAksiyon(kod, baglam){
  try{
    if(kod==='gaziantepUc' && baglam && baglam.koord!==undefined){}
    if(kod==='gaziantepUc'){ if(typeof uc==='function') uc(37.066,37.383,0.45,1600); }
    if(kod==='uzayUc'){ if(typeof uc==='function') uc(66,20,1.4,1600); }
    if(kod==='katmanlarAfet' && typeof modSetiUygula==='function') modSetiUygula(1);
    if(kod==='katmanlarUzay' && typeof modSetiUygula==='function') modSetiUygula(4);
    if(kod==='katmanlarSiber' && typeof modSetiUygula==='function') modSetiUygula(3);
    if(kod==='bulten' && typeof gunlukBulten==='function') setTimeout(gunlukBulten, 1200);
    if(kod==='telegram' && typeof telegramGonder==='function'){
      telegramGonder('🚨 SENARYO TETİKLENDİ\n'+(baglam? baglam.metin : ''));
    }
    if(kod==='ses' && typeof sesDene==='function'){ sesDene(typeof SES_TUR!=='undefined'?SES_TUR:'bip'); }
  }catch(e){}
}
function senaryoKontrol(){
  senaryoAyarOku();
  for(var i=0;i<SENARYOLAR.length;i++){
    var s=SENARYOLAR[i];
    if(!s.acik) continue;
    var sonuc=null;
    try{ sonuc=s.tetik(); }catch(e){}
    if(!sonuc) continue;
    var anahtar=s.ad+'|'+String(sonuc).slice(0,40);
    var son=SENARYO_LOG.length? SENARYO_LOG[SENARYO_LOG.length-1] : null;
    if(son && son.anahtar===anahtar && (Date.now()-(son.t||0))<6*3600000) continue;   /* aynı olayı tekrar bildirme */
    SENARYO_LOG.push({t:Date.now(), senaryo:s.ad, metin:sonuc, anahtar:anahtar});
    if(SENARYO_LOG.length>60) SENARYO_LOG.shift();
    try{ localStorage.setItem('ustad_senaryo_log', JSON.stringify(SENARYO_LOG)); }catch(e){}
    if(typeof alarmSeritGoster==='function') alarmSeritGoster('SENARYO: '+s.ad, sonuc);
    for(var a=0;a<s.aksiyonlar.length;a++) senaryoAksiyon(s.aksiyonlar[a], {metin:s.ad+' → '+sonuc});
  }
}
setInterval(senaryoKontrol, 300000);
setTimeout(senaryoKontrol, 60000);

/* ================= 8) İSTİHBARAT DEFTERİ ================= */
var DEFTER=[];
function defterOku(){ try{ DEFTER=JSON.parse(localStorage.getItem('ustad_defter')||'[]'); }catch(e){ DEFTER=[]; } }
function defterYaz(){ try{ localStorage.setItem('ustad_defter', JSON.stringify(DEFTER)); }catch(e){} }
function defterEkle(baslik, metin, koord, etiket){
  defterOku();
  DEFTER.unshift({t:Date.now(), baslik:baslik||'not', metin:metin||'', koord:koord||null, etiket:etiket||''});
  if(DEFTER.length>300) DEFTER.pop();
  defterYaz();
  if(typeof durum==='function') durum('zeka','✔ deftere eklendi: '+(baslik||'not'));
  zekaPanelYaz();
}
function defterSil(i){ defterOku(); DEFTER.splice(i,1); defterYaz(); zekaPanelYaz(); }
function defterDisari(){
  defterOku();
  var md='# ÜSTAD İSTİHBARAT DEFTERİ\n\n';
  for(var i=0;i<DEFTER.length;i++){
    var d=DEFTER[i];
    md+='## '+(d.baslik||'not')+'\n';
    md+=new Date(d.t).toLocaleString('tr-TR')+(d.etiket? ' · `'+d.etiket+'`':'')+(d.koord? ' · '+d.koord.lat.toFixed(4)+', '+d.koord.lng.toFixed(4):'')+'\n\n';
    if(d.metin) md+=d.metin+'\n\n';
  }
  dosyaIndir(md, 'ustad-istihbarat-defteri-'+tarihDamga()+'.md');
}
function defterNotAl(){
  var baslik=prompt('Not başlığı:',''); if(baslik===null) return;
  var metin=prompt('Not (olay, gözlem, kaynak):','')||'';
  var etiket=prompt('Etiket (ör. deprem, siber, gemi):','')||'';
  var k=null;
  try{ if(window.SON_TIK && window.SON_TIK.lat!=null) k={lat:window.SON_TIK.lat, lng:window.SON_TIK.lng}; }catch(e){}
  defterEkle(baslik, metin, k, etiket);
}

/* ================= 9) HEDEF TAKİBİ + ETA ================= */
var TAKIP=[], TAKIP_GECMIS={};
function takipOku(){ try{ TAKIP=JSON.parse(localStorage.getItem('ustad_takip')||'[]'); }catch(e){ TAKIP=[]; }
  try{ TAKIP_GECMIS=JSON.parse(localStorage.getItem('ustad_takip_gecmis')||'{}'); }catch(e){ TAKIP_GECMIS={}; } }
function takipYaz(){ try{ localStorage.setItem('ustad_takip', JSON.stringify(TAKIP)); }catch(e){}
  try{ localStorage.setItem('ustad_takip_gecmis', JSON.stringify(TAKIP_GECMIS)); }catch(e){} }
function takipEkle(){
  var ad=prompt('Takip edilecek gemi/uçak adı (kayıttaki adın bir parçası yeter):',''); if(!ad) return;
  var hedef=prompt('Hedef liman/nokta adı (boş bırakılabilir):','')||'';
  var hlat=null, hlng=null;
  if(hedef){
    hlat=parseFloat(prompt('Hedef enlem (ör. 41.01):','')||'');
    hlng=parseFloat(prompt('Hedef boylam (ör. 28.97):','')||'');
    if(isNaN(hlat)||isNaN(hlng)){ hlat=null; hlng=null; }
  }
  TAKIP.push({ad:ad.toLowerCase(), hedef:hedef, lat:hlat, lng:hlng, eklendi:Date.now()});
  takipYaz(); zekaPanelYaz();
  if(typeof durum==='function') durum('zeka','🎯 takibe alındı: '+ad);
}
function takipSil(i){ TAKIP.splice(i,1); takipYaz(); zekaPanelYaz(); }
function takipKontrol(){
  takipOku();
  if(!TAKIP.length) return;
  var tum=[];
  try{ if(typeof HTML_VERI!=='undefined' && HTML_VERI.gemi) for(var i=0;i<HTML_VERI.gemi.length;i++) tum.push({tur:'gemi', d:HTML_VERI.gemi[i]}); }catch(e){}
  try{ if(CANLI.ucak) for(var j=0;j<CANLI.ucak.length;j++) tum.push({tur:'uçak', d:CANLI.ucak[j]}); }catch(e){}
  for(var t=0;t<TAKIP.length;t++){
    var hedef=TAKIP[t];
    for(var k=0;k<tum.length;k++){
      var o=tum[k].d;
      if(!o.ad || o.lat==null) continue;
      if(String(o.ad).toLowerCase().indexOf(hedef.ad)<0) continue;
      var anahtar=hedef.ad+'|'+tum[k].tur;
      var gecmis=TAKIP_GECMIS[anahtar]||{konumlar:[]};
      var son=gecmis.konumlar.length? gecmis.konumlar[gecmis.konumlar.length-1] : null;
      var hareket=son? mesafeKm(son.lat, son.lng, o.lat, o.lng) : 0;
      gecmis.konumlar.push({t:Date.now(), lat:o.lat, lng:o.lng});
      if(gecmis.konumlar.length>60) gecmis.konumlar.shift();
      gecmis.sonAd=o.ad;
      /* ETA */
      if(hedef.lat!=null && gecmis.konumlar.length>=3){
        var ilk=gecmis.konumlar[0], sn2=gecmis.konumlar[gecmis.konumlar.length-1];
        var gecenSaat=Math.max(0.02,(sn2.t-ilk.t)/3600000);
        var gidilen=mesafeKm(ilk.lat, ilk.lng, sn2.lat, sn2.lng);
        var hiz=gidilen/gecenSaat;
        var kalan=mesafeKm(sn2.lat, sn2.lng, hedef.lat, hedef.lng);
        gecmis.etaSaat = hiz>1? (kalan/hiz) : null;
        gecmis.kalanKm=Math.round(kalan); gecmis.hizKn=Math.round(hiz/1.852);
      }
      /* hareket bildirimi */
      if(hareket>3){
        gecmis.sonHareket=Date.now();
        if(hedef.bildirilen!==Math.round(hareket)){
          hedef.bildirilen=Math.round(hareket);
          if(typeof alarmSeritGoster==='function') alarmSeritGoster('TAKİP', o.ad+' · '+Math.round(hareket)+' km hareket etti');
        }
      }
      TAKIP_GECMIS[anahtar]=gecmis;
    }
  }
  takipYaz();
}
setInterval(takipKontrol, 60000);

/* ================= 10) PANEL ================= */
function zekaPanelHTML(){
  var sk=durumSkoru(), et=skorEtiket(sk.skor);
  var h='<h2 class="panelBaslik">🧠 ZEKÂ · ANORMALLİK · SKOR · SENARYO · DEFTER</h2>';
  /* skor */
  h+='<div class="grafikKutu" style="border-color:'+et.renk+'">'
   +'<div class="grafikBaslik"><span>GÜNLÜK DÜNYA DURUM SKORU</span><b style="color:'+et.renk+';font-size:26px">'+sk.skor+'</b><span style="color:'+et.renk+'">'+et.ad+'</span></div>'
   +'<svg width="100%" height="40" viewBox="0 0 300 40" preserveAspectRatio="none">'
   +'<rect x="0" y="30" width="'+(sk.skor*3)+'" height="7" fill="'+et.renk+'"/></svg>'
   +'<table class="tbl">';
  for(var i=0;i<sk.parcalar.length;i++){
    var p=sk.parcalar[i];
    h+='<tr><td class="k">'+esc(p.ad)+'</td><td class="v">'+Math.round(p.puan)+'/100 <span class="soluk">(ağırlık '+p.agir+')</span></td><td class="v soluk" style="font-size:10px">'+esc(p.aciklama)+'</td></tr>';
  }
  h+='</table>';
  /* skor geçmişi */
  try{
    var g=JSON.parse(localStorage.getItem('ustad_skor')||'[]');
    if(g.length>=2){
      var en=1; for(var q=0;q<g.length;q++) if(g[q].skor>en) en=g[q].skor;
      var yol='';
      for(var w=0;w<g.length;w++){ var x=Math.round(w*300/(g.length-1)), y=Math.round(38-(g[w].skor/en)*34); yol+=(w?' L':'M')+x+','+y; }
      h+='<div class="grafikBaslik"><span>skor geçmişi</span><span class="soluk">'+g.length+' saatlik ölçüm</span></div>'
       +'<svg width="100%" height="40" viewBox="0 0 300 40" preserveAspectRatio="none"><path d="'+yol+'" fill="none" stroke="'+et.renk+'" stroke-width="1.5"/></svg>';
    }
  }catch(e){}
  h+='</div>';
  /* zekâ cümleleri */
  var cumle=zekaCumleleri();
  if(cumle.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">🗣 DURUM YORUMU (kural tabanlı · gerçek veriden)</h3><div class="nkListe">';
    for(var c=0;c<cumle.length;c++) h+='<div class="nkOge">• '+esc(cumle[c])+'</div>';
    h+='</div>';
  }
  /* anormallikler */
  var an=anormallikler();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">⚠ ANORMALLİKLER ('+an.length+')</h3>';
  if(!an.length) h+='<div class="uyari">Şu an dikkat çeken bir anormallik yok. (Panel açık kaldıkça gemi/uçak hareket geçmişi birikir — tespit 25 dakika sonra başlar.)</div>';
  else{
    h+='<table class="tbl">';
    for(var a=0;a<an.length;a++){
      var x=an[a];
      h+='<tr><td class="k" style="color:'+x.renk+'">'+esc(x.tur)+'</td><td class="v">'+esc(x.metin)+'</td>'
        +(x.koord? '<td class="v"><button class="nkMini" onclick="uc('+x.koord.lat+','+x.koord.lng+',0.5,1200)">odaklan</button></td>':'<td class="v"></td>')+'</tr>';
    }
    h+='</table>';
  }
  /* çapraz doğrulama */
  if(K2.capraz){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">🔀 ÇAPRAZ DOĞRULAMA (USGS ↔ EMSC)</h3>';
    h+='<table class="tbl">'+satir('USGS kaydı', K2.capraz.usgsSayi)+satir('EMSC kaydı', K2.capraz.emscSayi)
      +satir('İKİ KAYNAKTA DOĞRULANAN', '<b style="color:var(--vurgu)">'+K2.capraz.eslesen.length+'</b>')
      +satir('yalnız USGS', K2.capraz.tekUsgs.length)+'</table>';
    if(K2.capraz.eslesen.length){
      h+='<div class="nkListe">';
      for(var e2=0;e2<Math.min(6,K2.capraz.eslesen.length);e2++){
        var ee=K2.capraz.eslesen[e2];
        h+='<div class="nkOge">✔ M'+ee.mag+' · '+esc(String(ee.yer).slice(0,46))+'</div>';
      }
      h+='</div>';
    }
    h+='<div class="uyari">İki bağımsız kaynağın aynı olayı bildirmesi güveni artırır; tek kaynakta kalan olaylar da listelenir (sapma toleransı: 25 dk / 250 km).</div>';
  } else {
    h+='<div class="ortala"><button class="aracBtn" onclick="caprazDogrulama().then(function(m){durum(\'zeka\',\'✔ \'+m);zekaPanelYaz();})">🔀 ÇAPRAZ DOĞRULAMA BAŞLAT</button></div>';
  }
  /* senaryo motoru */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">🎬 SENARYO MOTORU</h3>';
  h+='<table class="tbl">';
  for(var s=0;s<SENARYOLAR.length;s++){
    h+='<tr><td class="v"><b>'+esc(SENARYOLAR[s].ad)+'</b><br><span class="soluk" style="font-size:10px">aksiyonlar: '+esc(SENARYOLAR[s].aksiyonlar.join(', '))+'</span></td>'
      +'<td class="v"><button class="nkMini" onclick="senaryoDegis('+s+')">'+(SENARYOLAR[s].acik?'AÇIK ✔':'KAPALI ✘')+'</button></td></tr>';
  }
  h+='</table>';
  if(SENARYO_LOG.length){
    h+='<div class="nkListe"><div class="soluk" style="font-size:10px;margin:4px 0">son tetiklenenler:</div>';
    for(var sl=SENARYO_LOG.length-1; sl>=Math.max(0,SENARYO_LOG.length-5); sl--){
      h+='<div class="nkOge">'+esc(new Date(SENARYO_LOG[sl].t).toLocaleString('tr-TR'))+' · <b>'+esc(SENARYO_LOG[sl].senaryo)+'</b> → '+esc(String(SENARYO_LOG[sl].metin).slice(0,80))+'</div>';
    }
    h+='</div>';
  }
  /* defter */
  defterOku();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">📓 İSTİHBARAT DEFTERİ ('+DEFTER.length+' kayıt)</h3>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="defterNotAl()">➕ NOT EKLE</button>'
   +'<button class="aracBtn" onclick="defterDisari()">⬇️ MARKDOWN İNDİR</button>'
   +'<input class="aracAra" id="defterAra" placeholder="defterde ara…" oninput="defterAra(this.value)"></div>';
  h+='<div id="defterListe">'+defterListeHTML('')+'</div>';
  /* hedef takibi */
  takipOku();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">🎯 HEDEF TAKİBİ ('+TAKIP.length+')</h3>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="takipEkle()">➕ GEMİ/UÇAK TAKİBE AL</button></div>';
  if(TAKIP.length){
    h+='<table class="tbl"><tr><td class="k">Hedef</td><td class="v">Durum</td><td class="v"></td></tr>';
    for(var t2=0;t2<TAKIP.length;t2++){
      var hd=TAKIP[t2];
      var durumBul=null;
      for(var ana in TAKIP_GECMIS){ if(ana.indexOf(hd.ad+'|')===0){ durumBul=TAKIP_GECMIS[ana]; break; } }
      var metin2='henüz görülmedi';
      if(durumBul && durumBul.konumlar && durumBul.konumlar.length){
        var s3=durumBul.konumlar[durumBul.konumlar.length-1];
        metin2=esc(String(durumBul.sonAd||'').slice(0,44))+'<br><span class="soluk">'+durumBul.konumlar.length+' kayıt · son: '+new Date(s3.t).toLocaleTimeString('tr-TR')+'</span>';
        if(durumBul.etaSaat) metin2+='<br><b style="color:var(--vurgu)">ETA ≈ '+durumBul.etaSaat.toFixed(1)+' saat</b> <span class="soluk">('+durumBul.kalanKm+' km · '+durumBul.hizKn+' kn)</span>';
      }
      h+='<tr><td class="k">'+esc(hd.ad)+(hd.hedef? '<br><span class="soluk">→ '+esc(hd.hedef)+'</span>':'')+'</td><td class="v">'+metin2+'</td>'
        +'<td class="v"><button class="nkMini" onclick="takipSil('+t2+')">SİL</button></td></tr>';
    }
    h+='</table>';
  } else h+='<div class="uyari">Takip listesi boş. Bir gemi/uçak adı ekle — panel her dakika kontrol eder, hareket edince haber verir; hedef koordinatı verirsen ETA hesaplanır.</div>';
  /* tarihsel mod */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">📜 TARİHSEL MOD (1900+)</h3>';
  if(CANLI.tarihsel && CANLI.tarihsel.length){
    var on=CANLI_HAM.tarihselOnyil||{};
    var enB=0; for(var y in on) if(on[y]>enB) enB=on[y];
    h+='<table class="tbl">'+satir('kayıt', CANLI.tarihsel.length+' deprem (M7+)')+satir('katman', (KATMAN.tarihsel?'AÇIK ✔ (kürede görünüyor)':'kapalı'))+'</table>';
    h+='<div class="grafikKutu"><div class="grafikBaslik"><span>on yıla göre M7+ sayısı</span></div><div style="display:flex;gap:3px;align-items:flex-end;height:60px">';
    var yillar=Object.keys(on).sort();
    for(var yy=0;yy<yillar.length;yy++){
      var yuk=Math.round((on[yillar[yy]]/enB)*54)+3;
      h+='<div title="'+yillar[yy]+': '+on[yillar[yy]]+'" style="flex:1;background:linear-gradient(180deg,#f59e0b,#7c2d12);height:'+yuk+'px"></div>';
    }
    h+='</div><div class="soluk" style="font-size:9px">'+yillar[0]+' → '+yillar[yillar.length-1]+'</div></div>';
    h+='<div class="aracSatir"><button class="aracBtn" onclick="KATMAN.tarihsel='+(KATMAN.tarihsel?'0':'1')+';kureCiz();zekaPanelYaz();">📜 KATMANI '+(KATMAN.tarihsel?'KAPAT':'AÇ')+'</button></div>';
  } else {
    h+='<div class="ortala"><button class="aracBtn" onclick="tarihselYukle().then(function(m){durum(\'zeka\',\'✔ \'+m);zekaPanelYaz();}).catch(function(e){durum(\'zeka\',\'✘ \'+e.message);})">📜 1900\'DAN BERİ M7+ İNDİR</button></div>';
  }
  /* çıktılar */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:14px 0 8px">📤 ÇIKTILAR</h3>';
  h+='<div class="aracSatir">'
   +'<button class="aracBtn" onclick="zekaRaporu()">📄 ZEKÂ RAPORU (Word)</button>'
   +'<button class="aracBtn" onclick="anormallikCsv()">⬇️ ANORMALLİK CSV</button>'
   +'<button class="aracBtn" onclick="teshisYaz();ayarlarPanel&&0">🩺</button></div>';
  return h;
}
function defterListeHTML(q){
  defterOku();
  q=(q||'').toLocaleLowerCase('tr');
  var h='';
  for(var i=0;i<DEFTER.length;i++){
    var d=DEFTER[i];
    var arama=((d.baslik||'')+' '+(d.metin||'')+' '+(d.etiket||'')).toLocaleLowerCase('tr');
    if(q && arama.indexOf(q)<0) continue;
    h+='<div class="nkOge"><b>'+esc(d.baslik||'not')+'</b> <span class="soluk">'+new Date(d.t).toLocaleString('tr-TR')+(d.etiket? ' · '+esc(d.etiket):'')+'</span>'
      +(d.koord? ' <button class="nkMini" onclick="uc('+d.koord.lat+','+d.koord.lng+',0.5,1200)">konum</button>':'')
      +' <button class="nkMini" onclick="defterSil('+i+')">sil</button>'
      +(d.metin? '<br><span style="font-size:11px">'+esc(d.metin.slice(0,220))+'</span>':'')+'</div>';
  }
  return h||'<div class="soluk" style="font-size:11px">kayıt yok</div>';
}
function defterAra(q){ var el=$('defterListe'); if(el) el.innerHTML=defterListeHTML(q); }
function senaryoDegis(i){
  SENARYOLAR[i].acik=!SENARYOLAR[i].acik;
  senaryoAyarYaz();
  durum('zeka', SENARYOLAR[i].ad+' → '+(SENARYOLAR[i].acik?'AÇIK':'KAPALI'));
  zekaPanelYaz();
}
function zekaRaporu(){
  var sk=durumSkoru(), et=skorEtiket(sk.skor);
  var h='<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"></head><body style="font-family:Segoe UI,Arial">'
    +'<h1 style="color:#0b3d1f;margin:0">ÜSTAD DÜNYA MONİTÖRÜ — ZEKÂ RAPORU</h1>'
    +'<p style="color:#444;font-size:12px">'+new Date().toLocaleString('tr-TR')+' · ÜSTAD KENAN KUZUCU</p>'
    +'<h2 style="color:'+et.renk+'">DÜNYA DURUM SKORU: '+sk.skor+' / 100 · '+et.ad+'</h2><table border="1" cellpadding="5" style="border-collapse:collapse;font-size:12px"><tr><th>Bileşen</th><th>Puan</th><th>Açıklama</th></tr>';
  for(var i=0;i<sk.parcalar.length;i++) h+='<tr><td>'+sk.parcalar[i].ad+'</td><td>'+Math.round(sk.parcalar[i].puan)+'</td><td>'+sk.parcalar[i].aciklama+'</td></tr>';
  h+='</table><h3>Anormallikler</h3><ul>';
  var an=anormallikler();
  if(!an.length) h+='<li>kayıt yok</li>';
  for(var a=0;a<an.length;a++) h+='<li><b>'+an[a].tur+'</b> — '+an[a].metin+'</li>';
  h+='</ul><h3>Durum Yorumu</h3><ul>';
  var c=zekaCumleleri();
  for(var j=0;j<c.length;j++) h+='<li>'+c[j]+'</li>';
  h+='</ul><h3>İstihbarat Defteri (son 10)</h3><ul>';
  defterOku();
  for(var d2=0;d2<Math.min(10,DEFTER.length);d2++) h+='<li>'+new Date(DEFTER[d2].t).toLocaleString('tr-TR')+' — <b>'+DEFTER[d2].baslik+'</b>: '+DEFTER[d2].metin+'</li>';
  h+='</ul></body></html>';
  dosyaIndir(h, 'ustad-zeka-raporu-'+tarihDamga()+'.doc');
}
function anormallikCsv(){
  var an=anormallikler();
  var csv='\ufeffTür;Açıklama;Enlem;Boylam\r\n';
  for(var i=0;i<an.length;i++){
    csv+='"'+an[i].tur+'";"'+String(an[i].metin).replace(/"/g,'""')+'";'+(an[i].koord? an[i].koord.lat:'')+';'+(an[i].koord? an[i].koord.lng:'')+'\r\n';
  }
  dosyaIndir(csv, 'ustad-anormallik-'+tarihDamga()+'.csv');
}
function zekaPanelYaz(){
  var el=$('sonuc_zeka'); if(el) el.innerHTML=zekaPanelHTML();
  durum('zeka','✔ zekâ paneli hazır');
}
function zekaPanel(){
  panelHazir('zeka');
  defterOku(); takipOku(); senaryoAyarOku();
  var isler=[];
  if(!K2.capraz) isler.push(caprazDogrulama().catch(function(){ return null; }));
  Promise.all(isler).then(zekaPanelYaz);
}
/* tarihsel katmanı küreye bağla */
(function(){
  if(typeof canliNoktalar==='function'){
    var eski=canliNoktalar;
    canliNoktalar=function(){
      var out=eski();
      try{ if(KATMAN.tarihsel && CANLI.tarihsel) for(var i=0;i<CANLI.tarihsel.length;i++) out.push(CANLI.tarihsel[i]); }catch(e){}
      return out;
    };
  }
})();

/* skoru HUD'a ekle */
(function(){
  setInterval(function(){
    try{
      var s=durumSkoru(), e=skorEtiket(s.skor);
      var el=$('hudSatir2');
      if(el) el.innerHTML='ÜSTAD KENAN KUZUCU · ÜSTAD MONİTÖR · v5.4 · IP: '+((IP_BILGI&&IP_BILGI.ip)||'…')
        +' · SKOR <b style="color:'+e.renk+'">'+s.skor+'</b> '+e.ad;
    }catch(err){}
  }, 60000);
})();
/* tıklanan son noktayı hatırla (defter notu için) */
document.addEventListener('click', function(){
  try{ if(typeof KURE!=='undefined' && KURE && KURE.camera){ } }catch(e){}
});
