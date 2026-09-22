/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — GÖRSEL KATMANLAR (v5.1)
   Küre dokusu · zaman makinesi · uydu yörünge izleri · uçak/gemi izleri ·
   deprem dalga animasyonu · Türkiye hava sahası · ISS canlı kamera ·
   çıplak gözle görülebilir uydular · HF propagasyon
   ============================================================ */

/* ---------------- 1) KÜRE DOKUSU SEÇİCİ ---------------- */
var DOKULAR=[
 {id:'gece',    ad:'GECE (varsayılan)', u:'https://unpkg.com/three-globe/example/img/earth-night.jpg'},
 {id:'gunduz',  ad:'GÜNDÜZ (mavi mermer)', u:'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'},
 {id:'toprak',  ad:'TOPRAK (gündüz)', u:'https://unpkg.com/three-globe/example/img/earth-day.jpg'},
 {id:'karanlik',ad:'KARANLIK', u:'https://unpkg.com/three-globe/example/img/earth-dark.jpg'}
];
var DOKU='gece';
function dokuSec(id){
  DOKU=id;
  var d=null; for(var i=0;i<DOKULAR.length;i++){ if(DOKULAR[i].id===id) d=DOKULAR[i]; }
  if(d && KURE){ try{ KURE.globeImageUrl(d.u); }catch(e){} }
  try{ localStorage.setItem('ustad_doku', id); }catch(e){}
  var btns=document.querySelectorAll('.dokuBtn');
  for(var b=0;b<btns.length;b++){ btns[b].className='dokuBtn'+(btns[b].getAttribute('data-d')===id?' aktif':''); }
  if(typeof durum==='function') durum('harita','✔ küre dokusu: '+(d?d.ad:id));
}
function dokuGeriYukle(){ try{ var k=localStorage.getItem('ustad_doku'); if(k) DOKU=k; }catch(e){} }

