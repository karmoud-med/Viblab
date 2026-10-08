import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Disc, 
  Settings, 
  Zap, 
  Wind, 
  Scale, 
  HelpCircle, 
  Info, 
  Sliders, 
  Layers, 
  Calculator,
  Sun,
  Moon,
  Contrast,
  LayoutGrid,
  Radio,
  Compass,
  ShieldQuestion,
  FileText,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  Maximize2,
  Minimize2,
  GraduationCap,
  ShieldCheck,
  Tv,
  LogOut,
  User as UserIcon,
  Trophy,
  UserCheck
} from 'lucide-react';
import { getCurrentUser, getActiveViewMode, setActiveViewMode, logout, subscribeAuth, ViewMode } from './services/authService';
import LoginPage from './components/LoginPage';
import WaveformPhaseSimulator from './components/WaveformPhaseSimulator';
import SignalGenerator from './components/SignalGenerator';
import BearingModule from './components/BearingModule';
import GearModule from './components/GearModule';
import MotorModule from './components/MotorModule';
import PumpFanModule from './components/PumpFanModule';
import UnbalanceModule from './components/UnbalanceModule';
import LoosenessMisalignmentResonance from './components/LoosenessMisalignmentResonance';
import UnitConverter from './components/UnitConverter';
import VibrationIntroAsset3D from './components/VibrationIntroAsset3D';
import BeltPulleyModule from './components/BeltPulleyModule';
import PhaseAnalysisModule from './components/PhaseAnalysisModule';
import MysteryChallengeModule from './components/MysteryChallengeModule';
import BearingCalcModule from './components/BearingCalcModule';
import IsoSeverityModule from './components/IsoSeverityModule';
import ExpertReportModule from './components/ExpertReportModule';
import SignatureGlossary from './components/SignatureGlossary';
import VibrationCourseModule from './components/VibrationCourseModule';
import SessionAttendanceManager from './components/SessionAttendanceManager';
import ScreenSecurityShield from './components/ScreenSecurityShield';

