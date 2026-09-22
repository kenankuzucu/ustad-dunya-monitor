/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — PANEL ZEKÂSI (v5.1)
   Alarm sistemi · günlük Word bülteni · CSV dışa aktarma ·
   olay grafiği (sparkline) · sesli özet (TTS)
   ============================================================ */

/* ---------------- 1) ALARM SİSTEMİ ---------------- */
var ALARM_VARSAYILAN={ acik:true, depremMag:4.5, depremKm:300, kp:5, afetKirmizi:true, yeniCve:5, c2Artis:0, ses:true };
var ALARM={}, ALARM_KAYIT={};
function alarmYukle(){
  try{ ALARM=JSON.parse(localStorage.getItem('ustad_alarm')||'null')||ALARM_VARSAYILAN; }catch(e){ ALARM=ALARM_VARSAYILAN; }
  for(var k in ALARM_VARSAYILAN){ if(ALARM[k]===undefined) ALARM[k]=ALARM_VARSAYILAN[k]; }
  try{ ALARM_KAYIT=JSON.parse(localStorage.getItem('ustad_alarm_kayit')||'{}')||{}; }catch(e){ ALARM_KAYIT={}; }
}
function alarmKaydet(){
  ALARM.acik=$('al_acik')?$('al_acik').checked:true;
  ALARM.depremMag=parseFloat($('al_mag')?$('al_mag').value:4.5);
  ALARM.depremKm=parseFloat($('al_km')?$('al_km').value:300);
  ALARM.kp=parseFloat($('al_kp')?$('al_kp').value:5);
  ALARM.afetKirmizi=$('al_afet')?$('al_afet').checked:true;
  ALARM.yeniCve=parseFloat($('al_cve')?$('al_cve').value:5);
  ALARM.ses=$('al_ses')?$('al_ses').checked:true;
  try{ localStorage.setItem('ustad_alarm', JSON.stringify(ALARM)); }catch(e){}
  durum('alarm','✔ alarm ayarları kaydedildi');
}
function alarmIzinIste(){
  try{
    if(!('Notification' in window) || !window.Notification){ durum('alarm','✘ bu tarayıcı masaüstü bildirimi desteklemiyor'); return; }
    Promise.resolve(window.Notification.requestPermission()).then(function(p){
      durum('alarm', p==='granted'?'✔ bildirim izni verildi':'✘ bildirim izni verilmedi');
    }).catch(function(){ durum('alarm','✘ bildirim izni alınamadı'); });
  }catch(e){ durum('alarm','✘ bildirim izni hatası: '+String(e.message||e)); }
}
function alarmSes(){
  if(!ALARM.ses) return;
  try{
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    var ctx=new AC(), o=ctx.createOscillator(), g=ctx.createGain();
    o.type='square'; o.frequency.value=880; g.gain.value=0.05;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(function(){ try{ o.frequency.value=1320; }catch(e){} }, 180);
    setTimeout(function(){ try{ o.stop(); ctx.close(); }catch(e){} }, 420);
  }catch(e){}
}
function alarmYaz(tur, metin, anahtar){
  if(anahtar && ALARM_KAYIT[anahtar]) return false;
  if(anahtar){ ALARM_KAYIT[anahtar]=Date.now(); try{ localStorage.setItem('ustad_alarm_kayit', JSON.stringify(ALARM_KAYIT)); }catch(e){} }
  var kayitlar=[];
  try{ kayitlar=JSON.parse(localStorage.getItem('ustad_alarm_log')||'[]'); }catch(e){}
  kayitlar.unshift({t:Date.now(), tur:tur, metin:metin});
  kayitlar=kayitlar.slice(0,40);
  try{ localStorage.setItem('ustad_alarm_log', JSON.stringify(kayitlar)); }catch(e){}
  try{
    if('Notification' in window && window.Notification && window.Notification.permission==='granted'){
      new Notification('ÜSTAD MONİTÖR · '+tur, { body:metin });
    }
  }catch(e){}
  alarmSes();
  var b=$('alarmSerit');
  if(b){ b.innerHTML='🔔 <b>'+esc(tur)+'</b> · '+esc(metin); b.style.display='block';
    setTimeout(function(){ b.style.display='none'; }, 20000); }
  return true;
}
function alarmKontrol(){
  if(!ALARM.acik) return;
  /* 1) yakın deprem */
  var son=(CANLI.depremuyari||[]).concat(
    (KURE_VERI||[]).filter(function(p){ return p.tur==='deprem'; }).map(function(p){
      var m=parseFloat(String(p.ad).replace('M','').split(' ')[0])||0;
      return {lat:p.lat, lng:p.lng, cap:(m>=6?0.8:0.5), ad:p.ad};
    })
  );
  for(var i=0;i<son.length;i++){
    var p=son[i], m=parseFloat(String(p.ad).replace('M','').split(' ')[0])||0;
    if(m < ALARM.depremMag) continue;
    var d=mesafeKm(GZ_LAT, GZ_LNG, p.lat, p.lng);
    if(d > ALARM.depremKm) continue;
    var anahtar='dep_'+p.lat.toFixed(1)+'_'+p.lng.toFixed(1)+'_'+m;
    if(alarmYaz('YAKIN DEPREM', 'Gaziantep\'e '+Math.round(d)+' km · M'+m+' · '+p.ad, anahtar)) break;
  }
  /* 2) jeomanyetik fırtına */
  var kp=(CANLI_HAM.uzay||{}).kp;
  if(kp!=null && kp>=ALARM.kp){
    alarmYaz('UZAY HAVASI', 'Kp '+kp+' — jeomanyetik fırtına (GPS/HF bozulabilir)', 'kp_'+Math.floor(kp));
  }
  /* 3) kırmızı afet */
  if(ALARM.afetKirmizi){
    var gd=CANLI_HAM.gdacs||[];
    for(var g=0;g<gd.length;g++){
      if(gd[g].seviye==='Red'){
        alarmYaz('KIRMIZI AFET', gd[g].tur+' · '+gd[g].ulke+' · yeni kırmızı uyarı', 'red_'+gd[g].tur+'_'+gd[g].ulke+'_'+String(gd[g].tarih).slice(0,10));
      }
    }
  }
  /* 4) yeni CVE */
  if(CANLI_HAM.nvd && CANLI_HAM.nvd.length>=ALARM.yeniCve){
    alarmYaz('SİBER', 'NVD\'de son 7 günde '+CANLI_HAM.nvd.length+' yeni CVE var (en yüksek puan: '+(CANLI_HAM.nvd[0].puan||'-')+')', 'cve_'+String((CANLI_HAM.nvd[0]||{}).cve||''));
  }
  alarmLogYaz();
}
function alarmLogYaz(){
  var el=$('alarmLog'); if(!el) return;
  var kayitlar=[];
  try{ kayitlar=JSON.parse(localStorage.getItem('ustad_alarm_log')||'[]'); }catch(e){}
  if(!kayitlar.length){ el.innerHTML='<div class="soluk">henüz alarm çalmadı</div>'; return; }
  var h='<div class="kartListe">';
  for(var i=0;i<kayitlar.length;i++){
    h+='<div class="haberSatir"><div class="kaynak">'+esc(kayitlar[i].tur)+'</div><div class="baslik">'+esc(kayitlar[i].metin)+'</div>'
     +'<div class="tarih">'+new Date(kayitlar[i].t).toLocaleString('tr-TR')+'</div></div>';
  }
  el.innerHTML=h+'</div>';
}
setInterval(function(){ try{ alarmKontrol(); }catch(e){} }, 3*60000);

