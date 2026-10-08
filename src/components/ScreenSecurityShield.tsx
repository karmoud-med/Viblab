import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldAlert, 
  VideoOff, 
  Lock, 
  Eye, 
  AlertTriangle, 
  Fingerprint, 
  CheckCircle2,
  Ban
} from 'lucide-react';
import { getCurrentUser } from '../services/authService';

interface ScreenSecurityShieldProps {
  enabled?: boolean;
  watermarkEnabled?: boolean;
  strictMode?: boolean; // When true, stays locked on blur until explicit user unlock
  customWatermarkText?: string;
}

export default function ScreenSecurityShield({
  enabled = true,
  watermarkEnabled = true,
  strictMode = true,
  customWatermarkText
}: ScreenSecurityShieldProps) {
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [shieldReason, setShieldReason] = useState<string>("Protection active");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'warning' | 'error' | 'info' } | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  
  const toastTimeoutRef = useRef<any>(null);
  const isHandlingResumeRef = useRef<boolean>(false);

  // Generate unique forensic session token on mount
  useEffect(() => {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ts = Date.now().toString(36).toUpperCase();
    setSessionToken(`SEC-${randomHex}-${ts}`);
  }, []);

  // Update dynamic forensic timestamp every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimestamp(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toast trigger
  const showToast = useCallback((text: string, type: 'warning' | 'error' | 'info' = 'warning') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Overwrite clipboard with confidential legal notice
  const wipeClipboard = useCallback(() => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(
          "⚠️ CONTENU VIBLAB PROTÉGÉ (OCP MS) — LA CAPTURE D'ÉCRAN ET L'ENREGISTREMENT VIDÉO SONT STRICTEMENT INTERDITS."
        ).catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Trigger shield immediately (0ms delay)
  const triggerShield = useCallback((reason: string) => {
    if (!enabled) return;
    setIsShieldActive(true);
    setShieldReason(reason);
    wipeClipboard();
  }, [enabled, wipeClipboard]);

  // Unlock shield handler
  const handleResume = useCallback(() => {
    isHandlingResumeRef.current = true;
    wipeClipboard();
    setIsShieldActive(false);
    showToast("Session reprise en mode sécurisé.", "info");
    setTimeout(() => {
      isHandlingResumeRef.current = false;
    }, 500);
  }, [wipeClipboard, showToast]);

  // Hook 1: Intercept WebRTC & Browser DisplayMedia Screen Recording (Loom, extensions, WebRTC recorders)
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const mediaDevices = navigator.mediaDevices as any;
      if (mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = mediaDevices.getDisplayMedia.bind(mediaDevices);
        mediaDevices.getDisplayMedia = async function(...args: any[]) {
          triggerShield("Tentative d'enregistrement d'écran détectée (API DisplayMedia / Extension)");
          showToast("Tentative d'enregistrement vidéo bloquée.", 'error');
          throw new DOMException(
            "L'enregistrement de l'écran est formellement interdit sur cette plateforme certifiée VibLab.",
            "NotAllowedError"
          );
        };

        return () => {
          mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        };
      }
    }
  }, [enabled, triggerShield, showToast]);

  // Hook 2: Keyboard shortcuts, PrintScreen, Win+Shift+S, Game Bar, Mac capture, DevTools
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. PrintScreen (Touche Impr. Écran)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Touche Impr. Écran (PrintScreen) interceptée.");
        showToast("Capture d'écran PrintScreen interceptée et bloquée.", 'error');
        return false;
      }

      // 2. Windows Snipping Tool (Win + Shift + S) or Meta/Ctrl/Alt + Shift + S
      if (e.shiftKey && (e.metaKey || e.ctrlKey || e.altKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Outil de capture Windows (Win+Shift+S) intercepté.");
        showToast("Raccourci de capture d'écran bloqué.", 'error');
        return false;
      }

      // 3. Windows Game Bar Screen Recording (Win + Alt + R / Win + Alt + G / Win + G)
      if (e.altKey && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Raccourci enregistrement vidéo (Win+Alt+R) intercepté.");
        showToast("Enregistrement vidéo d'écran interdit.", 'error');
        return false;
      }
      if (e.altKey && (e.key === 'g' || e.key === 'G' || e.code === 'KeyG')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Barre de jeu / Enregistrement (Win+Alt+G) intercepté.");
        return false;
      }

      // 4. macOS Screenshots & Screen Recording (Cmd + Shift + 3 / 4 / 5)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Raccourci de capture macOS intercepté.");
        showToast("Capture d'écran macOS bloquée.", 'error');
        return false;
      }

      // 5. Browser Web Capture (Ctrl + Shift + S in Edge / Firefox)
      if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield("Capture Web de navigateur (Ctrl+Shift+S) interceptée.");
        showToast("Capture d'écran bloquée.", 'error');
        return false;
      }

      // 6. Anti-Print (Ctrl + P / Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        wipeClipboard();
        showToast("L'impression de ce document est désactivée.", 'warning');
        return false;
      }

      // 7. Developer Tools Inspection (F12, Ctrl + Shift + I/J/C)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        showToast("Outils d'inspection et console désactivés.", 'warning');
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        showToast("Outils de développement restreints.", 'warning');
        return false;
      }

      // 8. View Source (Ctrl + U)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        showToast("L'affichage du code source est restreint.", 'warning');
        return false;
      }

      // 9. Save Page (Ctrl + S)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        showToast("L'enregistrement de la page est désactivé.", 'warning');
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Windows Snipping Tool often fires PrintScreen on keyup
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerShield("Détection touche PrintScreen (Impr. Écran).");
        showToast("Tentative de capture d'écran bloquée.", 'error');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [enabled, triggerShield, showToast, wipeClipboard]);

  // Hook 3: Instant Window Blur & Document Visibility Change (Snipping Tool & Recorder Activation)
  useEffect(() => {
    if (!enabled) return;

    const handleWindowBlur = () => {
      if (isHandlingResumeRef.current) return;

      // Check if user simply clicked inside an embedded iframe
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'IFRAME') {
        return;
      }

      // 0ms delay: Instant blackout shield!
      // When Win+Shift+S, OBS, or another window takes focus, this triggers immediately.
      triggerShield("Fenêtre inactive — Programme tiers, enregistreur ou outil de capture détecté.");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerShield("Changement d'onglet ou application en arrière-plan détecté.");
      }
    };

    const handleWindowFocus = () => {
      wipeClipboard();
      // In strict mode, we do NOT auto-hide the shield to ensure that any active screenshot snip
      // only captures the black screen, and user must deliberately resume.
      if (!strictMode && !isShieldActive) {
        setIsShieldActive(false);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, strictMode, isShieldActive, triggerShield, wipeClipboard]);

  // Prevent right click context menu & drag
  useEffect(() => {
    if (!enabled) return;
    const preventContext = (e: MouseEvent) => {
      // Allow right click if user is in an input field for copy/paste of their own text
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
    };

    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('dragstart', preventDrag);

    return () => {
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('dragstart', preventDrag);
    };
  }, [enabled]);

  const currentUser = getCurrentUser();
  const userIdentifier = customWatermarkText || currentUser?.email || currentUser?.fullName || 'mohammedkarmoud.ocpms@gmail.com';

  return (
    <>
      {/* 1. DISCRETE FORENSIC WATERMARK (SUBTLE, NON-INTRUSIVE) */}
      {enabled && watermarkEnabled && (
        <div 
          className="fixed inset-0 pointer-events-none z-[40] overflow-hidden select-none"
          style={{ opacity: 0.035 }}
          aria-hidden="true"
        >
          <div className="w-[140vw] h-[140vh] -ml-[20vw] -mt-[20vh] flex flex-wrap content-around justify-around rotate-[-22deg]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="p-8 text-center select-none"
              >
                <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-slate-500">
                  {userIdentifier}
                </div>
                <div className="font-mono text-[8px] text-slate-400">
                  VIBLAB • {sessionToken} • {currentTimestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TRANSIENT SECURITY NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border border-red-500/40 bg-[#0F1B2D]/95 text-white backdrop-blur-md animate-fadeIn max-w-md">
          <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Ban className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-red-300 block uppercase tracking-wider text-[10px]">
              Protection VibLab Active
            </span>
            <span className="text-slate-200 mt-0.5 block font-medium">
              {toastMessage.text}
            </span>
          </div>
        </div>
      )}

      {/* 3. IMPENETRABLE ZERO-TRANSPARENCY BLACKOUT SHIELD */}
      {isShieldActive && (
        <div 
          className="fixed inset-0 z-[999999] bg-[#070D18] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn cursor-default"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {/* Subtle background security matrix lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Main Shield Card */}
          <div className="relative z-10 max-w-lg w-full bg-[#0D1726] border border-[#23354E] rounded-2xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col items-center">
            
            {/* Pulsing Lock Icon */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <VideoOff className="w-8 h-8" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-mono font-semibold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bouclier Anti-Capture Déclenché</span>
            </div>

            {/* Header Title */}
            <h2 className="text-xl font-bold text-white tracking-tight">
              Contenu Protégé — Affichage Verrouillé
            </h2>

            {/* Reason Description */}
            <p className="text-xs text-[#94A3B8] mt-2.5 leading-relaxed text-center">
              {shieldReason}
            </p>

            {/* Warning Callout Box */}
            <div className="mt-5 w-full p-3.5 rounded-xl bg-[#09111E] border border-[#1E2D42] text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Rappel de conformité de sécurité VibLab</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Les captures d'écran (<code className="text-[#94A3B8] bg-[#142032] px-1 py-0.5 rounded font-mono">Win+Shift+S</code>, <code className="text-[#94A3B8] bg-[#142032] px-1 py-0.5 rounded font-mono">Impr. Écran</code>) et les logiciels tiers d'enregistrement (OBS, Windows Game Bar, Bandicam) sont strictement prohibés.
              </p>
              <div className="pt-2 border-t border-[#1E2D42]/60 flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-[#38BDF8]" />
                  <span>Traçabilité légale :</span>
                </span>
                <span className="text-[#94A3B8] font-semibold truncate max-w-[200px]">
                  {userIdentifier}
                </span>
              </div>
            </div>

            {/* Unlock / Resume Button */}
            <button
              onClick={handleResume}
              className="mt-6 w-full h-11 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Déverrouiller et reprendre la session</span>
            </button>

            <span className="text-[10px] text-[#475569] mt-3 font-mono">
              Session active : {sessionToken} • {currentTimestamp}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
