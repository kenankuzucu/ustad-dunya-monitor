# ============================================================
#  USTAD DUNYA MONITORU - GUNLUK BULTEN E-POSTA GONDERIMI
#  Ayarlari mail-ayar.txt dosyasindan okur. Bilgiler SADECE bu
#  bilgisayarda kalir; hicbir yere gonderilmez (SMTP disinda).
#  Kullanim:  USTAD-BULTEN-MAIL.bat   veya  python mail-gonder.py
# ============================================================
import os, ssl, json, smtplib, urllib.request, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

KOK = os.path.dirname(os.path.abspath(__file__))
AYAR_DOSYA = os.path.join(KOK, 'mail-ayar.txt')
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def ayar_oku():
    if not os.path.exists(AYAR_DOSYA):
        print('  [!] mail-ayar.txt bulunamadi. Ornek dosya olusturuluyor...')
        with open(AYAR_DOSYA, 'w', encoding='utf-8') as f:
            f.write(
                '# USTAD MONITOR - e-posta ayarlari\n'
                '# Doldur ve kaydet. Bu dosya bilgisayarinda kalir, panele yuklenmez.\n'
                'gonderen = senin@gmail.com\n'
                'sifre = uygulama-sifresi   # Gmail: Hesap > Guvenlik > 2 Adimli Dogrulama > Uygulama sifreleri\n'
                'alici = senin@gmail.com\n'
                'sunucu = smtp.gmail.com\n'
                'port = 465\n'
                'konu = USTAD Dunya Monitoru - Gunluk Bulten\n')
        print('  Dosyayi doldurup tekrar calistir: ' + AYAR_DOSYA)
        return None
    a = {}
    with open(AYAR_DOSYA, encoding='utf-8') as f:
        for satir in f:
            satir = satir.strip()
            if not satir or satir.startswith('#') or '=' not in satir:
                continue
            k, v = satir.split('=', 1)
            v = v.split('#')[0].strip()
            a[k.strip()] = v
    return a if a.get('gonderen') and a.get('sifre') else None


def cek(url, t=25):
    try:
        r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 UstadMonitor'})
        return urllib.request.urlopen(r, timeout=t, context=CTX).read().decode('utf-8', 'replace')
    except Exception:
        return None