/* ---------------- 2) DIŞA AKTARMA (CSV / Word) ---------------- */
function dosyaIndir(icerik, ad, tur){
  var blob=new Blob([icerik], {type:tur||'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=ad; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 800);
}
function csvYap(basliklar, satirlar){
  var s=basliklar.join(';')+'\r\n';
  for(var i=0;i<satirlar.length;i++){
    s+=satirlar[i].map(function(x){ return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'; }).join(';')+'\r\n';
  }
  return '\ufeff'+s;
}
function depremCsv(){
  var kaynak=(ZAMAN_VERI||[]).filter(function(v){ return v.tur==='deprem'; });
  var satir=kaynak.map(function(v){ return [new Date(v.ts).toLocaleString('tr-TR'), v.ad, v.lat.toFixed(4), v.lng.toFixed(4)]; });
  if(!satir.length){ durum('alarm','✘ indirilecek deprem verisi yok (zaman makinesi verisini aç)'); return; }
  dosyaIndir(csvYap(['Zaman','Olay','Enlem','Boylam'], satir), 'ustad-depremler.csv');
  durum('alarm','✔ '+satir.length+' deprem CSV olarak indirildi');
}
function tehditCsv(){
  var satir=[];
  (CANLI_HAM.feodo||[]).forEach(function(x){ satir.push(['C2', x.ip, x.ulke, x.iss, x.malware]); });
  (CANLI_HAM.ransom||[]).forEach(function(x){ satir.push(['RANSOM', x.grup, x.ulke, x.sektor, x.kurban]); });
  (CANLI_HAM.openphish||[]).forEach(function(x){ satir.push(['PHISH', x, '', '', '']); });
  if(!satir.length){ durum('alarm','✘ indirilecek tehdit verisi yok (SİBER TEHDİT sekmesini aç)'); return; }
  dosyaIndir(csvYap(['Tür','Değer1','Ülke','Sağlayıcı/Sefer','Detay'], satir), 'ustad-tehdit-ioc.csv');
  durum('alarm','✔ '+satir.length+' IOC kaydı CSV olarak indirildi');
}
function gunlukBulten(){
  var t=new Date(), gunler=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  var ozet=[];
  function satir(baslik, deger){ ozet.push('<tr><td style="border:1px solid #999;padding:6px"><b>'+baslik+'</b></td><td style="border:1px solid #999;padding:6px">'+deger+'</td></tr>'); }
  var dep=(ZAMAN_VERI||[]).filter(function(v){ return v.tur==='deprem' && Date.now()-v.ts<86400000; });
  var enBuyuk=null; dep.forEach(function(v){ var m=parseFloat(String(v.ad).replace('M',''))||0; if(!enBuyuk||m>enBuyuk.m) enBuyuk={m:m, ad:v.ad}; });
  var gd=(CANLI_HAM.gdacs||[]);
  var kirmizi=gd.filter(function(x){ return x.seviye==='Red'; }).length;
  var uzay=CANLI_HAM.uzay||{};
  var siber={ c2:(CANLI_HAM.feodo||[]).length, ransomware:(CANLI_HAM.ransom||[]).length, phish:(CANLI_HAM.openphish||[]).length,
              tor:(CANLI_HAM.tor&&CANLI_HAM.tor[0])?CANLI_HAM.tor[0]:null, cve:(CANLI_HAM.nvd||[]).length };
  satir('Tarih', t.toLocaleString('tr-TR')+' · '+gunler[t.getDay()]);
  satir('Son 24 saatte deprem (M4.5+)', dep.length+' adet');
  satir('En büyük deprem', enBuyuk? ('M'+enBuyuk.m+' · '+enBuyuk.ad) : 'kayıt yok');
  satir('GDACS açık olay', gd.length+' (kırmızı: '+kirmizi+')');
  satir('Uzay havası', 'Kp '+(uzay.kp==null?'-':uzay.kp)+' · güneş rüzgârı '+(uzay.ruzgarHiz?Math.round(uzay.ruzgarHiz)+' km/sa':'-')+' · parlama '+(uzay.xraySinif||'-'));
  satir('Canlı uydu / Starlink', (CANLI_HAM.uyducSay||0)+' / '+(CANLI_HAM.starlinkSay||0));
  satir('Gemi (AIS) / uçak', (CANLI_HAM.gemi||0)+' / '+(CANLI_HAM.ucakSay||0));
  satir('Siber: C2 sunucusu', siber.c2+' adet (Feodo Tracker)');
  satir('Siber: fidye mağduru', siber.ransomware+' kayıt (ransomwatch)');
  satir('Siber: kimlik avı URL', siber.phish+' adet (OpenPhish)');
  satir('Siber: yeni CVE (7 gün)', siber.cve+' adet (NVD)');
  satir('Tor: en çok röle', siber.tor? (siber.tor.ulke+' · '+siber.tor.role+' röle · çıkış '+siber.tor.cikis) : '-');
  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
   +'<head><meta charset="utf-8"><title>ÜSTAD Günlük Bülten</title></head><body style="font-family:Calibri,Arial,sans-serif">'
   +'<h1 style="color:#0a5">ÜSTAD DÜNYA MONİTÖRÜ — GÜNLÜK BÜLTEN</h1>'
   +'<h3 style="color:#060">Kenan Kuzucu · Gaziantep</h3>'
   +'<table style="border-collapse:collapse;width:100%">'+ozet.join('')+'</table>'
   +'<p style="font-size:12px;color:#444">Kaynaklar: USGS · GDACS · NASA EONET · NOAA SWPC · CelesTrak · Open-Meteo · Digitraffic · SİBER: CISA KEV · OpenPhish · URLhaus · Feodo Tracker · ransomwatch · Tor Metrics · NVD.</p>'
   +'<p style="font-size:11px;color:#777">Bu bülten ÜSTAD DÜNYA MONİTÖRÜ panelinden otomatik üretildi. Yalnızca halka açık veri kullanılır.</p>'
   +'</body></html>';
  dosyaIndir(html, 'USTAD-GUNLUK-BULTEN-'+t.toISOString().slice(0,10)+'.doc', 'application/msword');
  durum('alarm','✔ günlük bülten indirildi (Word ile açılır)');
}
/* ---------------- 3) OLAY GRAFİĞİ (sparkline) ---------------- */
function sparklineCiz(){
  var el=$('sparkline'); if(!el || typeof EK_VERI !== 'undefined'){ }
  if(!el) return;
  var gunler=[], simdiG=new Date();
  for(var i=29;i>=0;i--){
    var g=new Date(simdiG.getTime()-i*86400000);
    gunler.push({bas:new Date(g.getFullYear(),g.getMonth(),g.getDate()).getTime(), adet:0});
  }
  for(var k=0;k<(ZAMAN_VERI||[]).length;k++){
    var v=ZAMAN_VERI[k]; if(v.tur!=='deprem') continue;
    for(var g2=0;g2<gunler.length;g2++){ if(v.ts>=gunler[g2].bas && v.ts<gunler[g2].bas+86400000){ gunler[g2].adet++; break; } }
  }
  var enb=1; gunler.forEach(function(x){ if(x.adet>enb) enb=x.adet; });
  var w=el.width=Math.max(260, el.clientWidth||280), h=el.height=90;
  var ctx=el.getContext('2d'); if(!ctx) return;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(34,197,94,0.12)'; ctx.fillRect(0,0,w,h);
  ctx.beginPath(); ctx.strokeStyle=temaRengi(); ctx.lineWidth=2;
  for(var s=0;s<gunler.length;s++){
    var x=(s/(gunler.length-1))*(w-6)+3, y=h-6-(gunler[s].adet/enb)*(h-14);
    if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.fillStyle='#94a3b8'; ctx.font='10px monospace';
  ctx.fillText('30 günlük deprem (M4.5+) · en yoğun gün: '+enb+' olay', 6, 12);
}
/* ---------------- 4) SESLİ ÖZET (TTS) ---------------- */
function sesliOzet(){
  if(!('speechSynthesis' in window)){ durum('alarm','✘ bu tarayıcı sesli okumayı desteklemiyor'); return; }
  var dep=(ZAMAN_VERI||[]).filter(function(v){ return v.tur==='deprem' && Date.now()-v.ts<86400000; });
  var uzay=CANLI_HAM.uzay||{}, gd=(CANLI_HAM.gdacs||[]);
  var metin='Üstad dünya monitörü özeti. Son yirmi dört saatte ' + dep.length + ' büyük deprem kaydedildi. '
   + 'Açık afet olayı sayısı ' + gd.length + '. Jeomanyetik aktivite Kp ' + (uzay.kp==null?'bilinmiyor':uzay.kp) + '. '
   + 'Küre üzerinde ' + (CANLI_HAM.gemi||0) + ' gemi ve ' + (CANLI_HAM.uyducSay||0) + ' uydu izleniyor. '
   + 'Siber tarafta ' + ((CANLI_HAM.feodo||[]).length) + ' botnet sunucusu ve ' + ((CANLI_HAM.openphish||[]).length) + ' kimlik avı adresi listelendi.';
  var u=new SpeechSynthesisUtterance(metin);
  u.lang='tr-TR'; u.rate=1.0; u.pitch=1.0;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  durum('alarm','🔊 sesli özet okunuyor…');
}
/* ---------------- 5) ALARM SEKMESİ ---------------- */
function alarmPanelHTML(){
  return '<h2 class="panelBaslik">🔔 ALARM · BÜLTEN · DIŞA AKTARMA</h2>'
   +'<div id="alarmSerit" style="display:none;background:rgba(255,59,59,.12);border:1px solid var(--hata);color:var(--yazi);padding:8px 10px;border-radius:3px;margin-bottom:10px"></div>'
   +'<div class="durum" id="durum_alarm"></div>'
   +'<div id="sonuc_alarm"></div>';
}
function alarmPanel(){
  alarmYukle();
  var h='<div class="linkKart"><div class="lkAd">🔔 ALARM KURALLARI</div>'
   +'<div class="lkNot">Seçtiğin koşul gerçekleşince panel masaüstü bildirimi verir ve ses çalar. Kurallar bu bilgisayarda saklanır.</div>'
   +'<div class="katIzgara" style="max-height:none;margin-top:8px">'
   +'<label class="katSat"><input type="checkbox" id="al_acik" '+(ALARM.acik?'checked':'')+'> Alarm sistemi açık</label>'
   +'<label class="katSat"><input type="checkbox" id="al_ses" '+(ALARM.ses?'checked':'')+'> Sesli uyarı (bip)</label>'
   +'<label class="katSat"><input type="checkbox" id="al_afet" '+(ALARM.afetKirmizi?'checked':'')+'> Kırmızı seviye afet çıkınca</label>'
   +'</div>'
   +'<table class="tbl" style="margin-top:8px">'
   +'<tr><td class="k">Deprem büyüklüğü eşiği</td><td class="v"><input id="al_mag" type="number" step="0.1" value="'+ALARM.depremMag+'" style="width:80px;background:var(--kod);color:var(--yazi);border:1px solid var(--cizgi)"></td></tr>'
   +'<tr><td class="k">Gaziantep\'e uzaklık (km)</td><td class="v"><input id="al_km" type="number" value="'+ALARM.depremKm+'" style="width:80px;background:var(--kod);color:var(--yazi);border:1px solid var(--cizgi)"></td></tr>'
   +'<tr><td class="k">Kp indeksi eşiği</td><td class="v"><input id="al_kp" type="number" value="'+ALARM.kp+'" style="width:80px;background:var(--kod);color:var(--yazi);border:1px solid var(--cizgi)"></td></tr>'
   +'<tr><td class="k">Yeni CVE sayısı eşiği (7 gün)</td><td class="v"><input id="al_cve" type="number" value="'+ALARM.yeniCve+'" style="width:80px;background:var(--kod);color:var(--yazi);border:1px solid var(--cizgi)"></td></tr>'
   +'</table>'
   +'<div class="ucusAyar" style="padding:8px 0 0"><button onclick="alarmKaydet()">KAYDET</button>'
   +'<button onclick="alarmIzinIste()">BİLDİRİM İZNİ VER</button>'
   +'<button onclick="alarmKontrol()">ŞİMDİ SINAY</button></div></div>';
  h+='<div class="linkKart" style="margin-top:10px"><div class="lkAd">📄 GÜNLÜK WORD BÜLTENİ</div>'
   +'<div class="lkNot">Paneldeki canlı verilerden tek tıkla günlük özet belgesi üretir (Word ile açılır .doc).</div>'
   +'<div class="ucusAyar" style="padding:8px 0 0"><button onclick="gunlukBulten()">BÜLTENİ İNDİR (.doc)</button>'
   +'<button onclick="sesliOzet()">🔊 SESLİ ÖZET</button></div></div>';
  h+='<div class="linkKart" style="margin-top:10px"><div class="lkAd">⬇️ VERİ DIŞA AKTARMA (CSV)</div>'
   +'<div class="lkNot">Excel\'de açılır. Deprem listesi için önce kürede "ZAMAN MAKİNESİ"ni aç.</div>'
   +'<div class="ucusAyar" style="padding:8px 0 0"><button onclick="depremCsv()">DEPREMLER (CSV)</button>'
   +'<button onclick="tehditCsv()">TEHDİT / IOC (CSV)</button></div></div>';
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">30 GÜNLÜK DEPREM GRAFİĞİ</h3>';
  h+='<canvas id="sparkline" style="width:100%;height:90px;border:1px solid var(--cizgi);border-radius:3px"></canvas>';
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin:16px 0 8px">ALARM GEÇMİŞİ</h3><div id="alarmLog"></div>';
  $('sonuc_alarm').innerHTML=h;
  alarmLogYaz();
  if(!ZAMAN_VERI || !ZAMAN_VERI.length){
    zamanVerisiYukle().then(function(m){ durum('alarm','✔ '+m); sparklineCiz(); }).catch(function(){ sparklineCiz(); });
  } else sparklineCiz();
  if(typeof durum==='function') durum('alarm','✔ alarm paneli hazır');
}
/* sekme yönlendirmesi */
var _eskiOzelPanelHTML=ozelPanelHTML;
ozelPanelHTML=function(id){
  if(id==='alarm') return alarmPanelHTML();
  return _eskiOzelPanelHTML(id);
};
var _eskiOzelPanelYukle=ozelPanelYukle;
ozelPanelYukle=function(id, zorla){
  if(id==='alarm'){ alarmPanel(); return; }
  return _eskiOzelPanelYukle(id, zorla);
};
alarmYukle();
setTimeout(function(){ try{ alarmKontrol(); }catch(e){} }, 45000);
