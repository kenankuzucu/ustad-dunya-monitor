/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — DIŞARI AÇILMA & ENTEGRASYON (v5.4)
   · KML / GeoJSON dışa aktarma (Google Earth)
   · A4 yazdırma düzeni · OBS/yayın modu (kayan bant + skor tabelası)
   · Günün kartı (PNG)
   · CANLI RADYO: ülkeye göre istasyon ara, panelde çal (radio-browser)
   · CANLI YAYIN penceresi (resmî YouTube yayınları)
   · Philips Hue köprüsü (yerel sunucu modunda çalışır)
   · RTL-SDR kendi alıcın (donanım varsa) — dürüst kontrol
   ============================================================ */
var OBS=false, OBS_TICK=null, RADYO={ ulke:'TR', liste:[], calan:null };

/* ---------------- 1) KML / GeoJSON ---------------- */
function disariNoktalar(){
  var out=[];
  try{
    var nok=(typeof kureTumNoktalar==='function')? kureTumNoktalar() : [];
    for(var i=0;i<nok.length;i++){
      var p=nok[i];
      if(p.lat==null||p.lng==null) continue;
      out.push({lat:p.lat, lng:p.lng, ad:p.ad||'', tur:p.tur||''});
    }
  }catch(e){}
  return out;
}
function kmlIndir(){
  var nok=disariNoktalar();
  var k='<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n'
    +'<name>ÜSTAD DÜNYA MONİTÖRÜ · '+new Date().toLocaleString('tr-TR')+'</name>\n'
    +'<Style id="n"><IconStyle><color>ff41ff00</color><scale>0.7</scale></IconStyle></Style>\n';
  for(var i=0;i<nok.length;i++){
    var p=nok[i];
    k+='<Placemark><name>'+String(p.ad).replace(/[<>&]/g,' ').slice(0,90)+'</name><styleUrl>#n</styleUrl>'
     +'<description>'+String(p.tur).replace(/[<>&]/g,' ')+'</description>'
     +'<Point><coordinates>'+p.lng+','+p.lat+',0</coordinates></Point></Placemark>\n';
  }
  /* hatlar */
  try{
    var yollar=(typeof kureTumYollar==='function')? kureTumYollar() : [];
    for(var y=0;y<yollar.length;y++){
      var yol=yollar[y].noktalar||yollar[y].yol||yollar[y].path||[];
      if(yol.length<2) continue;
      var koord='';
      for(var j=0;j<yol.length;j++){
        var q=yol[j];
        var la=(q.lat!=null?q.lat:q[0]), lo=(q.lng!=null?q.lng:q[1]);
        if(la==null) continue;
        koord+=lo+','+la+',0 ';
      }
      if(!koord) continue;
      k+='<Placemark><name>'+String(yollar[y].ad||'hat').replace(/[<>&]/g,' ')+'</name><LineString><coordinates>'+koord+'</coordinates></LineString></Placemark>\n';
    }
  }catch(e){}
  k+='</Document></kml>';
  dosyaIndir(k, 'ustad-monitor-'+tarihDamga()+'.kml');
  durum('disari','✔ KML indirildi ('+nok.length+' nokta) — Google Earth\'te aç');
}
function geojsonIndir(){
  var nok=disariNoktalar();
  var f={type:'FeatureCollection', ozellik:{kaynak:'ÜSTAD DÜNYA MONİTÖRÜ', tarih:new Date().toISOString()}, features:[]};
  for(var i=0;i<nok.length;i++) f.features.push({type:'Feature', geometry:{type:'Point', coordinates:[nok[i].lng, nok[i].lat]}, properties:{ad:nok[i].ad, tur:nok[i].tur}});
  dosyaIndir(JSON.stringify(f), 'ustad-monitor-'+tarihDamga()+'.geojson');
  durum('disari','✔ GeoJSON indirildi ('+nok.length+' nokta)');
}

