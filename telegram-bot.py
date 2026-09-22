# ============================================================
#  USTAD DUNYA MONITORU — TELEGRAM BOT
#  Telefondan panele komut: /durum /deprem /siber /uzay /skor /kur /altin /radyo /link
#  Ayarlar: bot-ayar.txt (token + sohbet kimligi) — yalnizca bu bilgisayarda kalir.
#  Kullanim: USTAD-TELEGRAM-BOT.bat
# ============================================================
import json, ssl, time, os, urllib.request, urllib.parse, datetime

KOK = os.path.dirname(os.path.abspath(__file__))
AYAR = os.path.join(KOK, 'bot-ayar.txt')
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'UstadMonitor/1.0 (kisisel)'}


def ayar():
    if not os.path.exists(AYAR):
        with open(AYAR, 'w', encoding='utf-8') as f:
            f.write('# USTAD MONITOR - Telegram bot ayarlari\n'
                    '# 1) Telegram\'da @BotFather -> /newbot -> bot olustur, TOKEN al\n'
                    '# 2) Botuna bir mesaj yaz, sonra @userinfobot ile kendi ID\'ni ogren\n'
                    'token = \n'
                    'sohbet = \n')
        print('  [!] bot-ayar.txt olusturuldu. Token ve sohbet kimligini yazip tekrar calistir.')
        return None
    a = {}
    for s in open(AYAR, encoding='utf-8'):
        s = s.strip()
        if s and not s.startswith('#') and '=' in s:
            k, v = s.split('=', 1)
            a[k.strip()] = v.split('#')[0].strip()
    if not a.get('token') or not a.get('sohbet'):
        print('  [!] bot-ayar.txt icinde token ve sohbet bos.')
        return None
    return a


def cek(url, t=20):
    try:
        r = urllib.request.Request(url, headers=UA)
        return json.loads(urllib.request.urlopen(r, timeout=t, context=CTX).read().decode('utf-8', 'replace'))
    except Exception:
        return None


def tg(token, metot, veri=None):
    u = 'https://api.telegram.org/bot%s/%s' % (token, metot)
    if veri:
        u += '?' + urllib.parse.urlencode(veri)
    return cek(u, 25)


