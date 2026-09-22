/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — KAYNAK PAKETİ 2 (v5.4 · düzeltilmiş)
   Tarayıcıdan DOĞRUDAN okunabilen (CORS açık) kaynaklar kullanılır.
   Vekil (r.jina.ai) yalnızca zorunlu hâllerde, kuyruklu ve beklemeli.
   Düşen kaynaklar için CORS'lu gerçek alternatifler:
     TCMB XML      → open.er-api.com (160 para birimi, anahtarsız)
     aviation METAR→ metar.vatsim.net (uçuş ağı METAR servisi)
     tsunami.gov   → api.weather.gov/alerts (NOAA resmî uyarı API'si)
     CISA RSS      → rss2json vekili ile
     kötü IP       → FireHOL level1 + level2 (GitHub, açık)
   ============================================================ */
var K2={};
var GZ_LAT2=37.066, GZ_LNG2=37.383;

/* ---------------- vekil kuyruğu (r.jina.ai kota dostu) ---------------- */
var JINA={ aktif:0, enCok:2, son:0, kuyruk:[] };
function jinaCek(url, ms){
  return new Promise(function(res, rej){
    JINA.kuyruk.push({url:url, ms:ms, res:res, rej:rej, deneme:0});
    jinaIsle();
  });
}
function jinaIsle(){
  if(JINA.aktif>=JINA.enCok || !JINA.kuyruk.length) return;
  var is=JINA.kuyruk.shift();
  JINA.aktif++;
  var bekle=Math.max(0, 420-(Date.now()-JINA.son));
  setTimeout(function(){
    JINA.son=Date.now();
    var ctl=('AbortController' in window)? new AbortController():null;
    var t=setTimeout(function(){ if(ctl) ctl.abort(); }, is.ms||30000);
    fetch('https://r.jina.ai/'+is.url, {headers:{'Accept':'*/*'}}).then(function(r){
      clearTimeout(t);
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.text();
    }).then(function(t2){
      JINA.aktif--; jinaIsle(); is.res(t2);
    }).catch(function(e){
      clearTimeout(t); JINA.aktif--;
      if(is.deneme<1){ is.deneme++; is.ms=(is.ms||30000)+10000; JINA.kuyruk.push(is); }
      else { is.rej(e); }
      jinaIsle();
    });
  }, bekle);
}
/* doğrudan dene (CORS açıksa), olmazsa kuyruklu vekil */
function k2Metin(url, ms){
  ms=ms||22000;
  return new Promise(function(res, rej){
    var ctl=('AbortController' in window)? new AbortController():null;
    var t=setTimeout(function(){ if(ctl) ctl.abort(); }, ms);
    fetch(url, {headers:{'Accept':'*/*'}}).then(function(r){
      clearTimeout(t);
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.text();
    }).then(res).catch(function(){
      /* CORS kapalı → kuyruklu vekil */
      jinaCek(url, ms+8000).then(res).catch(function(){ rej(new Error('kaynak kapalı')); });
    });
  });
}
function k2JSON(url, ms){ return k2Metin(url, ms).then(function(t){
  try{ return JSON.parse(t); }catch(e){ throw new Error('JSON okunamadı'); }
}); }
function k2RssOku(xml, adet){
  var out=[];
  try{
    var d=new DOMParser().parseFromString(xml, 'text/xml');
    var ogeler=d.querySelectorAll('item, entry');
    for(var i=0;i<Math.min(ogeler.length, adet||8);i++){
      var o=ogeler[i];
      function al(sec){ var e=o.querySelector(sec); return e? (e.textContent||'').trim() : ''; }
      var bag=al('link');
      if(!bag){ var le=o.querySelector('link[href]'); if(le) bag=le.getAttribute('href'); }
      var bas=al('title');
      if(!bas) continue;
      out.push({ baslik:bas, tarih: al('pubDate')||al('updated')||al('date'), bag: bag });
    }
  }catch(e){}
  return out;
}
function k2RssVekil(feedUrl, adet){
  return k2JSON('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feedUrl), 22000).then(function(d){
    if(!d || d.status!=='ok' || !d.items) return [];
    return d.items.slice(0, adet||8).map(function(it){
      return {baslik:it.title, tarih:it.pubDate, bag:it.link};
    });
  });
}

/* ============================================================
   1) EMSC — Avrupa/Akdeniz depremleri (yeni katman)
   ============================================================ */
function emscYukle(){
  return k2JSON('https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=120&minmagnitude=4.0', 30000).then(function(d){
    if(!d || !d.features) throw new Error('EMSC verisi yok');
    var nok=[], ham=[];
    for(var i=0;i<d.features.length;i++){
      var f=d.features[i], p=f.properties||{}, c=(f.geometry&&f.geometry.coordinates)||[];
      if(c.length<2) continue;
      var m=p.mag||0;
      nok.push({lat:c[1], lng:c[0], renk:(m>=6?'#ff3b3b':(m>=5?'#fb923c':'#fcd34d')), cap:(m>=6?0.85:0.6), yuk:0.02,
        tur:'emsc', ad:'🌍 EMSC M'+m+' · '+(p.flynn_region||'')+' · '+String(p.time||'').slice(0,16)});
      ham.push({mag:m, yer:p.flynn_region||'', zaman:p.time||'', lat:c[1], lng:c[0]});
    }
    CANLI.emsc=nok; CANLI_HAM.emsc=ham.slice(0,40); CANLI_SAAT.emsc=simdi();
    return nok.length+' EMSC depremi (Avrupa/Akdeniz)';
  });
}

