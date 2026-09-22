/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — CANLI KATMAN MOTORU (v4.0)
   index.html tarafından yüklenir. KURE / KATMAN / HARITA
   global değişkenlerini kullanır.
   Tüm kaynaklar ücretsiz ve (aksi yazılmadıkça) anahtarsızdır.
   ============================================================ */

var CANLI = {};        /* id -> nokta dizisi (küre) */
var CANLI_YOL = {};    /* id -> yol dizisi (küre) */
var CANLI_HAM = {};    /* id -> ham veri (paneller) */
var CANLI_TICK = {};   /* id -> interval */
var CANLI_SAAT = {};   /* id -> son güncelleme */
var HTML_VERI = { ucak: [], gemi: [] };   /* htmlElements katmanları */
var TLE_CACHE = {};    /* grup -> {zaman, uydular} */

function logDurum(txt){ try{ durum('harita', txt); }catch(e){} }
function simdi(){ return new Date(); }
function saatYaz(t){ try{ return new Date(t).toLocaleTimeString('tr-TR'); }catch(e){ return ''; } }

/* ---------- ortak yardımcılar ---------- */
function metinCek(url, ms){
  return new Promise(function(res, rej){
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function(){ if(ctl) ctl.abort(); rej(new Error('zaman aşımı')); }, ms||20000);
    var opt = { headers:{ 'Accept':'*/*' } };
    if(ctl) opt.signal = ctl.signal;
    fetch(url, opt).then(function(r){ clearTimeout(t); if(!r.ok){ rej(new Error('HTTP '+r.status)); return ''; } return r.text(); })
      .then(function(txt){ if(txt!==undefined) res(txt); }).catch(function(e){ clearTimeout(t); rej(e); });
  });
}
function xmlCek(url, ms){
  return metinCek(url, ms).then(function(txt){ var p=new DOMParser(); return p.parseFromString(txt,'text/xml'); });
}
function xpathYaz(dugum, yol){
  try{
    var r = dugum.evaluate(yol, dugum, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null), out=[];
    for(var i=0;i<r.snapshotLength;i++){ out.push((r.snapshotItem(i).textContent||'').trim()); }
    return out;
  }catch(e){ return []; }
}
/* CORS yoksa r.jina.ai üzerinden dene */
function proxylaCek(url, ms){
  return metinCek('https://r.jina.ai/'+url, ms||25000).catch(function(){ return ''; });
}
/* Open-Meteo çok noktalı istek (nokta listesi 60'lık parçalara bölünür) */
function openMeteo(host, noktalar, params){
  var parcalar=[], boy=55;
  for(var i=0;i<noktalar.length;i+=boy) parcalar.push(noktalar.slice(i,i+boy));
  var vaatler = parcalar.map(function(p){
    var la=p.map(function(n){return n[1];}).join(','), lo=p.map(function(n){return n[2];}).join(',');
    return fetchJSON('https://'+host+'/v1/'+(host.indexOf('air')>=0?'air-quality':(host.indexOf('marine')>=0?'marine':'forecast'))
      +'?latitude='+la+'&longitude='+lo+'&'+params, 25000)
      .then(function(d){ return Array.isArray(d)? d : [d]; }).catch(function(){ return []; });
  });
  return Promise.all(vaatler).then(function(rs){ var out=[]; for(var i=0;i<rs.length;i++) out=out.concat(rs[i]); return out; });
}

/* ============================================================
   1) DEPREM — haftalık zengin besleme (küre için ek nokta)
   ============================================================ */
/* mevcut kodda var; burada ek olarak 1 haftalık M4.5+ listesi panellerde kullanılıyor */

/* ============================================================
   2) GDACS AFET (canlı · tüm tipler · koordinatlı)
   ============================================================ */
var GDACS_AD={'EQ':'Deprem','TC':'Tropikal Siklon','FL':'Sel','WF':'Orman Yangını',
  'VO':'Volkan','DR':'Kuraklık','TS':'Tsunami'};
var GDACS_RENK={Red:'#ff3b3b',Orange:'#f97316',Green:'#22c55e'};
function gdacsYukle(){
  var u='https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR;TS&alertlevel=Green;Orange;Red';
  return fetchJSON(u, 25000).then(function(d){
    if(!d || !d.features){ return null; }
    var nok=[], ham=[];
    for(var i=0;i<d.features.length;i++){
      var f=d.features[i], p=f.properties||{}, g=f.geometry;
      if(!g || !g.coordinates) continue;
      var m=GDACS_AD[p.eventtype]||p.eventtype, sev=p.alertlevel||'Green';
      ham.push({tur:m, seviye:sev, ulke:p.country||'', ad:p.eventname||'', tarih:p.fromdate||'', url:(p.url&&p.url.report)||''});
      nok.push({lat:g.coordinates[1], lng:g.coordinates[0], renk:GDACS_RENK[sev]||'#22c55e',
        cap: sev==='Red'?0.75:(sev==='Orange'?0.6:0.45), yuk:0.014, tur:'gdacs',
        ad:'⚠ '+m+' ('+sev+') · '+(p.country||'')+' · '+(p.fromdate?String(p.fromdate).slice(0,10):'')});
    }
    CANLI.gdacs=nok; CANLI_HAM.gdacs=ham; CANLI_SAAT.gdacs=simdi();
    var kirmizi=ham.filter(function(h){return h.seviye==='Red';}).length;
    return ham.length+' olay ('+kirmizi+' kırmızı)';
  });
}
/* Kasırga / tropikal siklon ayırımı aynı beslemeden */
function kasirgaNoktalari(){
  var out=[], ham=CANLI_HAM.gdacs||[];
  for(var i=0;i<(CANLI.gdacs||[]).length;i++){}
  return out;
}
function kasirgaYukle(){
  var u='https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC&alertlevel=Green;Orange;Red';
  return fetchJSON(u, 25000).then(function(d){
    if(!d || !d.features) return null;
    var nok=[], ham=[];
    for(var i=0;i<d.features.length;i++){
      var f=d.features[i], p=f.properties||{}, g=f.geometry;
      if(!g||!g.coordinates) continue;
      nok.push({lat:g.coordinates[1], lng:g.coordinates[0], renk:'#a855f7', cap:0.85, yuk:0.02, tur:'kasirga',
        ad:'🌀 '+(p.eventname||'Tropikal Siklon')+' ('+(p.alertlevel||'')+') · '+(p.country||'')+' · rüzgâr '+(p.maxwind||'?')+' km/sa'});
      ham.push({ad:p.eventname||'Tropikal Siklon', ulke:p.country||'', seviye:p.alertlevel||'', ruzgar:p.maxwind||'', basinc:p.pressure||'', tarih:p.fromdate||''});
    }
    CANLI.kasirga=nok; CANLI_HAM.kasirga=ham; CANLI_SAAT.kasirga=simdi();
    return nok.length+' siklon';
  });
}
/* NHC (ABD Ulusal Kasırga Merkezi) — doğrudan dene, olmazsa proxy */
function nhcYukle(){
  return fetchJSON('https://www.nhc.noaa.gov/CurrentStorms.json', 20000).then(function(d){ return d; })
    .catch(function(){ return proxylaCek('https://www.nhc.noaa.gov/CurrentStorms.json', 25000).then(function(t){
      try{ return JSON.parse(t); }catch(e){ return null; } }); })
    .then(function(d){
      if(!d) return null;
      var liste=(d.activeStorms||d.storms||[]);
      var ham=[];
      for(var i=0;i<liste.length;i++){ var s=liste[i];
        ham.push({ad:s.name||s.id||'', tur:s.classification||'', ruzgar:s.intensity||'', basinc:s.pressure||'',
          konum:(s.latitude||'')+' '+(s.longitude||''), tarih:s.lastUpdate||'', url:s.publicAdvisory&&s.publicAdvisory.url?s.publicAdvisory.url:''});
      }
      CANLI_HAM.nhc=ham;
      return ham.length+' aktif fırtına';
    }).catch(function(){ return null; });
}

/* ============================================================
   3) KUTUP IŞIKLARI (NOAA SWPC OVATION — aurora olasılığı)
   ============================================================ */
function auroraYukle(){
  return fetchJSON('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json', 25000).then(function(d){
    if(!d || !d.coordinates) return null;
    var nok=[], esik=26;
    for(var i=0;i<d.coordinates.length;i++){
      var c=d.coordinates[i]; if(!c || c.length<3) continue;
      if(c[2] < esik) continue;
      var lng=c[0], lat=c[1], olas=c[2];
      if(lat>-40 && lat<40) continue;
      nok.push({lat:lat, lng:lng, renk: olas>=60?'#22c55e':(olas>=35?'#22d3ee':'#67e8f9'),
        cap: olas>=60?0.55:(olas>=35?0.42:0.3), yuk:0.03, tur:'aurora', ad:'Aurora %'+olas+' · '+(lat>0?'kuzey':'güney')+' '+lat.toFixed(0)+'°'});
    }
    CANLI.aurora=nok; CANLI_SAAT.aurora=simdi();
    return nok.length+' aurora noktası';
  });
}
function uzayHavasiYukle(){
  var kp=fetchJSON('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', 20000).catch(function(){return null;});
  var ruzgar=fetchJSON('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json', 20000).catch(function(){return null;});
  var mag=fetchJSON('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json', 20000).catch(function(){return null;});
  var xray=fetchJSON('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json', 20000).catch(function(){return null;});
  return Promise.all([kp,ruzgar,mag,xray]).then(function(r){
    var kpHam=r[0], ruz=r[1], mg=r[2], xr=r[3];
    var o={};
    if(kpHam && kpHam.length){
      var son=null;
      for(var i=kpHam.length-1;i>=0;i--){ if(kpHam[i] && kpHam[i].kp_index!=null){ son=kpHam[i]; break; } }
      if(son){ o.kp=son.kp_index; o.kpZaman=son.time_tag; }
    }
    if(ruz && ruz.length){
      var sr=null; for(var j=ruz.length-1;j>=0;j--){ if(ruz[j] && ruz[j].proton_speed){ sr=ruz[j]; break; } }
      if(sr){ o.ruzgarHiz=sr.proton_speed; o.ruzgarYogunluk=sr.proton_density; o.ruzgarZaman=sr.time_tag; }
    }
    if(mg && mg.length){
      var sm=null; for(var k=mg.length-1;k>=0;k--){ if(mg[k] && mg[k].bz_gsm!=null){ sm=mg[k]; break; } }
      if(sm){ o.bz=sm.bz_gsm; o.bt=sm.bt; o.magZaman=sm.time_tag; }
    }
    if(xr && xr.length){ var sx=xr[xr.length-1]; o.xraySinif=sx.max_class||sx.current_class||''; o.xrayZaman=sx.max_time||sx.begin_time||''; if(sx.max_ratio) o.xrayOran=sx.max_ratio; }
    CANLI_HAM.uzay=o; CANLI_SAAT.uzay=simdi();
    return o;
  });
}