type TabType = 
  | 'intro_3d'
  | 'relations' 
  | 'generator' 
  | 'bearings' 
  | 'gears' 
  | 'motors' 
  | 'turbines' 
  | 'balancing' 
  | 'structure' 
  | 'converter'
  | 'belts'
  | 'phase_analysis'
  | 'mystery_challenge'
  | 'bearing_calc'
  | 'iso_severity'
  | 'expert_report'
  | 'signature_glossary'
  | 'course_hub'
  | 'sessions_attendance';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('course_hub');
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [viewMode, setViewMode] = useState<ViewMode>(() => getActiveViewMode());
  const [isCourseFullScreen, setIsCourseFullScreen] = useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);

  const [theme, setTheme] = useState<'dark' | 'light' | 'mono'>(() => {
    try {
      const saved = localStorage.getItem('viblab_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    const unsub = subscribeAuth((user, mode) => {
      setCurrentUser(user);
      setViewMode(mode);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleTabNavigate = (e: any) => {
      if (e.detail) {
        handleSelectTab(e.detail as TabType);
      }
    };
    window.addEventListener('viblab_navigate_tab', handleTabNavigate);
    return () => window.removeEventListener('viblab_navigate_tab', handleTabNavigate);
  }, []);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Native fullscreen toggle error:', err);
    }
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('viblab_theme', next);
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setViewMode('eleve');
  };

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId !== 'course_hub') {
      setIsCourseFullScreen(false);
    }
  };

  // Primary Landing Page: If unauthenticated, show LoginPage as root portal
  if (!currentUser) {
    return (
      <>
        <ScreenSecurityShield 
          enabled={true}
          watermarkEnabled={false}
          strictMode={true}
          customWatermarkText="PORTAIL VIBLAB OCP MS — ACCÈS RESTREINT"
        />
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setViewMode(user.role);
            setActiveTab('course_hub');
          }}
          theme={theme}
          onCycleTheme={cycleTheme}
        />
      </>
    );
  }

  const courseHubLabel = 
    viewMode === 'admin' 
      ? 'Gestion Admin & SQLite' 
      : (viewMode === 'formateur' ? 'Cockpit Formateur' : 'Parcours certifiant');

  const isTrainerOrAdmin = viewMode === 'admin' || viewMode === 'formateur';

  const tabs = [
    { id: 'course_hub', label: courseHubLabel, icon: viewMode === 'admin' ? ShieldCheck : (viewMode === 'formateur' ? Tv : BookOpen), category: 'Espace Pédagogique' },
    ...(isTrainerOrAdmin ? [
      { id: 'sessions_attendance', label: 'Émargement & Modèle 5', icon: UserCheck, category: 'Espace Pédagogique' }
    ] : []),
    { id: 'intro_3d', label: 'Intro & Asset 3D', icon: LayoutGrid, category: 'Fondamentaux' },
    { id: 'relations', label: 'Relations Physiques', icon: Sliders, category: 'Fondamentaux' },
    { id: 'generator', label: 'Signaux & FFT', icon: Activity, category: 'Fondamentaux' },
    { id: 'converter', label: 'Conversion Unités', icon: Calculator, category: 'Fondamentaux' },
    { id: 'bearings', label: 'Roulements à billes', icon: Zap, category: 'Défauts Machines' },
    { id: 'gears', label: 'Engrenages & GMF', icon: Disc, category: 'Défauts Machines' },
    { id: 'motors', label: 'Moteurs Induction', icon: Settings, category: 'Défauts Machines' },
    { id: 'turbines', label: 'Pompes & Ventilo.', icon: Wind, category: 'Défauts Machines' },
    { id: 'balancing', label: 'Balourd & Vecteurs', icon: Scale, category: 'Défauts Machines' },
    { id: 'structure', label: 'Structure & Jeu', icon: Layers, category: 'Défauts Machines' },
    { id: 'belts', label: 'Poulies & Courroies', icon: Radio, category: 'Défauts Machines' },
    { id: 'phase_analysis', label: 'Analyse de Phase', icon: Compass, category: 'Défauts Machines' },
    { id: 'mystery_challenge', label: 'Défi Machine Mystère', icon: ShieldQuestion, category: 'Expertise & Diagnostic' },
    { id: 'bearing_calc', label: 'Calculateur Roulement', icon: FileText, category: 'Expertise & Diagnostic' },
    { id: 'iso_severity', label: 'Sévérité ISO 10816-3', icon: ShieldAlert, category: 'Expertise & Diagnostic' },
    { id: 'expert_report', label: 'Rapport d\'Expertise', icon: ClipboardList, category: 'Expertise & Diagnostic' },
    { id: 'signature_glossary', label: 'Glossaire des Signatures', icon: BookOpen, category: 'Expertise & Diagnostic' },
  ] as const;

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isLight ? 'bg-[#F6F5F1] text-[#1C2733]' : 'bg-[#080D1A] text-slate-100'
    }`}>
      <ScreenSecurityShield 
        enabled={true}
        watermarkEnabled={false}
        strictMode={false}
      />
      {/* VibLab Top Shell Header (60px) */}
      <header className={`h-[60px] border-b flex items-center justify-between px-5 sticky top-0 z-50 shrink-0 transition-colors ${
        isCourseFullScreen && activeTab === 'course_hub' ? 'hidden' : 'flex'
      } ${
        isLight ? 'bg-white border-[#E3E1DA]' : 'bg-[#0D1526] border-slate-800/80'
      }`}>
        {/* Left: EXACT Vector Logo Preserved + Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* EXACT ORIGINAL VIBLAB PRO LOGO */}
            <div className={`relative w-9 h-9 border-2 text-blue-600 rounded-xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 ${
              isLight ? 'bg-blue-50/80 border-blue-400' : 'bg-blue-950/40 border-blue-500'
            }`}>
              <svg className="w-7 h-7 text-blue-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="42" stroke="rgba(15,23,42,0.12)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="28" stroke="rgba(15,23,42,0.08)" strokeWidth="1" />
                <path d="M15 50 Q 32.5 15, 50 50 T 85 50" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 50 Q 32.5 85, 50 50 T 85 50" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <circle cx="50" cy="50" r="2.5" fill="#16A34A" className="animate-ping" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-[17px] leading-none tracking-tight uppercase font-sans ${
                  isLight ? 'text-black' : 'text-white'
                }`}>
                  VIB<span className="text-[#2563EB]">LAB</span>
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white bg-[#DC2626] uppercase shadow-xs">
                  PRO
                </span>
              </div>
              <span className={`text-[8.5px] font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap ${
                isLight ? 'text-[#475569]' : 'text-slate-400'
              }`}>
                OCP MAINTENANCE SOLUTIONS • ISO 18436
              </span>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className={`hidden md:flex items-center gap-2 text-[13px] pl-3 border-l ${
            isLight ? 'text-[#5B6675] border-[#E3E1DA]' : 'text-slate-400 border-slate-800'
          }`}>
            <span>Espace pédagogique</span>
            <span className={isLight ? 'text-[#B8B5AC]' : 'text-slate-600'}>/</span>
            <span className={`font-medium ${isLight ? 'text-[#0F1B2D]' : 'text-white'}`}>
              {activeTab === 'course_hub' 
                ? (viewMode === 'formateur' ? 'Cockpit formateur' : (viewMode === 'admin' ? 'Gestion Admin & SQLite' : 'Parcours certifiant'))
                : (tabs.find(t => t.id === activeTab)?.label || 'Module')}
            </span>
          </div>
        </div>

        {/* Right Shell Controls */}
        <div className="flex items-center gap-3">
          {/* Segmented Role Switcher: Admin | Formateur | Élève */}
          <div className={`flex p-0.5 border rounded-lg gap-0.5 text-[13px] font-medium ${
            isLight ? 'bg-[#F0EFEA] border-[#E3E1DA]' : 'bg-[#131F38] border-slate-700/80'
          }`}>
            <button
              onClick={() => {
                setActiveViewMode('admin');
                handleSelectTab('course_hub');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? isLight
                    ? 'bg-white text-[#0F1B2D] shadow-[0_1px_2px_rgba(15,27,45,0.12)] font-semibold'
                    : 'bg-blue-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-[#5B6675] hover:text-[#0F1B2D]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => {
                setActiveViewMode('formateur');
                handleSelectTab('course_hub');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'formateur'
                  ? isLight
                    ? 'bg-white text-[#0F1B2D] shadow-[0_1px_2px_rgba(15,27,45,0.12)] font-semibold'
                    : 'bg-blue-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-[#5B6675] hover:text-[#0F1B2D]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Formateur
            </button>
            <button
              onClick={() => {
                setActiveViewMode('eleve');
                handleSelectTab('course_hub');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'eleve'
                  ? isLight
                    ? 'bg-white text-[#0F1B2D] shadow-[0_1px_2px_rgba(15,27,45,0.12)] font-semibold'
                    : 'bg-blue-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-[#5B6675] hover:text-[#0F1B2D]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Élève
            </button>
          </div>

          {/* WebFFT Status Pill */}
          <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 border rounded-md font-mono text-[11px] font-medium ${
            isLight ? 'border-[#E3E1DA] text-[#5B6675]' : 'border-slate-800 text-slate-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4F]" />
            <span>WebFFT v2.0</span>
          </div>

          {/* Mode Theme Icon Button */}
          <button
            onClick={cycleTheme}
            title="Mode clair / sombre"
            className={`w-[34px] h-[34px] rounded-md flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'text-[#5B6675] hover:bg-[#F3F2EE] hover:text-[#0F1B2D]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Fullscreen Icon Button */}
          <button
            onClick={toggleNativeFullscreen}
            title="Plein écran (F11)"
            className={`w-[34px] h-[34px] rounded-md flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'text-[#5B6675] hover:bg-[#F3F2EE] hover:text-[#0F1B2D]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {isNativeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* User Profile & Logout */}
          <div className={`flex items-center gap-2.5 pl-3 border-l ${
            isLight ? 'border-[#E3E1DA]' : 'border-slate-800'
          }`}>
            <div className="w-8 h-8 rounded-full bg-[#1F4E8C] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {(currentUser?.fullName || currentUser?.username || 'AO').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className={`text-[13px] font-semibold ${isLight ? 'text-[#0F1B2D]' : 'text-white'}`}>
                {currentUser?.fullName || currentUser?.username}
              </span>
              <span className={`text-[11px] ${isLight ? 'text-[#5B6675]' : 'text-slate-400'}`}>
                {currentUser?.role === 'admin' ? 'Administrateur' : (currentUser?.role === 'formateur' ? 'Formateur' : 'Élève')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#5B6675] hover:text-[#B42318] hover:bg-[#FEE4E2] cursor-pointer transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar (248px) */}
        <aside className={`w-[248px] flex-none border-r p-4.5 space-y-5 block overflow-y-auto transition-colors ${
          isCourseFullScreen && activeTab === 'course_hub' ? 'hidden' : 'block'
        } ${
          isLight ? 'bg-white border-[#E3E1DA]' : 'bg-[#0D1526] border-slate-800/80'
        }`}>
          <div className="space-y-4">
            {['Espace Pédagogique', 'Fondamentaux', 'Défauts Machines', 'Expertise & Diagnostic'].map((cat) => (
              <div key={cat} className="space-y-1">
                <div className={`font-mono text-[10.5px] font-semibold tracking-wider px-2.5 py-1 uppercase ${
                  isLight ? 'text-[#8A929C]' : 'text-slate-400'
                }`}>
                  {cat}
                </div>
                <div className="space-y-0.5">
                  {tabs
                    .filter((t) => t.category === cat)
                    .map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleSelectTab(tab.id as TabType)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-all text-left cursor-pointer ${
                            isActive
                              ? isLight
                                ? 'bg-[#0F1B2D] text-white shadow-2xs font-medium'
                                : 'bg-blue-600 text-white shadow-md font-medium'
                              : isLight
                              ? 'text-[#3A4552] hover:bg-[#F3F2EE]'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive
                              ? isLight ? 'bg-[#E8A317]' : 'bg-white'
                              : isLight ? 'bg-[#C9C6BD]' : 'bg-slate-600'
                          }`} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className={`flex-1 min-w-0 p-8 overflow-y-auto transition-colors ${
          isLight ? 'bg-[#F6F5F1] text-[#1C2733]' : 'bg-[#080D1A] text-slate-100'
        }`}>
          {activeTab === 'course_hub' && (
            <VibrationCourseModule 
              theme={theme} 
              isFullScreenMode={isCourseFullScreen}
              onToggleFullScreenMode={() => setIsCourseFullScreen((prev) => !prev)}
              onOpenSimulatorTab={(tabId) => handleSelectTab(tabId as TabType)}
            />
          )}
          {activeTab === 'intro_3d' && <VibrationIntroAsset3D theme={theme} />}
          {activeTab === 'relations' && <WaveformPhaseSimulator theme={theme} />}
          {activeTab === 'generator' && <SignalGenerator theme={theme} />}
          {activeTab === 'converter' && <UnitConverter theme={theme} />}
          {activeTab === 'bearings' && <BearingModule theme={theme} />}
          {activeTab === 'gears' && <GearModule theme={theme} />}
          {activeTab === 'motors' && <MotorModule theme={theme} />}
          {activeTab === 'turbines' && <PumpFanModule theme={theme} />}
          {activeTab === 'balancing' && <UnbalanceModule theme={theme} />}
          {activeTab === 'structure' && <LoosenessMisalignmentResonance theme={theme} />}
          {activeTab === 'belts' && <BeltPulleyModule theme={theme} />}
          {activeTab === 'phase_analysis' && <PhaseAnalysisModule theme={theme} />}
          {activeTab === 'mystery_challenge' && <MysteryChallengeModule theme={theme} />}
          {activeTab === 'bearing_calc' && <BearingCalcModule theme={theme} />}
          {activeTab === 'iso_severity' && <IsoSeverityModule theme={theme} />}
          {activeTab === 'expert_report' && <ExpertReportModule theme={theme} />}
          {activeTab === 'signature_glossary' && <SignatureGlossary theme={theme} />}
          {activeTab === 'sessions_attendance' && (
            isTrainerOrAdmin ? (
              <SessionAttendanceManager 
                theme={theme} 
                currentUser={currentUser}
                userRole={viewMode}
                onNavigateToCourse={() => handleSelectTab('course_hub')} 
              />
            ) : (
              <div className="p-10 text-center bg-white rounded-xl border border-[#E3E1DA] max-w-lg mx-auto mt-12 shadow-xs">
                <ShieldAlert className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#0F1B2D]">Accès Réservé</h3>
                <p className="text-xs text-[#5B6675] mt-1.5 leading-relaxed">
                  L'accès à l'émargement et aux feuilles de présence officielles Modèle 5 est strictement restreint au Formateur (M. Mohammed KARMOUD) et à l'Administrateur (M. Amine SALAMAT).
                </p>
                <button
                  onClick={() => handleSelectTab('course_hub')}
                  className="mt-4 px-4 py-2 bg-[#1F4E8C] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Retour au parcours certifiant
                </button>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