/* kötü şöhretli IP — FireHOL level1 + level2 (GitHub, CORS açık) */
function kotuIpYukle(){
  return Promise.all([
    k2Metin('https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset', 25000).catch(function(){ return ''; }),
    k2Metin('https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level2.netset', 25000).catch(function(){ return ''; })
  ]).then(function(listeler){
    var adlar=['FireHOL level1','FireHOL level2'], secili=[], toplam={};
    for(var i=0;i<listeler.length;i++){
      var satir=String(listeler[i]).split(/\r?\n/).map(function(x){ return x.trim(); })
        .filter(function(x){ return /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(x); });
      toplam[adlar[i]]=satir.length;
      var atla=Math.max(1, Math.floor(satir.length/20));
      for(var j=0;j<satir.length && secili.length<20*(i+1);j+=atla){
        var ip=satir[j].split('/')[0];               /* ağ adresinden örnek IP */
        if(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) secili.push({ip:ip, kaynak:adlar[i]});
      }
    }
    if(secili.length<5) throw new Error('IP listeleri boş');
    return ipKonumlandir(secili.map(function(x){ return x.ip; })).then(function(geo){
      var nok=[], ham=[];
      for(var k=0;k<geo.length;k++){
        var g=geo[k]; if(!g || g.status!=='success' || g.lat==null) continue;
        var kaynak=(secili[k]&&secili[k].kaynak)||'-';
        nok.push({lat:g.lat, lng:g.lon, renk:'#fb7185', cap:0.5, yuk:0.02, tur:'kotuip',
          ad:'⛔ '+g.query+' · '+(g.country||'')+' · liste: '+kaynak});
        ham.push({ip:g.query, ulke:g.country||'', iss:(g.isp||'').slice(0,26), kaynak:kaynak});
      }
      CANLI.kotuip=nok; CANLI_HAM.kotuip=ham; CANLI_HAM.kotuIpToplam=toplam; CANLI_SAAT.kotuip=simdi();
      return nok.length+' kötü şöhretli IP (FireHOL)';
    });
  });
}

/* ============================================================
   2) TÜRKİYE & BÖLGEM
   ============================================================ */