/* ---------------- 2) ZAMAN MAKİNESİ ---------------- */
var ZAMAN_VERI=[], ZAMAN_PENCERE=720, ZAMAN_TICK=null;
function zamanVerisiYukle(){
  durum('harita','zaman makinesi verisi çekiliyor…');
  var vaatler=[
    fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson', 40000).catch(function(){return null;}),
    fetchJSON('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=300', 40000).catch(function(){return null;}),
    fetchJSON('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR&alertlevel=Green;Orange;Red', 40000).catch(function(){return null;})
  ];
  return Promise.all(vaatler).then(function(r){
    var out=[];
    var d0=r[0];
    if(d0 && d0.features) for(var i=0;i<d0.features.length;i++){
      var f=d0.features[i], p=f.properties||{}, g=f.geometry;
      if(!g||!g.coordinates) continue;
      out.push({lat:g.coordinates[1], lng:g.coordinates[0], ts:p.time||0, renk:(p.mag>=6?'#ff3b3b':(p.mag>=5?'#ff8c1a':'#facc15')),
        cap:(p.mag>=6?0.8:0.5), ad:'M'+p.mag+' · '+(p.place||''), tur:'deprem'});
    }
    var d1=r[1];
    if(d1 && d1.events) for(var j=0;j<d1.events.length;j++){
      var e=d1.events[j]; if(!e.geometry||!e.geometry.length) continue;
      var gg=e.geometry[e.geometry.length-1], kt=(e.categories&&e.categories[0])?e.categories[0].title:'';
      var la=null, lo=null;
      if(gg.type==='Point'){ lo=gg.coordinates[0]; la=gg.coordinates[1]; }
      else if(gg.type==='Polygon'&&gg.coordinates&&gg.coordinates[0]&&gg.coordinates[0][0]){ lo=gg.coordinates[0][0][0]; la=gg.coordinates[0][0][1]; }
      if(la==null) continue;
      out.push({lat:la, lng:lo, ts:Date.parse(gg.date)||0, renk:RENK_OLAY[kt]||'#4ade80', cap:0.5, ad:e.title+' · '+kt, tur:'yangin'});
    }
    var d2=r[2];
    if(d2 && d2.features) for(var k=0;k<d2.features.length;k++){
      var ff=d2.features[k], pp=ff.properties||{}, g2=ff.geometry;
      if(!g2||!g2.coordinates) continue;
      out.push({lat:g2.coordinates[1], lng:g2.coordinates[0], ts:Date.parse(pp.fromdate)||0,
        renk:(pp.alertlevel==='Red'?'#ff3b3b':(pp.alertlevel==='Orange'?'#f97316':'#22c55e')), cap:0.55,
        ad:'GDACS '+pp.eventtype+' · '+(pp.country||''), tur:'gdacs'});
    }
    out.sort(function(a,b){ return a.ts-b.ts; });
    ZAMAN_VERI=out;
    CANLI_HAM.zamanToplam=out.length;
    return out.length+' olay (30 gün arşivi)';
  });
}
function zamanUygula(saat){
  ZAMAN_PENCERE=parseFloat(saat)||720;
  if(!KATMAN.zamanmakinesi){ CANLI.zamanmakinesi=[]; return; }
  var esik=Date.now()-ZAMAN_PENCERE*3600000, sec=[];
  for(var i=0;i<ZAMAN_VERI.length;i++){ if(ZAMAN_VERI[i].ts>=esik) sec.push(ZAMAN_VERI[i]); }
  CANLI.zamanmakinesi=sec;
  var el=$('zamanBilgi');
  if(el) el.textContent=(ZAMAN_PENCERE>=720? 'son 30 gün':(ZAMAN_PENCERE>=168? 'son '+Math.round(ZAMAN_PENCERE/24)+' gün' : 'son '+Math.round(ZAMAN_PENCERE)+' saat'))
    +' · '+sec.length+' olay gösteriliyor';
  kureCiz();
  if(typeof haritaKatmanlariCiz==='function') haritaKatmanlariCiz(true);
}
function zamanMakinesiAc(acik){
  KATMAN.zamanmakinesi=acik?1:0;
  if(acik && !ZAMAN_VERI.length){ zamanVerisiYukle().then(function(m){ durum('harita','✔ '+m); zamanUygula(720); }); }
  else zamanUygula(ZAMAN_PENCERE);
}
setInterval(function(){ try{ if(KATMAN.zamanmakinesi) zamanUygula(ZAMAN_PENCERE); }catch(e){} }, 60000);

/* ---------------- 3) UYDU YÖRÜNGE İZLERİ ---------------- */
function yorungeIzleri(){
  if(typeof satellite==='undefined') return [];
  var grup=(TLE_CACHE['stations'] && TLE_CACHE['stations'].uydular) || [];
  if(!grup.length) return [];
  var out=[], sinir=Math.min(10, grup.length);
  for(var i=0;i<sinir;i++){
    var sr;
    try{ sr=satellite.twoline2satrec(grup[i].l1, grup[i].l2); }catch(e){ continue; }
    var pts=[], bas=Date.now();
    for(var t=0; t<=5400*1000; t+=120000){          /* gelecek 90 dk, 2 dk adım */
      try{
        var an=new Date(bas+t);
        var p=satellite.propagate(sr, an);
        if(!p || !p.position || typeof p.position.x!=='number') continue;
        var g=satellite.eciToGeodetic(p.position, satellite.gstime(an));
        var la=satellite.degreesLat(g.latitude), lo=satellite.degreesLong(g.longitude);
        if(isNaN(la)||isNaN(lo)) continue;
        pts.push([la, lo]);
      }catch(e){}
    }
    if(pts.length>3) out.push({pts:pts, ad:'🛰 Yörünge izi · '+grup[i].ad+' (gelecek 90 dk)', renk:'#c4b5fd', tur:'yorunge'});
  }
  return out;
}

