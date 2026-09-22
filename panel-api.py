# ============================================================
#  USTAD DUNYA MONITORU — PANEL API + YEREL SUNUCU
#  Panel klasorunu yayinlar ve /durum.json adresinde
#  canli ozet veri sunar. Anahtarsiz, hesapsiz, yerel.
#  Kullanim: USTAD-PANEL-API.bat  veya  python panel-api.py
# ============================================================
import json, ssl, urllib.request, os, datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

KOK = os.path.dirname(os.path.abspath(__file__))
PORT = 8890
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'UstadMonitor/1.0 (kisisel)'}


def cek(url, t=20):
    try:
        r = urllib.request.Request(url, headers=UA)
        return json.loads(urllib.request.urlopen(r, timeout=t, context=CTX).read().decode('utf-8', 'replace'))
    except Exception:
        return None


def durum():
    o = {'zaman': datetime.datetime.now().isoformat(timespec='seconds'), 'kaynak': 'USTAD DUNYA MONITORU'}
    d = cek('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
    if d:
        o['deprem_24s'] = d.get('metadata', {}).get('count')
        o['en_buyuk'] = max([f['properties']['mag'] or 0 for f in d.get('features', [])] or [0])
        o['son_depremler'] = [{'mag': f['properties']['mag'], 'yer': f['properties']['place'],
                               't': f['properties']['time']} for f in d.get('features', [])[:8]]
    g = cek('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR&alertlevel=Orange;Red')
    if g:
        o['afet_sayisi'] = len(g.get('features') or [])
    k = cek('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    if k:
        try:
            son = k[-1]
            o['kp'] = son.get('Kp') if isinstance(son, dict) else son[1]
        except Exception:
            pass
    kur = cek('https://open.er-api.com/v6/latest/USD')
    if kur and kur.get('rates'):
        o['usd_try'] = kur['rates'].get('TRY')
    altin = cek('https://api.gold-api.com/price/XAU')
    if altin:
        o['altin_ons_usd'] = altin.get('price')
    if o.get('altin_ons_usd') and o.get('usd_try'):
        o['gram_altin_try'] = round(o['altin_ons_usd'] / 31.1035 * o['usd_try'])
    fng = cek('https://api.alternative.me/fng/')
    if fng and fng.get('data'):
        o['korku_endeksi'] = fng['data'][0].get('value')
    # basit durum skoru
    puan = 0
    puan += min(100, (o.get('deprem_24s') or 0) * 3) * 1.3
    puan += min(100, (o.get('afet_sayisi') or 0) * 4) * 1.2
    puan += min(100, float(o.get('kp') or 0) * 11) * 0.9
    o['durum_skoru'] = int(puan / 3.4) if puan else 0
    return o


class Isleyici(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=KOK, **k)

    def do_GET(self):
        if self.path.startswith('/durum.json'):
            try:
                veri = json.dumps(durum(), ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(veri)
                print('  [durum.json] servis edildi')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return
        return super().do_GET()

    def log_message(self, *a):
        pass


def main():
    print('=' * 60)
    print('  USTAD DUNYA MONITORU - PANEL API + YEREL SUNUCU')
    print('=' * 60)
    print('  Panel       : http://localhost:%d/index.html' % PORT)
    print('  Ozet veri   : http://localhost:%d/durum.json' % PORT)
    print('  Sesli komut, askeri ucaklar ve Hue bu modda CALISIR.')
    print('  Kapatmak icin bu pencereyi kapatin (Ctrl+C).')
    print('=' * 60)
    print('  Diger uygulamalarin (USTAD PIYASA, GAZETE, TV) bu adresten')
    print('  veri cekebilir:  http://<bu-bilgisayarin-IP>:%d/durum.json' % PORT)
    print()
    ThreadingHTTPServer(('0.0.0.0', PORT), Isleyici).serve_forever()


if __name__ == '__main__':
    main()
