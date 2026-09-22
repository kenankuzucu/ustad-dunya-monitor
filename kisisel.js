/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — AYARLAR MERKEZİ (v5.2)
   Kendi mod setlerin · tema tasarımcısı · yedekle/geri yükle ·
   açılış tercihi · gece nöbeti · Telegram alarmı · alarm sesleri ·
   uydu geçiş hatırlatıcı · telefon düzeni · QR + yerel sunucu
   ============================================================ */
var MODLARIM=[], SES_TUR='bip', TELEGRAM={token:'', chat:'', acik:false}, GECE={acik:false, gunbatimi:'18:40'};
var UYDU_HATIRLAT={acik:false, son:''};

function ayarOku(){
  try{
    MODLARIM=JSON.parse(localStorage.getItem('ustad_modlarim')||'[]');
    var s=localStorage.getItem('ustad_ses_tur'); if(s) SES_TUR=s;
    TELEGRAM=JSON.parse(localStorage.getItem('ustad_telegram')||'{"token":"","chat":"","acik":false}');
    GECE=JSON.parse(localStorage.getItem('ustad_gece')||'{"acik":false,"gunbatimi":"18:40"}');
    UYDU_HATIRLAT=JSON.parse(localStorage.getItem('ustad_uyduhatir')||'{"acik":false,"son":""}');
  }catch(e){}
}
function ayarYaz(anahtar, deger){ try{ localStorage.setItem(anahtar, (typeof deger==='string')?deger:JSON.stringify(deger)); }catch(e){} }

/* ---------------- 1) KENDİ MOD SETLERİM ---------------- */
function modSetiKaydet(){
  var ad=(prompt('Bu mod setine isim ver (ör. Kenan modu):')||'').trim();
  if(!ad) return;
  var kopya={}; for(var k in KATMAN){ kopya[k]=KATMAN[k]?1:0; }
  MODLARIM.push({ad:ad, katmanlar:kopya, tema:(document.body.getAttribute('data-renk')||'monitor'), tarih:new Date().toLocaleString('tr-TR')});
  ayarYaz('ustad_modlarim', MODLARIM);
  durum('ayarlar','✔ mod seti kaydedildi: '+ad);
  ayarlarPanel();
}
function modSetiYukle(i){
  var m=MODLARIM[i]; if(!m) return;
  for(var k in KATMAN){ KATMAN[k]=m.katmanlar[k]?1:0; }
  if(m.tema && typeof renkUygula==='function') renkUygula(m.tema);
  if(typeof kureCiz==='function') kureCiz();
  if(typeof haritaSenkron==='function') haritaSenkron(true);
  if(typeof katPanelOlustur==='function') katPanelOlustur();
  durum('ayarlar','✔ mod seti uygulandı: '+m.ad);
}
function modSetiSil(i){
  if(!MODLARIM[i]) return;
  var ad=MODLARIM[i].ad;
  MODLARIM.splice(i,1); ayarYaz('ustad_modlarim', MODLARIM);
  durum('ayarlar','✘ silindi: '+ad);
  ayarlarPanel();
}

