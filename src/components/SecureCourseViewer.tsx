import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  Clock, 
  ShieldAlert, 
  Lock, 
  BookOpen, 
  RotateCcw,
  Check, 
  Copy, 
  Key, 
  RefreshCw,
  Eye,
  Info,
  Award
} from 'lucide-react';
import { CourseData, CourseModule, SecuritySettings, User } from '../types/course';
import { PASS } from './formation/formationData';
import { saveUserProgress } from '../services/sqliteDatabase';

interface SecureCourseViewerProps {
  course: CourseData;
  initialModuleIndex?: number;
  theme: 'dark' | 'light' | 'mono';
  onClose: () => void;
  securitySettings?: SecuritySettings;
  isTrainer?: boolean;
  currentUser?: User | null;
  onOpenQcm?: (moduleId: number) => void;
}

export default function SecureCourseViewer({
  course,
  initialModuleIndex = 0,
  theme,
  onClose,
  securitySettings = {
    antiInspection: true,
    antiScreenBlur: true,
    antiPrint: true,
    watermarkEnabled: true,
    watermarkUser: 'mohammedkarmoud.ocpms@gmail.com',
    watermarkOpacity: 0.05
  },
  isTrainer = true,
  currentUser,
  onOpenQcm
}: SecureCourseViewerProps) {
  // Navigation & Presentation State
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(initialModuleIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(1);
  const [totalSlides] = useState<number>(33); // 33 slides in Module 1
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  // Score Gating Checker: module idx is unlocked only if prev module passed with score >= PASS (85%)
  const isModuleUnlocked = useCallback((idx: number): boolean => {
    if (isTrainer) return true;
    if (idx === 0) return true;
    try {
      const qKey = `viblab_qcm_prog_v1_${currentUser?.id || 'guest'}`;
      const saved = localStorage.getItem(qKey);
      if (saved) {
        const prog = JSON.parse(saved);
        return Boolean(prog[idx]?.passed && (prog[idx]?.best || 0) >= PASS);
      }
    } catch (e) {}
    return false;
  }, [isTrainer, currentUser]);

  // Presenter Session Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Security States
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [securityToast, setSecurityToast] = useState<{ message: string; type: 'warning' | 'info' | 'blocked' } | null>(null);
  const [watermarkTimestamp, setWatermarkTimestamp] = useState<string>('');

  // Password / Standalone Helper State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [iframeBlobUrl, setIframeBlobUrl] = useState<string | null>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toastTimeoutRef = useRef<any>(null);

  const modules = course.modules && course.modules.length > 0 ? course.modules : [];
  const currentModule: CourseModule | undefined = modules[currentModuleIndex];

  // Presenter Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Watermark Live Timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWatermarkTimestamp(now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save student progress to SQLite database when slides are viewed
  useEffect(() => {
    if (currentUser?.id && currentModule?.id && !isTrainer) {
      const pct = Math.min(100, Math.round((currentSlideIndex / Math.max(1, totalSlides)) * 100));
      const completed = pct >= 85 || currentSlideIndex >= totalSlides;
      saveUserProgress(
        currentUser.id,
        currentModule.id,
        completed,
        pct,
        currentSlideIndex
      ).then(() => {
        window.dispatchEvent(new CustomEvent('viblab_progress_updated'));
      }).catch((e) => console.warn('SQLite progress sync err:', e));
    }
  }, [currentUser?.id, currentModule?.id, currentSlideIndex, totalSlides, isTrainer]);

  // Format Elapsed Time (HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Trigger brief alert toast
  const triggerToast = useCallback((message: string, type: 'warning' | 'info' | 'blocked' = 'blocked') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSecurityToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 3200);
  }, []);

  // Safe Module Navigation (Enforces QCM score requirement)
  const handleSelectModuleSafely = useCallback((idx: number) => {
    if (!isModuleUnlocked(idx)) {
      triggerToast(`🔒 Module ${idx + 1} verrouillé : Score d'au moins ${PASS} % requis au QCM du Module ${idx}.`, 'warning');
      return;
    }
    setCurrentModuleIndex(idx);
    setCurrentSlideIndex(1);
    setIsSidebarOpen(false);
  }, [isModuleUnlocked, triggerToast]);

  const handleNextModuleSafely = useCallback(() => {
    const nextIdx = currentModuleIndex + 1;
    if (nextIdx >= modules.length) return;
    if (!isModuleUnlocked(nextIdx)) {
      triggerToast(`🔒 Module ${nextIdx + 1} verrouillé : Réussissez le QCM du Module ${currentModuleIndex + 1} avec au moins ${PASS} % pour le débloquer.`, 'warning');
      return;
    }
    setCurrentModuleIndex(nextIdx);
    setCurrentSlideIndex(1);
  }, [currentModuleIndex, modules.length, isModuleUnlocked, triggerToast]);

  // Generate Isolated Sandboxed Blob URL for Standalone or Snippet HTML
  useEffect(() => {
    if (currentModule?.htmlUrl) {
      setIframeBlobUrl(currentModule.htmlUrl);
      return;
    }

    if (!currentModule?.htmlContent) {
      setIframeBlobUrl(null);
      return;
    }

    let rawHtml = currentModule.htmlContent;
    const isStandalone = /<!doctype|<html|<script|<head|<body/i.test(rawHtml);

    let fullHtml = rawHtml;
    if (!isStandalone) {
      fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 40px;
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      background: #0B1422;
      color: #E6EBF1;
      line-height: 1.6;
      -webkit-user-select: none;
      user-select: none;
    }
    h1, h2, h3, h4 { color: #FFFFFF; font-weight: 600; }
    code, pre { font-family: 'IBM Plex Mono', monospace; }
  </style>
</head>
<body>
  ${rawHtml}
</body>
</html>`;
    }

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentModule, iframeReloadKey]);

  // Fullscreen helper
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsBrowserFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Advance to next slide inside the embedded HTML presentation
  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex(prev => Math.min(totalSlides, prev + 1));
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;

      const triggerInDoc = (doc: Document, win: Window) => {
        let clicked = false;
        const nextSelectors = [
          '.btn.next',
          'button.btn.next',
          'button.next',
          '.btn-next',
          '[data-action="next"]',
          '.navigation .next',
          '.controls .navigate-right',
          'button[aria-label*="next" i]',
          'button[aria-label*="suivant" i]',
          'button[title*="suivant" i]',
          '.nav-btn.next'
        ];

        for (const sel of nextSelectors) {
          const btn = doc.querySelector(sel) as HTMLElement | null;
          if (btn && typeof btn.click === 'function') {
            btn.click();
            clicked = true;
            break;
          }
        }

        const eventOpts: KeyboardEventInit = {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          which: 39,
          bubbles: true,
          cancelable: true,
          view: win
        };
        const downEvent = new KeyboardEvent('keydown', eventOpts);
        const upEvent = new KeyboardEvent('keyup', eventOpts);

        doc.dispatchEvent(downEvent);
        doc.dispatchEvent(upEvent);
        win.dispatchEvent(downEvent);
        win.dispatchEvent(upEvent);

        return clicked;
      };

      if (iframeDoc && iframeWin) {
        triggerInDoc(iframeDoc, iframeWin);
        try {
          const childFrames = iframeDoc.querySelectorAll('iframe');
          childFrames.forEach((cf) => {
            try {
              if (cf.contentDocument && cf.contentWindow) {
                triggerInDoc(cf.contentDocument, cf.contentWindow);
              }
            } catch (e) {}
          });
        } catch (e) {}
      }

      iframe.focus();
    } catch (err) {
      console.warn('Error advancing slide:', err);
    }
  }, [totalSlides]);

  // Return to previous slide inside the embedded HTML presentation
  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex(prev => Math.max(1, prev - 1));
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;

      const triggerInDoc = (doc: Document, win: Window) => {
        let clicked = false;
        const prevSelectors = [
          '.btn.prev',
          'button.btn.prev',
          'button.prev',
          '.btn-prev',
          '[data-action="prev"]',
          '.navigation .prev',
          '.controls .navigate-left',
          'button[aria-label*="prev" i]',
          'button[aria-label*="précédent" i]',
          'button[title*="précédent" i]',
          '.nav-btn.prev'
        ];

        for (const sel of prevSelectors) {
          const btn = doc.querySelector(sel) as HTMLElement | null;
          if (btn && typeof btn.click === 'function') {
            btn.click();
            clicked = true;
            break;
          }
        }

        const eventOpts: KeyboardEventInit = {
          key: 'ArrowLeft',
          code: 'ArrowLeft',
          keyCode: 37,
          which: 37,
          bubbles: true,
          cancelable: true,
          view: win
        };
        const downEvent = new KeyboardEvent('keydown', eventOpts);
        const upEvent = new KeyboardEvent('keyup', eventOpts);

        doc.dispatchEvent(downEvent);
        doc.dispatchEvent(upEvent);
        win.dispatchEvent(downEvent);
        win.dispatchEvent(upEvent);

        return clicked;
      };

      if (iframeDoc && iframeWin) {
        triggerInDoc(iframeDoc, iframeWin);
        try {
          const childFrames = iframeDoc.querySelectorAll('iframe');
          childFrames.forEach((cf) => {
            try {
              if (cf.contentDocument && cf.contentWindow) {
                triggerInDoc(cf.contentDocument, cf.contentWindow);
              }
            } catch (e) {}
          });
        } catch (e) {}
      }

      iframe.focus();
    } catch (err) {
      console.warn('Error returning to prev slide:', err);
    }
  }, []);

  // Keyboard navigation & Security Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
          return;
        }
        if (showPasswordModal) {
          setShowPasswordModal(false);
          return;
        }
        if (isShieldActive) {
          setIsShieldActive(false);
          return;
        }
        onClose();
        return;
      }

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // Shift/Ctrl + Arrow => Module Navigation
      if ((e.ctrlKey || e.shiftKey) && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
        e.preventDefault();
        handleNextModuleSafely();
        return;
      }
      if ((e.ctrlKey || e.shiftKey) && (e.key === 'ArrowLeft' || e.key === 'PageUp')) {
        e.preventDefault();
        setCurrentModuleIndex((prev) => Math.max(0, prev - 1));
        setCurrentSlideIndex(1);
        return;
      }

      // Standard ArrowRight / ArrowLeft / Spacebar => Advance Slide
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
        return;
      } 
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevSlide();
        return;
      }

      // R key => Reload slide/module
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        setIframeReloadKey(k => k + 1);
        setCurrentSlideIndex(1);
        triggerToast("Diapositive réinitialisée", "info");
        return;
      }

      // F key => Toggle Fullscreen
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
        toggleBrowserFullscreen();
        return;
      }

      // PrintScreen & Snipping Tool (Win+Shift+S / PrtScn / Cmd+Shift+3/4/5)
      if (
        e.key === 'PrintScreen' || 
        e.keyCode === 44 || 
        (e.shiftKey && (e.metaKey || e.ctrlKey || e.altKey) && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) ||
        (e.altKey && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) || // Win+Alt+R Game Bar record
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) // Mac capture/record
      ) {
        if (securitySettings.antiScreenBlur) {
          e.preventDefault();
          e.stopPropagation();
          setIsShieldActive(true);
          try {
            navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
          } catch (err) {}
          triggerToast("Capture ou enregistrement d'écran intercepté. Affichage verrouillé.", 'warning');
          return false;
        }
      }

      if (!securitySettings.antiInspection) return;

      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        triggerToast("Touche F12 désactivée : Outils d'inspection restreints.", 'blocked');
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        triggerToast("Console et outils d'inspection désactivés.", 'blocked');
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        triggerToast("Affichage du code source désactivé.", 'blocked');
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        try {
          navigator.clipboard.writeText("⚠️ IMPRESSION INTERDITE — VIBLAB OCP MS");
        } catch (err) {}
        triggerToast("Impression désactivée.", 'blocked');
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        if (securitySettings.antiScreenBlur) {
          setIsShieldActive(true);
          try {
            navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
          } catch (err) {}
          triggerToast("Détection PrintScreen. Contenu protégé.", 'warning');
        }
      }
    };

    // Instant 0ms window blur shield (Snipping Tool & external recorders steal focus)
    const handleWindowBlur = () => {
      if (!securitySettings.antiScreenBlur) return;
      if (document.activeElement === iframeRef.current) return;
      setIsShieldActive(true);
      try {
        navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
      } catch (err) {}
    };

    const handleWindowFocus = () => {
      if (isShieldActive && securitySettings.antiScreenBlur) {
        try {
          navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
        } catch (err) {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && securitySettings.antiScreenBlur) {
        setIsShieldActive(true);
        try {
          navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
        } catch (err) {}
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [modules.length, isSidebarOpen, showPasswordModal, isShieldActive, onClose, handleNextSlide, handlePrevSlide, securitySettings, triggerToast]);

  // Hook security into iframe on load
  const handleIframeLoad = () => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      const iframeWin = iframeRef.current?.contentWindow;
      if (iframeDoc && iframeWin) {
        iframeDoc.addEventListener('contextmenu', (e) => {
          if (securitySettings.antiInspection) {
            e.preventDefault();
          }
        });

        const handleIframeKey = (e: KeyboardEvent) => {
          if (
            e.key === 'PrintScreen' || 
            e.keyCode === 44 || 
            (e.shiftKey && (e.metaKey || e.ctrlKey || e.altKey) && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) ||
            (e.altKey && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) ||
            (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
          ) {
            if (securitySettings.antiScreenBlur) {
              e.preventDefault();
              e.stopPropagation();
              setIsShieldActive(true);
              try {
                navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
              } catch (err) {}
              triggerToast("Capture ou enregistrement d'écran intercepté. Contenu protégé.", 'warning');
            }
          }
          if ((e.ctrlKey || e.shiftKey) && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
            e.preventDefault();
            handleNextModuleSafely();
          } else if ((e.ctrlKey || e.shiftKey) && (e.key === 'ArrowLeft' || e.key === 'PageUp')) {
            e.preventDefault();
            setCurrentModuleIndex((prev) => Math.max(0, prev - 1));
            setCurrentSlideIndex(1);
          } else if (e.key === 'Escape') {
            onClose();
          }
        };

        iframeDoc.addEventListener('keydown', handleIframeKey);
        iframeDoc.addEventListener('keyup', handleIframeKey);

        iframeWin.addEventListener('blur', () => {
          if (!securitySettings.antiScreenBlur) return;
          setIsShieldActive(true);
          try {
            navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS — CAPTURE ET ENREGISTREMENT STRICTEMENT INTERDITS.");
          } catch (err) {}
        });
      }
    } catch (err) {}
  };

  const watermarkOpacity = securitySettings.watermarkOpacity || 0.04;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen flex flex-col select-none overflow-hidden bg-[#0B1422] text-[#E6EBF1] font-sans"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* 1. SUBTLE FORENSIC WATERMARK */}
      {securitySettings.watermarkEnabled && (
        <div 
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden flex flex-wrap items-center justify-around select-none"
          style={{ opacity: watermarkOpacity, userSelect: 'none' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="p-12 text-center whitespace-nowrap leading-relaxed transform rotate-[-20deg]">
              <span className="font-mono font-bold text-xs uppercase tracking-wider block text-white/50">
                {securitySettings.watermarkUser || 'mohammedkarmoud.ocpms@gmail.com'}
              </span>
              <span className="font-mono text-[9px] block text-white/40">
                VIBLAB • OCP MS • {watermarkTimestamp}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 2. ANTI-SCREEN CAPTURE & RECORDING BLACKOUT SHIELD (100% OPAQUE) */}
      {isShieldActive && securitySettings.antiScreenBlur && (
        <div 
          className="absolute inset-0 z-[999] bg-[#070D18] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn cursor-default"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <div className="max-w-md w-full bg-[#0D1726] border border-[#23354E] rounded-2xl p-7 shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
              <Lock className="w-7 h-7" />
            </div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-red-400 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              Protection Anti-Capture & Enregistrement Active
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mt-3">
              Contenu du cours verrouillé
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mt-2 leading-relaxed">
              Une tentative de capture d'écran (<code className="text-[#E2E8F0] font-mono">Win+Shift+S</code>, <code className="text-[#E2E8F0] font-mono">PrintScreen</code>) ou une perte de focus liée à un programme tiers (OBS, Game Bar) a été détectée.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-[#09111E] border border-[#1E2D42] w-full text-[11px] text-[#64748B] text-left">
              <span className="text-[#94A3B8] font-semibold block mb-0.5">Empreinte légale active :</span>
              <span className="font-mono text-[10px] text-slate-400 break-all">
                {securitySettings.watermarkUser || 'mohammedkarmoud.ocpms@gmail.com'} • {watermarkTimestamp}
              </span>
            </div>
            <button 
              onClick={() => {
                setIsShieldActive(false);
                try {
                  navigator.clipboard.writeText("⚠️ CONTENU VIBLAB PROTÉGÉ PAR LICENCE OCP MS");
                } catch (e) {}
              }}
              className="mt-5 w-full h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-white" />
              <span>Reprendre la visualisation sécurisée</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[70] bg-[#0B1422]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-lg border border-[#1C2A3D] bg-[#111D2E] text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C2A3D] pb-3">
              <div className="flex items-center gap-2 text-[#E8A317] font-semibold text-sm">
                <Key className="w-4 h-4" />
                <span>Accès Module Standalone</span>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-[#8A929C] hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A9B4C2] leading-relaxed">
              Ce module est un fichier HTML autonome. Le script d'extraction s'exécute dans le lecteur pour afficher la présentation.
            </p>

            {currentModule?.password ? (
              <div className="p-3.5 rounded-lg border border-[#E8A317]/40 bg-[#E8A317]/10 space-y-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#E8A317] block">
                  Mot de passe du support :
                </span>
                <div className="flex items-center justify-between gap-2 p-2 bg-[#0B1422] rounded-md border border-[#1C2A3D] font-mono text-xs">
                  <span className="text-[#E8A317] font-bold">{currentModule.password}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentModule.password || '');
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                      triggerToast("Mot de passe copié dans le presse-papier", "info");
                    }}
                    className="px-2.5 py-1 bg-[#0F1B2D] hover:bg-[#152338] border border-[#2A3B52] text-white rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPassword ? <Check className="w-3 h-3 text-[#1E7A4F]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPassword ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#1C2A3D] bg-[#0B1422] text-xs text-[#8A929C]">
                <span>Aucun mot de passe enregistré pour ce module.</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setIframeReloadKey((k) => k + 1);
                  triggerToast("Rechargement du module...", "info");
                }}
                className="text-xs text-[#8A929C] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#E8A317]" />
                <span>Recharger le module</span>
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="h-8 px-4 bg-[#0F1B2D] hover:bg-[#152338] border border-[#2A3B52] text-white text-xs font-medium rounded-md cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY TOAST NOTIFICATION */}
      {securityToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-md shadow-2xl flex items-center gap-2 text-xs font-medium backdrop-blur-md border ${
          securityToast.type === 'warning'
            ? 'bg-[#111D2E] text-[#E8A317] border-[#E8A317]/50'
            : securityToast.type === 'info'
              ? 'bg-[#111D2E] text-white border-[#1C2A3D]'
              : 'bg-[#111D2E] text-[#B42318] border-[#B42318]/50'
        }`}>
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#E8A317]" />
          <span>{securityToast.message}</span>
        </div>
      )}

      {/* 5. FULL-SCREEN COURSE IFRAME — just the course content */}
      <div className="flex-1 w-full relative overflow-hidden">
        {iframeBlobUrl ? (
          <iframe
            ref={iframeRef}
            key={`${currentModule?.id}_${iframeReloadKey}`}
            src={iframeBlobUrl}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads-prevented"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            className="absolute inset-0 w-full h-full border-0 bg-transparent"
            onLoad={handleIframeLoad}
            title={currentModule?.title}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-[#7F8B9A] space-y-2">
            <BookOpen className="w-10 h-10 opacity-30 animate-pulse" />
            <p className="text-xs font-mono">Chargement du support pédagogique...</p>
          </div>
        )}
      </div>

      {/* 6. FLOATING CONTROL BAR — minimal overlay at top */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 bg-gradient-to-b from-[#0B1422]/90 via-[#0B1422]/60 to-transparent pointer-events-none select-none">
        {/* Left: Quitter + Module info */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] text-[#A9B4C2] hover:text-white bg-[#0B1422]/70 hover:bg-[#111D2E] border border-[#1C2A3D]/60 backdrop-blur-sm transition-colors cursor-pointer"
            title="Quitter le lecteur (Échap)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Quitter</span>
          </button>
          <span className="text-[13px] font-medium text-white/80 truncate max-w-md hidden sm:block">
            {currentModule?.title}
          </span>
        </div>

        {/* Right: Module switcher pills + actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Module switcher pills */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-[#0B1422]/70 border border-[#1C2A3D]/60 rounded-lg backdrop-blur-sm">
            {modules.map((m, idx) => {
              const isUnlocked = isModuleUnlocked(idx);
              const isCurrent = idx === currentModuleIndex;
              return (
                <button
                  key={m.id || idx}
                  onClick={() => handleSelectModuleSafely(idx)}
                  title={
                    isUnlocked
                      ? `Module ${idx + 1} : ${m.title}`
                      : `Module ${idx + 1} verrouillé (Score ≥ ${PASS} % requis)`
                  }
                  className={`w-7 h-6 rounded text-xs font-mono font-medium transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-[#E8A317] text-[#0B1422] font-semibold shadow-xs'
                      : isUnlocked
                        ? 'text-[#7F8B9A] hover:text-white hover:bg-[#1C2A3D]/60'
                        : 'text-[#4A5568] bg-[#0E1624] opacity-50 hover:opacity-100 hover:text-[#E8A317]'
                  }`}
                >
                  {!isUnlocked && !isTrainer ? (
                    <Lock className="w-2.5 h-2.5 text-[#8A929C]" />
                  ) : (
                    idx + 1
                  )}
                </button>
              );
            })}
          </div>

          {/* Password helper */}
          {currentModule?.password && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] text-[#E8A317] bg-[#0B1422]/70 hover:bg-[#111D2E] border border-[#1C2A3D]/60 backdrop-blur-sm transition-colors cursor-pointer"
              title="Voir le mot de passe du module"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mot de passe</span>
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleBrowserFullscreen}
            className="w-8 h-8 rounded-md bg-[#0B1422]/70 border border-[#1C2A3D]/60 backdrop-blur-sm flex items-center justify-center text-[#A9B4C2] hover:text-white hover:bg-[#111D2E] transition-colors cursor-pointer"
            title={isBrowserFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