/* ---------------- 4) UÇAK / GEMİ İZLERİ ---------------- */
var IZ_UC={}, IZ_GEMI={};
function izleriGuncelle(){
  if(!KATMAN.ucakiz && !KATMAN.gemiiz) return;
  if(KATMAN.ucakiz && HTML_VERI.ucak){
    for(var i=0;i<HTML_VERI.ucak.length;i++){
      var u=HTML_VERI.ucak[i]; if(u.lat==null) continue;
      var kayit=IZ_UC[u.ad]||[];
      kayit.push([u.lat,u.lng]); if(kayit.length>8) kayit.shift();
      IZ_UC[u.ad]=kayit;
    }
  }
  if(KATMAN.gemiiz && HTML_VERI.gemi){
    for(var j=0;j<HTML_VERI.gemi.length;j++){
      var g=HTML_VERI.gemi[j]; if(g.lat==null) continue;
      var k=IZ_GEMI[g.ad]||[];
      k.push([g.lat,g.lng]); if(k.length>10) k.shift();
      IZ_GEMI[g.ad]=k;
    }
  }
}
function izYollari(){
  var out=[];
  if(KATMAN.ucakiz){
    var say=0;
    for(var ad in IZ_UC){ if(IZ_UC[ad].length>1 && say<80){ out.push({pts:IZ_UC[ad], ad:'✈ iz · '+ad, renk:'#38bdf8', tur:'ucakiz'}); say++; } }
  }
  if(KATMAN.gemiiz){
    var s2=0;
    for(var ad2 in IZ_GEMI){ if(IZ_GEMI[ad2].length>1 && s2<80){ out.push({pts:IZ_GEMI[ad2], ad:'⛴ iz · '+ad2, renk:'#2dd4bf', tur:'gemiiz'}); s2++; } }
  }
  return out;
}

/* ---------------- 5) DEPREM DALGA ANİMASYONU ---------------- */
function depremDalgaYollari(){
  var enYeni=null;
  for(var i=0;i<ZAMAN_VERI.length;i++){
    var v=ZAMAN_VERI[i];
    if(Math.abs(v.cap-0.8)<0.01 && Date.now()-v.ts < 3*3600000){ if(!enYeni || v.ts>enYeni.ts) enYeni=v; }
  }
  if(!enYeni) return [];
  var gecenSn=(Date.now()-enYeni.ts)/1000;
  if(gecenSn>3*3600) return [];
  var halkalar=[], hiz=6.0;                 /* S dalgası ~4 km/sn, P ~6 km/sn */
  for(var k=1;k<=4;k++){
    var yaricap=hiz*gecenSn - k*400;        /* km */
    if(yaricap<=0 || yaricap>6000) continue;
    var pts=[], derece=yaricap/111.32;
    for(var a=0;a<=360;a+=4){
      var r=a*Math.PI/180;
      var la=enYeni.lat+derece*Math.cos(r);
      var lo=enYeni.lng+derece*Math.sin(r)/Math.max(0.15, Math.cos(enYeni.lat*Math.PI/180));
      pts.push([la, lo]);
    }
    halkalar.push({pts:pts, ad:'🌊 Sismik dalga · '+Math.round(yaricap)+' km (M'+String(enYeni.ad).slice(1,4)+')',
      renk:(k===1?'#ff3b3b':'#f97316'), tur:'depremdalga'});
  }
  return halkalar;
}

/* ---------------- 6) TÜRKİYE HAVA SAHASI ---------------- */
function turkiyeUcakNoktalari(){
  var out=[], sinir={g:35.5, k:42.5, b:25.0, d:45.0};
  var kaynak=(HTML_VERI.ucak||[]).concat(HTML_VERI.askeriucak||[]);
  for(var i=0;i<kaynak.length;i++){
    var u=kaynak[i]; if(u.lat==null) continue;
    if(u.lat<sinir.g||u.lat>sinir.k||u.lng<sinir.b||u.lng>sinir.d) continue;
    out.push({lat:u.lat, lng:u.lng, renk:'#fbbf24', cap:0.6, yuk:0.02, tur:'trhava', ad:'🇹🇷 Türkiye hava sahası · '+(u.ad||'')});
  }
  return out;
}