/* ---------------- 2) TEMA TASARIMCISI ---------------- */
var OZEL_TEMA_SIRA=0;
function temaTasarla(){
  var ana=($('tz_ana')||{}).value||'#00ff41';
  var ana2=($('tz_ana2')||{}).value||'#7bffa1';
  var kart=($('tz_kart')||{}).value||'#00140a';
  var zemin=($('tz_zemin')||{}).value||'#003a12';
  var yazi=($('tz_yazi')||{}).value||'#c9ffd8';
  var ad='ozel'+(++OZEL_TEMA_SIRA);
  var st=$('ozelTemaStil');
  if(!st){ st=document.createElement('style'); st.id='ozelTemaStil'; document.head.appendChild(st); }
  var eski=st.innerHTML;
  st.innerHTML=eski+'\nbody[data-renk="'+ad+'"]{ --ana:'+ana+'; --ana2:'+ana2+'; --cizgi:'+ana+'55; --yazi:'+yazi+'; --yazi2:'+yazi+'99; --kart:'+kart+'; --kod:'+kart+'; --zemin1:'+zemin+'; --tarama:'+ana+'12; --vurgu:'+ana2+'; }';
  /* tema düğmesi ekle */
  var kutu=document.querySelector('.renkBtn');
  if(kutu && kutu.parentNode){
    var b=document.createElement('button');
    b.className='renkBtn'; b.setAttribute('data-r', ad); b.textContent='ÖZEL';
    b.onclick=function(){ renkUygula(ad); };
    kutu.parentNode.appendChild(b);
  }
  ayarYaz('ustad_ozel_tema_'+ad, JSON.stringify({ana:ana, ana2:ana2, kart:kart, zemin:zemin, yazi:yazi}));
  renkUygula(ad);
  durum('ayarlar','✔ özel tema uygulandı ('+ad+') — tema çubuğunda ÖZEL olarak duruyor');
}
function ozelTemalariGeriYukle(){
  for(var i=1;i<=6;i++){
    var ad='ozel'+i;
    var t=null; try{ t=localStorage.getItem('ustad_ozel_tema_'+ad); }catch(e){}
    if(!t) continue;
    var o=JSON.parse(t);
    var st=$('ozelTemaStil');
    if(!st){ st=document.createElement('style'); st.id='ozelTemaStil'; document.head.appendChild(st); }
    st.innerHTML+='\nbody[data-renk="'+ad+'"]{ --ana:'+o.ana+'; --ana2:'+o.ana2+'; --cizgi:'+o.ana+'55; --yazi:'+o.yazi+'; --yazi2:'+o.yazi+'99; --kart:'+o.kart+'; --kod:'+o.kart+'; --zemin1:'+o.zemin+'; --tarama:'+o.ana+'12; --vurgu:'+o.ana2+'; }';
    var kutu=document.querySelector('.renkBtn');
    if(kutu && kutu.parentNode){
      var b=document.createElement('button');
      b.className='renkBtn'; b.setAttribute('data-r', ad); b.textContent='ÖZEL'+(i>1?i:'');
      b.onclick=(function(x){ return function(){ renkUygula(x); }; })(ad);
      kutu.parentNode.appendChild(b);
    }
    OZEL_TEMA_SIRA=i;
  }
}

/* ---------------- 3) YEDEKLE / GERİ YÜKLE ---------------- */
function ayarYedekle(){
  var o={surum:'v5.2', tarih:new Date().toISOString(), ayarlar:{}, katman:{}};
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k && k.indexOf('ustad_')===0) o.ayarlar[k]=localStorage.getItem(k);
    }
  }catch(e){}
  for(var k2 in KATMAN){ o.katman[k2]=KATMAN[k2]?1:0; }
  var metin=JSON.stringify(o, null, 1);
  dosyaIndir(metin, 'ustad-monitor-yedek-'+tarihDamga()+'.json');
  durum('ayarlar','✔ yedek indirildi');
}
function ayarGeriYukleGirdi(){
  var g=$('yedekDosya'); if(!g || !g.files || !g.files[0]){ durum('ayarlar','✘ önce bir .json yedek dosyası seç'); return; }
  var fr=new FileReader();
  fr.onload=function(){
    try{
      var o=JSON.parse(fr.result);
      var n=0;
      for(var k in (o.ayarlar||{})){ try{ localStorage.setItem(k, o.ayarlar[k]); n++; }catch(e){} }
      for(var k2 in (o.katman||{})){ KATMAN[k2]=o.katman[k2]?1:0; }
      ayarOku(); ozelTemalariGeriYukle();
      if(typeof kureCiz==='function') kureCiz();
      if(typeof katPanelOlustur==='function') katPanelOlustur();
      if(typeof alarmYukle==='function') alarmYukle();
      durum('ayarlar','✔ yedek geri yüklendi ('+n+' ayar) — sayfayı yenilemek en sağlıklısı');
      ayarlarPanel();
    }catch(e){ durum('ayarlar','✘ yedek okunamadı: '+e.message); }
  };
  fr.readAsText(g.files[0]);
}

