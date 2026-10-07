# Downloads the CC-licensed dish photos for the STEW sample menu.
# Re-run any time: existing files are skipped unless -Force is passed.
param([switch]$Force)

$ErrorActionPreference = 'Stop'
# $PSScriptRoot is this script's own folder (scripts/), so step up to the project root.
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'public\foods'
New-Item -ItemType Directory -Force -Path $out | Out-Null

# Standard Wikimedia thumbnail widths only (see Common thumbnail sizes). 500 is plenty
# for a card; anything not on the list is rejected with HTTP 400.
$images = @(
  @{ n = 'palm-nut-soup.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Fufu_with_palmnut_soup_and_chicken.jpg/500px-Fufu_with_palmnut_soup_and_chicken.jpg' },
  @{ n = 'groundnut-soup.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Fufu_with_groundnut_soup_1.jpg/500px-Fufu_with_groundnut_soup_1.jpg' },
  @{ n = 'light-soup.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Fufu_and_light_soup_in_asanka.jpg/500px-Fufu_and_light_soup_in_asanka.jpg' },
  @{ n = 'kontomire-stew.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kontomire_stew.jpg/500px-Kontomire_stew.jpg' },
  @{ n = 'chicken-stew.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ghanaian_Cuisine_01.jpg/500px-Ghanaian_Cuisine_01.jpg' },
  @{ n = 'beef-stew.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Boiled_plantain_with_kontomire_stew%2C_garnished_with_pear.jpg/500px-Boiled_plantain_with_kontomire_stew%2C_garnished_with_pear.jpg' },
  @{ n = 'fish-stew.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Kontomire_Stew%2C_Eggs_and_Plantian.jpg/500px-Kontomire_Stew%2C_Eggs_and_Plantian.jpg' },
  @{ n = 'egg-stew.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Palava_sauce_w-_cocoyam_leaf_%285612472154%29.jpg/500px-Palava_sauce_w-_cocoyam_leaf_%285612472154%29.jpg' },
  @{ n = 'fufu.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Fufu_plantain_Ghana_1.jpg/500px-Fufu_plantain_Ghana_1.jpg' },
  @{ n = 'banku.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Banku_and_tilapia_1.jpg/500px-Banku_and_tilapia_1.jpg' },
  @{ n = 'kenkey.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Fanti_Kenkey_and_fish.jpg/500px-Fanti_Kenkey_and_fish.jpg' },
  @{ n = 'rice-balls.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Omo_tuo_with_groundnut_soup_and_meat.jpg/500px-Omo_tuo_with_groundnut_soup_and_meat.jpg' },
  @{ n = 'sobolo.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Sobolo.jpg/500px-Sobolo.jpg' },
  @{ n = 'pineapple-juice.jpg'; u = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Pineapple_Juice_fruits-465832.jpg/500px-Pineapple_Juice_fruits-465832.jpg' }
)

$ok = 0; $failed = @()
foreach ($i in $images) {
  $path = Join-Path $out $i.n
  if ((Test-Path $path) -and -not $Force) {
    $b = [System.IO.File]::ReadAllBytes($path)
    if ($b.Length -gt 4000 -and $b[0] -eq 0xFF -and $b[1] -eq 0xD8) { Write-Host "skip  $($i.n)"; $ok++; continue }
  }
  $done = $false
  for ($try = 1; $try -le 5 -and -not $done; $try++) {
    curl.exe -sSL --max-time 120 -A "STEW-app/1.0 (student project)" -o $path $i.u
    if (Test-Path $path) {
      $b = [System.IO.File]::ReadAllBytes($path)
      if ($b.Length -gt 4000 -and $b[0] -eq 0xFF -and $b[1] -eq 0xD8) { $done = $true; $ok++; Write-Host ("got   {0,-24} {1,8:N0} bytes" -f $i.n, $b.Length) }
      else { Start-Sleep -Seconds (6 * $try) }
    } else { Start-Sleep -Seconds (6 * $try) }
  }
  if (-not $done) { $failed += $i.n; Write-Host "FAIL  $($i.n)" }
  Start-Sleep -Seconds 4
}
Write-Host "`n$ok ok, $($failed.Count) failed"
if ($failed.Count) { Write-Host ("failed: " + ($failed -join ', ')) }
