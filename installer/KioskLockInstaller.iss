; Inno Setup script for Kiosk Lock
; Startup is configured through Task Scheduler only.

[Setup]
AppId={{FA10CB18-D684-4AA3-8DB2-424BC8AA4E7C}
AppName=Kiosk Lock
AppVersion=1.0.0
AppPublisher=Kiosk Lock
DefaultDirName={localappdata}\Kiosk Lock
DefaultGroupName=Kiosk Lock
AllowNoIcons=yes
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=KioskLockSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayIcon={app}\kiosk_lock.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Dirs]
Name: "{localappdata}\..\LocalLow\Microsoft\KioskLock"
Name: "{localappdata}\..\LocalLow\Microsoft\KioskLock\logs"; Permissions: users-modify
Name: "{localappdata}\..\LocalLow\Microsoft\KioskLock\data"; Permissions: users-modify

[Files]
; Main Executables
Source: "..\dist\kiosk_lock.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\RunKiosk.bat"; DestDir: "{app}"; Flags: ignoreversion

; Support Scripts
Source: "..\scripts\kiosk_lock.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\scripts\setup_kiosk_task.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\scripts\post_install_validate.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion

; Internal Components
Source: "..\src\login_ui\dist\auth_login.exe"; DestDir: "{app}\src\login_ui\dist"; Flags: ignoreversion
Source: "..\src\login_ui\auth_login.py"; DestDir: "{app}\src\login_ui"; Flags: ignoreversion
Source: "..\src\monitor\reader.py"; DestDir: "{app}\src\monitor"; Flags: ignoreversion
Source: "..\src\monitor\dist\reader.exe"; DestDir: "{app}\src\monitor\dist"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Kiosk Lock"; Filename: "{app}\kiosk_lock.exe"; WorkingDir: "{app}"
Name: "{group}\Uninstall Kiosk Lock"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Kiosk Lock"; Filename: "{app}\kiosk_lock.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; 1. Create auto-start scheduled task (admin-elevated, visible terminal so user sees result)
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Description: "Registering Kiosk Auto-Start scheduled task..."; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\setup_kiosk_task.ps1"" -PauseOnError false"; \
    Flags: postinstall waituntilterminated runascurrentuser

; 2. Run validation script
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Description: "Validating installation..."; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\post_install_validate.ps1"" -InstallDir ""{app}"""; \
    Flags: postinstall waituntilterminated runhidden

; 3. Launch App (Optional)
Filename: "{app}\kiosk_lock.exe"; Description: "Launch Kiosk Lock now"; Flags: postinstall nowait skipifsilent unchecked

[UninstallRun]
; Clean up ALL Kiosk scheduled tasks on uninstall
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""Get-ScheduledTask -TaskName 'KioskAutoStart*' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false; Get-ScheduledTask -TaskName 'RunKioskOnUnlock_AllUsers' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false; Get-ScheduledTask -TaskName 'RunB18ScriptOnUnlock' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false"""; \
    Flags: runhidden waituntilterminated