/* ---------------- 4) AÇILIŞ TERCİHİ ---------------- */
function acilisKaydet(){
  var s=($('ac_sekme')||{}).value||'harita';
  var m=($('ac_mod')||{}).value||'3d';
  var t=($('ac_tema')||{}).value||'';
  ayarYaz('ustad_acilis', {sekme:s, mod:m, tema:t});
  durum('ayarlar','✔ açılış tercihi kaydedildi: '+s+' / '+m+(t?' / '+t:''));
}
function acilisUygula(){
  var a=null; try{ a=JSON.parse(localStorage.getItem('ustad_acilis')||'null'); }catch(e){}
  if(!a) return;
  if(a.tema && typeof renkUygula==='function') renkUygula(a.tema);
  var ic=$('ac_sekme'); if(ic) ic.value=a.sekme||'harita';
  var im=$('ac_mod'); if(im) im.value=a.mod||'3d';
  setTimeout(function(){
    if(typeof git==='function' && a.sekme && a.sekme!=='harita') git(a.sekme);
    if(typeof modSec==='function' && a.mod) { try{ modSec(a.mod); }catch(e){} }
  }, 3200);
}

/* ---------------- 5) GECE NÖBETİ ---------------- */
function geceNobetiDegis(){
  GECE.acik=!GECE.acik;
  ayarYaz('ustad_gece', GECE);
  document.body.classList.toggle('geceNobeti', GECE.acik);
  if(GECE.acik){
    fetchJSON('https://api.sunrisesunset.io/json?lat=37.066&lng=37.383&timezone=Europe/Istanbul', 12000).then(function(d){
      if(d && d.results && d.results.sunset){ GECE.gunbatimi=d.results.sunset; ayarYaz('ustad_gece', GECE); }
    }).catch(function(){});
    durum('ayarlar','🌙 GECE NÖBETİ açık — ekran yumuşatıldı, yalnızca kritik alarmlar ses çıkarır (Gaziantep gün batımı '+(GECE.gunbatimi||'-')+')');
    return 'gece nöbeti AÇIK';
  }
  durum('ayarlar','gece nöbeti kapandı');
  return 'gece nöbeti kapalı';
}

/* ---------------- 6) TELEGRAM ALARMI ---------------- */
function telegramKaydet(){
  TELEGRAM.token=($('tg_token')||{}).value||'';
  TELEGRAM.chat=($('tg_chat')||{}).value||'';
  TELEGRAM.acik=!!(($('tg_acik')||{}).checked);
  ayarYaz('ustad_telegram', TELEGRAM);
  durum('ayarlar','✔ Telegram ayarları kaydedildi'+(TELEGRAM.acik?' (aktif)':''));
}
function telegramGonder(metin){
  if(!TELEGRAM.acik || !TELEGRAM.token || !TELEGRAM.chat) return Promise.resolve(false);
  var url='https://api.telegram.org/bot'+TELEGRAM.token+'/sendMessage?chat_id='+encodeURIComponent(TELEGRAM.chat)+'&text='+encodeURIComponent(metin);
  return fetch(url).then(function(r){ return r.json(); }).then(function(d){ return !!(d&&d.ok); }).catch(function(){ return false; });
}
function telegramTest(){
  telegramKaydet();
  if(!TELEGRAM.token || !TELEGRAM.chat){ durum('ayarlar','✘ bot token ve sohbet kimliği gerekli'); return; }
  telegramGonder('🔔 ÜSTAD DÜNYA MONİTÖRÜ test mesajı · '+new Date().toLocaleString('tr-TR')).then(function(ok){
    durum('ayarlar', ok?'✔ test mesajı Telegram\'a gönderildi':'✘ gönderilemedi (token/sohbet kimliği hatalı olabilir)');
  });
}

