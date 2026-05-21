# ================= REBUILD ALL KIOSK COMPONENTS AND INSTALLER =================
$ErrorActionPreference = "Stop"

function Resolve-ScriptRoot {
    if ($PSScriptRoot -and $PSScriptRoot.Trim().Length -gt 0) {
        return $PSScriptRoot
    }
    return (Get-Location).Path
}

$SCRIPT_ROOT = Resolve-ScriptRoot
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_ROOT

function Stop-RunningBuildTargets {
    param(
        [Parameter(Mandatory = $true)][string[]]$TargetPaths
    )

    $normalizedTargets = $TargetPaths |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        ForEach-Object {
            try {
                [System.IO.Path]::GetFullPath($_).ToLowerInvariant()
            }
            catch {
                $_.ToLowerInvariant()
            }
        } |
        Select-Object -Unique

    if (-not $normalizedTargets) {
        return
    }

    foreach ($proc in Get-CimInstance Win32_Process) {
        $procPath = $proc.ExecutablePath
        if ([string]::IsNullOrWhiteSpace($procPath)) {
            continue
        }

        $normalizedProcPath = try {
            [System.IO.Path]::GetFullPath($procPath).ToLowerInvariant()
        }
        catch {
            $procPath.ToLowerInvariant()
        }

        if ($normalizedTargets -notcontains $normalizedProcPath) {
            continue
        }

        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Host (">>> Stopped running process: {0} (PID {1})" -f $proc.Name, $proc.ProcessId) -ForegroundColor Yellow
        }
        catch {
            throw "Failed to stop locked process '$($proc.Name)' (PID $($proc.ProcessId)): $($_.Exception.Message)"
        }
    }
}

$readerExePath = Join-Path $PROJECT_ROOT "src\monitor\dist\reader.exe"
$authExePath = Join-Path $PROJECT_ROOT "src\login_ui\dist\auth_login.exe"
$kioskExePath = Join-Path $PROJECT_ROOT "dist\kiosk_lock.exe"

Write-Host ">>> Starting Full Rebuild of Kiosk Lock..." -ForegroundColor Cyan

# 1. Ensure PyInstaller and required modules are installed
Write-Host ">>> Checking and Installing Python Dependencies..." -ForegroundColor Cyan
& pip install --disable-pip-version-check pyinstaller psutil psycopg2-binary pywin32
if ($LASTEXITCODE -ne 0) {
    Write-Warning "pip install dependencies failed. Attempting build anyway..."
}

# 2. Stop running kiosk executables that would lock build outputs
Write-Host ">>> Stopping running kiosk processes if needed..." -ForegroundColor Cyan
Stop-RunningBuildTargets -TargetPaths @($readerExePath, $authExePath, $kioskExePath)

# 3. Build Reader Executable
Write-Host ">>> Building Reader Executable..." -ForegroundColor Cyan
Push-Location (Join-Path $PROJECT_ROOT "src\monitor")
try {
    & pyinstaller --clean -y reader.spec
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Reader Executable."
    }
}
finally {
    Pop-Location
}

# 4. Build Auth Executable
Write-Host ">>> Building Auth Executable..." -ForegroundColor Cyan
Push-Location (Join-Path $PROJECT_ROOT "src\login_ui")
try {
    & pyinstaller --clean -y auth_login.spec
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Auth Executable."
    }
}
finally {
    Pop-Location
}

# 5. Build Kiosk Lock wrapper (Natively compiled in C# for zero-delay and absolute DLL safety)
Write-Host ">>> Building Native Kiosk Lock Executable (C#)..." -ForegroundColor Cyan
try {
    # Ensure dist folder exists
    $distFolder = Join-Path $PROJECT_ROOT "dist"
    if (-not (Test-Path $distFolder)) {
        New-Item -Path $distFolder -ItemType Directory -Force | Out-Null
    }
    
    # Run the native C# compiler (csc.exe) to create dist\kiosk_lock.exe
    $cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    $sourceFile = Join-Path $PROJECT_ROOT "kiosk_lock.cs"
    $outputExe = Join-Path $distFolder "kiosk_lock.exe"
    
    & $cscPath /target:winexe /out:$outputExe $sourceFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to compile Native C# Kiosk Lock Executable."
    }
    Write-Host ">>> Successfully compiled native kiosk_lock.exe!" -ForegroundColor Green
}
catch {
    throw "Failed to build Kiosk Lock Executable. Details: $_"
}

# 6. Build Installer
Write-Host ">>> Building Installer..." -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File (Join-Path $SCRIPT_ROOT "build_installer.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to build Final Installer."
}

Write-Host ">>> Full Rebuild Completed Successfully!" -ForegroundColor Green
