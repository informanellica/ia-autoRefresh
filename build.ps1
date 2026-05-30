# Packages the extension into a versioned zip for Chrome / Edge submission.
#
# Usage:  pwsh ./build.ps1
# Output: dist/auto-refresh-v<version>.zip  (version read from manifest.json)
# Only files in $include are bundled, so dev files never leak into the package.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

$include = @(
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.js',
  'icons',
  '_locales'
)

$missing = $include | Where-Object { -not (Test-Path (Join-Path $root $_)) }
if ($missing) { throw "Missing files, aborting: $($missing -join ', ')" }

$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
if (-not $version) { throw 'manifest.json has no "version" field.' }

$distDir = Join-Path $root 'dist'
$out = Join-Path $distDir "auto-refresh-v$version.zip"
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
if (Test-Path $out) { Remove-Item $out }

Compress-Archive -Path $include -DestinationPath $out

$size = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host "Built $out ($size KB)" -ForegroundColor Green
