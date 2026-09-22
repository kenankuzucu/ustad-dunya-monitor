/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — İLERİ GÖRSEL & ERİŞİLEBİLİRLİK (v5.4)
   · 3B SÜTUN modu (deprem büyüklüğü yüksekliğe dönüşür)
   · AKIŞ ÇİZGİLERİ (havalimanı rota ağı yayları)
   · ZAMAN-MEKÂN KÜPÜ (enlem · boylam · zaman üç boyutlu serpme)
   · EKRAN KORUYUCU / SALON MODU (saat + skor + son olaylar)
   · BÜYÜK YAZI · RENK KÖRÜ · YÜKSEK KONTRAST modları
   ============================================================ */
var SUTUN=false, AKIS=false, KORUYUCU=null, KORUYUCU_TICK=null;

/* ---------------- 1) 3B SÜTUN MODU ---------------- */
function sutunDegis(){
  SUTUN=!SUTUN;
  try{
    if(KURE){
      if(SUTUN){
        KURE.pointAltitude(function(p){
          if(p.tur==='deprem'||p.tur==='emsc'||p.tur==='depremuyari'){
            var m=(p.ad||'').match(/M([\d.]+)/);
            var mag=m? parseFloat(m[1]) : 5;
            return Math.max(0.03, (mag-3)*0.05);
          }
          return p.yuk||0.01;
        });
      } else {
        KURE.pointAltitude('yuk');
      }
      if(typeof kureCiz==='function') kureCiz();
    }
  }catch(e){}
  durum('harita', SUTUN? '🏔 3B SÜTUN modu AÇIK — deprem büyüklüğü yüksekliğe dönüştü':'3B sütun modu kapandı');
  return SUTUN? '3B sütun AÇIK':'3B sütun kapalı';
}
/* ---------------- 2) AKIŞ ÇİZGİLERİ (rota ağı) ---------------- */
function akisDegis(){
  AKIS=!AKIS;
  try{
    if(KURE){
      if(AKIS){
        var hava=(typeof VERI_HAVALIMANI!=='undefined')? VERI_HAVALIMANI : [];
        var yaylar=[];
        for(var i=0;i<hava.length;i++){
          for(var j=i+1;j<hava.length;j++){
            var a=hava[i], b=hava[j];
            if(!a||!b) continue;
            var d=mesafeKm(a[0],a[1],b[0],b[1]);
            if(d<1200 || d>9000) continue;
            yaylar.push({baslangicLat:a[0], baslangicLng:a[1], bitisLat:b[0], bitisLng:b[1],
              renk:'rgba(34,197,94,0.55)'});
            if(yaylar.length>=90) break;
          }
          if(yaylar.length>=90) break;
        }
        KURE.arcsData(yaylar);
        durum('harita','🛫 AKIŞ ÇİZGİLERİ açık — '+yaylar.length+' havalimanı rota yayı (görsel ağ)');
      } else {
        KURE.arcsData([]);
        if(typeof kureCiz==='function') kureCiz();
        durum('harita','akış çizgileri kapandı');
      }
    }
  }catch(e){}
  return AKIS? 'akış çizgileri AÇIK':'akış çizgileri kapalı';
}
/* ---------------- 3) ZAMAN-MEKÂN KÜPÜ ---------------- */
function zamanMekanKupu(){
  var eski=$('kupKat'); if(eski) eski.remove();
  var kat=document.createElement('div');
  kat.id='kupKat';
  kat.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.93);z-index:8800;display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Consolas,monospace;color:#c9ffd8';
  kat.innerHTML='<div style="color:#7bffa1;letter-spacing:3px;font-size:13px;margin-bottom:8px">🧊 ZAMAN-MEKÂN KÜPÜ · ENLEM × BOYLAM × ZAMAN (30 gün)</div>'
   +'<canvas id="kupTuval" width="900" height="560" style="border:1px solid #22c55e;box-shadow:0 0 30px #22c55e;max-width:95vw"></canvas>'
   +'<div style="margin-top:10px;font-size:11px;color:#79b98b">döndürmek: fare ile sürükle · kapatmak: Esc veya aşağıdaki düğme</div>'
   +'<button onclick="document.getElementById(\'kupKat\').remove();window.__kupDur=false" style="margin-top:8px;background:#04120a;border:1px solid #22c55e;color:#7bffa1;font-family:inherit;padding:6px 16px;border-radius:4px;cursor:pointer">KAPAT</button>';
  document.body.appendChild(kat);
  var c=$('kupTuval'), x=c.getContext('2d');
  var veri=[];
  try{
    if(typeof ZAMAN_VERI!=='undefined' && ZAMAN_VERI.length){
      for(var i=0;i<ZAMAN_VERI.length;i++){
        var v=ZAMAN_VERI[i];
        if(v.lat==null||!v.ts) continue;
        veri.push({lat:v.lat, lng:v.lng, t:v.ts, ad:v.ad||'', renk:v.renk||'#facc15'});
      }
    }
    if(!veri.length && typeof kureTumNoktalar==='function'){
      var n=kureTumNoktalar();
      for(var j=0;j<n.length;j++){
        if(n[j].lat==null) continue;
        veri.push({lat:n[j].lat, lng:n[j].lng, t:Date.now(), ad:n[j].ad||'', renk:n[j].renk||'#facc15'});
      }
    }
  }catch(e){}
  if(!veri.length){ alert('Küp için olay verisi yok.'); kat.remove(); return; }
  var tMin=Math.min.apply(null, veri.map(function(v){ return v.t; }));
  var tMax=Math.max.apply(null, veri.map(function(v){ return v.t; }));
  var aci=0.6, egim=0.42, surukle=false, sx=0, sy=0, aci0=0, egim0=0;
  c.onmousedown=function(e){ surukle=true; sx=e.clientX; sy=e.clientY; aci0=aci; egim0=egim; };
  window.addEventListener('mouseup', function(){ surukle=false; });
  c.onmousemove=function(e){
    if(!surukle) return;
    aci=aci0+(e.clientX-sx)*0.008;
    egim=Math.max(0.05, Math.min(1.3, egim0+(e.clientY-sy)*0.005));
  };
  function ciz(){
    if(!document.getElementById('kupKat')){ window.__kupDur=false; return; }
    x.clearRect(0,0,c.width,c.height);
    /* eksen kutusu */
    var O={x:c.width/2, y:c.height/2+80};
    var B=180;
    function proj(boy, zaman, en){
      var X=(boy/180)*B, Y=(zaman-0.5)*B*2.0, Z=(en/90)*B;
      var ca=Math.cos(aci), sa=Math.sin(aci), ce=Math.cos(egim), se=Math.sin(egim);
      var x1=X*ca-Z*sa, z1=X*sa+Z*ca;
      var y1=Y*ce-z1*se, z2=Y*se+z1*ce;
      var o=520/(520+z2*1.4);
      return {x:O.x+x1*o, y:O.y-y1*o, o:o, z:z2};
    }
    /* kenarlar */
    var kose=[[-180,0,-90],[180,0,-90],[180,1,-90],[-180,1,-90],[-180,0,90],[180,0,90],[180,1,90],[-180,1,90]];
    var kenar=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    x.lineWidth=1;
    for(var k=0;k<kenar.length;k++){
      var a1=proj(kose[kenar[k][0]][0], kose[kenar[k][0]][1], kose[kenar[k][0]][2]);
      var a2=proj(kose[kenar[k][1]][0], kose[kenar[k][1]][1], kose[kenar[k][1]][2]);
      x.strokeStyle='rgba(34,197,94,.25)';
      x.beginPath(); x.moveTo(a1.x,a1.y); x.lineTo(a2.x,a2.y); x.stroke();
    }
    /* noktalar */
    for(var i2=0;i2<veri.length;i2++){
      var v=veri[i2];
      var zt=(v.t-tMin)/Math.max(1,(tMax-tMin));
      var p=proj(v.lng, zt, v.lat);
      x.beginPath(); x.arc(p.x, p.y, (2.2*p.o)*(v.renk==='#ff3b3b'?1.6:1), 0, Math.PI*2);
      x.fillStyle=v.renk; x.globalAlpha=0.55+0.45*Math.min(1,p.o/1.2);
      x.fill(); x.globalAlpha=1;
    }
    /* etiketler */
    x.fillStyle='#7bffa1'; x.font='11px Consolas,monospace';
    x.fillText('BOYLAM →', c.width-120, c.height-14);
    x.fillText('ZAMAN ↑ (eski → yeni)', 14, 18);
    x.fillText('ENLEM (derinlik)', 14, c.height-14);
    x.fillStyle='#79b98b';
    x.fillText(veri.length+' olay · '+new Date(tMin).toLocaleDateString('tr-TR')+' → '+new Date(tMax).toLocaleDateString('tr-TR'), c.width/2-140, 18);
    if(!surukle) aci+=0.0018;
    window.__kupDur=true;
    requestAnimationFrame(ciz);
  }
  window.__kupDur=true;
  ciz();
  durum('harita','🧊 zaman-mekân küpü açıldı ('+veri.length+' olay)');
}

