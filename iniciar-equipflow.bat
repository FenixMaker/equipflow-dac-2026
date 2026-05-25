@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ROOT=%~dp0"

set "NODE_DIR=%ROOT%runtime\node"
set "PY_DIR=%ROOT%runtime\python"
set "NODE_EXE=%NODE_DIR%\node.exe"
set "PY_EXE=%PY_DIR%\python.exe"
set "PORTABLE=0"
set "SKIP_PIP=0"
set "SKIP_NPM_ROOT=0"
set "SKIP_NPM_FRONT=0"
set "PYBACK="

rem ========== Modo portatil (recomendado para outros PCs) ==========
if exist "%NODE_EXE%" if exist "%PY_EXE%" (
  set "PORTABLE=1"
  set "PATH=%NODE_DIR%;%PATH%"
  set "PYBACK=%PY_EXE%"
  echo [OK] Modo portatil: runtime\node + runtime\python
  "%PY_EXE%" -c "import uvicorn, fastapi" >nul 2>&1
  if errorlevel 1 (
    echo [ERRO] Python portatil sem dependencias do backend.
    echo        Execute preparar-portatil.bat neste PC ^(com internet, uma vez^).
    pause
    exit /b 1
  )
  set "SKIP_PIP=1"
  if exist "%ROOT%node_modules\concurrently\package.json" set "SKIP_NPM_ROOT=1"
  if exist "%ROOT%frontend\node_modules\vite\package.json" set "SKIP_NPM_FRONT=1"
  goto :deps_done
)

rem ========== Modo local (este PC com Node/Python instalados) ==========
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo.
  echo   Para usar em OUTRO PC sem instalar nada:
  echo   1. Neste PC execute preparar-portatil.bat ^(uma vez, com internet^)
  echo   2. Copie a pasta INTEIRA do projeto para o outro computador
  echo   3. Execute iniciar-equipflow.bat la
  echo.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRO] npm nao encontrado.
  pause
  exit /b 1
)

set "PY="
set "PYARGS="
where py >nul 2>&1
if not errorlevel 1 (
  for %%V in (-3.12 -3.11 -3.13) do (
    if not defined PY (
      py %%V -c "import sys; v=sys.version_info[:2]; raise SystemExit(0 if (3,11)<=v<=(3,13) else 1)" >nul 2>&1
      if not errorlevel 1 (
        set "PY=py"
        set "PYARGS=%%V"
      )
    )
  )
)
if not defined PY (
  python -c "import sys; v=sys.version_info[:2]; raise SystemExit(0 if (3,11)<=v<=(3,13) else 1)" >nul 2>&1
  if not errorlevel 1 (
    set "PY=python"
    set "PYARGS="
  )
)
if not defined PY (
  echo [ERRO] Python 3.11-3.13 nao encontrado.
  echo   Ou execute preparar-portatil.bat para nao depender de Python instalado.
  pause
  exit /b 1
)

set "PYBACK=%ROOT%backend\.venv\Scripts\python.exe"
if exist "%PYBACK%" (
  "%PYBACK%" -c "import uvicorn, fastapi" >nul 2>&1
  if not errorlevel 1 set "SKIP_PIP=1"
)

if "!SKIP_PIP!"=="0" (
  echo [1/5] Backend - criando .venv ...
  cd /d "%ROOT%backend"
  if exist ".venv" rmdir /s /q ".venv" 2>nul
  "%PY%" %PYARGS% -m venv .venv
  if errorlevel 1 (
    echo [ERRO] Falha ao criar backend\.venv
    pause
    exit /b 1
  )
  set "PYBACK=%ROOT%backend\.venv\Scripts\python.exe"
  "%PYBACK%" -m pip install --upgrade pip setuptools wheel -q
  "%PYBACK%" -m pip install --prefer-binary -r "%ROOT%backend\requirements.txt"
  if errorlevel 1 (
    echo [ERRO] pip install falhou.
    pause
    exit /b 1
  )
  cd /d "%ROOT%"
) else (
  echo [1/5] Backend .venv OK.
)

if exist "%ROOT%node_modules\concurrently\package.json" set "SKIP_NPM_ROOT=1"
if exist "%ROOT%frontend\node_modules\vite\package.json" set "SKIP_NPM_FRONT=1"

:deps_done
if "!SKIP_NPM_ROOT!"=="0" (
  echo [2/5] npm install na raiz ...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
) else (
  echo [2/5] npm raiz OK.
)

if "!SKIP_NPM_FRONT!"=="0" (
  echo [3/5] npm install no frontend ...
  pushd "%ROOT%frontend"
  call npm install
  if errorlevel 1 ( popd & pause & exit /b 1 )
  popd
) else (
  echo [3/5] npm frontend OK.
)

if "!PORTABLE!"=="1" (
  echo [1/5] Backend portatil OK ^(sem download^).
)

echo [4/5] frontend\.env ...
if not exist "%ROOT%frontend\.env" (
  if exist "%ROOT%frontend\.env.example" (
    copy /Y "%ROOT%frontend\.env.example" "%ROOT%frontend\.env" >nul
    echo Criado frontend\.env
  )
) else (
  echo frontend\.env ja existe.
)

set "EQUIPFLOW_PYTHON=%PYBACK%"
echo [5/5] Subindo API ^(8000^) e Vite ^(5173^). Ctrl+C encerra ambos.
echo         Site: http://127.0.0.1:5173/
echo         API:  http://127.0.0.1:8000/docs
if "!PORTABLE!"=="1" echo         Modo: portatil ^(pode copiar esta pasta para outro PC^)
echo         IPs LAN para o celular serao listados abaixo em alguns segundos.
where node >nul 2>&1
if not errorlevel 1 start /b "" node "%ROOT%scripts\print-lan-ips.cjs"
echo.
call npm run dev
cd /d "%ROOT%"
pause
