
/* ============================================================
   ÜSTAD DÜNYA MONİTÖRÜ — EK VERİ KÜMESİ (v5.1)
   Deniz platformları · gaz sahaları · havalimanları · ülke merkezleri ·
   Türkiye fay hatları (yaklaşık)
   ============================================================ */

/* --- DENİZ ÜSTÜ PETROL/GAZ PLATFORMLARI + AÇIK DENİZ SAHALARI --- */
var VERI_PLATFORM=[
[27.70,-90.30,'Mississippi Kanyonu · Meksika Körfezi (ABD)'],
[29.30,-94.72,'Galveston açıkları · ABD'],
[28.20,-87.80,'Macondo / Thunder Horse · ABD'],
[56.00,3.00,'Forties / Brent sahası · Kuzey Denizi'],
[60.30,2.20,'Troll A · Norveç'],
[59.90,1.60,'Ekofisk · Norveç'],
[61.20,1.20,'Statfjord · Norveç'],
[57.00,2.00,'Ekofisk güney · Kuzey Denizi'],
[24.30,53.30,'Zakum açık deniz · BAE'],
[25.20,54.00,'Umm Shaif · BAE'],
[26.60,52.00,'Bahreyn açık deniz · Bahreyn'],
[28.90,49.80,'Safaniya açık deniz · Suudi Arabistan'],
[19.60,70.70,'Mumbai High · Hindistan'],
[-6.00,10.00,'Azurite / Angola açık deniz'],
[-1.00,8.50,'Bonga · Nijerya'],
[4.00,7.00,'Bonga güney · Nijerya'],
[3.80,8.20,'Agbami · Nijerya'],
[-22.00,-40.00,'Campos Havzası · Brezilya'],
[-24.00,-43.00,'Santos Havzası öncesi · Brezilya'],
[-27.00,-48.00,'Bacia de Santos · Brezilya'],
[1.30,104.30,'Kuzey Natuna · Endonezya'],
[6.10,102.30,'Malezya açık deniz (Terengganu)'],
[8.50,108.50,'Cuu Long · Vietnam'],
[38.80,118.30,'Bohai Körfezi · Çin'],
[20.00,115.00,'Güney Çin Denizi · kıta sahanlığı'],
[-38.00,148.00,'Gippsland · Avustralya'],
[-20.00,113.00,'Kuzey Batı Sahanlığı · Avustralya'],
[60.50,-1.50,'Shetland batısı · İngiltere'],
[53.50,2.00,'Güney Kuzey Denizi gaz · İngiltere'],
[43.00,32.00,'Karadeniz (Romanya) Neptun Derin'],
[41.20,31.40,'Karadeniz (Türkiye) Sakarya gaz sahası'],
[44.50,37.00,'Karadeniz (Rusya) açık deniz']
];

/* --- BÜYÜK DOĞALGAZ SAHALARI (karada) --- */
var VERI_GAZ=[
[25.90,51.60,'Kuzey Katar / North Field (dünyanın en büyüğü)'],
[28.00,52.00,'Güney Pars · İran/Katar'],
[62.90,74.00,'Urengoy · Rusya'],
[65.90,78.20,'Yamburg · Rusya'],
[62.00,76.50,'Medvezhye · Rusya'],
[66.80,70.00,'Bovanenkovo · Rusya'],
[51.50,76.00,'Astrahanskoye · Rusya'],
[55.00,58.00,'Karaçaganak · Kazakistan'],
[45.00,52.00,'Kashagan · Kazakistan'],
[39.00,58.00,'Galkynış · Türkmenistan'],
[38.00,64.00,'Malay sahası · Türkmenistan'],
[31.30,34.70,'Leviathan · İsrail'],
[33.00,32.00,'Zohr · Mısır'],
[-3.00,104.00,'Arun · Endonezya'],
[2.00,112.00,'Sarawak · Malezya'],
[27.00,109.00,'Çin güney gaz bölgesi'],
[35.00,-100.00,'Permiyen Havzası · ABD (kaya gazı)'],
[33.00,-96.00,'Barnett · ABD'],
[40.00,-80.00,'Marcellus · ABD'],
[53.00,-2.50,'İrlanda Denizi gaz sahası'],
[41.20,31.40,'Sakarya · Türkiye (Karadeniz gazı)'],
[42.00,27.00,'Trakya gaz sahaları · Türkiye']
];

