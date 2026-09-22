/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — YENİ KATMANLAR (v5.1)
   A grubu: deprem uyarı seviyesi, yoğunluk haritaları, aurora çizgisi,
            uzay çöpü, ateş topu, deniz platformları, gaz sahaları,
            havalimanları, Gaziantep yakınlık katmanı, fay hatları
   Siber   : Feodo C2, fidye yazılımı kurbanları, Tor röleleri,
            saldırı kaynakları, NVD CVE, Exploit-DB
   ek-veri.js + katmanlar.js'ten SONRA yüklenir.
   ============================================================ */

var GZ_LAT=37.07, GZ_LNG=37.38;     /* Gaziantep */
var YAKINLIK_KM=1000;

function mesafeKm(la1, lo1, la2, lo2){
  var R=6371, d2r=Math.PI/180;
  var dla=(la2-la1)*d2r, dlo=(lo2-lo1)*d2r;
  var a=Math.sin(dla/2)*Math.sin(dla/2)+Math.cos(la1*d2r)*Math.cos(la2*d2r)*Math.sin(dlo/2)*Math.sin(dlo/2);
  return 2*R*Math.asin(Math.min(1, Math.sqrt(a)));
}
/* ---------- IP konumlandırma (HTTPS + CORS açık servisler · anahtarsız) ----------
   1) get.geojs.io  → toplu (virgülle 50'lik kümeler)
   2) ipwho.is      → tek tek yedek
   3) ip-api.com    → yalnızca http:// modunda (karışık içerik nedeniyle file://'de engelli)
   Dönüş biçimi tüm katmanların beklediği {status,query,country,city,lat,lon,isp} ve
   GİRDİ SIRASI korunur (boş kalan yer null olur). */
function ipKonumlandir(liste){
  if(!liste || !liste.length) return Promise.resolve([]);
  var parca=liste.slice(0,100);

  function normalize(x){
    if(!x) return null;
    var la=parseFloat(x.latitude!=null? x.latitude : x.lat);
    var lo=parseFloat(x.longitude!=null? x.longitude : x.lon);
    if(isNaN(la)||isNaN(lo)) return null;
    return {status:'success', query:x.ip||x.query, country:x.country||x.country_code||'',
      city:x.city||x.organization_name||'', lat:la, lon:lo,
      isp:x.organization_name||x.organization||''};
  }
  function sirala(kayitlar){
    var harita={};
    for(var i=0;i<kayitlar.length;i++){ var k=normalize(kayitlar[i]); if(k && k.query) harita[k.query]=k; }
    var out=[];
    for(var j=0;j<parca.length;j++) out.push(harita[parca[j]]||null);
    return out;
  }
  function geojs(){
    var kumeler=[], boy=50;
    for(var i=0;i<parca.length;i+=boy) kumeler.push(parca.slice(i,i+boy));
    return Promise.all(kumeler.map(function(kume){
      return fetch('https://get.geojs.io/v1/ip/geo.json?ip='+kume.join(','), {headers:{'Accept':'application/json'}})
        .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(function(d){ return Array.isArray(d)? d : [d]; })
        .catch(function(){ return []; });
    })).then(function(listeler){
      var hepsi=[];
      for(var j=0;j<listeler.length;j++) hepsi=hepsi.concat(listeler[j]);
      return sirala(hepsi);
    });
  }
  function ipwho(){
    var ilk=parca.slice(0,12), isler=[];
    for(var i=0;i<ilk.length;i++){
      isler.push(fetch('https://ipwho.is/'+ilk[i], {headers:{'Accept':'application/json'}})
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(!d || d.success===false) return null;
          return {ip:ilk[i], country:d.country||'', city:d.city||'', latitude:d.latitude, longitude:d.longitude,
            organization_name:(d.connection&&(d.connection.isp||d.connection.org))||''};
        }).catch(function(){ return null; }));
    }
    return Promise.all(isler).then(function(l){
      var doldu=sirala(l.filter(function(x){ return x; }));
      return doldu;
    });
  }
  return geojs().then(function(l){
    var dolu=0; for(var i=0;i<l.length;i++) if(l[i]) dolu++;
    if(dolu>=Math.min(3, parca.length)) return l;
    return ipwho().then(function(l2){
      var dolu2=0; for(var j=0;j<l2.length;j++) if(l2[j]) dolu2++;
      if(dolu2) return l2;
      if(location.protocol==='file:') return l;
      return fetch('http://ip-api.com/batch?fields=status,country,city,lat,lon,query,as,isp',
        {method:'POST', headers:{'Content-Type':'application/json'},
         body:JSON.stringify(parca.map(function(ip){ return {query:ip}; }))})
        .then(function(r){ return r.json(); }).then(function(d){ return sirala(d||[]); }).catch(function(){ return l; });
    });
  });
}

