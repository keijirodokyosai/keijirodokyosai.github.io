@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Process-SoshikiFormJsonInbox.ps1" %*
if errorlevel 1 pause
