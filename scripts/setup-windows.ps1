$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$shimDir = Join-Path $env:APPDATA 'npm'

Push-Location $repoRoot
try {
  New-Item -ItemType Directory -Force -Path $shimDir | Out-Null

  if (($env:PATH -split ';') -notcontains $shimDir) {
    $env:PATH = "$shimDir;$env:PATH"
  }

  corepack enable --install-directory $shimDir pnpm

  pnpm -v
  pnpm install --frozen-lockfile --config.symlink=false
  node scripts\sync-workspace-node-modules.mjs

  Write-Host ''
  Write-Host 'Windows workspace setup complete.'
  Write-Host 'If pnpm is not found in a new terminal, add this directory to your user PATH:'
  Write-Host "  $shimDir"
} finally {
  Pop-Location
}
