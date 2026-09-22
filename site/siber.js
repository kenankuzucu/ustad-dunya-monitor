/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — SİBER TEHDİT / IOC MODÜLÜ  (v5.0)
   Kullanıcının verdiği 6 kategori / 63 kaynak + canlı IOC akışı
   index.html + katmanlar.js'ten SONRA yüklenir.
   ============================================================ */

/* ---------- kaynak kütüphanesi: durum kodları ----------
   canli   : doğrulandı, tarayıcıdan doğrudan canlı çekiliyor
   besleme : RSS/JSON besleme var; vekil (rss2json / r.jina.ai) ile çekilir
   anahtar : API anahtarı gerekiyor
   kayit   : ücretsiz kayıt/başvuru gerekiyor
   baglanti: canlı çekilemiyor, sayfaya bağlantı verilir
--------------------------------------------------------- */
var SIBER_KAYNAKLAR=[
 {ad:'1 · SİBER TEHDİT / IOC', kaynaklar:[
   {ad:'CISA KEV (sömürülen zafiyetler)', u:'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', d:'canli',
    n:'ABD resmî listesi · panelde CANLI akıyor (son eklenen zafiyetler)'},
   {ad:'abuse.ch — URLhaus', u:'https://urlhaus.abuse.ch/', d:'canli',
    n:'Aktif zararlı URL listesi · anahtarsız genel bloklist panelde CANLI akıyor (API için ücretsiz Auth-Key ayrıca alınabilir)'},
   {ad:'abuse.ch — MalwareBazaar', u:'https://bazaar.abuse.ch/', d:'anahtar',
    n:'Zararlı yazılım örnekleri · ücretsiz Auth-Key gerekir'},
   {ad:'abuse.ch — ThreatFox', u:'https://threatfox.abuse.ch/', d:'anahtar',
    n:'IOC veritabanı · ücretsiz Auth-Key gerekir'},
   {ad:'AlienVault OTX', u:'https://otx.alienvault.com/', d:'anahtar',
    n:'Topluluk tehdit istihbaratı · ücretsiz OTX API anahtarı gerekir'},
   {ad:'MISP', u:'https://www.misp-project.org/', d:'baglanti',
    n:'Kendi MISP sunucun olmalı (kurumsal); herkese açık veri yok'},
   {ad:'CIRCL (MISP OSINT beslemesi)', u:'https://www.circl.lu/doc/misp/feed-osint/', d:'canli',
    n:'Lüksemburg CERT açık OSINT beslemesi · panelde CANLI (vekil ile)'},
   {ad:'Spamhaus (ASN-DROP)', u:'https://www.spamhaus.org/drop/', d:'canli',
    n:'En kötü şöhretli ağ blokları · panelde CANLI (vekil ile)'},
   {ad:'Shadowserver', u:'https://www.shadowserver.org/', d:'kayit',
    n:'Günlük raporlar üyelik/başvuru gerektirir'},
   {ad:'PhishTank', u:'https://phishtank.org/', d:'anahtar',
    n:'API anahtarı gerekiyor · panelde canlı alternatif: OpenPhish'}
 ]},
 {ad:'2 · SİBER SALDIRI ARAŞTIRMASI', kaynaklar:[
   {ad:'Microsoft Threat Intelligence', u:'https://www.microsoft.com/en-us/security/blog/', d:'besleme', n:'Blog beslemesi'},
   {ad:'Google Threat Intelligence', u:'https://cloud.google.com/blog/topics/threat-intelligence', d:'besleme', n:'Blog beslemesi'},
   {ad:'Cisco Talos', u:'https://blog.talosintelligence.com/', d:'besleme', n:'Blog beslemesi'},
   {ad:'Fortinet FortiGuard Labs', u:'https://www.fortinet.com/blog/threat-research', d:'besleme', n:'Blog beslemesi'},
   {ad:'Palo Alto Unit 42', u:'https://unit42.paloaltonetworks.com/', d:'besleme', n:'Blog beslemesi'},
   {ad:'CrowdStrike', u:'https://www.crowdstrike.com/en-us/blog/', d:'besleme', n:'Blog beslemesi'},
   {ad:'SentinelLabs', u:'https://www.sentinelone.com/labs/', d:'besleme', n:'Blog beslemesi'},
   {ad:'ESET Research', u:'https://www.welivesecurity.com/', d:'canli', n:'Besleme tarayıcıdan doğrudan çekiliyor'},
   {ad:'Kaspersky (Securelist)', u:'https://securelist.com/', d:'besleme', n:'Blog beslemesi'},
   {ad:'Sophos X-Ops', u:'https://news.sophos.com/en-us/category/threat-research/', d:'besleme', n:'Blog beslemesi'}
 ]},
 {ad:'3 · KÜRESEL SUÇ / DOLANDIRICILIK', kaynaklar:[
   {ad:'INTERPOL', u:'https://www.interpol.int/News-and-Events', d:'baglanti', n:'Haber beslemesi kapalı (503)'},
   {ad:'Europol', u:'https://www.europol.europa.eu/newsroom', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'FBI', u:'https://www.fbi.gov/news/press-releases', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'FTC', u:'https://www.ftc.gov/news-events/news/press-releases', d:'baglanti', n:'Besleme erişilemedi'},
   {ad:'U.S. Secret Service', u:'https://www.secretservice.gov/newsroom', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'UNODC', u:'https://www.unodc.org/unodc/en/press/releases.html', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'FATF', u:'https://www.fatf-gafi.org/', d:'baglanti', n:'Besleme 403 veriyor'},
   {ad:'FinCEN', u:'https://www.fincen.gov/news-room', d:'baglanti', n:'Canlı besleme yok'}
 ]},
 {ad:'4 · DEZENFORMASYON / BİLGİ MANİPÜLASYONU', kaynaklar:[
   {ad:'EEAS / EUvsDisinfo', u:'https://euvsdisinfo.eu/', d:'canli', n:'Besleme tarayıcıdan doğrudan çekiliyor'},
   {ad:'Bellingcat', u:'https://www.bellingcat.com/', d:'besleme', n:'Blog beslemesi'},
   {ad:'C2PA', u:'https://c2pa.org/', d:'besleme', n:'Blog beslemesi (içerik doğrulama standardı)'},
   {ad:'AFP Fact Check', u:'https://factcheck.afp.com/', d:'baglanti', n:'Besleme 403 veriyor'},
   {ad:'Reuters Fact Check', u:'https://www.reuters.com/fact-check/', d:'baglanti', n:'Reuters RSS yayınını kapattı'},
   {ad:'AP Fact Check', u:'https://apnews.com/hub/ap-fact-check', d:'baglanti', n:'RSS beslemesi yok'}
 ]},
 {ad:'5 · HABER / OLAY AKIŞI', kaynaklar:[
   {ad:'Reuters', u:'https://www.reuters.com/', d:'baglanti', n:'RSS kapalı (site JS ile çalışıyor)'},
   {ad:'Associated Press', u:'https://apnews.com/', d:'baglanti', n:'RSS beslemesi yok'},
   {ad:'BBC', u:'https://www.bbc.com/news', d:'besleme', n:'Panelde canlı (HABER sekmesi)'},
   {ad:'DW', u:'https://www.dw.com/', d:'canli', n:'DW Türkçe beslemesi canlı çekiliyor'},
   {ad:'France 24', u:'https://www.france24.com/', d:'besleme', n:'Besleme var'},
   {ad:'Al Jazeera', u:'https://www.aljazeera.com/', d:'besleme', n:'Panelde canlı (HABER sekmesi)'},
   {ad:'VOA', u:'https://www.voanews.com/', d:'besleme', n:'Besleme var'},
   {ad:'Euronews', u:'https://www.euronews.com/', d:'besleme', n:'Besleme var'},
   {ad:'The Guardian', u:'https://www.theguardian.com/', d:'besleme', n:'Panelde canlı (HABER sekmesi)'},
   {ad:'NPR', u:'https://www.npr.org/', d:'canli', n:'Besleme tarayıcıdan doğrudan çekiliyor'}
 ]},
 {ad:'6 · TÜRKİYE KAYNAKLARI', kaynaklar:[
   {ad:'İçişleri Bakanlığı', u:'https://www.icisleri.gov.tr/', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'Emniyet Genel Müdürlüğü', u:'https://www.egm.gov.tr/', d:'baglanti', n:'Site erişilemedi'},
   {ad:'Jandarma Genel Komutanlığı', u:'https://www.jandarma.gov.tr/', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'Siber Güvenlik Başkanlığı', u:'https://www.siberguvenlik.gov.tr/', d:'baglanti', n:'Site açılıyor, takip edilebilir besleme yok'},
   {ad:'BTK', u:'https://www.btk.gov.tr/', d:'besleme', n:'BTK haber/duyuru beslemesi var'},
   {ad:'USOM', u:'https://www.usom.gov.tr/', d:'baglanti', n:'Eski JSON API kapatıldı (artık Swagger arayüzü)'},
   {ad:'AFAD', u:'https://www.afad.gov.tr/', d:'baglanti', n:'Sunucu erişilemedi / API anahtarı gerekiyor'},
   {ad:'MASAK', u:'https://www.masak.gov.tr/', d:'baglanti', n:'Canlı besleme yok'},
   {ad:'TÜİK', u:'https://data.tuik.gov.tr/', d:'baglanti', n:'Veri portalı; anahtarsız canlı uç yok'},
   {ad:'Anadolu Ajansı', u:'https://www.aa.com.tr/', d:'besleme', n:'Panelde canlı (TÜRKİYE haber sekmesi)'}
 ]}
];
var DURUM_AD={ canli:'CANLI ÇEKİLİYOR', besleme:'BESLEME (vekil)', anahtar:'ANAHTAR GEREKİR', kayit:'KAYIT GEREKİR', baglanti:'BAĞLANTI' };

