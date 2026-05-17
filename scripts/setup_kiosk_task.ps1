param(
    [object]$PauseOnError = $true
)

# ================= AUTO CREATE KIOSK TASK =================
# Triggers: User Logon + Session Unlock  |  Delay: 0s  |  Priority: 1
$ErrorActionPreference = "Stop"

# ---- Admin check ----
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    # When called from an Inno Setup installer (PrivilegesRequired=admin) the process
    # IS elevated even if the identity check looks odd. We warn but do NOT exit,
    # letting the task-creation attempt reveal the real error if any.
    Write-Host "[WARN] Admin check inconclusive - continuing (installer context)." -ForegroundColor Yellow
}

# ================= HELPERS =================
function Invoke-Schtasks {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $tempOut = [System.IO.Path]::GetTempFileName()
    $tempErr = [System.IO.Path]::GetTempFileName()
    try {
        $p = Start-Process -FilePath "schtasks.exe" `
            -ArgumentList $Arguments `
            -NoNewWindow -PassThru `
            -RedirectStandardOutput $tempOut `
            -RedirectStandardError  $tempErr `
            -Wait
        $stdOut = if (Test-Path $tempOut) { Get-Content $tempOut -Raw -ErrorAction SilentlyContinue } else { "" }
        $stdErr = if (Test-Path $tempErr) { Get-Content $tempErr -Raw -ErrorAction SilentlyContinue } else { "" }
        return [pscustomobject]@{
            ExitCode = $p.ExitCode
            Output   = (($stdOut + "`n" + $stdErr).Trim())
            Command  = "schtasks.exe " + ($Arguments -join " ")
        }
    }
    finally {
        if (Test-Path $tempOut) { Remove-Item $tempOut -Force | Out-Null }
        if (Test-Path $tempErr) { Remove-Item $tempErr -Force | Out-Null }
    }
}

function Convert-ToBool {
    param([object]$Value)
    $text = if ($null -eq $Value) { "" } else { $Value.ToString().Trim().ToLowerInvariant() }
    switch ($text) {
        "1"      { return $true  }
        "0"      { return $false }
        "true"   { return $true  }
        "false"  { return $false }
        "`$true" { return $true  }
        "`$false"{ return $false }
        default  { return [bool]$Value }
    }
}

function Resolve-ScriptRoot {
    if ($PSScriptRoot -and $PSScriptRoot.Trim().Length -gt 0) { return $PSScriptRoot }
    $scriptPath = $null
    if ($MyInvocation -and $MyInvocation.MyCommand) {
        $p = $MyInvocation.MyCommand.PSObject.Properties["Path"]
        if ($p) { $scriptPath = $p.Value }
    }
    if ($scriptPath -and $scriptPath.Trim().Length -gt 0) { return (Split-Path -Parent $scriptPath) }
    return (Get-Location).Path
}

function Resolve-TaskUserId {
    $domain = if ($env:USERDOMAIN) { $env:USERDOMAIN.Trim() } else { "" }
    $user   = if ($env:USERNAME)   { $env:USERNAME.Trim()   } else { "" }
    if ($domain.Length -gt 0 -and $user.Length -gt 0) { return "$domain\$user" }
    if ($user.Length  -gt 0) { return $user }
    try {
        $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
        if ($id -and $id.Name -and $id.Name.Trim().Length -gt 0) { return $id.Name.Trim() }
    } catch {}
    return "SYSTEM"
}

function Write-TaskLog {
    param([string]$Message)
    try {
        $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "$ts $Message" | Add-Content -Path $script:TaskLogPath
    } catch {}
}

function Handle-FatalError {
    param([string]$Message)
    Write-TaskLog ("ERROR: " + $Message)
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    Write-Host ""
    if ($script:PauseOnErrorEnabled -and $Host.Name -eq "ConsoleHost") {
        [void](Read-Host "Press Enter to close")
    }
    exit 1
}

