@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo [0/5] Verificando Node.js e Python ...

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale Node LTS: https://nodejs.org/
  pause
  exit /b 1
)
for /f "delims=" %%N in ('where node 2^>nul') do set "NODEPATH=%%N" & goto node_ok
:node_ok
echo [OK] Node: !NODEPATH!

set "PYEXE="
call :find_python
if not defined PYEXE (
  call :try_install_python312
  call :find_python
)
if not defined PYEXE (
  call :show_python_help
  pause
  exit /b 1
)

for /f "delims=" %%V in ('"!PYEXE!" -c "import sys; print(sys.version.split()[0])"') do set "PYVER=%%V"
echo [OK] Python: !PYEXE!  ^(!PYVER!^)

echo [1/5] Backend - ambiente virtual e dependencias Python ...
cd /d "%~dp0backend"

set "NEED_VENV=1"
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import sys; v=sys.version_info[:2]; raise SystemExit(0 if (3,11)<=v<=(3,13) else 1)" >nul 2>&1
  if not errorlevel 1 set "NEED_VENV=0"
)

if "!NEED_VENV!"=="1" (
  if exist ".venv" (
    echo [AVISO] backend\.venv inexistente ou Python incompativel ^(ex.: 3.14^) - recriando...
    rmdir /s /q ".venv" 2>nul
  )
  "!PYEXE!" -m venv .venv
  if errorlevel 1 (
    echo [ERRO] Falha ao criar backend\.venv
    cd /d "%~dp0"
    pause
    exit /b 1
  )
)

set "PYBACK=%~dp0backend\.venv\Scripts\python.exe"
if not exist "!PYBACK!" (
  echo [ERRO] Python do venv nao encontrado: !PYBACK!
  cd /d "%~dp0"
  pause
  exit /b 1
)

"!PYBACK!" -m pip install --upgrade pip setuptools wheel -q
"!PYBACK!" -m pip install --prefer-binary -r "%~dp0backend\requirements.txt"
if errorlevel 1 (
  echo.
  echo [ERRO] pip install no backend falhou.
  echo   Apague a pasta backend\.venv e execute este .bat de novo.
  cd /d "%~dp0"
  pause
  exit /b 1
)
cd /d "%~dp0"

echo [2/5] Raiz do projeto - npm install ^(concurrently^) ...
call npm install
if errorlevel 1 (
  echo [ERRO] npm install na raiz falhou.
  pause
  exit /b 1
)

echo [3/5] Frontend - npm install ...
pushd "%~dp0frontend"
call npm install
if errorlevel 1 (
  echo [ERRO] npm install no frontend falhou.
  popd
  pause
  exit /b 1
)
popd

echo [4/5] Arquivo frontend\.env ...
if not exist "%~dp0frontend\.env" (
  if exist "%~dp0frontend\.env.example" (
    copy /Y "%~dp0frontend\.env.example" "%~dp0frontend\.env" >nul
    echo Criado frontend\.env a partir de .env.example
  ) else (
    echo [AVISO] frontend\.env.example nao encontrado.
  )
) else (
  echo frontend\.env ja existe.
)

echo [5/5] Subindo API ^(8000^) e Vite ^(5173^). Ctrl+C encerra ambos.
echo         Site: http://127.0.0.1:5173/
echo         API:  http://127.0.0.1:8000/docs
echo.
call npm run dev
echo.
cd /d "%~dp0"
pause
exit /b 0

rem --- Procura Python 3.11-3.13 (evita 3.14 sem wheels do pydantic) ---
:find_python
set "PYEXE="
where py >nul 2>&1
if not errorlevel 1 (
  call :test_py_launcher 3.12
  if not defined PYEXE call :test_py_launcher 3.11
  if not defined PYEXE call :test_py_launcher 3.13
)
if not defined PYEXE call :test_python_exe "%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PYEXE call :test_python_exe "%LocalAppData%\Programs\Python\Python311\python.exe"
if not defined PYEXE call :test_python_exe "%LocalAppData%\Programs\Python\Python313\python.exe"
if not defined PYEXE call :test_python_exe "%ProgramFiles%\Python312\python.exe"
if not defined PYEXE call :test_python_exe "%ProgramFiles%\Python311\python.exe"
if not defined PYEXE (
  where python >nul 2>&1
  if not errorlevel 1 call :test_python_exe python
)
exit /b 0

:test_py_launcher
py -%1 -c "import sys; v=sys.version_info[:2]; raise SystemExit(0 if (3,11)<=v<=(3,13) else 1)" >nul 2>&1
if errorlevel 1 exit /b 1
for /f "delims=" %%E in ('py -%1 -c "import sys; print(sys.executable)" 2^>nul') do set "PYEXE=%%E"
exit /b 0

:test_python_exe
if not exist "%~1" if /i not "%~1"=="python" exit /b 1
"%~1" -c "import sys; v=sys.version_info[:2]; raise SystemExit(0 if (3,11)<=v<=(3,13) else 1)" >nul 2>&1
if errorlevel 1 exit /b 1
for /f "delims=" %%E in ('"%~1" -c "import sys; print(sys.executable)" 2^>nul') do set "PYEXE=%%E"
exit /b 0

:try_install_python312
where py >nul 2>&1
if errorlevel 1 exit /b 0
echo.
echo [AVISO] Python 3.11-3.13 nao encontrado. Tentando instalar 3.12 via py launcher...
echo         ^(precisa de internet; pode pedir confirmacao^)
py install 3.12
exit /b 0

:show_python_help
echo.
echo [ERRO] Python 3.11, 3.12 ou 3.13 nao encontrado.
echo.
echo   O Carlos provavelmente so tem Python 3.14. Esse projeto precisa de 3.12.
echo.
echo   Opcao A - no PowerShell ou CMD ^(com internet^):
echo     py install 3.12
echo.
echo   Opcao B - instalador manual:
echo     https://www.python.org/downloads/release/python-31210/
echo     Marque "Add python.exe to PATH" e "Install py launcher".
echo.
echo   Depois apague a pasta backend\.venv e execute este .bat de novo.
echo.
py -0p 2>nul
python -c "import sys; print('python no PATH:', sys.version)" 2>nul
exit /b 0