/* ---------- yardımcılar ---------- */
function jinaMetin(url, ms){
  return metinCek('https://r.jina.ai/'+url, ms||40000)
    .catch(function(){
      /* yedek vekil: allorigins (CORS açık) */
      return fetchJSON('https://api.allorigins.win/get?url='+encodeURIComponent(url), ms||40000)
        .then(function(d){ return (d && d.contents) ? d.contents : ''; });
    });
}
function jinaJSON(url, ms){
  return jinaMetin(url, ms).then(function(t){
    var i=t.indexOf('{'), j=t.indexOf('[');
    var b=(i>=0 && (j<0 || i<j)) ? i : j;
    if(b<0) throw new Error('veri bulunamadı');
    return JSON.parse(t.slice(b));
  });
}
function anahtarAl(ad){ try{ return localStorage.getItem('ustad_'+ad)||''; }catch(e){ return ''; } }
function anahtarKaydet(ad, deger){ try{ localStorage.setItem('ustad_'+ad, deger); }catch(e){} }

/* ---------- CANLI IOC ÇEKİCİLERİ ---------- */
function openphishYukle(){
  /* OpenPhish resmî beslemesi tarayıcıda engelliyor; GitHub aynası CORS açık ve hızlı */
  return metinCek('https://raw.githubusercontent.com/openphish/public_feed/main/feed.txt', 25000)
    .catch(function(){ return metinCek('https://openphish.com/feed.txt', 20000); })
    .catch(function(){ return jinaMetin('https://openphish.com/feed.txt', 35000); })
    .then(function(t){
      var satir=String(t).split(/\r?\n/).map(function(x){ return x.trim(); }).filter(function(x){ return x.indexOf('http')===0; });
      if(!satir.length) throw new Error('kimlik avı listesi boş');
      CANLI_HAM.openphish=satir.slice(0,80);
      return satir.length+' kimlik avı URL\'si';
    });
}
function urlhausBlokYukle(){
  /* URLhaus anahtarsız GENEL bloklist (API değil, indirilebilir liste) */
  return jinaMetin('https://urlhaus.abuse.ch/downloads/text_online/', 45000).then(function(t){
    var satir=String(t).split(/\r?\n/).map(function(x){ return x.trim(); })
      .filter(function(x){ return x.indexOf('http')===0; });
    CANLI_HAM.urlhausBlok=satir.slice(0,60);
    return satir.length+' zararlı URL (URLhaus genel liste)';
  });
}
function cisaKevYukle(){
  return jinaJSON('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', 60000).then(function(d){
    var l=(d && d.vulnerabilities) ? d.vulnerabilities : [];
    l.sort(function(a,b){ return String(b.dateAdded||'').localeCompare(String(a.dateAdded||'')); });
    CANLI_HAM.cisaKev={ toplam:l.length, son:l.slice(0,15), surum:d.catalogVersion||'' };
    return l.length+' bilinen sömürülen zafiyet';
  });
}
function spamhausYukle(){
  /* ASN-DROP dosyası satır satır JSON (NDJSON) — tek JSON değil */
  return jinaMetin('https://www.spamhaus.org/drop/asndrop.json', 45000).then(function(t){
    var i=t.indexOf('{'); if(i>0) t=t.slice(i);
    var l=[];
    String(t).split(/\r?\n/).forEach(function(satir){
      satir=satir.trim();
      if(satir.charAt(0)!=='{') return;
      try{ var o=JSON.parse(satir); if(o && o.asn!=null) l.push(o); }catch(e){}
    });
    if(!l.length){
      /* yedek: dizi biçiminde gelirse */
      try{ var d=JSON.parse(t); if(Array.isArray(d)) l=d; }catch(e){}
    }
    if(!l.length) throw new Error('ASN listesi boş');
    CANLI_HAM.spamhaus={ toplam:l.length, liste:l.slice(0,12) };
    return l.length+' kötü şöhretli ASN';
  });
}
function circlYukle(){
  return jinaJSON('https://www.circl.lu/doc/misp/feed-osint/manifest.json', 60000).then(function(d){
    var anahtar=Object.keys(d||{});
    CANLI_HAM.circl={ toplam:anahtar.length,
      son:anahtar.slice(-12).map(function(k){ return { ad:k, tarih:(d[k]&&d[k].timestamp)?new Date(d[k].timestamp*1000).toLocaleString('tr-TR'):'' }; }) };
    return anahtar.length+' OSINT olayı (CIRCL)';
  });
}
/* abuse.ch + OTX: ücretsiz anahtar girilirse canlı */
function urlhausYukle(){
  var k=anahtarAl('abusech');
  if(!k) return Promise.reject(new Error('abuse.ch Auth-Key girilmedi'));
  return fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', { method:'POST', headers:{ 'Auth-Key':k, 'Content-Type':'application/x-www-form-urlencoded' }, body:'' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){
      var l=(d && d.urls) ? d.urls : [];
      CANLI_HAM.urlhaus=l.slice(0,25);
      return l.length+' zararlı URL (URLhaus)';
    });
}
function malwareBazaarYukle(){
  var k=anahtarAl('abusech');
  if(!k) return Promise.reject(new Error('abuse.ch Auth-Key girilmedi'));
  return fetch('https://mb-api.abuse.ch/api/v1/', { method:'POST', headers:{ 'Auth-Key':k, 'Content-Type':'application/x-www-form-urlencoded' }, body:'query=get_recent&selector=time' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){
      var l=(d && d.data && d.data.length)? d.data : [];
      CANLI_HAM.mbazaar=l.slice(0,20);
      return l.length+' zararlı örnek (MalwareBazaar)';
    });
}
function threatfoxYukle(){
  var k=anahtarAl('abusech');
  if(!k) return Promise.reject(new Error('abuse.ch Auth-Key girilmedi'));
  return fetch('https://threatfox-api.abuse.ch/api/v1/', { method:'POST', headers:{ 'Auth-Key':k, 'Content-Type':'application/json' }, body:JSON.stringify({ query:'get_iocs', days:1 }) })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){
      var l=(d && d.data && d.data.length)? d.data : [];
      CANLI_HAM.threatfox=l.slice(0,20);
      return l.length+' IOC (ThreatFox)';
    });
}
function otxYukle(){
  var k=anahtarAl('otx');
  if(!k) return Promise.reject(new Error('OTX API anahtarı girilmedi'));
  return fetch('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20', { headers:{ 'X-OTX-API-KEY':k } })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){
      var l=(d && d.results)? d.results : [];
      CANLI_HAM.otx=l.slice(0,20);
      return l.length+' OTX nabzı';
    });
}