function mgmUyariYukle(){
  return k2Metin('https://www.mgm.gov.tr/FTPDATA/analiz/sonSOA.xml', 22000).then(function(x){
    var out=[], bloklar=String(x).match(/<Bolge>[\s\S]*?<\/Bolge>/g)||[];
    for(var i=0;i<bloklar.length;i++){
      var blok=bloklar[i];
      function al(et){ var m=blok.match(new RegExp('<'+et+'>([\\s\\S]*?)<\\/'+et+'>')); return m? m[1].replace(/<!\[CDATA\[|\]\]>/g,'').trim() : ''; }
      out.push({bolge:al('BolgeAdi')||'-', hadise:al('Hadise')||'-', ilk:al('IlkUyariZamani')||'', bitis:al('UyariBitisZamani')||'',
        metin:(al('Uyari')||al('GenelUyari')||'').slice(0,220)});
    }
    if(!out.length){
      var d=new DOMParser().parseFromString(x,'text/xml'), bs=d.querySelectorAll('Bolge');
      for(var j=0;j<bs.length;j++){
        function al2(et){ var e=bs[j].querySelector(et); return e? (e.textContent||'').trim():''; }
        out.push({bolge:al2('BolgeAdi')||'-', hadise:al2('Hadise')||'-', metin:(al2('Uyari')||'').slice(0,220)});
      }
    }
    K2.mgm=out; CANLI_SAAT.mgm=simdi();
    return out.length+' MGM bölge uyarısı';
  });
}
function kurYukle(){
  /* open.er-api: 160+ para birimi, anahtarsız, CORS açık */
  return k2JSON('https://open.er-api.com/v6/latest/USD', 20000).then(function(d){
    if(!d || !d.rates) throw new Error('kur verisi yok');
    var r=d.rates, out=[], istenen=['TRY','EUR','GBP','CHF','JPY','RUB','SAR','CNY','AZN','CAD','AUD','SEK','NOK','DKK','KWD','AED','QAR','UAH','GEL','INR','PKR','IQD','IRR','EGP','BGN','RON','HUF','PLN','CZK','KRW','KZT','UZS'];
    for(var i=0;i<istenen.length;i++){
      var k=istenen[i];
      if(r[k]==null) continue;
      out.push({kod:k, ad:k, usd:k==='USD'?'1':(1/r[k]).toFixed(4), try_:k==='TRY'?'1':(r['TRY']/r[k]).toFixed(4)});
    }
    if(r['TRY']) K2.usdTry=r['TRY'];
    K2.kur=out; K2.kurZaman=(d.time_last_update_utc||'').slice(0,16); K2.kurKaynak='open.er-api';
    CANLI_SAAT.kur=simdi();
    return out.length+' kur (open.er-api)';
  }).catch(function(){
    return k2JSON('https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY,EUR,GBP,CHF,JPY', 15000).then(function(d){
      var out=[];
      for(var k in (d.rates||{})) out.push({kod:k, ad:k, usd:(1/d.rates[k]).toFixed(4), try_:(d.rates['TRY']/d.rates[k]).toFixed(4)});
      if(d.rates && d.rates['TRY']) K2.usdTry=d.rates['TRY'];
      K2.kur=out; K2.kurKaynak='Frankfurter'; CANLI_SAAT.kur=simdi();
      return out.length+' kur (Frankfurter)';
    });
  });
}
function altinYukle(){
  return Promise.all([
    k2JSON('https://api.gold-api.com/price/XAU', 15000).catch(function(){ return null; }),
    k2JSON('https://api.gold-api.com/price/XAG', 15000).catch(function(){ return null; }),
    k2JSON('https://api.alternative.me/fng/', 15000).catch(function(){ return null; }),
    k2JSON('https://api.coingecko.com/api/v3/global', 20000).catch(function(){ return null; }),
    k2JSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true', 20000).catch(function(){ return null; })
  ]).then(function(r){
    K2.piyasa={
      altin:(r[0]&&r[0].price)||null,
      gumus:(r[1]&&r[1].price)||null,
      korku:(r[2]&&r[2].data&&r[2].data[0])?{deger:r[2].data[0].value, sinif:r[2].data[0].value_classification}:null,
      kriptoToplam:(r[3]&&r[3].data)?r[3].data:null,
      kriptolar:r[4]||null
    };
    CANLI_SAAT.altin=simdi();
    return 'altın + kripto + endeks';
  });
}
function bolgemYukle(){
  var gun=new Date(), iso=gun.getFullYear()+'-'+String(gun.getMonth()+1).padStart(2,'0')+'-'+String(gun.getDate()).padStart(2,'0');
  return Promise.all([
    k2JSON('https://api.aladhan.com/v1/timings/'+iso+'?latitude='+GZ_LAT2+'&longitude='+GZ_LNG2+'&method=13', 15000).catch(function(){ return null; }),
    k2JSON('https://api.sunrisesunset.io/json?lat='+GZ_LAT2+'&lng='+GZ_LNG2+'&timezone=Europe/Istanbul', 15000).catch(function(){ return null; }),
    k2JSON('https://api.open-meteo.com/v1/forecast?latitude='+GZ_LAT2+'&longitude='+GZ_LNG2+'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=2&timezone=Europe/Istanbul', 15000).catch(function(){ return null; })
  ]).then(function(r){
    K2.bolgem={namaz:(r[0]&&r[0].data&&r[0].data.timings)||null, gunes:(r[1]&&r[1].results)||null, hava:(r[2]&&r[2])||null};
    return k2JSON('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=3&limit=40&starttime='+new Date(Date.now()-7*86400000).toISOString().slice(0,10)+'&latitude='+GZ_LAT2+'&longitude='+GZ_LNG2+'&maxradiuskm=500', 25000).catch(function(){ return null; });
  }).then(function(dep){
    K2.bolgem.yakin=[];
    if(dep && dep.features) for(var i=0;i<dep.features.length;i++){
      var f=dep.features[i], p=f.properties||{}, c=(f.geometry&&f.geometry.coordinates)||[];
      if(c.length<2) continue;
      K2.bolgem.yakin.push({mag:p.mag, yer:p.place||'', zaman:p.time, mesafe:mesafeKm(GZ_LAT2, GZ_LNG2, c[1], c[0])});
    }
    K2.bolgem.yakin.sort(function(a,b){ return a.mesafe-b.mesafe; });
    CANLI_SAAT.bolgem=simdi();
    return 'bölgem verisi';
  });
}
/* METAR — VATSIM uçuş ağı servisi (CORS açık) */
function metarYukle(){
  var meydanlar=['LTBA','LTAF','LTAC','LTBJ','LTFM','LTFJ','LTAI','LTAN','LTBZ'];
  return Promise.all(meydanlar.map(function(id){
    return k2Metin('https://metar.vatsim.net/'+id, 12000).then(function(t){
      return {icaoId:id, rawOb:(t||'').trim().slice(0,140)};
    }).catch(function(){ return null; });
  })).then(function(l){
    K2.metar=l.filter(function(x){ return x && x.rawOb; });
    CANLI_SAAT.metar=simdi();
    return K2.metar.length+' METAR (VATSIM)';
  });
}
/* NOAA/NWS aktif uyarılar: tsunami + şiddetli hava (CORS açık) */
function uyariAkisYukle(){
  var turler=[['Tsunami Warning','TSUNAMİ'],['Tsunami Advisory','TSUNAMİ (tavsiye)'],['Severe Thunderstorm Warning','ŞİDDETLİ FIRTINA'],['Flash Flood Warning','ANI SEL']];
  return Promise.all(turler.map(function(t){
    return k2JSON('https://api.weather.gov/alerts/active?event='+encodeURIComponent(t[0]), 18000).then(function(d){
      var out=[];
      var fl=(d&&d.features)||[];
      for(var i=0;i<Math.min(fl.length,6);i++){
        var p=fl[i].properties||{};
        out.push({tur:t[1], baslik:p.headline||p.event||t[0], bolge:(p.areaDesc||'').slice(0,90), zaman:p.sent||'', seviye:p.severity||''});
      }
      return out;
    }).catch(function(){ return []; });
  })).then(function(lists){
    var out=[]; for(var i=0;i<lists.length;i++) out=out.concat(lists[i]);
    K2.nwsUyari=out; CANLI_SAAT.uyariAkis=simdi();
    return out.length+' NOAA/NWS aktif uyarısı';
  });
}

/* ============================================================
   3) SİBER derinleştirme
   ============================================================ */