/* ============================================================
   4) HAVA DURUMU + HAVA KALİTESİ + DALGA (Open-Meteo)
   ============================================================ */
function havaRenk(t){
  if(t==null) return '#94a3b8';
  if(t<=-20) return '#c7d2fe'; if(t<=-5) return '#93c5fd'; if(t<=5) return '#38bdf8';
  if(t<=15) return '#22c55e'; if(t<=25) return '#facc15'; if(t<=35) return '#f97316';
  return '#ff3b3b';
}
function havaYukle(){
  if(typeof VERI_HAVA_SEHIR==='undefined') return Promise.resolve(null);
  return openMeteo('api.open-meteo.com', VERI_HAVA_SEHIR, 'current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code')
  .then(function(rs){
    var nok=[], ham=[];
    for(var i=0;i<rs.length && i<VERI_HAVA_SEHIR.length;i++){
      var s=VERI_HAVA_SEHIR[i], c=(rs[i]&&rs[i].current)||{};
      if(c.temperature_2m==null) continue;
      nok.push({lat:s[1], lng:s[2], renk:havaRenk(c.temperature_2m), cap:0.42, yuk:0.012, tur:'hava',
        ad:'🌡 '+s[0]+' · '+Math.round(c.temperature_2m)+'°C · rüzgâr '+Math.round(c.wind_speed_10m||0)+' km/sa'});
      ham.push({ad:s[0], sicaklik:c.temperature_2m, ruzgar:c.wind_speed_10m, yon:c.wind_direction_10m, kod:c.weather_code, zaman:c.time});
    }
    CANLI.hava=nok; CANLI_HAM.hava=ham; CANLI_SAAT.hava=simdi();
    return ham.length+' şehir';
  });
}
function havaKaliteYukle(){
  if(typeof VERI_HAVA_SEHIR==='undefined') return Promise.resolve(null);
  var alt=VERI_HAVA_SEHIR.slice(0,60);
  return openMeteo('air-quality-api.open-meteo.com', alt, 'current=pm2_5,pm10,ozone')
  .then(function(rs){
    var nok=[], ham=[];
    for(var i=0;i<rs.length && i<alt.length;i++){
      var s=alt[i], c=(rs[i]&&rs[i].current)||{};
      if(c.pm2_5==null) continue;
      var p=c.pm2_5, renk = p<=12?'#22c55e':(p<=35?'#facc15':(p<=55?'#f97316':(p<=150?'#ef4444':'#7f1d1d')));
      nok.push({lat:s[1], lng:s[2], renk:renk, cap:0.38, yuk:0.011, tur:'havakalite',
        ad:'🏭 '+s[0]+' · PM2.5 '+p.toFixed(0)+' µg/m³'});
      ham.push({ad:s[0], pm25:p, pm10:c.pm10, ozon:c.ozone});
    }
    CANLI.havakalite=nok; CANLI_HAM.havakalite=ham; CANLI_SAAT.havakalite=simdi();
    return ham.length+' nokta';
  });
}
function dalgaYukle(){
  if(typeof VERI_DENIZ_NOKTA==='undefined') return Promise.resolve(null);
  return openMeteo('marine-api.open-meteo.com', VERI_DENIZ_NOKTA, 'current=wave_height,wave_period,sea_surface_temperature,sea_level_height_msl')
  .then(function(rs){
    var nok=[], ham=[];
    for(var i=0;i<rs.length && i<VERI_DENIZ_NOKTA.length;i++){
      var s=VERI_DENIZ_NOKTA[i], c=(rs[i]&&rs[i].current)||{};
      if(c.wave_height==null) continue;
      var h=c.wave_height, renk = h<1?'#60a5fa':(h<3?'#38bdf8':(h<6?'#a855f7':'#ef4444'));
      nok.push({lat:s[1], lng:s[2], renk:renk, cap: h<3?0.32:0.45, yuk:0.01, tur:'dalga',
        ad:'🌊 '+s[0]+' · dalga '+h.toFixed(1)+' m'+(c.sea_surface_temperature!=null?' · su '+c.sea_surface_temperature.toFixed(1)+'°C':'')});
      ham.push({ad:s[0], dalga:h, periyot:c.wave_period, su:c.sea_surface_temperature, seviye:c.sea_level_height_msl});
    }
    CANLI.dalga=nok; CANLI_HAM.dalga=ham; CANLI_SAAT.dalga=simdi();
    return ham.length+' deniz noktası';
  });
}
/* YAGIS TAHMINI (24 saat ileri · Open-Meteo) */
function tahminYukle(){
  if(typeof VERI_HAVA_SEHIR==='undefined') return Promise.resolve(null);
  var noktalar=VERI_HAVA_SEHIR.slice(0,62);
  var parcalar=[], boy=31;
  for(var i=0;i<noktalar.length;i+=boy) parcalar.push(noktalar.slice(i,i+boy));
  var vaatler=parcalar.map(function(p){
    var la=p.map(function(n){return n[1];}).join(','), lo=p.map(function(n){return n[2];}).join(',');
    return fetchJSON('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo
      +'&hourly=precipitation,precipitation_probability&forecast_hours=24', 25000)
      .then(function(d){ return Array.isArray(d)? d : [d]; }).catch(function(){ return []; });
  });
  return Promise.all(vaatler).then(function(rs){
    var duz=[]; for(var i=0;i<rs.length;i++) duz=duz.concat(rs[i]);
    var nok=[], ham=[];
    for(var j=0;j<duz.length && j<noktalar.length;j++){
      var c=duz[j], h=c&&c.hourly; if(!h||!h.precipitation) continue;
      var top=0, enb=0;
      for(var k=0;k<Math.min(24,h.precipitation.length);k++){ top+=(h.precipitation[k]||0);
        if((h.precipitation_probability&&h.precipitation_probability[k]||0)>enb) enb=h.precipitation_probability[k]; }
      var s=noktalar[j];
      var renk = top<0.5?'#64748b':(top<3?'#38bdf8':(top<12?'#2563eb':(top<30?'#7c3aed':'#ef4444')));
      nok.push({lat:s[1], lng:s[2], renk:renk, cap:0.4, yuk:0.012, tur:'yagis',
        ad:'🌧 '+s[0]+' · 24s yağış '+top.toFixed(1)+' mm · olasılık %'+enb});
      ham.push({ad:s[0], toplam:top, olasilik:enb});
    }
    CANLI.yagis=nok; CANLI_HAM.yagis=ham; CANLI_SAAT.yagis=simdi();
    return ham.length+' şehir yağış tahmini';
  });
}
/* GÜNEŞ LEKELERİ / AKTİF BÖLGELER (NOAA SWPC) */
function gunesLekeYukle(){
  return fetchJSON('https://services.swpc.noaa.gov/json/solar_regions.json', 25000).then(function(d){
    if(!Array.isArray(d)) return null;
    var son={};
    for(var i=0;i<d.length;i++){
      var r=d[i]; if(!r || r.region==null) continue;
      son[r.region]={bolge:r.region, enlem:r.latitude, boylam:r.longitude,
        leke:r.number_spots||0, sinif:r.spot_class||'', alan:r.area||0, tarih:r.observed_date||''};
    }
    var liste=[]; for(var k in son) liste.push(son[k]);
    liste.sort(function(a,b){ return (b.leke||0)-(a.leke||0); });
    CANLI_HAM.gunesLeke=liste.slice(0,12); CANLI_SAAT.gunesLeke=simdi();
    return liste.length+' aktif güneş bölgesi';
  });
}
/* UYDU GEÇİŞ TAHMİNİ — yerel hesap (satellite.js · anahtarsız) */
function uyduGecis(hedefLat, hedefLng, uyduAdi, saatSaat){
  if(typeof satellite==='undefined') return null;
  var grup=TLE_CACHE['stations'] && TLE_CACHE['stations'].uydular;
  if(!grup || !grup.length) return null;
  var hedef=null;
  for(var i=0;i<grup.length;i++){ if(grup[i].ad && grup[i].ad.indexOf(uyduAdi)>=0){ hedef=grup[i]; break; } }
  if(!hedef) return null;
  var sr;
  try{ sr=satellite.twoline2satrec(hedef.l1, hedef.l2); }catch(e){ return null; }
  var gecisler=[], icinde=false, baslangic=null, enYuksek=0;
  var bas=simdi().getTime(), adim=30*1000, sure=(saatSaat||24)*3600*1000;
  for(var t=0; t<sure; t+=adim){
    var an=new Date(bas+t), k;
    try{
      var p=satellite.propagate(sr, an);
      if(!p || !p.position || typeof p.position.x!=='number') continue;
      var g=satellite.eciToGeodetic(p.position, satellite.gstime(an));
      var lat=satellite.degreesLat(g.latitude), lng=satellite.degreesLong(g.longitude);
      k={lat:lat, lng:lng, h:g.height};
    }catch(e){ continue; }
    var yuk=yerYukseklik(k, hedefLat, hedefLng);
    if(yuk>=10){
      if(!icinde){ icinde=true; baslangic=an; enYuksek=yuk; }
      else if(yuk>enYuksek) enYuksek=yuk;
    } else if(icinde){
      icinde=false;
      gecisler.push({bas:baslangic, bit:an, max:enYuksek});
      enYuksek=0;
      if(gecisler.length>=6) break;
    }
  }
  return {uydu:hedef.ad, gecisler:gecisler};
}
function yerYukseklik(k, lat0, lng0){
  var R=6371, d2r=Math.PI/180;
  var r1=(90-k.lat)*d2r, r2=(90-lat0)*d2r;
  var dl=(k.lng-lng0)*d2r;
  var cosc=Math.cos(r1)*Math.cos(r2)+Math.sin(r1)*Math.sin(r2)*Math.cos(dl);
  if(cosc>1) cosc=1; if(cosc<-1) cosc=-1;
  var c=Math.acos(cosc), merkez=c*R;
  var yercekimi=R+ (k.h||400);
  if(merkez>=R) return 0;
  var teget=Math.sqrt(Math.max(0, (R*R) - (merkez*merkez)));
  var yuk=Math.sqrt(Math.max(0, (yercekimi*yercekimi) - (R*R))) - teget;
  var theta=Math.atan2(teget, R)*180/Math.PI;
  if(yuk<=0) return 0;
  var dikey=Math.acos(R/yercekimi)*180/Math.PI;
  return dikey - theta;
}
function ruzgarYukle(){
  /* küresel ızgara: 15° aralık */
  var nok=[];
  for(var la=-75; la<=75; la+=15){
    for(var lo=-180; lo<180; lo+=15){ nok.push(['', la, lo]); }
  }
  return openMeteo('api.open-meteo.com', nok, 'current=wind_speed_10m,wind_direction_10m').then(function(rs){
    var yollar=[], say=0;
    for(var i=0;i<rs.length && i<nok.length;i++){
      var c=(rs[i]&&rs[i].current)||{}; if(c.wind_speed_10m==null) continue;
      var spd=c.wind_speed_10m, dir=c.wind_direction_10m||0;
      if(spd<3) continue;
      var la=nok[i][1], lo=nok[i][2], uz=Math.max(2, Math.min(9, spd/8));
      var rad=dir*Math.PI/180;
      var dla=-uz*Math.cos(rad)/111, dlo=uz*Math.sin(rad)/(111*Math.cos(la*Math.PI/180)+0.0001);
      var renk = spd<20?'#bae6fd':(spd<40?'#38bdf8':(spd<70?'#a855f7':'#ef4444'));
      yollar.push({pts:[[la,lo],[la+dla,lo+dlo]], ad:'rüzgâr '+Math.round(spd)+' km/sa', renk:renk, tur:'ruzgar'});
      say++;
    }
    CANLI_YOL.ruzgar=yollar; CANLI_SAAT.ruzgar=simdi();
    return say+' rüzgâr oku';
  });
}