/* ---------------- 7) ALARM SES KÜTÜPHANESİ ---------------- */
function sesTurSec(tur){
  SES_TUR=tur; ayarYaz('ustad_ses_tur', tur);
  if(typeof ALARM!=='undefined'){ ALARM.sesTuru=tur; }
  durum('ayarlar','🔊 alarm sesi: '+tur);
  sesDene(tur);
  ayarlarPanel();
}
function sesDene(tur){
  try{
    var ctx=new (window.AudioContext||window.webkitAudioContext)();
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    var simdi=ctx.currentTime;
    if(tur==='siren'){
      o.type='sawtooth'; g.gain.value=0.08;
      for(var i=0;i<4;i++){
        o.frequency.setValueAtTime(600, simdi+i*0.5);
        o.frequency.linearRampToValueAtTime(1150, simdi+i*0.5+0.35);
      }
      o.start(simdi); o.stop(simdi+2);
    } else if(tur==='terminal'){
      o.type='square'; g.gain.value=0.05;
      for(var j=0;j<6;j++){ o.frequency.setValueAtTime(1200+Math.random()*400, simdi+j*0.09); }
      o.start(simdi); o.stop(simdi+0.6);
    } else if(tur==='sessiz'){ return; }
    else {
      o.type='sine'; g.gain.value=0.09;
      o.frequency.setValueAtTime(880, simdi); o.frequency.setValueAtTime(1320, simdi+0.16);
      o.start(simdi); o.stop(simdi+0.42);
    }
  }catch(e){}
}
if(typeof alarmSes==='function'){
  var _eskiAlarmSes=alarmSes;
  alarmSes=function(){ sesDene(SES_TUR); };
}

/* ---------------- 8) UYDU GEÇİŞ HATIRLATICI ---------------- */
function uyduHatirlatDegis(){
  UYDU_HATIRLAT.acik=!UYDU_HATIRLAT.acik;
  ayarYaz('ustad_uyduhatir', UYDU_HATIRLAT);
  durum('ayarlar', UYDU_HATIRLAT.acik?'🛰️ uydu geçiş hatırlatıcısı açık (10 dk önce haber verir)':'uydu hatırlatıcısı kapalı');
  return UYDU_HATIRLAT.acik?'hatırlatıcı AÇIK':'hatırlatıcı kapalı';
}
function uyduGecisKontrol(){
  if(!UYDU_HATIRLAT.acik) return;
  try{
    if(typeof uyduGecis!=='function' || typeof TLE_CACHE==='undefined') return;
    var tle=TLE_CACHE['iss']||TLE_CACHE['ISS'];
    if(!tle) return;
    var gecisler=uyduGecis(tle, 37.066, 37.383, 12*3600);
    if(!gecisler||!gecisler.length) return;
    var ilk=gecisler[0];
    var fark=(ilk.zaman-(UYDU_HATIRLAT.son?0:Date.now()))/60000;
    var dk=(ilk.zaman-Date.now())/60000;
    if(dk>0 && dk<=11 && UYDU_HATIRLAT.son!==String(ilk.zaman)){
      UYDU_HATIRLAT.son=String(ilk.zaman);
      ayarYaz('ustad_uyduhatir', UYDU_HATIRLAT);
      var metin='🛰️ ISS 10 dakika sonra geçecek · yükseklik '+Math.round(ilk.yukseklik||0)+'° · '+new Date(ilk.zaman).toLocaleTimeString('tr-TR');
      if(typeof alarmSeritGoster==='function') alarmSeritGoster('UYDU GEÇİŞİ', metin);
      if(typeof alarmYaz==='function') alarmYaz('UYDU GEÇİŞİ', metin);
      telegramGonder(metin);
    }
  }catch(e){}
}
setInterval(uyduGecisKontrol, 60000);

