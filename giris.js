/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — AÇILIŞ ANİMASYONU (v5.3)
   Ultra giriş sahnesi: 3B yıldız alanı · tel kafes küre (gerçek
   tesis koordinatları) · madalyon · neon isim · hoş geldin yazısı ·
   canlı açılış aşamaları · panel içine dalış geçişi
   Süre ~5,2 saniye · Esc / boşluk / tık ile atlanabilir
   ============================================================ */
(function(){
  'use strict';
  var GIRIS_SURE=20000;         /* milisaniye — üstadım 20 saniye istedi */
  var AYAR='1';
  try{ AYAR=localStorage.getItem('ustad_giris')||'1'; }catch(e){}
  var KAPALI=(AYAR==='0');
  /* günde bir modu */
  if(AYAR==='gun'){
    var bugunYeni=new Date().toDateString();
    try{ if(localStorage.getItem('ustad_giris_gun')===bugunYeni) KAPALI=true; else localStorage.setItem('ustad_giris_gun', bugunYeni); }catch(e){}
  }
  /* #giris adresiyle açılırsa animasyon her zaman oynar (kolay gösterim) */
  try{ if(location.hash==='#giris') KAPALI=false; }catch(e){}
  if(KAPALI) return;

  var baslangic=null, bitti=false, atlandi=false, PART=[];
  var ctx=null, W=0, H=0, DPR=Math.min(window.devicePixelRatio||1, 2);
  var kureNokta=[], yildizlar=[], kureAci=0, patlama=0;

  /* ---------- 1) İSKELET (DOM) ---------- */
  /* ismi harf harf sarar: her harf kendi neon parlamasıyla gelir */
  function harfSar(metin, gecikme){
    var h='';
    for(var i=0;i<metin.length;i++){
      var ch=metin.charAt(i);
      if(ch===' '){ h+='<span class="gHarf bos">&nbsp;</span>'; continue; }
      h+='<span class="gHarf" style="animation-delay:'+(gecikme+i*0.075).toFixed(2)+'s,'+(gecikme+i*0.11+1).toFixed(2)+'s">'+ch+'</span>';
    }
    return h;
  }
  /* ismin üzerinde gezinen yıldız kıvılcımları */
  function kilavuzSus(){
    var s='', kon=[[3,-18],[16,-26],[30,-16],[45,-24],[60,-15],[74,-26],[88,-17],[95,-23]];
    for(var i=0;i<kon.length;i++){
      s+='<span class="gKivilcim" style="left:'+kon[i][0]+'%;top:'+kon[i][1]+'px;animation-delay:'+(3.9+i*0.32).toFixed(2)+'s">✦</span>';
    }
    return s;
  }
  /* kenar kayan veri yazıları */
  function kayanYazi(metin){
    return '<b>'+metin+' · '+metin+' · </b>';
  }
  /* kenar ekolayzer çubukları */
  function ekolarYap(){
    var h='';
    for(var yon=0;yon<2;yon++){
      h+='<div class="gEko '+(yon?'sag':'sol')+'">';
      for(var i=0;i<14;i++) h+='<i style="animation-delay:'+((i*0.09)+(yon?0.4:0)).toFixed(2)+'s;animation-duration:'+(1.6+((i*7)%5)*0.22).toFixed(2)+'s"></i>';
      h+='</div>';
    }
    return h;
  }
  var KURT_YOL='M255.563 22.094c-126.81 0-229.594 102.784-229.594 229.594 0 25.4 4.132 49.846 11.75 72.687 40.154-24.203 76.02-41.17 107.56-52.03-35.752 5.615-66.405 23.66-109.843 4 31.552-27.765 87.682-65.842 138.532-71.658 26.58-21.615 68.113-43.962 89.655-37.28 30.492-26.873 67.982-61.093 108.125-85.75 10.667 16.156 17.124 35.94 12.563 57.874-80.37 20.205-61.692 148.928 13.468 67.44 6.348 13.064 9.41 26.665 9.095 41.436-32.675 33.83-66.97 63.026-101.938 87.906.466 23.99-5.605 52.915-19 84.813-5.635 13.42-7.33 36.406 22.875 53.97 101.14-24.012 176.375-114.924 176.375-223.408 0-126.81-102.815-229.593-229.625-229.593zm3.312 164.375c-17.835 2.22-32.794 9.046-45.844 18.968 12.083-.036 25.612 2.882 37.5 6.156 6.208-6.698 10.236-18.52 8.345-25.125z';
  var kap=document.createElement('div');
  kap.id='girisSahne';
  kap.innerHTML =
   '<canvas id="girisTuval"></canvas>'
  +'<div class="gNobet" id="gNobet">'
   +'<div class="gNobetAd" id="gNobetAd"><span class="gNbUc">\u25c8</span>\u00dcSTAD KENAN KUZUCU<span class="gNbUc">\u25c8</span></div>'
   +'<div class="gNobetSatir" id="gNobetSatir">'
     +'<canvas class="gHacker" id="gHackerLogoSol" width="104" height="104" title="Beyaz \u015fapkal\u0131 hacker"></canvas>'
     +'<canvas class="gBayrak" id="gBayrakSol" width="132" height="88" title="T\u00fcrk Bayra\u011f\u0131"></canvas>'
     +'<span class="gNobetYazi" id="gNobetYazi"><span class="gNbIsik"></span>N\u00d6BETTEY\u0130Z<span class="gNbIsik ters"></span></span>'
     +'<canvas class="gBayrak" id="gBayrakSag" width="132" height="88" title="T\u00fcrk Bayra\u011f\u0131"></canvas>'
     +'<canvas class="gHacker" id="gHackerLogo" width="104" height="104" title="Beyaz \u015fapkal\u0131 hacker"></canvas>'
   +'</div>'
  +'</div>'
  +'<div class="gKat" id="gKatmanCizgi"><i></i><i></i><i></i><i></i></div>'
  +'<div class="gKenar ust"></div><div class="gKenar alt"></div><div class="gKenar sol"></div><div class="gKenar sag"></div>'
  +'<div class="gSupurme"></div>'
  +ekolarYap()
  +'<div class="gEkoYazi sol">'+kayanYazi('DEPREM · GDACS · UYDU · SİBER · HAVA · AURORA · GEMİ · UÇAK · VOLKAN · TSUNAMİ · ISS · KABLO · PİYASA · FIRLATMA')+'</div>'
  +'<div class="gEkoYazi sag">'+kayanYazi('TEHDİT · CVE · TOR · RANSOM · METEOR · UZAY ÇÖPÜ · FAY HATTI · PLATFORM · GAZ · HAVALİMANI · SANT... · RAFİNERİ · MÜLTECİ · KORİDOR')+'</div>'
  +'<div class="gIzgara"></div><div class="gTaramaDoku"></div>'
  +'<div class="gMad" id="gMad"><span class="gMadIsik"></span><span class="gNabiz n1"></span><span class="gNabiz n2"></span><span class="gRadar" id="gRadar"></span><img src="foto/ustad-kenan.jpg" alt="Üstad Kenan Kuzucu"><span class="gMadHalk"></span><span class="gMadHalk h2"></span><span class="gMadHalk h3"></span></div>'
  +'<div class="gUstSus" id="gUstSus"><span class="gSusCizgi"></span><span class="gSusYildiz">✦</span><span class="gSusCizgi ters"></span></div>'
  +'<div class="gKivilcimKutu" id="gKivilcimKutu">'+kilavuzSus()+'</div>'
  +'<div class="gKurt" id="gKurt">'
    +'<svg class="gKurtWolf sol" viewBox="0 0 512 512"><path fill="#fff" d="'+KURT_YOL+'"/></svg>'
    +'<img class="gKurtAta" src="foto/ataturk.jpg" alt="Mustafa Kemal Atatürk">'
    +'<svg class="gKurtWolf" viewBox="0 0 512 512"><path fill="#fff" d="'+KURT_YOL+'"/></svg>'
  +'</div>'
  +'<div class="gSerit" id="gSerit"><span class="gSeritUc u1">◈</span><span class="gSeritIsik"></span><span class="gSeritIsik ters"></span><span class="gSeritAd" id="gAd">'+harfSar('ÜSTAD KENAN KUZUCU', 3.9)+'</span><span class="gSeritUc u2">◈</span></div>'
  +'<div class="gCizgi" id="gCizgi"></div>'
  +'<div class="gHosCizgi" id="gHosCizgi"></div>'
  +'<div class="gHos" id="gHos"><span class="gHosUst"><span class="gHosKanat">❰</span>MONİTÖR DÜNYASINA<span class="gHosKanat k2">❱</span><span class="gHosIsik"></span></span><em>HOŞ GELDİNİZ</em></div>'
  +'<div class="gUst">'
  +'  <span class="gUstSol"><b>ÜSTAD DÜNYA MONİTÖRÜ</b> · CANLI KÜRESEL DURUM</span>'
  +'  <span class="gLamba"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>'
  +'  <button class="gAtla" id="gAtla">ATLA ▶ <em style="opacity:.6;font-style:normal">(boşluk/esc/tık)</em></button>'
  +'</div>'
  +'<div class="gAlt">'
  +'  <div class="gBoot" id="gBoot"></div>'
  +'  <div class="gYuk">'
  +'    <div class="gYukSatir"><span class="gYukEt" id="gYukEt">çekirdek başlatılıyor…</span><span class="gYukYuzde" id="gYukP">0%</span></div>'
  +'    <div class="gYukCubuk"><div class="gYukDolu" id="gYukDolu"></div></div>'
  +'    <div class="gYukAlt"><span>GAZİANTEP · TÜRKİYE</span><span id="gSaat">--:--:--</span><span>v5.3</span></div>'
  +'  </div>'
  +'</div>'
  +'<div class="gHazir" id="gHazir">SİSTEM HAZIR</div>'
  +'<audio id="gAtaSes" src="foto/ataturk-kisa.ogg" preload="auto"></audio>';
  document.body.appendChild(kap);

  /* ---------- 1b) TEMA UYUMU: giriş sahnesi seçilen temanın rengini alır ---------- */
  var TEMA_ADI='monitor';
  try{ TEMA_ADI=localStorage.getItem('ustad_monitor_renk')||'monitor'; }catch(e){}
  var TEMA_RENK={
    monitor:['#22c55e','#7bffa1','#c9ffd8'], hacker:['#00ff41','#7bffa1','#c9ffd8'],
    istihbarat:['#c9b458','#ffd479','#f0ecd4'], alarm:['#ff2d2d','#ff8080','#ffe3e3'],
    siber:['#22d3ee','#67e8f9','#dbfaff'], amber:['#ffb000','#ffd166','#ffeccc'],
    mor:['#a855f7','#c98bff','#f0e2ff'], matbaa:['#e5e7eb','#ffffff','#f8fafc'],
    terminal:['#00ff9c','#7bffcf','#d6ffe9'], matrix:['#00ff41','#8affb0','#c9ffd8'],
    neon:['#39ff14','#a6ff8f','#e9ffe4'], col:['#e0a75e','#f3d19b','#f7ecd9'],
    orman:['#4ade80','#a3e635','#e8ffe9'], acik:['#15803d','#22c55e','#dff7e6'],
    kagit:['#8d6e2f','#b89552','#f2ead9'], buz:['#38bdf8','#7dd3fc','#e0f2fe'],
    lavanta:['#8b7bd8','#b3a5f0','#efeaff'], altin:['#d4af37','#f0c96a','#f7efd9'],
    gece:['#38bdf8','#7dd3fc','#dcefff']
  };
  var RC=TEMA_RENK[TEMA_ADI]||TEMA_RENK.monitor;
  var ANA=RC[0], ANA2=RC[1], YAZI_R=RC[2];
  function rgb(kod){
    kod=String(kod).replace('#','');
    if(kod.length===3) kod=kod[0]+kod[0]+kod[1]+kod[1]+kod[2]+kod[2];
    return parseInt(kod.slice(0,2),16)+','+parseInt(kod.slice(2,4),16)+','+parseInt(kod.slice(4,6),16);
  }
  var RGB=rgb(ANA), RGB2=rgb(ANA2);

  var st=document.createElement('style');
  var cssHam =
   '#girisSahne{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#000;overflow:hidden;'
   +'font-family:"Consolas","DejaVu Sans Mono",monospace;color:#c9ffd8;opacity:1;transition:opacity .75s ease, transform .75s cubic-bezier(.6,0,.9,.4)}'
   +'#girisSahne.gCikis{opacity:0;transform:scale(1.14)}'
   +'#girisTuval{position:absolute;top:0;left:0;width:100%;height:100%;display:block}'
   +'.gKat{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:0;animation:gKatGel .9s ease .25s forwards}'
   +'.gKat i{position:absolute;width:26px;height:26px;border:2px solid #22c55e;box-shadow:0 0 14px #22c55e}'
   +'.gKat i:nth-child(1){top:16px;left:16px;border-right:0;border-bottom:0}'
   +'.gKat i:nth-child(2){top:16px;right:16px;border-left:0;border-bottom:0}'
   +'.gKat i:nth-child(3){bottom:16px;left:16px;border-right:0;border-top:0}'
   +'.gKat i:nth-child(4){bottom:16px;right:16px;border-left:0;border-top:0}'
   +'@keyframes gKatGel{from{opacity:0;transform:scale(1.3)}to{opacity:.85;transform:scale(1)}}'
   +'.gUst{position:absolute;top:22px;left:50%;transform:translateX(-50%);width:calc(100% - 90px);display:flex;justify-content:space-between;'
   +'align-items:center;font-size:11px;letter-spacing:2px;color:#4fd97a;opacity:0;animation:gYaz .8s ease 1s forwards}'
   +'.gUst b{color:#7bffa1;text-shadow:0 0 12px #22c55e}'
   +'.gAtla{background:transparent;border:1px solid rgba(34,197,94,.5);color:#7bffa1;font-family:inherit;font-size:10px;'
   +'letter-spacing:1.5px;padding:5px 12px;border-radius:3px;cursor:pointer;pointer-events:auto}'
   +'.gAtla:hover{background:rgba(34,197,94,.14);box-shadow:0 0 12px #22c55e}'
   +'@keyframes gYaz{from{opacity:0}to{opacity:1}}'
   +'.gMad{position:absolute;left:50%;top:50%;width:clamp(116px,21vmin,204px);height:clamp(116px,21vmin,204px);'
   +'opacity:0;transform:translate(-50%,-50%) scale(.42);'
   +'animation:gMadGel 1.3s cubic-bezier(.2,1.5,.4,1) 2.1s forwards}'
   +'.gMadIsik{position:absolute;top:-34%;left:-34%;right:-34%;bottom:-34%;border-radius:50%;'
   +'background:radial-gradient(circle,rgba(34,197,94,.34),rgba(34,197,94,.10) 52%,transparent 72%);'
   +'filter:blur(7px);animation:gIsik 3.4s ease-in-out infinite}'
   +'@keyframes gIsik{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}'
   +'.gMad img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #22c55e;'
   +'box-shadow:0 0 40px #22c55e,0 0 120px rgba(34,197,94,.6),inset 0 0 20px rgba(0,0,0,.6);position:relative;z-index:2}'
   +'.gMadHalk{position:absolute;top:-15px;left:-15px;right:-15px;bottom:-15px;border-radius:50%;border:1px dashed rgba(123,255,161,.6);'
   +'animation:gDon 9s linear infinite}'
   +'.gMadHalk.h2{top:-30px;left:-30px;right:-30px;bottom:-30px;border:1px solid rgba(34,197,94,.3);animation:gDonTers 15s linear infinite}'
   +'.gMadHalk.h3{top:-48px;left:-48px;right:-48px;bottom:-48px;border:1px dotted rgba(123,255,161,.28);animation:gDon 24s linear infinite}'
   +'@keyframes gMadGel{to{opacity:1;transform:translate(-50%,-50%) scale(1)}}'
   +'@keyframes gDon{to{transform:rotate(360deg)}}'
   +'@keyframes gDonTers{to{transform:rotate(-360deg)}}'
   +'.gSerit{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'
   +'display:flex;align-items:center;gap:14px;padding:7px 26px;border-radius:40px;opacity:0;'
   +'background:linear-gradient(90deg,rgba(0,0,0,.06),rgba(0,0,0,.82) 18%,rgba(0,0,0,.86) 82%,rgba(0,0,0,.06));'
   +'border:1.5px solid rgba(34,197,94,.75);box-shadow:0 0 30px rgba(34,197,94,.55),0 0 90px rgba(34,197,94,.28),inset 0 0 26px rgba(34,197,94,.14);'
   +'backdrop-filter:blur(2px);overflow:hidden;'
   +'animation:gSeritGel 1.1s cubic-bezier(.2,1.3,.4,1) 3.8s forwards,gSeritNefes 3s ease-in-out 6.4s infinite}'
   +'.gSerit:after{content:"";position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:.30;'
   +'background:repeating-linear-gradient(115deg,rgba(255,255,255,.10) 0 2px,transparent 2px 9px)}'
   +'@keyframes gSeritGel{from{opacity:0;transform:translate(-50%,-50%) scaleX(.35)}to{opacity:1;transform:translate(-50%,-50%) scaleX(1)}}'
   +'@keyframes gSeritNefes{0%,100%{box-shadow:0 0 30px rgba(34,197,94,.55),0 0 90px rgba(34,197,94,.28),inset 0 0 26px rgba(34,197,94,.14)}'
   +'50%{box-shadow:0 0 46px rgba(123,255,161,.8),0 0 130px rgba(34,197,94,.42),inset 0 0 34px rgba(123,255,161,.22)}}'
   +'.gSeritIsik{position:absolute;top:0;bottom:0;left:-30%;width:26%;'
   +'background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);animation:gSeritIsik 3.4s linear 3.9s infinite}'
   +'@keyframes gSeritIsik{to{left:118%}}'
   +'.gSeritUc{font-size:13px;color:#7bffa1;text-shadow:0 0 12px #22c55e;animation:gDon 6s linear infinite}'
   +'.gSeritUc.u2{animation:gDonTers 6s linear infinite}'
   +'.gSeritAd{font-size:clamp(20px,4.4vw,47px);letter-spacing:9px;font-weight:bold;white-space:nowrap}'
   +'.gHarf{display:inline-block;-webkit-background-clip:text;background-clip:text;color:transparent;'
   +'background-image:linear-gradient(100deg,#22c55e,#eaffee 40%,#7bffa1 68%,#eaffee);'
   +'filter:drop-shadow(0 0 10px rgba(34,197,94,.95)) drop-shadow(0 0 26px rgba(123,255,161,.5));'
   +'opacity:0;animation:gHarfGel .78s ease forwards,gHarfParla 3.6s ease-in-out infinite}'
   +'.gHarf.bos{width:.42em}'
   +'@keyframes gHarfGel{from{opacity:0;transform:translateY(14px) scale(.82)}to{opacity:1;transform:none}}'
   +'@keyframes gHarfParla{0%,100%{filter:drop-shadow(0 0 9px rgba(34,197,94,.9))}'
   +'42%{filter:drop-shadow(0 0 20px rgba(123,255,161,1)) drop-shadow(0 0 46px rgba(34,197,94,.6))}'
   +'45%{filter:drop-shadow(0 0 18px rgba(255,90,90,.95))}'
   +'48%{filter:drop-shadow(0 0 18px rgba(90,255,255,.95))}}'
   +'.gUstSus{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:13px;opacity:0;'
   +'animation:gYaz .9s ease 3.8s forwards}'
   +'.gSusCizgi{height:1px;width:0;background:linear-gradient(90deg,transparent,#7bffa1);box-shadow:0 0 12px #22c55e;'
   +'animation:gSusCizgi 1.9s ease 3.8s forwards}'
   +'.gSusCizgi.ters{background:linear-gradient(270deg,transparent,#7bffa1)}'
   +'@keyframes gSusCizgi{to{width:min(260px,25vw)}}'
   +'.gSusYildiz{font-size:16px;color:#7bffa1;text-shadow:0 0 16px #22c55e;'
   +'animation:gYildiz 2.8s ease-in-out infinite}'
   +'@keyframes gYildiz{0%,100%{transform:scale(1) rotate(0deg);opacity:.85}50%{transform:scale(1.3) rotate(180deg);opacity:1}}'
   +'.gCizgi{position:absolute;left:50%;transform:translateX(-50%);height:2px;width:0;'
   +'background:linear-gradient(90deg,transparent,#7bffa1,transparent);box-shadow:0 0 18px #22c55e;'
   +'animation:gCizgiGel 1.5s ease 5.9s forwards}'
   +'@keyframes gCizgiGel{to{width:min(620px,86%)}}'
   +'.gHosCizgi{position:absolute;left:50%;transform:translateX(-50%);height:1px;width:0;'
   +'background:linear-gradient(90deg,transparent,rgba(123,255,161,.85),transparent);box-shadow:0 0 14px #22c55e;'
   +'animation:gCizgiGel 1.5s ease 6.7s forwards}'
   +'.gHos{position:absolute;left:0;right:0;text-align:center;opacity:0;animation:gYaz 1.3s ease 7.1s forwards}'
   +'.gHosUst{display:inline-flex;align-items:center;gap:12px;position:relative;overflow:hidden;'
   +'padding:6px 26px;border-radius:34px;font-size:clamp(17px,3vw,30px);letter-spacing:6px;font-weight:bold;'
   +'color:#eaffee;text-shadow:0 0 12px #22c55e,0 0 34px rgba(34,197,94,.85),0 0 76px rgba(123,255,161,.5);'
   +'background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.74) 16%,rgba(0,0,0,.74) 84%,rgba(0,0,0,0));'
   +'border:1px solid rgba(34,197,94,.45);box-shadow:0 0 26px rgba(34,197,94,.32),inset 0 0 24px rgba(34,197,94,.13);'
   +'animation:gHosNefes 3.2s ease-in-out 8s infinite}'
   +'@keyframes gHosNefes{0%,100%{box-shadow:0 0 26px rgba(34,197,94,.32),inset 0 0 24px rgba(34,197,94,.13)}'
   +'50%{box-shadow:0 0 44px rgba(123,255,161,.6),inset 0 0 32px rgba(123,255,161,.22)}}'
   +'.gHosIsik{position:absolute;top:0;bottom:0;left:-30%;width:24%;'
   +'background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);animation:gSeritIsik 3.6s linear 8.4s infinite}'
   +'.gHosKanat{display:inline-block;font-size:clamp(14px,2.3vw,24px);color:#7bffa1;'
   +'text-shadow:0 0 14px #22c55e,0 0 30px rgba(34,197,94,.7);animation:gKanat 2.2s ease-in-out infinite}'
   +'.gHosKanat.k2{animation-delay:1.1s}'
   +'@keyframes gKanat{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.12)}}'
   +'.gHos em{display:block;font-style:normal;font-size:clamp(18px,3.4vw,32px);letter-spacing:9px;margin-top:5px;'
   +'background:linear-gradient(100deg,#7bffa1,#eaffee 45%,#22c55e);-webkit-background-clip:text;background-clip:text;color:transparent;'
   +'filter:drop-shadow(0 0 14px rgba(34,197,94,.95)) drop-shadow(0 0 46px rgba(123,255,161,.55))}'
   +'.gRadar{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;opacity:0;'
   +'background:conic-gradient(from 0deg,rgba(34,197,94,0) 0deg,rgba(123,255,161,.34) 34deg,rgba(34,197,94,0) 78deg,rgba(34,197,94,0) 360deg);'
   +'animation:gYaz 1s ease 2.4s forwards,gDon 4.6s linear infinite;pointer-events:none}'
   +'.gAlt{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);width:min(880px,90vw);display:flex;gap:26px;'
   +'align-items:flex-end;opacity:0;animation:gYaz .9s ease 2.2s forwards}'
   +'.gBoot{flex:1 1 46%;font-size:9.5px;line-height:1.45;color:#4fd97a;min-height:54px;max-height:96px;overflow:hidden}'
   +'.gBoot b{color:#7bffa1}'
   +'.gBoot .ok{color:#7bffa1;text-shadow:0 0 8px #22c55e}'
   +'.gYuk{flex:1 1 54%}'
   +'.gYukSatir{display:flex;justify-content:space-between;font-size:10px;letter-spacing:1.4px;color:#7bffa1;margin-bottom:6px}'
   +'.gYukYuzde{color:#eaffee;text-shadow:0 0 10px #22c55e}'
   +'.gYukCubuk{height:7px;background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.4);border-radius:4px;overflow:hidden;position:relative}'
   +'.gYukDolu{height:100%;width:0;background:linear-gradient(90deg,#0b6b2e,#22c55e 55%,#7bffa1);box-shadow:0 0 14px #22c55e;transition:width .28s ease}'
   +'.gYukCubuk:after{content:"";position:absolute;top:0;left:-40%;width:40%;height:100%;'
   +'background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:gTara 1.6s linear infinite}'
   +'@keyframes gTara{to{left:110%}}'
   +'.gYukAlt{display:flex;justify-content:space-between;font-size:9.5px;letter-spacing:1.6px;color:#3f9a63;margin-top:7px}'
   +'.gHazir{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;font-size:clamp(20px,4vw,40px);'
   +'letter-spacing:12px;color:#eaffee;text-shadow:0 0 20px #7bffa1,0 0 70px #22c55e;pointer-events:none}'
   +'.gHazir.gGel{animation:gHazirGel 1.1s cubic-bezier(.2,1.4,.4,1) forwards}'
   +'@keyframes gHazirGel{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}'
   +'30%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}'
   +'100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}'
   +'@media(max-width:820px){.gAlt{flex-direction:column;gap:10px}.gUst{font-size:9px}.gAd{letter-spacing:4px}}';
  st.textContent = cssHam
    .replace(/#22c55e/g,'var(--g)').replace(/#7bffa1/g,'var(--g2)').replace(/#c9ffd8/g,'var(--gy)')
    .replace(/#eaffee/g,'var(--gy)').replace(/#4fd97a/g,'var(--g3)').replace(/#a8f5c0/g,'var(--g4)')
    .replace(/#3f9a63/g,'var(--g5)')
    .replace(/rgba\(34,197,94,/g,'rgba(var(--grgb),').replace(/rgba\(123,255,161,/g,'rgba(var(--g2rgb),');
  var cssEk = '.gKivilcimKutu{position:absolute;left:50%;transform:translateX(-50%);width:min(760px,92vw);height:64px;pointer-events:none}'
   +'.gKivilcim{position:absolute;font-size:11px;color:#7bffa1;text-shadow:0 0 12px #22c55e;opacity:0;'
   +'animation:gKivilcim 2.8s ease-in-out infinite}'
   +'@keyframes gKivilcim{0%,100%{opacity:0;transform:scale(.6) rotate(0deg)}'
   +'42%{opacity:1;transform:scale(1.25) rotate(140deg)}70%{opacity:.55;transform:scale(.95) rotate(230deg)}}'
   +'.gKenar{position:absolute;pointer-events:none;opacity:.5}'
   +'.gKenar.ust{left:0;right:0;top:8px;height:9px;background:repeating-linear-gradient(90deg,rgba(34,197,94,.55) 0 1px,transparent 1px 26px)}'
   +'.gKenar.alt{left:0;right:0;bottom:8px;height:9px;background:repeating-linear-gradient(90deg,rgba(34,197,94,.55) 0 1px,transparent 1px 26px)}'
   +'.gKenar.sol{top:0;bottom:0;left:8px;width:9px;background:repeating-linear-gradient(0deg,rgba(34,197,94,.45) 0 1px,transparent 1px 26px)}'
   +'.gKenar.sag{top:0;bottom:0;right:8px;width:9px;background:repeating-linear-gradient(0deg,rgba(34,197,94,.45) 0 1px,transparent 1px 26px)}'
   +'.gSupurme{position:absolute;top:-40%;bottom:-40%;width:42%;left:-60%;opacity:0;'
   +'background:linear-gradient(105deg,transparent,rgba(123,255,161,.14) 45%,rgba(255,255,255,.10) 52%,rgba(123,255,161,.14) 60%,transparent);'
   +'animation:gSupurme 2.6s ease-in-out 7.4s infinite,gYaz .8s ease 7.3s forwards}'
   +'@keyframes gSupurme{0%{left:-60%}55%{left:120%}100%{left:120%}}'
   +'.gEko{position:absolute;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;opacity:.55}'
   +'.gEko.sol{left:16px;align-items:flex-start}.gEko.sag{right:16px;align-items:flex-end}'
   +'.gEko i{display:block;height:2px;width:22px;background:linear-gradient(90deg,transparent,#7bffa1);box-shadow:0 0 8px #22c55e;'
   +'animation:gEko 1.8s ease-in-out infinite alternate}'
   +'.gEko.sag i{background:linear-gradient(270deg,transparent,#7bffa1)}'
   +'@keyframes gEko{from{width:6px;opacity:.35}to{width:34px;opacity:1}}';

  var cssEk2 = '.gEkoYazi{position:absolute;top:50%;transform:translateY(-50%);height:56vh;overflow:hidden;pointer-events:none}'
   +'.gEkoYazi.sol{left:26px}.gEkoYazi.sag{right:26px}'
   +'.gEkoYazi b{display:block;writing-mode:vertical-rl;font-size:9.5px;letter-spacing:3px;color:#4fd97a;opacity:.55;'
   +'text-shadow:0 0 10px #22c55e;white-space:nowrap;animation:gKayanYazi 34s linear infinite}'
   +'.gEkoYazi.sag b{animation-direction:reverse}'
   +'@keyframes gKayanYazi{from{transform:translateY(0)}to{transform:translateY(-50%)}}'
   +'.gIzgara{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:.15;'
   +'background-image:linear-gradient(rgba(34,197,94,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.18) 1px,transparent 1px);'
   +'background-size:48px 48px;animation:gIzgaraKay 24s linear infinite}'
   +'@keyframes gIzgaraKay{to{background-position:48px 48px,48px 48px}}'
   +'.gTaramaDoku{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:.4;'
   +'background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0 2px,rgba(0,0,0,.3) 2px 3px);animation:gDoku 8s linear infinite}'
   +'@keyframes gDoku{to{background-position:0 8px}}'
   +'.gLamba{display:flex;gap:6px;align-items:center}'
   +'.gLamba i{width:6px;height:6px;border-radius:50%;background:#7bffa1;box-shadow:0 0 9px #22c55e;animation:gLamba 1.5s ease-in-out infinite}'
   +'.gLamba i:nth-child(2){animation-delay:.22s}.gLamba i:nth-child(3){animation-delay:.44s}'
   +'.gLamba i:nth-child(4){animation-delay:.66s}.gLamba i:nth-child(5){animation-delay:.88s}'
   +'.gLamba i:nth-child(6){animation-delay:1.1s}.gLamba i:nth-child(7){animation-delay:1.32s}'
   +'@keyframes gLamba{0%,100%{opacity:.22;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}'
   +'.gNabiz{position:absolute;left:50%;top:50%;width:100%;height:100%;border-radius:50%;'
   +'border:1.5px solid rgba(34,197,94,.55);opacity:0;animation:gNabiz 4.2s ease-out infinite;pointer-events:none}'
   +'.gNabiz.n2{animation-delay:2.1s}'
   +'@keyframes gNabiz{0%{transform:translate(-50%,-50%) scale(.92);opacity:.7}100%{transform:translate(-50%,-50%) scale(2.15);opacity:0}}'
   +'.gKat i:after{content:"";position:absolute;width:7px;height:7px;background:#7bffa1;box-shadow:0 0 12px #22c55e;animation:gLamba 1.9s ease-in-out infinite}'
   +'.gKat i:nth-child(1):after{left:-4px;top:-4px}.gKat i:nth-child(2):after{right:-4px;top:-4px}'
   +'.gKat i:nth-child(3):after{left:-4px;bottom:-4px}.gKat i:nth-child(4):after{right:-4px;bottom:-4px}'
   +'.gSeritIsik.ters{left:auto;right:-30%;width:24%;'
   +'background:linear-gradient(270deg,transparent,rgba(240,201,106,.36),transparent);animation:gSeritIsikTers 3.9s linear 4.5s infinite}'
   +'@keyframes gSeritIsikTers{from{right:-30%}to{right:120%}}';

  /* ===== NÖBETTEYİZ satırı: isim + iki dalgalanan Türk bayrağı + beyaz şapkalı hacker ===== */
  var cssNobet = '.gNobet{position:absolute;top:6px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:7px;z-index:40;pointer-events:none;}'
   +'.gNobetAd{display:flex;align-items:center;gap:13px;font-size:clamp(11px,1.05vw,14px);letter-spacing:6px;font-weight:bold;color:#eaffee;'
   +'text-shadow:0 0 12px #22c55e,0 0 38px rgba(34,197,94,.55);opacity:0;animation:gNbGel .9s cubic-bezier(.2,1.35,.4,1) .22s forwards}'
   +'.gNbUc{color:#7bffa1;font-size:.85em;text-shadow:0 0 10px #22c55e;animation:gNbDon 5s linear infinite}'
   +'@keyframes gNbDon{0%,100%{opacity:.5}50%{opacity:1;transform:rotate(180deg)}}'
   +'.gNobetSatir{display:flex;align-items:center;gap:11px;opacity:0;animation:gNbGel .95s cubic-bezier(.2,1.35,.4,1) .55s forwards}'
   +'@keyframes gNbGel{from{opacity:0;transform:translateY(-14px) scale(.94)}to{opacity:1;transform:none}}'
   +'.gBayrak{width:66px;height:44px;border-radius:2.5px;filter:drop-shadow(0 3px 10px rgba(227,10,23,.45));'
   +'animation:gBayrakSallan 3.2s ease-in-out infinite alternate}'
   +'#gBayrakSag{animation-delay:.7s}'
   +'@keyframes gBayrakSallan{from{transform:translateY(0) rotate(-3.4deg) scale(1)}to{transform:translateY(-3px) rotate(-1.2deg) scale(1.015)}}'
   +'#gBayrakSag{transform-origin:0% 50%}'
   +'.gHacker{width:52px;height:52px;filter:drop-shadow(0 0 12px rgba(34,197,94,.6));animation:gHackerNefes 3s ease-in-out infinite}'
   +'@keyframes gHackerNefes{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'
   +'.gNobetYazi{position:relative;overflow:hidden;display:inline-block;padding:7px 26px 8px;border-radius:24px;'
   +'font-size:clamp(15px,1.5vw,21px);letter-spacing:9px;font-weight:bold;color:#eaffee;'
   +'background:linear-gradient(180deg,rgba(5,15,9,.93),rgba(3,9,6,.88));border:1px solid rgba(34,197,94,.55);'
   +'box-shadow:0 0 24px -6px #22c55e,inset 0 0 24px rgba(34,197,94,.16);'
   +'text-shadow:0 0 16px #7bffa1,0 0 46px rgba(34,197,94,.85);animation:gNbNefes 2.7s ease-in-out 1.5s infinite}'
   +'.gNobetYazi:before{content:"";position:absolute;left:8%;right:8%;top:0;height:2px;border-radius:2px;'
   +'background:linear-gradient(90deg,rgba(227,10,23,0),#E30A17 22%,#ffffff 50%,#E30A17 78%,rgba(227,10,23,0));opacity:.9}'
   +'.gNobetYazi:after{content:"";position:absolute;left:8%;right:8%;bottom:0;height:1px;'
   +'background:linear-gradient(90deg,transparent,rgba(123,255,161,.7),transparent)}'
   +'@keyframes gNbNefes{0%,100%{box-shadow:0 0 22px -7px #22c55e,inset 0 0 20px rgba(34,197,94,.13)}'
   +'50%{box-shadow:0 0 34px -5px #22c55e,inset 0 0 30px rgba(34,197,94,.22)}}'
   +'.gNbIsik{position:absolute;top:0;bottom:0;width:30%;left:-36%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.34),transparent);'
   +'animation:gNbSupurme 3.1s ease-in-out 1.3s infinite}'
   +'.gNbIsik.ters{left:auto;right:-36%;background:linear-gradient(260deg,transparent,rgba(255,255,255,.2),transparent);'
   +'animation:gNbSupurmeTers 3.1s ease-in-out 2.5s infinite}'
   +'@keyframes gNbSupurme{from{left:-36%}to{left:118%}}'
   +'@keyframes gNbSupurmeTers{from{right:-36%}to{right:118%}}'
   +'@media(max-width:820px){.gNobetYazi{font-size:14px;letter-spacing:6px;padding:6px 16px}.gBayrak{width:52px;height:35px}.gHacker{width:42px;height:42px}}'
   +'@media(max-height:620px){.gNobetAd{font-size:10px;letter-spacing:4px}.gNobetYazi{font-size:13px;padding:5px 14px}}';
  var cssKurt = '.gKurt{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:20px;opacity:0;animation:gYaz 1s ease 3.1s forwards;pointer-events:none}'
   +'.gKurtWolf{width:68px;height:68px;filter:drop-shadow(0 0 8px #f0c96a) drop-shadow(0 0 22px rgba(212,175,55,.5))}'
   +'.gKurtWolf.sol{transform:scaleX(-1)}'
   +'.gKurtAta{width:88px;height:88px;border-radius:50%;object-fit:cover;object-position:center 30%;border:3px solid #d4af37;box-shadow:0 0 0 4px rgba(212,175,55,.55),0 0 0 8px rgba(212,175,55,.22),0 0 26px #f0c96a,0 0 70px rgba(212,175,55,.5);animation:gAtaParla 3s ease-in-out infinite}'
   +'@keyframes gAtaParla{0%,100%{box-shadow:0 0 0 4px rgba(212,175,55,.55),0 0 0 8px rgba(212,175,55,.22),0 0 26px #f0c96a,0 0 70px rgba(212,175,55,.5)}50%{box-shadow:0 0 0 5px rgba(212,175,55,.75),0 0 0 10px rgba(212,175,55,.32),0 0 36px #ffe9a8,0 0 96px rgba(212,175,55,.7)}}';

  /* tema değişkenleri: renk değiştirme zincirinden SONRA eklenir (kendini tanımlamasın) */
  st.textContent = '#girisSahne{--g:'+ANA+';--g2:'+ANA2+';--gy:'+YAZI_R
    +';--g3:'+ANA+'cc;--g4:'+ANA2+'dd;--g5:'+ANA+'99;--grgb:'+RGB+';--g2rgb:'+RGB2+';}\n' + st.textContent
    + '\n' + cssEk
        .replace(/#22c55e/g,'var(--g)').replace(/#7bffa1/g,'var(--g2)').replace(/#c9ffd8/g,'var(--gy)')
        .replace(/#eaffee/g,'var(--gy)').replace(/rgba\(34,197,94,/g,'rgba(var(--grgb),').replace(/rgba\(123,255,161,/g,'rgba(var(--g2rgb),')
    + '\n' + cssEk2
        .replace(/#22c55e/g,'var(--g)').replace(/#7bffa1/g,'var(--g2)').replace(/#c9ffd8/g,'var(--gy)')
        .replace(/#eaffee/g,'var(--gy)').replace(/#4fd97a/g,'var(--g3)')
        .replace(/rgba\(34,197,94,/g,'rgba(var(--grgb),').replace(/rgba\(123,255,161,/g,'rgba(var(--g2rgb),')
    + '\n' + cssNobet
        .replace(/#22c55e/g,'var(--g)').replace(/#7bffa1/g,'var(--g2)').replace(/#eaffee/g,'var(--gy)')
        .replace(/#4fd97a/g,'var(--g3)')
        .replace(/rgba\(34,197,94,/g,'rgba(var(--grgb),').replace(/rgba\(123,255,161,/g,'rgba(var(--g2rgb),')
    + '\n' + cssKurt
        .replace(/#22c55e/g,'var(--g)').replace(/#7bffa1/g,'var(--g2)')
        .replace(/rgba\(34,197,94,/g,'rgba(var(--grgb),').replace(/rgba\(123,255,161,/g,'rgba(var(--g2rgb),');
  document.head.appendChild(st);

  var tuval=document.getElementById('girisTuval');
  var SAAT_TICK=setInterval(function(){
    var s=document.getElementById('gSaat');
    if(s) s.textContent=new Date().toLocaleTimeString('tr-TR');
  }, 1000);

  /* ---------- 2) SAHNE (canvas) ---------- */
  function boyutla(){
    /* tuvalin GERÇEK ekran kutusunu ölç: küre merkezi ile madalyon merkezi
       birebir aynı olsun (kaydırma çubuğu farkı yüzünden kaymasın) */
    var r=tuval.getBoundingClientRect();
    W=Math.round(r.width)||window.innerWidth;
    H=Math.round(r.height)||window.innerHeight;
    tuval.width=Math.floor(W*DPR); tuval.height=Math.floor(H*DPR);
    tuval.style.width=W+'px'; tuval.style.height=H+'px';
    ctx=tuval.getContext('2d');
    if(ctx) ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  var KOR=[], KAYAN=[], ATES=[], YAYLAR=[], TOZ=[], YAĞMUR=[];
  function yagmurKur(){
    YAĞMUR=[];
    for(var i=0;i<44;i++){
      YAĞMUR.push({x:Math.random()*2200, y:Math.random()*1000, hiz:0.9+Math.random()*2.4, boy:0.8+Math.random()*1.5,
        sal:Math.random()*6.28, renk:(Math.random()>0.6?ANA2:ANA)});
    }
  }
  /* ateşböcekleri: kıvrımlı yollarda gezen parıltılar */
  function atesKur(){
    ATES=[];
    for(var i=0;i<30;i++){
      ATES.push({x:Math.random()*2000, y:Math.random()*2000, r:0.9+Math.random()*1.7,
        a1:Math.random()*6.28, a2:Math.random()*6.28, s1:0.2+Math.random()*0.6, s2:0.5+Math.random()*1.2,
        yas:Math.random(), renk:(Math.random()>0.5?ANA2:ANA)});
    }
  }
  /* küre üzerinde uçuş yayları (veri akışı) */
  function yayKur(){
    YAYLAR=[];
    for(var i=0;i<9;i++){
      var la1=(Math.random()*140-70), lo1=(Math.random()*360-180);
      var la2=(Math.random()*140-70), lo2=(Math.random()*360-180);
      YAYLAR.push({la1:la1, lo1:lo1, la2:la2, lo2:lo2, faz:Math.random(), hiz:0.12+Math.random()*0.28});
    }
  }
  /* yıldız tozu diski (eğik halka) */
  function tozKur(){
    TOZ=[];
    for(var i=0;i<72;i++){
      TOZ.push({a:Math.random()*6.28, r:1.06+Math.random()*0.42, boy:0.7+Math.random()*1.5,
        hiz:0.00016+Math.random()*0.00024, parlak:Math.random()});
    }
  }
  function kayanKur(){
    KAYAN=[];
    for(var i=0;i<3;i++){
      KAYAN.push({x:-200-i*420, y:Math.random()*H*0.5, hiz:6+Math.random()*5, yas:0, bekle:i*2.2});
    }
  }
  function korKur(){
    KOR=[];
    for(var i=0;i<74;i++){
      KOR.push({x:Math.random()*2000, y:Math.random()*2000, hiz:0.25+Math.random()*0.75,
        boy:0.9+Math.random()*1.9, yas:Math.random(), sal:Math.random()*6.28,
        renk:(Math.random()>0.55?ANA2:ANA)});
    }
  }
  function yildizKur(){
    yildizlar=[];
    for(var i=0;i<560;i++){
      yildizlar.push({x:(Math.random()*2-1), y:(Math.random()*2-1), z:Math.random()*1.6+0.15,
        r:Math.random()*1.5+0.3, p:Math.random()*Math.PI*2, hiz:Math.random()*0.12+0.05});
    }
  }
  /* küre noktaları: gerçek tesis koordinatları + takviye */
  function kureKur(){
    kureNokta=[];
    function ekle(dizi, renk){
      if(!dizi || !dizi.length) return;
      for(var i=0;i<dizi.length && kureNokta.length<220;i++){
        var d=dizi[i];
        if(!d || d[0]==null) continue;
        kureNokta.push({lat:d[0], lng:d[1], renk:renk});
      }
    }
    try{
      if(typeof VERI_ASKERI!=='undefined') ekle(VERI_ASKERI, '#7bffa1');
      if(typeof VERI_NUKLEER!=='undefined') ekle(VERI_NUKLEER, '#ffd166');
      if(typeof VERI_EKONOMI!=='undefined') ekle(VERI_EKONOMI, '#67e8f9');
      if(typeof VERI_UZAY!=='undefined') ekle(VERI_UZAY, '#c4b5fd');
      if(typeof VERI_HAVALIMANI!=='undefined') ekle(VERI_HAVALIMANI, '#a7f3d0');
      if(typeof VERI_LIMAN!=='undefined') ekle(VERI_LIMAN, '#2dd4bf');
      if(typeof VERI_PLATFORM!=='undefined') ekle(VERI_PLATFORM, '#fbbf24');
    }catch(e){}
    var eksik=Math.max(0, 240-kureNokta.length);
    for(var k=0;k<eksik;k++){
      var u=Math.random()*2-1, t=Math.random()*Math.PI*2;
      var rr=Math.sqrt(1-u*u);
      kureNokta.push({lat:Math.asin(u)*180/Math.PI, lng:((t*180/Math.PI+540)%360)-180, renk:'#22c55e', soluk:true});
    }
  }
  function projeksiyon(lat,lng,R,yaw,tilt){
    var la=lat*Math.PI/180, lo=(lng*Math.PI/180)+yaw;
    var x=Math.cos(la)*Math.sin(lo), y=Math.sin(la), z=Math.cos(la)*Math.cos(lo);
    var y2=y*Math.cos(tilt)-z*Math.sin(tilt), z2=y*Math.sin(tilt)+z*Math.cos(tilt);
    var olcek=R/(2.6-z2*0.95);
    return {x:W/2+x*olcek*1.55, y:H/2-y2*olcek*1.55, z:z2};
  }
  function sahneCiz(t){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    var lg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.62);
    lg.addColorStop(0,'rgba('+RGB+',.16)'); lg.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);

    /* yıldız alanı */
    var gecis=Math.min(1,t/900);
    for(var i=0;i<yildizlar.length;i++){
      var s=yildizlar[i];
      s.z-=s.hiz*0.016;
      if(s.z<=0.08){ s.z=1.75; s.x=Math.random()*2-1; s.y=Math.random()*2-1; }
      var k=1.9/s.z;
      var px=W/2+s.x*W*0.55*k, py=H/2+s.y*H*0.55*k;
      if(px<-20||px>W+20||py<-20||py>H+20) continue;
      var a=Math.min(1, (1.75-s.z)*0.9)*gecis;
      var ti=0.55+0.45*Math.sin(t*0.003+s.p);
      ctx.fillStyle='rgba(180,255,205,'+(a*(0.35+0.5*ti))+')';
      ctx.fillRect(px,py,s.r*k*0.7,s.r*k*0.7);
      if(s.r>1.25 && a>0.45){                       /* parlak yıldızlara çapraz ışık */
        var uz=s.r*k*4.2, al2=a*ti*0.55;
        ctx.strokeStyle='rgba(200,255,220,'+al2+')'; ctx.lineWidth=0.8;
        ctx.beginPath();
        ctx.moveTo(px-uz,py); ctx.lineTo(px+uz,py);
        ctx.moveTo(px,py-uz); ctx.lineTo(px,py+uz);
        ctx.stroke();
      }
    }

    /* aurora renk bulutları (derinlik) */
    var auA=Math.min(1, Math.max(0,(t-900)/2200));
    if(auA>0){
      for(var ab=0;ab<4;ab++){
        var abx=W/2+Math.cos(t*0.00021+ab*1.7)*W*0.19;
        var aby=H/2+Math.sin(t*0.00017+ab*2.3)*H*0.16;
        var abr=Math.min(W,H)*(0.26+0.05*Math.sin(t*0.0004+ab));
        var abg=ctx.createRadialGradient(abx,aby,0,abx,aby,abr);
        abg.addColorStop(0,(ab%2? 'rgba('+RGB2+','+(0.075*auA)+')' : 'rgba('+RGB+','+(0.065*auA)+')'));
        abg.addColorStop(1,'rgba('+RGB+',0)');
        ctx.fillStyle=abg; ctx.beginPath(); ctx.arc(abx,aby,abr,0,Math.PI*2); ctx.fill();
      }
    }
    /* holografik tarama bantları */
    var hoA=Math.min(1, Math.max(0,(t-1600)/1600));
    if(hoA>0){
      for(var hb2=0;hb2<3;hb2++){
        var hy=((t*0.045+hb2*260)%(H+300))-150;
        var hg=ctx.createLinearGradient(0,hy-60,0,hy+60);
        hg.addColorStop(0,'rgba('+RGB+',0)');
        hg.addColorStop(0.5,'rgba('+RGB2+','+(0.055*hoA)+')');
        hg.addColorStop(1,'rgba('+RGB+',0)');
        ctx.fillStyle=hg; ctx.fillRect(0,hy-60,W,120);
      }
      /* ince hologram çizgileri */
      ctx.fillStyle='rgba('+RGB2+','+(0.055*hoA)+')';
      for(var hl=0;hl<H;hl+=4){ ctx.fillRect(0,hl,W,1); }
    }

    /* küre */
    var iler=Math.min(1, t/GIRIS_SURE);
    var R=Math.min(W,H)*0.20*(1+0.17*iler);   /* 10 sn boyunca yavaş yakınlaşma */
    var yaw=kureAci, tilt=0.42;
    /* fotoğrafın arkasından yayılan ışık huzmeleri (şatafat) */
    var isinA=Math.min(1, Math.max(0,(t-1100)/1600));
    if(isinA>0){
      ctx.save();
      ctx.translate(W/2,H/2);
      ctx.rotate(kureAci*0.35);
      for(var hu=0;hu<26;hu++){
        var ha=hu*(Math.PI*2/26), hb=ha+0.035+((hu%3)*0.012);
        var huzun=R*2.5, gen=R*0.055;
        var gr=ctx.createLinearGradient(0,0,huzun,0);
        gr.addColorStop(0,'rgba('+RGB+','+(0.16*isinA)+')');
        gr.addColorStop(0.55,'rgba('+RGB2+','+(0.05*isinA)+')');
        gr.addColorStop(1,'rgba('+RGB+',0)');
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(huzun*Math.cos(ha-hb), huzun*Math.sin(ha-hb));
        ctx.lineTo(huzun*Math.cos(ha+hb), huzun*Math.sin(ha+hb));
        ctx.closePath();
        ctx.fillStyle=gr; ctx.fill();
      }
      ctx.restore();
    }
    var zAlpha=Math.min(1, Math.max(0,(t-800)/900));
    if(zAlpha>0){
      /* ızgara */
      ctx.lineWidth=1;
      for(var m=0;m<12;m++){
        ctx.beginPath();
        for(var a2=0;a2<=36;a2++){
          var la2=-90+a2*5, lo2=m*30;
          var p2=projeksiyon(la2,lo2,R,yaw,tilt);
          if(a2===0) ctx.moveTo(p2.x,p2.y); else ctx.lineTo(p2.x,p2.y);
        }
        ctx.strokeStyle='rgba('+RGB+','+(0.13*zAlpha)+')';
        ctx.stroke();
      }
      for(var par=0;par<6;par++){
        ctx.beginPath();
        var la3=-60+par*24;
        for(var b2=0;b2<=48;b2++){
          var p3=projeksiyon(la3,b2*7.5-180,R,yaw,tilt);
          if(b2===0) ctx.moveTo(p3.x,p3.y); else ctx.lineTo(p3.x,p3.y);
        }
        ctx.strokeStyle='rgba('+RGB+','+(0.11*zAlpha)+')';
        ctx.stroke();
      }
      /* noktalar */
      for(var n=0;n<kureNokta.length;n++){
        var pn=kureNokta[n];
        var pp=projeksiyon(pn.lat,pn.lng,R,yaw,tilt);
        var on=(pp.z>0);
        var alfa=(on?0.95:0.16)*zAlpha;
        var boy=(on?2.5:1.6)*(pn.soluk?0.75:1);
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, boy, 0, Math.PI*2);
        ctx.fillStyle=pn.renk;
        ctx.globalAlpha=alfa;
        if(on && !pn.soluk){ ctx.shadowBlur=10; ctx.shadowColor=pn.renk; }
        ctx.fill();
        ctx.shadowBlur=0; ctx.globalAlpha=1;
      }
      /* atmosfer + ufuk halkası */
      var ag=ctx.createRadialGradient(W/2,H/2,R*0.92,W/2,H/2,R*1.5);
      ag.addColorStop(0,'rgba('+RGB+',0)');
      ag.addColorStop(0.45,'rgba('+RGB+','+(0.10*zAlpha)+')');
      ag.addColorStop(1,'rgba('+RGB+',0)');
      ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(W/2,H/2,R*1.5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba('+RGB2+','+(0.35*zAlpha)+')'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(W/2,H/2,R*1.02,0,Math.PI*2); ctx.stroke();
      /* yuvarlak çizgi üzerinde dönen kıvılcımlar (şatafat) */
      for(var kk=0;kk<16;kk++){
        var ac2=(t*0.00042)+(kk*Math.PI*2/16);
        var sx2=W/2+Math.cos(ac2)*R*1.02, sy2=H/2+Math.sin(ac2)*R*1.02;
        var bo=(kk%4===0)?3.4:1.9;
        ctx.beginPath(); ctx.arc(sx2,sy2,bo,0,Math.PI*2);
        ctx.fillStyle=(kk%4===0)?ANA2:ANA;
        ctx.globalAlpha=(kk%4===0?0.95:0.6)*zAlpha;
        ctx.shadowBlur=14; ctx.shadowColor=ANA;
        ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      }
      /* dönen yay parçaları (şatafat) */
      for(var ya=0;ya<3;ya++){
        var ybas=(t*(0.0009+ya*0.0004))+ya*2.1;
        var yboy=0.55+ya*0.12;
        ctx.beginPath();
        ctx.arc(W/2,H/2,R*(1.09+ya*0.055), ybas, ybas+yboy);
        ctx.strokeStyle=(ya===1)?ANA2:ANA;
        ctx.globalAlpha=(0.55-ya*0.12)*zAlpha;
        ctx.lineWidth=2.6-ya*0.5; ctx.shadowBlur=18; ctx.shadowColor=ANA;
        ctx.stroke(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      }
      /* noktalı dış halka (ters yönde döner) */
      for(var nh=0;nh<40;nh++){
        var na=-(t*0.00022)+(nh*Math.PI*2/40);
        var nx=W/2+Math.cos(na)*R*1.27, ny=H/2+Math.sin(na)*R*1.27;
        ctx.beginPath(); ctx.arc(nx,ny,(nh%5===0)?2.4:1.2,0,Math.PI*2);
        ctx.globalAlpha=(nh%5===0?0.75:0.35)*zAlpha;
        ctx.fillStyle=ANA2; ctx.fill(); ctx.globalAlpha=1;
      }
      /* sonar dalgaları (merkezden dışa yayılan halkalar) */
      for(var sd=0;sd<3;sd++){
        var faz=((t*0.00042)+(sd/3))%1;
        var sR=R*(1.12+faz*1.25);
        ctx.beginPath(); ctx.arc(W/2,H/2,sR,0,Math.PI*2);
        ctx.strokeStyle='rgba('+RGB2+','+((1-faz)*0.3*zAlpha)+')';
        ctx.lineWidth=1.6*(1-faz)+0.5; ctx.stroke();
      }
      /* tik halkası (ölçek çizgileri) */
      if(R>0){
        for(var tk=0;tk<72;tk++){
          var ta=(tk*Math.PI*2/72)+(t*0.00006);
          var t1=R*1.42, t2=t1+((tk%6===0)?9:4);
          ctx.beginPath();
          ctx.moveTo(W/2+Math.cos(ta)*t1, H/2+Math.sin(ta)*t1);
          ctx.lineTo(W/2+Math.cos(ta)*t2, H/2+Math.sin(ta)*t2);
          ctx.strokeStyle='rgba('+RGB+','+((tk%6===0?0.5:0.22)*zAlpha)+')';
          ctx.lineWidth=(tk%6===0)?1.5:1; ctx.stroke();
        }
      }
      /* küre üzerinde uçuş yayları (veri akışı) */
      for(var yc=0;yc<YAYLAR.length;yc++){
        var yy=YAYLAR[yc];
        var y1=projeksiyon(yy.la1,yy.lo1,R,yaw,tilt), y2=projeksiyon(yy.la2,yy.lo2,R,yaw,tilt);
        if(y1.z<0 || y2.z<0) continue;
        var mx=(y1.x+y2.x)/2, my=(y1.y+y2.y)/2;
        var dis=Math.sqrt((y2.x-y1.x)*(y2.x-y1.x)+(y2.y-y1.y)*(y2.y-y1.y));
        my-=dis*0.32;                                  /* yayı yukarı kaldır */
        var il2=(t*0.00022*yy.hiz*1000+yy.faz)%1;
        ctx.beginPath();
        ctx.moveTo(y1.x,y1.y); ctx.quadraticCurveTo(mx,my,y2.x,y2.y);
        ctx.strokeStyle='rgba('+RGB2+','+(0.16*zAlpha)+')'; ctx.lineWidth=1.1; ctx.stroke();
        /* yay üzerinde ilerleyen ışık noktası */
        var p1x=(1-il2)*(1-il2)*y1.x+2*(1-il2)*il2*mx+il2*il2*y2.x;
        var p1y=(1-il2)*(1-il2)*y1.y+2*(1-il2)*il2*my+il2*il2*y2.y;
        ctx.beginPath(); ctx.arc(p1x,p1y,2.3,0,Math.PI*2);
        ctx.fillStyle=ANA2; ctx.shadowBlur=14; ctx.shadowColor=ANA; ctx.fill(); ctx.shadowBlur=0;
      }
      /* yıldız tozu diski (eğik halka) */
      for(var tz=0;tz<TOZ.length;tz++){
        var od=TOZ[tz];
        od.a+=od.hiz*16;
        var ox=Math.cos(od.a)*R*od.r, oz=Math.sin(od.a)*R*od.r;
        var oy=oz*0.30;
        var derin=(oz<0?-1:1);
        var al3=(derin>0?0.85:0.30)*zAlpha*(0.5+0.5*Math.sin(t*0.002+od.parlak*6.28));
        ctx.beginPath(); ctx.arc(W/2+ox, H/2+oy, od.boy*(derin>0?1:0.7), 0, Math.PI*2);
        ctx.fillStyle=(od.parlak>0.7?ANA2:ANA); ctx.globalAlpha=al3;
        ctx.fill(); ctx.globalAlpha=1;
      }
      /* halka yazı (madalyonun çevresinde döner) */
      var HYAZI='ÜSTAD KENAN KUZUCU · ÜSTAD DÜNYA MONİTÖRÜ · ';
      var hyA=Math.min(1, Math.max(0,(t-3000)/1600));
      if(hyA>0){
        ctx.save();
        ctx.translate(W/2,H/2);
        ctx.rotate(t*0.00016);
        ctx.font='bold '+Math.max(9,Math.round(R*0.062))+'px Consolas, monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        var hyR=R*1.62;
        for(var hc=0;hc<HYAZI.length;hc++){
          var cha=HYAZI.charAt(hc);
          if(cha===' ' && false) continue;
          var ha2=hc*(Math.PI*2/HYAZI.length);
          ctx.save();
          ctx.rotate(ha2);
          ctx.translate(0,-hyR);
          ctx.fillStyle=(cha==='·')?ANA:ANA2;
          ctx.globalAlpha=(0.30+0.34*Math.abs(Math.sin(t*0.0012+hc*0.35)))*hyA;
          ctx.shadowBlur=8; ctx.shadowColor=ANA;
          ctx.fillText(cha,0,0);
          ctx.shadowBlur=0; ctx.globalAlpha=1;
          ctx.restore();
        }
        ctx.restore();
      }
      /* ikinci halka yazı (ters yönde) */
      var HYAZI2='ÜSTAD DÜNYA MONİTÖRÜ · CANLI KÜRESEL DURUM · 60+ KATMAN · ';
      if(hyA>0){
        ctx.save();
        ctx.translate(W/2,H/2);
        ctx.rotate(-t*0.00011);
        ctx.font='bold '+Math.max(8,Math.round(R*0.05))+'px Consolas, monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        var hyR2=R*1.98;
        for(var hc2=0;hc2<HYAZI2.length;hc2++){
          var ch2=HYAZI2.charAt(hc2);
          var ha3=hc2*(Math.PI*2/HYAZI2.length);
          ctx.save();
          ctx.rotate(ha3);
          ctx.translate(0,-hyR2);
          ctx.fillStyle=ANA; ctx.globalAlpha=(0.22+0.30*Math.abs(Math.cos(t*0.001+hc2*0.28)))*hyA;
          ctx.fillText(ch2,0,0);
          ctx.globalAlpha=1;
          ctx.restore();
        }
        ctx.restore();
      }
      /* madalyondan yükselen ışık konisi */
      if(zAlpha>0){
        var koniA=Math.min(1,Math.max(0,(t-2400)/1800));
        if(koniA>0){
          ctx.save();
          ctx.translate(W/2,H/2);
          ctx.rotate(Math.sin(t*0.0003)*0.35);
          var kg=ctx.createLinearGradient(0,0,0,-H*0.62);
          kg.addColorStop(0,'rgba('+RGB2+','+(0.20*koniA)+')');
          kg.addColorStop(0.55,'rgba('+RGB+','+(0.07*koniA)+')');
          kg.addColorStop(1,'rgba('+RGB+',0)');
          ctx.beginPath();
          ctx.moveTo(-R*0.16,0); ctx.lineTo(R*0.16,0);
          ctx.lineTo(R*0.62,-H*0.62); ctx.lineTo(-R*0.62,-H*0.62);
          ctx.closePath(); ctx.fillStyle=kg; ctx.fill();
          ctx.restore();
        }
      }
      window.__girisR=R;
    }

    /* yörünge halkaları */
    var hz=Math.min(1,Math.max(0,(t-1400)/800));
    if(hz>0){
      for(var r=0;r<3;r++){
        var rr=R*(1.35+r*0.22), eg=R*(0.24+r*0.05);
        ctx.save();
        ctx.translate(W/2,H/2);
        ctx.rotate((-0.42+r*0.25)+Math.sin(t*0.0006+r)*0.06);
        ctx.beginPath();
        ctx.ellipse(0,0,rr,eg,0,0,Math.PI*2);
        ctx.strokeStyle='rgba('+RGB2+','+(0.18*hz)+')';
        ctx.lineWidth=1; ctx.stroke();
        var aci=t*0.0013*(r%2? -1: 1)+r*2;
        var uy=Math.sin(aci)*eg, ux=Math.cos(aci)*rr;
        ctx.beginPath(); ctx.arc(ux,uy,2.2,0,Math.PI*2);
        ctx.fillStyle=ANA2; ctx.shadowBlur=12; ctx.shadowColor=ANA; ctx.fill(); ctx.shadowBlur=0;
        ctx.restore();
      }
    }

    /* patlama (final) */
    if(patlama>0){
      for(var q=0;q<PART.length;q++){
        var pq=PART[q];
        pq.x+=pq.vx; pq.y+=pq.vy; pq.vy+=0.012; pq.yas-=0.016;
        if(pq.yas<=0) continue;
        ctx.globalAlpha=Math.max(0,pq.yas);
        ctx.fillStyle=pq.renk;
        ctx.fillRect(W/2+pq.x, H/2+pq.y, 2.6, 2.6);
      }
      ctx.globalAlpha=1;
    }

    /* kayan yıldızlar */
    for(var ky=0;ky<KAYAN.length;ky++){
      var ks=KAYAN[ky];
      if(ks.bekle>0){ ks.bekle-=0.016; continue; }
      ks.x+=ks.hiz; ks.y+=ks.hiz*0.42; ks.yas+=0.016;
      var kuy=110;
      var kg=ctx.createLinearGradient(ks.x-kuy, ks.y-kuy*0.42, ks.x, ks.y);
      kg.addColorStop(0,'rgba('+RGB+',0)');
      kg.addColorStop(1,'rgba('+RGB2+',0.85)');
      ctx.strokeStyle=kg; ctx.lineWidth=1.8;
      ctx.beginPath(); ctx.moveTo(ks.x-kuy, ks.y-kuy*0.42); ctx.lineTo(ks.x, ks.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(ks.x,ks.y,2.1,0,Math.PI*2);
      ctx.fillStyle=ANA2; ctx.shadowBlur=14; ctx.shadowColor=ANA; ctx.fill(); ctx.shadowBlur=0;
      if(ks.x>W+240 || ks.y>H+240){ ks.x=-260; ks.y=Math.random()*H*0.55; ks.hiz=6+Math.random()*5; ks.yas=0; ks.bekle=1.5+Math.random()*4; }
    }

    /* ateşböcekleri (kıvrımlı uçuş) */
    for(var ak=0;ak<ATES.length;ak++){
      var ab3=ATES[ak];
      ab3.a1+=ab3.s1*0.006; ab3.a2+=ab3.s2*0.004;
      var ax3=W*0.5+Math.cos(ab3.a1)*(W*0.30+Math.sin(ab3.a2)*W*0.12);
      var ay3=H*0.5+Math.sin(ab3.a2*1.3)*(H*0.26+Math.cos(ab3.a1*0.7)*H*0.10);
      var na3=0.35+0.65*Math.abs(Math.sin(t*0.0016+ab3.yas*6.28));
      ctx.beginPath(); ctx.arc(ax3,ay3,ab3.r*(0.8+na3*0.6),0,Math.PI*2);
      ctx.fillStyle=ab3.renk; ctx.globalAlpha=na3*0.9;
      ctx.shadowBlur=16; ctx.shadowColor=ab3.renk; ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    /* yükselen kor parçacıkları (şatafat) */
    for(var i2=0;i2<KOR.length;i2++){
      var kp=KOR[i2];
      kp.y-=kp.hiz; kp.x+=Math.sin((t*0.001)+kp.sal)*0.35; kp.yas-=0.004;
      if(kp.yas<=0 || kp.y<-30){ kp.x=Math.random()*W; kp.y=H+20; kp.yas=0.5+Math.random()*0.5; }
      ctx.beginPath(); ctx.arc(kp.x,kp.y,kp.boy,0,Math.PI*2);
      ctx.fillStyle=kp.renk; ctx.globalAlpha=kp.yas*0.75;
      ctx.shadowBlur=12; ctx.shadowColor=kp.renk; ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    /* kıvılcım yağmuru (düşen parıltılar) */
    for(var yg=0;yg<YAĞMUR.length;yg++){
      var ym=YAĞMUR[yg];
      ym.y+=ym.hiz; ym.x+=Math.sin((t*0.0016)+ym.sal)*0.5;
      if(ym.y>H+12){ ym.y=-12; ym.x=Math.random()*W; }
      ctx.globalAlpha=(0.35+0.45*Math.abs(Math.sin(t*0.002+ym.sal)))*0.9;
      ctx.fillStyle=ym.renk;
      ctx.beginPath(); ctx.arc(ym.x, ym.y, ym.boy, 0, Math.PI*2);
      ctx.shadowBlur=10; ctx.shadowColor=ym.renk; ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    /* tarama çizgisi (sweep) */
    var sw=((t*0.35)%(H+220))-110;
    var sg=ctx.createLinearGradient(0,sw-70,0,sw+70);
    sg.addColorStop(0,'rgba('+RGB+',0)');
    sg.addColorStop(0.5,'rgba('+RGB+',.09)');
    sg.addColorStop(1,'rgba('+RGB+',0)');
    ctx.fillStyle=sg; ctx.fillRect(0,sw-70,W,140);

    /* vinyet + tarama dokusu */
    var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.86)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba('+RGB+',.028)';
    for(var y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
  }

  /* ---------- 3) AŞAMALAR (gerçek kontroller) ---------- */
  var ASAMALAR=[
    {et:'çekirdek başlatılıyor…',        ks:function(){ return true; },                                       mes:'çekirdek · CPU + bellek ayrıldı'},
    {et:'WebGL motoru kuruluyor…',       ks:function(){ try{ var c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); }catch(e){ return false; } }, mes:'WebGL · 3B motor aktif'},
    {et:'küre kütüphanesi yükleniyor…',  ks:function(){ return typeof Globe!=='undefined'; },                mes:'globe.gl · küre kütüphanesi'},
    {et:'harita katmanı bağlanıyor…',    ks:function(){ return typeof L!=='undefined'; },                    mes:'Leaflet · 2D harita katmanı'},
    {et:'uydu yörünge motoru…',          ks:function(){ return typeof satellite!=='undefined'; },            mes:'satellite.js · yörünge motoru'},
    {et:'tesis veri kümesi okunuyor…',   ks:function(){ return typeof VERI_ASKERI!=='undefined'; },          mes:'statik tesis verisi · yüklendi'},
    {et:'canlı katman motoru…',          ks:function(){ return typeof CANLI!=='undefined'; },                mes:'katman motoru · 55 katman hazır'},
    {et:'siber tehdit beslemeleri…',     ks:function(){ return typeof siberKaynaklarHTML!=='undefined'; },   mes:'siber beslemeler · bağlandı'},
    {et:'alarm + zekâ modülü…',          ks:function(){ return typeof alarmKontrol!=='undefined'; },         mes:'alarm motoru · kurallar yüklendi'},
    {et:'arayüz hazırlanıyor…',          ks:function(){ return typeof git==='function'; },                   mes:'arayüz · komut merkezi hazır'},
    {et:'kimlik doğrulanıyor…',          ks:function(){ return true; },                                       mes:'ÜSTAD KENAN KUZUCU · KURUCU'},
    {et:'sistem hazır.',                 ks:function(){ return true; },                                       mes:'SİSTEM HAZIR · hoş geldiniz üstadım'}
  ];

  function bootYaz(i){
    var b=document.getElementById('gBoot'); if(!b) return;
    if(i===0) b.innerHTML='';
    var a=ASAMALAR[i];
    var ok=false;
    try{ ok=a.ks(); }catch(e){ ok=false; }
    var d=document.createElement('div');
    d.innerHTML='<span class="'+(ok?'ok':'')+'">'+(ok?'[✔]':'[·]')+'</span> '+(a.mes||a.et);
    b.appendChild(d);
    while(b.childNodes.length>6) b.removeChild(b.firstChild);
    var e=document.getElementById('gYukEt'); if(e) e.textContent=a.et;
  }

  /* ---------- 4) SES (yumuşak açılış tonu) ---------- */
  function sesCal(){
    var acik='1'; try{ acik=localStorage.getItem('ustad_giris_ses')||'1'; }catch(e){}
    if(acik!=='1') return;
    try{
      var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      var c=new AC(); if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
      var notalar=[220,330,440,660];
      for(var i=0;i<notalar.length;i++){
        var o=c.createOscillator(), g=c.createGain();
        o.type='sine'; o.frequency.value=notalar[i];
        o.connect(g); g.connect(c.destination);
        var t0=c.currentTime+1.5+i*0.26;
        g.gain.setValueAtTime(0,t0);
        g.gain.linearRampToValueAtTime(0.045,t0+0.06);
        g.gain.exponentialRampToValueAtTime(0.001,t0+1.0);
        o.start(t0); o.stop(t0+1.05);
      }
    }catch(e){}
  }

  /* ---------- 5) AKIŞ ---------- */
  function atla(){
    if(atlandi) return; atlandi=true;
    return kapat();
  }
  function kapat(){
    if(bitti) return; bitti=true;
    try{ clearInterval(SAAT_TICK); }catch(e){}
    try{ if(window.__ataTik){ clearInterval(window.__ataTik); } }catch(e){}
    try{ var as=document.getElementById('gAtaSes'); if(as){ as.pause(); as.currentTime=0; } }catch(e){}
    kap.classList.add('gCikis');
    setTimeout(function(){
      try{ kap.style.display='none'; kap.remove(); st.remove(); }catch(e){}
    }, 800);
    /* panel girişi yumuşak olsun */
    try{
      document.body.style.transition='opacity .7s ease';
      document.body.style.opacity='0.35';
      setTimeout(function(){ document.body.style.opacity='1'; }, 120);
    }catch(e){}
    return 'giriş atlandı';
  }
  kap.addEventListener('click', function(e){
    if(e.target && e.target.id==='gAtla') return;
    atla();
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'||e.key===' '||e.key==='Enter'){ if(!bitti) atla(); }
  });
  var atlaBtn=document.getElementById('gAtla');
  if(atlaBtn) atlaBtn.onclick=function(e){ e.stopPropagation(); atla(); };

  /* madalyonu tuvaldeki küre merkezine PİKSEL PİKSEL oturt */
  function merkezKalibre(){
    try{
      var cv=document.getElementById('girisTuval'), mad=document.getElementById('gMad');
      if(!cv || !mad) return;
      mad.style.marginLeft='0px'; mad.style.marginTop='0px';
      var cr=cv.getBoundingClientRect(), mr=mad.getBoundingClientRect();
      var hedefX=W/2, hedefY=H/2;                                  /* tuval koordinatında küre merkezi */
      var simdiX=(mr.left+mr.width/2)-cr.left, simdiY=(mr.top+mr.height/2)-cr.top;
      mad.style.marginLeft=Math.round(hedefX-simdiX)+'px';
      mad.style.marginTop=Math.round(hedefY-simdiY)+'px';
    }catch(e){}
  }
  /* yazıları YUVARLAK ÇİZGİYE kilitle: isim şeridin üstünde, hoş geldin altında */
  function yaziYerlestir(){
    try{
      var R=window.__girisR||(Math.min(W,H)*0.20);
      var ser=document.getElementById('gSerit'), gc=document.getElementById('gCizgi');
      var hc=document.getElementById('gHosCizgi'), hz=document.getElementById('gHos');
      var r2=document.getElementById('gRadar'), us=document.getElementById('gUstSus');
      var SERIT_YUK=38;                       /* isim yuvarlak çizginin ÜSTÜNDE */
      var serY=Math.max(H*0.15, H/2-R-SERIT_YUK);
      if(ser) ser.style.top=Math.round(serY)+'px';
      if(us)  us.style.top=Math.round(serY-46)+'px';
      var kv=document.getElementById('gKivilcimKutu');
      if(kv)  kv.style.top=Math.round(serY-32)+'px';
      var kurt=document.getElementById('gKurt');
      if(kurt) kurt.style.top=Math.round(serY-145)+'px';
      if(gc)  gc.style.top=Math.round(serY+43)+'px';
      if(hc)  hc.style.top=Math.round(H/2+R+1)+'px';
      if(hz)  hz.style.top=Math.round(H/2+R+7)+'px';
      if(r2){ r2.style.width=Math.round(2*R)+'px'; r2.style.height=Math.round(2*R)+'px'; }
    }catch(e){}
  }
  function yenidenBoyut(){ boyutla(); merkezKalibre(); yaziYerlestir(); }

  /* ===== NÖBETTEYİZ: dalgalanan Türk bayrağı + beyaz şapkalı hacker logosu ===== */
  var BAYRAK_DUZ=null;
  function bayrakTuvalHazirla(){
    if(BAYRAK_DUZ) return BAYRAK_DUZ;
    var c=document.createElement('canvas'); c.width=240; c.height=160;
    var g=c.getContext('2d');
    g.fillStyle='#E30A17'; g.fillRect(0,0,240,160);
    var b=8;                                   /* 30x20 birim -> 240x160 */
    g.fillStyle='#ffffff';
    g.beginPath();                             /* hilal: dış (7.5,10) r5 · iç (9,10) r4 ters yön */
    g.arc(7.5*b,10*b,5*b,0,Math.PI*2,false);
    g.arc(9*b,10*b,4*b,0,Math.PI*2,true);
    g.fill('nonzero');
    g.beginPath();                             /* yıldız: merkez (16.5,10) · uç sola bakar */
    for(var i=0;i<10;i++){
      var rr=(i%2===0)? 2.5*b : 1.0*b;
      var ac=Math.PI + i*Math.PI/5;
      var px=16.5*b+Math.cos(ac)*rr, py=10*b+Math.sin(ac)*rr;
      if(i===0) g.moveTo(px,py); else g.lineTo(px,py);
    }
    g.closePath(); g.fill();
    BAYRAK_DUZ=c; return c;
  }
  function bayrakCiz(cv,t,ters){
    bayrakTuvalHazirla();
    var g=cv.getContext('2d'), W2=cv.width, H2=cv.height;
    g.clearRect(0,0,W2,H2);
    var direkG=7;                              /* direk payı (metne bakan tarafta) */
    var x0=(ters? direkG:0), fw=W2-direkG;
    var gen=2, faz=(ters?-1:1);
    for(var x=0;x<fw;x+=gen){
      var u=x/fw;
      var dal=Math.sin(u*Math.PI*2.05*faz + t*0.0034)*H2*0.072 + Math.sin(u*Math.PI*4.6 + t*0.0021)*H2*0.026;
      var ok=0.932+0.068*Math.cos(u*Math.PI*2.05*faz + t*0.0034);
      var sh=H2*ok, ky=(H2-sh)/2+dal;
      g.drawImage(BAYRAK_DUZ, u*240, 0, 240*(gen/fw), 160, x0+x, ky, gen+0.7, sh);
      var kar=Math.max(0,-dal/(H2*0.09));
      if(kar>0){ g.fillStyle='rgba(0,0,0,'+(kar*0.26).toFixed(3)+')'; g.fillRect(x0+x,ky,gen+0.7,sh); }
      var isi=Math.max(0, dal/(H2*0.09));
      if(isi>0){ g.fillStyle='rgba(255,255,255,'+(isi*0.15).toFixed(3)+')'; g.fillRect(x0+x,ky,gen+0.7,sh); }
    }
    /* direk + tepelik */
    var dx=(ters? 2:W2-direkG+1);
    var dg=g.createLinearGradient(dx,0,dx+4,0);
    dg.addColorStop(0,'rgba(232,240,236,.95)'); dg.addColorStop(.5,'rgba(150,168,158,.9)'); dg.addColorStop(1,'rgba(80,95,88,.85)');
    g.fillStyle=dg; g.fillRect(dx,6,4,H2-8);
    g.save(); g.shadowBlur=10; g.shadowColor=ANA; g.fillStyle=ANA2;
    g.beginPath(); g.arc(dx+2,7,3.4,0,Math.PI*2); g.fill(); g.restore();
  }
  function hackerCiz(cv,t,ters){
    var g=cv.getContext('2d'), W2=cv.width, H2=cv.height, m=W2/2;
    g.clearRect(0,0,W2,H2);
    g.save();
    if(ters){ g.translate(W2,0); g.scale(-1,1); }   /* sol taraf: aynalanmış */
    var nab=0.55+0.45*Math.abs(Math.sin(t*0.0016));
    g.save(); g.strokeStyle='rgba('+RGB+','+nab.toFixed(3)+')'; g.lineWidth=2.4; g.shadowBlur=12; g.shadowColor=ANA;
    g.beginPath(); g.arc(m,m,W2*0.455,0,Math.PI*2); g.stroke(); g.restore();
    var rg=g.createRadialGradient(m,m*0.72,4,m,m,m*0.95);
    rg.addColorStop(0,'rgba('+RGB+',0.22)'); rg.addColorStop(1,'rgba(2,9,5,0.92)');
    g.fillStyle=rg; g.beginPath(); g.arc(m,m,W2*0.435,0,Math.PI*2); g.fill();
    /* halka üzerinde minik ikili işaretler */
    for(var i=0;i<12;i++){
      var a=i*Math.PI/6 + t*0.0004, r1=W2*0.47, r2=W2*0.50*(0.7+0.3*Math.abs(Math.sin(t*0.002+i)));
      g.strokeStyle='rgba('+RGB+','+(0.25+0.5*Math.abs(Math.sin(t*0.0022+i))).toFixed(3)+')'; g.lineWidth=1.6;
      g.beginPath(); g.moveTo(m+Math.cos(a)*r1, m+Math.sin(a)*r1); g.lineTo(m+Math.cos(a)*r2, m+Math.sin(a)*r2); g.stroke();
    }
    /* kapüşon omuzları */
    g.fillStyle='#08170f';
    g.beginPath(); g.moveTo(m-29,85); g.quadraticCurveTo(m-26,58,m-19,50);
    g.quadraticCurveTo(m,33,m+19,50); g.quadraticCurveTo(m+26,58,m+29,85); g.closePath(); g.fill();
    /* yüz (koyu) + neon gözler */
    g.fillStyle='#0d2016'; g.beginPath(); g.ellipse(m,52,15,17,0,0,Math.PI*2); g.fill();
    var goz=0.6+0.4*Math.abs(Math.sin(t*0.0022));
    g.save(); g.shadowBlur=10; g.shadowColor=ANA; g.fillStyle='rgba('+RGB2+','+goz.toFixed(3)+')';
    g.fillRect(m-10,50,7,3); g.fillRect(m+3,50,7,3); g.restore();
    /* BEYAZ ŞAPKA */
    g.save(); g.translate(0, Math.sin(t*0.0018)*1.2);
    g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(m,42,20,4.4,0,0,Math.PI*2); g.fill();
    var hg=g.createLinearGradient(0,14,0,38);
    hg.addColorStop(0,'#ffffff'); hg.addColorStop(1,'#d6e2da');
    g.fillStyle=hg;
    g.beginPath(); g.ellipse(m,37,19.5,4.6,0,0,Math.PI*2); g.fill();
    g.beginPath(); g.moveTo(m-12.5,37); g.quadraticCurveTo(m-13,18,m-3.5,16);
    g.quadraticCurveTo(m,15,m+3.5,16); g.quadraticCurveTo(m+13,18,m+12.5,37); g.closePath(); g.fill();
    g.fillStyle='rgba(118,138,126,.5)'; g.beginPath(); g.ellipse(m,32.6,13.4,2.1,0,0,Math.PI*2); g.fill();
    var sup=(t*0.00032)%1;
    g.save();
    g.beginPath(); g.moveTo(m-12.5,37); g.quadraticCurveTo(m-13,18,m-3.5,16);
    g.quadraticCurveTo(m,15,m+3.5,16); g.quadraticCurveTo(m+13,18,m+12.5,37); g.closePath(); g.clip();
    g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(m-22+sup*46,10,5,30);
    g.restore(); g.restore();
    g.restore();                                   /* aynalama katmanı */
  }
  function nobetKur(){
    var sol=document.getElementById('gBayrakSol');
    var sag=document.getElementById('gBayrakSag');
    var hk=document.getElementById('gHackerLogo');
    var hkSol=document.getElementById('gHackerLogoSol');
    if(!sol||!sag||!hk) return;
    bayrakTuvalHazirla();
    var dur=function(ts){
      if(!document.getElementById('gNobet')) return;      /* giriş kapandı: döngü biter */
      var t=ts||0;
      try{
        bayrakCiz(sol,t,false); bayrakCiz(sag,t,true);
        hackerCiz(hk,t,false);
        if(hkSol) hackerCiz(hkSol,t,true);          /* soldaki aynalı logo */
      }catch(e){}
      requestAnimationFrame(dur);
    };
    requestAnimationFrame(dur);
  }

  boyutla(); yildizKur(); korKur(); kayanKur(); atesKur(); yayKur(); tozKur(); yagmurKur(); kureKur(); nobetKur();
  setTimeout(merkezKalibre, 900);
  setTimeout(merkezKalibre, 2400);
  window.addEventListener('resize', yenidenBoyut);
  try{ sesCal(); }catch(e){}
  try{
    var as=document.getElementById('gAtaSes');
    if(as){
      as.volume=0.9;
      var cal=function(){
        if(!as.paused){ if(as.muted) as.muted=false; return; }   /* çalıyorsa sesi aç */
        try{
          var p=as.play();
          if(p && p.then){
            p.then(function(){ as.muted=false; })
             .catch(function(){
               /* tarayıcı otomatik oynatmayı engellediyse: sessiz başlat, sonra hemen sesi aç */
               as.muted=true;
               var p2=as.play();
               if(p2 && p2.then){ p2.then(function(){ as.muted=false; }).catch(function(){}); }
             });
          }
        }catch(e){}
      };
      if(as.readyState>=2){ cal(); } else { as.addEventListener('canplay', cal, {once:true}); }
      var dene=0, tik=setInterval(function(){
        if(!as || !as.paused){ clearInterval(tik); try{ if(as && as.muted) as.muted=false; }catch(e){} return; }
        if(++dene>25){ clearInterval(tik); return; }
        cal();
      }, 700);
      window.__ataTik=tik;
    }
  }catch(e){}
  setTimeout(function(){ /* sesler tıklamayla da çalışsın */
    var birKez=function(){
      try{ sesCal(); }catch(e){}
      try{ var as2=document.getElementById('gAtaSes'); if(as2){ as2.muted=false; if(as2.paused){ as2.play().catch(function(){}); } } }catch(e){}
      document.removeEventListener('click', birKez);
    };
    document.addEventListener('click', birKez);
  }, 300);

  var bas=null, asamaSon=-1;
  function dongu(ts){
    if(!bas) bas=ts;
    var t=ts-bas;
    kureAci += 0.0032;
    /* patlama tetik */
    if(t>GIRIS_SURE-900 && !patlama){
      patlama=1;
      for(var i=0;i<150;i++){
        var a2=Math.random()*Math.PI*2, h2=Math.random()*7+2;
        PART.push({x:0,y:0,vx:Math.cos(a2)*h2,vy:Math.sin(a2)*h2-1.5,yas:1.2,renk:(Math.random()>0.5?ANA2:ANA)});
      }
      var hz=document.getElementById('gHazir'); if(hz) hz.classList.add('gGel');
    }
    /* yüzde ve aşamalar */
    var oran=Math.min(1, t/GIRIS_SURE);
    var p=Math.round(oran*100);
    var pd=document.getElementById('gYukDolu'); if(pd) pd.style.width=p+'%';
    var pp=document.getElementById('gYukP'); if(pp) pp.textContent=p+'%';
    var asamaIdx=Math.min(ASAMALAR.length-1, Math.floor(oran*ASAMALAR.length));
    if(asamaIdx!==asamaSon){ asamaSon=asamaIdx; bootYaz(asamaIdx); }
    sahneCiz(t);
    if(!window.__kare || (window.__kare=(window.__kare||0)+1)%5===0) yaziYerlestir();
    if(t>=GIRIS_SURE){ kapat(); return; }
    requestAnimationFrame(dongu);
  }
  sahneCiz(0);
  requestAnimationFrame(dongu);

  /* güvenlik: her durumda en geç 8 sn sonra kapan */
  setTimeout(function(){ if(!bitti) kapat(); }, 23500);

  /* ---------- 6) DIŞA AÇIK FONKSİYONLAR ---------- */
  window.girisTekrarOynat=function(){
    try{ localStorage.setItem('ustad_giris','1'); }catch(e){}
    location.reload();
  };
  window.girisAyar=function(deger){
    try{ localStorage.setItem('ustad_giris', deger); }catch(e){}
    if(deger==='gun'){ try{ localStorage.setItem('ustad_giris_gun', new Date().toDateString()); }catch(e){} }
    return deger;
  };
  window.girisSesAyar=function(deger){ try{ localStorage.setItem('ustad_giris_ses', deger); }catch(e){} };

  /* ---------- 7) AYARLAR PANELİNE BÖLÜM EKLE ---------- */
  setTimeout(function(){
    if(typeof ayarlarPanel!=='function') return;
    var eski=ayarlarPanel;
    ayarlarPanel=function(){
      eski();
      var el=document.getElementById('sonuc_ayarlar'); if(!el) return;
      var mod='1', ses='1', gun='';
      try{ mod=localStorage.getItem('ustad_giris')||'1'; ses=localStorage.getItem('ustad_giris_ses')||'1'; gun=localStorage.getItem('ustad_giris_gun')||''; }catch(e){}
      var h='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">🎬 AÇILIŞ ANİMASYONU</h3>';
      h+='<div class="aracSatir">';
      h+='<button class="yerim'+(mod==='1'?' aktif':'')+'" onclick="girisAyar(\'1\');ayarlarPanel()">HER AÇILIŞTA</button>';
      h+='<button class="yerim'+(mod==='gun'?' aktif':'')+'" onclick="girisAyar(\'gun\');ayarlarPanel()">GÜNDE BİR</button>';
      h+='<button class="yerim'+(mod==='0'?' aktif':'')+'" onclick="girisAyar(\'0\');ayarlarPanel()">KAPALI</button>';
      h+='<button class="yerim'+(ses==='1'?' aktif':'')+'" onclick="girisSesAyar(\''+(ses==='1'?'0':'1')+'\');ayarlarPanel()">🔊 AÇILIŞ SESİ: '+(ses==='1'?'AÇIK':'KAPALI')+'</button>';
      h+='<button class="aracBtn" onclick="girisTekrarOynat()">▶ ŞİMDİ OYNAT</button>';
      h+='</div>';
      h+='<div class="uyari">Açılış sahnesi 17 saniye sürer: 3B yıldız alanı, gerçek tesis koordinatlarından tel kafes küre, '
       +'fotoğraf madalyonu (dönen kürenin tam merkezinde), ismin yuvarlak çizginin şeridinde, hoş geldin yazısı alt çizginin altında; '
       +'halka üzerinde dönen kıvılcımlar, radar taraması, canlı sistem aşamaları. Boşluk / Esc / tık ile atlanabilir.'
       +(gun? ' <br>En son ' + gun + ' tarihinde gösterildi.' : '')+'</div>';
      el.insertAdjacentHTML('beforeend', h);
    };
  }, 3000);
})();