/* ============================================================
   5) GEMİLER — Digitraffic AIS (Finlandiya/Baltık, anahtarsız canlı)
   ============================================================ */
function gemiYukle(){
  if(!Object.keys(GEMI_AD).length) gemiIsimYukle();
  return fetchJSON('https://meri.digitraffic.fi/api/ais/v1/locations', 25000).then(function(d){
    if(!d || !d.features) return null;
    var yeni=[], n=0;
    for(var i=0;i<d.features.length;i++){
      var f=d.features[i], g=f.geometry, p=f.properties||{};
      if(!g || !g.coordinates) continue;
      var lng=g.coordinates[0], lat=g.coordinates[1];
      if(lat==null||lng==null) continue;
      var id='s'+p.mmsi;
      var e=GEMI_EL[id];
      if(!e){ var span=document.createElement('span'); span.className='gemiIkon'; span.textContent='⛴';
        span.style.display='inline-block'; e={el:span}; GEMI_EL[id]=e; }
      var bil=GEMI_AD[p.mmsi]||{};
      e.lat=lat; e.lng=lng;
      e.ad=(bil.ad || ('Gemi '+(p.mmsi||'')))+(bil.hedef? ' → '+bil.hedef : '')
        +(p.sog!=null? ' · '+Number(p.sog).toFixed(1)+' kn' : '');
      e.el.style.transform='rotate('+((p.cog||0)-45)+'deg)';
      yeni.push(e); n++; if(n>=250) break;
    }
    HTML_VERI.gemi=yeni; htmlYenile();
    CANLI_HAM.gemi=yeni.length;
    CANLI_HAM.gemiAd=Object.keys(GEMI_AD).length;
    CANLI_SAAT.gemi=simdi();
    return n+' gemi (Finlandiya/Baltık AIS)';
  });
}
/* gemi isim/hedef kaydı (Digitraffic vessels · 6 saatte bir yenilenir) */
var GEMI_AD={}, GEMI_AD_ZAMAN=0;
function gemiIsimYukle(){
  if(Object.keys(GEMI_AD).length && (simdi().getTime()-GEMI_AD_ZAMAN) < 6*3600*1000) return Promise.resolve(null);
  return fetchJSON('https://meri.digitraffic.fi/api/ais/v1/vessels', 35000).then(function(d){
    if(!Array.isArray(d)) return null;
    var yeni={};
    for(var i=0;i<d.length;i++){ var v=d[i]; if(v && v.mmsi!=null) yeni[v.mmsi]={ad:v.name||'', imo:v.imo||0, hedef:v.destination||''}; }
    GEMI_AD=yeni; GEMI_AD_ZAMAN=simdi().getTime();
    return d.length+' gemi kaydı (isim/hedef)';
  }).catch(function(){ return null; });
}
/* ASKERÎ UÇAKLAR — adsb.lol /v2/mil (CORS kapalı: .bat ile açılınca görünür) */
var AS_EL={};
function askeriUcakYukle(){
  return fetchJSON('https://api.adsb.lol/v2/mil', 30000).then(function(d){
    if(!d) return null;
    var liste=d.ac||d.aircraft||[];
    var yeni=[], n=0;
    for(var i=0;i<liste.length;i++){
      var u=liste[i]; if(u.lat==null||u.lon==null) continue;
      var id='a'+u.hex;
      var e=AS_EL[id];
      if(!e){ var span=document.createElement('span'); span.className='asIkon'; span.textContent='✈';
        span.style.display='inline-block'; e={el:span}; AS_EL[id]=e; }
      e.lat=u.lat; e.lng=u.lon;
      e.ad='⚠ ASKERÎ · '+(u.flight?String(u.flight).trim():'')+' ['+(u.t||'?')+']'
        +(u.alt_baro!=null? ' · '+Number(u.alt_baro).toLocaleString('tr-TR')+' ft':'')
        +(u.gs!=null? ' · '+Math.round(u.gs)+' kn':'');
      if(u.track!=null) e.el.style.transform='rotate('+(u.track-45)+'deg)';
      yeni.push(e); n++;
    }
    HTML_VERI.askeriucak=yeni; htmlYenile();
    CANLI_HAM.askeriucak=n; CANLI_SAAT.askeriucak=simdi();
    return n+' askerî uçak';
  });
}
/* Starlink: CelesTrak grupları zaman zaman 403 verir -> 5 dk geri çekilme + active yedeği */
var STARLINK_GECIKME=0;
function starlinkYukle(){
  if(typeof satellite==='undefined') return Promise.resolve(null);
  if(simdi().getTime() < STARLINK_GECIKME) return Promise.resolve(null);
  return tleCek('starlink').then(function(liste){
    if(liste && liste.length) return liste;
    return tleCek('active').then(function(tum){
      var sec=(tum||[]).filter(function(u){ return u.ad && u.ad.toUpperCase().indexOf('STARLINK')>=0; });
      if(sec.length) return sec;
      STARLINK_GECIKME = simdi().getTime() + 5*60000;
      return [];
    });
  }).then(function(liste){
    if(!liste || !liste.length) return null;
    var atla=Math.max(1, Math.floor(liste.length/300)), nok=[];
    for(var i=0;i<liste.length;i+=atla){
      var k=uyduKonum(liste[i]); if(!k) continue;
      var yuk=Math.max(0.02, Math.min(0.12, k.h));
      nok.push({lat:k.lat, lng:k.lng, renk:'#93c5fd', cap:0.25, yuk:yuk, tur:'starlink', ad:'Starlink · '+liste[i].ad});
    }
    CANLI.starlink=nok; CANLI_HAM.starlinkSay=nok.length; CANLI_SAAT.starlink=simdi();
    return nok.length+' Starlink';
  });
}
var GEMI_EL={};
function htmlYenile(){
  if(!KURE) return;
  var hepsi=[];
  for(var k in HTML_VERI){ if(KATMAN[k]) hepsi=hepsi.concat(HTML_VERI[k]||[]); }
  KURE.htmlElementsData(hepsi).htmlElement(function(x){ return x.el; })
    .htmlAltitude(0.012).htmlTransitionDuration(MOD==='4d'?14000:9000);
}

/* ============================================================
   6) CANLI UYDU YÖRÜNGELERİ (CelesTrak TLE + satellite.js)
   ============================================================ */