/* ---------------- 4) EKRAN KORUYUCU / SALON MODU ---------------- */
function koruyucuAc(){
  var el=$('ekranKoruyucu');
  if(!el){
    el=document.createElement('div'); el.id='ekranKoruyucu'; el.className='ekranKoruyucu';
    el.innerHTML='<div class="saat" id="ekSaat">--:--:--</div>'
      +'<div class="tarih" id="ekTarih"></div>'
      +'<div class="skor" id="ekSkor"></div>'
      +'<div class="liste" id="ekListe"></div>'
      +'<div class="imza">ÜSTAD KENAN KUZUCU · ÜSTAD DÜNYA MONİTÖRÜ · v5.4</div>';
    document.body.appendChild(el);
    el.onclick=function(){ koruyucuKapat(); };
  }
  el.style.display='block';
  koruyucuYaz();
  if(KORUYUCU_TICK) clearInterval(KORUYUCU_TICK);
  KORUYUCU_TICK=setInterval(koruyucuYaz, 1000);
  return 'ekran koruyucu açık';
}
function koruyucuKapat(){
  var el=$('ekranKoruyucu'); if(el) el.style.display='none';
  if(KORUYUCU_TICK){ clearInterval(KORUYUCU_TICK); KORUYUCU_TICK=null; }
}
function koruyucuYaz(){
  try{
    var d=new Date();
    var s=$('ekSaat'); if(s) s.textContent=d.toLocaleTimeString('tr-TR');
    var t=$('ekTarih'); if(t) t.textContent=d.toLocaleDateString('tr-TR',{weekday:'long', day:'numeric', month:'long', year:'numeric'}).toLocaleUpperCase('tr');
    var sk=$('ekSkor');
    if(sk){
      var sc=durumSkoru(), e=skorEtiket(sc.skor);
      sk.innerHTML='DÜNYA DURUM SKORU <b style="color:'+e.renk+'">'+sc.skor+'</b> <span style="color:'+e.renk+'">'+e.ad+'</span>';
    }
    var l=$('ekListe');
    if(l && (!l.textContent || d.getSeconds()%10===0)){
      var satir=[];
      try{
        var uy=(CANLI_HAM.depremUyariListe||[]).slice(0,4);
        for(var i=0;i<uy.length;i++) satir.push('M'+uy[i].mag+' · '+String(uy[i].yer||'').slice(0,52));
      }catch(e2){}
      try{
        var c2=zekaCumleleri().slice(0,3); for(var j=0;j<c2.length;j++) satir.push(c2[j]);
      }catch(e3){}
      l.innerHTML=satir.map(function(x){ return '• '+esc(x); }).join('<br>');
    }
  }catch(e){}
}
/* hareketsizlikte otomatik aç */
var IDLE_SON=Date.now();
['mousemove','keydown','click','scroll','touchstart'].forEach(function(o){
  document.addEventListener(o, function(){ IDLE_SON=Date.now(); var el=$('ekranKoruyucu'); if(el && el.style.display==='block'){ /* dokununca kapanmaz, düğme/Esc */ } });
});
setInterval(function(){
  try{
    if(localStorage.getItem('ustad_koruyucu')!=='1') return;
    if(Date.now()-IDLE_SON > 180000){ var el=$('ekranKoruyucu'); if(!el || el.style.display!=='block') koruyucuAc(); }
  }catch(e){}
}, 20000);
function koruyucuAyar(){
  var acik=localStorage.getItem('ustad_koruyucu')==='1';
  try{ localStorage.setItem('ustad_koruyucu', acik?'0':'1'); }catch(e){}
  durum('harita', (!acik)? '🖥 ekran koruyucu AÇIK (3 dk hareketsizlikte saat+skor ekranı)':'ekran koruyucu kapalı');
  if(!acik) koruyucuAc(); else koruyucuKapat();
}

