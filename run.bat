@echo off
rem Component Lab launcher: double-click. Starts the local server and opens Chrome once bound.
cd /d "%~dp0"
where py >nul 2>nul && (py serve.py 5179 --open) || (python serve.py 5179 --open)
pause
