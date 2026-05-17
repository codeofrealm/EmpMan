@echo off
:: =========================================================================
:: KIOSK SHELL WRAPPER - RUNS AUTOMATICALLY ON LOGON & WORKSTATION UNLOCK
:: =========================================================================
:: Registered in Task Scheduler under the task: "KioskAutoStart_UserName"
:: Runs with administrative privileges to prevent explorer escape vectors.
:: 
:: Logs for this Kiosk system are located at:
::   - Kiosk Activity:   %USERPROFILE%\AppData\LocalLow\Microsoft\KioskLock\logs\kiosk.log
::   - Installer/Task:   %USERPROFILE%\AppData\LocalLow\Microsoft\KioskLock\setup_kiosk_task.log
:: =========================================================================
cd /d "%~dp0"

:kioskloop
taskkill /f /im explorer.exe >nul 2>&1

:: Run kiosk directly (NOT via 'start /wait') so the batch truly blocks
:: until the EXE exits - even in non-interactive Task Scheduler sessions.
kiosk_lock.exe
set KIOSK_EXIT=%errorlevel%

if %KIOSK_EXIT% equ 0 (
    start explorer.exe
    exit /b 0
)

goto kioskloop
