import subprocess
import os
import sys

def main():
    # Determine the base directory
    if getattr(sys, 'frozen', False):
        # Running as a compiled EXE
        base_dir = os.path.dirname(sys.executable)
    else:
        # Running as a script
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the PowerShell script
    # The installer copies kiosk_lock.ps1 to {app}\scripts\kiosk_lock.ps1
    # So relative to the EXE in {app}, it is in scripts\kiosk_lock.ps1
    script_path = os.path.join(base_dir, "scripts", "kiosk_lock.ps1")
    
    # In the build environment (root), it is also in scripts\kiosk_lock.ps1
    
    if not os.path.exists(script_path):
        # Fallback for different build structures if necessary
        parent_dir = os.path.dirname(base_dir)
        script_path_fallback = os.path.join(parent_dir, "scripts", "kiosk_lock.ps1")
        if os.path.exists(script_path_fallback):
            script_path = script_path_fallback

    # Command to run PowerShell
    # -STA is required for the XAML UI
    # -WindowStyle Hidden helps prevent a console flash
    cmd = [
        "powershell.exe",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-STA",
        "-File", script_path
    ]
    
    # Use subprocess.CREATE_NO_WINDOW to ensure no console window appears
    result = subprocess.run(cmd, creationflags=0x08000000) # CREATE_NO_WINDOW
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
