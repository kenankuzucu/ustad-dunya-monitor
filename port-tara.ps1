# ============================================================
#  USTAD DUNYA MONITORU - YEREL PORT TARAYICI
#  Yalnizca KENDI bilgisayarinin dinlenen (LISTENING) portlarini okur.
#  Disariya hicbir veri gondermez; sonucu panel klasorune yazar.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$kok = Split-Path -Parent $MyInvocation.MyCommand.Path
$hedef = Join-Path $kok 'veri'
if(!(Test-Path $hedef)){ New-Item -ItemType Directory -Path $hedef | Out-Null }

$satirlar = netstat -an | Select-String 'LISTENING'
$liste = @()
foreach($s in $satirlar){
  $p = ($s.Line -split '\s+') | Where-Object { $_ -ne '' }
  if($p.Count -lt 4){ continue }
  $yerel = $p[1]
  $sonIkiNokta = $yerel.LastIndexOf(':')
  if($sonIkiNokta -lt 0){ continue }
  $adres = $yerel.Substring(0, $sonIkiNokta).Trim('[',']')
  $port  = $yerel.Substring($sonIkiNokta + 1)
  if($port -notmatch '^\d+$'){ continue }
  $liste += [pscustomobject]@{ adres = $adres; port = $port }
}
$liste = $liste | Sort-Object { [int]$_.port } -Unique

$js  = "/* USTAD MONITOR - yerel port listesi (yalnizca bu bilgisayarda uretildi) */`r`n"
$js += "window.YEREL_PORTLAR=" + ($liste | ConvertTo-Json -Compress -Depth 3) + ";`r`n"
$js += "window.YEREL_PORT_TARIH='" + (Get-Date).ToString('dd.MM.yyyy HH:mm') + "';`r`n"
Set-Content -Path (Join-Path $hedef 'portlar.js') -Value $js -Encoding UTF8

Write-Host ""
Write-Host "  TAMAM - " -ForegroundColor Green -NoNewline
Write-Host ("{0} adet dinlenen port bulundu." -f $liste.Count)
Write-Host ("  Dosya: {0}" -f (Join-Path $hedef 'portlar.js'))
Write-Host "  Panelde: AYARLAR sekmesi -> YEREL MAKINE bolumu"
Write-Host ""
Write-Host "  NOT: Yalnizca kendi makinen tarandi, hicbir veri disari gitmedi." -ForegroundColor DarkGray
Start-Sleep -Seconds 2
