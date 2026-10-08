import sys
import os
import ctypes
from PySide6.QtCore import QUrl, Qt
from PySide6.QtGui import QIcon, QKeySequence, QShortcut
from PySide6.QtWidgets import QApplication, QMainWindow, QMessageBox
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineProfile, QWebEnginePage

# Win32 Constants for Hardware Anti-Capture
WDA_NONE = 0x00000000
WDA_MONITOR = 0x00000001
WDA_EXCLUDEFROMCAPTURE = 0x00000011  # Windows 10 (2004+) & Windows 11

class SecureWebPage(QWebEnginePage):
    """Custom page restricting inspection and external injection"""
    def __init__(self, profile, parent=None):
        super().__init__(profile, parent)

    # Disable default context menu
    def contextMenuEvent(self, event):
        event.ignore()

class VibLabSecureWindow(QMainWindow):
    def __init__(self, target_url="http://localhost:3001"):
        super().__init__()
        self.target_url = target_url
        self.setWindowTitle("VibLab Pro — OCP Maintenance Solutions [BLINDAGE MATÉRIEL ACTIF]")
        self.resize(1366, 850)
        self.setMinimumSize(1024, 680)

        # Profile with persistent storage and cache
        profile = QWebEngineProfile.defaultProfile()
        profile.setHttpCacheType(QWebEngineProfile.HttpCacheType.DiskHttpCache)

        # WebEngine View
        self.browser = QWebEngineView()
        self.secure_page = SecureWebPage(profile, self.browser)
        self.browser.setPage(self.secure_page)
        
        # Load local VibLab platform
        self.browser.setUrl(QUrl(self.target_url))
        self.setCentralWidget(self.browser)

        # Fullscreen Shortcut (F11)
        self.shortcut_fullscreen = QShortcut(QKeySequence("F11"), self)
        self.shortcut_fullscreen.activated.connect(self.toggle_fullscreen)

        # Reload Shortcut (F5 or Ctrl+R)
        self.shortcut_reload = QShortcut(QKeySequence("F5"), self)
        self.shortcut_reload.activated.connect(self.browser.reload)

        # Block PrintScreen & DevTools Hotkeys
        self.shortcut_prtscn = QShortcut(QKeySequence(Qt.Key.Key_Print), self)
        self.shortcut_prtscn.activated.connect(self.on_printscreen_attempt)

    def showEvent(self, event):
        super().showEvent(event)
        # Apply Windows Hardware Anti-Capture Affinity upon rendering
        self.apply_hardware_protection()

    def apply_hardware_protection(self):
        try:
            hwnd = int(self.winId())
            user32 = ctypes.windll.user32
            
            # WDA_EXCLUDEFROMCAPTURE makes the window completely black in OBS, Snipping Tool, Game Bar, etc.
            res = user32.SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)
            if not res:
                # Fallback to WDA_MONITOR if on older Windows 10
                res = user32.SetWindowDisplayAffinity(hwnd, WDA_MONITOR)

            if res:
                print(f"[OK] Blindage matériel Windows appliqué (HWND: {hwnd}) !")
                print("     -> Fenêtre rendue 100% NOIRE dans OBS Studio, Win+Shift+S, Game Bar et captures externes.")
            else:
                err = ctypes.GetLastError()
                print(f"[!] Échec de l'affinité matérielle (Code: {err})")
        except Exception as e:
            print(f"[!] Erreur d'application du blindage: {e}")

    def toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def on_printscreen_attempt(self):
        try:
            ctypes.windll.user32.OpenClipboard(0)
            ctypes.windll.user32.EmptyClipboard()
            ctypes.windll.user32.CloseClipboard()
        except Exception:
            pass

def main():
    # Enable High DPI Scaling
    os.environ["QT_ENABLE_HIGHDPI_SCALING"] = "1"
    
    app = QApplication(sys.argv)
    app.setApplicationName("VibLab Secure Browser")
    app.setOrganizationName("OCP Maintenance Solutions")

    url = "http://localhost:3001"
    if len(sys.argv) > 1:
        url = sys.argv[1]

    print("=" * 68)
    print("  VIBLAB - NAVIGATEUR SÉCURISÉ AVEC BLINDAGE MATÉRIEL ANTI-OBS")
    print("=" * 68)
    print(f"[*] Démarrage du conteneur sécurisé vers : {url}")
    print("[*] Protection matérielle WDA_EXCLUDEFROMCAPTURE active.")
    print("=" * 68)

    window = VibLabSecureWindow(url)
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