/* ---------------- 7) UZAY PANELİ EKLENTİSİ ---------------- */
function yerGunesAltinda(satLat, satLng, satYuk){
  /* uydu güneş ışığında mı? (basit: güneş alt noktasına uzaklık > 90° => gece yarısı tarafı) */
  var g=gunesKonumu();
  var d=mesafeKm(satLat, satLng, g.dec, g.lng);
  return d > 6371*Math.PI/2;   /* karanlık tarafta ise yansıma görünür (gözlemci tarafı gündüz/gece ayrıca kontrol edilir) */
}
function uyduGecişleri(konumAdi, lat, lng, saat){
  var liste=[], hedefler=['ISS','CSS','HST','NOAA','TERRA'];
  if(typeof satellite==='undefined') return liste;
  var grup=(TLE_CACHE['stations'] && TLE_CACHE['stations'].uydular)||[];
  var tum=grup.concat((TLE_CACHE['science']&&TLE_CACHE['science'].uydular)||[]);
  for(var h=0;h<hedefler.length;h++){
    for(var i=0;i<tum.length;i++){
      if(!tum[i].ad || tum[i].ad.indexOf(hedefler[h])<0) continue;
      try{
        var sr=satellite.twoline2satrec(tum[i].l1, tum[i].l2);
        var icinde=false, bas=null, maxY=0, bas_an=null;
        for(var t=0; t<saat*3600000; t+=60000){
          var an=new Date(Date.now()+t);
          var p=satellite.propagate(sr, an);
          if(!p || !p.position || typeof p.position.x!=='number') continue;
          var g=satellite.eciToGeodetic(p.position, satellite.gstime(an));
          var la=satellite.degreesLat(g.latitude), lo=satellite.degreesLong(g.longitude);
          var y=yerYukseklik({lat:la, lng:lo, h:g.height}, lat, lng);
          if(y>=20){
            if(!icinde){ icinde=true; bas=an; maxY=y; }
            else if(y>maxY) maxY=y;
          } else if(icinde){
            icinde=false;
            liste.push({uydu:tum[i].ad, sehir:konumAdi, bas:bas, max:maxY});
            break;
          }
        }
      }catch(e){}
      break;
    }
  }
  return liste;
}
var _eskiUzayPanelYaz=uzayPanelYaz;
uzayPanelYaz=function(){
  _eskiUzayPanelYaz();
  var el=$('sonuc_uzay'); if(!el) return;
  var h='';
  /* ISS canlı kamera */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ISS CANLI KAMERA (NASA)</h3>';
  h+='<div style="position:relative;padding-top:56.25%;background:#000;border:1px solid var(--cizgi);border-radius:3px;overflow:hidden">'
   +'<iframe src="https://www.youtube-nocookie.com/embed/P9C25Un7xaM?rel=0" title="ISS canlı" '
   +'style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>'
   +'<div class="tarih" style="margin-top:4px">Kaynak: NASA ISS canlı yayını (YouTube). Görüntü gelmezse yayın kesintisidir; pencereyi yenile.</div>';
  /* çıplak gözle görülebilir uydular */
  try{
    var gecis=uyduGecişleri('Gaziantep', 37.07, 37.38, 12).concat(uyduGecişleri('İstanbul', 41.01, 28.98, 12));
    if(gecis.length){
      h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ÇIPLAK GÖZLE GÖRÜLEBİLİR UYDULAR (önümüzdeki 12 saat · 20° üzeri)</h3>';
      h+=tablo(['Uydu','Şehir','Geçiş','En yüksek'], gecis.slice(0,12).map(function(x){
        return [x.uydu, x.sehir, new Date(x.bas).toLocaleString('tr-TR'), Math.round(x.max)+'°']; }));
      h+='<div class="uyari">Hesap kendi bilgisayarında TLE verisinden yapılır (satellite.js). 20° üzeri geçişler gözle rahat izlenir; gündüz saatleri hariç.</div>';
    }
  }catch(e){}
  /* HF propagasyon */
  var kp=(CANLI_HAM.uzay||{}).kp, g=gunesKonumu();
  var muf = kp==null? 21 : Math.max(6, 21 - kp*1.4);
  var saatUTC=(new Date()).getUTCHours();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">HF RADYO PROPAGASYONU (kaba tahmin)</h3>';
  h+=tablo(['Ölçü','Durum'],[
    ['Tahmini MUF (gündüz)', muf.toFixed(1)+' MHz'],
    ['Hızlı tahmin', kp==null?'-':(kp>=6?'KUTUP BÖLGESİNDE KESİNTİ'+(kp>=7?' (siyah damar)':''):(kp>=4?'ORTA: kutup yolları bozuk':'İYİ: 20-15 m bantları açık'))],
    ['Gündüz/gece', g.dec.toFixed(1)+'° güneş enlemi · güneş alt boylamı '+g.lng.toFixed(0)+'°'],
    ['UTC saat', saatUTC+':00']
  ]);
  el.insertAdjacentHTML('beforeend', h);
};