# ================= HELPER: Build Task XML =================
function New-KioskTaskXml {
    param(
        [string]$Version,        # "1.4" or "1.2"
        [string]$CurrentUser,
        [string]$PrincipalId,
        [string]$Command,
        [string]$WorkingDir
    )

    # Escape XML special chars in paths
    $CommandXml    = [System.Security.SecurityElement]::Escape($Command)
    $WorkDirXml    = [System.Security.SecurityElement]::Escape($WorkingDir)

    return @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="$Version" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>$CurrentUser</UserId>
      <Delay>PT0S</Delay>
    </LogonTrigger>
    <SessionStateChangeTrigger>
      <Enabled>true</Enabled>
      <StateChange>SessionUnlock</StateChange>
      <Delay>PT0S</Delay>
    </SessionStateChangeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$PrincipalId</UserId>
      <!-- InteractiveToken: runs in the user's interactive session without storing credentials.
           This is required for GUI elements (like the WPF lock screen) to be visible to the user. -->
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>StopExisting</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>1</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$CommandXml</Command>
      <WorkingDirectory>$WorkDirXml</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@
}

# ================= MAIN =================
try {
    $script:PauseOnErrorEnabled = Convert-ToBool $PauseOnError

    $SCRIPT_ROOT  = Resolve-ScriptRoot
    $PROJECT_ROOT = Split-Path -Parent $SCRIPT_ROOT

    # --- Locate RunKiosk.bat or kiosk_lock.exe ---
    # Search order: RunKiosk.bat first (preferred), then exe fallback.
    # Also checks the script's own folder for deployments where
    # scripts\ and dist\ are siblings.
    $batCandidates = @(
        (Join-Path $PROJECT_ROOT "RunKiosk.bat"),
        (Join-Path $PROJECT_ROOT "dist\RunKiosk.bat"),
        (Join-Path $SCRIPT_ROOT  "RunKiosk.bat"),
        (Join-Path $SCRIPT_ROOT  "..\RunKiosk.bat"),
        (Join-Path $SCRIPT_ROOT  "..\dist\RunKiosk.bat")
    )
    $exeCandidates = @(
        (Join-Path $PROJECT_ROOT "dist\kiosk_lock.exe"),
        (Join-Path $PROJECT_ROOT "kiosk_lock.exe"),
        (Join-Path $SCRIPT_ROOT  "kiosk_lock.exe"),
        (Join-Path $SCRIPT_ROOT  "..\dist\kiosk_lock.exe")
    )

    $FoundBat = $batCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    $FoundExe = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

    # Build the actual command + working dir
    # .bat files must be launched via cmd.exe so the task runs them correctly.
    if ($FoundBat) {
        $TaskCommand    = "cmd.exe"
        $TaskArgs       = "/c `"$FoundBat`""
        $TaskWorkingDir = Split-Path -Parent $FoundBat
        $LaunchTarget   = $FoundBat
        Write-Host "  Target : RunKiosk.bat  -> $FoundBat" -ForegroundColor Cyan
    }
    elseif ($FoundExe) {
        $TaskCommand    = $FoundExe
        $TaskArgs       = ""
        $TaskWorkingDir = Split-Path -Parent $FoundExe
        $LaunchTarget   = $FoundExe
        Write-Host "  Target : kiosk_lock.exe -> $FoundExe" -ForegroundColor Cyan
    }
    else {
        $allChecked = ($batCandidates + $exeCandidates) -join "`n    "
        Handle-FatalError ("RunKiosk.bat and kiosk_lock.exe not found.`nChecked:`n    $allChecked")
    }

    # --- Build task name & data paths ---
    $CurrentUser   = Resolve-TaskUserId
    $PrincipalId   = $CurrentUser

    $safeUserSource = if ($env:USERNAME -and $env:USERNAME.Trim().Length -gt 0) { $env:USERNAME.Trim() } else { $CurrentUser }
    $SafeUserName   = ($safeUserSource -replace '[^A-Za-z0-9_-]', '_').Trim('_')
    if (-not $SafeUserName) { $SafeUserName = "User" }

    $TaskName = "KioskAutoStart_$SafeUserName"

    $taskDataRoot = if ($env:USERPROFILE -and $env:USERPROFILE.Trim().Length -gt 0) {
        Join-Path $env:USERPROFILE "AppData\LocalLow\Microsoft\KioskLock"
    } else {
        "C:\Users\Public\AppData\LocalLow\Microsoft\KioskLock"
    }
    if (-not (Test-Path $taskDataRoot)) { New-Item -Path $taskDataRoot -ItemType Directory -Force | Out-Null }

    $script:TaskLogPath = Join-Path $taskDataRoot "setup_kiosk_task.log"
    $xmlPath            = Join-Path $taskDataRoot "kiosk_task.xml"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Kiosk Task Scheduler Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  User    : $CurrentUser"
    Write-Host "  Task    : $TaskName"
    Write-Host "  Trigger : Logon + Session Unlock (0 delay)"
    Write-Host "  Priority: 1 (Highest)"
    Write-Host ""

    Write-TaskLog "Task setup started. User=$CurrentUser Task=$TaskName Target=$LaunchTarget"

    # --- Remove old tasks (best-effort) ---
    $toDelete = @($TaskName, "KioskAutoStart") | Select-Object -Unique
    foreach ($t in $toDelete) {
        $r = Invoke-Schtasks -Arguments @("/Delete", "/TN", $t, "/F")
        if ($r.ExitCode -ne 0) {
            $txt = ($r.Output | Out-String).Trim()
            if ($txt -and $txt -notmatch "(?i)cannot find|not found|does not exist") {
                Write-Warning "Could not delete old task '$t': $txt"
                Write-TaskLog "Delete warning ($t): $txt"
            }
        } else {
            Write-Host "  Removed old task: $t" -ForegroundColor DarkGray
        }
    }

    # --- The actual command stored in XML ---
    # For .bat: cmd.exe with /c "path\RunKiosk.bat"
    # For .exe: direct path
    $XmlCommand    = $TaskCommand
    $XmlWorkingDir = $TaskWorkingDir

    # If bat file, embed the full cmd line as the command
    if ($FoundBat) {
        # Task Exec command = cmd.exe, but working dir = bat folder.
        # We store the full bat path so Windows resolves it properly.
        $XmlCommand = "cmd.exe"
        # WorkingDirectory ensures relative paths inside the bat work correctly.
    }

    # ── Helper: register via PowerShell cmdlets (no schtasks.exe needed) ──────
    function Register-KioskTaskViaCmdlet {
        param([string]$Command, [string]$Args, [string]$WorkDir, [string]$User, [string]$Name)
        try {
            # Triggers
            $trigLogon  = New-ScheduledTaskTrigger -AtLogOn -User $User
            $trigCim    = Get-CimClass -Namespace Root/Microsoft/Windows/TaskScheduler `
                              -ClassName MSFT_TaskSessionStateChangeTrigger -ErrorAction Stop
            $trigUnlock = New-CimInstance -CimClass $trigCim `
                              -Property @{ StateChange = 8; Enabled = $true } -ClientOnly

            # Action
            if ([string]::IsNullOrWhiteSpace($Args)) {
                $action = New-ScheduledTaskAction -Execute $Command -WorkingDirectory $WorkDir
            } else {
                $action = New-ScheduledTaskAction -Execute $Command -Argument $Args -WorkingDirectory $WorkDir
            }

            # Principal — InteractiveToken: interactive session, no password stored
            $principal = New-ScheduledTaskPrincipal `
                -UserId   $User `
                -LogonType InteractiveToken `
                -RunLevel  Highest

            # Settings
            $settings = New-ScheduledTaskSettingsSet `
                -MultipleInstances    StopExisting `
                -ExecutionTimeLimit   ([TimeSpan]::Zero) `
                -Priority             1 `
                -AllowStartIfOnBatteries `
                -DontStopIfGoingOnBatteries

            Register-ScheduledTask `
                -TaskName  $Name `
                -Action    $action `
                -Trigger   @($trigLogon, $trigUnlock) `
                -Principal $principal `
                -Settings  $settings `
                -Force `
                -ErrorAction Stop | Out-Null

            return $true
        }
        catch {
            Write-TaskLog ("Cmdlet registration failed: " + $_.Exception.Message)
            return $false
        }
    }

    # --- Try v1.4 XML first, fallback to v1.2, then PowerShell cmdlets ---
    $taskRegistered = $false
    foreach ($ver in @("1.4", "1.2")) {
        $xmlContent = New-KioskTaskXml `
            -Version     $ver `
            -CurrentUser $CurrentUser `
            -PrincipalId $PrincipalId `
            -Command     $XmlCommand `
            -WorkingDir  $XmlWorkingDir

        # For .bat, inject the /c argument into the XML Actions block
        if ($FoundBat) {
            $escapedBat = [System.Security.SecurityElement]::Escape($FoundBat)
            $xmlContent = $xmlContent -replace `
                "(<Command>cmd\.exe</Command>)", `
                "`$1`n      <Arguments>/c `"$escapedBat`"</Arguments>"
        }

        $xmlContent | Out-File -Encoding Unicode $xmlPath

        $r = Invoke-Schtasks -Arguments @("/Create", "/TN", $TaskName, "/XML", $xmlPath, "/F")
        if ($r.ExitCode -eq 0) {
            Write-Host "  XML v$ver accepted by Task Scheduler." -ForegroundColor DarkGray
            $taskRegistered = $true
            break
        }

        $errTxt = ($r.Output | Out-String).Trim()
        Write-TaskLog "XML v$ver failed: $errTxt"
        Write-Host "  XML v$ver rejected ($errTxt). Trying next..." -ForegroundColor Yellow
    }

    # --- Fallback: use Register-ScheduledTask PowerShell cmdlet ---
    if (-not $taskRegistered) {
        Write-Host "  schtasks XML approach failed. Trying PowerShell Register-ScheduledTask..." -ForegroundColor Yellow
        Write-TaskLog "Falling back to Register-ScheduledTask cmdlet."

        $cmdletArgs = if ($FoundBat) { "/c `"$FoundBat`"" } else { "" }
        $taskRegistered = Register-KioskTaskViaCmdlet `
            -Command  $XmlCommand `
            -Args     $cmdletArgs `
            -WorkDir  $XmlWorkingDir `
            -User     $CurrentUser `
            -Name     $TaskName

        if ($taskRegistered) {
            Write-Host "  Register-ScheduledTask cmdlet succeeded." -ForegroundColor Green
            Write-TaskLog "Task registered via PowerShell cmdlet."
        } else {
            Handle-FatalError "All registration methods failed for task '$TaskName'. Check log: $($script:TaskLogPath)"
        }
    }

    # --- Verify task exists ---
    $q = Invoke-Schtasks -Arguments @("/Query", "/TN", $TaskName)
    if ($q.ExitCode -ne 0) {
        Handle-FatalError ("Task '$TaskName' not found after creation. Details: " + ($q.Output | Out-String).Trim())
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TASK CREATED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Task Name : $TaskName"
    Write-Host "  Runs      : RunKiosk.bat on Logon + Unlock"
    Write-Host "  Delay     : 0 seconds"
    Write-Host "  XML saved : $xmlPath"
    Write-Host "  Log file  : $($script:TaskLogPath)"
    Write-Host ""
    Write-Host "Open Task Scheduler and press F5 (Refresh) to see the new task." -ForegroundColor Yellow
    Write-Host ""

    Write-TaskLog "Task setup completed successfully. Task=$TaskName Target=$LaunchTarget"

    # --- Optional: Register B18 unlock task if B18.ps1 found ---
    $b18Candidates = @(
        (Join-Path $PROJECT_ROOT "B18.ps1"),
        (Join-Path $SCRIPT_ROOT  "B18.ps1"),
        (Join-Path $PROJECT_ROOT "scripts\B18.ps1")
    )
    $b18Path = $b18Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($b18Path) {
        Write-Host "Found B18.ps1 at: $b18Path  ->  Registering RunB18ScriptOnUnlock..." -ForegroundColor Cyan
        try {
            $b18Action    = New-ScheduledTaskAction -Execute "powershell.exe" `
                                -Argument "-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File `"$b18Path`""
            $b18Cim       = Get-CimClass -Namespace "Root/Microsoft/Windows/TaskScheduler" `
                                -ClassName "MSFT_TaskSessionStateChangeTrigger"
            $b18Trigger   = New-CimInstance -CimClass $b18Cim -Property @{ StateChange = 8 } -ClientOnly
            $b18Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser `
                                -LogonType InteractiveToken -RunLevel Highest
            Register-ScheduledTask -TaskName "RunB18ScriptOnUnlock" `
                -Action $b18Action -Trigger $b18Trigger -Principal $b18Principal -Force | Out-Null
            Write-Host "  RunB18ScriptOnUnlock task registered." -ForegroundColor Green
            Write-TaskLog "RunB18ScriptOnUnlock registered."
        }
        catch {
            Write-Warning "Could not register RunB18ScriptOnUnlock: $_"
            Write-TaskLog "Warning: RunB18ScriptOnUnlock failed: $_"
        }
    }
}
catch {
    Handle-FatalError $_.ToString()
}