function ghsaYukle(){
  return k2JSON('https://api.github.com/advisories?per_page=12&sort=published&direction=desc', 25000).then(function(d){
    K2.ghsa=(d||[]).map(function(a){ return {id:a.ghsa_id, cve:a.cve_id||'-', ozet:(a.summary||'').slice(0,120),
      seviye:a.severity||'-', yayim:(a.published_at||'').slice(0,10),
      paket:(a.vulnerabilities&&a.vulnerabilities[0]&&a.vulnerabilities[0].package&&a.vulnerabilities[0].package.name)||'-'}; });
    CANLI_SAAT.ghsa=simdi();
    return K2.ghsa.length+' GitHub Advisory';
  });
}
function cisaYukle(){
  return k2RssVekil('https://www.cisa.gov/cybersecurity-advisories/all.xml', 10).then(function(l){
    K2.cisa=l; CANLI_SAAT.cisaAdv=simdi();
    return l.length+' CISA bildirimi';
  });
}
function nucleiYukle(){
  return k2JSON('https://api.github.com/search/repositories?q=nuclei+template&sort=updated&order=desc&per_page=8', 25000).then(function(d){
    K2.nuclei=((d&&d.items)||[]).map(function(x){ return {ad:x.full_name, yildiz:x.stargazers_count, guncel:(x.updated_at||'').slice(0,10), aciklama:(x.description||'').slice(0,110)}; });
    CANLI_SAAT.nuclei=simdi();
    return K2.nuclei.length+' nuclei deposu';
  });
}
function guvenlikHaberYukle(){
  var kaynaklar=[
    {ad:'THE HACKER NEWS', url:'https://thehackernews.com/feeds/posts/default'},
    {ad:'BLEEPINGCOMPUTER', url:'https://www.bleepingcomputer.com/feed/'},
    {ad:'KREBS ON SECURITY', url:'https://krebsonsecurity.com/feed/'}
  ];
  return Promise.all(kaynaklar.map(function(k){
    return k2RssVekil(k.url, 6).then(function(l){
      return l.map(function(x){ x.kaynak=k.ad; return x; });
    }).catch(function(){ return []; });
  })).then(function(lists){
    var out=[]; for(var i=0;i<lists.length;i++) out=out.concat(lists[i]);
    K2.guvenlikHaber=out; CANLI_SAAT.guvenlik=simdi();
    return out.length+' güvenlik haberi';
  });
}

/* ============================================================
   4) UZAY
   ============================================================ */
function swpcUyariYukle(){
  return k2JSON('https://services.swpc.noaa.gov/products/alerts.json', 20000).then(function(d){
    K2.swpcUyari=(d||[]).slice(0,12).map(function(x){ return {urun:x.product_id, zaman:x.issue_datetime, metin:String(x.message||'').replace(/\s+/g,' ').slice(0,300)}; });
    CANLI_SAAT.swpcUyari=simdi();
    return K2.swpcUyari.length+' uzay havası uyarısı';
  });
}
function gunesDonguYukle(){
  return k2JSON('https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json', 30000).then(function(d){
    var out=[];
    for(var i=Math.max(0, d.length-360); i<d.length; i++){
      if(d[i] && d[i]['ssn']!=null) out.push({ay:d[i]['time-tag'], ssn:d[i]['ssn']});
    }
    K2.gunesDongu=out; CANLI_SAAT.gunesDongu=simdi();
    return out.length+' aylık güneş lekesi kaydı';
  });
}
function donkiYukle(){
  var bas=new Date(Date.now()-14*86400000).toISOString().slice(0,10);
  return k2JSON('https://api.nasa.gov/DONKI/FLR?startDate='+bas+'&api_key=DEMO_KEY', 25000).then(function(d){
    K2.donki=(d||[]).slice(0,10).map(function(x){ return {
      sinif:(x.classType||'-'), baslangic:(x.beginTime||'').slice(0,16), bolge:x.activeRegionNum||'-'}; });
    CANLI_SAAT.donki=simdi();
    return K2.donki.length+' güneş patlaması (DONKI)';
  });
}
function issKonumYukle(){
  return k2JSON('https://api.wheretheiss.at/v1/satellites/25544', 15000).then(function(d){
    if(!d) throw new Error('ISS konumu alınamadı');
    K2.issKonum=d; CANLI_SAAT.issKonum=simdi();
    return 'ISS: '+d.latitude.toFixed(1)+'°, '+d.longitude.toFixed(1)+'° · '+Math.round(d.altitude)+' km';
  });
}
function dunyaBankasiYukle(){
  return Promise.all([
    k2JSON('https://api.worldbank.org/v2/country/TUR/indicator/NY.GDP.MKTP.CD?format=json&per_page=3', 20000).catch(function(){ return null; }),
    k2JSON('https://api.worldbank.org/v2/country/TUR/indicator/FP.CPI.TOTL.ZG?format=json&per_page=3', 20000).catch(function(){ return null; }),
    k2JSON('https://api.worldbank.org/v2/country/TUR/indicator/SP.POP.TOTL?format=json&per_page=3', 20000).catch(function(){ return null; })
  ]).then(function(r){
    K2.dunyaBankasi={gsyh:(r[0]&&r[0][1])||null, enflasyon:(r[1]&&r[1][1])||null, nufus:(r[2]&&r[2][1])||null};
    CANLI_SAAT.dunyaBankasi=simdi();
    return 'Dünya Bankası (Türkiye)';
  });
}

/* ============================================================
   5) HTML üreticileri
   ============================================================ */
function k2Kart(baslik, icerik){ return '<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">'+baslik+'</h3>'+icerik; }

