import ctypes
import time
import sys

user32 = ctypes.windll.user32

# Win32 Constants
WDA_NONE = 0x00000000
WDA_MONITOR = 0x00000001
WDA_EXCLUDEFROMCAPTURE = 0x00000011 # Windows 10 version 2004+ / Windows 11

print("=" * 65)
print("  VIBLAB - BLINDAGE WINDOWS ANTI-CAPTURE & ANTI-OBS STUDIO")
print("=" * 65)
print("[*] Application de l'affinité matérielle WDA_EXCLUDEFROMCAPTURE...")
print("[*] Cette protection rend la fenêtre 100% NOIRE dans :")
print("    - OBS Studio (Capture d'écran et Capture de fenêtre)")
print("    - Windows Snipping Tool (Win + Shift + S)")
print("    - Touche Impr. Écran (PrintScreen)")
print("    - Windows Game Bar (Win + Alt + R)")
print("    - Discord / Zoom / Teams Screen Share")
print("=" * 65)

def get_window_titles():
    windows = []
    def enum_windows_proc(hwnd, _):
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value
                windows.append((hwnd, title))
        return True
    
    EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    user32.EnumWindows(EnumWindowsProc(enum_windows_proc), 0)
    return windows

def protect_windows():
    windows = get_window_titles()
    target_count = 0
    for hwnd, title in windows:
        lower = title.lower()
        # Look for VibLab, localhost:3001, localhost:3000, localhost:5173, Chrome, or Edge
        if any(keyword in lower for keyword in ["viblab", "localhost:3001", "localhost:3000", "3001"]):
            success = user32.SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)
            if not success:
                # Fallback to WDA_MONITOR
                success = user32.SetWindowDisplayAffinity(hwnd, WDA_MONITOR)
            if success:
                print(f"[OK] Protection active sur la fenetre: \"{title[:60]}\" (HWND: {hwnd})")
                target_count += 1
            else:
                err = ctypes.GetLastError()
                print(f"[!] Erreur sur \"{title[:60]}\": code {err}")
    return target_count

applied = protect_windows()
if applied == 0:
    print("[?] Aucune fenêtre 'VibLab' ou 'localhost:3001' trouvée actuellement.")
    print("    Assurez-vous que votre navigateur Chrome/Edge avec VibLab est ouvert.")
    print("[*] Surveillance en continu activée (Ctrl+C pour quitter)...")
    try:
        while True:
            protect_windows()
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nArrêt du moniteur.")
else:
    print(f"\n[SUCCÈS] {applied} fenêtre(s) protégée(s) avec succès !")
    print("[*] Surveillance en cours d'exécution pour maintenir la protection...")
    try:
        while True:
            protect_windows()
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nArrêt du moniteur.")
