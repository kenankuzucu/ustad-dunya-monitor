/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — KATMAN ALTYAPISI (v5.1)
   B grubu: 2D'ye katman taşıma · hazır mod setleri · katman arama ·
            katman yaşı + tek tek yenileme
   katmanlar.js'ten SONRA yüklenir.
   ============================================================ */

/* ---------------- 1) 2D HARİTAYA KATMAN TAŞIMA ---------------- */
var HARITA_KATMAN={};          /* tur -> L.layerGroup */
var HARITA_SON=0;              /* son senkron zamanı */
var HARITA_SINIR=350;          /* katman başına en fazla nokta */

var _ktnKilit=false;
function kureTumNoktalar(){
  /* yeniden giriş koruması: sarmalayıcılar birbirini çağırırsa sonsuz döngü olmasın */
  if(_ktnKilit) return [];
  _ktnKilit=true;
  var out=[];
  try{
    for(var i=0;i<KURE_VERI.length;i++) out.push(KURE_VERI[i]);
    if(typeof canliNoktalar==='function'){ var c=canliNoktalar(); for(var j=0;j<c.length;j++) out.push(c[j]); }
  }catch(e){}
  _ktnKilit=false;
  return out;
}
function kureTumYollar(){
  var out=[];
  if(typeof VERI_TICARET!=='undefined') for(var i=0;i<VERI_TICARET.length;i++){
    var r=VERI_TICARET[i], pts=[]; for(var k=0;k<r.length-1;k++) pts.push([r[k][0],r[k][1]]);
    out.push({pts:pts, ad:r[r.length-1], renk:'#06b6d4', tur:'ticaret'});
  }
  if(typeof statikYollar==='function'){ var s=statikYollar(); for(var a=0;a<s.length;a++) out.push(s[a]); }
  if(typeof canliYollar==='function'){ var y=canliYollar(); for(var b=0;b<y.length;b++) out.push(y[b]); }
  return out;
}
function noktaRenk(p){ return p.renk || '#22c55e'; }

function haritaKatmanlariCiz(zorla){
  if(!HARITA || MOD!=='2d') return;
  var simdiMs=Date.now();
  if(!zorla && simdiMs-HARITA_SON < 12000) return;   /* en fazla 12 sn'de bir */
  HARITA_SON=simdiMs;
  var noktalar=kureTumNoktalar(), yollar=kureTumYollar();

  /* hangi türler gerekiyor */
  var sayim={};
  for(var i=0;i<noktalar.length;i++){ var t=noktalar[i].tur; if(!sayim[t]) sayim[t]=0; sayim[t]++; }

  /* aktif olmayan/boş türleri temizle */
  for(var tur in HARITA_KATMAN){
    if(!KATMAN[tur] || !sayim[tur]){ HARITA.removeLayer(HARITA_KATMAN[tur]); delete HARITA_KATMAN[tur]; }
  }
  /* noktaları yeniden kur (tür başına) */
  var turListesi={};
  for(var n=0;n<noktalar.length;n++){
    var p=noktalar[n];
    if(!KATMAN[p.tur]) continue;
    if(!turListesi[p.tur]) turListesi[p.tur]=[];
    if(turListesi[p.tur].length < HARITA_SINIR) turListesi[p.tur].push(p);
  }
  for(var tt in turListesi){
    if(HARITA_KATMAN[tt]) HARITA.removeLayer(HARITA_KATMAN[tt]);
    var grup=L.layerGroup();
    var dizi=turListesi[tt];
    for(var m=0;m<dizi.length;m++){
      var q=dizi[m], renk=noktaRenk(q);
      var r=Math.max(3, Math.round((q.cap||0.4)*10));
      L.circleMarker([q.lat,q.lng],{ radius:r, color:renk, weight:1.2, fillColor:renk, fillOpacity:0.6 })
        .bindPopup('<b>'+esc(q.ad||tt)+'</b>').addTo(grup);
    }
    grup.addTo(HARITA);
    HARITA_KATMAN[tt]=grup;
  }
  /* yollar (hat katmanları) */
  var yolTurleri=['ticaret','boru','koridor','termin','ruzgar'];
  for(var yy=0; yy<yolTurleri.length; yy++){
    var yt=yolTurleri[yy];
    if(yt==='ruzgar') continue;         /* 2D'de rüzgâr okları çok kalabalık */
    if(HARITA_KATMAN['hat_'+yt]){ HARITA.removeLayer(HARITA_KATMAN['hat_'+yt]); delete HARITA_KATMAN['hat_'+yt]; }
    if(!KATMAN[yt]) continue;
    var hgrup=L.layerGroup(), eklendi=0;
    for(var z=0;z<yollar.length;z++){
      var y=yollar[z];
      if(y.tur!==yt) continue;
      var latlngs=[];
      for(var pp=0;pp<y.pts.length;pp++) latlngs.push([y.pts[pp][0], y.pts[pp][1]]);
      if(latlngs.length<2) continue;
      if(yt==='termin'){
        L.polyline(latlngs,{color:'#e5e7eb',weight:1.4,opacity:0.75,dashArray:'6,6'}).bindPopup('<b>Gece/Gündüz sınırı</b>').addTo(hgrup);
      } else {
        L.polyline(latlngs,{color:y.renk||'#06b6d4',weight:1.6,opacity:0.7}).bindPopup('<b>'+esc(y.ad||'')+'</b>').addTo(hgrup);
      }
      eklendi++;
    }
    if(eklendi){ hgrup.addTo(HARITA); HARITA_KATMAN['hat_'+yt]=hgrup; }
  }
}
/* 2D açıldığında ve katman değiştiğinde çağrılır */
function haritaSenkron(zorla){
  if(MOD!=='2d') return;
  haritaKatmanlariCiz(zorla);
}