/* ---------------- 2) A4 YAZDIRMA ---------------- */
function yazdirmaHazirla(){
  var st=$('yazdirmaStil');
  if(!st){
    st=document.createElement('style'); st.id='yazdirmaStil';
    st.textContent='@media print{ #ustNav,.yanPanel,footer,#hud,.aracSatir,button,#girisSahne{display:none !important} '
      +'body{background:#fff !important;color:#000 !important} .panelBaslik{color:#000 !important;border-bottom:2px solid #000} '
      +'table.tbl td{color:#000 !important;border-color:#999 !important} .grafikKutu{border:1px solid #999 !important} '
      +'.sonuc:before{content:"ÜSTAD DÜNYA MONİTÖRÜ — "+attr(data-baslik);display:block;font-size:16px;margin-bottom:8px} }';
    document.head.appendChild(st);
  }
  try{
    var el=$('sonuc_'+AKTIF);
    if(el) el.setAttribute('data-baslik', new Date().toLocaleString('tr-TR'));
  }catch(e){}
  durum('disari','🖨 yazdırma düzeni hazır — tarayıcı yazdırma penceresi açılıyor (PDF olarak da kaydedebilirsin)');
  setTimeout(function(){ try{ window.print(); }catch(e){} }, 400);
}

/* ---------------- 3) OBS / YAYIN MODU ---------------- */
function obsDegis(){
  OBS=!OBS;
  document.body.classList.toggle('obsMod', OBS);
  var bant=$('obsBant'), tabela=$('obsTabela');
  if(OBS){
    if(!bant){
      bant=document.createElement('div'); bant.id='obsBant'; bant.className='obsBant';
      document.body.appendChild(bant);
    }
    if(!tabela){
      tabela=document.createElement('div'); tabela.id='obsTabela'; tabela.className='obsTabela';
      document.body.appendChild(tabela);
    }
    var i=0;
    OBS_TICK=setInterval(function(){
      var basliklar=[];
      try{
        var g=K2.guvenlikHaber||[]; for(var j=0;j<Math.min(6,g.length);j++) basliklar.push(g[j].baslik);
      }catch(e){}
      try{
        var c=zekaCumleleri(); for(var k=0;k<Math.min(4,c.length);k++) basliklar.push(c[k]);
      }catch(e){}
      if(!basliklar.length) basliklar=['ÜSTAD DÜNYA MONİTÖRÜ · CANLI'];
      bant.textContent='◄ '+basliklar.join('  ●  ')+'  ►';
      var s=null; try{ s=durumSkoru(); }catch(e){}
      if(s){
        var e=skorEtiket(s.skor);
        tabela.innerHTML='<b>DÜNYA SKORU</b> <span style="color:'+e.renk+';font-size:20px">'+s.skor+'</span> <span style="color:'+e.renk+'">'+e.ad+'</span>'
          +' <span class="soluk">· '+new Date().toLocaleTimeString('tr-TR')+'</span>';
      }
      i++;
    }, 9000);
    durum('disari','📺 YAYIN MODU açık — kayan bant ve skor tabelası eklendi (OBS ile pencere yakalayabilirsin)');
  } else {
    if(OBS_TICK){ clearInterval(OBS_TICK); OBS_TICK=null; }
    if(bant) bant.remove(); if(tabela) tabela.remove();
    durum('disari','yayın modu kapandı');
  }
  return OBS? 'yayın modu AÇIK':'yayın modu kapalı';
}

