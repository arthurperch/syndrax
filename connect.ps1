# Syndrax — remote node connector (locked endpoint)
# Run on the REMOTE PC in an elevated PowerShell:
#   irm https://www.syndrax.io/connect.ps1 | iex
#
# What it does (and intentionally does NOT do):
#  - Force-installs the Chrome WEB STORE build of the Syndrax extension via Chrome
#    managed policy (ExtensionInstallForcelist) — Web Store only, no sideload.
#  - Marks this machine as a LOCKED ENDPOINT: it takes jobs from your main PC but
#    cannot reverse-connect to, or read the IPs of, other nodes in your fleet.
#  - Records the machine's static IP + MAC for the safety audit.
# Requires admin (writes HKLM Chrome policy).

$ErrorActionPreference = 'Stop'
$STORE_ID = 'mgapfpdkkihbeehfkgoajhealmgpnglo'   # Syndrax — Chrome Web Store
$UPDATE   = 'https://clients2.google.com/service/update2/crx'

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
    throw 'Please run this in an ELEVATED PowerShell (Run as Administrator).'
  }
}

try {
  Assert-Admin
  Write-Host 'Syndrax — connecting this PC as a locked remote node...' -ForegroundColor Cyan

  # 1) Force-install the Web Store extension (managed policy)
  $forcelist = 'HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist'
  if (-not (Test-Path $forcelist)) { New-Item -Path $forcelist -Force | Out-Null }
  $i = 1
  while (Get-ItemProperty -Path $forcelist -Name "$i" -ErrorAction SilentlyContinue) { $i++ }
  New-ItemProperty -Path $forcelist -Name "$i" -Value "$STORE_ID;$UPDATE" -PropertyType String -Force | Out-Null

  # 2) Mark as a LOCKED endpoint + capture IP/MAC for the audit
  $mark = 'HKLM:\SOFTWARE\Syndrax'
  if (-not (Test-Path $mark)) { New-Item -Path $mark -Force | Out-Null }
  $ip  = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
          Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } |
          Select-Object -First 1).IPAddress
  $mac = (Get-NetAdapter -ErrorAction SilentlyContinue |
          Where-Object Status -eq 'Up' | Select-Object -First 1).MacAddress
  New-ItemProperty -Path $mark -Name 'Endpoint'    -Value 'locked'              -PropertyType String -Force | Out-Null
  New-ItemProperty -Path $mark -Name 'StaticIP'    -Value "$ip"                 -PropertyType String -Force | Out-Null
  New-ItemProperty -Path $mark -Name 'MacAddress'  -Value "$mac"                -PropertyType String -Force | Out-Null
  New-ItemProperty -Path $mark -Name 'InstalledAt' -Value (Get-Date).ToString('s') -PropertyType String -Force | Out-Null

  Write-Host ''
  Write-Host "  Node IP : $ip"  -ForegroundColor Green
  Write-Host "  Node MAC: $mac" -ForegroundColor Green
  Write-Host ''
  Write-Host 'Done. Restart Chrome on this PC and sign in to Syndrax — this node will join your cluster as a locked endpoint.' -ForegroundColor Cyan
}
catch {
  Write-Host "Syndrax connect failed: $($_.Exception.Message)" -ForegroundColor Red
}
