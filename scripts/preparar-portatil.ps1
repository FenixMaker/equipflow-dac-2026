# Executa UMA vez (com internet) neste PC para gerar runtime\ com Node + Python embutidos.
# Depois copie a pasta inteira do projeto para outro Windows — sem instalar nada la.
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Runtime = Join-Path $Root 'runtime'
$Tmp = Join-Path $Runtime '_tmp'
$PyVer = '3.12.8'
$NodeVer = '22.14.0'

$PyZip = "python-$PyVer-embed-amd64.zip"
$PyUrl = "https://www.python.org/ftp/python/$PyVer/$PyZip"
$NodeZip = "node-v$NodeVer-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/v$NodeVer/$NodeZip"
$GetPipUrl = 'https://bootstrap.pypa.io/get-pip.py'

function Expand-Zip($ZipPath, $Dest) {
  if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $Dest -Force
}

Write-Host '=== EquipFlow: preparar pacote portatil ===' -ForegroundColor Cyan
Write-Host "Pasta do projeto: $Root"
Write-Host ''

New-Item -ItemType Directory -Path $Runtime -Force | Out-Null
New-Item -ItemType Directory -Path $Tmp -Force | Out-Null

# --- Node portatil ---
$NodeDir = Join-Path $Runtime 'node'
if (-not (Test-Path (Join-Path $NodeDir 'node.exe'))) {
  Write-Host "[1/4] Baixando Node.js $NodeVer ..."
  $NodeZipPath = Join-Path $Tmp $NodeZip
  Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZipPath -UseBasicParsing
  $NodeExtract = Join-Path $Tmp 'node-extract'
  Expand-Zip $NodeZipPath $NodeExtract
  $Inner = Get-ChildItem $NodeExtract -Directory | Select-Object -First 1
  if (Test-Path $NodeDir) { Remove-Item $NodeDir -Recurse -Force }
  Move-Item $Inner.FullName $NodeDir
  Write-Host '      Node em runtime\node'
} else {
  Write-Host '[1/4] Node portatil ja existe.'
}

# --- Python embutido ---
$PyDir = Join-Path $Runtime 'python'
if (-not (Test-Path (Join-Path $PyDir 'python.exe'))) {
  Write-Host "[2/4] Baixando Python embed $PyVer ..."
  $PyZipPath = Join-Path $Tmp $PyZip
  Invoke-WebRequest -Uri $PyUrl -OutFile $PyZipPath -UseBasicParsing
  if (Test-Path $PyDir) { Remove-Item $PyDir -Recurse -Force }
  New-Item -ItemType Directory -Path $PyDir -Force | Out-Null
  Expand-Archive -LiteralPath $PyZipPath -DestinationPath $PyDir -Force

  $Pth = Get-ChildItem $PyDir -Filter '*._pth' | Select-Object -First 1
  if ($Pth) {
    @(
      (Split-Path $Pth.Name -Leaf).Replace('._pth', '.zip')
      '.'
      'Lib\site-packages'
      'import site'
    ) | Set-Content -LiteralPath $Pth.FullName -Encoding ascii
  }

  Write-Host '      Python em runtime\python'
} else {
  Write-Host '[2/4] Python portatil ja existe.'
}

$PyExe = Join-Path $PyDir 'python.exe'
$GetPip = Join-Path $PyDir 'get-pip.py'

# --- pip + requirements ---
Write-Host '[3/4] Instalando dependencias Python no runtime ...'
if (-not (Test-Path $GetPip)) {
  Invoke-WebRequest -Uri $GetPipUrl -OutFile $GetPip -UseBasicParsing
}
& $PyExe $GetPip --no-warn-script-location
& $PyExe -m pip install --upgrade pip setuptools wheel -q
& $PyExe -m pip install --prefer-binary -r (Join-Path $Root 'backend\requirements.txt')
& $PyExe -c "import uvicorn, fastapi; print('      OK:', uvicorn.__version__, fastapi.__version__)"

# --- npm ---
$NodeBin = Join-Path $Runtime 'node'
$env:PATH = "$NodeBin;$env:PATH"
$Npm = Join-Path $NodeBin 'npm.cmd'

Write-Host '[4/4] Instalando dependencias npm ...'
Push-Location $Root
& $Npm install
Push-Location (Join-Path $Root 'frontend')
& $Npm install
Pop-Location
Pop-Location

if (-not (Test-Path (Join-Path $Root 'frontend\.env'))) {
  $Ex = Join-Path $Root 'frontend\.env.example'
  if (Test-Path $Ex) {
    Copy-Item $Ex (Join-Path $Root 'frontend\.env')
    Write-Host '      Criado frontend\.env'
  }
}

Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '=== Pronto ===' -ForegroundColor Green
Write-Host 'Copie a pasta INTEIRA do projeto (com runtime\, node_modules\, frontend\node_modules\).'
Write-Host 'No outro PC: duplo clique em iniciar-equipflow.bat — nao precisa instalar Node nem Python.'