/* ---------- PANEL ---------- */
function tehditPanel(zorla){
  /* panel ANINDA çizilir; ağır kaynaklar arkada doldurulur */
  tehditPanelYaz();
  if(typeof durum==='function') durum('tehdit','canlı kaynaklar çekiliyor…');
  var ISLER=[
    ['openphish',      function(){ return openphishYukle(); }],
    ['cisaKev',        function(){ return cisaKevYukle(); }],
    ['spamhaus',       function(){ return spamhausYukle(); }],
    ['circl',          function(){ return circlYukle(); }],
    ['urlhausBlok',    function(){ return urlhausBlokYukle(); }]
  ];
  var hepsi=[];
  for(var i=0;i<ISLER.length;i++){
    (function(id, fn){
      if(!zorla && CANLI_HAM[id] && id!=='openphish') return;
      if(id==='openphish' && !zorla && CANLI_HAM.openphish && CANLI_HAM.openphish.length) return;
      var p=fn().then(function(m){
        if(m) CANLI_HAM['son_'+id]=m;
        tehditPanelYaz();
        if(typeof durum==='function') durum('tehdit','✔ '+m);
      }).catch(function(){ tehditPanelYaz(); });
      hepsi.push(p);
    })(ISLER[i][0], ISLER[i][1]);
  }
  Promise.all(hepsi).then(function(){ tehditAnahtarlariDene(); });
}
function tehditAnahtarKaydet(ad){
  var el=$('anahtar_'+ad); if(!el) return;
  anahtarKaydet(ad, el.value.trim());
  TEHDIT_ANA_DENENDI=true;
  tehditAnahtarDene(ad);
}
function tehditAnahtarDene(ad){
  var fn=(ad==='abusech')? urlhausYukle : (ad==='otx'? otxYukle : null);
  if(!fn){ return; }
  durum('tehdit','anahtar sınanıyor…');
  fn().then(function(m){ durum('tehdit','✔ '+m); tehditPanelYaz(); })
      .catch(function(e){ durum('tehdit','✘ '+String(e.message||e)); });
}
var TEHDIT_ANA_DENENDI=false;
function tehditAnahtarlariDene(){
  if(TEHDIT_ANA_DENENDI) return;   /* döngüyü önler: panel başına bir kez */
  TEHDIT_ANA_DENENDI=true;
  if(anahtarAl('abusech')){
    urlhausYukle().then(function(){ malwareBazaarYukle().then(function(){ threatfoxYukle().then(tehditPanelYaz).catch(tehditPanelYaz); }).catch(tehditPanelYaz); }).catch(function(){});
  }
  if(anahtarAl('otx')){ otxYukle().then(tehditPanelYaz).catch(function(){}); }
}
function tehditPanelYaz(){
  var h='';
  /* 1) canlı IOC blokları */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:0 0 8px">CANLI IOC AKIŞI</h3>';
  var op=CANLI_HAM.openphish||[];
  h+='<div class="haberSatir"><div class="kaynak">OPENPHISH · KİMLİK AVI (PHISHING)</div><div class="baslik" style="font-size:18px">'+op.length+' aktif kimlik avı URL\'si</div>'
   +'<div class="tarih">kaynak: openphish resmî beslemesi (GitHub aynası) · PhishTank anahtar istediği için canlı alternatif</div></div>';
  if(op.length){
    h+='<div class="kartListe" style="max-height:260px;overflow-y:auto">';
    for(var i=0;i<Math.min(op.length,60);i++){
      var u=op[i];
      h+='<div class="haberSatir" style="padding:6px 10px"><div class="zaman" style="font-size:10px;word-break:break-all">'+esc(u)+'</div></div>';
    }
    h+='</div>';
  }
  var ub=CANLI_HAM.urlhausBlok||[];
  if(ub.length){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">URLHAUS · AKTİF ZARARLI URL\'LER (anahtarsız genel liste · '+ub.length+')</h3>';
    h+='<div class="kartListe" style="max-height:200px;overflow-y:auto">';
    for(var q=0;q<ub.length;q++){
      h+='<div class="haberSatir" style="padding:6px 10px"><div class="zaman" style="font-size:10px;word-break:break-all">'+esc(ub[q])+'</div></div>';
    }
    h+='</div>';
  }
  var kev=CANLI_HAM.cisaKev;
  if(kev && kev.son){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">CISA KEV · BİLİNEN SÖMÜRÜLEN ZAFİYETLER (toplam '+kev.toplam+')</h3>';
    h+=tablo(['CVE','Ürün','Satıcı','Eklendi','Fidye yazılımı'], kev.son.map(function(v){
      return [v.cveID||'', v.product||'', v.vendorProject||'', v.dateAdded||'', (v.knownRansomwareCampaignUse||'')];
    }));
    h+='<div class="uyari">Katalog sürümü: '+esc(kev.surum||'-')+' · ABD Siber Güvenlik Ajansı (CISA) resmî listesi, günde bir güncellenir.</div>';
  }
  var sp=CANLI_HAM.spamhaus;
  if(sp && sp.liste){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">SPAMHAUS ASN-DROP · KÖTÜ ŞÖHRETLİ AĞLAR (toplam '+sp.toplam+')</h3>';
    h+=tablo(['ASN','Ağ adı','Ülke','Sektör','Kötüye kullanım oranı'], sp.liste.map(function(a){
      return [a.asn!=null?('AS'+a.asn):'-', a.asname||'-', a.cc||'-', a.domain||'-', a.abuse||'-'];
    }));
  }
  var ci=CANLI_HAM.circl;
  if(ci && ci.son){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">CIRCL MISP OSINT BESLEMESİ ('+ci.toplam+' olay)</h3>';
    h+=tablo(['Olay dosyası','Yayımlandı'], ci.son.map(function(o){ return [o.ad, o.tarih]; }));
  }
  /* 2) anahtar gerektirenler */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:18px 0 8px">ANAHTAR GEREKTİREN KAYNAKLAR (ücretsiz)</h3>';
  h+='<div class="linkKart"><div class="lkAd">abuse.ch — URLhaus · MalwareBazaar · ThreatFox</div>'
   +'<div class="lkNot">Ücretsiz Auth-Key: <a target="_blank" rel="noopener" href="https://auth.abuse.ch/">auth.abuse.ch</a> → kayıt ol → Auth-Key kopyala → aşağıya yapıştır. Girilince bu üç kaynak panelde CANLI akar.</div>'
   +'<div class="ucusAyar" style="padding:8px 0 0"><input id="anahtar_abusech" type="password" placeholder="abuse.ch Auth-Key" value="'+esc(anahtarAl('abusech'))+'"><button onclick="tehditAnahtarKaydet(\'abusech\')">KAYDET & DENE</button></div>'
   +(CANLI_HAM.urlhaus? '<div class="uyari">Son URLhaus kaydı: '+CANLI_HAM.urlhaus.length+' URL yüklendi.</div>':'')+'</div>';
  h+='<div class="linkKart" style="margin-top:10px"><div class="lkAd">AlienVault OTX</div>'
   +'<div class="lkNot">Ücretsiz API anahtarı: <a target="_blank" rel="noopener" href="https://otx.alienvault.com/api">otx.alienvault.com/api</a> → ayarlar → API anahtarı.</div>'
   +'<div class="ucusAyar" style="padding:8px 0 0"><input id="anahtar_otx" type="password" placeholder="OTX API anahtarı" value="'+esc(anahtarAl('otx'))+'"><button onclick="tehditAnahtarKaydet(\'otx\')">KAYDET & DENE</button></div></div>';
  if(CANLI_HAM.threatfox){
    h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ThreatFox SON IOC\'LER ('+CANLI_HAM.threatfox.length+')</h3>';
    h+=tablo(['IOC','Tür','Zararlı ailesi','Güven'], CANLI_HAM.threatfox.map(function(x){ return [x.ioc||'', x.ioc_type||'', x.malware_printable||'', x.confidence_level||'']; }));
  }
  h+='<div class="uyari">Tüm veriler yalnızca savunma amaçlı, halka açık kaynaklardan okunur. Anahtarların yalnızca bu bilgisayarın tarayıcısında (localStorage) saklanır, hiçbir yere gönderilmez.</div>';
  if(typeof ekTehditHTML==='function'){ try{ h+=ekTehditHTML(); }catch(e){} }
  /* 3) kaynak kütüphanesi */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:20px 0 8px">KAYNAK KÜTÜPHANESİ · 6 KATEGORİ / 54 KAYNAK</h3>';
  h+=siberKaynaklarHTML();
  $('sonuc_tehdit').innerHTML=h;
  if(typeof durum==='function') durum('tehdit','✔ canlı IOC akışı yüklendi');
  tehditAnahtarlariDene();
}
function siberKaynaklarHTML(){
  var h='';
  for(var i=0;i<SIBER_KAYNAKLAR.length;i++){
    var kat=SIBER_KAYNAKLAR[i], canliSay=0, beslemeSay=0;
    for(var c=0;c<kat.kaynaklar.length;c++){ if(kat.kaynaklar[c].d==='canli') canliSay++; else if(kat.kaynaklar[c].d==='besleme') beslemeSay++; }
    h+='<div class="linkKart" style="margin-top:10px"><div class="lkAd">'+esc(kat.ad)+' <span class="soluk" style="font-size:10px">('+kat.kaynaklar.length+' kaynak · '+canliSay+' canlı · '+beslemeSay+' besleme)</span></div>';
    for(var j=0;j<kat.kaynaklar.length;j++){
      var k=kat.kaynaklar[j];
      var renk = k.d==='canli'?'var(--vurgu)':(k.d==='besleme'?'#7dd3fc':(k.d==='anahtar'?'#fbbf24':'var(--yazi2)'));
      h+='<div class="katSat" style="align-items:flex-start;gap:8px;padding:5px 2px">'
       +'<span style="flex:0 0 auto;color:'+renk+';font-size:9px;border:1px solid '+renk+';border-radius:2px;padding:1px 4px;margin-top:1px">'+esc(DURUM_AD[k.d]||'')+'</span>'
       +'<span><a target="_blank" rel="noopener" href="'+esc(k.u)+'" style="font-size:11.5px">'+esc(k.ad)+'</a>'
       +'<span class="soluk" style="display:block;font-size:10px;line-height:1.45">'+esc(k.n||'')+'</span></span></div>';
    }
    h+='</div>';
  }
  return h;
}