function bolgemHTML(){
  var h='', b=K2.bolgem||{}, p=K2.piyasa||{}, kurlar=K2.kur||[];
  if(b.namaz){
    var s=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'], ad=['İMSAK','GÜNEŞ','ÖĞLE','İKİNDİ','AKŞAM','YATSI'];
    h+='<table class="tbl"><tr>';
    for(var i=0;i<s.length;i++) h+='<td class="k" style="text-align:center">'+ad[i]+'<br><b>'+(b.namaz[s[i]]||'-')+'</b></td>';
    h+='</tr></table><div class="soluk" style="font-size:10px">Kaynak: Aladhan API · Gaziantep konumu</div>';
  }
  if(b.gunes) h+=k2Kart('☀ GÜNEŞ', '<table class="tbl">'+satir('doğuş', b.gunes.sunrise)+satir('batış', b.gunes.sunset)+satir('gün uzunluğu', b.gunes.day_length)+'</table>');
  if(b.hava && b.hava.current){
    var c=b.hava.current, dd=(b.hava.daily||{});
    h+=k2Kart('🌡 GAZİANTEP HAVA', '<table class="tbl">'+satir('sıcaklık', c.temperature_2m+'°C')
      +satir('nem', c.relative_humidity_2m+'%')+satir('rüzgâr', c.wind_speed_10m+' km/s')
      +satir('en yüksek/düşük', (dd.temperature_2m_max? dd.temperature_2m_max[0]+'° / '+dd.temperature_2m_min[0]+'°':'-'))+'</table>');
  }
  if(b.yakin && b.yakin.length){
    h+=k2Kart('📍 GAZİANTEP ÇEVRESİ — SON DEPREMLER (500 km / M3+)', '<table class="tbl">'+satir('olay sayısı', b.yakin.length)+
      b.yakin.slice(0,6).map(function(x){ return satir('M'+x.mag, Math.round(x.mesafe)+' km · '+esc(String(x.yer||'').slice(0,42))); }).join('')+'</table>');
  }
  if(kurlar.length){
    h+=k2Kart('💱 DÖVİZ KURLARI (USD bazlı / TL karşılığı)', '<table class="tbl"><tr><td class="k">Birim</td><td class="v">1 birim = ? USD</td><td class="v">TL</td></tr>'+
      kurlar.slice(0,8).map(function(x){ return '<tr><td class="k">'+esc(x.kod)+'</td><td class="v">'+esc(String(x.usd))+'</td><td class="v">'+esc(String(x.try_))+' ₺</td></tr>'; }).join('')+'</table>'
      +'<div class="uyari">Kaynak: '+(K2.kurKaynak||'open.er-api')+' (anahtarsız, 160+ para birimi). TCMB XML servisi tarayıcıdan okunamıyor (CORS kapalı) — bu yüzden aynı veriyi açık kur API\'sinden alıyoruz.</div>');
  }
  if(p.altin) h+=k2Kart('🥇 ALTIN & GÜMÜŞ (ons)', '<table class="tbl">'
    +satir('altın (XAU) ons', '$'+Number(p.altin).toLocaleString('en-US',{maximumFractionDigits:2}))
    +satir('gümüş (XAG) ons', p.gumus? '$'+Number(p.gumus).toLocaleString('en-US',{maximumFractionDigits:2}):'-')
    +satir('gram altın (yaklaşık)', (p.altin && K2.usdTry)? '₺'+Math.round(p.altin/31.1035*K2.usdTry).toLocaleString('tr-TR'):'-')+'</table>'
    +'<div class="soluk" style="font-size:10px">gram = ons ÷ 31,1035 × USD/TRY ('+(K2.usdTry? K2.usdTry.toFixed(2):'-')+')</div>');
  if(p.korku) h+=k2Kart('😱 PİYASA DUYGUSU', '<table class="tbl">'+satir('korku & açgözlülük', '<b>'+p.korku.deger+'</b> · '+esc(p.korku.sinif))+'</table>');
  if(p.kriptolar){
    var kk='';
    for(var c2 in p.kriptolar){ var o=p.kriptolar[c2]; kk+=satir(c2.toUpperCase(), '$'+Number(o.usd).toLocaleString('en-US',{maximumFractionDigits:2})+' (%'+(o.usd_24h_change||0).toFixed(2)+')'); }
    h+=k2Kart('🪙 KRİPTO', '<table class="tbl">'+kk+'</table>');
  }
  if(K2.mgm){
    if(K2.mgm.length){
      h+=k2Kart('⚠ MGM TÜRKİYE METEOROLOJİ UYARILARI ('+K2.mgm.length+')', '<div class="nkListe">'+
        K2.mgm.slice(0,14).map(function(x){
          return '<div class="nkOge">⚠ <b>'+esc(x.bolge||'-')+'</b> · '+esc(String(x.hadise||'-'))
            +(x.ilk? ' <span class="soluk">'+esc(String(x.ilk).slice(0,16))+'</span>':'')
            +(x.metin? '<br><span style="font-size:10px">'+esc(x.metin.slice(0,170))+'</span>':'')+'</div>';
        }).join('')+'</div><div class="uyari">Kaynak: MGM sonSOA (Türkçe, gerçek zamanlı, CORS açık).</div>');
    } else h+=k2Kart('⚠ MGM UYARILARI', '<div class="uyari">Şu an aktif meteoroloji uyarısı yok.</div>');
  }
  if(K2.metar && K2.metar.length){
    h+=k2Kart('✈ HAVALİMANI HAVA DURUMU ('+K2.metar.length+' meydan · METAR)', '<table class="tbl">'+
      K2.metar.map(function(m){ return '<tr><td class="k">'+esc(m.icaoId)+'</td><td class="v" style="font-size:10px">'+esc(m.rawOb)+'</td></tr>'; }).join('')+'</table>'
      +'<div class="uyari">Kaynak: VATSİM METAR servisi (uçuş ağı, CORS açık).</div>');
  }
  if(K2.nwsUyari && K2.nwsUyari.length){
    h+=k2Kart('🌊 NOAA / NWS AKTİF UYARILAR (tsunami · fırtına · sel)', '<table class="tbl">'+
      K2.nwsUyari.slice(0,8).map(function(x){
        return '<tr><td class="k">'+esc(x.tur)+'</td><td class="v" style="font-size:10px">'+esc(String(x.baslik).slice(0,120))+'<br><span class="soluk">'+esc(x.bolge)+' · '+esc(String(x.zaman).slice(0,16))+'</span></td></tr>';
      }).join('')+'</table><div class="uyari">Kaynak: api.weather.gov (NOAA resmî uyarı API\'si, CORS açık) — ABD ve Pasifik kapsamı.</div>');
  }
  if(!h) h='<div class="soluk">veri çekiliyor…</div>';
  return h;
}
function bolgemPanelYukle(){
  panelHazir('bolgem');
  var isler=[];
  if(!K2.bolgem) isler.push(bolgemYukle());
  if(!K2.kur) isler.push(kurYukle());
  if(!K2.piyasa) isler.push(altinYukle());
  if(!K2.mgm) isler.push(mgmUyariYukle());
  if(!K2.metar) isler.push(metarYukle());
  if(!K2.nwsUyari) isler.push(uyariAkisYukle());
  Promise.all(isler.map(function(x){ return x.catch(function(){ return null; }); })).then(function(){
    var el=$('sonuc_bolgem'); if(el) el.innerHTML=bolgemHTML();
    durum('bolgem','✔ Gaziantep & Türkiye verileri hazır');
  });
}

