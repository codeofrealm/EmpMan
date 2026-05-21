param(
    [switch]$InstallPs2Exe
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-ScriptRoot {
    if ($PSScriptRoot -and $PSScriptRoot.Trim().Length -gt 0) {
        return $PSScriptRoot
    }
    return (Get-Location).Path
}

$scriptRoot = Resolve-ScriptRoot
$inputScript = Join-Path $scriptRoot "uninstall_kiosk.ps1"
$outputExe = Join-Path $scriptRoot "uninstall_kiosk.exe"

if (-not (Test-Path $inputScript)) {
    throw "Input script not found: $inputScript"
}

if (-not (Get-Module -ListAvailable -Name ps2exe)) {
    if (-not $InstallPs2Exe) {
        throw "ps2exe module not found. Run: powershell -ExecutionPolicy Bypass -File .\uninustall\build_uninstall_exe.ps1 -InstallPs2Exe"
    }

    Write-Host "Installing ps2exe module..." -ForegroundColor Cyan
    Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber
}

Import-Module ps2exe -ErrorAction Stop

Invoke-ps2exe `
    -inputFile $inputScript `
    -outputFile $outputExe `
    -noConsole `
    -title "Kiosk Lock Uninstall" `
    -description "Standalone uninstaller for Kiosk Lock"

Write-Host "Uninstall exe built successfully: $outputExe" -ForegroundColor Green