function tleCek(grup){
  var onb=TLE_CACHE[grup];
  if(onb && (simdi() - onb.zaman) < 6*3600*1000) return Promise.resolve(onb.uydular);
  return metinCek('https://celestrak.org/NORAD/elements/gp.php?GROUP='+grup+'&FORMAT=tle', 40000)
    .then(function(txt){
      var satirlar=String(txt).split(/\r?\n/), liste=[];
      for(var i=0;i+2<satirlar.length;i+=3){
        var ad=(satirlar[i]||'').trim(), l1=(satirlar[i+1]||'').trim(), l2=(satirlar[i+2]||'').trim();
        if(l1.indexOf('1 ')===0 && l2.indexOf('2 ')===0) liste.push({ad:ad, l1:l1, l2:l2});
      }
      if(!liste.length) throw new Error('TLE boş');
      TLE_CACHE[grup]={zaman:simdi(), uydular:liste};
      return liste;
    }).catch(function(){ return onb? onb.uydular : []; });
}
function uyduKonum(u){
  try{
    var sr=satellite.twoline2satrec(u.l1,u.l2);
    var p=satellite.propagate(sr, simdi());
    if(!p || !p.position || typeof p.position.x!=='number') return null;
    var g=satellite.eciToGeodetic(p.position, satellite.gstime(simdi()));
    var lat=satellite.degreesLat(g.latitude), lng=satellite.degreesLong(g.longitude);
    if(isNaN(lat)||isNaN(lng)) return null;
    return {lat:lat, lng:lng, h:g.height?g.height/6371:0.03};
  }catch(e){ return null; }
}
function uyducYukle(){
  if(typeof satellite==='undefined') return Promise.resolve(null);
  return Promise.all([tleCek('stations'), tleCek('gps-ops'), tleCek('science')]).then(function(r){
    var liste=[].concat(r[0]||[], r[1]||[], r[2]||[]);
    if(!liste.length) return null;
    var nok=[];
    for(var i=0;i<liste.length;i++){
      var k=uyduKonum(liste[i]); if(!k) continue;
      var tur = (liste[i].ad.indexOf('ISS')>=0 || liste[i].ad.indexOf('CSS')>=0) ? 'istasyon' : 'uydu';
      nok.push({lat:k.lat, lng:k.lng, renk: tur==='istasyon'?'#4ade80':'#c4b5fd', cap: tur==='istasyon'?0.7:0.35,
        yuk: tur==='istasyon'?0.05:0.04, tur:'uyduc', ad:'🛰 '+liste[i].ad+' · '+k.lat.toFixed(1)+'°, '+k.lng.toFixed(1)+'°'});
    }
    CANLI.uyduc=nok; CANLI_HAM.uyducSay=nok.length; CANLI_SAAT.uyduc=simdi();
    return nok.length+' uydu konumu';
  });
}
function starlinkYukleEski(){
  if(typeof satellite==='undefined') return Promise.resolve(null);
  return tleCek('starlink').then(function(liste){
    if(!liste || !liste.length) return null;
    var atla=Math.max(1, Math.floor(liste.length/300)), nok=[];
    for(var i=0;i<liste.length;i+=atla){
      var k=uyduKonum(liste[i]); if(!k) continue;
      var yuk=Math.max(0.02, Math.min(0.12, k.h));
      nok.push({lat:k.lat, lng:k.lng, renk:'#93c5fd', cap:0.25, yuk:yuk, tur:'starlink', ad:'Starlink · '+liste[i].ad});
    }
    CANLI.starlink=nok; CANLI_HAM.starlinkSay=nok.length; CANLI_SAAT.starlink=simdi();
    return nok.length+' Starlink';
  });
}

/* ============================================================
   7) UYARILAR — Tsunami / şiddetli hava (api.weather.gov · ABD kapsamı)
   ============================================================ */
function uyariYukle(){
  var t=fetchJSON('https://api.weather.gov/alerts/active?event=Tsunami%20Warning', 20000).catch(function(){return null;});
  var s=fetchJSON('https://api.weather.gov/alerts/active?severity=Extreme&limit=50', 20000).catch(function(){return null;});
  return Promise.all([t,s]).then(function(r){
    var ts=r[0], sv=r[1], nok=[], ham=[];
    function ekle(d, tur, renk){
      if(!d || !d.features) return;
      for(var i=0;i<d.features.length;i++){
        var f=d.features[i], p=f.properties||{}, g=f.geometry;
        ham.push({tur:tur, ad:p.event||'', alan:p.areaDesc||'', siddet:p.severity||'', baslangic:p.onset||p.sent||'', bitti:p.ends||'', url:p['@id']||''});
        if(!g) continue;
        var koor=null;
        if(g.type==='Point') koor=g.coordinates;
        else if(g.type==='Polygon' && g.coordinates && g.coordinates[0] && g.coordinates[0][0]) koor=g.coordinates[0][0];
        if(!koor) continue;
        nok.push({lat:koor[1], lng:koor[0], renk:renk, cap:0.6, yuk:0.016, tur:'tsunami',
          ad:(tur==='Tsunami'?'🌊 ':'⚠ ')+(p.event||tur)+' · '+(p.areaDesc||'').slice(0,60)});
      }
    }
    ekle(ts,'Tsunami','#06b6d4');
    ekle(sv,'Şiddetli Hava','#f43f5e');
    CANLI.tsunami=nok; CANLI_HAM.uyari=ham; CANLI_SAAT.tsunami=simdi();
    return ham.length+' uyarı';
  });
}
/* Küresel tsunami bülteni (CORS yok → r.jina.ai üzerinden liste) */
function tsunamiBul(){
  return xmlCek('https://www.tsunami.gov/events/xml/PAAQAtom.xml', 20000)
    .then(function(d){ return atomOku(d); })
    .catch(function(){ return proxylaCek('https://www.tsunami.gov/events/xml/PAAQAtom.xml', 25000)
      .then(function(t){ if(!t) return []; var p=new DOMParser(); return atomOku(p.parseFromString(t,'text/xml')); }); });
}
function atomOku(d){
  var out=[];
  try{
    var giris=xpathYaz(d,'//*[local-name()="entry"]');
    var dugum=(giris.length? giris : xpathYaz(d,'//*[local-name()="item"]'));
    for(var i=0;i<Math.min(dugum.length,25);i++){
      var ic=xpathYaz(dugum[i],'.//*[local-name()="title"]');
      out.push(xpathYaz(dugum[i],'.//*[local-name()="title"]')[0]||'');
    }
  }catch(e){}
  return out;
}

/* ============================================================
   8) VOLKANLAR — statik konum + USGS HANS canlı uyarı seviyeleri
   ============================================================ */
function volkanUyarilariYukle(){
  return fetchJSON('https://volcanoes.usgs.gov/hans-public/api/volcano/getMonitoredVolcanoes', 25000).then(function(d){
    if(!Array.isArray(d)) return null;
    var ham=[];
    for(var i=0;i<d.length;i++){
      var v=d[i];
      ham.push({ad:v.volcano_name||'', seviye:v.alert_level||'', renk:v.color_code||'', gozlemevi:v.obs_fullname||'', zaman:v.sent_utc||''});
    }
    ham.sort(function(a,b){ var s={'WARNING':0,'WATCH':1,'ADVISORY':2,'NORMAL':3}; return (s[a.seviye]||9)-(s[b.seviye]||9); });
    CANLI_HAM.volkan=ham; CANLI_SAAT.volkan=simdi();
    return ham.length+' volkan izleniyor';
  });
}
function volkanNoktalari(){
  var out=[];
  if(typeof VERI_VOLKAN==='undefined') return out;
  for(var i=0;i<VERI_VOLKAN.length;i++){
    var v=VERI_VOLKAN[i];
    out.push({lat:v[0], lng:v[1], renk:'#b45309', cap:0.5, yuk:0.014, tur:'volkan', ad:'🌋 '+v[2]});
  }
  return out;
}

/* ============================================================
   9) GECE/GÜNDÜZ TERMİNATÖRÜ + GÜNEŞ ALTNOKTASI
   ============================================================ */
function gunesKonumu(){
  var t=simdi();
  var n=(t.getTime()/86400000) - 10957.5;               /* 2000-01-01 12:00 UT'den gün */
  var L=(280.460 + 0.9856474*n) % 360;
  var g=((357.528 + 0.9856003*n) % 360) * Math.PI/180;
  var lam=(L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g)) * Math.PI/180;
  var eps=(23.439 - 0.0000004*n) * Math.PI/180;
  var dec=Math.asin(Math.sin(eps)*Math.sin(lam));
  var ra=Math.atan2(Math.cos(eps)*Math.sin(lam), Math.cos(lam))*180/Math.PI;
  var gmst=(18.697374558 + 24.06570982441908*n) % 24;
  var lng=ra - gmst*15;
  while(lng>180) lng-=360; while(lng<-180) lng+=360;
  return {dec:dec*180/Math.PI, lng:lng};
}
function terminCizgi(){
  var s=gunesKonumu(), pts=[], decRad=s.dec*Math.PI/180;
  for(var lo=-180; lo<=180; lo+=2){
    var d=(lo - s.lng)*Math.PI/180;
    var lat=Math.atan(-Math.cos(d)/Math.tan(decRad))*180/Math.PI;
    if(!isFinite(lat)) lat=0;
    pts.push([Math.max(-89.5,Math.min(89.5,lat)), lo]);
  }
  return {pts:pts, gunes:s};
}
function terminYollar(){
  var t=terminCizgi();
  return [{pts:t.pts, ad:'Gece/Gündüz sınırı · güneş alt noktası: '+t.gunes.dec.toFixed(1)+'° / '+t.gunes.lng.toFixed(1)+'°', renk:'#e5e7eb', tur:'termin'}];
}
function terminNokta(){
  var s=gunesKonumu();
  return {lat:s.dec, lng:s.lng, renk:'#fde047', cap:0.8, yuk:0.03, tur:'termin', ad:'☀ Güneş tam tepede'};
}

/* ============================================================
   10) KÜRE ÇİZİMİNE KATKI
   ============================================================ */
