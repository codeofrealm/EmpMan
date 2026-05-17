using System;
using System.Diagnostics;
using System.IO;

class KioskLauncher {
    static int Main() {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string scriptPath = Path.Combine(baseDir, "scripts", "kiosk_lock.ps1");
        
        if (!File.Exists(scriptPath)) {
            try {
                string parentDir = Directory.GetParent(baseDir).FullName;
                scriptPath = Path.Combine(parentDir, "scripts", "kiosk_lock.ps1");
            }
            catch {}
        }

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = "powershell.exe";
        psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -STA -File \"" + scriptPath + "\"";
        psi.UseShellExecute = false;
        psi.CreateNoWindow = true;
        
        try {
            using (Process process = Process.Start(psi)) {
                process.WaitForExit();
                return process.ExitCode;
            }
        }
        catch (Exception ex) {
            // Write error to system Application Log or console if running under debug
            Console.WriteLine("Error launching kiosk: " + ex.Message);
            return 1;
        }
    }
}
