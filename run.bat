@echo off
rem Component Lab launcher: double-click. Starts minimized on the taskbar.
rem Restored window is about one quarter the default console size.
cd /d "%~dp0"

if /I not "%~1"=="--console" (
  start "Component Lab" /min cmd /c ""%~f0" --console"
  exit /b
)

title Component Lab
mode con: cols=60 lines=16

where py >nul 2>nul && (py serve.py 5179 --open) || (python serve.py 5179 --open)
pause