def deprem_metni():
    d = cek('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
    if not d:
        return 'Deprem verisi alınamadı.'
    o = ['🌍 SON 24 SAAT · M4.5+ (' + str(d['metadata']['count']) + ' kayıt)']
    for f in d['features'][:10]:
        p = f['properties']
        o.append('M%s · %s · %s' % (p['mag'], p['place'], datetime.datetime.fromtimestamp(p['time'] / 1000).strftime('%d.%m %H:%M')))
    return '\n'.join(o)


def durum_metni():
    o = ['📡 ÜSTAD DÜNYA MONİTÖRÜ · ' + datetime.datetime.now().strftime('%d.%m.%Y %H:%M')]
    d = cek('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
    if d:
        o.append('• Deprem (24s, M4.5+): ' + str(d['metadata']['count']))
    g = cek('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR&alertlevel=Orange;Red')
    if g:
        o.append('• GDACS uyarı: ' + str(len(g.get('features') or [])))
    k = cek('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    if k:
        try:
            son = k[-1]
            kp = son.get('Kp') if isinstance(son, dict) else son[1]
            o.append('• Kp indeksi: ' + str(kp))
        except Exception:
            pass
    kur = cek('https://open.er-api.com/v6/latest/USD')
    if kur and kur.get('rates', {}).get('TRY'):
        o.append('• USD/TRY: ' + str(round(kur['rates']['TRY'], 2)))
    a = cek('https://api.gold-api.com/price/XAU')
    if a:
        o.append('• Altın ons: $' + str(round(a.get('price', 0), 2)))
    f = cek('https://api.alternative.me/fng/')
    if f and f.get('data'):
        o.append('• Korku endeksi: ' + str(f['data'][0].get('value')))
    return '\n'.join(o)


def siber_metni():
    o = ['🛡 SİBER DURUM']
    k = cek('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', 30)
    if k:
        z = k.get('vulnerabilities', [])
        o.append('• CISA KEV (aktif sömürülen zafiyet): ' + str(k.get('count', len(z))))
        for v in z[-4:]:
            o.append('   - %s · %s' % (v.get('cveID'), v.get('vulnerabilityName', '')[:60]))
    g = cek('https://api.github.com/advisories?per_page=5&sort=published&direction=desc', 25)
    if g:
        o.append('• GitHub Advisory (yeni):')
        for a in g[:5]:
            o.append('   - %s %s' % (a.get('ghsa_id'), (a.get('summary') or '')[:64]))
    return '\n'.join(o)


def skor_metni():
    o = []
    d = cek('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
    say = d['metadata']['count'] if d else 0
    g = cek('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR&alertlevel=Orange;Red')
    afet = len(g.get('features') or []) if g else 0
    k = cek('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    kp = 0
    if k:
        try:
            son = k[-1]
            kp = float(son.get('Kp') if isinstance(son, dict) else son[1])
        except Exception:
            pass
    puan = int((min(100, say * 3) * 1.3 + min(100, afet * 4) * 1.2 + min(100, kp * 11) * 0.9) / 3.4)
    etiket = 'DURGUN' if puan < 15 else ('SAKİN' if puan < 30 else ('NORMAL' if puan < 50 else ('HAREKETLİ' if puan < 75 else 'ÇOK HAREKETLİ')))
    o.append('📊 DÜNYA DURUM SKORU: %d / 100 · %s' % (puan, etiket))
    o.append('• Deprem (24s M4.5+): %d' % say)
    o.append('• Afet uyarısı (turuncu/kırmızı): %d' % afet)
    o.append('• Kp: %s' % kp)
    return '\n'.join(o)


def cevapla(metin):
    m = metin.strip().lower()
    if m.startswith('/start') or m.startswith('/help') or m.startswith('/yardim'):
        return ('🤖 ÜSTAD DÜNYA MONİTÖRÜ BOT\n\nKomutlar:\n'
                '/durum — genel özet\n/deprem — son 24 saat M4.5+\n/siber — CISA KEV + GitHub Advisory\n'
                '/uzay — uzay havası ve uyarılar\n/skor — dünya durum skoru\n/kur — döviz\n/altin — altın ons\n/link — panel adresi')
    if m.startswith('/durum'):
        return durum_metni()
    if m.startswith('/deprem'):
        return deprem_metni()
    if m.startswith('/siber'):
        return siber_metni()
    if m.startswith('/skor'):
        return skor_metni()
    if m.startswith('/kur'):
        k = cek('https://open.er-api.com/v6/latest/USD')
        if not k:
            return 'Kur verisi alınamadı.'
        r = k.get('rates', {})
        return ('💱 KURLAR (USD bazlı)\n' + '\n'.join(['%s: %s' % (x, round(r.get('TRY', 0) / r[x], 4)) for x in ['EUR', 'GBP', 'CHF', 'JPY'] if x in r])
                + '\nUSD/TRY: ' + str(round(r.get('TRY', 0), 3)))
    if m.startswith('/altin'):
        a = cek('https://api.gold-api.com/price/XAU')
        g = cek('https://api.gold-api.com/price/XAG')
        if not a:
            return 'Altın verisi alınamadı.'
        s = '🥇 Altın ons: $' + str(round(a.get('price', 0), 2))
        if g:
            s += '\n🥈 Gümüş ons: $' + str(round(g.get('price', 0), 3))
        return s
    if m.startswith('/uzay'):
        u = cek('https://services.swpc.noaa.gov/products/alerts.json')
        if not u:
            return 'Uzay havası verisi alınamadı.'
        o = ['📡 UZAY HAVASI UYARILARI (son ' + str(min(3, len(u))) + ')']
        for x in u[:3]:
            o.append('• ' + x.get('product_id', '') + ': ' + ' '.join(str(x.get('message', '')).split())[:180])
        return '\n'.join(o)
    if m.startswith('/link'):
        return 'Panel: http://localhost:8890/index.html (panel-api.py çalışıyorsa)\nPanel klasörü: ' + KOK
    return 'Komutu anlamadım. /help yaz.'


def main():
    a = ayar()
    if not a:
        return
    token, sohbet = a['token'], a['sohbet']
    print('=' * 58)
    print('  USTAD DUNYA MONITORU - TELEGRAM BOT')
    print('=' * 58)
    print('  Bot dinliyor… Telefondan /help yaz. Kapatmak icin Ctrl+C.')
    ofset = None
    while True:
        try:
            veri = {'timeout': 25}
            if ofset:
                veri['offset'] = ofset
            r = tg(token, 'getUpdates', veri)
            if r and r.get('ok'):
                for g in r['result']:
                    ofset = g['update_id'] + 1
                    msg = g.get('message') or {}
                    sohbet_id = (msg.get('chat') or {}).get('id')
                    metin = msg.get('text') or ''
                    if sohbet_id and metin:
                        cevap = cevapla(metin)
                        tg(token, 'sendMessage', {'chat_id': sohbet_id, 'text': cevap[:3900]})
                        print('  [>>] %s -> %s' % (metin[:40], cevap[:50].replace('\n', ' ')))
        except KeyboardInterrupt:
            print('\n  Bot kapatildi.')
            return
        except Exception as e:
            print('  [!] hata: %s' % str(e)[:80])
            time.sleep(5)


if __name__ == '__main__':
    main()