def veri_topla():
    v = {'tarih': datetime.datetime.now().strftime('%d.%m.%Y %H:%M')}
    d = cek('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
    if d:
        try:
            j = json.loads(d)
            v['deprem'] = []
            for f in j.get('features', [])[:12]:
                p = f['properties']
                g = f['geometry']['coordinates']
                v['deprem'].append({
                    'mag': p.get('mag'), 'yer': p.get('place'),
                    'zaman': datetime.datetime.fromtimestamp((p.get('time') or 0) / 1000).strftime('%d.%m %H:%M'),
                    'koord': '%.2f, %.2f' % (g[1], g[0]),
                    'pager': (p.get('alert') or '-'), 'tsunami': p.get('tsunami')})
            v['depremSayi'] = j['metadata']['count'] if 'metadata' in j else len(v['deprem'])
        except Exception:
            v['deprem'] = []
    u = cek('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    if u:
        try:
            j = json.loads(u)
            son = j[-1]
            v['kp'] = son.get('Kp') if isinstance(son, dict) else (son[1] if len(son) > 1 else '-')
        except Exception:
            pass
    g = cek('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;WF;VO;DR&alertlevel=Orange;Red')
    if g:
        try:
            j = json.loads(g)
            v['afet'] = []
            for f in (j.get('features') or [])[:15]:
                p = f.get('properties', {})
                v['afet'].append({'tur': p.get('eventtype'), 'ulke': p.get('country'),
                                  'seviye': p.get('alertlevel'), 'tarih': (p.get('fromdate') or '')[:10]})
        except Exception:
            v['afet'] = []
    return v


def html_yap(v):
    h = ['<html><head><meta charset="utf-8"></head><body style="font-family:Segoe UI,Arial;background:#f4f6f8;padding:18px">']
    h.append('<div style="max-width:760px;margin:auto;background:#fff;border:1px solid #d8dee4;border-radius:8px;overflow:hidden">')
    h.append('<div style="background:#0b3d1f;color:#7bffa1;padding:16px 20px;font-size:19px;letter-spacing:1px">'
             'U &#350; T A D &nbsp; D &#220; N Y A &nbsp; M O N &#304; T &#214; R &#220;</div>')
    h.append('<div style="background:#04120a;color:#c9ffd8;padding:9px 20px;font-size:12px">ÜSTAD KENAN KUZUCU · KURUCU · GAZİANTEP &nbsp;|&nbsp; '
             + v['tarih'] + '</div>')
    h.append('<div style="padding:16px 20px">')
    h.append('<h3 style="color:#0b3d1f;margin:0 0 8px">🌍 DEPREMLER (son 24 saat · M4.5+)</h3>')
    d = v.get('deprem') or []
    if d:
        h.append('<table style="width:100%;border-collapse:collapse;font-size:12px">'
                 '<tr style="background:#eef3ef"><th align="left">Büyüklük</th><th align="left">Yer</th>'
                 '<th align="left">Saat</th><th align="left">Koordinat</th><th align="left">PAGER</th><th align="left">Tsunami</th></tr>')
        for e in d:
            renk = '#b91c1c' if (e['mag'] or 0) >= 6 else ('#c2410c' if (e['mag'] or 0) >= 5 else '#374151')
            h.append('<tr style="border-bottom:1px solid #eef1f3"><td style="color:%s"><b>M%s</b></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>'
                     % (renk, e['mag'], e['yer'], e['zaman'], e['koord'], e['pager'],
                        'VAR' if e['tsunami'] else '-'))
        h.append('</table>')
    else:
        h.append('<p style="font-size:12px;color:#666">Veri alınamadı.</p>')
    h.append('<h3 style="color:#0b3d1f;margin:18px 0 8px">⚠️ AFET UYARILARI (turuncu/kırmızı)</h3>')
    a = v.get('afet') or []
    if a:
        h.append('<table style="width:100%;border-collapse:collapse;font-size:12px">'
                 '<tr style="background:#eef3ef"><th align="left">Tür</th><th align="left">Ülke</th><th align="left">Seviye</th><th align="left">Tarih</th></tr>')
        for e in a:
            h.append('<tr style="border-bottom:1px solid #eef1f3"><td>%s</td><td>%s</td>'
                     '<td style="color:%s"><b>%s</b></td><td>%s</td></tr>'
                     % (e['tur'], e['ulke'], '#b91c1c' if e['seviye'] == 'Red' else '#c2410c', e['seviye'], e['tarih']))
        h.append('</table>')
    else:
        h.append('<p style="font-size:12px;color:#666">Açık uyarı yok.</p>')
    h.append('<h3 style="color:#0b3d1f;margin:18px 0 8px">☀️ UZAY HAVASI</h3><p style="font-size:13px;margin:0">'
             'Kp indeksi: <b>%s</b> %s</p>' % (v.get('kp', '-'),
             '(Kp 5+ = kutup ışığı ve uydu etkisi olabilir)' if str(v.get('kp', '0')) not in ('-', '') and float(str(v.get('kp', '0')) or 0) >= 5 else ''))
    h.append('<hr style="margin:18px 0;border:0;border-top:1px solid #e4e9ec">')
    h.append('<p style="font-size:11px;color:#667">Bu bülten ÜSTAD DÜNYA MONİTÖRÜ tarafından bu bilgisayarda otomatik üretildi. '
             'Kaynaklar: USGS · GDACS · NOAA SWPC. Yalnızca halka açık veri; savunma amaçlıdır.</p>')
    h.append('</div></div></body></html>')
    return '\n'.join(h)


def main():
    print('=' * 58)
    print('  USTAD DUNYA MONITORU - GUNLUK BULTEN E-POSTA')
    print('=' * 58)
    a = ayar_oku()
    if not a:
        return
    print('  Veri toplaniyor (USGS · GDACS · NOAA)…')
    v = veri_topla()
    icerik = html_yap(v)
    # Word dosyasi da olustur (masaustune)
    doc = os.path.join(os.path.expanduser('~'), 'Desktop',
                       'USTAD-GUNLUK-BULTEN-' + datetime.date.today().isoformat() + '.doc')
    try:
        with open(doc, 'w', encoding='utf-8') as f:
            f.write(icerik.replace('<html>', '<html xmlns:o="urn:schemas-microsoft-com:office:office">'))
        print('  Word bulten: ' + doc)
    except Exception as e:
        print('  [!] Word dosyasi yazilamadi: ' + str(e))
    m = MIMEMultipart('mixed')
    m['From'] = a['gonderen']
    m['To'] = a['alici']
    m['Subject'] = a.get('konu', 'Ustad Dunya Monitoru') + ' - ' + datetime.date.today().strftime('%d.%m.%Y')
    m.attach(MIMEText(icerik, 'html', 'utf-8'))
    try:
        with open(doc, 'rb') as f:
            parca = MIMEApplication(f.read(), _subtype='msword')
            parca.add_header('Content-Disposition', 'attachment', filename=os.path.basename(doc))
            m.attach(parca)
    except Exception:
        pass
    sunucu = a.get('sunucu', 'smtp.gmail.com')
    port = int(a.get('port', 465))
    print('  Gonderiliyor: %s -> %s (%s:%s)' % (a['gonderen'], a['alici'], sunucu, port))
    try:
        with smtplib.SMTP_SSL(sunucu, port, context=ssl.create_default_context()) as s:
            s.login(a['gonderen'], a['sifre'])
            s.send_message(m)
        print('  [OK] E-posta gonderildi.')
    except Exception as e:
        print('  [!] Gonderilemedi: ' + str(e))
        print('      Gmail kullaniyorsan "uygulama sifresi" gerekir (normal sifre calismaz).')
    input('\n  Kapatmak icin Enter…')


if __name__ == '__main__':
    main()