/* --- BÜYÜK HAVALİMANLARI (yolcu/kargo trafiği) --- */
var VERI_HAVALIMANI=[
[33.94,-118.41,'Los Angeles (LAX)'], [40.64,-73.78,'New York JFK'],
[40.08,-74.17,'Newark (EWR)'], [41.98,-87.90,'Chicago ORD'],
[33.64,-84.43,'Atlanta ATL'], [32.90,-97.04,'Dallas DFW'],
[37.62,-122.38,'San Francisco SFO'], [47.45,-122.31,'Seattle SEA'],
[25.79,-80.29,'Miami MIA'], [51.47,-0.45,'Londra Heathrow'],
[51.15,0.19,'Gatwick'], [49.01,2.55,'Paris CDG'],
[50.04,8.56,'Frankfurt FRA'], [48.35,11.79,'Münih MUC'],
[52.31,4.76,'Amsterdam AMS'], [50.90,4.48,'Brüksel BRU'],
[41.30,2.08,'Barselona BCN'], [40.47,-3.56,'Madrid MAD'],
[41.80,12.25,'Roma FCO'], [45.63,8.72,'Milano MXP'],
[47.46,8.55,'Zürih ZRH'], [48.11,16.57,'Viyana VIE'],
[55.62,12.65,'Kopenhag CPH'], [59.65,17.92,'Stockholm ARN'],
[60.19,24.96,'Helsinki HEL'], [59.88,10.90,'Oslo OSL'],
[55.97,37.41,'Moskova Şeremetyevo'], [50.34,30.89,'Kiev Boryspil'],
[41.26,28.74,'İstanbul Havalimanı'], [40.90,29.31,'Sabiha Gökçen'],
[38.29,27.16,'İzmir Adnan Menderes'], [39.95,32.69,'Ankara Esenboğa'],
[36.90,30.79,'Antalya'], [37.00,35.42,'Adana Şakirpaşa'],
[40.13,26.43,'Çanakkale'], [41.26,41.28,'Batum'],
[40.47,50.05,'Bakü Heydar Aliyev'], [38.76,48.81,'Lenkeran'],
[37.00,55.00,'Türkmenbaşı'], [35.21,51.15,'Tahran İmam Humeyni'],
[25.27,55.36,'Dubai DXB'], [24.43,54.65,'Abu Dabi AUH'],
[25.61,55.94,'Şarja'], [29.23,47.98,'Kuveyt'],
[24.96,46.70,'Riyad'], [21.68,39.16,'Cidde'],
[26.27,50.63,'Bahreyn'], [23.59,58.28,'Maskat'],
[30.12,31.41,'Kahire'], [31.72,35.99,'Amman'],
[33.82,35.49,'Beyrut'], [35.50,35.80,'Lazkiye'],
[19.09,72.87,'Mumbai'], [28.55,77.10,'Delhi'],
[13.00,77.71,'Bangalore'], [22.65,88.45,'Kolkata'],
[1.36,103.99,'Singapur Changi'], [3.13,101.55,'Kuala Lumpur'],
[13.69,100.75,'Bangkok Suvarnabhumi'], [21.22,105.80,'Hanoi'],
[10.82,106.66,'Ho Chi Minh'], [14.51,121.02,'Manila'],
[-6.13,106.66,'Jakarta'], [22.31,113.91,'Hong Kong'],
[25.08,121.23,'Taipei Taoyuan'], [35.55,139.78,'Tokyo Haneda'],
[35.76,140.39,'Narita'], [34.43,135.23,'Osaka Kansai'],
[37.46,126.44,'Seul Incheon'], [31.14,121.81,'Şanghay Pudong'],
[40.08,116.58,'Pekin Capital'], [23.39,113.30,'Guangzhou'],
[22.64,113.81,'Shenzhen'], [-33.94,151.18,'Sydney'],
[-37.67,144.84,'Melbourne'], [-27.38,153.12,'Brisbane'],
[-36.85,174.79,'Auckland'], [-23.43,-46.47,'São Paulo GRU'],
[-22.81,-43.25,'Rio Galeão'], [-34.82,-58.54,'Buenos Aires Ezeiza'],
[-33.39,-70.79,'Santiago'], [-12.02,-77.11,'Lima'],
[4.70,-74.15,'Bogota'], [19.44,-99.07,'Mexico City'],
[-26.14,28.25,'Johannesburg'], [-33.97,18.60,'Cape Town'],
[-1.32,36.93,'Nairobi'], [5.60,-0.17,'Accra'],
[6.58,3.32,'Lagos'], [30.11,31.41,'Kahire (yeni)'],
[24.90,67.16,'Karaçi'], [33.62,73.10,'İslamabad'],
[23.84,90.40,'Dakka'], [34.55,69.21,'Kabil']
];