/* ---------------- 5) ERİŞİLEBİLİRLİK MODLARI ---------------- */
function buyukYaziDegis(){
  var a=document.body.classList.toggle('buyukYazi');
  try{ localStorage.setItem('ustad_buyuk', a?'1':'0'); }catch(e){}
  durum('harita', a? '🔎 büyük yazı modu açık (salon/MV için)':'büyük yazı kapandı');
  return a? 'büyük yazı AÇIK':'büyük yazı kapalı';
}
function renkKoruDegis(){
  document.body.classList.remove('yuksekKontrast');
  var a=document.body.classList.toggle('renkKoru');
  try{ localStorage.setItem('ustad_renkkoru', a?'1':'0'); }catch(e){}
  durum('harita', a? '👁 renk körü modu açık (gri tonlama + kontrast)':'renk körü modu kapandı');
  return a? 'renk körü AÇIK':'renk körü kapalı';
}
function kontrastDegis(){
  document.body.classList.remove('renkKoru');
  var a=document.body.classList.toggle('yuksekKontrast');
  try{ localStorage.setItem('ustad_kontrast', a?'1':'0'); }catch(e){}
  durum('harita', a? '◐ yüksek kontrast modu açık':'yüksek kontrast kapandı');
  return a? 'yüksek kontrast AÇIK':'yüksek kontrast kapalı';
}

