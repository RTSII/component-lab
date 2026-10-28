@echo off
rem Component Lab launcher: double-click. Opens Chrome and starts the local server.
cd /d "%~dp0"
start "" chrome "http://127.0.0.1:5179/"
where python >nul 2>nul && (python serve.py 5179) || (py serve.py 5179)
pause