/* --- ÜLKE / BÖLGE MERKEZ KOORDİNATLARI (kod -> enlem, boylam) --- */
var VERI_ULKE_MERKEZ={
 US:[39.8,-98.6], CA:[56.1,-106.3], MX:[23.6,-102.5], BR:[-14.2,-51.9], AR:[-38.4,-63.6],
 CL:[-35.7,-71.5], CO:[4.6,-74.3], PE:[-9.2,-75.0], VE:[6.4,-66.6], EC:[-1.8,-78.2],
 BO:[-16.3,-63.6], PY:[-23.4,-58.4], UY:[-32.5,-55.8], CU:[21.5,-77.8], DO:[18.7,-70.2],
 GT:[15.8,-90.2], HN:[15.2,-86.2], SV:[13.8,-88.9], NI:[12.9,-85.2], CR:[9.7,-83.8],
 PA:[8.5,-80.8], JM:[18.1,-77.3], HT:[18.9,-72.3], GB:[54.0,-2.0], IE:[53.4,-8.2],
 FR:[46.6,2.5], DE:[51.2,10.4], IT:[41.9,12.6], ES:[40.5,-3.7], PT:[39.4,-8.2],
 NL:[52.1,5.3], BE:[50.5,4.5], CH:[46.8,8.2], AT:[47.5,14.6], PL:[51.9,19.1],
 CZ:[49.8,15.5], SK:[48.7,19.7], HU:[47.2,19.5], RO:[45.9,25.0], BG:[42.7,25.5],
 GR:[39.1,21.8], HR:[45.1,15.2], RS:[44.0,21.0], BA:[43.9,17.7], SI:[46.2,15.0],
 SE:[60.1,18.6], NO:[60.5,8.5], FI:[61.9,25.7], DK:[56.3,9.5], IS:[64.9,-19.0],
 EE:[58.6,25.0], LV:[56.9,24.6], LT:[55.2,23.9], UA:[48.4,31.2], BY:[53.7,27.9],
 RU:[61.5,105.3], MD:[47.4,28.4], TR:[39.0,35.2], GE:[42.3,43.4], AM:[40.1,45.0],
 AZ:[40.1,47.6], KZ:[48.0,66.9], UZ:[41.4,64.6], TM:[38.97,59.6], KG:[41.2,74.8],
 TJ:[38.9,71.3], CN:[35.9,104.2], JP:[36.2,138.3], KR:[35.9,127.8], KP:[40.3,127.5],
 TW:[23.7,121.0], HK:[22.4,114.1], MN:[46.9,103.8], IN:[20.6,79.0], PK:[30.4,69.3],
 BD:[23.7,90.4], LK:[7.9,80.8], NP:[28.4,84.1], AF:[33.9,67.7], IR:[32.4,53.7],
 IQ:[33.2,43.7], SY:[34.8,39.0], LB:[33.9,35.9], IL:[31.0,34.8], JO:[31.3,36.5],
 SA:[23.9,45.1], AE:[23.4,53.8], QA:[25.3,51.2], KW:[29.3,47.5], OM:[21.5,55.9],
 BH:[26.0,50.6], YE:[15.6,48.0], EG:[26.8,30.8], LY:[26.3,17.2], TN:[33.9,9.6],
 DZ:[28.0,1.7], MA:[31.8,-7.1], SD:[15.6,32.5], SS:[7.3,30.0], ET:[9.1,40.5],
 KE:[0.2,37.9], TZ:[-6.4,34.9], UG:[1.4,32.3], NG:[9.1,8.7], GH:[7.9,-1.0],
 CI:[7.5,-5.5], SN:[14.5,-14.5], ML:[17.6,-4.0], BF:[12.2,-1.6], NE:[17.6,8.1],
 TD:[15.5,18.7], CM:[7.4,12.4], CD:[-2.9,23.7], CG:[-0.2,15.8], AO:[-11.2,17.9],
 ZA:[-30.6,22.9], ZW:[-19.0,29.2], ZM:[-13.1,27.8], MZ:[-18.7,35.5], MW:[-13.3,34.3],
 BW:[-22.3,24.7], NA:[-22.9,18.5], MG:[-18.8,46.9], SO:[5.2,46.2], AU:[-25.3,133.8],
 NZ:[-41.0,174.9], PG:[-6.3,143.9], ID:[-0.8,113.9], MY:[4.2,101.9], SG:[1.35,103.8],
 TH:[15.1,101.0], VN:[14.1,108.3], PH:[12.9,121.8], KH:[12.6,105.0], MM:[21.9,95.9]
};

