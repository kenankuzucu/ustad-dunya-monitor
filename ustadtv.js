/* ============================================================
   ÜSTAD TV (v5.6) — panelin sol tarafında kibar televizyon
   · SADECE TRT KANALLARI (13 kanal · hepsi TRT resmî HLS yayını)
   · 7/24 SABİT İKİ KANAL: TRT 1 + TRT HABER (açılışta TRT 1 gelir)
   · Diğer 11 kanal düğme: TRT 2 · TRT SPOR · TRT SPOR 2 · TRT BELGESEL ·
     TRT ÇOCUK · TRT MÜZİK · TRT TÜRK · TRT AVAZ · TRT ARABİ · TRT WORLD · TRT KURDÎ
   · Özel/dünya kanalları televizyondan çıkarıldı → DIŞARI sekmesinde
   · Ses: kaydırıcı + kıs/aç + tek adım düğmeleri · KALİTE: AUTO/1080/1440/2160
   · OYNATICIYA ÇİFT TIK → TAM EKRAN (Full HD/4K isteğiyle)
   Tüm kimlikler 17.09.2026 tarihinde canlı test edilerek alındı.
   ============================================================ */
var TV={
  kanal:'trt1', acik:true, ses:65, sessiz:false, kalite:'hd1440',
  oynatici:null, hazir:false, tip:'api', hataSayaci:0
};
var TV_KANALLAR={
  /* --- 7/24 SABİT İKİ TRT KANALI (açılışta TRT 1 kendiliğinden gelir) --- */
  trt1:     {ad:'TRT 1',        alt:'Türkiye · 7/24 · HD', hls:'https://tv-trt1.medya.trt.com.tr/master.m3u8',     tr:1, tip:'hls', sabit:true, renk:'#1d4ed8'},
  trthaber: {ad:'TRT HABER',    alt:'Haber · 7/24 · HD',   hls:'https://tv-trthaber.medya.trt.com.tr/master.m3u8', tr:1, tip:'hls', sabit:true, renk:'#dc2626'},
  /* --- TRT AİLESİ (HLS · CORS açık · doğrudan oynar · HD/2K) --- */
  trt2:     {ad:'TRT 2',        alt:'Kültür-sanat · HD', hls:'https://tv-trt2.medya.trt.com.tr/master.m3u8',       tr:1, tip:'hls', renk:'#1d4ed8'},
  trtspor:  {ad:'TRT SPOR',     alt:'Spor · HD',         hls:'https://tv-trtspor1.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#16a34a'},
  trtspor2: {ad:'TRT SPOR 2',   alt:'Spor · HD',         hls:'https://tv-trtspor2.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#16a34a'},
  trtbel:   {ad:'TRT BELGESEL', alt:'Belgesel · HD',     hls:'https://tv-trtbelgesel.medya.trt.com.tr/master.m3u8',tr:1, tip:'hls', renk:'#f59e0b'},
  trtcocuk: {ad:'TRT ÇOCUK',    alt:'Çocuk · HD',        hls:'https://tv-trtcocuk.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#ec4899'},
  trtmuzik: {ad:'TRT MÜZİK',    alt:'Müzik · HD',        hls:'https://tv-trtmuzik.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#8b5cf6'},
  trtturk:  {ad:'TRT TÜRK',     alt:'Türkiye · HD',      hls:'https://tv-trtturk.medya.trt.com.tr/master.m3u8',    tr:1, tip:'hls', renk:'#1d4ed8'},
  trtavaz:  {ad:'TRT AVAZ',     alt:'Türk dünyası',      hls:'https://tv-trtavaz.medya.trt.com.tr/master.m3u8',    tr:1, tip:'hls', renk:'#0ea5e9'},
  trtarabi: {ad:'TRT ARABİ',    alt:'Arapça',            hls:'https://tv-trtarabi.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#14b8a6'},
  trtw:     {ad:'TRT WORLD',    alt:'İngilizce',         hls:'https://tv-trtworld.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#1d4ed8'},
  trtkurdi: {ad:'TRT KURDÎ',    alt:'Kürtçe',            hls:'https://tv-trtkurdi.medya.trt.com.tr/master.m3u8',   tr:1, tip:'hls', renk:'#eab308'}
};