/* ---------------- 9) TELEFON DÜZENİ + QR ---------------- */
function telefonModu(){
  var ac=document.body.classList.toggle('telefonMod');
  durum('ayarlar', ac?'📱 telefon düzeni açık (büyük düğmeler, tek kolon)':'telefon düzeni kapalı');
  return ac?'telefon düzeni açık':'telefon düzeni kapalı';
}
function qrGoster(){
  var url='http://'+((window.location.hostname!=='localhost'&&window.location.hostname!=='')?window.location.hostname:'localhost')+':8878/index.html';
  var el=$('qrKutu');
  if(el) el.innerHTML='<div class="soluk">QR üretiliyor…</div>';
  var img=new Image();
  img.onload=function(){ if(el) el.innerHTML='<div class="nkSatir"><b>Adres:</b> '+esc(url)+'</div><img src="'+img.src+'" style="width:190px;height:190px;background:#fff;padding:6px;border-radius:6px">'; };
  img.onerror=function(){ if(el) el.innerHTML='<div class="uyari">QR servisi kapalı. Adres: '+esc(url)+' — telefonu aynı ağa bağla ve tarayıcıya bu adresi yaz.</div>'; };
  img.src='https://api.qrserver.com/v1/create-qr-code/?size=190x190&data='+encodeURIComponent(url);
}
function yerelSunucuBilgi(){
  return '<div class="uyari">Telefondan panele bakmak için: proje klasöründeki <b>USTAD-MONITOR-YEREL.bat</b> dosyasını çalıştır. '
   +'Panel <b>http://localhost:8878</b> (ve ev ağındaki IP) üzerinden açılır. Bu modda: sesli komut çalışır (mikrofon), '
   +'askerî uçaklar görünür (CORS serbest), QR ile telefondan bağlanabilirsin. Sunucu yalnızca kendi bilgisayarında çalışır.</div>';
}