/* ============================================================
   6) EK BÖLÜMLER (koruma bekçili — panel kendi yazsa da geri gelir)
   ============================================================ */
function ekBolumKoru(panel, id, ciz){
  setInterval(function(){
    if(typeof AKTIF==='undefined' || AKTIF!==panel) return;
    var kutu=document.getElementById('sonuc_'+panel); if(!kutu) return;
    var hedef=document.getElementById(id);
    if(!hedef){ hedef=document.createElement('div'); hedef.id=id; kutu.appendChild(hedef); }
    var ic=(typeof ciz==='function')? ciz():'';
    if(ic && hedef.innerHTML!==ic) hedef.innerHTML=ic;
  }, 2500);
}

function siberEkHTML(){
  var h='';
  if(K2.ghsa && K2.ghsa.length){
    h+=k2Kart('🐙 GITHUB ADVISORY (yeni açık kaynak açıkları)', '<table class="tbl">'+
      K2.ghsa.slice(0,8).map(function(a){
        var r=(a.seviye==='critical'?'var(--hata)':(a.seviye==='high'?'#f97316':'var(--vurgu)'));
        return '<tr><td class="k">'+esc(a.id)+'<br><span class="soluk">'+esc(a.cve)+'</span></td>'
          +'<td class="v" style="font-size:10px">'+esc(a.ozet)+'<br><span class="soluk">'+esc(a.paket)+' · '+esc(a.yayim)+'</span></td>'
          +'<td class="v" style="color:'+r+'"><b>'+esc(a.seviye)+'</b></td></tr>';
      }).join('')+'</table>');
  }
  if(K2.cisa && K2.cisa.length){
    h+=k2Kart('📢 CISA GÜVENLİK BİLDİRİMLERİ', '<div class="nkListe">'+
      K2.cisa.slice(0,7).map(function(x){ return '<div class="nkOge">• '+(x.bag? '<a href="'+esc(x.bag)+'" target="_blank" style="color:var(--ana2)">'+esc(x.baslik)+'</a>' : esc(x.baslik))+'</div>'; }).join('')+'</div>');
  }
  if(K2.nuclei && K2.nuclei.length){
    h+=k2Kart('🧬 NUCLEI ŞABLON DEPOLARI (güncel)', '<table class="tbl">'+
      K2.nuclei.map(function(n){ return '<tr><td class="k">'+esc(n.ad)+'</td><td class="v" style="font-size:10px">'+esc(n.aciklama||'-')+'<br><span class="soluk">⭐ '+n.yildiz+' · '+esc(n.guncel)+'</span></td></tr>'; }).join('')+'</table>');
  }
  if(CANLI_HAM.kotuip && CANLI_HAM.kotuip.length){
    var t=CANLI_HAM.kotuIpToplam||{};
    h+=k2Kart('⛔ KÖTÜ ŞÖHRETLİ IP (FireHOL level1 + level2)', '<table class="tbl">'+
      CANLI_HAM.kotuip.slice(0,12).map(function(x){ return '<tr><td class="k">'+esc(x.ip)+'</td><td class="v">'+esc(x.ulke)+' · '+esc(x.iss)+'</td><td class="v"><span class="soluk">'+esc(x.kaynak)+'</span></td></tr>'; }).join('')+'</table>'+
      '<div class="uyari">Liste büyüklüğü: FireHOL level1 '+(t['FireHOL level1']||0)+' ağ · level2 '+(t['FireHOL level2']||0)+' ağ — örnekleme gösterilir (konumlandırma: ip-api).</div>');
  }
  if(K2.guvenlikHaber && K2.guvenlikHaber.length){
    h+=k2Kart('📰 GÜVENLİK HABERLERİ', '<div class="nkListe">'+K2.guvenlikHaber.slice(0,10).map(function(x){
      var t2=x.tarih? new Date(x.tarih).toLocaleDateString('tr-TR') : '';
      return '<div class="nkOge"><span class="soluk">'+esc(x.kaynak||'-')+' · '+esc(t2)+'</span><br>'
        +(x.bag? '<a href="'+esc(x.bag)+'" target="_blank" style="color:var(--ana2)">'+esc(x.baslik)+'</a>': esc(x.baslik))+'</div>';
    }).join('')+'</div>');
  }
  return h;
}
function siberEkYukle(){
  var isler=[];
  if(!K2.ghsa) isler.push(ghsaYukle());
  if(!K2.cisa) isler.push(cisaYukle());
  if(!K2.nuclei) isler.push(nucleiYukle());
  if(!K2.guvenlikHaber) isler.push(guvenlikHaberYukle());
  if(!CANLI.kotuip || !CANLI.kotuip.length) isler.push(kotuIpYukle());
  return Promise.all(isler.map(function(x){ return x.catch(function(){ return null; }); }));
}
function uzayEkHTML(){
  var h='';
  if(K2.swpcUyari && K2.swpcUyari.length){
    h+=k2Kart('📡 NOAA UZAY HAVASI UYARILARI', '<div class="nkListe">'+K2.swpcUyari.slice(0,6).map(function(x){
      return '<div class="nkOge"><b>'+esc(x.urun)+'</b> <span class="soluk">'+esc(String(x.zaman||'').slice(0,16))+'</span><br><span style="font-size:10px">'+esc(x.metin)+'</span></div>';
    }).join('')+'</div>');
  }
  if(K2.gunesDongu && K2.gunesDongu.length){
    h+=k2Kart('☀ GÜNEŞ LEKESİ DÖNGÜSÜ (son '+K2.gunesDongu.length+' ay · gerçek veri)',
      '<div class="grafikKutu"><svg width="100%" height="46" viewBox="0 0 300 46" preserveAspectRatio="none">'+
      (function(){
        var en=1;
        for(var i=0;i<K2.gunesDongu.length;i++) if(K2.gunesDongu[i].ssn>en) en=K2.gunesDongu[i].ssn;
        var yol='';
        for(var j=0;j<K2.gunesDongu.length;j++){
          var x=Math.round(j*300/(K2.gunesDongu.length-1)), y=Math.round(44-(K2.gunesDongu[j].ssn/en)*40);
          yol+=(j?' L':'M')+x+','+y;
        }
        return '<path d="'+yol+'" fill="none" stroke="#fbbf24" stroke-width="1.4"/>';
      })()+'</svg><div class="grafikBaslik"><span>son ay</span><b style="color:#fbbf24">'+K2.gunesDongu[K2.gunesDongu.length-1].ssn+'</b><span class="soluk">'+esc(K2.gunesDongu[K2.gunesDongu.length-1].ay)+'</span></div></div>');
  }
  if(K2.donki && K2.donki.length){
    h+=k2Kart('💥 GÜNEŞ PATLAMALARI (NASA DONKI · son 14 gün)', '<table class="tbl">'+
      K2.donki.slice(0,8).map(function(x){ return '<tr><td class="k">'+esc(x.sinif)+'</td><td class="v" style="font-size:10px">'+esc(x.baslangic)+' · bölge '+esc(String(x.bolge))+'</td></tr>'; }).join('')+'</table>');
  } else if(K2.donki){
    h+=k2Kart('💥 GÜNEŞ PATLAMALARI (NASA DONKI)', '<div class="uyari">Son 14 günde kayıtlı patlama yok (sakin dönem).</div>');
  }
  if(K2.issKonum){
    h+=k2Kart('🛰 ISS CANLI KONUM (wheretheiss.at)', '<table class="tbl">'
      +satir('enlem', K2.issKonum.latitude.toFixed(3)+'°')+satir('boylam', K2.issKonum.longitude.toFixed(3)+'°')
      +satir('yükseklik', Math.round(K2.issKonum.altitude)+' km')+satir('hız', Math.round(K2.issKonum.velocity)+' km/s')+'</table>');
  }
  return h;
}
function uzayEkYukle(){
  var isler=[];
  if(!K2.swpcUyari) isler.push(swpcUyariYukle());
  if(!K2.gunesDongu) isler.push(gunesDonguYukle());
  if(!K2.donki) isler.push(donkiYukle());
  if(!K2.issKonum) isler.push(issKonumYukle());
  return Promise.all(isler.map(function(x){ return x.catch(function(){ return null; }); }));
}
function uyariEkHTML(){
  if(!K2.nwsUyari) return '';
  if(!K2.nwsUyari.length) return '';
  return k2Kart('🌊 NOAA / NWS AKTİF UYARILAR (tsunami · fırtına · sel · '+K2.nwsUyari.length+')', '<div class="nkListe">'+
    K2.nwsUyari.slice(0,10).map(function(x){
      return '<div class="nkOge"><b>'+esc(x.tur)+'</b> · '+esc(String(x.baslik).slice(0,110))+'<br><span class="soluk">'+esc(x.bolge)+' · '+esc(String(x.zaman).slice(0,16))+'</span></div>';
    }).join('')+'</div>');
}
function uyariEkYukle(){ if(!K2.nwsUyari) return uyariAkisYukle().catch(function(){ return null; }); return Promise.resolve(); }
function haberEkHTML(){
  if(!K2.guvenlikHaber || !K2.guvenlikHaber.length) return '';
  var ic='';
  for(var i=0;i<Math.min(K2.guvenlikHaber.length,12);i++){
    var x=K2.guvenlikHaber[i];
    var t=x.tarih? new Date(x.tarih).toLocaleDateString('tr-TR') : '';
    ic+='<div class="nkOge"><span class="soluk">'+esc(x.kaynak||'-')+' · '+esc(t)+'</span><br>'
      +(x.bag? '<a href="'+esc(x.bag)+'" target="_blank" style="color:var(--ana2)">'+esc(x.baslik)+'</a>' : esc(x.baslik))+'</div>';
  }
  return k2Kart('📰 GÜVENLİK HABERLERİ (The Hacker News · BleepingComputer · Krebs)', '<div class="nkListe">'+ic+'</div>');
}
function haberEkYukle(){ if(!K2.guvenlikHaber) return guvenlikHaberYukle().catch(function(){ return null; }); return Promise.resolve(); }
function digerEkHTML(){
  var d=K2.dunyaBankasi; if(!d) return '';
  function bul(x){ if(!x||!x.length) return '-'; for(var i=0;i<x.length;i++){ if(x[i] && x[i].value!=null) return x[i].value.toLocaleString('tr-TR',{maximumFractionDigits:2})+' ('+x[i].date+')'; } return '-'; }
  return k2Kart('🏦 DÜNYA BANKASI — TÜRKİYE GÖSTERGELERİ', '<table class="tbl">'
    +satir('GSYH (USD)', bul(d.gsyh))+satir('enflasyon (%)', bul(d.enflasyon))+satir('nüfus', bul(d.nufus))
    +'</table><div class="uyari">Kaynak: World Bank API — açık veri, hesapsız.</div>');
}
function digerEkYukle(){ if(!K2.dunyaBankasi) return dunyaBankasiYukle().catch(function(){ return null; }); return Promise.resolve(); }