function canliNoktalar(){
  var out=[];
  var sira=['gdacs','kasirga','aurora','hava','yagis','havakalite','dalga','uyduc','starlink','tsunami'];
  for(var i=0;i<sira.length;i++){ var d=CANLI[sira[i]]; if(d && d.length){ for(var j=0;j<d.length;j++) out.push(d[j]); } }
  if(KATMAN.volkan){ var v=volkanNoktalari(); for(var k=0;k<v.length;k++) out.push(v[k]); }
  if(KATMAN.termin){ out.push(terminNokta()); }
  return out;
}
function canliYollar(){
  var out=[];
  if(CANLI_YOL.ruzgar && CANLI_YOL.ruzgar.length){ for(var i=0;i<CANLI_YOL.ruzgar.length;i++) out.push(CANLI_YOL.ruzgar[i]); }
  if(KATMAN.termin){ var t=terminYollar(); for(var j=0;j<t.length;j++) out.push(t[j]); }
  return out;
}
function statikListe(){
  var out=[];
  function ekle(dizi,renk,tur,cap){ if(typeof dizi==='undefined') return;
    for(var i=0;i<dizi.length;i++) out.push({lat:dizi[i][0],lng:dizi[i][1],renk:renk,cap:cap,yuk:0.012,tur:tur,ad:dizi[i][2]}); }
  ekle(VERI_RAFINE,'#f59e0b','rafineri',0.45);
  ekle(VERI_LIMAN,'#38bdf8','liman',0.42);
  ekle(VERI_SANTRAL,'#84cc16','santral',0.45);
  ekle(VERI_VERIMERKEZI,'#a78bfa','verimerkezi',0.4);
  ekle(VERI_CIPFAB,'#f472b6','cipfab',0.42);
  ekle(VERI_MULTECI,'#fbbf24','multeci',0.5);
  return out;
}
function statikYollar(){
  var out=[];
  if(typeof VERI_BORU!=='undefined' && KATMAN.boru){
    for(var i=0;i<VERI_BORU.length;i++){ var r=VERI_BORU[i], pts=[];
      for(var j=0;j<r.length-1;j++) pts.push([r[j][0],r[j][1]]);
      out.push({pts:pts, ad:'🛢 '+r[r.length-1], renk:'#fb923c', tur:'boru'}); }
  }
  if(typeof VERI_KORIDOR!=='undefined' && KATMAN.koridor){
    for(var k=0;k<VERI_KORIDOR.length;k++){ var r2=VERI_KORIDOR[k], pts2=[];
      for(var m=0;m<r2.length-1;m++) pts2.push([r2[m][0],r2[m][1]]);
      out.push({pts:pts2, ad:'🚂 '+r2[r2.length-1], renk:'#22d3ee', tur:'koridor'}); }
  }
  return out;
}

/* ============================================================
   11) İKİ BOYUTLU KARO KATMANLARI (NASA GIBS + RainViewer)
   ============================================================ */
var KAROLAR=[
 {id:'bulut',   ad:'Bulut / Gündüz görüntüsü', gibs:'MODIS_Terra_CorrectedReflectance_TrueColor', mat:'GoogleMapsCompatible_Level9', uz:'jpg', saydam:0.85, tarihli:true},
 {id:'bulutoran',ad:'Bulut oranı',            gibs:'MODIS_Terra_Cloud_Fraction_Day', mat:'GoogleMapsCompatible_Level6', uz:'png', saydam:0.65, tarihli:true},
 {id:'yanginduman',ad:'Yangın / duman (yanlış renk)', gibs:'MODIS_Terra_CorrectedReflectance_Bands367', mat:'GoogleMapsCompatible_Level9', uz:'jpg', saydam:0.85, tarihli:true},
 {id:'aerosol', ad:'Aerosol / toz bulutu',    gibs:'MODIS_Terra_Aerosol', mat:'GoogleMapsCompatible_Level6', uz:'png', saydam:0.6, tarihli:true},
 {id:'kar',     ad:'Kar örtüsü',              gibs:'MODIS_Terra_NDSI_Snow_Cover', mat:'GoogleMapsCompatible_Level8', uz:'png', saydam:0.8, tarihli:true},
 {id:'karasicak',ad:'Kara yüzeyi sıcaklığı',  gibs:'MODIS_Terra_Land_Surface_Temp_Day', mat:'GoogleMapsCompatible_Level7', uz:'png', saydam:0.7, tarihli:true},
 {id:'klorofil',ad:'Deniz üretkenliği (klorofil)', gibs:'MODIS_Aqua_L2_Chlorophyll_A', mat:'GoogleMapsCompatible_Level7', uz:'png', saydam:0.55, tarihli:true},
 {id:'denizbuzu',ad:'Deniz buzu yoğunluğu',  gibs:'AMSRU2_Sea_Ice_Concentration_12km', mat:'GoogleMapsCompatible_Level6', uz:'png', saydam:0.8, tarihli:false},
 {id:'bitki',   ad:'Bitki örtüsü (NDVI)',    gibs:'MISR_Land_NDVI_Average_Monthly', mat:'GoogleMapsCompatible_Level6', uz:'png', saydam:0.7, tarihli:false},
 {id:'sst',     ad:'Deniz yüzeyi sıcaklığı',  gibs:'GHRSST_L4_MUR_Sea_Surface_Temperature', mat:'GoogleMapsCompatible_Level7', uz:'png', saydam:0.7, tarihli:true},
 {id:'geceisik',ad:'Gece ışıkları (şehirler)', gibs:'VIIRS_CityLights_2012', mat:'GoogleMapsCompatible_Level8', uz:'jpg', saydam:0.8, tarihli:false},
 {id:'kabartma',ad:'Kabartma / okyanus tabanı', gibs:'BlueMarble_ShadedRelief_Bathymetry', mat:'GoogleMapsCompatible_Level8', uz:'jpg', saydam:0.9, tarihli:false}
];
var KARO_AC={}, KARO_YER={};
var RADAR_LISTE=null, RADAR_HOST=null, RADAR_ZAMAN=null, RADAR_KARE=0, RADAR_DAMGA=0;
function karolarKur(){
  if(!HARITA) return;
  for(var i=0;i<KAROLAR.length;i++){
    var k=KAROLAR[i];
    if(!KARO_AC[k.id]){ if(KARO_YER[k.id]){ HARITA.removeLayer(KARO_YER[k.id]); delete KARO_YER[k.id]; } continue; }
    if(KARO_YER[k.id]) continue;
    var d=new Date(Date.now()-86400000);
    var tarih = k.tarihli ? d.toISOString().slice(0,10) : 'default';
    var url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/'+k.gibs+'/default/'+tarih+'/'+k.mat+'/{z}/{y}/{x}.'+k.uz;
    KARO_YER[k.id]=L.tileLayer(url,{opacity:k.saydam, maxNativeZoom: Math.min(9, Math.max(1, parseInt(k.mat.replace(/[^0-9]/g,''))||9)), maxZoom:19, attribution:'NASA GIBS'}).addTo(HARITA);
  }
  radarKur();
}
function radarKur(){
  if(!HARITA) return;
  if(!KARO_AC.radar){ radarTemizle(); return; }
  if(RADAR_LISTE && (simdi().getTime()-RADAR_DAMGA) < 5*60000){ radarKurKatman(); return; }
  fetchJSON('https://api.rainviewer.com/public/weather-maps.json', 20000).then(function(d){
    if(!d || !d.radar || !d.radar.past || !d.radar.past.length) return;
    RADAR_LISTE=d.radar.past; RADAR_HOST=d.host; RADAR_DAMGA=simdi().getTime();
    radarKurKatman();
  }).catch(function(){});
}
function radarTemizle(){
  if(RADAR_ZAMAN){ clearInterval(RADAR_ZAMAN); RADAR_ZAMAN=null; }
  if(KARO_YER.radar && HARITA){ HARITA.removeLayer(KARO_YER.radar); }
  delete KARO_YER.radar;
}
function radarKurKatman(){
  if(!HARITA || !RADAR_LISTE || !RADAR_LISTE.length) return;
  radarTemizle();
  var goster=function(i){
    if(KARO_YER.radar && HARITA){ HARITA.removeLayer(KARO_YER.radar); }
    KARO_YER.radar=L.tileLayer(RADAR_HOST+RADAR_LISTE[i].path+'/256/{z}/{x}/{y}/2/1_1.png',
      {opacity:0.6, attribution:'RainViewer'}).addTo(HARITA);
  };
  if(KARO_AC.radarAni){
    RADAR_KARE=RADAR_LISTE.length-1; goster(RADAR_KARE);
    RADAR_ZAMAN=setInterval(function(){
      if(!KARO_AC.radar){ radarTemizle(); return; }
      RADAR_KARE=(RADAR_KARE+1)%RADAR_LISTE.length; goster(RADAR_KARE);
    }, 800);
  } else {
    goster(RADAR_LISTE.length-1);
  }
}
function karoPanelHTML(){
  var h='<div class="karolar"><div class="karBaslik">🛰️ UYDU / RADAR KATMANLARI (2D)</div>';
  for(var i=0;i<KAROLAR.length;i++){
    h+='<label class="katSat"><input type="checkbox" '+(KARO_AC[KAROLAR[i].id]?'checked':'')+' onchange="karoDegis(\''+KAROLAR[i].id+'\',this.checked)">'+esc(KAROLAR[i].ad)+'</label>';
  }
  h+='<label class="katSat"><input type="checkbox" '+(KARO_AC.radar?'checked':'')+' onchange="karoDegis(\'radar\',this.checked)">Canlı yağış radarı (RainViewer)</label>';
  h+='<label class="katSat"><input type="checkbox" '+(KARO_AC.radarAni?'checked':'')+' onchange="karoDegis(\'radarAni\',this.checked)">↻ Radar animasyonu (son 2 saat)</label>';
  h+='<div class="karNot">NASA GIBS görüntüleri günlüktür (dün · UTC). Yağış radarı canlıdır; animasyon kareleri 0,8 sn arayla oynatır.</div></div>';
  return h;
}
function karoDegis(id, acik){ KARO_AC[id]=acik?1:0; try{ localStorage.setItem('ustad_karo_'+id, acik?'1':'0'); }catch(e){} karolarKur(); }
function karoGeriYukle(){
  for(var i=0;i<KAROLAR.length;i++){ try{ if(localStorage.getItem('ustad_karo_'+KAROLAR[i].id)==='1') KARO_AC[KAROLAR[i].id]=1; }catch(e){} }
  try{
    if(localStorage.getItem('ustad_karo_radar')==='1') KARO_AC.radar=1;
    if(localStorage.getItem('ustad_karo_radarAni')==='1') KARO_AC.radarAni=1;
  }catch(e){}
}