/* ---------------- 10) AYARLAR PANELİ ---------------- */
function ayarlarPanel(){
  panelHazir('ayarlar');
  var el=$('sonuc_ayarlar'); if(!el) return;
  ayarOku();
  var h='';
  /* mod setlerim */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px">⭐ KENDİ MOD SETLERİM</h3>';
  if(MODLARIM.length){
    h+='<table class="tbl">';
    for(var i=0;i<MODLARIM.length;i++){
      var acik=0; for(var k in MODLARIM[i].katmanlar) if(MODLARIM[i].katmanlar[k]) acik++;
      h+='<tr><td class="k">'+esc(MODLARIM[i].ad)+'</td><td class="v">'+acik+' katman · '+esc(MODLARIM[i].tema||'-')+' · '+esc(MODLARIM[i].tarih||'')+'</td>'
        +'<td class="v"><button class="nkMini" onclick="modSetiYukle('+i+')">UYGULA</button> <button class="nkMini" onclick="modSetiSil('+i+')">SİL</button></td></tr>';
    }
    h+='</table>';
  } else h+='<div class="soluk" style="font-size:11px;margin-bottom:6px">Henüz kayıtlı mod setin yok. Katmanları seç, sonra buradan kaydet.</div>';
  h+='<div class="ortala"><button class="aracBtn" onclick="modSetiKaydet()">➕ ŞU ANKİ KATMANLARI KAYDET</button></div>';

  /* tema tasarımcısı */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">🎨 TEMA TASARIMCISI</h3>';
  h+='<table class="tbl">'
    +'<tr><td class="k">ana renk (neon)</td><td class="v"><input type="color" id="tz_ana" value="#00ff41"></td></tr>'
    +'<tr><td class="k">vurgu rengi</td><td class="v"><input type="color" id="tz_ana2" value="#7bffa1"></td></tr>'
    +'<tr><td class="k">kart zemini</td><td class="v"><input type="color" id="tz_kart" value="#00140a"></td></tr>'
    +'<tr><td class="k">atmosfer/derinlik</td><td class="v"><input type="color" id="tz_zemin" value="#003a12"></td></tr>'
    +'<tr><td class="k">yazı rengi</td><td class="v"><input type="color" id="tz_yazi" value="#c9ffd8"></td></tr>'
    +'</table><div class="ortala"><button class="aracBtn" onclick="temaTasarla()">🎨 TEMAYI UYGULA + KAYDET</button></div>';

  /* ses + gece + uydu */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">🔊 ALARM SESİ · 🌙 GECE NÖBETİ · 🛰️ UYDU HATIRLATICI</h3>';
  h+='<div class="aracSatir">';
  var sesler=[['bip','BİP'],['siren','SİREN'],['terminal','TERMİNAL'],['sessiz','SESSİZ']];
  for(var s=0;s<sesler.length;s++){
    h+='<button class="yerim'+(SES_TUR===sesler[s][0]?' aktif':'')+'" onclick="sesTurSec(\''+sesler[s][0]+'\')">'+sesler[s][1]+'</button>';
  }
  h+='<button class="yerim'+(GECE.acik?' aktif':'')+'" onclick="geceNobetiDegis();ayarlarPanel()">🌙 GECE NÖBETİ: '+(GECE.acik?'AÇIK':'KAPALI')+'</button>';
  h+='<button class="yerim'+(UYDU_HATIRLAT.acik?' aktif':'')+'" onclick="uyduHatirlatDegis();ayarlarPanel()">🛰️ UYDU HATIRLATICI: '+(UYDU_HATIRLAT.acik?'AÇIK':'KAPALI')+'</button>';
  h+='</div>';

  /* telegram */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">📨 TELEGRAM ALARMI (telefonuna anında düşer)</h3>';
  h+='<table class="tbl">'
    +'<tr><td class="k">bot token</td><td class="v"><input id="tg_token" class="giris" value="'+esc(TELEGRAM.token||'')+'" placeholder="123456:ABC-DEF…"></td></tr>'
    +'<tr><td class="k">sohbet kimliği</td><td class="v"><input id="tg_chat" class="giris" value="'+esc(TELEGRAM.chat||'')+'" placeholder="ör. 123456789"></td></tr>'
    +'<tr><td class="k">aktif</td><td class="v"><input type="checkbox" id="tg_acik" '+(TELEGRAM.acik?'checked':'')+'></td></tr>'
    +'</table>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="telegramKaydet();ayarlarPanel()">💾 KAYDET</button><button class="aracBtn" onclick="telegramTest()">📤 TEST MESAJI</button></div>';
  h+='<div class="uyari">Bot token ve sohbet kimliği yalnızca bu bilgisayarın tarayıcısında saklanır; Telegram dışında hiçbir yere gönderilmez. '
   +'Telegram\'da @BotFather ile bot aç, botuna bir mesaj yaz, sonra @userinfobot ile kendi kimliğini öğren.</div>';

  /* yedek + açılış */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">💾 YEDEKLEME · AÇILIŞ TERCİHİ</h3>';
  h+='<div class="aracSatir"><button class="aracBtn" onclick="ayarYedekle()">⬇️ AYARLARI YEDEKLE (JSON)</button>'
   +'<input type="file" id="yedekDosya" accept=".json" style="font-size:10px"><button class="aracBtn" onclick="ayarGeriYukleGirdi()">⬆️ GERİ YÜKLE</button></div>';
  var ac=null; try{ ac=JSON.parse(localStorage.getItem('ustad_acilis')||'null'); }catch(e){}
  var sekmeler=['harita','deprem','afet','tehdit','uzay','alarm','piyasa','haber','kaynaklar','ayarlar'];
  h+='<table class="tbl"><tr><td class="k">açılış sekmesi</td><td class="v"><select id="ac_sekme" class="giris">';
  for(var q=0;q<sekmeler.length;q++) h+='<option value="'+sekmeler[q]+'" '+((ac&&ac.sekme===sekmeler[q])?'selected':'')+'>'+sekmeler[q]+'</option>';
  h+='</select></td></tr>';
  var modlar=[['3d','3D küre'],['2d','2D harita'],['4d','4D sinema']];
  h+='<tr><td class="k">açılış modu</td><td class="v"><select id="ac_mod" class="giris">';
  for(var m2=0;m2<modlar.length;m2++) h+='<option value="'+modlar[m2][0]+'" '+((ac&&ac.mod===modlar[m2][0])?'selected':'')+'>'+modlar[m2][1]+'</option>';
  h+='</select></td></tr>';
  var temalar=document.querySelectorAll('.renkBtn[data-r]');
  h+='<tr><td class="k">açılış teması</td><td class="v"><select id="ac_tema" class="giris">';
  for(var t2=0;t2<temalar.length;t2++){
    var rr=temalar[t2].getAttribute('data-r');
    h+='<option value="'+rr+'" '+((ac&&ac.tema===rr || (!ac && document.body.getAttribute('data-renk')===rr))?'selected':'')+'>'+esc(temalar[t2].textContent)+'</option>';
  }
  h+='</select></td></tr></table><div class="ortala"><button class="aracBtn" onclick="acilisKaydet()">💾 AÇILIŞI KAYDET</button></div>';

  /* telefon */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">📱 TELEFON · QR · YEREL SUNUCU</h3>';
  h+=yerelSunucuBilgi();
  h+='<div class="aracSatir"><button class="aracBtn" onclick="telefonModu()">📱 TELEFON DÜZENİ</button><button class="aracBtn" onclick="qrGoster()">🔳 QR GÖSTER</button></div>';
  h+='<div id="qrKutu"></div>';

  /* grafikler */
  h+='<h3 class="soluk" style="font-size:12px;letter-spacing:1px;margin-top:18px">📈 KATMAN GRAFİKLERİ (saatlik örnekler)</h3>';
  h+=grafikCiz('g1','deprem','Deprem (M4.5+)','#facc15');
  h+=grafikCiz('g2','yangin','Açık doğal olay','#ff5a1f');
  h+=grafikCiz('g3','gemi','Gemi sayısı','#2dd4bf');
  h+=grafikCiz('g4','ucak','Uçak sayısı','#38bdf8');
  h+=grafikCiz('g5','feodo','Kötü şöhretli IP','#f43f5e');
  h+=grafikCiz('g6','uydu','Uydu sayısı','#c4b5fd');

  /* karşılaştırma */
  h+='<div id="cmpKutu" style="margin-top:14px"></div><div class="ortala"><button class="aracBtn" onclick="karsilastir()">📊 GEÇEN YIL İLE KARŞILAŞTIR (M4.5+)</button></div>';

  /* teşhis + sağlık + portlar */
  h+='<div id="teshisKutu" style="margin-top:18px"></div>';
  h+=kaynakSaglikHTML();
  h+=portlarHTML();
  h+='<div class="uyari">Tüm ayarlar yalnızca bu tarayıcıda saklanır. Yedek alman, bilgisayar değiştirirsen ayarlarını taşımanı sağlar.</div>';

  el.innerHTML=h;
  teshisYaz();
  durum('ayarlar','✔ ayarlar merkezi hazır');
}