/* ============================================================
   7) PANEL KANCALARI + ÇİZİM
   ============================================================ */
(function(){
  if(typeof tehditPanelYaz==='function'){
    var _eskiTPY=tehditPanelYaz;
    tehditPanelYaz=function(){
      _eskiTPY();
      siberEkYukle().then(function(){
        var el=$('sonuc_tehdit'); if(!el) return;
        if($('ek_tehdit')) $('ek_tehdit').innerHTML=siberEkHTML();
        else el.insertAdjacentHTML('beforeend','<div id="ek_tehdit">'+siberEkHTML()+'</div>');
      });
    };
    ekBolumKoru('tehdit','ek_tehdit', siberEkHTML);
  }
  if(typeof uzayPanelYaz==='function'){
    var _eskiUPY=uzayPanelYaz;
    uzayPanelYaz=function(){
      _eskiUPY();
      uzayEkYukle().then(function(){
        var el=$('sonuc_uzay'); if(!el) return;
        if($('ek_uzay')) $('ek_uzay').innerHTML=uzayEkHTML();
        else el.insertAdjacentHTML('beforeend','<div id="ek_uzay">'+uzayEkHTML()+'</div>');
      });
    };
    ekBolumKoru('uzay','ek_uzay', uzayEkHTML);
  }
  if(typeof uyariPanel==='function'){
    var _eskiUyariPanel=uyariPanel;
    uyariPanel=function(zorla){
      _eskiUyariPanel(zorla);
      uyariEkYukle().then(function(){
        var el=$('sonuc_uyari'); if(!el) return;
        if($('ek_uyari')) $('ek_uyari').innerHTML=uyariEkHTML();
        else el.insertAdjacentHTML('beforeend','<div id="ek_uyari">'+uyariEkHTML()+'</div>');
      });
    };
    ekBolumKoru('uyari','ek_uyari', uyariEkHTML);
  }
  if(typeof haberCek==='function'){
    var _eskiHaberCek=haberCek;
    haberCek=function(kaynak){
      _eskiHaberCek(kaynak);
      haberEkYukle().then(function(){
        var el=$('sonuc_haber'); if(!el) return;
        if($('ek_haber')) $('ek_haber').innerHTML=haberEkHTML();
        else el.insertAdjacentHTML('beforeend','<div id="ek_haber">'+haberEkHTML()+'</div>');
      });
    };
    ekBolumKoru('haber','ek_haber', haberEkHTML);
  }
  if(typeof digerHTML==='function'){
    ekBolumKoru('diger','ek_diger', digerEkHTML);
    setTimeout(function(){ digerEkYukle(); }, 8000);
  }
  /* katman noktaları */
  if(typeof canliNoktalar==='function'){
    var eskiCN=canliNoktalar;
    canliNoktalar=function(){
      var out=eskiCN();
      try{
        if(KATMAN.emsc && CANLI.emsc) for(var i=0;i<CANLI.emsc.length;i++) out.push(CANLI.emsc[i]);
        if(KATMAN.kotuip && CANLI.kotuip) for(var j=0;j<CANLI.kotuip.length;j++) out.push(CANLI.kotuip[j]);
      }catch(e){}
      return out;
    };
  }
  if(typeof ZAMAN_PLANI!=='undefined'){
    ZAMAN_PLANI.push({id:'emsc', ad:'EMSC depremleri', fn:emscYukle, aralik:300000, ilk:20000});
    ZAMAN_PLANI.push({id:'kotuip', ad:'Kötü şöhretli IP (FireHOL)', fn:kotuIpYukle, aralik:1800000, ilk:90000});
  }
})();