/* ---------------- 2) HAZIR MOD SETLERİ ---------------- */
var MOD_SETLERI=[
 {ad:'🌍 GENEL',     renk:'#22c55e', k:['deprem','yangin','gdacs','ucak','askeriucak','iss','hava','termin','ticaret','catisma','askeri','fay','havalimani','platform']},
 {ad:'🚨 AFET MODU', renk:'#ff3b3b', k:['deprem','depremuyari','yangin','gdacs','kasirga','volkan','tsunami','dalga','yagis','hava','termin','fay','yakinlik','depremdalga']},
 {ad:'✈ UÇUŞ MODU',  renk:'#7dd3fc', k:['ucak','askeriucak','askeri','iss','uyduc','starlink','hava','ruzgar','liman','termin','havalimani','ucakiz','yorunge']},
 {ad:'🛡 SİBER MODU', renk:'#f472b6', k:['gemi','ucak','ticaret','kablolar','verimerkezi','nukleer','cipfab','termin','feodo','ransom','saldiri','tor','fay']},
 {ad:'🛰 UZAY MODU',  renk:'#c4b5fd', k:['iss','uyduc','starlink','aurora','termin','uzay','hava','uzaycopu','yorunge','meteor','auroracizgi']},
 {ad:'🇹🇷 TÜRKİYE',  renk:'#ef4444', k:['deprem','yangin','gdacs','ucak','termin','boru','liman','ticaret','santral','catisma','fay','yakinlik','trhava','havalimani']},
 {ad:'🌊 DENİZ MODU',renk:'#2dd4bf', k:['gemi','dalga','ticaret','liman','rafineri','boru','termin','platform','gaz','gemiyogunluk']},
 {ad:'🧹 TEMİZLE',    renk:'#94a3b8', k:[]}
];
function modSetiUygula(i){
  var set=MOD_SETLERI[i]; if(!set) return;
  /* sette olmayan HER katman kapanır (yeni eklenenler dahil) */
  for(var t in KATMAN){ KATMAN[t] = (set.k.indexOf(t)>=0) ? 1 : 0; }
  /* canlı katman zamanlayıcılarını ayarla */
  for(var z=0; z<ZAMAN_PLANI.length; z++){
    var plan=ZAMAN_PLANI[z];
    if(KATMAN[plan.id]){ calistir(plan, false); } else if(CANLI_TICK[plan.id]){ clearInterval(CANLI_TICK[plan.id]); CANLI_TICK[plan.id]=null; }
  }
  if(KATMAN.gemi===1) gemiYukle().catch(function(){});
  if(typeof htmlYenile==='function') htmlYenile();
  katPanelOlustur();
  kureCiz();
  haritaKatmanlariCiz(true);
  if(typeof durum==='function') durum('harita','✔ mod seti: '+set.ad.replace(/[^\wğüşıöçĞÜŞİÖÇ ]/g,'').trim()+' ('+set.k.length+' katman)');
}

/* ---------------- 3) KATMAN ARAMA ---------------- */
function katmanAra(deger){
  var q=(deger||'').toLocaleLowerCase('tr');
  var satirlar=document.querySelectorAll('#katPanel .katSat');
  var grupBasliklari=document.querySelectorAll('#katPanel .katGrup');
  var gorunen=0;
  for(var i=0;i<satirlar.length;i++){
    var s=satirlar[i], metin=(s.textContent||'').toLocaleLowerCase('tr');
    var uy=(q==='' || metin.indexOf(q)>=0);
    s.style.display = uy? '' : 'none';
    if(uy && s.style.display!=='none') gorunen++;
  }
  for(var g=0;g<grupBasliklari.length;g++){
    grupBasliklari[g].style.display = (q==='')? '' : 'none';
  }
  var bilgi=document.getElementById('katAramaBilgi');
  if(bilgi) bilgi.textContent = q? (gorunen+' katman bulundu') : '';
}

/* ---------------- 4) KATMAN YAŞI + YENİLE ---------------- */
function katmanYasi(id){
  var t=CANLI_SAAT[id]; if(!t) return '';
  var sn=Math.round((Date.now()-t.getTime())/1000);
  if(sn<60) return sn+' sn önce';
  if(sn<3600) return Math.round(sn/60)+' dk önce';
  return Math.round(sn/3600)+' sa önce';
}
function katmanYenile(id, olay){
  if(olay && olay.stopPropagation) olay.stopPropagation();
  var plan=null;
  for(var i=0;i<ZAMAN_PLANI.length;i++){ if(ZAMAN_PLANI[i].id===id){ plan=ZAMAN_PLANI[i]; break; } }
  if(!plan){ if(typeof durum==='function') durum('harita', id+' katmanı zamanlanmış yenileme içermiyor.'); return; }
  if(typeof durum==='function') durum('harita', id+' yenileniyor…');
  plan.fn().then(function(m){ if(typeof durum==='function') durum('harita','✔ '+(m||id)); kureCiz(); haritaKatmanlariCiz(true); katYasTazele(); })
    .catch(function(e){ if(typeof durum==='function') durum('harita','✘ '+id+': '+String(e.message||e)); });
}
function katYasTazele(){
  var yerler=document.querySelectorAll('#katPanel [data-yas]');
  for(var i=0;i<yerler.length;i++){
    var id=yerler[i].getAttribute('data-yas');
    yerler[i].textContent=katmanYasi(id);
  }
}
setInterval(function(){ try{ katYasTazele(); }catch(e){} }, 30000);
setInterval(function(){ try{ haritaSenkron(); }catch(e){} }, 15000);