/* ============================================================
   12) SEKMELİ PANELLER (UZAY · AFET · DENİZ · HAVA · SAĞLIK)
   ============================================================ */
function tablo(basliklar, satirlar){
  var h='<table class="tbl">';
  if(basliklar.length){ h+='<tr>'; for(var i=0;i<basliklar.length;i++) h+='<td class="k">'+esc(basliklar[i])+'</td>'; h+='</tr>'; }
  for(var s=0;s<satirlar.length;s++){
    h+='<tr>';
    for(var c=0;c<satirlar[s].length;c++){
      h+='<td class="'+(c===0?'k':'v')+'">'+(satirlar[s][c]==null?'-':esc(String(satirlar[s][c])))+'</td>';
    }
    h+='</tr>';
  }
  return h+'</table>';
}
function ozelPanelHTML(id){
  function kap(ic){ return '<div class="durum" id="durum_'+id+'"></div><div class="sonuc" id="sonuc_'+id+'">'+ic+'</div>'; }
  if(id==='uzay'){
    return '<h2 class="panelBaslik">🌌 UZAY HAVASI · KUTUP IŞIKLARI · UYDULAR</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='afet'){
    return '<h2 class="panelBaslik">⚠️ CANLI AFET · VOLKAN · TSUNAMİ</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='deniz'){
    return '<h2 class="panelBaslik">🚢 DENİZ TRAFİĞİ · DALGA</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='hava'){
    return '<h2 class="panelBaslik">🌦 HAVA · HAVA KALİTESİ · RÜZGÂR</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='saglik'){
    return '<h2 class="panelBaslik">🩺 SAĞLIK / SALGIN AKIŞI</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='uyari'){
    return '<h2 class="panelBaslik">📢 UYARILAR (TSUNAMİ · ŞİDDETLİ HAVA)</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='tehdit'){
    return '<h2 class="panelBaslik">🛡️ SİBER TEHDİT · IOC AKIŞI · KAYNAK KÜTÜPHANESİ</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='ayarlar'){
    return '<h2 class="panelBaslik">⚙️ AYARLAR · MOD SETLERİ · TEŞHİS · KAYNAK SAĞLIĞI</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='bolgem'){
    return '<h2 class="panelBaslik">🏠 BÖLGEM · GAZİANTEP & TÜRKİYE</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='zeka'){
    return '<h2 class="panelBaslik">🧠 ZEKÂ · ANORMALLİK · SKOR · SENARYO</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='guvenlik'){
    return '<h2 class="panelBaslik">🛡 GÜVENLİK · KASA · YEDEK · TESTLER</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  if(id==='disari'){
    return '<h2 class="panelBaslik">🌐 DIŞARI · RADYO · HUE · ÇIKTILAR</h2>'+kap('<div class="soluk">yükleniyor…</div>');
  }
  return null;
}
function ozelPanelYukle(id, zorla){
  if(id==='uzay') uzayPanel(zorla);
  else if(id==='afet') afetPanel(zorla);
  else if(id==='deniz') denizPanel(zorla);
  else if(id==='hava') havaPanel(zorla);
  else if(id==='saglik') saglikPanel();
  else if(id==='uyari') uyariPanel(zorla);
  else if(id==='tehdit'){ if(typeof tehditPanel==='function') tehditPanel(zorla); }
  else if(id==='ayarlar'){ if(typeof ayarlarPanel==='function') ayarlarPanel(); }
  else if(id==='bolgem'){ if(typeof bolgemPanelYukle==='function') bolgemPanelYukle(); }
  else if(id==='zeka'){ if(typeof zekaPanel==='function') zekaPanel(); }
  else if(id==='guvenlik'){ if(typeof guvenlikPanel==='function') guvenlikPanel(); }
  else if(id==='disari'){ if(typeof disariPanel==='function') disariPanel(); }
}
function panelHazir(id){
  durum(id, 'veri çekiliyor…');
  if($('sonuc_'+id) && $('sonuc_'+id).innerHTML.indexOf('yükleniyor')>=0) $('sonuc_'+id).innerHTML='<div class="soluk">veri çekiliyor…</div>';
}
function uzayPanel(zorla){
  panelHazir('uzay');
  var isler=[];
  if(!CANLI_HAM.uzay || zorla) isler.push(uzayHavasiYukle());
  if(!CANLI.aurora || !CANLI.aurora.length || zorla) isler.push(auroraYukle());
  if(!CANLI_HAM.uyducSay || zorla) isler.push(uyducYukle());
  if(!CANLI_HAM.starlinkSay || zorla) isler.push(starlinkYukle());
  if(!CANLI_HAM.gunesLeke || zorla) isler.push(gunesLekeYukle());
  Promise.all(isler).then(function(){ uzayPanelYaz(); });
}
function uzayPanelYaz(){
  var o=CANLI_HAM.uzay||{}, h='';
  var kp=o.kp, kpRenk = kp==null?'#94a3b8':(kp>=7?'#ff3b3b':(kp>=5?'#f97316':(kp>=4?'#facc15':'#22c55e')));
  var kpAcik = kp==null?'-':(kp>=7?'G4-G5 ŞİDDETLİ FIRTINA':(kp>=5?'G1-G3 FIRTINA':(kp>=4?'AKTİF':'SAKİN')));
  h+='<div class="kartListe"><div class="haberSatir"><div class="kaynak">JEOMANYETİK AKTİVİTE (Kp)</div>'
   +'<div class="baslik" style="font-size:22px;color:'+kpRenk+'">'+(kp==null?'-':kp)+' <span style="font-size:12px">'+esc(kpAcik)+'</span></div>'
   +'<div class="tarih">'+(o.kpZaman?esc(o.kpZaman):'veri yok')+'</div></div>';
  h+='<div class="haberSatir"><div class="kaynak">GÜNEŞ RÜZGÂRI</div><div class="baslik">'
   +(o.ruzgarHiz!=null?Math.round(o.ruzgarHiz)+' km/sa':'veri yok')
   +(o.ruzgarYogunluk!=null?' · yoğunluk '+Number(o.ruzgarYogunluk).toFixed(1)+' p/cm³':'')+'</div>'
   +'<div class="tarih">'+(o.bz!=null?'Bz '+Number(o.bz).toFixed(1)+' nT':'')+(o.bt!=null?' · Bt '+Number(o.bt).toFixed(1)+' nT':'')+'</div></div>';
  h+='<div class="haberSatir"><div class="kaynak">GÜNEŞ PARLAMASI (X-ışını)</div><div class="baslik">'
   +(o.xraySinif?esc(o.xraySinif):'veri yok')+'</div><div class="tarih">'+(o.xrayZaman?esc(o.xrayZaman):'')+'</div></div>';
  h+='<div class="haberSatir"><div class="kaynak">CANLI UYDU YÖRÜNGESİ</div><div class="baslik">'
   +(CANLI_HAM.uyducSay||0)+' uydu (ISS/Tiangong/GPS/bilim) · '+(CANLI_HAM.starlinkSay||0)+' Starlink</div>'
   +'<div class="tarih">küre üzerinde gerçek yörüngede hareket eder</div></div>';
  h+='<div class="haberSatir"><div class="kaynak">KUTUP IŞIĞI (AURORA)</div><div class="baslik">'
   +((CANLI.aurora&&CANLI.aurora.length)?CANLI.aurora.length+' olasılık noktası':'veri yok')+'</div>'
   +'<div class="tarih">küre üzerinde kutup halkaları · eşik %26 olasılık</div></div></div>';
  var gl=CANLI_HAM.gunesLeke||[];
  if(gl.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">GÜNEŞ LEKELERİ / AKTİF BÖLGELER (NOAA SWPC)</h3>';
    h+=tablo(['Bölge','Leke sayısı','Manyetik sınıf','Enlem','Alan'], gl.map(function(g){
      return ['AR'+g.bolge, g.leke, g.sinif||'-', g.enlem!=null?Number(g.enlem).toFixed(0)+'°':'-', g.alan!=null?Number(g.alan).toFixed(0):'-']; }));
  }
  /* uydu geçiş tahmini (yerel hesap, anahtarsız) */
  var gecisler=[];
  try{
    var hedefler=[['Gaziantep',37.07,37.38],['İstanbul',41.01,28.98]];
    for(var hi=0;hi<hedefler.length;hi++){
      var gg=uyduGecis(hedefler[hi][1], hedefler[hi][2], 'ISS', 24);
      if(gg && gg.gecisler && gg.gecisler.length){
        for(var gi=0;gi<gg.gecisler.length;gi++){
          var gc=gg.gecisler[gi];
          gecisler.push([hedefler[hi][0], gc.bas.toLocaleString('tr-TR'), Math.round((gc.bit-gc.bas)/60000)+' dk', gc.max.toFixed(0)+'°']);
        }
      }
    }
  }catch(e){}
  if(gecisler.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ISS GEÇİŞLERİ — önümüzdeki 24 saat (yerel hesap)</h3>';
    h+=tablo(['Şehir','Başlangıç','Süre','En yüksek açı'], gecisler);
    h+='<div class="uyari">Geçişler TLE yörünge verisinden <b>kendi bilgisayarında</b> hesaplanır (satellite.js) — internet/anahtar gerekmez. '
      +'En yüksek açı 30° üzerindeyse gözle görünür; gündüz saatlerinde gökyüzü aydınlık olduğu için izlenemez.</div>';
  }
  h+=tablo(['Ölçü','Açıklama'],[
    ['Kp 5+','Jeomanyetik fırtına: kutup ışıkları orta enlemlere iner, GPS/HF bozulur'],
    ['Kp 7+','Şiddetli fırtına: uydu ve elektrik şebekesi riski'],
    ['Bz negatif (-)','Güneş rüzgârı manyetosfere giriyor demektir: fırtına habercisi'],
    ['M/X sınıfı parlama','Radyo karartması ve aurora olasılığı artar']
  ]);
  h+='<div class="uyari">Kaynaklar: NOAA SWPC (OVATION aurora · Kp indeksi · GOES X-ışını) · CelesTrak TLE + satellite.js ile yörünge hesabı. Hepsi anahtarsız ve canlıdır.</div>';
  $('sonuc_uzay').innerHTML=h;
  durum('uzay','✔ uzay havası · aurora · '+(CANLI_HAM.uyducSay||0)+' uydu');
}
function afetPanel(zorla){
  panelHazir('afet');
  var isler=[];
  if(!CANLI_HAM.gdacs || zorla) isler.push(gdacsYukle());
  if(!CANLI_HAM.kasirga || zorla) isler.push(kasirgaYukle());
  if(!CANLI_HAM.nhc || zorla) isler.push(nhcYukle());
  if(!CANLI_HAM.volkan || zorla) isler.push(volkanUyarilariYukle());
  Promise.all(isler).then(function(){ afetPanelYaz(); });
}
function afetPanelYaz(){
  var h='';
  var gd=CANLI_HAM.gdacs||[];
  var renkli=[];
  for(var i=0;i<gd.length;i++){
    var g=gd[i], r=GDACS_RENK[g.seviye]||'#22c55e';
    renkli.push('<div class="depremSatir"><span class="magRozet" style="background:'+r+';color:#000">'+esc(g.seviye.slice(0,1))+'</span>'
      +'<div><div class="yer">'+esc(g.tur)+' · '+esc(g.ulke)+'</div><div class="zaman">'+esc(String(g.tarih||'').replace('T',' ').slice(0,16))
      +'</div></div>'+(g.url?'<a class="buton kucuk" target="_blank" rel="noopener" href="'+esc(g.url)+'">RAPOR</a>':'')+'</div>');
  }
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:0 0 8px">GDACS AÇIK OLAYLAR ('+gd.length+')</h3>';
  h+= renkli.length? '<div class="kartListe">'+renkli.slice(0,40).join('')+'</div>' : '<div class="uyari">Açık olay yok.</div>';
  var tc=CANLI_HAM.kasirga||[];
  if(tc.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">TROPİKAL SİKLONLAR ('+tc.length+')</h3>';
    h+=tablo(['Siklon','Ülke','Seviye','Rüzgâr','Tarih'], tc.map(function(x){ return [x.ad,x.ulke,x.seviye,x.ruzgar,String(x.tarih||'').slice(0,10)]; }));
  }
  var nh=CANLI_HAM.nhc||[];
  if(nh.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">NHC AKTİF FIRTINALAR ('+nh.length+')</h3>';
    h+=tablo(['Fırtına','Sınıf','Rüzgâr (kn)','Basınç','Konum'], nh.map(function(x){ return [x.ad,x.tur,x.ruzgar,x.basinc,x.konum]; }));
  }
  var vk=(CANLI_HAM.volkan||[]).filter(function(v){ return v.seviye && v.seviye!=='NORMAL'; });
  var vkTum=CANLI_HAM.volkan||[];
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">VOLKAN UYARI SEVİYELERİ (USGS · '+vkTum.length+' izleniyor)</h3>';
  h+= vk.length? tablo(['Volkan','Seviye','Renk kodu','Gözlemevi'], vk.map(function(v){ return [v.ad,v.seviye,v.renk,v.gozlemevi]; }))
    : '<div class="uyari">Şu an NORMAL dışında uyarı seviyesi yok ('+vkTum.length+' volkan izleniyor).</div>';
  h+='<div class="uyari">Kaynaklar: GDACS (JRC/AB) · NOAA NHC · USGS HANS. Hepsi koordinatlı canlı veri. GDACS seviyeleri: <span style="color:#22c55e">Yeşil</span> · <span style="color:#f97316">Turuncu</span> · <span style="color:#ff3b3b">Kırmızı</span>.</div>';
  $('sonuc_afet').innerHTML=h;
  durum('afet','✔ '+gd.length+' afet · '+tc.length+' siklon · '+vkTum.length+' volkan');
}
function denizPanel(zorla){
  panelHazir('deniz');
  var isler=[];
  if(!CANLI_HAM.dalga || zorla) isler.push(dalgaYukle());
  if(!CANLI_HAM.gemi || zorla) isler.push(gemiYukle());
  Promise.all(isler).then(function(){
    var h='';
    var dm=CANLI_HAM.dalga||[];
    dm.sort(function(a,b){ return (b.dalga||0)-(a.dalga||0); });
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:0 0 8px">DALGA · DENİZ SEVİYESİ · SU SICAKLIĞI (Open-Meteo Marine · canlı)</h3>';
    h+= dm.length? tablo(['Deniz / bölge','Dalga (m)','Periyot (s)','Su sıcaklığı (°C)','Deniz seviyesi (m)'],
      dm.slice(0,30).map(function(x){ return [x.ad, x.dalga!=null?x.dalga.toFixed(1):'-', x.periyot!=null?x.periyot.toFixed(0):'-',
        x.su!=null?x.su.toFixed(1):'-', x.seviye!=null?x.seviye.toFixed(2):'-']; }))
      : '<div class="uyari">Dalga verisi alınamadı.</div>';
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">GEMİ TRAFİĞİ (Digitraffic AIS · canlı)</h3>';
    h+='<div class="uyari">Küre üzerinde <b>'+(CANLI_HAM.gemi||0)+'</b> gemi ⛴ simgesiyle canlı hareket eder (seyir yönüne göre döner). '
      +'Ad ve sefer hedefi kaydı: <b>'+(CANLI_HAM.gemiAd||0)+'</b> gemi (Digitraffic gemi sicili). '
      +'Digitraffic, Finlandiya/Baltık bölgesinin resmî ve anahtarsız AIS servisidir — dünya geneli AIS için API anahtarı (AISStream/MarineTraffic) gerekir.</div>';
    h+='<div class="uyari">Dünya geneli canlı radar: <a target="_blank" rel="noopener" href="https://www.marinetraffic.com/">MarineTraffic</a> · <a target="_blank" rel="noopener" href="https://www.vesselfinder.com/">VesselFinder</a></div>';
    $('sonuc_deniz').innerHTML=h;
    durum('deniz','✔ '+dm.length+' deniz noktası · '+(CANLI_HAM.gemi||0)+' gemi');
  });
}
function havaPanel(zorla){
  panelHazir('hava');
  var isler=[];
  if(!CANLI_HAM.hava || zorla) isler.push(havaYukle());
  if(!CANLI_HAM.havakalite || zorla) isler.push(havaKaliteYukle());
  if(!CANLI_HAM.dalga || zorla) isler.push(dalgaYukle());
  if(!CANLI_HAM.yagis || zorla) isler.push(tahminYukle());
  Promise.all(isler).then(function(){
    var hv=CANLI_HAM.hava||[], hk=CANLI_HAM.havakalite||[], yg=CANLI_HAM.yagis||[];
    var h='';
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:0 0 8px">CANLI HAVA DURUMU ('+hv.length+' şehir · Open-Meteo)</h3>';
    h+= hv.length? tablo(['Şehir','Sıcaklık','Rüzgâr','Yön'],
      hv.map(function(x){ return [x.ad, x.sicaklik!=null?Math.round(x.sicaklik)+' °C':'-',
        x.ruzgar!=null?Math.round(x.ruzgar)+' km/sa':'-', x.yon!=null?Math.round(x.yon)+'°':'-']; })) : '<div class="uyari">Hava verisi alınamadı.</div>';
    if(hk.length){
      hk.sort(function(a,b){ return (b.pm25||0)-(a.pm25||0); });
      h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">HAVA KALİTESİ — PM2.5 (en kirli 15)</h3>';
      h+=tablo(['Şehir','PM2.5 µg/m³','PM10','Ozon'], hk.slice(0,15).map(function(x){
        return [x.ad, x.pm25!=null?x.pm25.toFixed(0):'-', x.pm10!=null?x.pm10.toFixed(0):'-', x.ozon!=null?x.ozon.toFixed(0):'-']; }));
    }
    if(yg.length){
      var ygSirali=yg.slice().sort(function(a,b){ return (b.toplam||0)-(a.toplam||0); });
      h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ÖNÜMÜZDEKİ 24 SAAT YAĞIŞ TAHMİNİ (en çok yağış alacak 15 şehir)</h3>';
      h+=tablo(['Şehir','Toplam yağış (mm)','En yüksek olasılık (%)'],
        ygSirali.slice(0,15).map(function(x){ return [x.ad, x.toplam!=null?x.toplam.toFixed(1):'-', x.olasilik!=null?x.olasilik:'-']; }));
    }
    var wz=(CANLI_YOL.ruzgar||[]).length;
    h+='<div class="uyari">Küre üzerinde <b>'+wz+'</b> rüzgâr oku (15° ızgara) ve şehir sıcaklıkları canlı gösterilir; '
      +'<b>'+(yg.length)+'</b> şehir için 24 saatlik yağış tahmini de küreye nokta olarak çizilir. '
      +'Ölçek: <span style="color:#22c55e">≤15°C</span> · <span style="color:#facc15">15-25°C</span> · <span style="color:#f97316">25-35°C</span> · <span style="color:#ff3b3b">35°C+</span>. '
      +'PM2.5: 12 altı iyi · 35 altı orta · 55 altı kötü · üstü sağlıksız (WHO).</div>';
    $('sonuc_hava').innerHTML=h;
    durum('hava','✔ '+hv.length+' şehir · '+hk.length+' hava kalitesi');
  });
}
function saglikPanel(){
  panelHazir('saglik');
  Promise.all([
    xmlCek('https://www.who.int/rss-feeds/news-english.xml', 25000).then(function(d){ return rssOku(d,'WHO'); }).catch(function(){ return []; }),
    fetchJSON('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent('https://feeds.bbci.co.uk/news/health/rss.xml'), 20000)
      .then(function(d){ return (d&&d.items)? d.items.map(function(i){ return {kaynak:'BBC Sağlık', baslik:i.title, link:i.link, tarih:i.pubDate}; }) : []; }).catch(function(){ return []; })
  ]).then(function(rs){
    var items=[].concat(rs[0]||[], rs[1]||[]);
    items.sort(function(a,b){ return (Date.parse(b.tarih)||0)-(Date.parse(a.tarih)||0); });
    var h='<div class="kartListe">';
    for(var i=0;i<Math.min(items.length,35);i++){
      var it=items[i], t=Date.parse(it.tarih)? new Date(it.tarih).toLocaleString('tr-TR'):'';
      h+='<a class="haberSatir" style="text-decoration:none" target="_blank" rel="noopener" href="'+esc(it.link)+'">'
       +'<div class="kaynak">'+esc(it.kaynak)+'</div><div class="baslik">'+esc(it.baslik)+'</div><div class="tarih">'+esc(t)+'</div></a>';
    }
    h+='</div>';
    if(!items.length) h='<div class="uyari">Sağlık akışı alınamadı (WHO RSS erişilemedi).</div>';
    h+='<div class="uyari">Kaynak: WHO haber akışı (doğrudan RSS, CORS açık) · BBC Sağlık (rss2json). '
     +'Salgın takibi için ek bağlantılar: <a target="_blank" rel="noopener" href="https://www.who.int/emergencies/disease-outbreak-news">WHO Salgın Bülteni</a> · '
     +'<a target="_blank" rel="noopener" href="https://promedmail.org/">ProMED</a> · <a target="_blank" rel="noopener" href="https://www.ecdc.europa.eu/en">ECDC</a></div>';
    $('sonuc_saglik').innerHTML=h;
    durum('saglik','✔ '+items.length+' sağlık haberi');
  });
}
function rssOku(d, kaynak){
  var out=[];
  try{
    var dug=d.querySelectorAll('item').length? d.querySelectorAll('item') : d.querySelectorAll('entry');
    for(var i=0;i<Math.min(dug.length,40);i++){
      var dg=dug[i];
      var t=dg.querySelector('title'), l=dg.querySelector('link'), p=dg.querySelector('pubDate')||dg.querySelector('updated')||dg.querySelector('published');
      out.push({kaynak:kaynak, baslik:t?t.textContent:'', link: l? (l.textContent||l.getAttribute('href')||'') : '', tarih: p?p.textContent:''});
    }
  }catch(e){}
  return out;
}
function uyariPanel(zorla){
  panelHazir('uyari');
  Promise.all([
    (zorla||!CANLI_HAM.uyari)? uyariYukle() : null,
    tsunamiBul().then(function(l){ CANLI_HAM.tsunamiBul=l; return l; }).catch(function(){ return []; })
  ]).then(function(){
    var u=CANLI_HAM.uyari||[], h='';
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:0 0 8px">AKTİF RESMÎ UYARILAR (api.weather.gov · ABD kapsamı)</h3>';
    var ts=u.filter(function(x){return x.tur==='Tsunami';});
    h+='<p>Aktif tsunami uyarısı: <b>'+(ts.length?ts.length+' ADET':'yok')+'</b></p>';
    if(ts.length) h+=tablo(['Uyarı','Bölge','Başlangıç','Bitiş'], ts.map(function(x){ return [x.ad,x.alan,String(x.baslangic).slice(0,16),String(x.bitti).slice(0,16)]; }));
    var sv=u.filter(function(x){return x.tur!=='Tsunami';}).slice(0,30);
    if(sv.length){
      h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ŞİDDETLİ HAVA UYARILARI ('+sv.length+')</h3>';
      h+=tablo(['Olay','Bölge','Seviye'], sv.map(function(x){ return [x.ad,String(x.alan).slice(0,60),x.siddet]; }));
    }
    var tb=CANLI_HAM.tsunamiBul||[];
    if(tb.length){
      h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">KÜRESEL TSUNAMİ BÜLTENLERİ (NOAA)</h3>';
      h+='<div class="kartListe">'+tb.slice(0,20).map(function(t){ return '<div class="haberSatir"><div class="baslik">'+esc(t)+'</div></div>'; }).join('')+'</div>';
    }
    h+='<div class="uyari">Dürüst sınır: küresel tsunami/uyarı merkezleri (tsunami.gov, GDACS uyarıları) tarayıcıdan doğrudan çekilemiyor (CORS kapalı). '
     +'Bu yüzden canlı uyarılar <b>api.weather.gov</b> (ABD resmî uyarı sistemi, CORS açık) üzerinden gelir; küresel bülten başlıkları proxy ile listelenir. '
     +'Resmî sayfalar: <a target="_blank" rel="noopener" href="https://www.tsunami.gov/">tsunami.gov</a> · '
     +'<a target="_blank" rel="noopener" href="https://www.gdacs.org/">GDACS</a></div>';
    $('sonuc_uyari').innerHTML=h;
    durum('uyari','✔ '+u.length+' uyarı · '+tb.length+' bülten');
  });
}

/* ============================================================
   13) ZAMANLAYICI + KATMAN ANAHTARI
   ============================================================ */
var ZAMAN_PLANI=[
  {id:'gdacs',     ms:15*60000, fn:gdacsYukle},
  {id:'kasirga',   ms:15*60000, fn:kasirgaYukle},
  {id:'aurora',    ms:5*60000,  fn:auroraYukle},
  {id:'hava',      ms:10*60000, fn:havaYukle},
  {id:'havakalite',ms:20*60000, fn:havaKaliteYukle},
  {id:'yagis',     ms:30*60000, fn:tahminYukle},
  {id:'dalga',     ms:30*60000, fn:dalgaYukle},
  {id:'ruzgar',    ms:20*60000, fn:ruzgarYukle},
  {id:'gemi',      ms:60000,    fn:gemiYukle},
  {id:'askeriucak',ms:30000,    fn:askeriUcakYukle},
  {id:'uyduc',     ms:3000,     fn:uyducYukle},
  {id:'starlink',  ms:5000,     fn:starlinkYukle},
  {id:'tsunami',   ms:10*60000, fn:uyariYukle},
  {id:'gunesLeke', ms:30*60000, fn:gunesLekeYukle}
];
function katmanDegisti(id, acik){
  var htmlKatman = (id==='gemi' || id==='askeriucak');
  if(htmlKatman){ if(!acik){ HTML_VERI[id]=[]; } htmlYenile(); }
  var plan=null;
  for(var i=0;i<ZAMAN_PLANI.length;i++){ if(ZAMAN_PLANI[i].id===id){ plan=ZAMAN_PLANI[i]; break; } }
  if(id==='ucak'){ if(acik){ ucusBaslat(); } else { if(UCUS_TICK){ clearInterval(UCUS_TICK); UCUS_TICK=null; } HTML_VERI.ucak=[]; htmlYenile(); } kureCiz(); return; }
  if(plan){
    if(acik){ calistir(plan, true); } else { if(CANLI_TICK[id]){ clearInterval(CANLI_TICK[id]); CANLI_TICK[id]=null; } }
  }
  if(id==='termin'){ /* hesaplanır, ek iş yok */ }
  kureCiz(); karolarKur();
}
function calistir(plan, hemen){
  if(CANLI_TICK[plan.id]) clearInterval(CANLI_TICK[plan.id]);
  function tik(){ if(!KATMAN[plan.id]) return; plan.fn().then(function(msg){ if(msg) logDurum('✔ '+msg); kureCiz(); }).catch(function(){}); }
  if(hemen) tik();
  CANLI_TICK[plan.id]=setInterval(tik, plan.ms);
}
function canliHepsiBaslat(){
  karoGeriYukle();
  for(var i=0;i<ZAMAN_PLANI.length;i++){
    if(KATMAN[ZAMAN_PLANI[i].id]) calistir(ZAMAN_PLANI[i], true);
  }
  /* veri importları her durumda bir kez (paneller için) */
  setTimeout(function(){ if(!CANLI_HAM.uzay) uzayHavasiYukle(); }, 4000);
  setTimeout(function(){ if(!CANLI_HAM.volkan) volkanUyarilariYukle(); }, 6000);
}
/* katmanlar.js index.html'in satır içi betiğinden SONRA yüklenir:
   bu yüzden başlatmayı kendimiz tetikliyoruz. */
(function(){
  function basla(){ setTimeout(function(){ try{ canliHepsiBaslat(); }catch(e){} }, 2200); }
  if(document.readyState==='complete' || document.readyState==='interactive') basla();
  else window.addEventListener('load', basla);
})();