/* ---------------- 11) ALARM ŞERİDİ + TELEGRAM KANCASI ---------------- */
if(typeof alarmSeritGoster!=='function'){
  window.alarmSeritGoster=function(tur, metin){
    var b=$('alarmSerit');
    if(!b){ b=document.createElement('div'); b.id='alarmSerit'; b.className='alarmSerit'; document.body.appendChild(b); }
    b.innerHTML='🔔 <b>'+esc(tur)+'</b> · '+esc(metin);
    b.style.display='block';
    clearTimeout(window.__seritZaman);
    window.__seritZaman=setTimeout(function(){ if(b) b.style.display='none'; }, 12000);
  };
}
if(typeof alarmYaz==='function'){
  var _eskiAlarmYaz=alarmYaz;
  alarmYaz=function(tur, metin){
    _eskiAlarmYaz(tur, metin);
    try{ telegramGonder('🔔 ÜSTAD MONİTÖR · '+tur+'\n'+metin+'\n'+new Date().toLocaleString('tr-TR')); }catch(e){}
  };
}

/* ---------------- başlat ---------------- */
setTimeout(function(){
  try{ ayarOku(); }catch(e){}
  try{ ozelTemalariGeriYukle(); }catch(e){}
  try{ acilisUygula(); }catch(e){}
  try{ if(GECE.acik){ document.body.classList.add('geceNobeti'); } }catch(e){}
  if(typeof ALARM!=='undefined'){ ALARM.sesTuru=SES_TUR; }
}, 2600);
