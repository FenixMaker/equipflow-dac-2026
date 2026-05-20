@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo  Prepara o EquipFlow para rodar em QUALQUER Windows sem instalar nada.
echo  Precisa de INTERNET apenas nesta etapa (uma vez).
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\preparar-portatil.ps1"
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao preparar. Verifique a conexao e tente de novo.
  pause
  exit /b 1
)
echo.
pause
