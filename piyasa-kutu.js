/* ============================================================
   ÜSTAD PİYASA KUTUSU (v1.1) — panelin sol tarafında renkli canlı piyasa
   · DÖVİZ: 19 para birimi — gerçek bayrak görselleriyle (flagcdn)
   · ALTIN: Gram · Çeyrek · Yarım · Tam · Cumhuriyet (ons $ × USDTRY)
   · Kaynak: open.er-api (kur, CORS açık) + gold-api.com (ons altın, USD)
   ============================================================ */

var PIYASA_DOVIZ=[
  {kod:'USD', ad:'DOLAR', bayrak:'us'},
  {kod:'EUR', ad:'EURO', bayrak:'eu'},
  {kod:'GBP', ad:'STERLİN', bayrak:'gb'},
  {kod:'CHF', ad:'FRANK', bayrak:'ch'},
  {kod:'JPY', ad:'YEN', bayrak:'jp'},
  {kod:'RUB', ad:'RUBLE', bayrak:'ru'},
  {kod:'SAR', ad:'RİYAL', bayrak:'sa'},
  {kod:'CNY', ad:'YUAN', bayrak:'cn'},
  {kod:'AZN', ad:'MANAT', bayrak:'az'},
  {kod:'CAD', ad:'KANADA DOLARI', bayrak:'ca'},
  {kod:'AUD', ad:'AVUSTRALYA DOLARI', bayrak:'au'},
  {kod:'SEK', ad:'İSVEÇ KRONU', bayrak:'se'},
  {kod:'NOK', ad:'NORVEÇ KRONU', bayrak:'no'},
  {kod:'DKK', ad:'DANİMARKA KRONU', bayrak:'dk'},
  {kod:'KWD', ad:'KUVEYT DİNARI', bayrak:'kw'},
  {kod:'AED', ad:'BAE DİRHEMİ', bayrak:'ae'},
  {kod:'QAR', ad:'KATAR RİYALİ', bayrak:'qa'},
  {kod:'UAH', ad:'UKRAYNA GRİVNASI', bayrak:'ua'},
  {kod:'GEL', ad:'GÜRCİSTAN LARİ', bayrak:'ge'},
  {kod:'INR', ad:'HİNDİSTAN RUPİSİ', bayrak:'in'},
  {kod:'PKR', ad:'PAKİSTAN RUPİSİ', bayrak:'pk'},
  {kod:'IQD', ad:'IRAK DİNARI', bayrak:'iq'},
  {kod:'IRR', ad:'İRAN RİYALİ', bayrak:'ir'},
  {kod:'EGP', ad:'MISIR LİRASI', bayrak:'eg'},
  {kod:'BGN', ad:'BULGAR LEVASI', bayrak:'bg'},
  {kod:'RON', ad:'ROMANYA LEYİ', bayrak:'ro'},
  {kod:'HUF', ad:'MACAR FORİNTİ', bayrak:'hu'},
  {kod:'PLN', ad:'POLONYA ZLOTİSİ', bayrak:'pl'},
  {kod:'CZK', ad:'ÇEK KORUNASI', bayrak:'cz'},
  {kod:'KRW', ad:'GÜNEY KORE WONU', bayrak:'kr'},
  {kod:'KZT', ad:'KAZAKİSTAN TENGESİ', bayrak:'kz'},
  {kod:'UZS', ad:'ÖZBEKİSTAN SOMU', bayrak:'uz'}
];

function piyasaHtml(){
  return '<div class="piBaslik">'
    +'<span class="piLogo">💱</span>'
    +'<span class="piAd">CANLI PİYASA<small>DÖVİZ · ALTIN</small></span>'
    +'<span class="piCanli" id="piCanli"><i></i>CANLI</span>'
    +'</div>'
    +'<div class="piGovde" id="piGovde"><div class="soluk" style="padding:12px 10px">piyasa verileri yükleniyor…</div></div>'
    +'<div class="piDip">💾 open.er-api (kur) · gold-api.com (ons altın) — 60 sn\'de bir tazelenir.</div>';
}