/* ---------------- 8) EK ARAÇ ÇUBUĞU (harita üstü) ---------------- */
function ekAraclarHTML(){
  var h='<div class="ekAraclar">';
  h+='<span class="soluk" style="font-size:9px;letter-spacing:1px">KÜRE DOKUSU</span>';
  for(var i=0;i<DOKULAR.length;i++){
    h+='<button class="dokuBtn'+(DOKU===DOKULAR[i].id?' aktif':'')+'" data-d="'+DOKULAR[i].id+'" onclick="dokuSec(\''+DOKULAR[i].id+'\')">'+esc(DOKULAR[i].ad.split(' ')[0])+'</button>';
  }
  h+='<span class="soluk" style="font-size:9px;letter-spacing:1px;margin-left:8px">ZAMAN MAKİNESİ</span>';
  h+='<button class="dokuBtn" onclick="zamanMakinesiAc(!KATMAN.zamanmakinesi)">30 GÜN ARŞİVİ</button>';
  h+='<input type="range" min="1" max="720" value="'+ZAMAN_PENCERE+'" id="zamanKaydirici" oninput="zamanUygula(this.value)" class="zamanKaydirici">';
  h+='<span id="zamanBilgi" class="soluk" style="font-size:9px">son 30 gün</span>';
  h+='<button class="dokuBtn" id="oynatBtn" onclick="oynatDegis()">▶ OYNAT</button>';
  h+='<button class="dokuBtn" onclick="isiDegis()">🔥 ISI HARİTASI</button>';
  h+='<button class="dokuBtn" onclick="kumeleDegis()">🧩 KÜMELEME</button>';
  h+='</div>';
  return h;
}
/* harita paneli her açıldığında araç çubuğunu yerleştir */
var _eskiKatPanelOlustur=katPanelOlustur;
katPanelOlustur=function(){
  _eskiKatPanelOlustur();
  var yer=$('ekAraclar');
  if(yer && !yer.innerHTML) yer.innerHTML=ekAraclarHTML();
};
dokuGeriYukle();
var _eskiKureBaslat=kureBaslat;
kureBaslat=function(){
  _eskiKureBaslat();
  if(KURE && DOKU!=='gece'){ try{ dokuSec(DOKU); }catch(e){} }
};

/* ---------------- 9) GÖRSEL KATMANLARI ÇİZİME BAĞLA ---------------- */
var _k3Nokta=canliNoktalar;
canliNoktalar=function(){
  var out=_k3Nokta();
  if(KATMAN.zamanmakinesi && CANLI.zamanmakinesi){
    for(var i=0;i<CANLI.zamanmakinesi.length;i++) out.push(CANLI.zamanmakinesi[i]);
  }
  if(KATMAN.trhava){ var t=turkiyeUcakNoktalari(); for(var j=0;j<t.length;j++) out.push(t[j]); }
  return out;
};
var _k3Yol=canliYollar;
canliYollar=function(){
  var out=_k3Yol();
  if(KATMAN.yorunge){ var y=yorungeIzleri(); for(var i=0;i<y.length;i++) out.push(y[i]); }
  if(KATMAN.ucakiz || KATMAN.gemiiz){ izleriGuncelle(); var z=izYollari(); for(var j=0;j<z.length;j++) out.push(z[j]); }
  if(KATMAN.depremdalga){ var d=depremDalgaYollari(); for(var k=0;k<d.length;k++) out.push(d[k]); }
  return out;
};