/* ---------------- YouTube IFrame API yükleyici ---------------- */
function ytHazirla(){
  if(window.YT && window.YT.Player) return Promise.resolve();
  return new Promise(function(res){
    if(!window.__ytCb){ window.__ytCb=[]; window.onYouTubeIframeAPIReady=function(){ var l=window.__ytCb; window.__ytCb=[]; for(var i=0;i<l.length;i++) l[i](); }; }
    window.__ytCb.push(res);
    if(!document.getElementById('ytApi')){
      var s=document.createElement('script'); s.id='ytApi'; s.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    setTimeout(res, 6000);
  });
}

/* ---------------- TV kutusu ---------------- */
function tvHtml(){
  var h='<div class="tvBaslik">'
    +'<span class="tvLogo"><img src="foto/ustad-kenan.jpg" alt="Üstad Kenan Kuzucu"></span>'
    +'<span class="tvAd"><b>ÜSTAD</b> TV<span class="tvAlt">ÜSTAD KENAN KUZUCU</span></span>'
    +'<span class="tvCanli" id="tvCanli"><i></i>CANLI</span>'
    +'<button class="tvGizle" onclick="tvKapat()" title="TV panelini gizle">✕</button>'
    +'</div>';
  h+='<div class="tvEkran" id="tvEkran" ondblclick="tvTamEkran()" title="tam ekran için çift tıkla">'
    +'<div class="tvBekleme" id="tvBekleme"><span class="tvBekMarka">ÜSTAD TV</span>'
    +'<span class="tvBekAlt">kanal seç · çift tıkla → tam ekran</span></div>'
    +'<div id="ytKutu" class="tvYtKutu"></div>'
    +'<div class="tvTamEkranCik" id="tvFeCik" onclick="tvTamEkranKapat()">⤢ tam ekrandan çık (Esc)</div>'
    +'</div>';
  h+='<div class="tvKumanda">'
    +'<button onclick="tvOynatDur()" id="tvPlayBtn" title="oynat / duraklat">⏸</button>'
    +'<button onclick="tvSesKis(-5)" title="ses azalt">🔉</button>'
    +'<button onclick="tvSessiz()" id="tvMuteBtn" title="sessiz">🔊</button>'
    +'<button onclick="tvSesKis(5)" title="ses artır">🔊</button>'
    +'<input type="range" id="tvSes" min="0" max="100" value="65" oninput="tvSesAyarla(this.value)" title="ses seviyesi">'
    +'<span class="tvSesYuzde" id="tvSesYuzde">65%</span>'
    +'<button onclick="tvYarimEkran()" title="yarım ekran: TV + canlı piyasa">◧</button>'
    +'<button onclick="tvTamEkran()" title="tam ekran (çift tık)">⛶</button>'
    +'</div>';
  h+='<div class="tvKumanda ikinci">'
    +'<span class="tvEt">KALİTE</span>'
    +'<button class="tvK" onclick="tvKalite(\'auto\')" id="tvKa">AUTO</button>'
    +'<button class="tvK" onclick="tvKalite(\'hd1080\')" id="tvK1">1080p</button>'
    +'<button class="tvK" onclick="tvKalite(\'hd1440\')" id="tvK2">1440p</button>'
    +'<button class="tvK" onclick="tvKalite(\'hd2160\')" id="tvK4">4K</button>'
    +'<span class="tvEt" id="tvKaliteEt" title="o anki yayın kalitesi">—</span>'
    +'<button onclick="tvYenile()" title="oynatıcıyı yenile (takılınca)">🔄</button>'
    +'<button onclick="tvLinkAc()" title="yeni sekmede aç">🔗</button>'
    +'</div>';
  h+='<div class="tvKanallar" id="tvKanallar">';          /* kaydırılabilir kanal alanı */
  h+='<div class="tvBolumBaslik">7/24 CANLI</div><div class="tvSabitler" id="tvSabitler"></div>';
  h+='<div class="tvBolumBaslik">🇹🇷 TRT KANALLARI (11 KANAL · HD · 2K)</div><div class="tvDugmeler" id="tvTr"></div>';
  h+='</div>';                                           /* /tvKanallar */
  h+='<div class="tvDipnot">🇹🇷 Televizyonda SADECE TRT: hepsi TRT resmî HLS yayını (full HD / 2K), doğrudan oynar. Özel kanallar, dünya kanalları ve canlı kameralar → DIŞARI sekmesi.</div>';
  return h;
}
function tvBadge(durum, ad){
  var el=$('tvCanli'); if(!el) return;
  el.classList.remove('yayinda','bekliyor','yok');
  if(durum==='canli'){ el.classList.add('yayinda'); el.innerHTML='<i></i>CANLI · '+esc(ad||''); }
  else if(durum==='bekliyor'){ el.classList.add('bekliyor'); el.innerHTML='<i></i>BAĞLANIYOR · '+esc(ad||''); }
  else { el.classList.add('yok'); el.innerHTML='<i></i>YAYIN YOK · '+esc(ad||''); }
  var kartlar=document.querySelectorAll('.tvKart');
  for(var i=0;i<kartlar.length;i++){
    if(durum==='canli') kartlar[i].classList.add('yayinda'); else kartlar[i].classList.remove('yayinda');
  }
}
function tvKanalDugmeleriCiz(){
  var s=$('tvSabitler'), d=$('tvDugmeler'), g=$('tvDiger');
  if(!s) return;
  var sh='';
  for(var k in TV_KANALLAR){
    var c=TV_KANALLAR[k];
    if(!c.sabit) continue;
    var secili=(TV.kanal===k);
    sh+='<button class="tvKart'+(secili?' secili':'')+'" style="--kk:'+c.renk+'" onclick="tvSec(\''+k+'\')">'
      +'<span class="tvKartUst"><i class="tvNokta"></i>'+esc(c.ad)+'</span>'
      +'<span class="tvKartAlt">'+esc(c.alt)+'</span></button>';
  }
  s.innerHTML=sh;
  var dh='';
  for(var k2 in TV_KANALLAR){
    var c2=TV_KANALLAR[k2];
    if(c2.sabit || c2.olay || c2.dis || c2.radyo || c2.tr) continue;
    dh+='<button class="tvDug'+(TV.kanal===k2?' secili':'')+'" style="--kk:'+c2.renk+'" onclick="tvSec(\''+k2+'\')" title="'+esc(c2.alt)+'">'+esc(c2.ad)+'</button>';
  }
  if(d) d.innerHTML=dh;
  /* Türkiye grupları */
  var tr1='', tr2='';
  for(var k4 in TV_KANALLAR){
    var c4=TV_KANALLAR[k4];
    if(!c4.tr || c4.sabit) continue;
    var dug='<button class="tvDug kucuk'+(TV.kanal===k4?' secili':'')+'" style="--kk:'+c4.renk+'" onclick="tvSec(\''+k4+'\')" title="'+esc(c4.alt)+'">'+esc(c4.ad)+'</button>';
    if(c4.tr===1) tr1+=dug; else tr2+=dug;
  }
  var et1=$('tvTr'), et2=$('tvTr2');
  if(et1) et1.innerHTML=tr1;
  if(et2) et2.innerHTML=tr2;
  var gh='';
  for(var k3 in TV_KANALLAR){
    var c3=TV_KANALLAR[k3];
    if(!c3.olay && !c3.dis && !c3.radyo) continue;
    gh+='<button class="tvDug kucuk'+(TV.kanal===k3?' secili':'')+'" style="--kk:'+c3.renk+'" onclick="tvSec(\''+k3+'\')" title="'+esc(c3.alt)+'">'
      +esc(c3.ad)+(c3.dis?' ↗':'')+(c3.radyo?' 📻':'')+'</button>';
  }
  if(g) g.innerHTML=gh;
}

/* ---------------- Kanal seç / oynat ---------------- */
function tvSec(kod, ilkAcilis){
  var c=TV_KANALLAR[kod]; if(!c) return;
  if(TV.kanal===kod && !ilkAcilis){ tvYenile(); return; }   /* aynı kanala tıklayınca yenile */
  TV.kanal=kod;
  tvBadge('bekliyor', c.ad);
  try{ localStorage.setItem('ustad_tv_kanal', kod); }catch(e){}
  tvKanalDugmeleriCiz();
  /* yeni sekmede açılan kanal */
  if(c.dis){
    window.open(c.link, '_blank');
    durum('harita','🔗 '+c.ad+' yeni sekmede açıldı (gömülü oynatma izni yok)');
    return;
  }
  /* radyo kanalı */
  if(c.radyo){ tvRadyoCal(c.radyo); return; }
  var canli=$('tvCanli');
  if(canli){ canli.classList.add('yayinda'); canli.innerHTML='<i></i>CANLI · '+esc(c.ad); }
  if(c.hls){                                        /* TRT/Show/Kanal D/TV8/NOW → video + hls.js */
    if(TV.oynatici && TV.oynatici.stopVideo){ try{ TV.oynatici.stopVideo(); }catch(e){} }
    tvHlsCal(kod, c, ilkAcilis); return;
  }
  var vv=$('tvVideo'); if(vv){ try{ vv.pause(); }catch(e){} }
  if(TV.hls){ try{ TV.hls.destroy(); }catch(e){} TV.hls=null; }
  var bek=$('tvBekleme'); if(bek) bek.style.display='none';
  if(!c.vid){   /* olay yayını: kanal kimliğinden canlıyı bul */
    tvIframeKur('https://www.youtube.com/embed/live_stream?channel='+c.kanal+'&autoplay=1'+(TV.sessiz?'&mute=1':''));
    durum('harita','📺 '+c.ad+' (olay yayını) — canlı yoksa YouTube "yayın yok" der');
    return;
  }
  ytHazirla().then(function(){
    var vq=(TV.kalite==='auto')? '' : '&vq='+TV.kalite;
    if(TV.oynatici && TV.oynatici.loadVideoById){
      try{
        TV.oynatici.loadVideoById(c.vid);
        if(TV.kalite!=='auto' && TV.oynatici.setPlaybackQuality) TV.oynatici.setPlaybackQuality(TV.kalite);
        tvSesUygula();
        if(!ilkAcilis) TV.oynatici.unMute();
        tvDurumYaz();
        return;
      }catch(e){}
    }
    var kutu=$('ytKutu'); if(!kutu) return;
    kutu.innerHTML='<div id="ytPlayer"></div>';
    TV.tip='api';
    TV.oynatici=new YT.Player('ytPlayer', {
      videoId:c.vid,
      playerVars:{ autoplay:1, mute:(ilkAcilis?1:0), rel:0, modestbranding:1, playsinline:1, controls:1, iv_load_policy:3 },
      events:{
        onReady:function(ev){
          TV.hazir=true;
          tvSesUygula();
          if(TV.kalite!=='auto' && ev.target.setPlaybackQuality) ev.target.setPlaybackQuality(TV.kalite);
          tvDurumYaz();
        },
        onStateChange:function(ev){
          tvDurumYaz(ev.data);
          var c3=TV_KANALLAR[TV.kanal];
          if(ev.data===1) tvBadge('canli', c3? c3.ad : '');          /* oynuyor */
          else if(ev.data===3) tvBadge('bekliyor', c3? c3.ad : '');  /* tampon */
        },
        onError:function(ev){
          var kod=ev.data;
          /* 100/101/150 = kanal gömülmeye kapalı → kalıcı yedek
             2/5 = geçici oynatma hatası → yeniden dene */
          if(kod===100||kod===101||kod===150){
            durum('harita','⚠ '+TV_KANALLAR[TV.kanal].ad+' gömülü oynatılamıyor — kanal kimliğinden bağlanılıyor');
            tvIframeKur('https://www.youtube.com/embed/live_stream?channel='+TV_KANALLAR[TV.kanal].kanal+'&autoplay=1');
            TV.tip='iframe';
          } else if(TV.hataSayaci<2){
            TV.hataSayaci++;
            durum('harita','📺 oynatıcı geçici hata verdi ('+kod+') — yeniden deneniyor…');
            setTimeout(function(){ tvSec(TV.kanal, true); }, 3500);
          } else {
            durum('harita','⚠ oynatıcı hata verdi — 🔄 düğmesiyle yenile');
          }
        }
      }
    });
  });
}
/* ---------------- HLS oynatıcı (TRT · Show TV · Kanal D · TV8 · NOW) ---------------- */
function hlsYukle(){
  if(window.Hls) return Promise.resolve(window.Hls);
  if(window.__hlsSoz) return window.__hlsSoz;
  window.__hlsSoz=new Promise(function(res,rej){
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    s.onload=function(){ res(window.Hls); };
    s.onerror=function(){ rej(new Error('hls oynatıcı yüklenemedi (internet?)')); };
    document.head.appendChild(s);
  });
  return window.__hlsSoz;
}
function tvHlsSes(){
  var v=$('tvVideo'); if(!v) return;
  v.volume=Math.max(0, Math.min(1, TV.ses/100));
  v.muted=!!TV.sessiz;
}
function tvHlsKalite(k, tamEkranZorla){
  if(!TV.hls || !TV.hls.levels || !TV.hls.levels.length) return 0;
  var hedefSeviye=null, enYuk=0;
  for(var j=0;j<TV.hls.levels.length;j++){ var hh=TV.hls.levels[j].height||0; if(hh>enYuk){ enYuk=hh; } }
  if(k==='auto' && !tamEkranZorla){ TV.hls.currentLevel=-1; return enYuk; }
  var hedef=tamEkranZorla? 99999 : (parseInt(String(k).replace('hd',''),10)||1080);
  var en=-1, enIyi=0;
  for(var i=0;i<TV.hls.levels.length;i++){
    var h=TV.hls.levels[i].height||0;
    if(h<=hedef && h>enIyi){ enIyi=h; en=i; }
  }
  if(en<0){ for(var q=0;q<TV.hls.levels.length;q++){ var h2=TV.hls.levels[q].height||0; if(h2>enIyi){ enIyi=h2; en=q; } } }
  TV.hls.currentLevel=en;
  return enIyi;
}
function tvHlsCal(kod, c, ilkAcilis){
  var ek=$('tvEkran'); if(!ek) return;
  var bek=$('tvBekleme');
  if(bek){ bek.style.display='flex'; bek.innerHTML='<span class="tvBekMarka">'+esc(c.ad)+'</span><span class="tvBekAlt">canlı yayına bağlanıyor…</span>'; }
  var kutu=$('ytKutu'); if(kutu) kutu.innerHTML='';
  if(TV.oynatici && TV.oynatici.stopVideo){ try{ TV.oynatici.stopVideo(); }catch(e){} }
  var v=$('tvVideo');
  if(!v){
    v=document.createElement('video');
    v.id='tvVideo'; v.setAttribute('playsinline',''); v.setAttribute('controls','controls');
    v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000;display:block';
    ek.insertBefore(v, ek.firstChild);
    v.addEventListener('playing', function(){                    /* gerçekten oynuyor → kırmızı CANLI */
      var c2=TV_KANALLAR[TV.kanal]; tvBadge('canli', c2? c2.ad : '');
    });
    v.addEventListener('waiting', function(){
      var c2=TV_KANALLAR[TV.kanal]; tvBadge('bekliyor', c2? c2.ad : '');
    });
  }
  TV.tip='hls';
  if(TV.hls){ try{ TV.hls.destroy(); }catch(e){} TV.hls=null; }
  if(TV.hlsZaman){ clearTimeout(TV.hlsZaman); TV.hlsZaman=null; }
  TV.hlsDeneme=TV.hlsDeneme||0;
  /* 13 saniyede yayın gelmezse kendiliğinden yeniden dener (en fazla 3 kez) */
  TV.hlsZaman=setTimeout(function(){
    if(TV.kanal!==kod || TV.tip!=='hls') return;
    if(TV.hls && TV.hls.levels && TV.hls.levels.length) return;
    if(TV.hlsDeneme<3){
      TV.hlsDeneme++;
      durum('harita','📺 '+c.ad+' yavaş açıldı — yeniden deneniyor ('+TV.hlsDeneme+'/3)…');
      try{ if(TV.hls) TV.hls.destroy(); }catch(e){}
      TV.hls=null;
      tvHlsCal(kod, c, ilkAcilis);
    } else if(bek){
      bek.style.display='flex';
      bek.innerHTML='<span class="tvBekMarka">'+esc(c.ad)+'</span><span class="tvBekAlt">yayına ulaşılamadı — 🔄 düğmesine bas</span>';
      tvBadge('yok', c.ad);
      durum('harita','⚠ '+c.ad+' açılamadı — 🔄 ile yenile veya UCAKLI modda dene');
    }
  }, 13000);
  hlsYukle().then(function(Hls){
    if(Hls && Hls.isSupported()){
      TV.hls=new Hls({ enableWorker:true, lowLatencyMode:false });
      TV.hls.loadSource(c.hls);
      TV.hls.attachMedia(v);
      TV.hls.on(Hls.Events.MANIFEST_PARSED, function(){
        if(bek) bek.style.display='none';
        if(TV.hlsZaman){ clearTimeout(TV.hlsZaman); TV.hlsZaman=null; }
        TV.hlsDeneme=0;
        TV.hazir=true;
        tvHlsSes();
        var sec=tvHlsKalite(TV.kalite);
        var et=$('tvKaliteEt'); if(et) et.textContent=(sec? sec+'p':'—');
        var p=v.play();
        if(p && p.catch){
          p.catch(function(){
            v.muted=true; TV.sessiz=true; tvSesUygula();
            v.play().catch(function(){});
            durum('harita','🔊 tarayıcı sesli açılışı engelledi — 🔊 düğmesiyle sesi aç');
          });
        }
        durum('harita','📺 '+c.ad+' CANLI (HLS · '+(TV.hls.levels? TV.hls.levels.length:0)+' kalite · en iyi '+sec+'p)');
      });
      TV.hls.on(Hls.Events.LEVEL_SWITCHED, function(e,d){
        var sev=$('tvSesYuzde');
        if(TV.hls.levels && TV.hls.levels[d.level]) var hh=TV.hls.levels[d.level].height;
        var et=$('tvKaliteEt'); if(et) et.textContent=(hh? hh+'p':'?');
      });
      TV.hls.on(Hls.Events.ERROR, function(e,d){
        if(d && d.fatal){
          var not=(d.type==='networkError')? 'yayına ulaşılamadı (ağ/CORS)' : (d.type==='mediaError'? 'yayın biçimi okunamadı' : String(d.details||'hata'));
          if(bek){ bek.style.display='flex'; bek.innerHTML='<span class="tvBekMarka">'+esc(c.ad)+'</span><span class="tvBekAlt">'+esc(not)+'</span>'; }
          tvBadge('yok', c.ad);
          durum('harita','⚠ '+c.ad+': '+not+' — 🔄 ile yenile');
        }
      });
    } else if(v.canPlayType('application/vnd.apple.mpegurl')){
      v.src=c.hls; v.play().catch(function(){});
      if(bek) bek.style.display='none';
      TV.tip='hls';
    } else {
      if(bek) bek.innerHTML='<span class="tvBekMarka">'+esc(c.ad)+'</span><span class="tvBekAlt">bu tarayıcı HLS oynatamıyor</span>';
    }
  }).catch(function(e){
    if(bek) bek.innerHTML='<span class="tvBekMarka">'+esc(c.ad)+'</span><span class="tvBekAlt">'+esc(e.message)+'</span>';
  });
}
/* gömülü oynatma engellenirse: kanal kimliğiyle düz iframe */
function tvIframeKur(url){
  var kutu=$('ytKutu'); if(!kutu) return;
  var v=$('tvVideo');
  if(v){ try{ v.pause(); v.removeAttribute('src'); }catch(e){} }
  if(TV.hls){ try{ TV.hls.destroy(); }catch(e){} TV.hls=null; }
  TV.tip='iframe';
  var ck=TV_KANALLAR[TV.kanal]; tvBadge('canli', ck? ck.ad : '');
  kutu.innerHTML='<iframe src="'+url+'" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%"></iframe>';
  durum('harita','📺 kanal kimliği üzerinden bağlandı (ses kontrolü YouTube çubuğunda)');
}
function tvYenile(){
  TV.hataSayaci=0; TV.hazir=false; TV.hlsDeneme=0;
  if(TV.hlsZaman){ clearTimeout(TV.hlsZaman); TV.hlsZaman=null; }
  var kutu=$('ytKutu'); if(kutu) kutu.innerHTML='';
  var c=TV_KANALLAR[TV.kanal];
  tvBadge('bekliyor', c? c.ad : '');
  if(c && c.hls){                                  /* TRT / Show / Kanal D / TV8 / NOW */
    try{ if(TV.hls) TV.hls.destroy(); }catch(e){}
    TV.hls=null;
    var v=$('tvVideo'); if(v){ try{ v.pause(); }catch(e){} }
    durum('harita','🔄 '+c.ad+' yayını yenilendi');
    tvHlsCal(TV.kanal, c, true);
    return;
  }
  TV.oynatici=null; TV.tip='api';
  durum('harita','🔄 ÜSTAD TV oynatıcı yenilendi');
  tvSec(TV.kanal, true);
}
function tvDurumYaz(durumKodu){
  var b=$('tvPlayBtn'); if(!b) return;
  if(durumKodu===undefined && TV.oynatici && TV.oynatici.getPlayerState) durumKodu=TV.oynatici.getPlayerState();
  b.textContent=(durumKodu===1)? '⏸':'▶';
}
/* ---------------- Kontroller ---------------- */
function tvOynatDur(){
  if(TV.tip==='iframe'){ durum('harita','gömülü kanalda oynat/duraklat YouTube çubuğunda'); return; }
  if(TV.tip==='hls'){
    var v=$('tvVideo'); if(!v) return;
    if(v.paused){ v.play().catch(function(){}); } else { v.pause(); }
    setTimeout(function(){ tvDurumYaz(); }, 300);
    return;
  }
  if(!TV.oynatici || !TV.oynatici.getPlayerState) return;
  var s=TV.oynatici.getPlayerState();
  if(s===1) TV.oynatici.pauseVideo(); else TV.oynatici.playVideo();
  setTimeout(function(){ tvDurumYaz(); }, 400);
}
function tvSesAyarla(deger){
  TV.ses=parseInt(deger,10)||0;
  if(TV.ses>0 && TV.sessiz){ TV.sessiz=false; }
  tvSesUygula();
  try{ localStorage.setItem('ustad_tv_ses', String(TV.ses)); }catch(e){}
}
function tvSesKis(fark){
  var y=Math.max(0, Math.min(100, TV.ses+fark));
  var sl=$('tvSes'); if(sl) sl.value=y;
  tvSesAyarla(y);
}
function tvSessiz(){
  TV.sessiz=!TV.sessiz;
  tvSesUygula();
  try{ localStorage.setItem('ustad_tv_sessiz', TV.sessiz?'1':'0'); }catch(e){}
}
function tvSesUygula(){
  var b=$('tvMuteBtn'); if(b) b.textContent=TV.sessiz? '🔇':'🔊';
  var y=$('tvSesYuzde'); if(y) y.textContent=(TV.sessiz? 'sessiz':TV.ses+'%');
  var sl=$('tvSes'); if(sl && String(sl.value)!==String(TV.ses)) sl.value=TV.ses;
  if(TV.tip==='hls'){ tvHlsSes(); return; }
  if(TV.tip==='iframe') return;
  try{
    if(!TV.oynatici || !TV.oynatici.setVolume) return;
    TV.oynatici.setVolume(TV.ses);
    if(TV.sessiz) TV.oynatici.mute(); else TV.oynatici.unMute();
  }catch(e){}
}
function tvKalite(k){
  TV.kalite=k;
  try{ localStorage.setItem('ustad_tv_kalite', k); }catch(e){}
  var esles={'auto':'tvKa','hd1080':'tvK1','hd1440':'tvK2','hd2160':'tvK4'};
  for(var id in esles){ var el=$(esles[id]); if(el) el.className='tvK'+(k===id?' secili':''); }
  if(TV.tip==='hls'){
    var sec=tvHlsKalite(k);
    durum('harita','📺 kalite: '+(k==='auto'?'AUTO':'en iyi '+sec+'p')+' (yayının sunduğu en yüksek)');
    return;
  }
  var c=TV_KANALLAR[TV.kanal];
  if(c && c.vid && TV.oynatici && TV.oynatici.setPlaybackQuality){
    try{ TV.oynatici.setPlaybackQuality(k==='auto'?'default':k); }catch(e){}
    durum('harita','📺 kalite isteği: '+(k==='auto'?'AUTO':k.replace('hd','')+'p')+' (YouTube gerekirse kendi ayarlar)');
  } else {
    durum('harita','📺 kalite kaydedildi; kanal değişince uygulanacak');
  }
}
function tvLinkAc(){
  var c=TV_KANALLAR[TV.kanal];
  if(c && c.hls){ durum('harita','📺 '+c.ad+' doğrudan yayın adresi (m3u8): '+c.hls.slice(0,70)+'…'); return; }
  if(c && c.vid) window.open('https://www.youtube.com/watch?v='+c.vid, '_blank');
  else if(c && c.kanal) window.open('https://www.youtube.com/channel/'+c.kanal+'/live', '_blank');
}
/* ---------------- Tam ekran (çift tık) ---------------- */
function tvTamEkran(){
  var ek=$('tvEkran'); if(!ek) return;
  var c=TV_KANALLAR[TV.kanal];
  if(TV.tip==='hls'){                       /* tam ekranda yayının EN YÜKSEK kalitesi (Full HD / 4K) */
    var en=tvHlsKalite('auto', true);
    durum('harita','⛶ tam ekran — yayının en yüksek kalitesi isteniyor ('+en+'p)');
  } else if(c && (c.vid || c.kanal) && TV.kalite==='auto') tvKalite('hd1080');
  var istek=ek.requestFullscreen||ek.webkitRequestFullscreen||ek.msRequestFullscreen;
  if(istek){
    istek.call(ek).then(function(){
      var f=$('tvFeCik'); if(f) f.style.display='block';
      durum('harita','⛶ ÜSTAD TV tam ekran — çıkmak için Esc veya çift tık');
    }).catch(function(){ durum('harita','⚠ tam ekran reddedildi'); });
  } else { durum('harita','⚠ bu tarayıcı tam ekranı desteklemiyor'); }
}
function tvTamEkranKapat(){
  if(document.exitFullscreen || document.webkitExitFullscreen){
    (document.exitFullscreen||document.webkitExitFullscreen).call(document);
    var f=$('tvFeCik'); if(f) f.style.display='none';
  }
}
document.addEventListener('fullscreenchange', function(){
  var f=$('tvFeCik');
  if(document.fullscreenElement){ if(f) f.style.display='block'; }
  else { if(f) f.style.display='none'; }
});
document.addEventListener('dblclick', function(e){
  var ek=$('tvEkran');
  if(document.fullscreenElement && ek && ek.contains(e.target)) tvTamEkranKapat();
});
/* ---------------- Yarım ekran: TV + canlı piyasa ---------------- */
function tvYarimTemizle(){
  try{
    var v=$('tvVideo'), ek=$('tvEkran');
    if(v && ek && v.parentNode!==ek) ek.insertBefore(v, ek.firstChild);
    var p=$('piyasaKutu'), duzen=document.querySelector('.haritaDuzen');
    if(p && duzen && p.parentNode!==duzen) duzen.insertBefore(p, duzen.firstChild);
    var y=$('tvYarim'); if(y) y.classList.remove('acik');
  }catch(e){}
}
function tvYarimEkran(){
  var y=$('tvYarim');
  if(!y){
    y=document.createElement('div');
    y.id='tvYarim';
    y.innerHTML='<div class="yarimSol" id="yarimSol"></div>'
      +'<div class="yarimSag" id="yarimSag"></div>'
      +'<div class="yarimCik" onclick="tvYarimKapat()">✕ çık (Esc)</div>';
    document.body.appendChild(y);
  }
  var v=$('tvVideo'); if(v) $('yarimSol').appendChild(v);
  var p=$('piyasaKutu'); if(p) $('yarimSag').appendChild(p);
  y.classList.add('acik');
  var istek=y.requestFullscreen||y.webkitRequestFullscreen;
  if(istek){ try{ istek.call(y).catch(function(){}); }catch(e){} }
  durum('harita','◧ yarım ekran: TV + canlı piyasa — çıkmak için Esc');
}
function tvYarimKapat(){
  try{ if(document.exitFullscreen) document.exitFullscreen(); else if(document.webkitExitFullscreen) document.webkitExitFullscreen(); }catch(e){}
  tvYarimTemizle();
}
document.addEventListener('fullscreenchange', function(){
  if(!document.fullscreenElement) tvYarimTemizle();
});
/* ---------------- Radyo (BBC World Service) ---------------- */
function tvRadyoCal(ad){
  var a=$('tvRadyo');
  if(!a){ a=document.createElement('audio'); a.id='tvRadyo'; a.controls=true; a.style.cssText='width:100%;margin-top:6px'; document.body.appendChild(a); }
  var el=$('tvBekleme');
  if(el) el.innerHTML='<span class="tvBekMarka">📻 '+esc(ad)+'</span><span class="tvBekAlt">radyo aranıyor…</span>';
  fetchJSON('https://de1.api.radio-browser.info/json/stations/search?name='+encodeURIComponent(ad)+'&limit=5&hidebroken=true&order=clickcount&reverse=true', 25000)
    .then(function(d){
      if(!d || !d.length) throw new Error('istasyon bulunamadı');
      var s=d[0];
      a.src=s.url_resolved||s.url; a.play();
      if(el) el.innerHTML='<span class="tvBekMarka">📻 '+esc((s.name||'').slice(0,26))+'</span><span class="tvBekAlt">'+esc(s.country||'')+' · '+esc(s.codec||'')+'</span>';
      tvBadge('canli', 'RADYO · '+String(s.name||'').slice(0,20));
      durum('harita','📻 '+s.name+' çalıyor');
    }).catch(function(e){
      if(el) el.innerHTML='<span class="tvBekMarka">📻 BBC World Service</span><span class="tvBekAlt">yayın bulunamadı: '+esc(e.message)+'</span>';
    });
}
/* ---------------- Aç / kapat ---------------- */
function tvKur(){
  var alan=$('ustadTvKutu'); if(!alan) return;
  if(alan.getAttribute('kuruldu')==='1') return;
  alan.innerHTML=tvHtml();
  alan.setAttribute('kuruldu','1');
  /* kayıtlı ayarlar */
  try{
    var k=localStorage.getItem('ustad_tv_kanal');
    var sur=localStorage.getItem('ustad_tv_surum');
    if(sur!=='6'){                       /* v5.6: sadece TRT — açılışta TRT 1 · 1440p varsayılan */
      TV.kanal='trt1';
      TV.kalite='hd1440';
      try{ localStorage.setItem('ustad_tv_surum','6'); localStorage.setItem('ustad_tv_kanal','trt1'); localStorage.setItem('ustad_tv_kalite','hd1440'); }catch(e){}
    } else if(k && TV_KANALLAR[k]) TV.kanal=k;
    var s=localStorage.getItem('ustad_tv_ses'); if(s) TV.ses=parseInt(s,10);
    var m=localStorage.getItem('ustad_tv_sessiz'); TV.sessiz=(m==='1');
    var q=localStorage.getItem('ustad_tv_kalite'); if(q) TV.kalite=q;
    var a=localStorage.getItem('ustad_tv_acik'); TV.acik=(a!=='0');
  }catch(e){}
  var sl=$('tvSes'); if(sl) sl.value=TV.ses;
  var esles={'auto':'tvKa','hd1080':'tvK1','hd1440':'tvK2','hd2160':'tvK4'};
  for(var id in esles){ var el=$(esles[id]); if(el) el.className='tvK'+(TV.kalite===id?' secili':''); }
  tvKanalDugmeleriCiz();
  tvSesUygula();
  tvAcKapatUygula();
  tvBtnEkle();
  tvBoyutAyarla();
  if(TV.acik) setTimeout(function(){ tvSec(TV.kanal, true); }, 900);
}
function tvBoyutAyarla(){
  var alan=$('ustadTvKutu'); if(!alan) return;
  /* sayfa akışındaki kart: yükseklik CSS'ten gelir (harita ile aynı 560px) */
  alan.style.height = (window.innerWidth<=1080) ? 'auto' : '';
}
window.addEventListener('resize', function(){ tvBoyutAyarla(); });
function tvAcKapatUygula(){
  var alan=$('ustadTvKutu'); if(!alan) return;
  alan.style.display=TV.acik? 'flex':'none';
  if(TV.acik) tvBoyutAyarla();
  var b=$('tvBtn');
  if(b){ b.textContent=(TV.acik?'📺 ÜSTAD TV: AÇIK':'📺 ÜSTAD TV: KAPALI'); b.className='aracBtn'+(TV.acik?' sesAcik':''); }
  try{ localStorage.setItem('ustad_tv_acik', TV.acik?'1':'0'); }catch(e){}
}
function tvKapat(){
  TV.acik=false; tvAcKapatUygula();
  if(TV.oynatici && TV.oynatici.pauseVideo){ try{ TV.oynatici.pauseVideo(); }catch(e){} }
  durum('harita','📺 ÜSTAD TV gizlendi (araç çubuğundaki 📺 düğmesiyle geri gelir)');
}
function tvAc(){
  TV.acik=true; tvAcKapatUygula(); tvKur();
  var b=$('tvBtn'); if(b) b.className='aracBtn sesAcik';
  if(TV.acik) setTimeout(function(){ tvSec(TV.kanal, true); }, 700);
  durum('harita','📺 ÜSTAD TV açık');
}
/* araç çubuğuna TV düğmesi ekle */
function tvBtnEkle(){
  if($('tvBtn')) return;
  var cubuk=$('aracCubugu'); if(!cubuk) return;
  var b=document.createElement('button');
  b.id='tvBtn'; b.className='aracBtn'+(TV.acik?' sesAcik':''); b.textContent=(TV.acik?'📺 ÜSTAD TV: AÇIK':'📺 ÜSTAD TV: KAPALI');
  b.title='ÜSTAD TV panelini aç/kapat (sol taraf)';
  b.onclick=tvDegis;
  cubuk.insertBefore(b, cubuk.firstChild);
}
function tvDegis(){ if(TV.acik) tvKapat(); else tvAc(); }
/* rozet senkronu: video gerçekten oynuyorsa kırmızı CANLI, durduysa BAĞLANIYOR */
setInterval(function(){
  try{
    var v=$('tvVideo');
    if(TV.tip==='hls' && v){
      var c=TV_KANALLAR[TV.kanal]; var ad=c? c.ad : '';
      var el=$('tvCanli'); var su=(el? el.innerText : '');
      if(!v.paused && (v.readyState>=2 || v.videoWidth>0) && su.indexOf('CANLI')<0) tvBadge('canli', ad);
      else if(v.paused && su.indexOf('BAĞLANIYOR')<0 && su.indexOf('YAYIN YOK')<0) tvBadge('bekliyor', ad);
    }
    if(TV.tip==='api' && TV.oynatici && TV.oynatici.getPlayerState){
      var c2=TV_KANALLAR[TV.kanal];
      if(TV.oynatici.getPlayerState()===1) tvBadge('canli', c2? c2.ad : '');
    }
  }catch(e){}
}, 2500);
/* sekme değişince videoyu duraklat (işlemci dostu) */
setInterval(function(){
  try{
    if(typeof AKTIF==='undefined') return;
    if(AKTIF!=='harita'){
      if(TV.oynatici && TV.oynatici.pauseVideo && TV.oynatici.getPlayerState && TV.oynatici.getPlayerState()===1){ try{ TV.oynatici.pauseVideo(); }catch(e){} }
    }
  }catch(e){}
}, 4000);
/* kur */
setTimeout(tvKur, 2200);
