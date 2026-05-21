param(
    [string]$InstallDir,
    [switch]$RemoveData,
    [switch]$PauseAtEnd
)
r
function Write-Step {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-WarnMessage {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Resolve-ScriptRoot {
    if ($PSScriptRoot -and $PSScriptRoot.Trim().Length -gt 0) {
        return $PSScriptRoot
    }

    $scriptPath = $null
    if ($MyInvocation -and $MyInvocation.MyCommand) {
        $pathProperty = $MyInvocation.MyCommand.PSObject.Properties["Path"]
        if ($pathProperty) {
            $scriptPath = $pathProperty.Value
        }
    }

    if ($scriptPath -and $scriptPath.Trim().Length -gt 0) {
        return (Split-Path -Parent $scriptPath)
    }

    return (Get-Location).Path
}

function Resolve-InstallDir {
    param([string]$RequestedInstallDir)

    if (-not [string]::IsNullOrWhiteSpace($RequestedInstallDir)) {
        return [System.IO.Path]::GetFullPath($RequestedInstallDir)
    }

    $scriptRoot = Resolve-ScriptRoot
    $candidates = @(
        (Split-Path -Parent $scriptRoot),
        (Join-Path $env:LOCALAPPDATA "Kiosk Lock")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return [System.IO.Path]::GetFullPath($candidate)
        }
    }

    return [System.IO.Path]::GetFullPath((Split-Path -Parent $scriptRoot))
}

function Remove-ScheduledTasksByPattern {
    param([string]$Pattern)

    try {
        $tasks = Get-ScheduledTask -TaskName $Pattern -ErrorAction SilentlyContinue
        if (-not $tasks) {
            Write-Step "No scheduled task found for pattern $Pattern"
            return
        }

        foreach ($task in $tasks) {
            try {
                Unregister-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Confirm:$false -ErrorAction Stop
                Write-Success "Removed scheduled task $($task.TaskName)"
            }
            catch {
                Write-WarnMessage "Could not remove task $($task.TaskName): $($_.Exception.Message)"
            }
        }
    }
    catch {
        Write-WarnMessage ("Task lookup failed for {0}: {1}" -f $Pattern, $_.Exception.Message)
    }
}

function Stop-ProcessesByNames {
    param([string[]]$Names)

    foreach ($name in $Names) {
        $processes = @(Get-Process -Name $name -ErrorAction SilentlyContinue)
        if (-not $processes) {
            continue
        }

        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Success "Stopped process $($proc.ProcessName) (PID $($proc.Id))"
            }
            catch {
                Write-WarnMessage "Could not stop process $($proc.ProcessName) (PID $($proc.Id)): $($_.Exception.Message)"
            }
        }
    }
}

function Remove-PathIfExists {
    param([string]$TargetPath)

    if ([string]::IsNullOrWhiteSpace($TargetPath)) {
        return
    }

    if (-not (Test-Path $TargetPath)) {
        return
    }

    try {
        Remove-Item -LiteralPath $TargetPath -Recurse -Force -ErrorAction Stop
        Write-Success "Removed $TargetPath"
    }
    catch {
        Write-WarnMessage "Could not remove $TargetPath : $($_.Exception.Message)"
    }
}

function Remove-ShortcutIfExists {
    param([string]$ShortcutPath)

    if ([string]::IsNullOrWhiteSpace($ShortcutPath)) {
        return
    }

    if (Test-Path $ShortcutPath) {
        try {
            Remove-Item -LiteralPath $ShortcutPath -Force -ErrorAction Stop
            Write-Success "Removed shortcut $ShortcutPath"
        }
        catch {
            Write-WarnMessage "Could not remove shortcut $ShortcutPath : $($_.Exception.Message)"
        }
    }
}

try {
    $resolvedInstallDir = Resolve-InstallDir -RequestedInstallDir $InstallDir
    $localLowRoot = if ($env:USERPROFILE -and $env:USERPROFILE.Trim().Length -gt 0) {
        Join-Path $env:USERPROFILE "AppData\LocalLow\Microsoft\KioskLock"
    }
    else {
        "C:\Users\Public\AppData\LocalLow\Microsoft\KioskLock"
    }

    $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Kiosk Lock.lnk"
    $startMenuShortcut = Join-Path ([Environment]::GetFolderPath("Programs")) "Kiosk Lock\Kiosk Lock.lnk"
    $startMenuUninstallShortcut = Join-Path ([Environment]::GetFolderPath("Programs")) "Kiosk Lock\Uninstall Kiosk Lock.lnk"
    $startMenuFolder = Join-Path ([Environment]::GetFolderPath("Programs")) "Kiosk Lock"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "      Kiosk Lock Uninstall Tool" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "InstallDir : $resolvedInstallDir"
    Write-Host "RemoveData : $($RemoveData.IsPresent)"
    Write-Host ""

    Write-Step "Stopping kiosk processes"
    Stop-ProcessesByNames -Names @("kiosk_lock", "reader", "auth_login")

    Write-Step "Removing scheduled tasks"
    Remove-ScheduledTasksByPattern -Pattern "KioskAutoStart*"
    Remove-ScheduledTasksByPattern -Pattern "RunKioskOnUnlock_AllUsers"
    Remove-ScheduledTasksByPattern -Pattern "RunB18ScriptOnUnlock"

    Write-Step "Removing shortcuts"
    Remove-ShortcutIfExists -ShortcutPath $desktopShortcut
    Remove-ShortcutIfExists -ShortcutPath $startMenuShortcut
    Remove-ShortcutIfExists -ShortcutPath $startMenuUninstallShortcut
    Remove-PathIfExists -TargetPath $startMenuFolder

    Write-Step "Removing installed application files"
    Remove-PathIfExists -TargetPath $resolvedInstallDir

    if ($RemoveData) {
        Write-Step "Removing kiosk runtime data"
        Remove-PathIfExists -TargetPath $localLowRoot
    }
    else {
        Write-Step "Keeping kiosk runtime data at $localLowRoot"
    }

    Write-Host ""
    Write-Host "Uninstall completed." -ForegroundColor Green
    if (-not $RemoveData) {
        Write-Host "User logs/config were kept. Use -RemoveData to delete LocalLow kiosk data too." -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host ("Uninstall failed: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
finally {
    if ($PauseAtEnd -and $Host.Name -eq "ConsoleHost") {
        Write-Host ""
        [void](Read-Host "Press Enter to close")
    }
}