function piyasaKur(){
  var alan=$('piyasaKutu'); if(!alan) return;
  if(alan.getAttribute('kuruldu')!=='1'){
    alan.innerHTML=piyasaHtml();
    alan.setAttribute('kuruldu','1');
  }
  piyasaVeriYukle();
}

function piyasaVeriYukle(){
  var isler=[];
  if(!K2.kur && typeof kurYukle==='function') isler.push(kurYukle());
  if(!K2.piyasa && typeof altinYukle==='function') isler.push(altinYukle());
  var bitti=function(){ piyasaCiz(); };
  if(isler.length){ Promise.all(isler.map(function(x){ return x.catch(function(){ return null; }); })).then(bitti); }
  else bitti();
}

function piyasaDovizDeger(kod){
  if(kod==='USD') return K2.usdTry;
  var k=K2.kur||[];
  for(var i=0;i<k.length;i++) if(k[i].kod===kod) return k[i].try_;
  return null;
}

function piyasaCiz(){
  var g=$('piGovde'); if(!g) return;
  var h='';
  /* --- DÖVİZ --- */
  h+='<div class="piBolum">🇹🇷 DÖVİZ KURLARI (TL)</div>';
  var bulunan=0;
  for(var i=0;i<PIYASA_DOVIZ.length;i++){
    var d=PIYASA_DOVIZ[i], v=piyasaDovizDeger(d.kod);
    if(v==null) continue;
    bulunan++;
    var sayi=(d.kod==='JPY') ? (Number(v)*100).toFixed(2) : Number(v).toFixed(4);
    h+='<div class="piKurSatir">'
      +'<img class="piBayrak" src="https://flagcdn.com/w40/'+d.bayrak+'.png" alt="'+d.kod+'" title="'+esc(d.ad)+'">'
      +'<span class="piKod">'+d.kod+'</span>'
      +'<span class="piDeger">'+sayi+(d.kod==='JPY'?' <i style="font-size:7px;opacity:.6">(100)</i>':'')+'</span>'
      +'</div>';
  }
  if(!bulunan) h+='<div class="soluk" style="padding:4px 10px">kur çekilemedi…</div>';
  /* --- ALTIN --- */
  h+='<div class="piBolum">🥇 ALTIN (TL)</div>';
  var ons=(K2.piyasa && K2.piyasa.altin) ? Number(K2.piyasa.altin) : null;
  var usdtry=K2.usdTry;
  if(ons && usdtry){
    var gram=ons*usdtry/31.1034768;
    var altinlar=[
      {ad:'GRAM', d:gram, b:'/gr'},
      {ad:'ÇEYREK', d:gram*1.754, b:''},
      {ad:'YARIM', d:gram*3.508, b:''},
      {ad:'TAM', d:gram*7.016, b:''},
      {ad:'CUMHURİYET', d:gram*7.216, b:''},
      {ad:'22 AYAR BİLEZİK', d:gram*0.916, b:'/gr'},
      {ad:'GREMSE (10 GR)', d:gram*10, b:''}
    ];
    for(var a=0;a<altinlar.length;a++){
      h+='<div class="piAltinSatir">'
        +'<span class="piAltinAd">🪙 '+altinlar[a].ad+'</span>'
        +'<span class="piAltinDeger">₺'+altinlar[a].d.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+altinlar[a].b+'</span>'
        +'</div>';
    }
  } else {
    h+='<div class="soluk" style="padding:4px 10px">altın verisi bekleniyor…</div>';
  }
  g.innerHTML=h;
  var canli=$('piCanli');
  if(canli){ canli.className='piCanli'+(bulunan?' yayinda':' bekliyor'); }
}

/* 60 saniyede bir canlı tazele (yalnız harita sekmesi açıkken) */
setInterval(function(){
  try{
    if(typeof AKTIF==='undefined' || AKTIF!=='harita') return;
    var a=$('piyasaKutu'); if(!a || a.getAttribute('kuruldu')!=='1') return;
    var isler=[];
    if(typeof kurYukle==='function') isler.push(kurYukle().catch(function(){ return null; }));
    if(typeof altinYukle==='function') isler.push(altinYukle().catch(function(){ return null; }));
    Promise.all(isler).then(function(){ piyasaCiz(); });
  }catch(e){}
}, 60000);