/* --- TÜRKİYE FAY HATLARI (yaklaşık güzergâh · MTA/AFAD bilinen hatları) --- */
var VERI_FAY=[
/* Kuzey Anadolu Fayı (doğudan batıya) */
[[39.30,41.20],[39.60,40.20],[40.10,39.00],[40.60,37.80],[40.90,36.60],[41.00,35.30],[41.20,34.00],[40.80,32.80],[40.60,31.60],[40.70,30.40],[40.60,29.00],[40.70,27.80],[40.60,26.70],'Kuzey Anadolu Fayı (KAF)'],
/* Doğu Anadolu Fayı (Karlıova → Hatay) */
[[39.30,41.20],[38.80,40.20],[38.40,39.20],[38.10,38.20],[37.70,37.30],[37.30,36.60],[36.90,36.20],[36.50,36.10],'Doğu Anadolu Fayı (DAF)'],
/* Ölü Deniz Fayı (Türkiye uzantısı) */
[[36.50,36.10],[36.20,36.20],[35.90,36.30],[35.60,36.20],'Ölü Deniz Fayı uzantısı'],
/* Batı Anadolu grabenler */
[[39.60,27.00],[39.00,27.60],[38.60,28.20],[38.20,28.80],'Gediz Grabeni'],
[[38.30,27.10],[37.90,27.60],[37.50,28.10],[37.10,28.60],'Büyük Menderes Grabeni'],
[[37.60,29.00],[37.20,29.60],[36.80,30.10],[36.30,30.50],'Burdur-Fethiye Fay Zonu'],
[[40.30,26.20],[40.20,27.20],[40.10,28.20],[40.30,29.20],'Ganos / Marmara segmenti'],
/* Doğu Anadolu sıkışma zonları */
[[38.70,39.20],[38.40,40.00],[38.20,40.80],[38.00,41.60],'Bitlis-Zagros Kenet Zonu'],
[[39.10,43.50],[38.60,43.20],[38.10,43.00],'Van Gölü doğusu fayları'],
/* Ege denizi açıkları */
[[38.80,25.80],[38.40,25.90],[38.00,26.20],[37.60,26.50],'Sisam-İzmir açıkları fayı']
];