/* ---------------- 4) GÜNÜN KARTI (PNG) ---------------- */
function gununKarti(){
  try{
    var W=1080, H=608;
    var k=document.createElement('canvas'); k.width=W; k.height=H;
    var c=k.getContext('2d');
    c.fillStyle='#04120a'; c.fillRect(0,0,W,H);
    /* arka plan ızgarası */
    c.strokeStyle='rgba(34,197,94,.12)'; c.lineWidth=1;
    for(var x=0;x<W;x+=48){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
    for(var y=0;y<H;y+=48){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    /* küre tuvalini yerleştir */
    var kaynak=null, enBuyuk=0;
    var kanvaslar=document.querySelectorAll('canvas');
    for(var i=0;i<kanvaslar.length;i++){
      var alan=(kanvaslar[i].width||0)*(kanvaslar[i].height||0);
      if(alan>enBuyuk && kanvaslar[i].width>200){ enBuyuk=alan; kaynak=kanvaslar[i]; }
    }
    if(kaynak){ try{ c.drawImage(kaynak, 40, 60, 520, 480); }catch(e){} }
    /* metinler */
    c.fillStyle='#7bffa1'; c.font='bold 30px Consolas,monospace';
    c.fillText('ÜSTAD DÜNYA MONİTÖRÜ', 590, 90);
    c.fillStyle='#c9ffd8'; c.font='15px Consolas,monospace';
    c.fillText(new Date().toLocaleString('tr-TR'), 590, 118);
    c.fillStyle='#7bffa1'; c.font='bold 22px Consolas,monospace';
    c.fillText('ÜSTAD KENAN KUZUCU', 590, 160);
    c.fillStyle='#79b98b'; c.font='13px Consolas,monospace';
    c.fillText('GAZİANTEP · KURUCU', 590, 182);
    /* skor */
    var s=null; try{ s=durumSkoru(); }catch(e){}
    if(s){
      var e2=skorEtiket(s.skor);
      c.fillStyle='#04120a'; c.fillRect(590,205,450,110);
      c.strokeStyle=e2.renk; c.lineWidth=2; c.strokeRect(590,205,450,110);
      c.fillStyle='#79b98b'; c.font='13px Consolas,monospace'; c.fillText('DÜNYA DURUM SKORU', 606, 232);
      c.fillStyle=e2.renk; c.font='bold 54px Consolas,monospace'; c.fillText(String(s.skor), 606, 288);
      c.fillStyle=e2.renk; c.font='bold 17px Consolas,monospace'; c.fillText(e2.ad, 700, 286);
      for(var p=0;p<Math.min(4,s.parcalar.length);p++){
        c.fillStyle='#79b98b'; c.font='12px Consolas,monospace';
        c.fillText(s.parcalar[p].ad+' '+Math.round(s.parcalar[p].puan), 606+ (p%2)*220, 336+Math.floor(p/2)*20);
      }
    }
    /* rakamlar */
    c.fillStyle='#c9ffd8'; c.font='13px Consolas,monospace';
    var satirlar=[
      'Gemi: '+(CANLI_HAM.gemi||'-')+'   Uçak: '+(CANLI_HAM.ucakSay||'-')+'   Uydu: '+((CANLI_HAM.uyducSay||0)+(CANLI_HAM.starlinkSay||0)),
      'Kp: '+((CANLI_HAM.uzay&&CANLI_HAM.uzay.kp)||'-')+'   Kötü IP: '+(CANLI_HAM.kotuip?CANLI_HAM.kotuip.length:'-'),
      'Altın ons: '+(K2.piyasa&&K2.piyasa.altin? '$'+Number(K2.piyasa.altin).toFixed(0):'-')+'   USD/TRY: '+(K2.usdTry? K2.usdTry.toFixed(2):'-')
    ];
    for(var s2=0;s2<satirlar.length;s2++){
      c.fillStyle='#c9ffd8'; c.font='14px Consolas,monospace';
      c.fillText('• '+satirlar[s2], 590, 400+s2*30);
    }
    c.fillStyle='#4fd97a'; c.font='11px Consolas,monospace';
    c.fillText('USTAD MONİTÖR · otomatik üretildi · kaynaklar: USGS, GDACS, NOAA, EMSC, MGM, FireHOL', 590, 540);
    c.strokeStyle='#22c55e'; c.lineWidth=3; c.strokeRect(8,8,W-16,H-16);
    dosyaIndirBlob(k.toDataURL('image/png'), 'ustad-gunun-karti-'+tarihDamga()+'.png');
    durum('disari','🖼 günün kartı indirildi');
  }catch(e){ durum('disari','✘ kart hatası: '+e.message); }
}

/* ---------------- 5) CANLI RADYO ---------------- */
function radyoAra(ulke){
  ulke=ulke||RADYO.ulke;
  RADYO.ulke=ulke;
  var el=$('radyoListeCiz');
  if(el) el.innerHTML='<div class="soluk">istasyonlar aranıyor…</div>';
  return fetchJSON('https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/'+encodeURIComponent(ulke)+'?limit=25&hidebroken=true&order=clickcount&reverse=true', 25000)
    .then(function(d){
      RADYO.liste=(d||[]).filter(function(s){ return s.url_resolved; });
      var h='';
      for(var i=0;i<RADYO.liste.length;i++){
        var s=RADYO.liste[i];
        h+='<div class="nkOge">▶ <b>'+esc((s.name||'').slice(0,44))+'</b> <span class="soluk">'+esc(s.codec||'')+' '+((s.bitrate||0)? s.bitrate+'k':'')+' · '+esc(s.country||'')+'</span> '
          +'<button class="nkMini" onclick="radyoCal('+i+')">ÇAL</button></div>';
      }
      if(el) el.innerHTML=h||'<div class="uyari">Bu ülke için istasyon bulunamadı (radio-browser).</div>';
      durum('disari','✔ '+RADYO.liste.length+' istasyon bulundu ('+ulke+')');
      return RADYO.liste.length+' istasyon ('+ulke+')';
    }).catch(function(e){
      if(el) el.innerHTML='<div class="hata">istasyon listesi alınamadı: '+esc(e.message)+'</div>';
      throw e;
    });
}
function radyoCal(i){
  var s=RADYO.liste[i]; if(!s) return;
  var a=$('radyoOynatici');
  if(!a){ a=document.createElement('audio'); a.id='radyoOynatici'; a.controls=true; a.style.cssText='width:100%;margin-top:8px'; document.body.appendChild(a); }
  a.src=s.url_resolved; a.play().then(function(){
    RADYO.calan=s;
    durum('disari','📻 çalıyor: '+(s.name||'')+' — '+(s.country||''));
    if(typeof alarmSeritGoster==='function') alarmSeritGoster('RADYO', (s.name||'')+' · '+(s.country||''));
  }).catch(function(e){ durum('disari','✘ çalınamadı: '+e.message); });
  var el=$('radyoCalan');
  if(el) el.textContent='ÇALAN: '+(s.name||'')+' · '+s.codec+' '+(s.bitrate||'')+'kbps';
}
function radyoDurdur(){
  var a=$('radyoOynatici');
  if(a){ a.pause(); a.src=''; }
  durum('disari','radyo durduruldu');
}

/* ---------------- 6) CANLI YAYIN PENCERESİ ---------------- */
/* Dünya kanalları + canlı kameralar (kimlikler 17.09.2026'da tek tek test edildi)
   kanal: kanal kimliği verilirse YouTube o anki canlı yayını kendi bulur (kimlik eskimez) */
var YAYINLAR=[
  {ad:'🛰 NASA · ISS canlı kamera', kanal:'UCLA_DiR1FfKNvjuUpBHmylQ', vid:'M3HKLzjvKPc'},
  {ad:'🌍 DW News (Almanya)',       kanal:'UCknLrEdhRCp1aegoMqRaCZg', vid:'LuKwFajn37U'},
  {ad:'🌍 Al Jazeera English',      kanal:'UCNye-wNBqNL5ZzHSJj3l8Bg', vid:'gCNeDWCI0vo'},
  {ad:'🌍 France 24 English',       kanal:'UCQfwfsi5VrQ8yKZ-UWmAEFg', vid:'HvZt-nh9sGg'},
  {ad:'🌍 Sky News (İngiltere)',    kanal:'UCoMdktPbSTixAyNGwb-UYkQ', vid:'iBQR6pIauvw'},
  {ad:'🌍 Bloomberg TV (ekonomi)',  kanal:'UCIALMKvObZNtJ6AmdCLP7Lg', vid:'QB5BNdBFujE'},
  {ad:'🌍 TRT WORLD (İngilizce)',   vid:'9CucucyxECM'},
  {ad:'🌐 AP (olay yayını)',        kanal:'UC52X5wxOL_s5yw0dQk7NtgA'},
  {ad:'🌐 AFP (olay yayını)',       kanal:'UCckz6n8QccTd6K_xdwKqa0A'},
  {ad:'🌐 Euronews (olay yayını)',  kanal:'UCSrZ3UV4jOidv8ppoVuvW9Q'},
  {ad:'🔗 Reuters (yeni sekmede)',  link:'https://www.youtube.com/@Reuters/live'},
  {ad:'📻 BBC World Service',       radyo:'BBC World Service'}
];
function yayinAc(no){
  var y=YAYINLAR[no]; if(!y) return;
  var el=$('yayinKutu'); if(!el) return;
  if(y.link){ window.open(y.link,'_blank'); durum('disari','🔗 '+y.ad+' yeni sekmede açıldı'); return; }
  if(y.radyo){ if(typeof tvRadyoCal==='function'){ tvRadyoCal(y.radyo); durum('disari','📻 '+y.radyo+' radyo olarak çalınıyor'); } return; }
  var kaynak=y.kanal? ('https://www.youtube.com/embed/live_stream?channel='+y.kanal) : ('https://www.youtube.com/embed/'+y.vid);
  el.innerHTML='<div class="nkSatir"><b>'+esc(y.ad)+'</b> <span class="soluk">'+(y.kanal?'kanal kimliğinden canlı yayın (kendini günceller)':'resmî YouTube yayını')+'</span></div>'
    +'<iframe width="100%" height="420" src="'+kaynak+'&autoplay=1" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border:1px solid var(--cizgi);border-radius:6px"></iframe>';
  durum('disari','📺 yayın açıldı: '+y.ad);
}
/* kendi kanalını yapıştır → aynı pencerede oynat */
function yayinLinkEkle(){
  var el=$('yayinLink'); if(!el) return;
  var ham=(el.value||'').trim();
  if(!ham){ durum('disari','⚠ önce bir YouTube bağlantısı yapıştır'); return; }
  var id='';
  var m=ham.match(/(?:v=|\/live\/|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  if(m) id=m[1];
  else if(/^[A-Za-z0-9_-]{11}$/.test(ham)) id=ham;
  var kutu=$('yayinKutu');
  if(!id){
    if(kutu) kutu.innerHTML='<div class="uyari">Bu bağlantıdan video kimliği çıkarılamadı. YouTube video/kanal canlı bağlantısı yapıştır.</div>';
    durum('disari','⚠ bağlantı okunamadı'); return;
  }
  if(kutu) kutu.innerHTML='<div class="nkSatir"><b>Kendi kanalın</b> <span class="soluk">'+esc(id)+'</span></div>'
    +'<iframe width="100%" height="420" src="https://www.youtube.com/embed/'+id+'?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border:1px solid var(--cizgi);border-radius:6px"></iframe>';
  durum('disari','📺 kendi kanalın açıldı ('+id+')');
}

/* ---------------- 7) PHILIPS HUE ---------------- */
function hueOku(){
  try{ return JSON.parse(localStorage.getItem('ustad_hue')||'null'); }catch(e){ return null; }
}
function hueKaydet(){
  var ip=prompt('Hue köprüsü IP (ör. 192.168.1.45):',''); if(!ip) return;
  var kullanici=prompt('Hue kullanıcı anahtarı (köprüde oluşturulur):',''); if(!kullanici) return;
  var kat=prompt('Tetikte hangi ışık? (0 = tüm ışıklar)','0')||'0';
  try{ localStorage.setItem('ustad_hue', JSON.stringify({ip:ip, kullanici:kullanici, kat:kat})); }catch(e){}
  durum('disari','✔ Hue ayarı kaydedildi');
  disariPanelYaz();
}
function hueIsik(kat, renk, parlaklik){
  var h=hueOku(); if(!h) return Promise.resolve(false);
  if(location.protocol==='file:'){
    durum('disari','ℹ Hue köprüsü http:// çalışır — tarayıcı dosya modunda karışık içeriği engeller. Paneli USTAD-MONITOR-YEREL.bat ile açarsan Hue çalışır.');
    return Promise.resolve(false);
  }
  var url='http://'+h.ip+'/api/'+h.kullanici+'/lights/'+(kat||0)+'/state';
  return fetch(url, {method:'PUT', body:JSON.stringify(renk? {on:true, xy:renk, bri:parlaklik||200} : {on:false})})
    .then(function(){ return true; }).catch(function(){ return false; });
}
/* alarm olayında Hue */
if(typeof alarmYaz==='function'){
  var _eskiAlarmYazHue=alarmYaz;
  alarmYaz=function(tur, metin){
    _eskiAlarmYazHue(tur, metin);
    try{ var h=hueOku(); if(h) hueIsik(h.kat, [0.65,0.33], 255); }catch(e){}
  };
}

/* ---------------- 8) RTL-SDR ---------------- */
function rtlsdrDurum(){
  return '<div class="uyari">Kendi alıcın (RTL-SDR çubuğu) takılıysa proje klasöründeki <b>USTAD-RTLSDR.bat</b> dosyasını çalıştır: '
   +'çubuk varsa uçak (ADS-B) verisini kendi anteninden dinler ve panele yazar. Donanım yoksa betik bunu dürüstçe söyler.</div>';
}

/* ---------------- 9) PANEL ---------------- */
function disariPanelHTML(){
  var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">📤 DIŞA AKTARMA</h3>';
  h+='<div class="aracSatir">'
   +'<button class="aracBtn" onclick="kmlIndir()">🌍 KML İNDİR (Google Earth)</button>'
   +'<button class="aracBtn" onclick="geojsonIndir()">🗺 GeoJSON İNDİR</button>'
   +'<button class="aracBtn" onclick="yazdirmaHazirla()">🖨 A4 YAZDIR (PDF)</button>'
   +'<button class="aracBtn" onclick="gununKarti()">🖼 GÜNÜN KARTI (PNG)</button>'
   +'<button class="aracBtn" onclick="obsDegis()">📺 YAYIN (OBS) MODU: '+(OBS?'AÇIK':'KAPALI')+'</button>'
   +'</div>';
  /* radyo */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">📻 CANLI RADYO (ülkeye göre · radio-browser)</h3>';
  h+='<div class="aracSatir"><input class="aracAra" id="radyoUlke" value="'+esc(RADYO.ulke)+'" placeholder="ülke kodu (TR, US, DE, FR…)">'
   +'<button class="aracBtn" onclick="radyoAra(document.getElementById(\'radyoUlke\').value.trim().toUpperCase())">ARA</button>'
   +'<button class="aracBtn" onclick="radyoDurdur()">⏹ DURDUR</button></div>';
  h+='<div class="soluk" style="font-size:10px" id="radyoCalan">'+(RADYO.calan? 'ÇALAN: '+esc(RADYO.calan.name||'') : 'çalan yok')+'</div>';
  h+='<div id="radyoListeCiz" class="nkListe">'+(RADYO.liste.length? '' : '<div class="soluk" style="font-size:11px">ARA düğmesine bas — istasyonlar listelenir (ülke kodu: TR, US, DE, GB, FR, RU, JP…)</div>')+'</div>';
  /* yayın */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">📺 CANLI KAMERALAR & DÜNYA KANALLARI (televizyondan buraya alındı)</h3>';
  h+='<div class="aracSatir">';
  for(var y=0;y<YAYINLAR.length;y++) h+='<button class="aracBtn" onclick="yayinAc('+y+')">'+esc(YAYINLAR[y].ad)+'</button>';
  h+='</div>';
  h+='<div class="aracSatir"><input class="aracAra" id="yayinLink" placeholder="kendi kanalını yapıştır (YouTube bağlantısı)" style="flex:1">'
   +'<button class="aracBtn" onclick="yayinLinkEkle()">▶ BU KANALI AÇ</button></div>';
  h+='<div class="uyari">Kanallar burada durur (televizyondan kaldırıldı). Kanal kimliği verilenler YouTube kanalının O ANKİ canlı yayınını kendisi bulur — '
   +'kimlik eskimez. Canlı yayın olmadığı anda "yayın yok" der; Reuters gömülü izin vermediği için yeni sekmede açılır.</div>';
  h+='<div id="yayinKutu"></div>';
  /* hue */
  var hue=hueOku();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">💡 PHILIPS HUE (alarm → ışık)</h3>';
  h+='<table class="tbl">'+satir('köprü', hue? esc(hue.ip)+' · ışık '+esc(String(hue.kat)) : '<span class="soluk">ayarlanmadı</span>')+'</table>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="hueKaydet()">💡 HUE AYARLA</button>'
   +'<button class="aracBtn" onclick="hueIsik(hueOku()?hueOku().kat:0,[0.65,0.33],255)">🔴 TEST (KIRMIZI YAK)</button>'
   +'<button class="aracBtn" onclick="hueIsik(hueOku()?hueOku().kat:0,null)">⚫ KAPAT</button></div>';
  h+='<div class="uyari">Hue köprüsü yalnızca http:// üzerinden çalışır; tarayıcı dosya modunda (file://) karışık içeriği engeller. '
   +'Panel <b>USTAD-MONITOR-YEREL.bat</b> ile (http://localhost:8878) açıldığında Hue sorunsuz çalışır.</div>';
  /* rtlsdr + diğer paketler */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">🛰 RTL-SDR · KENDİ ALICIN</h3>'+rtlsdrDurum();
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:16px">🧩 EK PAKETLER (klasördeki .bat dosyaları)</h3>';
  h+='<table class="tbl">'
   +satir('PANEL API (diğer uygulamaların)', 'USTAD-PANEL-API.bat → http://localhost:8890/durum.json')
   +satir('TELEGRAM BOT (telefondan komut)', 'USTAD-TELEGRAM-BOT.bat → durum · deprem · siber · skor')
   +satir('SİTEYE CANLI SÜRÜM', 'USTAD-SITE-YAYINLA.bat → site\\ klasörü (hosting\'e yükle)')
   +satir('MOBİL APK', 'USTAD-MONITOR-APK-KILAVUZU.txt → adım adım')
   +satir('GİT SÜRÜM KONTROLÜ', 'USTAD-GIT-KAYDET.bat / USTAD-GIT-GERI-DON.bat')
   +'</table>';
  return h;
}
function disariPanelYaz(){
  var el=$('sonuc_disari');
  if(el) el.innerHTML='<h2 class="panelBaslik">🌐 DIŞARI · RADYO · HUE · ÇIKTILAR</h2>'+disariPanelHTML();
  durum('disari','✔ dışarı penceresi hazır');
}
function disariPanel(){
  panelHazir('disari');
  disariPanelYaz();
}