/* ================= CANLI KATMANLAR ================= */
/* 1) DEPREM UYARI SEVİYESİ (USGS PAGER + tsunami bayrağı) */
function depremUyariYukle(){
  return fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', 30000).then(function(d){
    var nok=[], ham=[];
    var renkler={green:'#22c55e',yellow:'#facc15',orange:'#f97316',red:'#ff3b3b'};
    if(!d || !d.features) return null;
    for(var i=0;i<d.features.length;i++){
      var f=d.features[i], p=f.properties||{}, g=f.geometry;
      if(!g||!g.coordinates) continue;
      var uyari=(p.alert||'').toLowerCase(), ts=(p.tsunami===1);
      if(!uyari && !ts && !(p.felt>0)) continue;
      var renk = ts? '#06b6d4' : (renkler[uyari]||'#eab308');
      nok.push({lat:g.coordinates[1], lng:g.coordinates[0], renk:renk, cap:(uyari==='red'?0.95:(uyari==='orange'?0.8:0.65)),
        yuk:0.022, tur:'depremuyari',
        ad:'⚠ M'+p.mag+' · '+(p.place||'')+(uyari?' · PAGER: '+uyari.toUpperCase():'')+(ts?' · TSUNAMİ UYARISI':'')+(p.felt?' · hisseden: '+p.felt:'')});
      ham.push({yer:p.place||'', mag:p.mag, uyari:uyari||'-', tsunami:ts?'VAR':'yok', hisseden:p.felt||0, zaman:new Date(p.time).toLocaleString('tr-TR')});
    }
    CANLI.depremuyari=nok; CANLI_HAM.depremuyari=ham; CANLI_SAAT.depremuyari=simdi();
    return nok.length+' uyarı seviyeli deprem';
  });
}
/* 2) UÇAK / GEMİ YOĞUNLUK HARİTASI (mevcut veriden) */
function yogunlukNoktalari(kaynak, tur, ad, renk, hucreBoy){
  var hucre={}, boy=hucreBoy||4;
  for(var i=0;i<kaynak.length;i++){
    var d=kaynak[i]; if(d.lat==null||d.lng==null) continue;
    var k=Math.round(d.lat/boy)+'|'+Math.round(d.lng/boy);
    if(!hucre[k]) hucre[k]={la:0, lo:0, n:0};
    hucre[k].la+=d.lat; hucre[k].lo+=d.lng; hucre[k].n++;
  }
  var out=[];
  for(var kk in hucre){
    var h=hucre[kk]; if(h.n<2) continue;
    out.push({lat:h.la/h.n, lng:h.lo/h.n, renk:renk, cap:Math.min(1.1, 0.22+h.n*0.1), yuk:0.018, tur:tur,
      ad:'📊 '+ad+' · '+h.n+' araç yoğunluğu'});
  }
  return out;
}
/* 3) AURORA GÖRÜNÜRLÜK ÇİZGİSİ (Kp indeksinden hesaplanır) */
function auroraCizgiYollar(){
  var kp=(CANLI_HAM.uzay||{}).kp; if(kp==null) kp=2;
  var enlem=Math.max(40, 67 - 2.2*kp);           /* ekvatora bakan sınır */
  var kuzey=[], guney=[];
  for(var lo=-180; lo<=180; lo+=4){
    kuzey.push([enlem, lo]); guney.push([-enlem, lo]);
  }
  return [
    {pts:kuzey, ad:'Aurora görünürlük sınırı (kuzey) · Kp '+kp+' → '+enlem.toFixed(0)+'° enlemi', renk:'#22d3ee', tur:'auroracizgi'},
    {pts:guney, ad:'Aurora görünürlük sınırı (güney) · Kp '+kp+' → '+enlem.toFixed(0)+'° enlemi', renk:'#22d3ee', tur:'auroracizgi'}
  ];
}
/* 4) UZAY ÇÖPÜ (CelesTrak enkaz grupları) */
var COP_GRUPLARI=['cosmos-1408-debris','fengyun-1c-debris','iridium-33-debris','cosmos-2251-debris','cosmos-2251-debris'];
function uzayCopuYukle(){
  if(typeof satellite==='undefined') return Promise.resolve(null);
  return Promise.all(COP_GRUPLARI.slice(0,4).map(function(g){ return tleCek(g).catch(function(){ return []; }); }))
  .then(function(rs){
    var tum=[]; for(var i=0;i<rs.length;i++) tum=tum.concat(rs[i]||[]);
    if(!tum.length){ STARLINK_GECIKME=Date.now()+5*60000; return null; }
    var atla=Math.max(1, Math.floor(tum.length/250)), nok=[];
    for(var j=0;j<tum.length;j+=atla){
      var k=uyduKonum(tum[j]); if(!k) continue;
      nok.push({lat:k.lat, lng:k.lng, renk:'#94a3b8', cap:0.28, yuk:Math.max(0.02,Math.min(0.11,k.h)), tur:'uzaycopu',
        ad:'🛰 Uzay çöpü · '+tum[j].ad});
    }
    CANLI.uzaycopu=nok; CANLI_HAM.uzaycopuSay=nok.length; CANLI_SAAT.uzaycopu=simdi();
    return nok.length+' enkaz parçası';
  });
}
/* 5) ATEŞ TOPU / METEOR (NASA CNEOS) */
function meteorYukle(){
  return jinaJSON('https://ssd-api.jpl.nasa.gov/fireball.api?limit=25', 35000).then(function(d){
    if(!d || !d.data) return null;
    var alan=d.fields||[], nok=[], ham=[];
    function idx(a){ return alan.indexOf(a); }
    for(var i=0;i<d.data.length;i++){
      var s=d.data[i];
      var lat=parseFloat(s[idx('lat')]), lon=parseFloat(s[idx('lon')]);
      if(isNaN(lat)||isNaN(lon)) continue;
      if(String(s[idx('lat-dir')]||'N').toUpperCase()==='S') lat=-Math.abs(lat);
      if(String(s[idx('lon-dir')]||'E').toUpperCase()==='W') lon=-Math.abs(lon);
      var en=parseFloat(s[idx('energy')]||'0');
      nok.push({lat:lat, lng:lon, renk:'#fde68a', cap:Math.min(1, 0.4+en/60), yuk:0.03, tur:'meteor',
        ad:'☄ Ateş topu · '+s[idx('date')]+' · enerji '+en+' ×10¹⁰ J · yükseklik '+s[idx('alt')]+' km'});
      ham.push({tarih:s[idx('date')], enerji:en, lat:lat, lon:lon, alt:s[idx('alt')], hiz:s[idx('vel')]});
    }
    CANLI.meteor=nok; CANLI_HAM.meteor=ham; CANLI_SAAT.meteor=simdi();
    return nok.length+' ateş topu kaydı';
  });
}
/* 6) BOTNET C2 SUNUCULARI (Feodo Tracker + ip-api) */
function feodoKonumYaz(kayit, kaynakAdi){
  return ipKonumlandir(kayit.map(function(x){ return x.ip; })).then(function(geo){
    var nok=[], ham=[];
    for(var j=0;j<geo.length;j++){
      var g=geo[j]; if(!g || g.status!=='success' || g.lat==null) continue;
      var m=(kayit[j] && kayit[j].malware) || '-';
      var dr=(kayit[j] && kayit[j].durum) || '';
      nok.push({lat:g.lat, lng:g.lon, renk:(dr && dr.toLowerCase()==='online'?'#f43f5e':'#9f1239'), cap:0.55, yuk:0.02, tur:'feodo',
        ad:'☠ Kötü şöhretli IP · '+g.query+' · '+(g.country||'')+(m&&m!=='-'?' · zararlı: '+m:'')+(dr?' · '+dr:'')+' · kaynak: '+kaynakAdi});
      ham.push({ip:g.query, ulke:g.country||'', kota:g.city||'', iss:g.isp||'', malware:m, durum:dr, kaynak:kaynakAdi});
    }
    CANLI.feodo=nok; CANLI_HAM.feodo=ham; CANLI_HAM.feodoKaynak=kaynakAdi; CANLI_SAAT.feodo=simdi();
    return nok.length+' kötü şöhretli IP konumlandırıldı ('+kaynakAdi+')';
  });
}
function cinssYukle(){
  return jinaMetin('http://cinsscore.com/list/ci-badguys.txt', 45000).then(function(t){
    var ipler=String(t).split(/\r?\n/).map(function(x){ return x.trim(); })
      .filter(function(x){ return /^\d{1,3}(\.\d{1,3}){3}$/.test(x); });
    if(!ipler.length) throw new Error('CINS listesi boş');
    var sec=[], atla=Math.max(1, Math.floor(ipler.length/70));
    for(var i=0;i<ipler.length && sec.length<70;i+=atla) sec.push({ip:ipler[i], malware:'-', durum:''});
    return feodoKonumYaz(sec, 'CINS Army');
  });
}
function feodoYukle(){
  /* 1) abuse.ch halka açık C2 listesi (şu an büyük ölçüde kısıtlanmış) */
  return jinaMetin('https://feodotracker.abuse.ch/downloads/ipblocklist.csv', 40000).then(function(t){
    var satirlar=String(t).split(/\r?\n/), kayit=[];
    for(var i=0;i<satirlar.length;i++){
      var s=satirlar[i].trim();
      if(!s || s.charAt(0)==='#') continue;
      var p=s.split(',');
      if(p.length<6) continue;
      var ip=(p[1]||'').replace(/\"/g,''), durum=(p[3]||'').replace(/\"/g,''), malware=(p[5]||'').replace(/\"/g,'');
      if(!ip || ip==='dst_ip') continue;
      kayit.push({ip:ip, malware:malware||'-', durum:durum||'-'});
      if(kayit.length>=80) break;
    }
    if(kayit.length < 5) return cinssYukle();          /* liste kısıtlıysa yedeğe geç */
    return feodoKonumYaz(kayit, 'Feodo Tracker');
  }).catch(function(){ return cinssYukle(); });
}
/* 7) FİDYE YAZILIMI KURBANLARI (ransomwatch) */
function ransomYukle(){
  return jinaJSON('https://api.ransomware.live/v2/recentvictims', 40000).then(function(d){
    var liste=Array.isArray(d)? d : [];
    var nok=[], ham=[];
    for(var i=0;i<Math.min(liste.length,120);i++){
      var v=liste[i];
      var cc=(v.country||'').toUpperCase();
      var m=VERI_ULKE_MERKEZ[cc];
      if(!m) continue;
      var grup=v.group||v.group_name||'-', kurban=v.victim||v.post_title||'-';
      var tarih=String(v.attackdate||v.discovered||v.updated||'').slice(0,10);
      nok.push({lat:m[0]+(Math.random()-0.5)*2, lng:m[1]+(Math.random()-0.5)*2, renk:'#dc2626', cap:0.6, yuk:0.02, tur:'ransom',
        ad:'🔒 '+grup+' → '+kurban+' ('+(v.country||'')+') · '+tarih});
      ham.push({grup:grup, kurban:kurban, ulke:v.country||'', sektor:v.activity||'', tarih:tarih, site:v.claim_url||v.url||''});
    }
    CANLI.ransom=nok; CANLI_HAM.ransom=ham; CANLI_SAAT.ransom=simdi();
    return ham.length+' fidye yazılımı mağduru';
  });
}
/* 8) TOR RÖLELERİ (onionoo) */
function torYukle(){
  /* summary ucunda ülke alanı yok -> details + fields kullanılır */
  return fetchJSON('https://onionoo.torproject.org/details?limit=800&fields=nickname,country,flags,as_name', 45000).then(function(d){
    if(!d || !d.relays) return null;
    var sayim={}, cikis={};
    for(var i=0;i<d.relays.length;i++){
      var r=d.relays[i], cc=(r.country||'').toUpperCase();
      if(!cc) continue;
      sayim[cc]=(sayim[cc]||0)+1;
      if((r.flags||[]).indexOf('Exit')>=0) cikis[cc]=(cikis[cc]||0)+1;
    }
    var nok=[], ham=[];
    for(var k in sayim){
      var m=VERI_ULKE_MERKEZ[k]; if(!m) continue;
      nok.push({lat:m[0], lng:m[1], renk:'#a78bfa', cap:Math.min(0.9, 0.3+sayim[k]/40), yuk:0.02, tur:'tor',
        ad:'🧅 Tor rölesi · '+k+' · '+sayim[k]+' röle (çıkış: '+(cikis[k]||0)+')'});
      ham.push({ulke:k, role:sayim[k], cikis:cikis[k]||0});
    }
    ham.sort(function(a,b){ return b.role-a.role; });
    if(!ham.length) throw new Error('Tor ülke verisi gelmedi');
    CANLI.tor=nok; CANLI_HAM.tor=ham; CANLI_SAAT.tor=simdi();
    return d.relays.length+' Tor rölesi ('+ham.length+' ülke)';
  });
}
/* 9) SİBER SALDIRI KAYNAKLARI (SANS ISC + ip-api) */
function saldiriYukle(){
  return fetchJSON('https://isc.sans.edu/api/sources/attacks/100?json', 35000).then(function(d){
    var liste=Array.isArray(d)? d : [];
    if(!liste.length) return null;
    liste.sort(function(a,b){ return (parseInt(b.count)||0)-(parseInt(a.count)||0); });
    var ilk=liste.slice(0,60);
    return ipKonumlandir(ilk.map(function(x){ return x.ip; })).then(function(geo){
      var nok=[], ham=[];
      for(var i=0;i<geo.length;i++){
        var g=geo[i], kaynak=ilk[i]; if(!g || g.status!=='success' || g.lat==null) continue;
        var vurus=parseInt((kaynak&&kaynak.count)||0);
        nok.push({lat:g.lat, lng:g.lon, renk:'#fb7185', cap:Math.min(1, 0.35+vurus/40000), yuk:0.02, tur:'saldiri',
          ad:'🎯 Saldırı kaynağı · '+g.query+' · '+(g.country||'')+' · '+vurus.toLocaleString('tr-TR')+' paket'});
        ham.push({ip:g.query, ulke:g.country||'', iss:g.isp||'', vurus:vurus, ilk:(kaynak&&kaynak.firstseen)||'', son:(kaynak&&kaynak.lastseen)||''});
      }
      CANLI.saldiri=nok; CANLI_HAM.saldiri=ham; CANLI_SAAT.saldiri=simdi();
      return nok.length+' saldırı kaynağı konumlandırıldı';
    });
  });
}
/* 10) GAZİANTEP YAKINLIK KATMANI (1000 km) */
function yakinlikNoktalari(){
  /* DİKKAT: canliNoktalar()'ı çağırmaz — çağırırsa sonsuz döngü olur */
  var kaynak=[];
  for(var i=0;i<KURE_VERI.length;i++) kaynak.push(KURE_VERI[i]);
  for(var t in CANLI){
    if(t==='yakinlik') continue;
    var dizi=CANLI[t];
    if(dizi && dizi.length) for(var j=0;j<dizi.length;j++) kaynak.push(dizi[j]);
  }
  var out=[];
  for(var k=0;k<kaynak.length;k++){
    var p=kaynak[k];
    if(p.lat==null||p.lng==null) continue;
    if(p.tur==='yakinlik'||p.tur==='termin') continue;
    var d=mesafeKm(GZ_LAT, GZ_LNG, p.lat, p.lng);
    if(d>YAKINLIK_KM) continue;
    out.push({lat:p.lat, lng:p.lng, renk:'#ff2d2d', cap:0.75, yuk:0.03, tur:'yakinlik',
      ad:'📍 Gaziantep\'e '+Math.round(d)+' km · '+(p.ad||p.tur)});
  }
  return out;
}
/* 11) TÜRKİYE FAY HATLARI (statik, yaklaşık güzergâh) */
function fayYollari(){
  var out=[];
  if(typeof VERI_FAY==='undefined') return out;
  for(var i=0;i<VERI_FAY.length;i++){
    var f=VERI_FAY[i], pts=[];
    for(var j=0;j<f.length-1;j++) pts.push([f[j][0], f[j][1]]);
    out.push({pts:pts, ad:'〰 '+f[f.length-1]+' (yaklaşık)', renk:'#ef4444', tur:'fay'});
  }
  return out;
}
/* 12) Gaziantep çevresi 1000 km halkası */
function yakinlikHalka(){
  var pts=[];
  for(var a=0;a<=360;a+=3){
    var r=a*Math.PI/180, d=YAKINLIK_KM/111.32;
    var lat=GZ_LAT+d*Math.cos(r);
    var lng=GZ_LNG+d*Math.sin(r)/Math.max(0.2, Math.cos(GZ_LAT*Math.PI/180));
    pts.push([lat, lng]);
  }
  return [{pts:pts, ad:'Gaziantep 1000 km çevre halkası', renk:'#ff2d2d', tur:'yakinlik'}];
}
/* 13) NVD + EXPLOIT-DB + MITRE (paneller için) */
function nvdYukle(){
  var bit=new Date(), bas=new Date(Date.now()-7*86400000);
  function iso(d){ return d.toISOString().split('.')[0]+'.000'; }
  var u='https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&pubStartDate='+encodeURIComponent(iso(bas))+'&pubEndDate='+encodeURIComponent(iso(bit));
  return fetchJSON(u, 45000).then(function(d){
    var l=(d && d.vulnerabilities)? d.vulnerabilities : [];
    var ham=l.map(function(x){
      var c=x.cve||{}, m=null;
      try{ m=c.metrics.cvssMetricV31[0].cvssData; }catch(e){ try{ m=c.metrics.cvssMetricV30[0].cvssData; }catch(e2){} }
      return { cve:c.id, yayim:String(c.published||'').slice(0,10), puan:m?m.baseScore:'-', seviye:m?m.baseSeverity:'-',
               aciklama:((c.descriptions||[]).filter(function(q){return q.lang==='en';})[0]||{}).value||'' };
    });
    ham.sort(function(a,b){ return (parseFloat(b.puan)||0)-(parseFloat(a.puan)||0); });
    CANLI_HAM.nvd=ham; CANLI_SAAT.nvd=simdi();
    return l.length+' yeni CVE';
  });
}
function exploitdbYukle(){
  return jinaMetin('https://www.exploit-db.com/rss.xml', 35000).then(function(t){
    var p=new DOMParser(), d=p.parseFromString(t,'text/xml');
    var liste=[];
    try{
      var its=d.querySelectorAll('item');
      for(var i=0;i<Math.min(its.length,20);i++){
        var t1=its[i].querySelector('title'), l1=its[i].querySelector('link');
        liste.push({ ad:(t1?t1.textContent:''), link:(l1?l1.textContent:''), tarih:'' });
      }
    }catch(e){}
    if(!liste.length) throw new Error('besleme boş');
    CANLI_HAM.exploitdb=liste; CANLI_SAAT.exploitdb=simdi();
    return liste.length+' yeni exploit';
  });
}

/* =============== KATMANLARI ÇİZİME BAĞLA =============== */
var EK_NOKTA_SIRA=['depremuyari','meteor','feodo','ransom','tor','saldiri','uzaycopu'];
var _eskiCanliNoktalar=canliNoktalar;
canliNoktalar=function(){
  var out=_eskiCanliNoktalar();
  for(var i=0;i<EK_NOKTA_SIRA.length;i++){
    var d=CANLI[EK_NOKTA_SIRA[i]];
    if(d && d.length) for(var j=0;j<d.length;j++) out.push(d[j]);
  }
  if(KATMAN.ucakyogunluk && HTML_VERI.ucak && HTML_VERI.ucak.length){
    var u=yogunlukNoktalari(HTML_VERI.ucak,'ucakyogunluk','uçak',"#60a5fa",5);
    for(var a=0;a<u.length;a++) out.push(u[a]);
  }
  if(KATMAN.gemiyogunluk && HTML_VERI.gemi && HTML_VERI.gemi.length){
    var g=yogunlukNoktalari(HTML_VERI.gemi,'gemiyogunluk','gemi','#2dd4bf',3);
    for(var b=0;b<g.length;b++) out.push(g[b]);
  }
  if(KATMAN.yakinlik){ var y=yakinlikNoktalari(); for(var c=0;c<y.length;c++) out.push(y[c]); }
  return out;
};
var _eskiCanliYollar=canliYollar;
canliYollar=function(){
  var out=_eskiCanliYollar();
  if(KATMAN.auroracizgi){ var a=auroraCizgiYollar(); for(var i=0;i<a.length;i++) out.push(a[i]); }
  if(KATMAN.fay){ var f=fayYollari(); for(var j=0;j<f.length;j++) out.push(f[j]); }
  if(KATMAN.yakinlik){ var y=yakinlikHalka(); for(var k=0;k<y.length;k++) out.push(y[k]); }
  return out;
};
var _eskiStatikListe=statikListe;
statikListe=function(){
  var out=_eskiStatikListe();
  function ekle(dizi,renk,tur,cap){ if(typeof dizi==='undefined') return;
    for(var i=0;i<dizi.length;i++) out.push({lat:dizi[i][0], lng:dizi[i][1], renk:renk, cap:cap, yuk:0.012, tur:tur, ad:dizi[i][2]}); }
  ekle(VERI_PLATFORM,'#f59e0b','platform',0.45);
  ekle(VERI_GAZ,'#38bdf8','gaz',0.45);
  ekle(VERI_HAVALIMANI,'#e2e8f0','havalimani',0.4);
  return out;
};
/* zaman planına ekle */
var EK_PLAN=[
  {id:'depremuyari', ms:10*60000, fn:depremUyariYukle},
  {id:'meteor',      ms:60*60000, fn:meteorYukle},
  {id:'uzaycopu',    ms:30000,    fn:uzayCopuYukle},
  {id:'feodo',       ms:30*60000, fn:feodoYukle},
  {id:'ransom',      ms:30*60000, fn:ransomYukle},
  {id:'tor',         ms:60*60000, fn:torYukle},
  {id:'saldiri',     ms:20*60000, fn:saldiriYukle}
];
(function(){ for(var i=0;i<EK_PLAN.length;i++) ZAMAN_PLANI.push(EK_PLAN[i]); })();

/* =============== SİBER TEHDİT PANELİ EKLENTİSİ =============== */
function ekTehditHTML(){
  var h='';
  var otomatik=[
    ['nvd', nvdYukle, 'NVD · SON 7 GÜNÜN CVE\'LERİ'],
    ['exploitdb', exploitdbYukle, 'EXPLOIT-DB · YENİ EXPLOIT\'LER']
  ];
  for(var o=0;o<otomatik.length;o++){
    (function(id, fn){
      if(CANLI_HAM[id]) return;
      fn().then(function(){ tehditPanelYaz(); }).catch(function(){});
    })(otomatik[o][0], otomatik[o][1]);
  }
  if(CANLI_HAM.feodo && CANLI_HAM.feodo.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">KÖTÜ ŞÖHRETLİ IP / C2 SUNUCULARI ('+(CANLI_HAM.feodoKaynak||'')+' · '+CANLI_HAM.feodo.length+')</h3>';
    h+=tablo(['IP','Ülke','Şehir','Sağlayıcı','Zararlı'], CANLI_HAM.feodo.slice(0,20).map(function(x){
      return [x.ip, x.ulke, x.kota, (x.iss||'').slice(0,28), x.malware]; }));
    h+='<div class="uyari">abuse.ch halka açık C2/URL listeleri 2026\'da Auth-Key zorunlu hâle geldi; liste boş dönerse panel otomatik olarak CINS Army kötü şöhretli IP listesine geçer. Anahtarını girersen (yukarıdaki alan) URLhaus/ThreatFox verisi de bu bölüme eklenir.</div>';
  }
  if(CANLI_HAM.ransom && CANLI_HAM.ransom.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">FİDYE YAZILIMI MAĞDURLARI (ransomwatch · '+CANLI_HAM.ransom.length+')</h3>';
    h+=tablo(['Grup','Mağdur','Ülke','Sektör','Tarih'], CANLI_HAM.ransom.slice(0,20).map(function(x){
      return [x.grup, (x.kurban||'').slice(0,30), x.ulke, (x.sektor||'').slice(0,22), x.tarih]; }));
  }
  if(CANLI_HAM.tor && CANLI_HAM.tor.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">TOR RÖLELERİ — ÜLKE DAĞILIMI (ilk 15)</h3>';
    h+=tablo(['Ülke','Röle','Çıkış düğümü'], CANLI_HAM.tor.slice(0,15).map(function(x){ return [x.ulke, x.role, x.cikis]; }));
  }
  if(CANLI_HAM.saldiri && CANLI_HAM.saldiri.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">SALDIRI KAYNAKLARI (SANS ISC · en yoğun 15)</h3>';
    h+=tablo(['IP','Ülke','Sağlayıcı','Paket'], CANLI_HAM.saldiri.slice(0,15).map(function(x){
      return [x.ip, x.ulke, (x.iss||'').slice(0,28), (x.vurus||0).toLocaleString('tr-TR')]; }));
  }
  if(CANLI_HAM.nvd && CANLI_HAM.nvd.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">YENİ CVE\'LER — NVD (CVSS puanına göre)</h3>';
    h+=tablo(['CVE','CVSS','Seviye','Yayım','Açıklama'], CANLI_HAM.nvd.slice(0,15).map(function(x){
      return [x.cve, x.puan, x.seviye, x.yayim, (x.aciklama||'').slice(0,90)]; }));
  }
  if(CANLI_HAM.exploitdb && CANLI_HAM.exploitdb.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">EXPLOIT-DB · YENİ EKLENENLER</h3>';
    h+='<div class="kartListe">';
    for(var e=0;e<CANLI_HAM.exploitdb.length;e++){
      var x=CANLI_HAM.exploitdb[e];
      h+='<a class="haberSatir" style="text-decoration:none" target="_blank" rel="noopener" href="'+esc(x.link)+'">'
       +'<div class="kaynak">EXPLOIT-DB</div><div class="baslik">'+esc(x.ad)+'</div></a>';
    }
    h+='</div>';
  }
  if(CANLI_HAM.depremuyari && CANLI_HAM.depremuyari.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">DEPREM UYARI SEVİYELERİ (USGS PAGER · tsunami bayrağı)</h3>';
    h+=tablo(['Yer','Büyüklük','Uyarı','Tsunami','Hisseden','Zaman'], CANLI_HAM.depremuyari.slice(0,12).map(function(x){
      return [(x.yer||'').slice(0,40), x.mag, x.uyari, x.tsunami, x.hisseden, x.zaman]; }));
  }
  return h;
}