/* ---------------- 6) MENÜ (YARDIM + AYARLAR) ---------------- */
function gorselMenuHTML(){
  return '<h3 class="soluk" style="font-size:12px;letter-spacing:1px">🎛 GÖRÜNÜM ARAÇLARI</h3>'
   +'<div class="aracSatir">'
   +'<button class="aracBtn" onclick="sutunDegis()">🏔 3B SÜTUN MODU</button>'
   +'<button class="aracBtn" onclick="akisDegis()">🛫 AKIŞ ÇİZGİLERİ (rota ağı)</button>'
   +'<button class="aracBtn" onclick="zamanMekanKupu()">🧊 ZAMAN-MEKÂN KÜPÜ</button>'
   +'</div>'
   +'<div class="aracSatir">'
   +'<button class="aracBtn" onclick="koruyucuAc()">🖥 EKRAN KORUYUCU (şimdi)</button>'
   +'<button class="aracBtn" onclick="koruyucuAyar()">⏱ KORUYUCU: '+(localStorage.getItem('ustad_koruyucu')==='1'?'AÇIK':'KAPALI')+'</button>'
   +'<button class="aracBtn" onclick="buyukYaziDegis()">🔎 BÜYÜK YAZI</button>'
   +'<button class="aracBtn" onclick="renkKoruDegis()">👁 RENK KÖRÜ</button>'
   +'<button class="aracBtn" onclick="kontrastDegis()">◐ YÜKSEK KONTRAST</button>'
   +'</div>';
}
/* AYARLAR paneline ekle */
setTimeout(function(){
  if(typeof ayarlarPanel!=='function') return;
  var eski=ayarlarPanel;
  ayarlarPanel=function(){
    eski();
    var el=$('sonuc_ayarlar'); if(!el) return;
    if(!$('gorselAraclar')) el.insertAdjacentHTML('beforeend','<div id="gorselAraclar" style="margin-top:12px">'+gorselMenuHTML()+'</div>');
    else $('gorselAraclar').innerHTML=gorselMenuHTML();
  };
}, 3200);
/* açılışta modları geri yükle */
setTimeout(function(){
  try{
    if(localStorage.getItem('ustad_buyuk')==='1') document.body.classList.add('buyukYazi');
    if(localStorage.getItem('ustad_renkkoru')==='1') document.body.classList.add('renkKoru');
    if(localStorage.getItem('ustad_kontrast')==='1') document.body.classList.add('yuksekKontrast');
  }catch(e){}
}, 2400);
document.addEventListener('keydown', function(e){
  if(e.key==='Escape') koruyucuKapat();
});
